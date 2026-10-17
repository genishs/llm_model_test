"use strict";
/* ============================================================
 * Dragon Flight - core engine
 * ============================================================ */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// logical (internal) resolution
const LW = 420, LH = 740;
let scale = 1;

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const ww = window.innerWidth, wh = window.innerHeight;
  scale = Math.min(ww / LW, wh / LH);
  canvas.style.width  = Math.floor(LW * scale) + "px";
  canvas.style.height = Math.floor(LH * scale) + "px";
  canvas.width  = Math.floor(LW * scale * dpr);
  canvas.height = Math.floor(LH * scale * dpr);
}
window.addEventListener("resize", resize);
resize();

function toLogical(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (clientX - r.left) / r.width * LW,
    y: (clientY - r.top)  / r.height * LH
  };
}

// ---------------- helpers ----------------
const rand  = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
const lerp  = (a, b, t) => a + (b - a) * t;
const dist2 = (x1, y1, x2, y2) => { const dx = x2 - x1, dy = y2 - y1; return dx * dx + dy * dy; };
const pick  = arr => arr[Math.floor(Math.random() * arr.length)];

// ---------------- game state ----------------
const STATE = { MENU: 0, PLAY: 1, OVER: 2 };
let state = STATE.MENU;
let score = 0, coins = 0, distance = 0;
let kills = 0, bossKills = 0, bestScore = 0;
let level = 1;               // difficulty level (boss stage)
let worldSpeed = 130;        // base scroll speed px/s
let shakeT = 0, shakeAmp = 0;
let slowMoT = 0;

function startGame() {
  state = STATE.PLAY;
  score = 0; coins = 0; distance = 0;
  kills = 0; bossKills = 0; level = 1;
  worldSpeed = 130;
  player.x = LW / 2; player.y = LH - 90;
  player.hp = 3; player.shield = 0; player.magnet = 0;
  player.power = 1; player.fireCd = 0; player.invuln = 1.2;
  player.dead = false;
  enemies.length = 0;
  playerBullets.length = 0;
  enemyBullets.length = 0;
  coinsArr.length = 0;
  itemsArr.length = 0;
  meteors.length = 0;
  meteorWarns.length = 0;
  particles.length = 0;
  texts.length = 0;
  boss = null;
  bossActive = false;
  nextBossDistance = 1200;
  waveTimer = 0;
  meteorTimer = 2.5;
  itemTimer = 6;
  banner = null;
  showBanner("LEVEL 1", 1.6);
  if (Sound) Sound.ensure();
}

function showBanner(text, t) { banner = { text, t, max: t }; }
function shake(amp, t) { shakeAmp = Math.max(shakeAmp, amp); shakeT = Math.max(shakeT, t); }

function gameOver() {
  state = STATE.OVER;
  if (score > bestScore) bestScore = score;
  if (Sound) { Sound.ensure(); Sound.jingle(false); }
}

// ---------------- player ----------------
const player = {
  x: LW / 2, y: LH - 90,
  r: 14,
  hp: 3, maxHp: 3,
  shield: 0,       // shield seconds
  magnet: 0,       // magnet seconds
  power: 1,        // 1..3
  fireCd: 0,
  invuln: 0,
  dead: false,
  wingT: 0
};

// ---------------- input ----------------
const keys = { left: false, right: false };
let pointerActive = false, pointerX = LW / 2, pointerY = LH - 90;
let touchDrag = null; // { id, lastX }

// relative drag control for touch: finger drag distance maps 1:1 to player
const isTouchPointertype = (e) => (e.pointerType || "").toLowerCase() === "touch";

function startTouchDrag(e) {
  if (touchDrag) return;
  touchDrag = { id: e.pointerId, lastX: e.clientX };
}
function onTouchDragMove(e) {
  if (!touchDrag || e.pointerId !== touchDrag.id) return;
  const dx = e.clientX - touchDrag.lastX;
  touchDrag.lastX = e.clientX;
  // convert client px to logical px and apply directly to player position
  if (state === STATE.PLAY && !player.dead) {
    const rect = canvas.getBoundingClientRect();
    const dxLogical = dx * (LW / rect.width);
    player.x = clamp(player.x + dxLogical, 20, LW - 20);
  }
}
function endTouchDrag(e) {
  if (touchDrag && e.pointerId === touchDrag.id) touchDrag = null;
}

window.addEventListener("keydown", e => {
  if (e.code === "ArrowLeft"  || e.code === "KeyA") keys.left = true;
  if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = true;
  if (state !== STATE.PLAY && (e.code === "Enter" || e.code === "Space")) { e.preventDefault(); startGame(); }
});
window.addEventListener("keyup", e => {
  if (e.code === "ArrowLeft"  || e.code === "KeyA") keys.left = false;
  if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = false;
});

function pointerPos(e) {
  const t = toLogical(e.touches ? e.touches[0].clientX : e.clientX,
                      e.touches ? e.touches[0].clientY : e.clientY);
  return t;
}
canvas.addEventListener("pointerdown", e => {
  if (state !== STATE.PLAY) { startGame(); return; }
  if (isTouchPointertype(e)) {
    // touch: relative drag control
    e.preventDefault();
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    startTouchDrag(e);
  } else {
    // mouse: follow the pointer
    pointerActive = true;
    const p = pointerPos(e); pointerX = p.x; pointerY = p.y;
  }
});
canvas.addEventListener("pointermove", e => {
  if (state !== STATE.PLAY) return;
  if (isTouchPointertype(e)) {
    onTouchDragMove(e);
    return;
  }
  if (!pointerActive) return;
  const p = pointerPos(e); pointerX = p.x; pointerY = p.y;
});
canvas.addEventListener("pointerup", e => {
  if (isTouchPointertype(e)) endTouchDrag(e); else pointerActive = false;
});
canvas.addEventListener("pointercancel", e => {
  if (isTouchPointertype(e)) endTouchDrag(e); else pointerActive = false;
});
canvas.addEventListener("pointerleave", e => {
  if (isTouchPointertype(e)) endTouchDrag(e); else pointerActive = false;
});

// ---------------- entity arrays ----------------
const playerBullets = [];
const enemyBullets = [];
const enemies = [];
const coinsArr = [];
const itemsArr = [];
const meteors = [];
const meteorWarns = [];
const particles = [];
const texts = [];

let boss = null;
let bossActive = false;
let nextBossDistance = 1200;
let waveTimer = 0;
let meteorTimer = 2.5;
let itemTimer = 6;
let banner = null;

// ---------------- difficulty ----------------
function enemyHpMult() { return 1 + (level - 1) * 0.45 + distance / 9000; }
function enemySpeed()  { return worldSpeed * (0.9 + Math.random() * 0.4); }
function currentSpeed(){ return worldSpeed + level * 6; }

// ============================================================
// spawning
// ============================================================
const ENEMY_TYPES = {
  grunt: { hp: 2, r: 16, speed: 1,  score: 50,  color: "#8a4b2a", coin: 1 },
  dart:  { hp: 1, r: 12, speed: 1.9, score: 80,  color: "#3f7fbf", coin: 1 },
  tank:  { hp: 6, r: 22, speed: 0.55,score: 150, color: "#5a4a8a", coin: 2 },
  shooter:{hp: 3, r: 17, speed: 0.8, score: 120, color: "#2f8a6a", coin: 2 }
};

function spawnWave() {
  if (bossActive) return;
  const rowY = -40;
  const count = clamp(2 + Math.floor(level / 1.5) + randi(0, 2), 2, 6);
  const gap = (LW - 80) / count;
  for (let i = 0; i < count; i++) {
    const x = 50 + gap * (i + 0.5) + rand(-8, 8);
    let type;
    const roll = Math.random();
    if (level >= 3 && roll < 0.12) type = "tank";
    else if (level >= 2 && roll < 0.35) type = "shooter";
    else if (roll < 0.55) type = "dart";
    else type = "grunt";
    const t = ENEMY_TYPES[type];
    enemies.push({
      type, x, y: rowY - i * 6,
      r: t.r,
      hp: Math.max(1, Math.round(t.hp * enemyHpMult())),
      maxHp: Math.max(1, Math.round(t.hp * enemyHpMult())),
      speed: enemySpeed() * t.speed,
      vx: rand(-15, 15),
      phase: rand(0, Math.PI * 2),
      fireT: rand(1, 3),
      color: t.color,
      score: t.score,
      coin: t.coin,
      flash: 0
    });
  }
}

function spawnBoss() {
  bossActive = true;
  const hp = 60 + level * 40;
  boss = {
    x: LW / 2, y: -80, targetY: 110,
    r: 46,
    hp, maxHp: hp,
    phase: rand(0, Math.PI * 2),
    state: "enter",     // enter -> fight
    stateT: 0,
    fireT: 1.2,
    flash: 0
  };
  showBanner("BOSS", 1.6);
  shake(6, 0.5);
  if (Sound) Sound.jingle(true);
}

// ============================================================
// update
// ============================================================
let lastT = performance.now();

function update(dt) {
  // global timers
  if (shakeT > 0) shakeT -= dt;
  if (slowMoT > 0) slowMoT -= dt;
  if (banner) { banner.t -= dt; if (banner.t <= 0) banner = null; }

  if (state !== STATE.PLAY) return;

  const spd = currentSpeed();
  distance += spd * dt;

  // difficulty scaling
  worldSpeed = 130 + Math.floor(distance / 800) * 4;

  // boss trigger
  if (!bossActive && distance >= nextBossDistance) {
    spawnBoss();
    nextBossDistance += 1400 + level * 200;
  }

  // level up per boss stage
  // (level increments when boss dies)

  // wave spawning
  waveTimer -= dt;
  if (waveTimer <= 0 && !bossActive) {
    spawnWave();
    waveTimer = Math.max(0.9, 2.4 - level * 0.15);
  }

  // meteors
  meteorTimer -= dt;
  if (meteorTimer <= 0) {
    const x = rand(30, LW - 30);
    meteorWarns.push({ x, t: 1.0, max: 1.0 });
    meteorTimer = Math.max(0.8, 2.2 - level * 0.12) * rand(0.7, 1.3);
  }
  for (let i = meteorWarns.length - 1; i >= 0; i--) {
    const w = meteorWarns[i];
    w.t -= dt;
    if (w.t <= 0) {
      meteorWarns.splice(i, 1);
      meteors.push({ x: w.x, y: -30, r: rand(16, 26), vy: 240 + level * 12, vx: rand(-20, 20), spin: rand(0, 6.28) });
    }
  }
  for (let i = meteors.length - 1; i >= 0; i--) {
    const m = meteors[i];
    m.y += m.vy * dt; m.x += m.vx * dt; m.spin += dt * 2;
    if (m.y > LH + 40) { meteors.splice(i, 1); continue; }
    if (!player.dead && dist2(m.x, m.y, player.x, player.y) < (m.r + player.r) * (m.r + player.r) * 0.72) {
      meteors.splice(i, 1);
      hitPlayer(1, m.x);
    }
  }

  updatePlayer(dt);
  updateBullets(dt);
  updateEnemies(dt);
  updateBoss(dt);
  updatePickups(dt);
  updateParticles(dt);

  // score from distance
  score += spd * dt * 0.1;
}

function updatePlayer(dt) {
  player.wingT += dt * 10;
  if (player.dead) return;

  // input
  let vx = 0;
  if (keys.left) vx -= 340;
  if (keys.right) vx += 340;
  if (pointerActive) {
    const dx = pointerX - player.x;
    vx = clamp(dx * 12, -420, 420);
  }
  player.x = clamp(player.x + vx * dt, 20, LW - 20);

  // timers
  if (player.shield > 0) player.shield -= dt;
  if (player.magnet > 0) player.magnet -= dt;
  if (player.invuln > 0) player.invuln -= dt;

  // auto fire
  player.fireCd -= dt;
  if (player.fireCd <= 0) {
    firePlayer();
    player.fireCd = player.power >= 3 ? 0.11 : 0.16;
  }

  // collision with enemies
  if (player.invuln <= 0) {
    for (const e of enemies) {
      if (e.hp <= 0) continue;
      if (dist2(e.x, e.y, player.x, player.y) < (e.r + player.r) * (e.r + player.r) * 0.7) {
        hitPlayer(1, e.x);
        break;
      }
    }
    for (const b of enemyBullets) {
      if (b.dead) continue;
      if (dist2(b.x, b.y, player.x, player.y) < (b.r + player.r) * (b.r + player.r)) {
        b.dead = true;
        hitPlayer(1, b.x);
        break;
      }
    }
  }
}

function hitPlayer(dmg, fromX) {
  if (player.dead) return;
  if (player.shield > 0) {
    player.shield = 0;
    explode(player.x, player.y, "#66ccff", 14, 3);
    player.invuln = 1.0;
    if (Sound) Sound.hit(0.4);
    return;
  }
  player.hp -= dmg;
  player.invuln = 1.4;
  shake(7, 0.35);
  explode(player.x, player.y, "#ff8866", 18, 4);
  if (Sound) Sound.hit(1);
  if (player.hp <= 0) {
    player.dead = true;
    explode(player.x, player.y, "#ffcc44", 40, 6);
    shake(12, 0.8);
    slowMoT = 0.6;
    setTimeout(() => { if (player.dead) gameOver(); }, 900);
  }
}

function firePlayer() {
  const px = player.x, py = player.y - 18;
  const mk = (x, y, vx, vy) => playerBullets.push({ x, y, vx, vy, r: 5, dmg: 1, life: 2 });
  if (player.power === 1) {
    mk(px, py, 0, -560);
  } else if (player.power === 2) {
    mk(px - 8, py, -40, -560);
    mk(px + 8, py, 40, -560);
  } else {
    mk(px, py - 6, 0, -580);
    mk(px - 10, py, -90, -540);
    mk(px + 10, py, 90, -540);
  }
  if (Sound) Sound.shoot();
}

function updateBullets(dt) {
  for (let i = playerBullets.length - 1; i >= 0; i--) {
    const b = playerBullets[i];
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.life <= 0 || b.y < -20 || b.x < -20 || b.x > LW + 20) { playerBullets.splice(i, 1); continue; }
    // hit enemy
    let hit = false;
    for (const e of enemies) {
      if (e.hp <= 0) continue;
      if (dist2(b.x, b.y, e.x, e.y) < (b.r + e.r) * (b.r + e.r) * 0.8) {
        e.hp -= b.dmg; e.flash = 0.1;
        spark(b.x, b.y, "#ffe28a");
        hit = true;
        if (e.hp <= 0) killEnemy(e);
        break;
      }
    }
    // hit boss
    if (!hit && boss && boss.state === "fight" && dist2(b.x, b.y, boss.x, boss.y) < (b.r + boss.r) * (b.r + boss.r) * 0.85) {
      boss.hp -= b.dmg; boss.flash = 0.08;
      spark(b.x, b.y, "#ffd28a");
      hit = true;
      if (boss.hp <= 0) killBoss();
    }
    if (hit) playerBullets.splice(i, 1);
  }

  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.life <= 0 || b.y > LH + 20 || b.y < -20 || b.x < -20 || b.x > LW + 20) enemyBullets.splice(i, 1);
  }
}

function killEnemy(e) {
  kills++;
  score += e.score;
  explode(e.x, e.y, e.color, 12, 3);
  // drop coins
  for (let i = 0; i < e.coin; i++) {
    coinsArr.push({ x: e.x + rand(-10, 10), y: e.y + rand(-10, 10), vx: rand(-60, 60), vy: rand(-120, -20), r: 7, t: 0 });
  }
  // chance item
  if (Math.random() < 0.07) {
    const kind = pick(["power", "magnet", "shield", "heal"]);
    itemsArr.push({ x: e.x, y: e.y, vy: -60, kind, t: 0, r: 12 });
  }
  if (Sound) Sound.kill();
}

function killBoss() {
  bossKills++;
  level++;
  score += 1000 + level * 200;
  explode(boss.x, boss.y, "#ffaa33", 50, 7);
  explode(boss.x, boss.y, "#ffffff", 30, 5);
  shake(10, 0.7);
  // loot
  for (let i = 0; i < 12; i++) coinsArr.push({ x: boss.x + rand(-30, 30), y: boss.y + rand(-20, 20), vx: rand(-120, 120), vy: rand(-160, -40), r: 7, t: 0 });
  itemsArr.push({ x: boss.x, y: boss.y, vy: -60, kind: pick(["power", "heal", "shield"]), t: 0, r: 12 });
  boss = null;
  bossActive = false;
  showBanner("LEVEL " + level, 1.8);
  if (Sound) Sound.jingle(true);
}

function updateEnemies(dt) {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.phase += dt;
    e.x += e.vx * dt + Math.sin(e.phase * 1.3) * 20 * dt;
    e.y += e.speed * dt;
    if (e.flash > 0) e.flash -= dt;
    // shooter fires
    if (e.type === "shooter" && e.y > 0 && e.y < LH - 200) {
      e.fireT -= dt;
      if (e.fireT <= 0) {
        e.fireT = rand(1.6, 2.8);
        const ang = Math.atan2(player.y - e.y, player.x - e.x);
        enemyBullets.push({ x: e.x, y: e.y, vx: Math.cos(ang) * 170, vy: Math.sin(ang) * 170, r: 6, life: 4, color: "#66ddaa" });
      }
    }
    if (e.hp <= 0) { enemies.splice(i, 1); continue; }
    if (e.y > LH + 40) { enemies.splice(i, 1); }
  }
}

function updateBoss(dt) {
  if (!boss) return;
  boss.stateT += dt;
  if (boss.flash > 0) boss.flash -= dt;
  if (boss.state === "enter") {
    boss.y = lerp(boss.y, boss.targetY, dt * 2.2);
    if (Math.abs(boss.y - boss.targetY) < 2) boss.state = "fight";
    return;
  }
  // fight: sine movement
  boss.phase += dt * 0.9;
  boss.x = LW / 2 + Math.sin(boss.phase) * 120;
  boss.y = boss.targetY + Math.sin(boss.phase * 2) * 18;

  // attacks
  boss.fireT -= dt;
  if (boss.fireT <= 0) {
    const mode = Math.floor(boss.stateT / 5) % 3;
    if (mode === 0) {
      // radial burst
      boss.fireT = 1.4;
      const n = 14;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + boss.phase;
        enemyBullets.push({ x: boss.x, y: boss.y, vx: Math.cos(a) * 150, vy: Math.sin(a) * 150, r: 6, life: 4, color: "#ff8866" });
      }
    } else if (mode === 1) {
      // aimed triple
      boss.fireT = 0.8;
      const ang = Math.atan2(player.y - boss.y, player.x - boss.x);
      for (let k = -1; k <= 1; k++) {
        const a = ang + k * 0.25;
        enemyBullets.push({ x: boss.x, y: boss.y + 20, vx: Math.cos(a) * 210, vy: Math.sin(a) * 210, r: 7, life: 4, color: "#ffcc44" });
      }
    } else {
      // spawn dart minions
      boss.fireT = 2.2;
      if (enemies.length < 10) {
        for (let k = 0; k < 2; k++) {
          const t = ENEMY_TYPES.dart;
          enemies.push({
            type: "dart", x: boss.x + rand(-40, 40), y: boss.y + 30, r: t.r,
            hp: Math.max(1, Math.round(t.hp * enemyHpMult())), maxHp: 2,
            speed: enemySpeed() * t.speed, vx: rand(-20, 20),
            phase: rand(0, 6.28), fireT: 99, color: t.color, score: t.score, coin: t.coin, flash: 0
          });
        }
      }
    }
    if (Sound) Sound.enemyShoot();
  }
  // boss body collision
  if (!player.dead && player.invuln <= 0 && dist2(boss.x, boss.y, player.x, player.y) < (boss.r + player.r) * (boss.r + player.r) * 0.7) {
    hitPlayer(1, boss.x);
  }
}

function updatePickups(dt) {
  for (let i = coinsArr.length - 1; i >= 0; i--) {
    const c = coinsArr[i];
    c.t += dt;
    // magnet
    if (player.magnet > 0 && !player.dead) {
      const d2 = dist2(c.x, c.y, player.x, player.y);
      if (d2 < 220 * 220) {
        const d = Math.sqrt(d2) || 1;
        c.x += (player.x - c.x) / d * 500 * dt;
        c.y += (player.y - c.y) / d * 500 * dt;
      }
    } else {
      c.vy += 300 * dt;
      c.vy = clamp(c.vy, -160, 260);
      c.x += c.vx * dt; c.y += c.vy * dt;
    }
    if (!player.dead && dist2(c.x, c.y, player.x, player.y) < 26 * 26) {
      coinsArr.splice(i, 1);
      coins++;
      score += 10;
      spark(player.x, player.y, "#ffd700");
      if (Sound) Sound.coin();
      continue;
    }
    if (c.y > LH + 20) coinsArr.splice(i, 1);
  }

  for (let i = itemsArr.length - 1; i >= 0; i--) {
    const it = itemsArr[i];
    it.t += dt;
    it.y += it.vy * dt;
    it.vy = clamp(it.vy + 120 * dt, -80, 160);
    if (!player.dead && dist2(it.x, it.y, player.x, player.y) < 30 * 30) {
      itemsArr.splice(i, 1);
      applyItem(it.kind);
      continue;
    }
    if (it.y > LH + 20) itemsArr.splice(i, 1);
  }
}

function applyItem(kind) {
  if (Sound) Sound.item();
  if (kind === "power") {
    player.power = clamp(player.power + 1, 1, 3);
    addText(player.x, player.y - 30, "POWER UP!", "#ffcc44");
  } else if (kind === "magnet") {
    player.magnet = 8;
    addText(player.x, player.y - 30, "MAGNET", "#44ccff");
  } else if (kind === "shield") {
    player.shield = 6;
    addText(player.x, player.y - 30, "SHIELD", "#66aaff");
  } else if (kind === "heal") {
    player.hp = clamp(player.hp + 1, 0, player.maxHp);
    addText(player.x, player.y - 30, "HEAL", "#66ff88");
  }
  explode(player.x, player.y, "#ffffff", 10, 2);
}

function addText(x, y, text, color) { texts.push({ x, y, text, color, t: 1.2 }); }

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.t -= dt;
    if (p.t <= 0) { particles.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vy += (p.grav || 0) * dt;
  }
  for (let i = texts.length - 1; i >= 0; i--) {
    const t = texts[i];
    t.t -= dt; t.y -= 30 * dt;
    if (t.t <= 0) texts.splice(i, 1);
  }
}

// particle helpers
function explode(x, y, color, n, size) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2), s = rand(40, 180);
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: rand(0.3, 0.7), max: 0.7, color, r: rand(1, size || 3), grav: 60 });
  }
}
function spark(x, y, color) {
  for (let i = 0; i < 4; i++) {
    const a = rand(0, Math.PI * 2), s = rand(30, 90);
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0.25, max: 0.25, color, r: 2, grav: 0 });
  }
}

// ============================================================
// render
// ============================================================
let bgOffset = 0;
const stars = [];
for (let i = 0; i < 90; i++) {
  stars.push({ x: Math.random() * LW, y: Math.random() * LH, r: rand(0.5, 1.8), s: rand(20, 90), tw: rand(0, 6.28) });
}

function render(time) {
  const sx = (Math.random() - 0.5) * shakeAmp * (shakeT > 0 ? 1 : 0);
  const sy = (Math.random() - 0.5) * shakeAmp * (shakeT > 0 ? 1 : 0);

  ctx.save();
  ctx.setTransform(canvas.width / LW, 0, 0, canvas.height / LH, 0, 0);
  ctx.translate(sx, sy);

  drawBackground(time);

  if (state === STATE.MENU) {
    drawMenu(time);
    ctx.restore();
    return;
  }

  // world
  drawMeteorWarns();
  drawCoins();
  drawItems();
  drawEnemies();
  if (boss) drawBoss();
  drawMeteors();
  drawEnemyBullets();
  drawPlayerBullets();
  if (!player.dead || state === STATE.OVER) drawPlayer();
  drawParticles();
  drawTexts();

  ctx.restore();

  // HUD (no shake)
  ctx.save();
  ctx.setTransform(canvas.width / LW, 0, 0, canvas.height / LH, 0, 0);
  drawHUD();
  if (banner) drawBanner();
  if (state === STATE.OVER) drawGameOver();
  ctx.restore();
}

function drawBackground(time) {
  // sky gradient
  const g = ctx.createLinearGradient(0, 0, 0, LH);
  g.addColorStop(0, "#0a1030");
  g.addColorStop(0.5, "#101a3c");
  g.addColorStop(1, "#1a1440");
  ctx.fillStyle = g;
  ctx.fillRect(-20, -20, LW + 40, LH + 40);

  // stars
  bgOffset = (bgOffset + currentSpeed() * 0.016) % LH;
  ctx.fillStyle = "#ffffff";
  for (const s of stars) {
    const y = (s.y + bgOffset * (s.s / 60)) % LH;
    const a = 0.4 + 0.6 * Math.abs(Math.sin(time * 0.002 + s.tw));
    ctx.globalAlpha = a * 0.8;
    ctx.beginPath();
    ctx.arc(s.x, y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawPlayerBullets() {
  for (const b of playerBullets) {
    ctx.fillStyle = "#aee6ff";
    ctx.shadowColor = "#55ccff";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.ellipse(b.x, b.y, 3, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}

function drawEnemyBullets() {
  for (const b of enemyBullets) {
    ctx.fillStyle = b.color || "#ff8866";
    ctx.shadowColor = b.color || "#ff8866";
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}

// ---- dragon drawing (player & enemies) ----
function drawDragon(x, y, r, color, wingT, facing) {
  // facing: -1 = up (player), 1 = down (enemy)
  ctx.save();
  ctx.translate(x, y);
  const f = facing || 1;
  const wing = Math.sin(wingT) * 0.5;

  // wings
  ctx.fillStyle = shade(color, -25);
  // left wing
  ctx.beginPath();
  ctx.moveTo(-r * 0.3, 0);
  ctx.quadraticCurveTo(-r * (1.4 + wing * 0.4), -r * 0.6 * f, -r * (1.8 + wing * 0.6), r * 0.2 * f);
  ctx.quadraticCurveTo(-r * 1.0, r * 0.4 * f, -r * 0.3, r * 0.2);
  ctx.fill();
  // right wing
  ctx.beginPath();
  ctx.moveTo(r * 0.3, 0);
  ctx.quadraticCurveTo(r * (1.4 + wing * 0.4), -r * 0.6 * f, r * (1.8 + wing * 0.6), r * 0.2 * f);
  ctx.quadraticCurveTo(r * 1.0, r * 0.4 * f, r * 0.3, r * 0.2);
  ctx.fill();

  // body
  const bg2 = ctx.createLinearGradient(0, -r, 0, r);
  bg2.addColorStop(0, shade(color, 20));
  bg2.addColorStop(1, shade(color, -15));
  ctx.fillStyle = bg2;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.75, r * 1.05, 0, 0, Math.PI * 2);
  ctx.fill();

  // belly
  ctx.fillStyle = "rgba(255,235,200,0.55)";
  ctx.beginPath();
  ctx.ellipse(0, r * 0.25, r * 0.42, r * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();

  // head
  ctx.fillStyle = shade(color, 30);
  ctx.beginPath();
  ctx.arc(0, -r * (facing === 1 ? 0.75 : -0.75), r * 0.55, 0, Math.PI * 2);
  ctx.fill();

  // eyes
  const ey = -r * (facing === 1 ? 0.85 : -0.85);
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.arc(-r * 0.22, ey, r * 0.14, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(r * 0.22, ey, r * 0.14, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#1a1a2e";
  ctx.beginPath(); ctx.arc(-r * 0.22, ey, r * 0.07, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(r * 0.22, ey, r * 0.07, 0, Math.PI * 2); ctx.fill();

  // horns
  ctx.fillStyle = "#e8d8b0";
  ctx.beginPath();
  ctx.moveTo(-r * 0.35, ey - r * 0.3);
  ctx.lineTo(-r * 0.5, ey - r * 0.65);
  ctx.lineTo(-r * 0.18, ey - r * 0.35);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(r * 0.35, ey - r * 0.3);
  ctx.lineTo(r * 0.5, ey - r * 0.65);
  ctx.lineTo(r * 0.18, ey - r * 0.35);
  ctx.fill();

  ctx.restore();
}

function shade(hex, amt) {
  // hex like #rrggbb -> adjust
  const c = hex.replace("#", "");
  const num = parseInt(c, 16);
  let r = (num >> 16) + amt, g = ((num >> 8) & 0xff) + amt, b = (num & 0xff) + amt;
  r = clamp(r, 0, 255); g = clamp(g, 0, 255); b = clamp(b, 0, 255);
  return "rgb(" + r + "," + g + "," + b + ")";
}

function drawPlayer() {
  const p = player;
  ctx.save();
  if (p.invuln > 0 && state === STATE.PLAY) {
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(p.invuln * 30);
  }
  // fire glow
  ctx.fillStyle = "rgba(255,160,60,0.5)";
  ctx.beginPath();
  ctx.ellipse(p.x, p.y - 26, 4, 10 + Math.random() * 4, 0, 0, Math.PI * 2);
  ctx.fill();

  drawDragon(p.x, p.y, p.r, "#2e8a4a", p.wingT, -1);

  // shield bubble
  if (p.shield > 0) {
    ctx.strokeStyle = "rgba(100,170,255," + (0.5 + 0.3 * Math.sin(p.shield * 6)) + ")";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r + 10, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawEnemies() {
  for (const e of enemies) {
    ctx.save();
    if (e.flash > 0) ctx.globalAlpha = 0.7;
    const bodyColor = e.flash > 0 ? "#ffffff" : e.color;
    drawDragon(e.x, e.y, e.r, bodyColor, e.phase * 8, 1);
    // hp bar
    if (e.hp < e.maxHp) {
      const w = e.r * 2;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(e.x - w / 2, e.y - e.r - 8, w, 4);
      ctx.fillStyle = "#ff5544";
      ctx.fillRect(e.x - w / 2, e.y - e.r - 8, w * (e.hp / e.maxHp), 4);
    }
    ctx.restore();
  }
}

function drawBoss() {
  const b = boss;
  ctx.save();
  const c = b.flash > 0 ? "#ffffff" : "#7a2a8a";
  drawDragon(b.x, b.y, b.r, c, b.phase * 6, 1);
  // crown
  ctx.fillStyle = "#ffd700";
  ctx.beginPath();
  const cy = b.y - b.r * 0.75 - b.r * 0.55;
  ctx.moveTo(b.x - 18, cy + 10);
  ctx.lineTo(b.x - 12, cy - 6);
  ctx.lineTo(b.x - 5, cy + 4);
  ctx.lineTo(b.x, cy - 10);
  ctx.lineTo(b.x + 5, cy + 4);
  ctx.lineTo(b.x + 12, cy - 6);
  ctx.lineTo(b.x + 18, cy + 10);
  ctx.closePath();
  ctx.fill();
  // hp bar (top)
  const w = LW - 60;
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(30, 14, w, 10);
  ctx.fillStyle = "#c44dff";
  ctx.fillRect(30, 14, w * clamp(b.hp / b.maxHp, 0, 1), 10);
  ctx.strokeStyle = "#ffffff55";
  ctx.strokeRect(30, 14, w, 10);
  ctx.restore();
}

function drawMeteors() {
  for (const m of meteors) {
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(m.spin);
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, m.r);
    g.addColorStop(0, "#c98a5a");
    g.addColorStop(1, "#5a3a2a");
    ctx.fillStyle = g;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const rr = m.r * (0.8 + 0.2 * Math.sin(i * 3 + m.spin));
      if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawMeteorWarns() {
  for (const w of meteorWarns) {
    const a = 0.3 + 0.7 * Math.abs(Math.sin(w.t * 12));
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = "#ffcc33";
    ctx.font = "bold 22px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("!", w.x, 34);
    ctx.strokeStyle = "rgba(255,200,60," + a * 0.5 + ")";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(w.x, 44);
    ctx.lineTo(w.x, LH);
    ctx.stroke();
    ctx.restore();
  }
}

function drawCoins() {
  for (const c of coinsArr) {
    const squish = Math.abs(Math.cos(c.t * 6));
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.fillStyle = "#ffd700";
    ctx.shadowColor = "#ffd700";
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.ellipse(0, 0, c.r * (0.3 + 0.7 * squish), c.r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#b8860b";
    ctx.font = "bold 9px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("$", 0, 1);
    ctx.restore();
  }
}

const ITEM_INFO = {
  power:  { color: "#ffcc44", label: "P" },
  magnet: { color: "#44ccff", label: "M" },
  shield: { color: "#66aaff", label: "S" },
  heal:   { color: "#66ff88", label: "+" }
};

function drawItems() {
  for (const it of itemsArr) {
    const info = ITEM_INFO[it.kind];
    ctx.save();
    ctx.translate(it.x, it.y);
    const pulse = 1 + 0.15 * Math.sin(it.t * 6);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = info.color;
    ctx.shadowColor = info.color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, 0, it.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(info.label, 0, 1);
    ctx.restore();
  }
}

function drawParticles() {
  for (const p of particles) {
    const a = p.t / p.max;
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawTexts() {
  for (const t of texts) {
    ctx.globalAlpha = clamp(t.t, 0, 1);
    ctx.fillStyle = t.color;
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.globalAlpha = 1;
}

// ---------------- HUD ----------------
function drawHUD() {
  ctx.textAlign = "left";
  ctx.font = "bold 16px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = 4;
  ctx.fillText("SCORE " + Math.floor(score).toLocaleString(), 12, 30);
  ctx.fillText("DIST " + Math.floor(distance) + "m", 12, 52);
  // coins
  ctx.fillStyle = "#ffd700";
  ctx.beginPath();
  ctx.arc(LW - 70, 24, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.fillText("x " + coins, LW - 54, 30);

  // hearts
  ctx.shadowBlur = 4;
  for (let i = 0; i < player.maxHp; i++) {
    const hx = LW - 12 - i * 22, hy = 52;
    drawHeart(hx, hy, 8, i < player.hp ? "#ff4466" : "rgba(255,255,255,0.2)");
  }
  // power pips
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < player.power ? "#ffcc44" : "rgba(255,255,255,0.2)";
    ctx.fillRect(12 + i * 14, 64, 10, 6);
  }
  ctx.shadowBlur = 0;
}

function drawHeart(x, y, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, s * 0.35);
  ctx.bezierCurveTo(-s, -s * 0.45, -s * 0.5, -s * 1.1, 0, -s * 0.35);
  ctx.bezierCurveTo(s * 0.5, -s * 1.1, s, -s * 0.45, 0, s * 0.35);
  ctx.fill();
  ctx.restore();
}

function drawBanner() {
  const a = clamp(banner.t / banner.max * 2, 0, 1);
  ctx.globalAlpha = a;
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 34px sans-serif";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = 8;
  ctx.fillText(banner.text, LW / 2, LH * 0.4);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

function drawMenu(time) {
  // floating dragons decoration
  const t = time * 0.001;
  drawDragon(LW / 2, LH * 0.28 + Math.sin(t * 2) * 8, 34, "#2e8a4a", t * 8, -1);

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffe9a0";
  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = 10;
  ctx.font = "bold 46px sans-serif";
  ctx.fillText("DRAGON FLIGHT", LW / 2, LH * 0.5);

  ctx.font = "16px sans-serif";
  ctx.fillStyle = "#aabbdd";
  ctx.fillText("용을 타고 하늘을 날아보세요!", LW / 2, LH * 0.5 + 34);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px sans-serif";
  const blink = 0.5 + 0.5 * Math.sin(t * 4);
  ctx.globalAlpha = 0.6 + blink * 0.4;
  ctx.fillText("[ 탭 / 클릭 / Enter 로 시작 ]", LW / 2, LH * 0.72);
  ctx.globalAlpha = 1;

  ctx.font = "13px sans-serif";
  ctx.fillStyle = "#8899bb";
  ctx.fillText("모바일: 화면을 손가락으로 좌우로 드래그", LW / 2, LH * 0.72 + 28);
  ctx.fillText("PC: ←/→ 또는 A/D, 마우스로 따라 이동", LW / 2, LH * 0.72 + 48);
  ctx.fillText("공격은 자동 발사", LW / 2, LH * 0.72 + 68);
  ctx.shadowBlur = 0;
}

function drawGameOver() {
  ctx.fillStyle = "rgba(5,7,15,0.78)";
  ctx.fillRect(0, 0, LW, LH);

  ctx.textAlign = "center";
  ctx.fillStyle = "#ff6655";
  ctx.font = "bold 44px sans-serif";
  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = 10;
  ctx.fillText("GAME OVER", LW / 2, LH * 0.34);
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px sans-serif";
  ctx.fillText("SCORE  " + Math.floor(score).toLocaleString(), LW / 2, LH * 0.44);
  ctx.font = "16px sans-serif";
  ctx.fillStyle = "#ccddee";
  ctx.fillText("DIST " + Math.floor(distance) + "m   ·   KILLS " + kills, LW / 2, LH * 0.44 + 30);
  ctx.fillText("COINS " + coins + "   ·   BEST " + Math.floor(bestScore).toLocaleString(), LW / 2, LH * 0.44 + 56);

  const blink = 0.5 + 0.5 * Math.sin(performance.now() * 0.004);
  ctx.fillStyle = "#ffe9a0";
  ctx.globalAlpha = 0.6 + blink * 0.4;
  ctx.font = "bold 18px sans-serif";
  ctx.fillText("[ 탭 / 클릭 / Enter 로 다시 시작 ]", LW / 2, LH * 0.72);
  ctx.globalAlpha = 1;
}

// ============================================================
// main loop
// ============================================================
function frame(now) {
  let dt = (now - lastT) / 1000;
  lastT = now;
  dt = clamp(dt, 0, 0.05);
  if (slowMoT > 0) dt *= 0.4;

  update(dt);
  render(now);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
