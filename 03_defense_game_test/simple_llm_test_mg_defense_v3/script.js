const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
const healthEl=document.getElementById('health');
const goldEl=document.getElementById('gold');
const waveEl=document.getElementById('wave');
const stageEl=document.getElementById('stage');
const bossIndicator=document.getElementById('boss-indicator');
const messageEl=document.getElementById('message');

let health=100, gold=200, wave=1, stage=1, selectedTower='cannon';
let towers=[], enemies=[], bullets=[], particles=[];
let lastWaveTime=0, gameOver=false;

const path=[
 {x:50,y:300},{x:250,y:300},{x:250,y:150},{x:450,y:150},
 {x:450,y:450},{x:650,y:450},{x:650,y:250},{x:850,y:250}
];
const pathWidth=60;

document.querySelectorAll('#tower-menu button').forEach(btn=>{
 btn.onclick=()=>{selectedTower=btn.dataset.type; document.querySelectorAll('#tower-menu button').forEach(b=>b.classList.remove('selected')); btn.classList.add('selected');}
});
document.querySelector('[data-type="cannon"]').classList.add('selected');

function getCanvasPos(e){
  const rect=canvas.getBoundingClientRect();
  const scaleX=canvas.width/rect.width;
  const scaleY=canvas.height/rect.height;
  const clientX=e.clientX ?? (e.touches && e.touches[0].clientX);
  const clientY=e.clientY ?? (e.touches && e.touches[0].clientY);
  return {x:(clientX-rect.left)*scaleX, y:(clientY-rect.top)*scaleY};
}
canvas.addEventListener('pointerdown', e=>{
  if(gameOver) return;
  const {x,y}=getCanvasPos(e);
  if(isOnPath(x,y)) return;
  const cost={cannon:50,laser:80,sniper:120}[selectedTower];
  if(gold<cost) return;
  towers.push({x,y,type:selectedTower,range:selectedTower==='sniper'?300:180,damage:selectedTower==='sniper'?60:selectedTower==='laser'?25:40,fireRate:selectedTower==='sniper'?1.2:selectedTower==='laser'?0.2:0.8,lastFire:0});
  gold-=cost; updateUI();
});

function isOnPath(x,y){
 for(let i=0;i<path.length-1;i++){
  const a=path[i], b=path[i+1];
  const d=Math.abs((b.y-a.y)*x-(b.x-a.x)*y+a.x*b.y-a.y*b.x)/Math.hypot(b.y-a.y,b.x-a.x);
  if(d<pathWidth/2) return true;
 }
 return false;
}

function spawnWave(){
  const isBoss = wave %4===0;
  stage = wave;
  stageEl.textContent = stage;
  waveEl.textContent = wave;
  if(isBoss){
    bossIndicator.textContent = '보스전!';
    bossIndicator.style.color = '#ff4c4c';
    bossIndicator.style.fontWeight = 'bold';
    showMessage(`스테이지 ${wave} 보스전 시작!`);
    setTimeout(()=>enemies.push({x:path[0].x,y:path[0].y,pathIndex:0,health:800+wave*100,speed:0.3,maxHealth:800+wave*100,isBoss:true,bossDamage:15}), 500);
  }else{
    bossIndicator.textContent = '';
    const count=5+wave*2;
    for(let i=0;i<count;i++){
      setTimeout(()=>enemies.push({x:path[0].x,y:path[0].y,pathIndex:0,health:100+wave*20,speed:0.6+wave*0.05,maxHealth:100+wave*20,isBoss:false}), i*600);
    }
    showMessage(`스테이지 ${wave} 파도 시작`);
  }
  wave++;
}

function updateUI(){healthEl.textContent=health; goldEl.textContent=gold;}

function showMessage(t){messageEl.textContent=t; setTimeout(()=>messageEl.textContent='',3000);}

let last=0;
function loop(ts){
 requestAnimationFrame(loop);
 const dt=Math.min(32,ts-last)/16.666; last=ts;
 if(gameOver) return;
 ctx.clearRect(0,0,canvas.width,canvas.height);
 drawPath();
 towers.forEach(t=>{drawTower(t); t.lastFire+=dt; if(t.lastFire>=t.fireRate){const target=enemies.find(e=>dist(t.x,t.y,e.x,e.y)<t.range); if(target){bullets.push({x:t.x,y:t.y,tx:target.x,ty:target.y,speed:12,damage:t.damage,type:t.type}); t.lastFire=0;}}});
 enemies.forEach(e=>{moveEnemy(e); drawEnemy(e);});
  bullets.forEach((b,i)=>{b.x+=(b.tx-b.x)*0.15; b.y+=(b.ty-b.y)*0.15; drawBullet(b); if(dist(b.x,b.y,b.tx,b.ty)<10){enemies.forEach(en=>{if(en===findTarget(b)){} }); const target=enemies.find(en=>dist(b.x,b.y,en.x,en.y)<20); if(target){target.health-=b.damage; particles.push({x:target.x,y:target.y,life:20}); if(target.health<=0){gold+= target.isBoss? 200+wave*20 : 10+wave*2; updateUI(); if(target.isBoss){showMessage('보스 처치!'); bossIndicator.textContent='';} enemies.splice(enemies.indexOf(target),1);} bullets.splice(i,1);} }});
 particles.forEach((p,i)=>{p.life--; p.y-=1; ctx.fillStyle='#fffd'; ctx.fillRect(p.x,p.y,3,3); if(p.life<=0) particles.splice(i,1);});
  enemies.forEach(e=>{if(e.pathIndex>=path.length-1){const dmg=e.isBoss?(e.bossDamage||15):1; health-=dmg; updateUI(); enemies.splice(enemies.indexOf(e),1); if(health<=0){gameOver=true; showMessage('게임 오버');}}});
 if(enemies.length===0 && ts-lastWaveTime>3000){lastWaveTime=ts; spawnWave();}
}

function drawPath(){
 ctx.fillStyle='#1a2332'; ctx.fillRect(0,0,canvas.width,canvas.height);
 ctx.strokeStyle='#2a3a4f'; ctx.lineWidth=pathWidth; ctx.beginPath();
 ctx.moveTo(path[0].x,path[0].y); path.slice(1).forEach(p=>ctx.lineTo(p.x,p.y)); ctx.stroke();
 ctx.fillStyle='#0f172a'; ctx.lineWidth=pathWidth-20; ctx.beginPath(); ctx.moveTo(path[0].x,path[0].y); path.slice(1).forEach(p=>ctx.lineTo(p.x,p.y)); ctx.stroke();
}

function drawTower(t){
 ctx.fillStyle=t.type==='cannon'?'#e67e22':t.type==='laser'?'#e74c3c':'#9b59b6';
 ctx.beginPath(); ctx.arc(t.x,t.y,18,0,Math.PI*2); ctx.fill();
 ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.arc(t.x,t.y,t.range,0,Math.PI*2); ctx.stroke();
}

function drawEnemy(e){
  const hpRatio=e.health/e.maxHealth;
  const isBoss=e.isBoss;
  const radius=isBoss?28:16;
  ctx.fillStyle=isBoss? '#ff6b6b' : (hpRatio>0.5?'#e74c3c':hpRatio>0.25?'#f1c40f':'#c0392b');
  ctx.beginPath(); ctx.arc(e.x,e.y,radius,0,Math.PI*2); ctx.fill();
  if(isBoss){
    ctx.strokeStyle='#fff'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(e.x,e.y,radius+4,0,Math.PI*2); ctx.stroke();
  }
  ctx.fillStyle='#000'; ctx.fillRect(e.x-18,e.y-36,36,6);
  ctx.fillStyle=hpRatio>0.5?'#27ae60':'#e74c3c'; ctx.fillRect(e.x-18,e.y-36,36*hpRatio,6);
}

function drawBullet(b){
 ctx.fillStyle=b.type==='laser'?'#7cf':'#fff';
 ctx.beginPath(); ctx.arc(b.x,b.y,4,0,Math.PI*2); ctx.fill();
}

function moveEnemy(e){
 if(e.pathIndex>=path.length-1) return;
 const target=path[e.pathIndex+1];
 const dx=target.x-e.x, dy=target.y-e.y;
 const dist=Math.hypot(dx,dy);
 if(dist<2){e.pathIndex++;} else {e.x+=dx/dist*e.speed; e.y+=dy/dist*e.speed;}
}

function dist(x1,y1,x2,y2){return Math.hypot(x1-x2,y1-y2);}
function findTarget(b){return enemies.find(e=>dist(b.x,b.y,e.x,e.y)<30);}

spawnWave();
requestAnimationFrame(loop);
