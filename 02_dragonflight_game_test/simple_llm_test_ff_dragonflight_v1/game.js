"use strict";

(function () {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  // ---- DOM refs ----
  const hudEl = document.getElementById("hud");
  const startScreen = document.getElementById("start-screen");
  const overScreen = document.getElementById("gameover-screen");
  const startBtn = document.getElementById("start-btn");
  const restartBtn = document.getElementById("restart-btn");
  const el = {
    score: document.getElementById("hud-score"),
    dist: document.getElementById("hud-dist"),
    coin: document.getElementById("hud-coin"),
    kill: document.getElementById("hud-kill"),
    power: document.getElementById("hud-power"),
    fscore: document.getElementById("final-score"),
    fdist: document.getElementById("final-dist"),
    fkill: document.getElementById("final-kill"),
    fcoin: document.getElementById("final-coin"),
  };

  // ---- Utility ----
  const rand = (a, b) => a + Math.random() * (b - a);
  const randInt = (a, b) => Math.floor(rand(a, b + 1));
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

  // ---- Game state ----
  let state = "start"; // start | playing | over
  let keys = { left: false, right: false };
  let pointerX = null;
  let lastTime = 0;

  let player, enemies, bullets, coins, items, meteors, warnings, particles, clouds, stars;
  let score, distance, coinsCount, kills, spawnTimer, difficulty, fireTimer, shake;

  function reset() {
    player = {
      x: W / 2, y: H - 90, w: 46, h: 40, speed: 340,
      powerLevel: 1, magnetTime: 0, shieldTime: 0, invulnTime: 0,
    };
    enemies = []; bullets = []; coins = []; items = []; meteors = []; warnings = []; particles = [];
    clouds = []; stars = [];
    for (let i = 0; i < 40; i++) stars.push({ x: rand(0, W), y: rand(0, H), s: rand(0.5, 1.8), v: rand(20, 60) });
    for (let i = 0; i < 6; i++) clouds.push(makeCloud(rand(0, H)));
    score = 0; distance = 0; coinsCount = 0; kills = 0;
    spawnTimer = 1.2; fireTimer = 0; difficulty = 1; shake = 0;
  }

  function makeCloud(y) {
    return { x: rand(-40, W), y: y !== undefined ? y : -60, w: rand(70, 150), h: rand(24, 44), v: rand(20, 45), a: rand(0.08, 0.2) };
  }

  // ---- Difficulty scaling ----
  function level() { return Math.floor(distance / 400); }

  // ---- Spawning waves ----
  function spawnWave() {
    const lvl = level();
    const isBoss = distance > 0 && (distance % 1500 < 60) && !enemies.some(e => e.boss);
    if (isBoss) { spawnBoss(lvl); return; }

    const cols = clamp(3 + Math.floor(lvl / 2), 3, 6);
    const hpBase = 1 + Math.floor(lvl * 0.7);
    const gap = W / (cols + 1);
    const waveType = randInt(0, 2);
    for (let i = 0; i < cols; i++) {
      const x = gap * (i + 1) + rand(-14, 14);
      let yOff = 0;
      if (waveType === 1) yOff = Math.abs(i - (cols - 1) / 2) * 34; // V shape
      else if (waveType === 2) yOff = (i % 2) * 40; // zigzag
      const hp = hpBase + randInt(0, 2);
      enemies.push({
        x, y: -40 - yOff, w: 38, h: 34, hp, maxHp: hp,
        v: (70 + lvl * 12) * rand(0.9, 1.15), boss: false,
        hue: randInt(0, 360), sway: rand(0, Math.PI * 2), swayAmp: rand(8, 26),
      });
    }
  }

  function spawnBoss(lvl) {
    const hp = 40 + lvl * 22;
    enemies.push({
      x: W / 2, y: -90, w: 120, h: 84, hp, maxHp: hp,
      v: 46 + lvl * 5, boss: true, hue: 8, sway: 0, swayAmp: 70, fireT: rand(1.2, 2),
    });
  }

  function spawnMeteorWarning() {
    // pick a lane to warn; meteor falls there after delay
    const x = rand(50, W - 50);
    warnings.push({ x, y: 70, life: 1.6, t: 0 });
  }

  function spawnMeteor(x) {
    meteors.push({ x, y: -30, r: rand(18, 28), v: rand(220, 300) + level() * 15, spin: rand(0, Math.PI * 2) });
  }

  // ---- Firing ----
  function fire() {
    const pl = player.powerLevel;
    const bx = player.x, by = player.y - 22;
    const speed = 520;
    if (pl === 1) {
      bullets.push({ x: bx, y: by, vx: 0, vy: -speed, r: 4, dmg: 1 });
    } else if (pl === 2) {
      bullets.push({ x: bx - 9, y: by, vx: -40, vy: -speed, r: 4, dmg: 1 });
      bullets.push({ x: bx + 9, y: by, vx: 40, vy: -speed, r: 4, dmg: 1 });
    } else {
      bullets.push({ x: bx, y: by, vx: 0, vy: -speed, r: 5, dmg: 2 });
      bullets.push({ x: bx - 14, y: by + 4, vx: -90, vy: -speed, r: 4, dmg: 1 });
      bullets.push({ x: bx + 14, y: by + 4, vx: 90, vy: -speed, r: 4, dmg: 1 });
    }
  }

  // ---- Drops ----
  function dropLoot(x, y, boss) {
    const n = boss ? randInt(8, 12) : randInt(1, 3);
    for (let i = 0; i < n; i++) {
      coins.push({ x: x + rand(-16, 16), y: y + rand(-8, 8), vx: rand(-40, 40), vy: rand(-60, -20), r: 7, life: 5 });
    }
    if (boss || Math.random() < 0.12) {
      const types = ["power", "magnet", "shield"];
      const t = types[randInt(0, 2)];
      items.push({ x, y, vy: 70, r: 15, type: t, life: 9 });
    }
  }

  function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      particles.push({ x, y, vx: rand(-120, 120), vy: rand(-120, 120), life: rand(0.3, 0.7), color });
    }
  }

  // ---- Update ----
  function update(dt) {
    distance += (player.speed * 0 + 120 + level() * 14) * dt; // scroll speed grows with level
    const scroll = 120 + level() * 14;

    // player movement
    if (pointerX !== null) {
      const target = clamp(pointerX, player.w / 2, W - player.w / 2);
      player.x += clamp(target - player.x, -player.speed * dt * 2.2, player.speed * dt * 2.2);
    } else {
      if (keys.left) player.x -= player.speed * dt;
      if (keys.right) player.x += player.speed * dt;
    }
    player.x = clamp(player.x, player.w / 2, W - player.w / 2);

    if (player.magnetTime > 0) player.magnetTime -= dt;
    if (player.shieldTime > 0) player.shieldTime -= dt;
    if (player.invulnTime > 0) player.invulnTime -= dt;
    if (shake > 0) shake -= dt;

    // auto fire
    fireTimer -= dt;
    const fireRate = player.powerLevel >= 3 ? 0.14 : 0.2;
    if (fireTimer <= 0) { fire(); fireTimer = fireRate; }

    // spawn waves
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnWave();
      spawnTimer = clamp(1.7 - level() * 0.12, 0.7, 1.7);
    }

    // meteor warnings -> meteors
    for (let i = warnings.length - 1; i >= 0; i--) {
      const w = warnings[i];
      w.t += dt;
      if (w.t >= w.life) { spawnMeteor(w.x); warnings.splice(i, 1); }
    }
    // occasionally schedule a meteor wave
    if (Math.random() < dt * (0.25 + level() * 0.03)) spawnMeteorWarning();

    // bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.y < -20 || b.x < -20 || b.x > W + 20) bullets.splice(i, 1);
    }

    // enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.sway += dt * 2;
      e.y += e.v * dt;
      if (e.boss) {
        e.x = W / 2 + Math.sin(e.sway * 0.6) * e.swayAmp;
        e.fireT -= dt;
        if (e.fireT <= 0 && e.y > 40 && e.y < H - 200) {
          const ang = Math.atan2(player.y - e.y, player.x - e.x);
          bullets.push({ x: e.x, y: e.y + 30, vx: Math.cos(ang) * 200, vy: Math.sin(ang) * 200, r: 6, dmg: 1, enemy: true });
          e.fireT = rand(1.0, 1.8);
        }
      } else {
        e.x += Math.sin(e.sway) * e.swayAmp * dt;
      }
      e.x = clamp(e.x, e.w / 2, W - e.w / 2);

      // bullet hits
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        if (b.enemy) continue;
        if (Math.abs(b.x - e.x) < e.w / 2 + b.r && Math.abs(b.y - e.y) < e.h / 2 + b.r) {
          e.hp -= b.dmg;
          spawnParticles(b.x, b.y, "hsl(" + e.hue + ",80%,65%)", 4);
          bullets.splice(j, 1);
          if (e.hp <= 0) {
            kills++; score += e.boss ? 500 : 20;
            spawnParticles(e.x, e.y, "hsl(" + e.hue + ",90%,60%)", e.boss ? 40 : 14);
            dropLoot(e.x, e.y, e.boss);
            if (e.boss) shake = 0.5;
            enemies.splice(i, 1);
            break;
          }
        }
      }
      if (e.hp <= 0) continue;

      // collision with player
      if (Math.abs(e.x - player.x) < (e.w + player.w) / 2 * 0.7 &&
          Math.abs(e.y - player.y) < (e.h + player.h) / 2 * 0.7) {
        if (player.shieldTime > 0) {
          e.hp = 0;
          spawnParticles(e.x, e.y, "#8fe8ff", 20);
          enemies.splice(i, 1);
        } else if (player.invulnTime <= 0) {
          gameOver();
          return;
        }
      }

      // passed bottom
      if (e.y > H + 60) { enemies.splice(i, 1); }
    }

    // enemy bullets hit player
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      if (!b.enemy) continue;
      if (Math.abs(b.x - player.x) < player.w / 2 && Math.abs(b.y - player.y) < player.h / 2) {
        bullets.splice(j, 1);
        if (player.shieldTime > 0) { /* absorbed */ }
        else if (player.invulnTime <= 0) { gameOver(); return; }
      }
    }

    // meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.v * dt; m.spin += dt * 3;
      if (Math.abs(m.x - player.x) < m.r + player.w / 2 * 0.7 && Math.abs(m.y - player.y) < m.r + player.h / 2 * 0.7) {
        if (player.shieldTime > 0) { spawnParticles(m.x, m.y, "#ffb35c", 18); meteors.splice(i, 1); }
        else if (player.invulnTime <= 0) { gameOver(); return; }
      }
      if (m.y > H + 40) { shake = Math.max(shake, 0.25); spawnParticles(m.x, H, "#ff8a3c", 16); meteors.splice(i, 1); }
    }

    // coins with magnet
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i];
      if (player.magnetTime > 0) {
        const dx = player.x - c.x, dy = player.y - c.y;
        const d = Math.hypot(dx, dy);
        if (d < 170) { c.vx += (dx / d) * 900 * dt; c.vy += (dy / d) * 900 * dt; }
      }
      c.x += c.vx * dt; c.y += c.vy * dt; c.vy += 60 * dt; c.life -= dt;
      if (Math.abs(c.x - player.x) < player.w / 2 + c.r && Math.abs(c.y - player.y) < player.h / 2 + c.r) {
        coinsCount++; score += 5; coins.splice(i, 1); continue;
      }
      if (c.life <= 0 || c.y > H + 20) coins.splice(i, 1);
    }

    // items
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      it.y += it.vy * dt; it.life -= dt;
      if (Math.abs(it.x - player.x) < player.w / 2 + it.r && Math.abs(it.y - player.y) < player.h / 2 + it.r) {
        applyItem(it.type);
        spawnParticles(it.x, it.y, "#c6ff8f", 16);
        items.splice(i, 1); continue;
      }
      if (it.life <= 0 || it.y > H + 20) items.splice(i, 1);
    }

    // particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // background
    for (const s of stars) { s.y += (s.v + scroll) * dt; if (s.y > H) { s.y = -2; s.x = rand(0, W); } }
    for (let i = 0; i < clouds.length; i++) {
      const c = clouds[i];
      c.y += (c.v + scroll) * dt;
      if (c.y > H + 60) clouds[i] = makeCloud(-40);
    }

    // score from distance
    score += scroll * dt * 0.1;
  }

  function applyItem(type) {
    if (type === "power") player.powerLevel = clamp(player.powerLevel + 1, 1, 3);
    else if (type === "magnet") player.magnetTime = 8;
    else if (type === "shield") { player.shieldTime = 6; player.invulnTime = 0.5; }
  }

  // ---- Drawing helpers ----
  function drawPlayer() {
    const p = player;
    ctx.save();
    ctx.translate(p.x, p.y);
    if (p.invulnTime > 0 && Math.floor(p.invulnTime * 12) % 2 === 0) ctx.globalAlpha = 0.4;

    // wings
    const flap = Math.sin(performance.now() / 120) * 6;
    ctx.fillStyle = "#3fbf7a";
    ctx.beginPath();
    ctx.moveTo(-8, 0); ctx.lineTo(-30, -6 + flap); ctx.lineTo(-14, 12); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(8, 0); ctx.lineTo(30, -6 - flap); ctx.lineTo(14, 12); ctx.closePath(); ctx.fill();

    // body
    ctx.fillStyle = "#5fd68f";
    ctx.beginPath();
    ctx.moveTo(0, -22); ctx.lineTo(12, 6); ctx.lineTo(0, 20); ctx.lineTo(-12, 6); ctx.closePath(); ctx.fill();

    // head
    ctx.fillStyle = "#7fe6a5";
    ctx.beginPath(); ctx.arc(0, -18, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#0b1020";
    ctx.beginPath(); ctx.arc(-4, -20, 2.2, 0, Math.PI * 2); ctx.arc(4, -20, 2.2, 0, Math.PI * 2); ctx.fill();

    // flame accent
    ctx.fillStyle = "#ffcf5c";
    ctx.beginPath(); ctx.moveTo(0, 16); ctx.lineTo(4, 24); ctx.lineTo(-4, 24); ctx.closePath(); ctx.fill();

    if (p.shieldTime > 0) {
      ctx.globalAlpha = 0.5 + Math.sin(performance.now() / 100) * 0.2;
      ctx.strokeStyle = "#8fe8ff"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }

  function drawEnemy(e) {
    ctx.save();
    ctx.translate(e.x, e.y);
    const hue = e.hue;
    const body = "hsl(" + hue + ",65%,45%)";
    const light = "hsl(" + hue + ",70%,60%)";

    if (e.boss) {
      // boss dragon
      ctx.fillStyle = "#8a2b2b";
      ctx.beginPath();
      ctx.moveTo(-10, 0); ctx.lineTo(-58, -14); ctx.lineTo(-24, 30); ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(10, 0); ctx.lineTo(58, -14); ctx.lineTo(24, 30); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#c0392b";
      ctx.beginPath();
      ctx.moveTo(0, 34); ctx.lineTo(30, -6); ctx.lineTo(0, -40); ctx.lineTo(-30, -6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#e74c3c";
      ctx.beginPath(); ctx.arc(0, 20, 20, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(-8, 16, 5, 0, Math.PI * 2); ctx.arc(8, 16, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#111";
      ctx.beginPath(); ctx.arc(-8, 16, 2.4, 0, Math.PI * 2); ctx.arc(8, 16, 2.4, 0, Math.PI * 2); ctx.fill();
    } else {
      const flap = Math.sin(e.sway * 3) * 5;
      ctx.fillStyle = light;
      ctx.beginPath();
      ctx.moveTo(-6, 0); ctx.lineTo(-22, -4 + flap); ctx.lineTo(-10, 10); ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(6, 0); ctx.lineTo(22, -4 - flap); ctx.lineTo(10, 10); ctx.closePath(); ctx.fill();
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.moveTo(0, 18); ctx.lineTo(11, -4); ctx.lineTo(0, -16); ctx.lineTo(-11, -4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(-4, -6, 3, 0, Math.PI * 2); ctx.arc(4, -6, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#111";
      ctx.beginPath(); ctx.arc(-4, -6, 1.4, 0, Math.PI * 2); ctx.arc(4, -6, 1.4, 0, Math.PI * 2); ctx.fill();
    }

    // hp bar
    const w = e.boss ? 90 : 30;
    const ratio = clamp(e.hp / e.maxHp, 0, 1);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(-w / 2, -e.h / 2 - 10, w, 4);
    ctx.fillStyle = ratio > 0.5 ? "#6ee87a" : ratio > 0.25 ? "#ffd35c" : "#ff5c5c";
    ctx.fillRect(-w / 2, -e.h / 2 - 10, w * ratio, 4);
    ctx.restore();
  }

  function drawMeteor(m) {
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(m.spin);
    // trail
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#ff8a3c";
    ctx.beginPath(); ctx.moveTo(0, -m.r); ctx.lineTo(m.r * 0.7, -m.r * 2.6); ctx.lineTo(-m.r * 0.7, -m.r * 2.4); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, m.r);
    g.addColorStop(0, "#ffd9a0"); g.addColorStop(0.6, "#c9682f"); g.addColorStop(1, "#7a3416");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, m.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath(); ctx.arc(-m.r * 0.3, -m.r * 0.2, m.r * 0.28, 0, Math.PI * 2); ctx.arc(m.r * 0.35, m.r * 0.25, m.r * 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawWarning(w) {
    const blink = Math.sin(w.t * 12) > 0;
    ctx.save();
    ctx.globalAlpha = blink ? 0.9 : 0.45;
    ctx.fillStyle = "#ffcf3c";
    // warning band at top of lane
    ctx.fillRect(w.x - 26, 8, 52, 26);
    ctx.fillStyle = "#1a1200";
    ctx.font = "bold 22px sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("!", w.x, 22);
    // guide line down the lane
    ctx.globalAlpha = blink ? 0.25 : 0.12;
    ctx.fillStyle = "#ffcf3c";
    ctx.fillRect(w.x - 2, 34, 4, H);
    ctx.restore();
  }

  function drawCoin(c) {
    ctx.save();
    ctx.translate(c.x, c.y);
    const sc = Math.abs(Math.cos(performance.now() / 200 + c.x));
    ctx.fillStyle = "#ffcf3c";
    ctx.beginPath(); ctx.ellipse(0, 0, c.r * (0.4 + sc * 0.6), c.r, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#b8860b"; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }

  function drawItem(it) {
    ctx.save();
    ctx.translate(it.x, it.y);
    const bob = Math.sin(performance.now() / 200) * 3;
    ctx.translate(0, bob);
    ctx.shadowColor = "#fff"; ctx.shadowBlur = 10;
    if (it.type === "power") {
      ctx.fillStyle = "#ff6b6b";
      roundRect(-14, -14, 28, 28, 6); ctx.fill();
      ctx.shadowBlur = 0; ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.moveTo(-2, -9); ctx.lineTo(6, -1); ctx.lineTo(0, -1); ctx.lineTo(4, 9); ctx.lineTo(-6, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
    } else if (it.type === "magnet") {
      ctx.fillStyle = "#5cc8ff";
      roundRect(-14, -14, 28, 28, 6); ctx.fill();
      ctx.shadowBlur = 0; ctx.strokeStyle = "#fff"; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.arc(0, 2, 8, Math.PI, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-8, 2); ctx.lineTo(-8, 9); ctx.moveTo(8, 2); ctx.lineTo(8, 9); ctx.stroke();
    } else {
      ctx.fillStyle = "#7de08f";
      roundRect(-14, -14, 28, 28, 6); ctx.fill();
      ctx.shadowBlur = 0; ctx.strokeStyle = "#fff"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(8, -5); ctx.lineTo(8, 3); ctx.lineTo(0, 10); ctx.lineTo(-8, 3); ctx.lineTo(-8, -5); ctx.closePath(); ctx.stroke();
    }
    ctx.restore();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawBackground() {
    ctx.fillStyle = "#0b1020";
    ctx.fillRect(0, 0, W, H);
    for (const s of stars) {
      ctx.fillStyle = "rgba(255,255,255," + (0.3 + s.s * 0.3) + ")";
      ctx.fillRect(s.x, s.y, s.s, s.s);
    }
    for (const c of clouds) {
      ctx.fillStyle = "rgba(180,200,255," + c.a + ")";
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
      ctx.ellipse(c.x + c.w * 0.3, c.y + 6, c.w / 3, c.h / 2.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function render() {
    ctx.save();
    if (shake > 0) ctx.translate(rand(-shake, shake) * 8, rand(-shake, shake) * 8);
    drawBackground();
    for (const w of warnings) drawWarning(w);
    for (const c of coins) drawCoin(c);
    for (const it of items) drawItem(it);
    for (const m of meteors) drawMeteor(m);
    for (const e of enemies) drawEnemy(e);
    // bullets
    for (const b of bullets) {
      ctx.fillStyle = b.enemy ? "#ff6b6b" : "#ffe27a";
      ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
    // particles
    for (const p of particles) {
      ctx.globalAlpha = clamp(p.life / 0.7, 0, 1);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    ctx.globalAlpha = 1;
    drawPlayer();
    ctx.restore();
  }

  function updateHUD() {
    el.score.textContent = Math.floor(score);
    el.dist.textContent = Math.floor(distance / 10);
    el.coin.textContent = coinsCount;
    el.kill.textContent = kills;
    const pw = [];
    if (player.powerLevel > 1) pw.push("화력 Lv." + player.powerLevel);
    if (player.magnetTime > 0) pw.push("자석 " + Math.ceil(player.magnetTime));
    if (player.shieldTime > 0) pw.push("방어막 " + Math.ceil(player.shieldTime));
    el.power.textContent = pw.join("   ");
  }

  // ---- Loop ----
  function loop(t) {
    const dt = Math.min((t - lastTime) / 1000, 0.05);
    lastTime = t;
    if (state === "playing") { update(dt); render(); updateHUD(); }
    requestAnimationFrame(loop);
  }

  // ---- Flow ----
  function startGame() {
    reset();
    state = "playing";
    startScreen.classList.add("hidden");
    overScreen.classList.add("hidden");
    hudEl.classList.remove("hidden");
  }

  function gameOver() {
    state = "over";
    shake = 0.6;
    spawnParticles(player.x, player.y, "#ffcf5c", 40);
    render();
    el.fscore.textContent = Math.floor(score);
    el.fdist.textContent = Math.floor(distance / 10) + "m";
    el.fkill.textContent = kills;
    el.fcoin.textContent = coinsCount;
    hudEl.classList.add("hidden");
    overScreen.classList.remove("hidden");
  }

  // ---- Input ----
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { keys.left = true; pointerX = null; }
    else if (e.key === "ArrowRight") { keys.right = true; pointerX = null; }
    else if (e.code === "Space") {
      e.preventDefault();
      if (state === "start" || state === "over") startGame();
    }
  });
  window.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft") keys.left = false;
    else if (e.key === "ArrowRight") keys.right = false;
  });

  function pointerToCanvas(clientX) {
    const rect = canvas.getBoundingClientRect();
    return (clientX - rect.left) * (W / rect.width);
  }
  canvas.addEventListener("mousemove", (e) => { if (state === "playing") pointerX = pointerToCanvas(e.clientX); });
  canvas.addEventListener("mouseleave", () => { pointerX = null; });
  canvas.addEventListener("touchmove", (e) => { e.preventDefault(); if (state === "playing" && e.touches[0]) pointerX = pointerToCanvas(e.touches[0].clientX); }, { passive: false });
  canvas.addEventListener("touchstart", (e) => { if (state === "playing" && e.touches[0]) pointerX = pointerToCanvas(e.touches[0].clientX); });

  startBtn.addEventListener("click", startGame);
  restartBtn.addEventListener("click", startGame);

  reset();
  requestAnimationFrame(loop);
})();
