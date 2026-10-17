// ===== 아크 타워 디펜스 =====
// 그리드 기반 타워 디펜스 게임 (Canvas)
(function () {
  'use strict';

  const GRID = 32;              // 한 셀 크기(px)
  const COLS = 20, ROWS = 20;   // 그리드 크기
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // ---- 타워 타입 정의 ----
  const TOWER_TYPES = {
    arrow: {
      name: '활 타워', icon: '🏹', color: '#3fb950',
      cost: 50, range: 3.0, damage: 8, fireRate: 0.6, projSpeed: 8, projColor: '#9ee88a',
      desc: '빠른 단일 공격'
    },
    cannon: {
      name: '대포', icon: '💥', color: '#d29922',
      cost: 90, range: 2.6, damage: 26, fireRate: 1.4, projSpeed: 6, projColor: '#f0c674', splash: 0.7,
      desc: '범위 폭발damage'
    },
    frost: {
      name: '냉기 타워', icon: '❄️', color: '#58a6ff',
      cost: 70, range: 2.8, damage: 5, fireRate: 0.9, projSpeed: 7, projColor: '#a5d6ff', slow: 0.5, slowDur: 1.5,
      desc: '적 감속 효과'
    },
    sniper: {
      name: '저격 타워', icon: '🎯', color: '#bc8cff',
      cost: 110, range: 5.2, damage: 45, fireRate: 2.0, projSpeed: 14, projColor: '#e0bbff',
      desc: '넓은 사거리 고데미기'
    }
  };

  // ---- 적 타입 정의 ----
  const ENEMY_TYPES = {
    goblin:  { hp: 40,  speed: 1.1, reward: 8,  color: '#e8644f', size: 8, name: '고블린' },
    orc:     { hp: 120, speed: 0.8, reward: 14, color: '#8b9a46', size: 10, name: '오크' },
    wolf:    { hp: 60,  speed: 1.9, reward: 12, color: '#a0a0a0', size: 8, name: '늑대' },
    brute:   { hp: 380, speed: 0.55, reward: 35, color: '#7a2f2f', size: 13, name: '거인' },
    wraith:  { hp: 160, speed: 1.4, reward: 22, color: '#9d4dbd', size: 9, name: '유령' }
  };

  // 경로 정의 (그리드 좌표) - 시작에서 끝까지
  const PATH_POINTS = [
    {x:0,y:3},{x:5,y:3},{x:5,y:9},{x:2,y:9},{x:2,y:15},{x:8,y:15},{x:8,y:6},{x:13,y:6},
    {x:13,y:17},{x:17,y:17},{x:17,y:10},{x:10,y:10},{x:10,y:13},{x:19,y:13}
  ];

  // 경로를 그리드 셀 집합으로 변환 (통과 불가 영역)
  const pathCells = new Set();
  function buildPathCells() {
    pathCells.clear();
    for (let i = 0; i < PATH_POINTS.length - 1; i++) {
      let a = PATH_POINTS[i], b = PATH_POINTS[i + 1];
      let cx = a.x, cy = a.y;
      while (cx !== b.x || cy !== b.y) {
        pathCells.add(cx + ',' + cy);
        if (cx !== b.x) cx += Math.sign(b.x - cx);
        else cy += Math.sign(b.y - cy);
      }
      pathCells.add(b.x + ',' + b.y);
    }
  }
  buildPathCells();

  // 경로의 중심 좌표 (그림용, px)
  const pathWaypoints = PATH_POINTS.map(p => ({ x: p.x * GRID + GRID / 2, y: p.y * GRID + GRID / 2 }));

  // ---- 게임 상태 ----
  let state;
  function resetState() {
    state = {
      lives: 20, gold: 150, score: 0, wave: 0,
      towers: [], enemies: [], projectiles: [], particles: [],
      selectedType: null, selectedTower: null,
      waveActive: false, spawnQueue: [], spawnTimer: 0,
      speed: 1, gameOver: false, won: false,
      hoverCell: null
    };
  }
  resetState();

  // ---- UI 요소 ----
  const ui = {
    lives: document.getElementById('lives'),
    gold: document.getElementById('gold'),
    wave: document.getElementById('wave'),
    score: document.getElementById('score'),
    startBtn: document.getElementById('startBtn'),
    speedBtn: document.getElementById('speedBtn'),
    towerMenu: document.getElementById('towerMenu'),
    overlay: document.getElementById('overlay'),
    overlayTitle: document.getElementById('overlayTitle'),
    overlayText: document.getElementById('overlayText'),
    restartBtn: document.getElementById('restartBtn')
  };

  function buildTowerMenu() {
    ui.towerMenu.innerHTML = '';
    for (const key in TOWER_TYPES) {
      const t = TOWER_TYPES[key];
      const btn = document.createElement('div');
      btn.className = 'tower-btn';
      btn.dataset.type = key;
      btn.innerHTML = `<div class="tower-icon" style="background:${t.color}">${t.icon}</div>
        <div class="tower-info"><b>${t.name}</b><small>${t.cost} 골드 | ${t.desc}</small></div>`;
      btn.addEventListener('click', () => selectType(key));
      ui.towerMenu.appendChild(btn);
    }
  }

  function selectType(key) {
    if (state.selectedType === key) { state.selectedType = null; }
    else { state.selectedType = key; state.selectedTower = null; }
    updateMenuSelection();
  }

  function updateMenuSelection() {
    const btns = ui.towerMenu.children;
    for (let b of btns) {
      const key = b.dataset.type;
      const affordable = state.gold >= TOWER_TYPES[key].cost;
      b.classList.toggle('selected', state.selectedType === key);
      b.classList.toggle('disabled', !affordable);
    }
  }

  function updateHUD() {
    ui.lives.textContent = state.lives;
    ui.gold.textContent = state.gold;
    ui.wave.textContent = state.wave + ' / ' + MAX_WAVES;
    ui.score.textContent = state.score;
    ui.startBtn.disabled = state.waveActive || state.gameOver;
    ui.startBtn.textContent = state.waveActive ? '웨이브 진행중...' : '웨이브 시작';
    updateMenuSelection();
  }

  // ---- 웨브 생성 ----
  const MAX_WAVES = 20;
  function makeWave(n) {
    // 웨브 난이도 스케일링
    const q = [];
    const pool = ['goblin', 'wolf', 'orc'];
    if (n >= 3) pool.push('wraith');
    if (n >= 6) pool.push('brute');
    const count = 6 + Math.floor(n * 1.6);
    for (let i = 0; i < count; i++) {
      const type = pool[Math.floor(Math.random() * pool.length)];
      q.push(type);
    }
    // 보스 웨브 (5의 배수)
    if (n % 5 === 0) {
      for (let i = 0; i < 3 + n / 5; i++) q.push('brute');
    }
    return q;
  }

  function startWave() {
    if (state.waveActive || state.gameOver) return;
    state.wave++;
    state.spawnQueue = makeWave(state.wave);
    state.spawnTimer = 0;
    state.waveActive = true;
    updateHUD();
  }

  // ---- 적 ----
  function spawnEnemy(type) {
    const def = ENEMY_TYPES[type];
    state.enemies.push({
      type, x: pathWaypoints[0].x, y: pathWaypoints[0].y,
      wpIndex: 1, hp: def.hp, maxHp: def.hp, speed: def.speed,
      slowTimer: 0, slowFactor: 1, alive: true, reachedEnd: false
    });
  }

  function updateEnemies(dt) {
    for (const e of state.enemies) {
      if (!e.alive) continue;
      // 감속 처리
      let spd = e.speed;
      if (e.slowTimer > 0) { e.slowTimer -= dt; spd *= e.slowFactor; }
      const target = pathWaypoints[e.wpIndex];
      const dx = target.x - e.x, dy = target.y - e.y;
      const dist = Math.hypot(dx, dy);
      const move = spd * 60 * dt;
      if (dist <= move) {
        e.x = target.x; e.y = target.y;
        e.wpIndex++;
        if (e.wpIndex >= pathWaypoints.length) {
          e.alive = false; e.reachedEnd = true;
          state.lives--;
          if (state.lives <= 0) endGame(false);
        }
      } else {
        e.x += (dx / dist) * move;
        e.y += (dy / dist) * move;
      }
    }
    state.enemies = state.enemies.filter(e => e.alive);
  }

  // ---- 타워 ----
  function buildTower(type, gx, gy) {
    const t = TOWER_TYPES[type];
    if (state.gold < t.cost) return false;
    if (pathCells.has(gx + ',' + gy)) return false;
    if (state.towers.some(tw => tw.gx === gx && tw.gy === gy)) return false;
    state.gold -= t.cost;
    state.towers.push({
      type, gx, gy,
      x: gx * GRID + GRID / 2, y: gy * GRID + GRID / 2,
      level: 1, cooldown: 0, angle: 0, totalInvested: t.cost
    });
    return true;
  }

  function upgradeCost(tower) {
    const base = TOWER_TYPES[tower.type].cost;
    return Math.floor(base * 0.8 * tower.level);
  }

  function upgradeTower(tower) {
    const cost = upgradeCost(tower);
    if (state.gold < cost || tower.level >= 4) return;
    state.gold -= cost;
    tower.level++;
    tower.totalInvested += cost;
  }

  function sellTower(tower) {
    const refund = Math.floor(tower.totalInvested * 0.6);
    state.gold += refund;
    state.towers = state.towers.filter(t => t !== tower);
    state.selectedTower = null;
  }

  function updateTowers(dt) {
    for (const tw of state.towers) {
      const def = TOWER_TYPES[tw.type];
      tw.cooldown -= dt;
      const rangePx = def.range * GRID;
      // 사거리 내 가장 앞적(경로 진행거리 최대) 타겟
      let target = null, bestProgress = -1;
      for (const e of state.enemies) {
        if (!e.alive) continue;
        const d = Math.hypot(e.x - tw.x, e.y - tw.y);
        if (d <= rangePx) {
          const progress = e.wpIndex + 1 - (Math.hypot(
            pathWaypoints[Math.min(e.wpIndex, pathWaypoints.length-1)].x - e.x,
            pathWaypoints[Math.min(e.wpIndex, pathWaypoints.length-1)].y - e.y
          ) / GRID);
          if (progress > bestProgress) { bestProgress = progress; target = e; }
        }
      }
      if (target) {
        tw.angle = Math.atan2(target.y - tw.y, target.x - tw.x);
        if (tw.cooldown <= 0) {
          tw.cooldown = def.fireRate;
          fireProjectile(tw, target);
        }
      }
    }
  }

  // ---- 발사체 ----
  function fireProjectile(tw, target) {
    const def = TOWER_TYPES[tw.type];
    const dmg = def.damage * (1 + (tw.level - 1) * 0.5);
    state.projectiles.push({
      x: tw.x, y: tw.y, target, speed: def.projSpeed,
      damage: dmg, color: def.projColor, splash: def.splash || 0,
      slow: def.slow || 0, slowDur: def.slowDur || 0, alive: true
    });
  }

  function updateProjectiles(dt) {
    for (const p of state.projectiles) {
      if (!p.alive) continue;
      let t = p.target;
      if (!t || !t.alive) { p.alive = false; continue; }
      const dx = t.x - p.x, dy = t.y - p.y;
      const dist = Math.hypot(dx, dy);
      const move = p.speed * 60 * dt;
      if (dist <= move) {
        // 명중
        if (p.splash > 0) {
          const R = p.splash * GRID;
          for (const e of state.enemies) {
            if (!e.alive) continue;
            if (Math.hypot(e.x - t.x, e.y - t.y) <= R) {
              damageEnemy(e, p.damage * 0.6);
            }
          }
          damageEnemy(t, p.damage);
          spawnExplosion(t.x, t.y, p.color);
        } else {
          damageEnemy(t, p.damage);
          if (p.slow > 0) {
            t.slowTimer = Math.max(t.slowTimer, p.slowDur);
            t.slowFactor = p.slow;
          }
          spawnHit(t.x, t.y, p.color);
        }
        p.alive = false;
      } else {
        p.x += (dx / dist) * move;
        p.y += (dy / dist) * move;
      }
    }
    state.projectiles = state.projectiles.filter(p => p.alive);
  }

  function damageEnemy(e, dmg) {
    e.hp -= dmg;
    if (e.hp <= 0 && e.alive) {
      e.alive = false;
      const def = ENEMY_TYPES[e.type];
      state.gold += def.reward;
      state.score += def.reward * 2;
      spawnDeath(e.x, e.y, def.color);
    }
  }

  // ---- 파티클 ----
  function spawnHit(x, y, color) {
    for (let i = 0; i < 5; i++) {
      state.particles.push({ x, y, vx: (Math.random()-0.5)*80, vy: (Math.random()-0.5)*80,
        life: 0.3, maxLife: 0.3, color });
    }
  }
  function spawnExplosion(x, y, color) {
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2, s = 60 + Math.random() * 100;
      state.particles.push({ x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s, life: 0.5, maxLife: 0.5, color });
    }
  }
  function spawnDeath(x, y, color) {
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2, s = 50 + Math.random() * 140;
      state.particles.push({ x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s, life: 0.6, maxLife: 0.6, color });
    }
  }
  function updateParticles(dt) {
    for (const p of state.particles) {
      p.life -= dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= 0.92; p.vy *= 0.92;
    }
    state.particles = state.particles.filter(p => p.life > 0);
  }

  // ---- 스폰 처리 ----
  function updateSpawn(dt) {
    if (!state.waveActive) return;
    if (state.spawnQueue.length > 0) {
      state.spawnTimer -= dt;
      if (state.spawnTimer <= 0) {
        spawnEnemy(state.spawnQueue.shift());
        state.spawnTimer = 0.55;
      }
    } else if (state.enemies.length === 0) {
      // 웨브 완료
      state.waveActive = false;
      state.gold += 30 + state.wave * 3;
      state.score += state.wave * 5;
      if (state.wave >= MAX_WAVES) { endGame(true); }
      updateHUD();
    }
  }

  // ---- 게임 종료 ----
  function endGame(won) {
    state.gameOver = true; state.won = won;
    ui.overlayTitle.textContent = won ? '🏆 승리!' : '💀 게임 오버';
    ui.overlayTitle.style.color = won ? '#3fb950' : '#ff7b72';
    ui.overlayText.textContent = `최종 웨브 ${state.wave} | 점수 ${state.score}`;
    ui.overlay.style.display = 'flex';
  }

  // ---- 렌더링 ----
  function drawGrid() {
    for (let gx = 0; gx < COLS; gx++) {
      for (let gy = 0; gy < ROWS; gy++) {
        const x = gx * GRID, y = gy * GRID;
        if (pathCells.has(gx + ',' + gy)) {
          ctx.fillStyle = '#3a3010';
          ctx.fillRect(x, y, GRID, GRID);
        } else {
          ctx.fillStyle = ((gx + gy) % 2 === 0) ? '#1a2030' : '#171c28';
          ctx.fillRect(x, y, GRID, GRID);
        }
      }
    }
    // 경로 점선 중앙선
    ctx.strokeStyle = 'rgba(210,153,34,0.25)';
    ctx.lineWidth = 4; ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(pathWaypoints[0].x, pathWaypoints[0].y);
    for (let i = 1; i < pathWaypoints.length; i++) ctx.lineTo(pathWaypoints[i].x, pathWaypoints[i].y);
    ctx.stroke(); ctx.setLineDash([]);

    // 시작 / 끝 표시
    const s = pathWaypoints[0], e = pathWaypoints[pathWaypoints.length - 1];
    ctx.fillStyle = '#3fb950'; ctx.font = 'bold 16px sans-serif';
    ctx.fillText('▶', s.x - 6, s.y + 6);
    ctx.fillStyle = '#ff7b72';
    ctx.fillText('🏁', e.x - 10, e.y + 6);
  }

  function drawTowers() {
    for (const tw of state.towers) {
      const def = TOWER_TYPES[tw.type];
      // 사거리 (선택 시)
      if (state.selectedTower === tw) {
        ctx.beginPath();
        ctx.arc(tw.x, tw.y, def.range * GRID, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(88,166,255,0.1)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(88,166,255,0.5)';
        ctx.lineWidth = 1; ctx.stroke();
      }
      // 베이스
      ctx.fillStyle = '#21262d';
      ctx.beginPath(); ctx.arc(tw.x, tw.y, GRID/2 - 3, 0, Math.PI*2); ctx.fill();
      // 타워 본체
      ctx.save();
      ctx.translate(tw.x, tw.y);
      ctx.fillStyle = def.color;
      ctx.beginPath(); ctx.arc(0, 0, GRID/2 - 6 + tw.level, 0, Math.PI*2); ctx.fill();
      // 방향 표시
      ctx.rotate(tw.angle);
      ctx.fillStyle = '#0d1117';
      ctx.fillRect(0, -2, GRID/2 - 2 + tw.level, 4);
      ctx.restore();
      // 아이콘
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(def.icon, tw.x, tw.y);
      // 레벨 표시
      if (tw.level > 1) {
        ctx.fillStyle = '#ffd700'; ctx.font = 'bold 10px sans-serif';
        ctx.fillText('★'.repeat(tw.level - 1), tw.x, tw.y - GRID/2 + 1);
      }
    }
  }

  function drawEnemies() {
    for (const e of state.enemies) {
      const def = ENEMY_TYPES[e.type];
      ctx.save();
      if (e.slowTimer > 0) {
        ctx.beginPath(); ctx.arc(e.x, e.y, def.size + 4, 0, Math.PI*2);
        ctx.strokeStyle = 'rgba(165,214,255,0.7)'; ctx.lineWidth = 2; ctx.stroke();
      }
      ctx.fillStyle = def.color;
      ctx.beginPath(); ctx.arc(e.x, e.y, def.size, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1; ctx.stroke();
      // 체력바
      const w = def.size * 2, hpPct = e.hp / e.maxHp;
      ctx.fillStyle = '#000'; ctx.fillRect(e.x - w/2, e.y - def.size - 8, w, 4);
      ctx.fillStyle = hpPct > 0.5 ? '#3fb950' : hpPct > 0.25 ? '#d29922' : '#ff7b72';
      ctx.fillRect(e.x - w/2, e.y - def.size - 8, w * hpPct, 4);
      ctx.restore();
    }
  }

  function drawProjectiles() {
    for (const p of state.projectiles) {
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2); ctx.fill();
    }
  }

  function drawParticles() {
    for (const p of state.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    ctx.globalAlpha = 1;
  }

  function drawHover() {
    if (!state.hoverCell || !state.selectedType) return;
    const {gx, gy} = state.hoverCell;
    const x = gx * GRID, y = gy * GRID;
    const def = TOWER_TYPES[state.selectedType];
    const ok = !pathCells.has(gx + ',' + gy) && !state.towers.some(t=>t.gx===gx&&t.gy===gy) && state.gold >= def.cost;
    ctx.beginPath();
    ctx.arc(x + GRID/2, y + GRID/2, def.range * GRID, 0, Math.PI*2);
    ctx.fillStyle = ok ? 'rgba(63,185,80,0.08)' : 'rgba(255,123,114,0.08)';
    ctx.fill();
    ctx.strokeStyle = ok ? 'rgba(63,185,80,0.6)' : 'rgba(255,123,114,0.6)';
    ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = ok ? 'rgba(63,185,80,0.35)' : 'rgba(255,123,114,0.35)';
    ctx.fillRect(x, y, GRID, GRID);
  }

  function drawSelectedInfo() {
    if (!state.selectedTower) return;
    const tw = state.selectedTower, def = TOWER_TYPES[tw.type];
    const cost = upgradeCost(tw);
    const maxed = tw.level >= 4;
    ctx.fillStyle = 'rgba(13,17,23,0.85)';
    ctx.fillRect(8, 8, 190, maxed ? 56 : 68);
    ctx.fillStyle = def.color; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(`${def.icon} ${def.name} Lv.${tw.level}`, 16, 26);
    ctx.fillStyle = '#b0bac9'; ctx.font = '11px sans-serif';
    ctx.fillText(`피해 ${def.damage*(1+(tw.level-1)*0.5).toFixed(1)} | 사거리 ${def.range}`, 16, 42);
    if (maxed) {
      ctx.fillStyle = '#3fb950'; ctx.fillText('★ 최대 레벨', 16, 58);
    } else {
      ctx.fillStyle = state.gold >= cost ? '#d29922' : '#ff7b72';
      ctx.fillText(`업그레이드: ${cost} 골드 [클릭]`, 16, 58);
      ctx.fillStyle = '#ff7b72';
      ctx.fillText(`판매: ${Math.floor(tw.totalInvested*0.6)} 골드 [Shift+클릭]`, 16, 72);
    }
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawHover();
    drawTowers();
    drawEnemies();
    drawProjectiles();
    drawParticles();
    drawSelectedInfo();
  }

  // ---- 메인 루프 ----
  let lastTime = performance.now();
  function loop(now) {
    let dt = (now - lastTime) / 1000;
    lastTime = now;
    if (dt > 0.05) dt = 0.05; // 프레임 스킵 방지
    const sdt = dt * state.speed;
    if (!state.gameOver) {
      updateSpawn(sdt);
      updateEnemies(sdt);
      updateTowers(sdt);
      updateProjectiles(sdt);
      updateParticles(sdt);
      updateHUD();
    }
    render();
    requestAnimationFrame(loop);
  }

  // ---- 입력 처리 ----
  function canvasPos(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (canvas.width / r.width),
      y: (e.clientY - r.top) * (canvas.height / r.height)
    };
  }

  function handleTap(clientX, clientY) {
    const p = { clientX, clientY };
    const gp = canvasPos(p);
    const gx = Math.floor(gp.x / GRID), gy = Math.floor(gp.y / GRID);
    if (gx < 0 || gx >= COLS || gy < 0 || gy >= ROWS) return;

    // 있는 타워 클릭 → 선택
    const existing = state.towers.find(t => t.gx === gx && t.gy === gy);
    if (existing) {
      state.selectedTower = (state.selectedTower === existing) ? null : existing;
      state.selectedType = null;
      updateMenuSelection();
      return;
    }

    // 새타워 건설
    if (state.selectedType) {
      const ok = buildTower(state.selectedType, gx, gy);
      if (ok) updateHUD();
      return;
    }
    state.selectedTower = null;
  }

  function handleSell(clientX, clientY) {
    const p = { clientX, clientY };
    const gp = canvasPos(p);
    const gx = Math.floor(gp.x / GRID), gy = Math.floor(gp.y / GRID);
    const tw = state.towers.find(t => t.gx === gx && t.gy === gy);
    if (tw) { sellTower(tw); updateHUD(); }
  }

  canvas.addEventListener('mousemove', (e) => {
    const p = canvasPos(e);
    state.hoverCell = { gx: Math.floor(p.x / GRID), gy: Math.floor(p.y / GRID) };
  });
  canvas.addEventListener('mouseleave', () => { state.hoverCell = null; });

  canvas.addEventListener('click', (e) => {
    handleTap(e.clientX, e.clientY);
  });

  // 터치: 탭으로 건설/선택, 길게 누르기로 판매
  let touchTimer = null, touchMoved = false;
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchMoved = false;
    const t = e.touches[0];
    let startX = t.clientX, startY = t.clientY;
    touchTimer = setTimeout(() => {
      handleSell(startX, startY);
      touchTimer = null;
    }, 400);
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    touchMoved = true;
    if (touchTimer) { clearTimeout(touchTimer); touchTimer = null; }
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (touchTimer) {
      clearTimeout(touchTimer); touchTimer = null;
      if (!touchMoved && e.changedTouches.length) {
        const t = e.changedTouches[0];
        handleTap(t.clientX, t.clientY);
      }
    }
    touchMoved = false;
  }, { passive: false });

  // 우클릭으로타워 판매
  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    handleSell(e.clientX, e.clientY);
  });
  // 키보드: 1-4 타워 선택, Space 웨브 시작, Esc 취소
  document.addEventListener('keydown', (e) => {
    if (e.key >= '1' && e.key <= '4') {
      const keys = Object.keys(TOWER_TYPES);
      const idx = parseInt(e.key) - 1;
      if (keys[idx]) selectType(keys[idx]);
    } else if (e.key === ' ') {
      e.preventDefault(); startWave();
    } else if (e.key === 'Escape') {
      state.selectedType = null; state.selectedTower = null; updateMenuSelection();
    } else if (e.key === 'Delete' || e.key === 'x') {
      if (state.selectedTower) { sellTower(state.selectedTower); updateHUD(); }
    }
  });

  ui.startBtn.addEventListener('click', startWave);
  ui.speedBtn.addEventListener('click', () => {
    state.speed = state.speed === 1 ? 2 : state.speed === 2 ? 4 : 1;
    ui.speedBtn.textContent = '속도: ' + state.speed + 'x';
  });
  ui.restartBtn.addEventListener('click', () => {
    ui.overlay.style.display = 'none';
    resetState();
    buildTowerMenu();
    updateHUD();
  });

  // ---- 초기화 ----
  buildTowerMenu();
  updateHUD();
  requestAnimationFrame(loop);
})();
