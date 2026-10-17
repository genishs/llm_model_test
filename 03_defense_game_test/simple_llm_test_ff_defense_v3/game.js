(() => {
const COLS = 20, ROWS = 12, CS = 40;
const cvs = document.getElementById('game'), ctx = cvs.getContext('2d');
const CVW = cvs.width, CVH = cvs.height;
const WPTS = [[0,3],[4,3],[4,7],[9,7],[9,1],[14,1],[14,9],[19,9]].map(p => ({x:p[0],y:p[1]}));

const TOWER_TYPES = {
  frost: {name:'Frost Coil', cost:60, dmg:8, range:2.4, rate:0.9, color:'#5fb0ff', slow:{f:0.45,dur:1.6}},
  arc:   {name:'Arc Node',   cost:95, dmg:26, range:3.0, rate:1.6, color:'#c39bff', pierce:3, falloff:0.55},
  ember: {name:'Ember Mortar',cost:130,dmg:40, range:3.6, rate:0.42, color:'#ff8a4d', splash:0.9}
};
const ENEMY_TYPES = {
  crawler:{hp:52, spd:1.05, gold:6, r:11, color:'#7fd6a1', slowRes:0, coreDmg:1},
  runner: {hp:28, spd:2.1,  gold:4, r:8,  color:'#ffe066', slowRes:0, coreDmg:1},
  brute:  {hp:230,spd:0.72, gold:18,r:15, color:'#ff7b8a', slowRes:0.4, coreDmg:1},
  warden: {hp:900,spd:0.5,  gold:35,r:19, color:'#b06bff', slowRes:0.7, coreDmg:3}
};
const BOSSES = [
  {name:'Rime Warden',    hp:2400, spd:0.60, gold:180, r:24, color:'#5fb0ff', slowRes:0.9, coreDmg:5, ability:'frostNova',   abilityCd:7.0},
  {name:'Arc Tyrant',     hp:3800, spd:0.66, gold:260, r:24, color:'#c39bff', slowRes:0.8, coreDmg:5, ability:'empPulse',    abilityCd:7.5},
  {name:'Ember Colossus', hp:5600, spd:0.52, gold:340, r:26, color:'#ff8a4d', slowRes:0.85,coreDmg:6, ability:'summonSpawns',abilityCd:9.0},
  {name:'Void Behemoth',  hp:8200, spd:0.58, gold:440, r:27, color:'#ff5d8f', slowRes:0.95,coreDmg:7, ability:'regen',       abilityCd:6.0},
  {name:'Cryo Dreadnought',hp:11500,spd:0.46, gold:560, r:28, color:'#8fd3ff', slowRes:1.0, coreDmg:8, ability:'frostNova',   abilityCd:6.5},
  {name:'Frostline Devourer',hp:16000,spd:0.55,gold:800, r:30, color:'#ff7b8a', slowRes:1.0, coreDmg:10,ability:'summonSpawns',abilityCd:8.0}
];
const BOSS_EVERY = 4;

let pathCells = new Set();
(function buildPath(){
  for(let i=0;i<WPTS.length-1;i++){
    let a=WPTS[i], b=WPTS[i+1];
    let dx=Math.sign(b.x-a.x), dy=Math.sign(b.y-a.y);
    let x=a.x,y=a.y;
    while(x!==b.x||y!==b.y){ pathCells.add(x+','+y); if(x!==b.x)x+=dx; else y+=dy; }
  }
  pathCells.add(WPTS[WPTS.length-1].x+','+WPTS[WPTS.length-1].y);
})();
const PATH_PX = WPTS.map(p=>({x:p.x*CS+CS/2, y:p.y*CS+CS/2}));

let state;
function reset(){
  state = {gold:220, hp:20, wave:0, maxWave:25, towers:[], enemies:[], projectiles:[], effects:[],
           spawnQueue:[], spawning:false, prepTime:6, build:'frost', selected:null, hoverCell:null,
           speed:1, over:false, won:false, time:0};
  log('관문이 봉인되었습니다. 웨이브를 시작하세요.');
  syncUI();
}

function hpMult(){ return 1 + 0.22*(state.wave-1); }
function isBossWave(n){ return n>0 && n % BOSS_EVERY === 0; }
function bossIndexFor(n){ return Math.min(BOSSES.length-1, Math.floor(n/BOSS_EVERY)-1); }

function buildWave(n){
  const q=[]; let t=0;
  const push=(type,count,gap)=>{ for(let i=0;i<count;i++){ q.push({at:t, type}); t+=gap; } };
  if(isBossWave(n)){
    push('crawler', 4+Math.floor(n*0.6), Math.max(0.4, 0.9-n*0.02));
    if(n>=8) push('runner', 3+Math.floor(n*0.5), 0.4);
    q.push({at:2.2, boss:true});
    return q;
  }
  push('crawler', 5+Math.floor(n*1.2), Math.max(0.35, 0.9-n*0.02));
  if(n>=2) push('runner', 3+Math.floor(n*0.8), 0.4);
  if(n>=4) push('brute', 1+Math.floor((n-2)/2), 1.6);
  if(n>=8 && n%2===0) push('warden', Math.floor(n/8), 3.5);
  return q;
}

function startWave(){
  if(state.spawning || state.over) return;
  const bonus = Math.round(state.prepTime*2);
  state.gold += bonus;
  state.wave++;
  state.spawnQueue = buildWave(state.wave);
  state.spawnTimer = 0; state.spawning = true; state.prepTime = 6; state.prepDone=false;
  if(isBossWave(state.wave)){ const b=BOSSES[bossIndexFor(state.wave)]; log(`⚠ 보스전 ${state.wave}: ${b.name} 출현!`, true); beep(180,0.4,'sawtooth',0.06); }
  else log(`웨이브 ${state.wave} 시작${bonus?` (+${bonus}g 조기 보너스)`:''}`);
  syncUI();
}

function spawnEnemy(type){
  const d = ENEMY_TYPES[type], m = hpMult();
  state.enemies.push({type, boss:false, hp:d.hp*m, maxHp:d.hp*m, spd:d.spd, seg:0, dist:0, slowT:0, slowF:1,
    gold:d.gold, r:d.r, color:d.color, slowRes:d.slowRes, coreDmg:d.coreDmg});
}
function spawnBoss(wave){
  const d = BOSSES[bossIndexFor(wave)], m = 1 + 0.12*(wave-1);
  state.enemies.push({type:'boss', boss:true, name:d.name, ability:d.ability, abilityCd:d.abilityCd, abilityTimer:d.abilityCd*0.6,
    hp:d.hp*m, maxHp:d.hp*m, spd:d.spd, seg:0, dist:0, slowT:0, slowF:1,
    gold:d.gold, r:d.r, color:d.color, slowRes:d.slowRes, coreDmg:d.coreDmg});
  log(`보스 ${d.name} 등장 (HP ${Math.round(d.hp*m)})`, true);
}

function towerStats(t){
  const b = TOWER_TYPES[t.type], lv=t.lv;
  return { dmg:b.dmg*Math.pow(1.7,lv-1), range:(b.range+0.35*(lv-1))*CS, rate:b.rate*Math.pow(1.18,lv-1) };
}
const upCost = t => Math.round(TOWER_TYPES[t.type].cost*0.8*t.lv);

function placeTower(cx,cy){
  const key=cx+','+cy;
  if(cx<0||cy<0||cx>=COLS||cy>=ROWS) return;
  if(pathCells.has(key)) return flash('경로 위에는 설치할 수 없습니다.');
  if(state.towers.some(t=>t.cx===cx&&t.cy===cy)) return flash('이미 타워가 있습니다.');
  const b = TOWER_TYPES[state.build];
  if(state.gold < b.cost) return flash('골드가 부족합니다.');
  state.gold -= b.cost;
  state.towers.push({type:state.build, cx, cy, x:cx*CS+CS/2, y:cy*CS+CS/2, lv:1, cd:0, spent:b.cost});
  syncUI();
}
function upgradeTower(t){
  if(!t) return;
  if(t.lv>=3) return flash('최대 레벨입니다.');
  const c=upCost(t);
  if(state.gold<c) return flash('골드가 부족합니다.');
  state.gold-=c; t.spent+=c; t.lv++; log(`${TOWER_TYPES[t.type].name} Lv${t.lv}`); syncUI();
}
function sellTower(t){
  if(!t) return;
  const refund = Math.round(t.spent*0.7);
  state.gold += refund;
  state.towers = state.towers.filter(x=>x!==t);
  state.selected=null; log(`판매 +${refund}g`); syncUI();
}

function flash(msg){ log(msg, true); }
const logEl=document.getElementById('log');
function log(msg, warn){ const d=document.createElement('div'); if(warn)d.style.color='#ffb37f'; d.textContent=msg; logEl.prepend(d); while(logEl.children.length>40)logEl.lastChild.remove(); }

let ac=null;
function beep(freq,dur,type,gain){ try{ ac=ac||new (window.AudioContext||window.webkitAudioContext)(); const o=ac.createOscillator(),g=ac.createGain(); o.type=type||'square'; o.frequency.value=freq; g.gain.value=gain||0.03; o.connect(g); g.connect(ac.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime+(dur||0.06)); o.stop(ac.currentTime+(dur||0.06)); }catch(e){} }

function update(dt){
  if(state.over) return;
  state.time+=dt;
  if(state.spawning){
    state.spawnTimer+=dt;
    while(state.spawnQueue.length && state.spawnQueue[0].at<=state.spawnTimer){ const it=state.spawnQueue.shift(); if(it.boss) spawnBoss(state.wave); else spawnEnemy(it.type); }
    if(!state.spawnQueue.length) state.spawning=false;
  } else if(state.enemies.length===0){
    if(state.wave>0 && !state.prepDone){ const bonus=(isBossWave(state.wave)?120:40)+state.wave*6; state.gold += bonus; log(`${isBossWave(state.wave)?'보스전':'웨이브'} ${state.wave} 클리어 +${bonus}g`); state.prepDone=true; }
    if(state.wave>=state.maxWave){ return end(true); }
    state.prepTime=Math.max(0,state.prepTime-dt);
  }
  for(const e of state.enemies){
    if(e.slowT>0){ e.slowT-=dt; } else e.slowF=1;
    let spd = e.spd * e.slowF;
    if(e.boss && e.ability==='regen') spd *= 1.25;
    if(e.boss) bossAbility(e, dt);
    let move=spd*CS*dt;
    while(move>0 && e.seg<PATH_PX.length-1){
      const a=PATH_PX[e.seg], b=PATH_PX[e.seg+1];
      const segLen=Math.hypot(b.x-a.x,b.y-a.y);
      const remain=segLen-e.dist;
      if(move>=remain){ move-=remain; e.seg++; e.dist=0; } else { e.dist+=move; move=0; }
    }
    if(e.seg>=PATH_PX.length-1){ e.dead=true; state.hp-=e.coreDmg; beep(120,0.18,'sawtooth',0.05); log(`핵 피격 -${e.coreDmg}`); if(state.hp<=0) return end(false); }
  }
  for(const t of state.towers){
    if(t.stunT && t.stunT>0){ t.stunT-=dt; continue; }
    t.cd-=dt;
    if(t.cd>0) continue;
    const s=towerStats(t);
    const inRange=state.enemies.filter(e=>{ if(e.dead) return false; const p=enemyPos(e); return Math.hypot(p.x-t.x,p.y-t.y)<=s.range; });
    if(!inRange.length) continue;
    inRange.sort((a,b)=> (b.seg+b.dist)-(a.seg+a.dist));
    const target=inRange[0];
    t.cd=1/s.rate;
    fireTower(t,target,s);
  }
  for(const p of state.projectiles){
    if(p.kind==='beam') continue;
    const tx = p.target && !p.target.dead ? enemyPos(p.target).x : p.tx;
    const ty = p.target && !p.target.dead ? enemyPos(p.target).y : p.ty;
    p.tx=tx; p.ty=ty;
    const dx=tx-p.x, dy=ty-p.y, d=Math.hypot(dx,dy), step=p.spd*dt;
    if(d<=step){ p.hit=true; applyHit(p); } else { p.x+=dx/d*step; p.y+=dy/d*step; }
  }
  state.projectiles=state.projectiles.filter(p=>!p.hit && !(p.kind==='beam' && p.life<=0));
  for(const b of state.projectiles) if(b.kind==='beam') b.life-=dt;
  state.enemies=state.enemies.filter(e=>!e.dead);
  for(const fx of state.effects) fx.t-=dt;
  state.effects=state.effects.filter(fx=>fx.t>0);
}

function bossAbility(e, dt){
  e.abilityTimer -= dt;
  if(e.abilityTimer > 0) return;
  e.abilityTimer = e.abilityCd;
  const p = enemyPos(e);
  if(e.ability==='frostNova'){
    let slowed=0;
    state.towers.forEach(t=>{ if(Math.hypot(t.x-p.x,t.y-p.y)<=CS*2.6){ t.stunT=3; slowed++; } });
    state.effects.push({kind:'nova', x:p.x, y:p.y, r:CS*2.6, color:e.color, t:0.5});
    log(`${e.name} 냉기 방출 — 타워 ${slowed}기 일시 정지`, true); beep(300,0.3,'sawtooth',0.05);
  } else if(e.ability==='empPulse'){
    state.projectiles.forEach(pr=>{ if(Math.hypot(pr.x-p.x,pr.y-p.y)<=CS*2.4) pr.hit=true; });
    let stunT=0;
    state.towers.forEach(t=>{ if(Math.hypot(t.x-p.x,t.y-p.y)<=CS*2.2){ t.cd=Math.max(t.cd,1.5); stunT++; } });
    state.effects.push({kind:'nova', x:p.x, y:p.y, r:CS*2.4, color:e.color, t:0.5});
    log(`${e.name} EMP 충격파 — 투사체 소멸·타워 ${stunT}기 경직`, true); beep(760,0.3,'square',0.05);
  } else if(e.ability==='summonSpawns'){
    const cnt = 2 + Math.floor(state.wave/8);
    for(let i=0;i<cnt;i++){ const seg=Math.max(0,e.seg-1); state.enemies.push({type:'crawler', boss:false, hp:ENEMY_TYPES.crawler.hp*hpMult(), maxHp:ENEMY_TYPES.crawler.hp*hpMult(), spd:ENEMY_TYPES.crawler.spd, seg, dist:e.dist, slowT:0, slowF:1, gold:ENEMY_TYPES.crawler.gold, r:ENEMY_TYPES.crawler.r, color:ENEMY_TYPES.crawler.color, slowRes:0, coreDmg:1}); }
    state.effects.push({kind:'nova', x:p.x, y:p.y, r:CS*1.6, color:e.color, t:0.5});
    log(`${e.name} 증식 — 크롤러 ${cnt}기 소환`, true); beep(420,0.25,'triangle',0.05);
  } else if(e.ability==='regen'){
    const heal = Math.round(e.maxHp*0.06);
    e.hp = Math.min(e.maxHp, e.hp+heal);
    state.effects.push({kind:'nova', x:p.x, y:p.y, r:CS*1.4, color:'#6fe08a', t:0.5});
    log(`${e.name} 재생 +${heal} HP`, true); beep(520,0.2,'sine',0.04);
  }
}

function enemyPos(e){
  const a=PATH_PX[e.seg], b=PATH_PX[Math.min(e.seg+1,PATH_PX.length-1)];
  const len=Math.hypot(b.x-a.x,b.y-a.y)||1;
  return {x:a.x+(b.x-a.x)*e.dist/len, y:a.y+(b.y-a.y)*e.dist/len};
}

function fireTower(t,target,s){
  const kind = t.type==='arc' ? 'beam' : t.type==='ember' ? 'shell' : 'bolt';
  if(kind==='beam'){
    state.projectiles.push({kind:'beam', x:t.x, y:t.y, life:0.12, color:TOWER_TYPES.arc.color});
    let hitList=[target], cur=target, used=1;
    const p=enemyPos(cur);
    while(used<TOWER_TYPES.arc.pierce){
      const nxt=state.enemies.find(e=>!e.dead && !hitList.includes(e) && Math.hypot(enemyPos(e).x-p.x,enemyPos(e).y-p.y)<CS*1.4);
      if(!nxt)break; hitList.push(nxt); used++;
    }
    hitList.forEach((e,i)=> dealDamage(e, s.dmg*Math.pow(TOWER_TYPES.arc.falloff,i), p.x,p.y));
    state.effects.push({kind:'zap', x:t.x,y:t.y, t:0.12});
    beep(900,0.05,'square',0.02);
  } else if(kind==='shell'){
    state.projectiles.push({kind:'shell', x:t.x,y:t.y, tx:enemyPos(target).x, ty:enemyPos(target).y, spd:260, dmg:s.dmg, splash:TOWER_TYPES.ember.splash*CS, color:'#ff8a4d'});
    beep(220,0.08,'triangle',0.03);
  } else {
    state.projectiles.push({kind:'bolt', x:t.x,y:t.y, tx:enemyPos(target).x, ty:enemyPos(target).y, spd:420, dmg:s.dmg, slow:TOWER_TYPES.frost.slow, color:'#5fb0ff'});
    beep(1300,0.04,'square',0.02);
  }
}
function applyHit(p){
  if(p.kind==='shell'){
    state.effects.push({kind:'boom', x:p.tx,y:p.ty, r:p.splash, t:0.25});
    state.enemies.forEach(e=>{ if(!e.dead && Math.hypot(enemyPos(e).x-p.tx,enemyPos(e).y-p.ty)<=p.splash) dealDamage(e,p.dmg,p.tx,p.ty); });
    beep(140,0.12,'sawtooth',0.04);
  } else if(p.target && !p.target.dead){
    dealDamage(p.target,p.dmg,p.tx,p.ty);
    if(p.slow) { const e=p.target; const f=1-(1-p.slow.f)*(1-e.slowRes); e.slowF=Math.min(e.slowF,f); e.slowT=p.slow.dur; }
  }
}
function dealDamage(e,dmg){
  if(e.dead) return;
  e.hp-=dmg;
  if(e.hp<=0){ e.dead=true; state.gold+=e.gold; beep(520,0.07,'triangle',0.03); syncUI(); }
}

function end(won){
  state.over=true; state.won=won;
  document.getElementById('overlay').classList.remove('hidden');
  document.getElementById('overlayTitle').textContent = won ? 'VICTORY' : 'CORE BREACHED';
  document.getElementById('overlayTitle').style.color = won ? '#8fd3ff' : '#ff7b8a';
  document.getElementById('overlayText').textContent = won ? `25 웨이브 방어 완료 (골드 ${state.gold})` : `웨이브 ${state.wave}에서 관문이 무너졌습니다`;
  beep(won?660:90,0.5,'triangle',won?0.05:0.07);
}

function draw(){
  ctx.clearRect(0,0,cvs.width,cvs.height);
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
    const isPath=pathCells.has(x+','+y);
    ctx.fillStyle = isPath ? '#1b2c46' : ((x+y)%2 ? '#101d30' : '#0e1a2b');
    ctx.fillRect(x*CS,y*CS,CS,CS);
  }
  ctx.strokeStyle='#25405f'; ctx.lineWidth=1;
  for(let x=0;x<=COLS;x++){ctx.beginPath();ctx.moveTo(x*CS,0);ctx.lineTo(x*CS,ROWS*CS);ctx.stroke();}
  for(let y=0;y<=ROWS;y++){ctx.beginPath();ctx.moveTo(0,y*CS);ctx.lineTo(COLS*CS,y*CS);ctx.stroke();}
  ctx.strokeStyle='#2f5a86'; ctx.lineWidth=14; ctx.lineJoin='round'; ctx.beginPath();
  PATH_PX.forEach((p,i)=> i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)); ctx.stroke();
  const core=PATH_PX[PATH_PX.length-1];
  ctx.fillStyle='#ff7b8a'; ctx.fillRect(core.x-14,core.y-14,28,28);
  ctx.strokeStyle='#ffd0d8'; ctx.strokeRect(core.x-14,core.y-14,28,28);
  const sp=PATH_PX[0]; ctx.fillStyle='#5fb0ff'; ctx.beginPath(); ctx.arc(sp.x,sp.y,9,0,7); ctx.fill();

  if(state.hoverCell && !state.over){
    const {cx,cy}=state.hoverCell; const key=cx+','+cy;
    const occupied=state.towers.some(t=>t.cx===cx&&t.cy===cy);
    const buildable=!occupied && !pathCells.has(key);
    if(buildable){
      const b=TOWER_TYPES[state.build]; const px=cx*CS+CS/2, py=cy*CS+CS/2;
      ctx.fillStyle='rgba(95,176,255,.18)'; ctx.beginPath(); ctx.arc(px,py,b.range*CS,0,7); ctx.fill();
      ctx.strokeStyle = state.gold>=b.cost ? 'rgba(95,176,255,.6)' : 'rgba(255,123,138,.6)';
      ctx.beginPath(); ctx.arc(px,py,b.range*CS,0,7); ctx.stroke();
      drawTowerShape(state.build,px,py,1,.55);
    }
    const tapMark = ('ontouchstart' in window) || buildable;
    if(tapMark){ ctx.strokeStyle='rgba(143,211,255,.85)'; ctx.lineWidth=2; ctx.strokeRect(cx*CS+2,cy*CS+2,CS-4,CS-4); }
  }
  for(const t of state.towers){
    const s=towerStats(t);
    if(state.selected===t){ ctx.fillStyle='rgba(95,176,255,.10)'; ctx.beginPath(); ctx.arc(t.x,t.y,s.range,0,7); ctx.fill();
      ctx.strokeStyle='#5fb0ff'; ctx.stroke(); }
    drawTowerShape(t.type,t.x,t.y,t.lv,1);
  }
  for(const e of state.enemies){
    const p=enemyPos(e);
    if(e.boss){
      ctx.save();
      ctx.shadowColor=e.color; ctx.shadowBlur=16;
      ctx.fillStyle='#0c1626'; ctx.beginPath(); ctx.arc(p.x,p.y,e.r,0,7); ctx.fill();
      ctx.strokeStyle=e.color; ctx.lineWidth=3; ctx.stroke();
      ctx.fillStyle=e.color; ctx.beginPath(); ctx.arc(p.x,p.y,e.r*0.55,0,7); ctx.fill();
      ctx.restore();
      const w=e.r*2.6, pct=Math.max(0,e.hp/e.maxHp);
      ctx.fillStyle='#3a1220'; ctx.fillRect(p.x-w/2,p.y-e.r-14,w,6);
      ctx.fillStyle=pct>0.5?'#ffd479':pct>0.25?'#ff9f5a':'#ff7b8a'; ctx.fillRect(p.x-w/2,p.y-e.r-14,w*pct,6);
      ctx.strokeStyle='#fff'; ctx.lineWidth=1; ctx.strokeRect(p.x-w/2,p.y-e.r-14,w,6);
      ctx.fillStyle='#ffe0e8'; ctx.font='bold 11px Segoe UI, sans-serif'; ctx.textAlign='center';
      ctx.fillText(e.name, p.x, p.y-e.r-18); ctx.textAlign='left';
    } else {
      ctx.fillStyle=e.color; ctx.beginPath(); ctx.arc(p.x,p.y,e.r,0,7); ctx.fill();
      if(e.slowT>0){ ctx.strokeStyle='#9fd8ff'; ctx.lineWidth=2; ctx.stroke(); }
      const w=e.r*2.1, pct=Math.max(0,e.hp/e.maxHp);
      ctx.fillStyle='#3a1220'; ctx.fillRect(p.x-w/2,p.y-e.r-9,w,4);
      ctx.fillStyle=pct>0.5?'#6fe08a':pct>0.25?'#ffd479':'#ff7b8a'; ctx.fillRect(p.x-w/2,p.y-e.r-9,w*pct,4);
    }
  }
  for(const p of state.projectiles){
    if(p.kind==='beam'){ const t=p; ctx.strokeStyle=t.color; ctx.lineWidth=2.5; ctx.globalAlpha=Math.max(0,t.life/0.12);
      ctx.beginPath(); ctx.moveTo(t.x,t.y); ctx.lineTo(t.tx??t.x, t.ty??t.y); ctx.stroke(); ctx.globalAlpha=1; }
    else { ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.kind==='shell'?5:3.5,0,7); ctx.fill(); }
  }
  for(const fx of state.effects){
    if(fx.kind==='boom'){ ctx.strokeStyle=`rgba(255,138,77,${Math.max(0,fx.t/0.25)})`; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(fx.x,fx.y,fx.r*(1-fx.t/0.25),0,7); ctx.stroke(); }
    else if(fx.kind==='nova'){ const a=Math.max(0,fx.t/0.5); ctx.globalAlpha=a; ctx.strokeStyle=fx.color; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(fx.x,fx.y,fx.r*(1-fx.t/0.5),0,7); ctx.stroke(); ctx.globalAlpha=1; }
  }
}
function drawTowerShape(type,x,y,lv,alpha){
  const b=TOWER_TYPES[type]; ctx.globalAlpha=alpha;
  ctx.fillStyle='#1a2740'; ctx.beginPath(); ctx.arc(x,y,15,0,7); ctx.fill();
  ctx.strokeStyle=b.color; ctx.lineWidth=2; ctx.stroke();
  ctx.fillStyle=b.color;
  if(type==='frost'){ ctx.beginPath(); for(let i=0;i<6;i++){const a=i*Math.PI/3; const px=x+Math.cos(a)*8, py=y+Math.sin(a)*8; i?ctx.lineTo(px,py):ctx.moveTo(px,py);} ctx.closePath(); ctx.fill(); }
  if(type==='arc'){ ctx.beginPath(); ctx.arc(x,y,7,0,7); ctx.fill(); ctx.strokeStyle='#e6dcff'; ctx.beginPath(); ctx.moveTo(x-9,y-9); ctx.lineTo(x+2,y); ctx.lineTo(x-4,y+2); ctx.lineTo(x+8,y+10); ctx.stroke(); }
  if(type==='ember'){ ctx.fillRect(x-7,y-7,14,14); ctx.fillStyle='#ffe0c2'; ctx.beginPath(); ctx.arc(x,y,4,0,7); ctx.fill(); }
  ctx.globalAlpha=1;
  for(let i=0;i<lv;i++){ ctx.fillStyle='#ffd479'; ctx.fillRect(x-9+i*7, y+16, 5, 3); }
}

let last=performance.now();
function loop(now){
  let dt=Math.min(0.05,(now-last)/1000); last=now;
  for(let i=0;i<state.speed;i++) update(dt);
  draw(); syncHUD();
  requestAnimationFrame(loop);
}

const waveEl=document.getElementById('wave'), goldEl=document.getElementById('gold'), hpEl=document.getElementById('hp');
const stageEl=document.getElementById('stageLabel'), bossEl=document.getElementById('bossBadge');
function syncHUD(){
  waveEl.textContent=state.wave; goldEl.textContent=state.gold; hpEl.textContent=Math.max(0,state.hp);
  const bossUpcoming = isBossWave(state.wave+1) && !state.over;
  if(stageEl) stageEl.textContent = `Stage ${Math.max(1,state.wave||1)}${isBossWave(state.wave)?' · BOSS':''}`;
  if(bossEl){
    const bossActive = state.enemies.some(e=>e.boss);
    if(isBossWave(state.wave) && (state.spawning||bossActive)){ bossEl.textContent='BOSS FIGHT'; bossEl.classList.remove('hidden'); }
    else if(bossUpcoming){ bossEl.textContent=`NEXT: BOSS @ ${state.wave+1}`; bossEl.classList.remove('hidden'); }
    else bossEl.classList.add('hidden');
  }
}
function syncUI(){
  syncHUD();
  document.querySelectorAll('.shopCard').forEach(c=>c.classList.toggle('active', c.dataset.t===state.build));
  const startBtn=document.getElementById('startBtn');
  startBtn.disabled = state.spawning || state.over;
  const nextBoss = isBossWave(state.wave+1);
  if(state.spawning) startBtn.textContent = nextBoss && !state.enemies.some(e=>e.boss) ? `Boss Wave ${state.wave} in progress` : `Wave ${state.wave} in progress`;
  else startBtn.textContent = nextBoss ? `Start BOSS Wave ${state.wave+1}` : `Start Wave ${state.wave+1}`;
  const info=document.getElementById('selInfo'), acts=document.getElementById('selActions');
  const t=state.selected;
  if(!t){ info.textContent='빈 셀을 클릭해 타워를 설치하거나, 기존 타워를 클릭하세요.'; acts.classList.add('hidden'); return; }
  const s=towerStats(t), b=TOWER_TYPES[t.type];
  info.innerHTML=`<b>${b.name}</b> Lv${t.lv}<br>피해 ${s.dmg.toFixed(1)} · 사거리 ${(s.range/CS).toFixed(2)}셀 · DPS ${(s.dmg*s.rate).toFixed(1)}<br>투입 ${t.spent}g · 판매 환급 ${Math.round(t.spent*0.7)}g`;
  acts.classList.remove('hidden');
  const upBtn=document.getElementById('upBtn');
  upBtn.disabled = t.lv>=3 || state.gold<upCost(t);
  upBtn.textContent = t.lv>=3 ? 'Max Level' : `Upgrade (${upCost(t)}g)`;
}

function cellFromEvent(e){
  const r=cvs.getBoundingClientRect();
  const sx=CVW/r.width, sy=CVH/r.height;
  const px=(e.clientX-r.left)*sx, py=(e.clientY-r.top)*sy;
  const cx=Math.floor(px/CS), cy=Math.floor(py/CS);
  return (cx>=0&&cy>=0&&cx<COLS&&cy<ROWS) ? {cx,cy} : null;
}
cvs.addEventListener('mousemove', e=>{ state.hoverCell=cellFromEvent(e); });
cvs.addEventListener('mouseleave', ()=> state.hoverCell=null);
function handleTap(e){
  const c=cellFromEvent(e);
  if(!c) return;
  const t=state.towers.find(t=>t.cx===c.cx&&t.cy===c.cy);
  if(t){ state.selected=t; syncUI(); }
  else { state.selected=null; placeTower(c.cx,c.cy); }
}
cvs.addEventListener('click', handleTap);
cvs.addEventListener('touchstart', e=>{
  if(e.touches.length>1) return;
  const touch=e.touches[0];
  state.hoverCell=cellFromEvent(touch);
}, {passive:true});
cvs.addEventListener('touchend', e=>{
  e.preventDefault();
  const touch = (e.changedTouches && e.changedTouches[0]) || null;
  if(touch) handleTap(touch);
  if(!('ontouchstart' in window)) state.hoverCell=null;
});
document.querySelectorAll('.shopCard').forEach(c=>c.addEventListener('click',()=>{ state.build=c.dataset.t; state.selected=null; syncUI(); }));
document.getElementById('upBtn').onclick=()=>upgradeTower(state.selected);
document.getElementById('sellBtn').onclick=()=>sellTower(state.selected);
document.getElementById('startBtn').onclick=startWave;
document.getElementById('speedBtn').onclick=e=>{ state.speed=state.speed===1?2:1; e.target.textContent='Speed x'+state.speed; };
document.getElementById('restartBtn').onclick=()=>{ document.getElementById('overlay').classList.add('hidden'); reset(); };
window.addEventListener('keydown',e=>{
  if(e.key==='1'){state.build='frost';syncUI();}
  if(e.key==='2'){state.build='arc';syncUI();}
  if(e.key==='3'){state.build='ember';syncUI();}
  if(e.key==='u'||e.key==='U')upgradeTower(state.selected);
  if(e.key==='s'||e.key==='S')sellTower(state.selected);
  if(e.code==='Space'){e.preventDefault();startWave();}
  if(e.key==='Escape'){state.selected=null;syncUI();}
});

reset();
requestAnimationFrame(loop);
})();
