// Crystal Defense - simple tower defense
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let W = 0, H = 0;
function resize(){
  const ratio = 960/600;
  let w = window.innerWidth, h = window.innerHeight;
  if (w/h > ratio) { H = Math.min(h, 720); W = H*ratio; }
  else { W = Math.min(w, 960); H = W/ratio; }
  canvas.width = W; canvas.height = H;
}
resize();

// logical coordinates: 960 x 600
const LW = 960, LH = 600;
function scale(){ return W/LW; }

// Path waypoints (logical)
const path = [
  {x:-40,y:120},{x:200,y:120},{x:200,y:300},{x:520,y:300},
  {x:520,y:480},{x:760,y:480},{x:760,y:180},{x:920,y:180}
];

// Game state
let towers = [];
let enemies = [];
let bullets = [];
let gold = 150;
let lives = 20;
let wave = 0;
let spawnQueue = [];
let waveTimer = 0;
let waveCooldown = 3; // seconds between waves
let gameOver = false;
let paused = false;
let lastTime = performance.now();

const towerTypes = {
  arrow:   {name:'Archer', cost:50, range:140, fire:0.6, dmg:12, color:'#7fd7ff'},
  cannon:  {name:'Cannon', cost:90, range:110, fire:1.4, dmg:35, splash:38, color:'#ffb347'},
  frost:   {name:'Frost',  cost:70, range:120, fire:1.0, dmg:6, slow:0.5, slowDur:2.0, color:'#9adfff'}
};

// Grid for placement (cell 40)
const CELL = 40;
function pathCells(){
  const set = new Set();
  for(let i=0;i<path.length-1;i++){
    const a=path[i], b=path[i+1];
    const steps = Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/20);
    for(let s=0;s<=steps;s++){
      const x = a.x + (b.x-a.x)*s/steps;
      const y = a.y + (b.y-a.y)*s/steps;
      set.add(Math.floor(x/CELL)+','+Math.floor(y/CELL));
    }
  }
  return set;
}
const blocked = pathCells();

function canPlace(cx, cy){
  if (cx<0||cy<0||cx>=LW/CELL||cy>=LH/CELL) return false;
  if (blocked.has(cx+','+cy)) return false;
  for(const t of towers){ if(t.cx===cx&&t.cy===cy) return false; }
  return true;
}

// Enemy types
const enemyTypes = {
  grunt:  {hp:40, speed:55, reward:6, color:'#e8654f', r:12},
  runner: {hp:25, speed:95, reward:8, color:'#ffe066', r:10},
  tank:   {hp:160,speed:38, reward:18,color:'#a24dab', r:16}
};

function buildWave(n){
  const list = [];
  for(let i=0;i<5+n*2;i++) list.push('grunt');
  if (n>=2) for(let i=0;i<n;i++) list.push('runner');
  if (n>=3 && n%1===0) for(let i=0;i<Math.floor(n/2);i++) list.push('tank');
  return list;
}

function startWave(){
  wave++;
  spawnQueue = buildWave(wave);
  waveTimer = 0.7;
}

// Enemy movement along path
function makeEnemy(type){
  const d = enemyTypes[type];
  return {type, hp:d.hp, maxHp:d.hp, speed:d.speed, reward:d.reward,
    color:d.color, r:d.r, wp:0, x:path[0].x, y:path[0].y, slow:1, slowT:0};
}

function updateEnemies(dt){
  for(const e of enemies){
    let sp = e.speed * (e.slowT>0 ? e.slow : 1);
    if (e.slowT>0) e.slowT -= dt;
    const tgt = path[e.wp+1];
    const dx = tgt.x-e.x, dy = tgt.y-e.y;
    const dist = Math.hypot(dx,dy);
    const step = sp*dt;
    if (step >= dist){ e.x=tgt.x; e.y=tgt.y; e.wp++; if(e.wp>=path.length-1){ e.dead=true; lives--; } }
    else { e.x += dx/dist*step; e.y += dy/dist*step; }
  }
  enemies = enemies.filter(e=>{ if(e.hp<=0){ gold+=e.reward; return false; } return !e.dead; });
}

function updateTowers(dt){
  for(const t of towers){
    t.cool -= dt;
    if (t.cool<=0){
      const target = pickTarget(t);
      if (target){
        t.cool = towerTypes[t.kind].fire;
        bullets.push({x:t.x,y:t.y,kind:t.kind,target,speed:420,dmg:towerTypes[t.kind].dmg});
      }
    }
  }
}

function pickTarget(t){
  const r = towerTypes[t.kind].range;
  let best=null, bestWp=-1;
  for(const e of enemies){
    const d = Math.hypot(e.x-t.x,e.y-t.y);
    if (d<=r && e.wp>bestWp){ best=e; bestWp=e.wp; }
  }
  return best;
}

function updateBullets(dt){
  for(const b of bullets){
    const t = b.target;
    if (!t || t.dead){ b.done=true; continue; }
    const dx = t.x-b.x, dy=t.y-b.y;
    const d = Math.hypot(dx,dy);
    const step = b.speed*dt;
    if (step>=d){
      // hit
      t.hp -= b.dmg;
      if (b.kind==='frost'){ t.slow=0.5; t.slowT=2.0; }
      if (b.kind==='cannon'){
        for(const e of enemies){
          if (e!==t && Math.hypot(e.x-t.x,e.y-t.y)<=towerTypes.cannon.splash) e.hp -= b.dmg*0.6;
        }
      }
      b.done=true;
    } else { b.x += dx/d*step; b.y += dy/d*step; }
  }
  bullets = bullets.filter(b=>!b.done);
}

// Input handling
let hoverCx=-1, hoverCy=-1, selectedKind='arrow';
canvas.addEventListener('mousemove', e=>{
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX-rect.left)/scale();
  const my = (e.clientY-rect.top)/scale();
  hoverCx = Math.floor(mx/CELL); hoverCy=Math.floor(my/CELL);
});
canvas.addEventListener('click', e=>{
  if (gameOver) return;
  const cost = towerTypes[selectedKind].cost;
  if (canPlace(hoverCx,hoverCy) && gold>=cost){
    towers.push({kind:selectedKind, cx:hoverCx, cy:hoverCy, x:hoverCx*CELL+CELL/2, y:hoverCy*CELL+CELL/2, cool:0});
    gold -= cost;
  }
});
canvas.addEventListener('contextmenu', e=>{
  // right click cancels selection? just ignore
});
document.addEventListener('keydown', e=>{
  if (e.key==='1') selectedKind='arrow';
  if (e.key==='2') selectedKind='cannon';
  if (e.key==='3') selectedKind='frost';
  if (e.key==='p'||e.key==='P') paused=!paused;
});

// Rendering
function draw(){
  const s = scale();
  ctx.setTransform(s,0,0,s,0,0);
  // background
  ctx.fillStyle='#121a30'; ctx.fillRect(0,0,LW,LH);
  // grid subtle
  ctx.strokeStyle='rgba(255,255,255,0.04)'; ctx.lineWidth=1;
  for(let x=0;x<=LW;x+=CELL){ ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,LH);ctx.stroke(); }
  for(let y=0;y<=LH;y+=CELL){ ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(LW,y);ctx.stroke(); }
  // path
  ctx.strokeStyle='#2a3558'; ctx.lineWidth=CELL*0.9; ctx.lineJoin='round'; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(path[0].x,path[0].y);
  for(let i=1;i<path.length;i++) ctx.lineTo(path[i].x,path[i].y);
  ctx.stroke();
  // base (crystal)
  const bx=path[path.length-1].x, by=path[path.length-1].y;
  ctx.fillStyle='#59c7e8'; ctx.beginPath();
  ctx.moveTo(bx,by-20);ctx.lineTo(bx+14,by);ctx.lineTo(bx,by+20);ctx.lineTo(bx-14,by);ctx.closePath();ctx.fill();
  // hover cell
  if (hoverCx>=0){
    const ok = canPlace(hoverCx,hoverCy) && gold>=towerTypes[selectedKind].cost;
    ctx.fillStyle = ok?'rgba(120,255,140,0.3)':'rgba(255,90,90,0.3)';
    ctx.fillRect(hoverCx*CELL,hoverCy*CELL,CELL,CELL);
    // range preview
    ctx.strokeStyle='rgba(255,255,255,0.15)';
    ctx.beginPath();ctx.arc(hoverCx*CELL+CELL/2,hoverCy*CELL+CELL/2,towerTypes[selectedKind].range,0,Math.PI*2);ctx.stroke();
  }
  // towers
  for(const t of towers){
    const c = towerTypes[t.kind].color;
    ctx.fillStyle=c;
    ctx.beginPath();ctx.arc(t.x,t.y,13,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#0b1020';
    ctx.beginPath();ctx.arc(t.x,t.y,6,0,Math.PI*2);ctx.fill();
  }
  // enemies
  for(const e of enemies){
    ctx.fillStyle=e.color;
    ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,Math.PI*2);ctx.fill();
    // hp bar
    const w=24;
    ctx.fillStyle='#0e0';
    ctx.fillRect(e.x-w/2, e.y-e.r-8, w*(e.hp/e.maxHp), 3);
    ctx.fillStyle='rgba(0,0,0,0.5)';
    ctx.fillRect(e.x-w/2 + w*(e.hp/e.maxHp), e.y-e.r-8, w - w*(e.hp/e.maxHp), 3);
  }
  // bullets
  for(const b of bullets){
    ctx.fillStyle = towerTypes[b.kind].color;
    ctx.beginPath();ctx.arc(b.x,b.y,4,0,Math.PI*2);ctx.fill();
  }
  // HUD text (in logical coords)
  ctx.fillStyle='#fff'; ctx.font='16px monospace';
  ctx.fillText('Wave '+wave+'   Gold '+gold+'   Lives '+lives, 12, LH-18);
  ctx.fillText('Keys: 1 Archer(50)  2 Cannon(90)  3 Frost(70)  P Pause', LW-360, LH-18);
  if (gameOver){
    ctx.font='bold 42px sans-serif';
    ctx.fillStyle='#ff5c5c';
    ctx.fillText('GAME OVER - Wave '+wave, LW/2-140, LH/2-40);
    ctx.font='18px monospace';
    ctx.fillText('Reload page to restart', LW/2-120, LH/2+10);
  }
}

// Main loop
startWave();
waveCooldown = 4;
function loop(){
  const now = performance.now();
  let dt = (now-lastTime)/1000; lastTime=now;
  if (dt>0.1) dt=0.1;
  if (!paused && !gameOver){
    waveTimer -= dt;
    if (waveTimer<=0 && spawnQueue.length>0){
      const t = spawnQueue.shift();
      enemies.push(makeEnemy(t));
      waveTimer = 0.8;
    }
    if (spawnQueue.length===0 && enemies.length===0){
      waveCooldown -= dt;
      if (waveCooldown<=0) startWave();
    }
    updateEnemies(dt); updateTowers(dt); updateBullets(dt);
    if (lives<=0) gameOver=true;
  }
  draw();
  requestAnimationFrame(loop);
}
loop();
