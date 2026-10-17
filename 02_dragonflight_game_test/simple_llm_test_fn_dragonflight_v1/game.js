// Dragon Flight - vertical scrolling shooter
(function(){
'use strict';
var canvas = document.getElementById('game');
var ctx = canvas.getContext('2d');

var W = 480, H = 800;
canvas.width = W; canvas.height = H;

var FONT = '"Comic Sans MS","Chalkboard Sign","Segoe UI",sans-serif';

// ---------- helpers ----------
function rand(a,b){return a+Math.random()*(b-a);}
function clamp(v,a,b){return v<a?a:v>b?b:v;}
function dist2(x1,y1,x2,y2){var dx=x1-x2,dy=y1-y2;return dx*dx+dy*dy;}

// ---------- state ----------
var STATE = 0; // 0=title,1=playing,2=gameover
var game = null;
var bestScore = 0;
var frame = 0;

// ---------- input ----------
var keys = {};
var mouseX = W/2;
var usingMouse = false;

window.addEventListener('keydown',function(e){keys[e.key]=true;});
window.addEventListener('keyup',function(e){keys[e.key]=false;});
canvas.addEventListener('mousemove',function(e){
  var r=canvas.getBoundingClientRect();
  mouseX = (e.clientX-r.left)*(W/r.width);
  usingMouse = true;
});
canvas.addEventListener('click',function(e){ if(STATE===0||STATE===2) startGame(); });

// ---------- player ----------
var player;
function newPlayer(){
  return {
    x: W/2, y: H-90, r: 18, speed: 340, hp: 1,
    fireCd: 0, fireRate: 0.16, level: 1, shield: 0, magnet: 0,
    invuln: 0
  };
}

// ---------- game object factory ----------
function startGame(){
  player = newPlayer();
  game = {
    scrollSpeed: 140, distance: 0, score: 0, kills: 0, coins: 0,
    enemies: [], meteors: [], bullets: [], pickups: [], particles: [], floats: [], warnings: [], bgStars: []
  };
  game.meteors = game.meteors || [];
  for(var i=0;i<60;i++) game.bgStars.push({x:rand(0,W),y:rand(0,H),s:rand(1,2.4),v:rand(30,90)});
  game.waveTimer = 0;
  game.meteorTimer = rand(3,5);
  game.bossNextDist = 800;
  game.nextBossWave = 1;
  STATE = 1;
}

// ---------- waves ----------
function spawnWave(){
  var diff = 1 + Math.floor(game.distance/400); // difficulty tier
  var cols = clamp(5 + Math.floor(diff*0.3), 5, 9);
  var gap = W/(cols+1);
  var hpBase = 2 + Math.floor(diff*0.4);
  var yStart = -60;
  for(var i=1;i<=cols;i++){
    if(Math.random()<0.15) continue; // random gaps
    var x = gap*i;
    var hp = hpBase + (Math.random()<0.2?1:0);
    game.enemies.push({x:x, y:yStart - rand(0,40), r:18, hp:hp, maxHp:hp, speed: game.scrollSpeed*0.55 + rand(-6,10), color: pickEnemyColor(diff)});
  }
}

function pickEnemyColor(diff){
  var palette = ['#e74c3c','#9b59b6','#f2784b','#8e44ad','#ff5e5e'];
  return palette[Math.floor(Math.random()*palette.length)];
}

// ---------- boss ----------
function spawnBoss(){
  var tier = game.nextBossWave;
  game.nextBossWave++;
  var hp = 25 + tier*10;
  game.enemies.push({x:W/2, y:-80, r:60, hp:hp, maxHp:hp, speed: 40, color:'#c0392b', boss:true});
  game.bosses = (game.bosses||0)+1;
}

// ---------- meteors ----------
function spawnMeteor(){
  // warning first on a random column band
  var cx = rand(60, W-60);
  var w = {x:cx, y:-20, life:1.4, warned:false};
  game.warnings.push(w);
}

// ---------- pickups ----------
function spawnPickupDrop(x,y){
  var r=Math.random();
  if(r<0.35) game.pickups.push({x:x,y:y,type:'coin',vy:-20});
  else if(r<0.45) game.pickups.push({x:x,y:y,type:'power',vy:-20});
  else if(r<0.52) game.pickups.push({x:x,y:y,type:'magnet',vy:-20});
  else if(r<0.58) game.pickups.push({x:x,y:y,type:'shield',vy:-20});
}

// ---------- bullets ----------
function fireBullets(){
  var lv = player.level;
  var dmg = 1 + Math.floor((lv-1)/2);
  var spread = (lv>=4?3:lv>=2?2:1);
  if(spread===1){
    game.bullets.push({x:player.x, y:player.y-player.r-4, vy:-680, dmg:dmg});
  }else if(spread===2){
    game.bullets.push({x:player.x-8, y:player.y-player.r, vy:-680, dmg:dmg});
    game.bullets.push({x:player.x+8, y:player.y-player.r, vy:-680, dmg:dmg});
  }else{
    game.bullets.push({x:player.x-12, y:player.y-player.r, vy:-650, vx:-40, dmg:dmg});
    game.bullets.push({x:player.x,     y:player.y-player.r-4, vy:-700, dmg:dmg});
    game.bullets.push({x:player.x+12, y:player.y-player.r, vy:-650, vx:40, dmg:dmg});
  }
}

// ---------- particles ----------
function burst(x,y,color,n){
  for(var i=0;i<n;i++){
    game.particles.push({x:x,y:y,vx:rand(-120,120),vy:rand(-140,60),life:rand(0.3,0.7),color:color,r:rand(1.5,3)});
  }
}

// ---------- update ----------
var last = performance.now();
function loop(now){
  var dt = Math.min(0.033,(now-last)/1000); last=now; frame++;
  if(STATE===1) update(dt);
  draw();
  requestAnimationFrame(loop);
}

function update(dt){
  // player movement
  var targetX = player.x;
  if(usingMouse){ targetX = mouseX; }
  else {
    if(keys['ArrowLeft']||keys['Left']) targetX -= player.speed*dt;
    if(keys['ArrowRight']||keys['Right']) targetX += player.speed*dt;
  }
  // always allow keyboard too: if any key pressed, override mouse
  if(keys['ArrowLeft']||keys['ArrowRight']||keys['Left']||keys['Right']){
    usingMouse=false;
    var dir=0;
    if(keys['ArrowLeft']||keys['Left'])dir-=1;
    if(keys['ArrowRight']||keys['Right'])dir+=1;
    player.x = clamp(player.x + dir*player.speed*dt, player.r, W-player.r);
  } else {
    player.x += (targetX-player.x)*Math.min(1,dt*14);
    player.x = clamp(player.x, player.r, W-player.r);
  }

  // scroll & distance
  game.distance += game.scrollSpeed*dt;
  game.score = Math.floor(game.distance/5) + game.kills*3;

  // difficulty scaling
  var tier = Math.floor(game.distance/400);
  game.scrollSpeed = 140 + tier*8;

  // waves
  game.waveTimer -= dt;
  if(game.waveTimer<=0){ spawnWave(); game.waveTimer = clamp(2.2 - tier*0.05, 0.9, 2.2); }

  // meteors
  game.meteorTimer -= dt;
  if(game.meteorTimer<=0){ spawnMeteor(); game.meteorTimer = clamp(4 - tier*0.15, 1.3, 4); }

  // boss triggers
  if(game.distance>=game.bossNextDist){ spawnBoss(); game.bossNextDist += 900 + game.nextBossWave*80; }

  // firing auto
  player.fireCd -= dt;
  if(player.fireCd<=0){ fireBullets(); player.fireCd = player.fireRate/(1+Math.floor((player.level-1)/3)*0.15); }

  // timers
  if(player.shield>0) player.shield-=dt;
  if(player.magnet>0) player.magnet-=dt;
  if(player.invuln>0) player.invuln-=dt;

  // bullets
  for(var i=game.bullets.length-1;i>=0;i--){
    var b=game.bullets[i];
    b.y += b.vy*dt;
    if(b.vx)b.x += b.vx*dt;
    if(b.y<-20) game.bullets.splice(i,1);
  }

  // warnings -> meteors
  for(var i=game.warnings.length-1;i>=0;i--){
    var w=game.warnings[i];
    w.y += game.scrollSpeed*1.4*dt;
    w.life -= dt;
    if(w.life<=0){
      // spawn actual meteor at that column
      game.meteors.push({x:w.x, y:-20, r:16, vy: 520 + tier*20});
      game.warnings.splice(i,1);
    }
  }

  // meteors fall fast
  for(var i=game.meteors.length-1;i>=0;i--){
    var m=game.meteors[i];
    m.y += m.vy*dt;
    if(m.y>H+40) game.meteors.splice(i,1);
  }

  // enemies move down
  for(var i=game.enemies.length-1;i>=0;i--){
    var e=game.enemies[i];
    e.y += e.speed*dt;
    if(e.y>H+40) game.enemies.splice(i,1);
  }

  // collisions: bullets vs enemies/meteors
  for(var i=game.bullets.length-1;i>=0;i--){
    var b=game.bullets[i]; var hit=false;
    for(var j=game.enemies.length-1;j>=0;j--){
      var e=game.enemies[j];
      if(dist2(b.x,b.y,e.x,e.y) < (e.r+4)*(e.r+4)){
        e.hp -= b.dmg; hit=true;
        burst(b.x,b.y,'#fff',3);
        if(e.hp<=0){ killEnemy(e,j); }
        break;
      }
    }
    // bullets can shoot meteors (defend)
    if(!hit){
      for(var k=game.meteors.length-1;k>=0;k--){
        var m=game.meteors[k];
        if(dist2(b.x,b.y,m.x,m.y) < (m.r+4)*(m.r+4)){
          burst(m.x,m.y,'#ffb14e',6);
          game.meteors.splice(k,1); hit=true; break;
        }
      }
    }
    if(hit) game.bullets.splice(i,1);
  }

  // enemy vs player
  for(var j=game.enemies.length-1;j>=0;j--){
    var e=game.enemies[j];
    if(dist2(player.x,player.y,e.x,e.y) < (e.r+player.r)*(e.r+player.r)){
      gameOver(); return;
    }
  }

  // meteor vs player
  for(var k=game.meteors.length-1;k>=0;k--){
    var m=game.meteors[k];
    if(dist2(player.x,player.y,m.x,m.y) < (m.r+player.r)*(m.r+player.r)){
      burst(m.x,m.y,'#ffb14e',14);
      game.meteors.splice(k,1);
      gameOver(); return;
    }
  }

  // pickups fall & collect
  for(var i=game.pickups.length-1;i>=0;i--){
    var p=game.pickups[i];
    if(player.magnet>0){
      // pull toward player
      var dx=player.x-p.x, dy=player.y-p.y;
      p.x += dx*Math.min(1,dt*4); p.y += dy*Math.min(1,dt*4);
    }else{
      p.y += (game.scrollSpeed + p.vy)*dt;
    }
    if(p.y>H+30){ game.pickups.splice(i,1); continue; }
    if(dist2(player.x,player.y,p.x,p.y) < (player.r+14)*(player.r+14)){
      applyPickup(p);
      game.pickups.splice(i,1);
    }
  }

  // particles
  for(var i=game.particles.length-1;i>=0;i--){
    var pa=game.particles[i];
    pa.x+=pa.vx*dt; pa.y+=pa.vy*dt; pa.vy+=240*dt; pa.life-=dt;
    if(pa.life<=0) game.particles.splice(i,1);
  }

  // floats
  for(var i=game.floats.length-1;i>=0;i--){
    var f=game.floats[i]; f.y-=40*dt; f.life-=dt;
    if(f.life<=0) game.floats.splice(i,1);
  }

  // bg stars scroll
  for(var i=0;i<game.bgStars.length;i++){
    var s=game.bgStars[i]; s.y += (s.v + game.scrollSpeed*0.3)*dt;
    if(s.y>H){ s.y=-2; s.x=rand(0,W); }
  }
}

function killEnemy(e,idx){
  game.kills++;
  burst(e.x,e.y,e.color,16);
  spawnPickupDrop(e.x,e.y);
  if(e.boss){
    // big reward
    for(var i=0;i<8;i++) game.pickups.push({x:e.x+rand(-40,40),y:e.y+rand(-20,20),type:'coin',vy:-20});
    game.floats.push({x:e.x,y:e.y,text:'BOSS DOWN!',life:1.6,color:'#ffd84d'});
  }else{
    game.floats.push({x:e.x,y:e.y,text:'+'+(3+Math.floor(e.maxHp/2)),life:0.9,color:'#fff'});
  }
  game.enemies.splice(idx,1);
}

function applyPickup(p){
  if(p.type==='coin'){ game.coins++; burst(p.x,p.y,'#ffd84d',6); return; }
  if(p.type==='power'){ player.level = Math.min(6, player.level+1); burst(p.x,p.y,'#3fd4ff',10); game.floats.push({x:p.x,y:p.y,text:'POWER UP!',life:1.2,color:'#3fd4ff'}); return; }
  if(p.type==='magnet'){ player.magnet = 8; burst(p.x,p.y,'#b57bff',10); game.floats.push({x:p.x,y:p.y,text:'MAGNET',life:1.2,color:'#b57bff'}); return; }
  if(p.type==='shield'){ player.shield = 6; player.invuln = 3; burst(p.x,p.y,'#6ff',10); game.floats.push({x:p.x,y:p.y,text:'SHIELD',life:1.2,color:'#6ff'}); return; }
}

function gameOver(){ STATE=2; if(game.score>bestScore) bestScore=game.score; }

// ---------- drawing ----------
function draw(){
  // background gradient
  var g = ctx.createLinearGradient(0,0,0,H);
  if(STATE===1){ g.addColorStop(0,'#1b2a55'); g.addColorStop(1,'#0e1630'); }
  else { g.addColorStop(0,'#0e1730'); g.addColorStop(1,'#070b18'); }
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);

  // stars
  if(game){
    ctx.fillStyle='#ffffff';
    for(var i=0;i<game.bgStars.length;i++){
      var s=game.bgStars[i];
      ctx.globalAlpha = clamp(s.s/2.4,0.3,1)*0.7;
      ctx.fillRect(s.x,s.y,s.s,s.s);
    }
    ctx.globalAlpha=1;
  }

  if(STATE===0){ drawTitle(); return; }
  if(STATE===2){ drawGameOverlay(); drawEntities(); return; }

  drawEntities();
  drawHud();
}

function drawEntities(){
  // warnings (warning marker on column)
  for(var i=0;i<game.warnings.length;i++){
    var w=game.warnings[i];
    ctx.save();
    ctx.globalAlpha = clamp(w.life,0.2,1);
    ctx.strokeStyle='#ff5252'; ctx.lineWidth=2;
    ctx.beginPath();
    ctx.moveTo(w.x,-4); ctx.lineTo(w.x,H*0.6);
    ctx.setLineDash([8,10]); ctx.stroke();
    ctx.setLineDash([]);
    // triangle warning icon at top
    ctx.fillStyle='#ff5252';
    ctx.beginPath();
    ctx.moveTo(w.x, 14); ctx.lineTo(w.x-12, 34); ctx.lineTo(w.x+12,34); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#fff';
    ctx.font='bold 18px '+FONT; ctx.textAlign='center';
    ctx.fillText('!', w.x, 30);
    ctx.restore();
  }

  // meteors
  for(var i=0;i<game.meteors.length;i++){
    var m=game.meteors[i];
    drawMeteor(m.x,m.y,m.r);
  }

  // enemies
  for(var i=0;i<game.enemies.length;i++){
    var e=game.enemies[i];
    drawEnemy(e);
  }

  // pickups
  for(var i=0;i<game.pickups.length;i++){
    var p=game.pickups[i];
    drawPickup(p);
  }

  // bullets
  ctx.fillStyle='#fff8b0';
  for(var i=0;i<game.bullets.length;i++){
    var b=game.bullets[i];
    ctx.fillRect(b.x-2, b.y-6, 4, 10);
  }

  // player
  if(STATE===1) drawPlayer();

  // particles
  for(var i=0;i<game.particles.length;i++){
    var pa=game.particles[i];
    ctx.globalAlpha = clamp(pa.life*2,0,1);
    ctx.fillStyle=pa.color;
    ctx.beginPath(); ctx.arc(pa.x,pa.y,pa.r,0,Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha=1;

  // floats
  for(var i=0;i<game.floats.length;i++){
    var f=game.floats[i];
    ctx.globalAlpha = clamp(f.life,0,1);
    ctx.fillStyle=f.color; ctx.font='bold 20px '+FONT; ctx.textAlign='center';
    ctx.fillText(f.text,f.x,f.y);
  }
  ctx.globalAlpha=1;
}

function drawPlayer(){
  var p=player;
  // shield ring
  if(p.shield>0){
    ctx.strokeStyle='#6ff'; ctx.lineWidth=3;
    ctx.globalAlpha = clamp(p.shield/2,0.3,1);
    ctx.beginPath(); ctx.arc(p.x,p.y,p.r+8,0,Math.PI*2); ctx.stroke();
    ctx.globalAlpha=1;
  }
  // dragon body (hand-drawn)
  ctx.save();
  ctx.translate(p.x,p.y);
  // wings
  ctx.fillStyle='#3a7d44';
  ctx.beginPath();
  ctx.moveTo(-p.r,0); ctx.lineTo(-p.r-12,-6); ctx.lineTo(-p.r-4,8); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(p.r,0); ctx.lineTo(p.r+12,-6); ctx.lineTo(p.r+4,8); ctx.closePath(); ctx.fill();
  // body
  ctx.fillStyle='#4ea85a';
  ctx.beginPath(); ctx.ellipse(0,0,p.r*0.7,p.r,0,0,Math.PI*2); ctx.fill();
  // belly
  ctx.fillStyle='#cde9b0';
  ctx.beginPath(); ctx.ellipse(0,4,p.r*0.4,p.r*0.55,0,0,Math.PI*2); ctx.fill();
  // head
  ctx.fillStyle='#4ea85a';
  ctx.beginPath(); ctx.arc(0,-p.r+2,7,0,Math.PI*2); ctx.fill();
  // eyes
  ctx.fillStyle='#fff';
  ctx.beginPath(); ctx.arc(-3,-p.r+1,2.2,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(3,-p.r+1,2.2,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#000';
  ctx.beginPath(); ctx.arc(-3,-p.r+1,1,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(3,-p.r+1,1,0,Math.PI*2); ctx.fill();
  // tail flame when powered
  if(p.level>=4){
    ctx.fillStyle='#ffb14e';
    ctx.beginPath(); ctx.moveTo(-4,p.r); ctx.lineTo(4,p.r); ctx.lineTo(0,p.r+12+Math.sin(frame*0.3)*3); ctx.closePath(); ctx.fill();
  }
  // blink invuln
  if(p.invuln>0 && (frame%8<4)){
    ctx.globalAlpha=0.4; ctx.fillStyle='#fff';
    ctx.beginPath(); ctx.ellipse(0,0,p.r*0.7,p.r,0,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=1;
  }
  ctx.restore();
}

function drawEnemy(e){
  var r=e.r;
  ctx.save(); ctx.translate(e.x,e.y);
  if(e.boss){
    // big boss dragon-ish creature
    ctx.fillStyle=e.color;
    ctx.beginPath(); ctx.ellipse(0,0,r*0.9,r,0,0,Math.PI*2); ctx.fill();
    // horns
    ctx.fillStyle='#f3d23b';
    ctx.beginPath(); ctx.moveTo(-r*0.5,-r*0.8); ctx.lineTo(-r*0.7,-r*1.3); ctx.lineTo(-r*0.3,-r*0.9); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(r*0.5,-r*0.8); ctx.lineTo(r*0.7,-r*1.3); ctx.lineTo(r*0.3,-r*0.9); ctx.closePath(); ctx.fill();
    // eyes
    ctx.fillStyle='#fff';
    ctx.beginPath(); ctx.arc(-r*0.35,-r*0.1,8,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(r*0.35,-r*0.1,8,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ffed4a';
    ctx.beginPath(); ctx.arc(-r*0.35,-r*0.1,4,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(r*0.35,-r*0.1,4,0,Math.PI*2); ctx.fill();
  }else{
    // small enemy blob with wings
    ctx.fillStyle=e.color;
    ctx.beginPath(); ctx.moveTo(-r,0); ctx.lineTo(-r-8,-4); ctx.lineTo(-r+2,6); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(r,0); ctx.lineTo(r+8,-4); ctx.lineTo(r-2,6); ctx.closePath(); ctx.fill();
    ctx.fillStyle=e.color;
    ctx.beginPath(); ctx.arc(0,0,r*0.75,0,Math.PI*2); ctx.fill();
    // belly
    ctx.fillStyle='rgba(255,255,255,0.18)';
    ctx.beginPath(); ctx.arc(0,r*0.2,r*0.4,0,Math.PI*2); ctx.fill();
    // eyes
    ctx.fillStyle='#fff';
    ctx.beginPath(); ctx.arc(-r*0.3,-r*0.15,3.4,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(r*0.3,-r*0.15,3.4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#111';
    ctx.beginPath(); ctx.arc(-r*0.3,-r*0.15,1.6,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(r*0.3,-r*0.15,1.6,0,Math.PI*2); ctx.fill();
  }
  // hp bar for tough enemies
  if(e.maxHp>2){
    var w = e.boss? r*1.4 : r*1.2;
    ctx.fillStyle='#000'; ctx.fillRect(-w/2,-r-10,w,5);
    ctx.fillStyle='#3f6'; ctx.fillRect(-w/2,-r-10,w*(e.hp/e.maxHp),5);
  }
  ctx.restore();
}

function drawMeteor(m){
  var r=m.r;
  ctx.save(); ctx.translate(m.x,m.y);
  // trail
  ctx.fillStyle='rgba(255,120,40,0.35)';
  ctx.beginPath(); ctx.moveTo(-r*0.6,-r); ctx.lineTo(r*0.6,-r); ctx.lineTo(0,-r*3); ctx.closePath(); ctx.fill();
  // rock
  ctx.fillStyle='#7c6a58';
  ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba(255,140,40,0.6)';
  ctx.beginPath(); ctx.arc(r*0.3,-r*0.3,r*0.4,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawPickup(p){
  var t=p.type;
  if(t==='coin'){
    ctx.fillStyle='#ffd84d';
    ctx.beginPath(); ctx.arc(p.x,p.y,9,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#c9a13b';
    ctx.beginPath(); ctx.arc(p.x,p.y,6,0,Math.PI*2); ctx.fill();
  }else if(t==='power'){
    ctx.save(); ctx.translate(p.x,p.y);
    ctx.rotate(Math.sin(frame*0.1)*0.3);
    ctx.fillStyle='#3fd4ff';
    ctx.beginPath();
    for(var i=0;i<6;i++){ var a=i*Math.PI/3; ctx.lineTo(Math.cos(a)*11,Math.sin(a)*11); }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle='#fff'; ctx.font='bold 14px '+FONT; ctx.textAlign='center'; ctx.fillText('P',0,5);
    ctx.restore();
  }else if(t==='magnet'){
    ctx.save(); ctx.translate(p.x,p.y);
    ctx.fillStyle='#b57bff';
    ctx.beginPath(); ctx.arc(0,2,10,Math.PI,0); ctx.fill();
    ctx.fillStyle='#fff'; ctx.fillRect(-10,-4,4,8); ctx.fillRect(6,-4,4,8);
    ctx.restore();
  }else if(t==='shield'){
    ctx.save(); ctx.translate(p.x,p.y);
    ctx.fillStyle='#5fe9a7';
    ctx.beginPath();
    ctx.moveTo(0,-12); ctx.lineTo(11,-6); ctx.lineTo(8,8); ctx.lineTo(-8,8); ctx.lineTo(-11,-6); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#fff'; ctx.font='bold 14px '+FONT; ctx.textAlign='center'; ctx.fillText('S',0,5);
    ctx.restore();
  }
}

function drawHud(){
  // top bar
  ctx.fillStyle='rgba(0,0,0,0.35)';
  ctx.fillRect(0,0,W,46);
  ctx.font='bold 20px '+FONT; ctx.textAlign='left';
  ctx.fillStyle='#fff';
  ctx.fillText('SCORE '+game.score, 12, 26);
  ctx.fillStyle='#ffd84d';
  ctx.fillText('COIN '+game.coins, W-120, 26);
  // distance bar center
  var need = game.bossNextDist - game.distance;
  ctx.fillStyle='#9ad';
  ctx.textAlign='center';
  ctx.fillText('DIST '+Math.floor(game.distance)+'m', W/2, 26);
  // mini boss countdown
  if(need<400){
    ctx.fillStyle='#ff8a5b';
    ctx.fillText('BOSS IN '+Math.ceil(need)+'m', W/2, 42);
  }
  // level pips
  for(var i=0;i<player.level;i++){
    ctx.fillStyle='#3fd4ff';
    ctx.beginPath(); ctx.arc(16+i*12, H-18, 4, 0, Math.PI*2); ctx.fill();
  }
  // magnet/shield timers
  if(player.magnet>0){ ctx.fillStyle='#b57bff'; ctx.fillRect(W-90,H-22,player.magnet/8*60,6); }
  if(player.shield>0){ ctx.fillStyle='#5fe9a7'; ctx.fillRect(W-160,H-22,player.shield/6*60,6); }
}

function drawTitle(){
  // title card with dragon preview
  ctx.textAlign='center';
  ctx.font='bold 48px '+FONT;
  var grad = ctx.createLinearGradient(0,200,0,300);
  grad.addColorStop(0,'#ffd84d'); grad.addColorStop(1,'#ff7b5b');
  ctx.fillStyle=grad;
  ctx.fillText('DRAGON', W/2, 260);
  ctx.fillText('FLIGHT', W/2, 320);
  // dragon preview
  var savePlayer = player; player = {x:W/2,y:470,r:22,speed:0,fireCd:0,level:1,shield:0,magnet:0,invuln:0};
  drawPlayer();
  player = savePlayer;
  ctx.fillStyle='#fff';
  ctx.font='bold 22px '+FONT;
  ctx.fillText('CLICK TO START', W/2, 560);
  ctx.font='16px '+FONT;
  ctx.fillStyle='#9ad';
  ctx.fillText('Move: \u2190/\u2192 or Mouse', W/2, 620);
  ctx.fillText('Auto-fire. Collect coins & items.', W/2, 645);
  if(bestScore>0){
    ctx.fillStyle='#ffd84d';
    ctx.font='bold 18px '+FONT;
    ctx.fillText('BEST: '+bestScore, W/2, 700);
  }
}

function drawGameOverlay(){
  // dim
  ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(0,0,W,H);
  ctx.textAlign='center';
  ctx.font='bold 44px '+FONT;
  ctx.fillStyle='#ff5252';
  ctx.fillText('GAME OVER', W/2, 300);
  ctx.font='bold 26px '+FONT;
  ctx.fillStyle='#fff';
  ctx.fillText('SCORE: '+game.score, W/2, 380);
  ctx.fillStyle='#ffd84d';
  ctx.fillText('BEST: '+bestScore, W/2, 420);
  ctx.font='bold 20px '+FONT;
  ctx.fillStyle='#fff';
  ctx.fillText('CLICK TO RETRY', W/2, 500);
}

// ---------- start loop ----------
requestAnimationFrame(function(t){loop(t);});

})();
