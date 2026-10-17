/* ============================================================
   Dragonflight - 용의 격투
   Pure HTML5 Canvas vertical shooter. No external assets.
   ============================================================ */

(() => {
  'use strict';

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // Logical resolution (scaled to fit screen while preserving aspect)
  const W = 480;
  const H = 800;

  function resize() {
    const ratio = window.innerWidth / window.innerHeight;
    const targetRatio = W / H;
    let displayW = window.innerWidth;
    let displayH = window.innerHeight;
    if (ratio > targetRatio) {
      displayH = window.innerWidth / targetRatio;
    } else {
      displayW = window.innerHeight * targetRatio;
    }
    canvas.style.width = displayW + 'px';
    canvas.style.height = displayH + 'px';
    canvas.width = W;
    canvas.height = H;
  }
  window.addEventListener('resize', resize);
  resize();

  // ---------- DOM ----------
  const el = {
    hud: document.getElementById('hud'),
    score: document.getElementById('scoreDisplay'),
    distance: document.getElementById('distanceDisplay'),
    kills: document.getElementById('killsDisplay'),
    coins: document.getElementById('coinDisplay'),
    bossBarContainer: document.getElementById('bossBarContainer'),
    bossBarFill: document.getElementById('bossBarFill'),
    bossName: document.getElementById('bossName'),
    powerups: document.getElementById('powerupIndicators'),
    startScreen: document.getElementById('startScreen'),
    gameOverScreen: document.getElementById('gameOverScreen'),
    startButton: document.getElementById('startButton'),
    restartButton: document.getElementById('restartButton'),
    finalScore: document.getElementById('finalScore'),
    finalDistance: document.getElementById('finalDistance'),
    finalKills: document.getElementById('finalKills'),
    finalCoins: document.getElementById('finalCoins'),
  };

  // ---------- Game State ----------
  const STATE = { MENU: 0, PLAYING: 1, OVER: 2 };
  let state = STATE.MENU;

  let game = null;

  // ---------- Input ----------
  const keys = { left: false, right: false };
  let mouseX = null;
  let mouseActive = false;

  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { keys.left = true; mouseActive = false; e.preventDefault(); }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { keys.right = true; mouseActive = false; e.preventDefault(); }
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    mouseX = (e.clientX - rect.left) * scaleX;
    mouseActive = true;
  });
  canvas.addEventListener('touchmove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const t = e.changedTouches[0];
    mouseX = (t.clientX - rect.left) * scaleX;
    mouseActive = true;
    e.preventDefault();
  }, { passive: false });

  // ---------- Utility ----------
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  // ---------- Particles ----------
  class Particle {
    constructor(x, y, vx, vy, life, color, size) {
      this.x = x; this.y = y; this.vx = vx; this.vy = vy;
      this.life = life; this.maxLife = life; this.color = color; this.size = size;
    }
    update(dt) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.vx *= 0.96;
      this.vy *= 0.96;
      this.life -= dt;
    }
    draw(c) {
      const a = clamp(this.life / this.maxLife, 0, 1);
      c.globalAlpha = a;
      c.fillStyle = this.color;
      c.beginPath();
      c.arc(this.x, this.y, this.size * a, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = 1;
    }
  }

  // ---------- Player Dragon ----------
  class Player {
    constructor() {
      this.x = W / 2;
      this.y = H - 90;
      this.w = 46;
      this.h = 52;
      this.speed = 360;
      this.maxHp = 5;
      this.hp = 5;
      this.invuln = 0;
      this.fireTimer = 0;
      this.fireRate = 0.28;
      this.bulletSpeed = 620;
      this.bulletDmg = 1;
      this.lanes = 6;
      this.laneWidth = W / this.lanes;
      this.bulletsPerShot = 1;
      this.spread = 0.16;
      this.damageMultiplier = 1;
      this.magnetRange = 0;
      this.shieldTimer = 0;
      this.flap = 0;
    }

    laneForX(x) {
      return clamp(Math.floor(x / this.laneWidth), 0, this.lanes - 1);
    }
    centerXForLane(lane) {
      return lane * this.laneWidth + this.laneWidth / 2;
    }

    update(dt) {
      this.flap += dt * 8;
      if (this.invuln > 0) this.invuln -= dt;
      if (this.shieldTimer > 0) this.shieldTimer -= dt;

      if (mouseActive && mouseX != null) {
        const lane = this.laneForX(mouseX);
        const target = this.centerXForLane(lane);
        this.x = lerp(this.x, target, 1 - Math.pow(0.001, dt));
      } else {
        let dir = 0;
        if (keys.left) dir -= 1;
        if (keys.right) dir += 1;
        if (dir !== 0) {
          const lane = this.laneForX(this.x);
          this.x += dir * this.speed * dt;
          const target = this.centerXForLane(clamp(lane + dir, 0, this.lanes - 1));
          const diff = target - this.x;
          if (Math.abs(diff) < this.laneWidth * 0.55) {
            this.x = lerp(this.x, target, 1 - Math.pow(0.02, dt));
          }
        }
      }
      this.x = clamp(this.x, this.w / 2, W - this.w / 2);

      this.fireTimer -= dt;
      if (this.fireTimer <= 0) {
        this.fireTimer = this.fireRate;
        this.fire();
      }
    }

    fire() {
      const spreadTotal = this.spread;
      for (let i = 0; i < this.bulletsPerShot; i++) {
        let angle = 0;
        if (this.bulletsPerShot > 1) {
          const offset = (i - (this.bulletsPerShot - 1) / 2);
          angle = offset * 0.09;
        } else {
          angle = rand(-spreadTotal / 2, spreadTotal / 2);
        }
        game.bullets.push(new Bullet(this.x, this.y - this.h / 2, angle, this.bulletDmg * this.damageMultiplier));
      }
    }

    draw(c) {
      c.save();
      c.translate(this.x, this.y);
      if (this.invuln > 0 && Math.floor(this.invuln * 20) % 2 === 0) c.globalAlpha = 0.4;

      const flap = Math.sin(this.flap) * 6;
      // Tail
      c.fillStyle = '#1f6fd0';
      c.beginPath();
      c.moveTo(0, this.h / 2);
      c.lineTo(-12, this.h / 2 + 18);
      c.lineTo(12, this.h / 2 + 18);
      c.closePath();
      c.fill();

      // Wings
      c.fillStyle = '#4fa8ff';
      c.beginPath();
      c.moveTo(-6, -4);
      c.quadraticCurveTo(-this.w, -10 + flap, -this.w - 4, 14 + flap);
      c.quadraticCurveTo(-this.w / 2, 6, -6, 8);
      c.closePath();
      c.fill();
      c.beginPath();
      c.moveTo(6, -4);
      c.quadraticCurveTo(this.w, -10 + flap, this.w + 4, 14 + flap);
      c.quadraticCurveTo(this.w / 2, 6, 6, 8);
      c.closePath();
      c.fill();

      // Body
      const grad = c.createLinearGradient(0, -this.h / 2, 0, this.h / 2);
      grad.addColorStop(0, '#7ec8ff');
      grad.addColorStop(1, '#2b7fd6');
      c.fillStyle = grad;
      c.beginPath();
      c.ellipse(0, 0, this.w / 2 - 6, this.h / 2, 0, 0, Math.PI * 2);
      c.fill();

      // Head
      c.fillStyle = '#a9dcff';
      c.beginPath();
      c.arc(0, -this.h / 2 + 8, 12, 0, Math.PI * 2);
      c.fill();

      // Eyes
      c.fillStyle = '#0a1830';
      c.beginPath();
      c.arc(-4, -this.h / 2 + 6, 2.2, 0, Math.PI * 2);
      c.arc(4, -this.h / 2 + 6, 2.2, 0, Math.PI * 2);
      c.fill();

      // Horns
      c.fillStyle = '#ffd86b';
      c.beginPath();
      c.moveTo(-6, -this.h / 2);
      c.lineTo(-10, -this.h / 2 - 10);
      c.lineTo(-2, -this.h / 2 + 2);
      c.closePath();
      c.moveTo(6, -this.h / 2);
      c.lineTo(10, -this.h / 2 - 10);
      c.lineTo(2, -this.h / 2 + 2);
      c.closePath();
      c.fill();

      // Shield
      if (this.shieldTimer > 0) {
        c.strokeStyle = 'rgba(120,220,255,' + (0.4 + 0.3 * Math.sin(this.flap * 2)) + ')';
        c.lineWidth = 3;
        c.beginPath();
        c.arc(0, 0, this.w / 2 + 10, 0, Math.PI * 2);
        c.stroke();
      }
      c.restore();
    }
  }

  // ---------- Player Bullet ----------
  class Bullet {
    constructor(x, y, angle, dmg) {
      this.x = x; this.y = y;
      this.vx = Math.sin(angle) * 620;
      this.vy = -Math.cos(angle) * 620;
      this.dmg = dmg;
      this.r = 5;
      this.dead = false;
    }
    update(dt) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (this.y < -20) this.dead = true;
    }
    draw(c) {
      c.fillStyle = '#bff2ff';
      c.shadowColor = '#4fa8ff';
      c.shadowBlur = 8;
      c.beginPath();
      c.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      c.fill();
      c.shadowBlur = 0;
    }
  }

  // ---------- Enemy Dragon ----------
  class Enemy {
    constructor(lane, hp, speed, color) {
      this.lane = lane;
      this.x = lane * (W / 6) + (W / 12);
      this.y = -40;
      this.w = 44;
      this.h = 50;
      this.maxHp = hp;
      this.hp = hp;
      this.speed = speed;
      this.color = color;
      this.dead = false;
      this.hitFlash = 0;
      this.flap = Math.random() * 10;
      this.sway = rand(-0.4, 0.4);
      this.swayPhase = Math.random() * Math.PI * 2;
    }
    update(dt, scrollSpeed) {
      this.y += (this.speed + scrollSpeed) * dt;
      this.swayPhase += dt * 2;
      this.x += Math.sin(this.swayPhase) * this.sway * 40 * dt;
      this.flap += dt * 8;
      if (this.hitFlash > 0) this.hitFlash -= dt;
      if (this.y > H + 60) this.dead = true;
    }
    draw(c) {
      c.save();
      c.translate(this.x, this.y);
      const flap = Math.sin(this.flap) * 6;
      if (this.hitFlash > 0) c.globalAlpha = 0.5 + 0.5 * Math.sin(this.hitFlash * 40);

      // Wings
      c.fillStyle = this.color === 'red' ? '#ff5a6b' : '#b56bff';
      c.beginPath();
      c.moveTo(-6, -4);
      c.quadraticCurveTo(-this.w, -8 + flap, -this.w - 4, 12 + flap);
      c.quadraticCurveTo(-this.w / 2, 6, -6, 8);
      c.closePath();
      c.moveTo(6, -4);
      c.quadraticCurveTo(this.w, -8 + flap, this.w + 4, 12 + flap);
      c.quadraticCurveTo(this.w / 2, 6, 6, 8);
      c.closePath();
      c.fill();

      // Body
      const grad = c.createLinearGradient(0, -this.h / 2, 0, this.h / 2);
      grad.addColorStop(0, this.color === 'red' ? '#ff8a95' : '#d1a3ff');
      grad.addColorStop(1, this.color === 'red' ? '#c62828' : '#6a2fb5');
      c.fillStyle = grad;
      c.beginPath();
      c.ellipse(0, 0, this.w / 2 - 6, this.h / 2, 0, 0, Math.PI * 2);
      c.fill();

      // Head
      c.fillStyle = this.color === 'red' ? '#ffc2c8' : '#e6d0ff';
      c.beginPath();
      c.arc(0, -this.h / 2 + 8, 11, 0, Math.PI * 2);
      c.fill();

      // Eyes (menacing)
      c.fillStyle = '#fff';
      c.beginPath();
      c.arc(-4, -this.h / 2 + 6, 2.6, 0, Math.PI * 2);
      c.arc(4, -this.h / 2 + 6, 2.6, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#10030b';
      c.beginPath();
      c.arc(-4, -this.h / 2 + 7, 1.4, 0, Math.PI * 2);
      c.arc(4, -this.h / 2 + 7, 1.4, 0, Math.PI * 2);
      c.fill();

      // Horns
      c.fillStyle = '#ffd86b';
      c.beginPath();
      c.moveTo(-6, -this.h / 2);
      c.lineTo(-9, -this.h / 2 - 9);
      c.lineTo(-2, -this.h / 2 + 2);
      c.closePath();
      c.moveTo(6, -this.h / 2);
      c.lineTo(9, -this.h / 2 - 9);
      c.lineTo(2, -this.h / 2 + 2);
      c.closePath();
      c.fill();
      c.restore();

      // HP bar
      if (this.hp < this.maxHp) {
        const bw = this.w;
        c.fillStyle = 'rgba(0,0,0,0.5)';
        c.fillRect(this.x - bw / 2, this.y - this.h / 2 - 12, bw, 5);
        c.fillStyle = '#ff4b5c';
        c.fillRect(this.x - bw / 2, this.y - this.h / 2 - 12, bw * clamp(this.hp / this.maxHp, 0, 1), 5);
      }
    }
  }

  // ---------- Boss ----------
  class Boss {
    constructor(level) {
      this.x = W / 2;
      this.y = -120;
      this.targetY = 130;
      this.w = 130;
      this.h = 120;
      this.maxHp = 60 + level * 30;
      this.hp = this.maxHp;
      this.speed = 40 + level * 5;
      this.color = '#ff3b5c';
      this.dead = false;
      this.entering = true;
      this.fireTimer = 1.2;
      this.hitFlash = 0;
      this.flap = 0;
      this.vx = 70 + level * 8;
      this.phase = 0;
    }
    update(dt) {
      this.flap += dt * 3;
      if (this.hitFlash > 0) this.hitFlash -= dt;
      if (this.entering) {
        this.y = lerp(this.y, this.targetY, 1 - Math.pow(0.01, dt));
        if (Math.abs(this.y - this.targetY) < 1) { this.entering = false; }
      } else {
        this.x += this.vx * dt;
        if (this.x < this.w / 2) { this.x = this.w / 2; this.vx = -Math.abs(this.vx); }
        if (this.x > W - this.w / 2) { this.x = W - this.w / 2; this.vx = -Math.abs(this.vx); }
        this.fireTimer -= dt;
        if (this.fireTimer <= 0) this.fire();
      }
    }
    fire() {
      if (!game) return;
      const dx = game.player.x - this.x;
      const dy = game.player.y - this.y;
      const baseAngle = Math.atan2(dx, -dy);
      for (let i = -2; i <= 2; i++) {
        const a = baseAngle + i * 0.22;
        game.enemyBullets.push(new EnemyBullet(this.x, this.y + this.h / 3, a, this.speed));
      }
      this.fireTimer = 1.5 - Math.min(0.6, game.level * 0.05);
    }
    draw(c) {
      c.save();
      c.translate(this.x, this.y);
      const flap = Math.sin(this.flap) * 10;
      if (this.hitFlash > 0) c.globalAlpha = 0.5 + 0.5 * Math.sin(this.hitFlash * 40);

      // Wings (large)
      c.fillStyle = '#a01030';
      c.beginPath();
      c.moveTo(-10, -10);
      c.quadraticCurveTo(-this.w / 2 - 20, -30 + flap, -this.w / 2 - 10, 30 + flap);
      c.quadraticCurveTo(-this.w / 2, 10, -10, 20);
      c.closePath();
      c.moveTo(10, -10);
      c.quadraticCurveTo(this.w / 2 + 20, -30 + flap, this.w / 2 + 10, 30 + flap);
      c.quadraticCurveTo(this.w / 2, 10, 10, 20);
      c.closePath();
      c.fill();

      // Body
      const grad = c.createLinearGradient(0, -this.h / 2, 0, this.h / 2);
      grad.addColorStop(0, '#ff6b7d');
      grad.addColorStop(1, '#c61f3d');
      c.fillStyle = grad;
      c.beginPath();
      c.ellipse(0, 0, this.w / 2 - 14, this.h / 2, 0, 0, Math.PI * 2);
      c.fill();

      // Head
      c.fillStyle = '#ffc2c8';
      c.beginPath();
      c.arc(0, -this.h / 2 + 22, 26, 0, Math.PI * 2);
      c.fill();

      // Eyes
      c.fillStyle = '#fff';
      c.beginPath();
      c.arc(-10, -this.h / 2 + 18, 6, 0, Math.PI * 2);
      c.arc(10, -this.h / 2 + 18, 6, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#10030b';
      c.beginPath();
      c.arc(-10, -this.h / 2 + 20, 3, 0, Math.PI * 2);
      c.arc(10, -this.h / 2 + 20, 3, 0, Math.PI * 2);
      c.fill();

      // Horns
      c.fillStyle = '#ffd86b';
      c.beginPath();
      c.moveTo(-16, -this.h / 2 + 4);
      c.lineTo(-26, -this.h / 2 - 18);
      c.lineTo(-8, -this.h / 2 + 6);
      c.closePath();
      c.moveTo(16, -this.h / 2 + 4);
      c.lineTo(26, -this.h / 2 - 18);
      c.lineTo(8, -this.h / 2 + 6);
      c.closePath();
      c.fill();
      c.restore();

      // hit flash overlay
      if (this.hitFlash > 0) {
        c.fillStyle = 'rgba(255,255,255,' + (this.hitFlash * 3) + ')';
        c.beginPath();
        c.ellipse(this.x, this.y, this.w / 2, this.h / 2, 0, 0, Math.PI * 2);
        c.fill();
      }
    }
  }

  // ---------- Enemy Bullet ----------
  class EnemyBullet {
    constructor(x, y, angle, speed) {
      this.x = x; this.y = y;
      this.vx = Math.sin(angle) * speed;
      this.vy = Math.cos(angle) * speed;
      this.r = 6;
      this.dead = false;
    }
    update(dt) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (this.y > H + 20 || this.x < -20 || this.x > W + 20) this.dead = true;
    }
    draw(c) {
      c.fillStyle = '#ff7b3c';
      c.shadowColor = '#ff2d47';
      c.shadowBlur = 8;
      c.beginPath();
      c.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      c.fill();
      c.shadowBlur = 0;
    }
  }

  // ---------- Coin ----------
  class Coin {
    constructor(x, y) {
      this.x = x; this.y = y;
      this.value = 1;
      this.r = 8;
      this.dead = false;
      this.vy = 40;
      this.wobble = Math.random() * Math.PI * 2;
    }
    update(dt, magnetRange) {
      this.wobble += dt * 4;
      this.y += this.vy * dt;
      const targetX = game.player.x;
      const targetY = game.player.y;
      if (magnetRange > 0) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist < magnetRange) {
          const f = 1 - dist / magnetRange;
          this.x += dx * f * 3 * dt * 60 * 0.016 * 3;
          this.y += dy * f * 3 * dt * 60 * 0.016 * 3;
        }
      } else {
        this.x += Math.sin(this.wobble) * 20 * dt;
      }
      if (this.y > H + 20) this.dead = true;
    }
    draw(c) {
      const sx = Math.abs(Math.cos(this.wobble));
      c.save();
      c.translate(this.x, this.y);
      c.scale(sx + 0.2, 1);
      c.fillStyle = '#ffd86b';
      c.strokeStyle = '#c9a020';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(0, 0, this.r, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.restore();
    }
  }

  // ---------- Item ----------
  class Item {
    constructor(x, y, type) {
      this.x = x; this.y = y;
      this.type = type; // 'attack', 'magnet', 'shield'
      this.r = 13;
      this.dead = false;
      this.vy = 45;
      this.flap = 0;
    }
    update(dt) {
      this.y += this.vy * dt;
      this.flap += dt * 4;
      this.x += Math.sin(this.flap) * 15 * dt;
      if (this.y > H + 20) this.dead = true;
    }
    draw(c) {
      const colors = { attack: '#ff6b3c', magnet: '#3cffd6', shield: '#7ec8ff' };
      const icons = { attack: '▲', magnet: 'M', shield: '◈' };
      c.save();
      c.translate(this.x, this.y);
      c.fillStyle = colors[this.type];
      c.shadowColor = colors[this.type];
      c.shadowBlur = 12;
      c.beginPath();
      c.arc(0, 0, this.r, 0, Math.PI * 2);
      c.fill();
      c.shadowBlur = 0;
      c.fillStyle = '#060814';
      c.font = 'bold 14px sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(icons[this.type], 0, 1);
      c.restore();
    }
  }

  // ---------- Meteor ----------
  class Meteor {
    constructor(lane) {
      this.lane = lane;
      this.x = lane * (W / 6) + (W / 12);
      this.y = -60;
      this.w = W / 6 - 8;
      this.h = 60;
      this.speed = 220;
      this.dead = false;
      this.warning = true;
      this.warningTime = 1.4;
      this.hit = false;
      this.alpha = 1;
    }
    update(dt, scrollSpeed) {
      if (this.warning) {
        this.warningTime -= dt;
        this.y = lerp(this.y, 0, 0); // stays at top during warning
        if (this.warningTime <= 0) {
          this.warning = false;
          this.y = -this.h;
        }
      } else {
        this.y += (this.speed + scrollSpeed) * dt;
        if (this.y > H) {
          this.dead = true;
          this.alpha = 0;
        }
      }
    }
    draw(c, t) {
      if (this.warning) {
        // Warning stripe
        const flash = Math.floor(t * 6) % 2 === 0;
        c.fillStyle = flash ? 'rgba(255,60,80,0.55)' : 'rgba(255,60,80,0.18)';
        const x = this.lane * (W / 6);
        c.fillRect(x, 0, W / 6, H);
        c.fillStyle = 'rgba(255,255,255,0.9)';
        c.font = 'bold 16px sans-serif';
        c.textAlign = 'center';
        c.fillText('⚠ 운석!', this.x, 40);
        return;
      }
      // Falling rock
      c.save();
      c.translate(this.x, this.y);
      c.fillStyle = '#6b5a47';
      c.strokeStyle = '#3a2f24';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(-this.w / 2, -this.h / 2);
      c.lineTo(this.w / 2, -this.h / 2 + 8);
      c.lineTo(this.w / 2 - 6, this.h / 2);
      c.lineTo(-this.w / 2 + 8, this.h / 2 - 6);
      c.closePath();
      c.fill();
      c.stroke();
      // cracks
      c.strokeStyle = '#3a2f24';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(-this.w / 4, -this.h / 3);
      c.lineTo(-this.w / 6, this.h / 6);
      c.moveTo(this.w / 5, -this.h / 4);
      c.lineTo(this.w / 7, this.h / 5);
      c.stroke();
      c.restore();
    }
    getRect() {
      return { x: this.lane * (W / 6), y: this.y, w: W / 6, h: this.h };
    }
  }

  // ---------- Background Stars ----------
  class StarField {
    constructor() {
      this.layers = [];
      for (let l = 0; l < 3; l++) {
        const stars = [];
        const count = 24 - l * 6;
        for (let i = 0; i < count; i++) {
          stars.push({ x: Math.random() * W, y: Math.random() * H, s: rand(0.5, 1.5) * (l + 1) });
        }
        this.layers.push({ stars, speed: 30 + l * 40 });
      }
    }
    update(dt, scrollSpeed) {
      for (const layer of this.layers) {
        for (const st of layer.stars) {
          st.y += (layer.speed + scrollSpeed * 0.3) * dt;
          if (st.y > H) { st.y = 0; st.x = Math.random() * W; }
        }
      }
    }
    draw(c) {
      for (let l = 0; l < this.layers.length; l++) {
        const alpha = 0.3 + l * 0.25;
        c.fillStyle = `rgba(180,210,255,${alpha})`;
        for (const st of this.layers[l].stars) {
          c.fillRect(st.x, st.y, st.s, st.s);
        }
      }
    }
  }

  // ---------- Game Controller ----------
  function newGame() {
    const g = {
      player: new Player(),
      bullets: [],
      enemies: [],
      enemyBullets: [],
      coins: [],
      items: [],
      meteors: [],
      particles: [],
      stars: new StarField(),
      score: 0,
      distance: 0,
      kills: 0,
      coinsCount: 0,
      level: 1,
      scrollSpeed: 120,
      elapsed: 0,
      spawnTimer: 0,
      spawnInterval: 1.4,
      bossSpawnDist: 900,
      bossActive: false,
      bossLevel: 0,
      itemTimer: 0,
      running: true,
      shake: 0,
    };
    return g;
  }

  function spawnEnemyWave() {
    const lane = Math.floor(Math.random() * 6);
    const hp = 2 + Math.floor(game.level * 0.8);
    const speed = 90 + game.level * 8 + game.scrollSpeed * 0.4;
    const color = Math.random() < 0.5 ? 'red' : 'purple';
    game.enemies.push(new Enemy(lane, hp, speed, color));
  }

  function spawnBoss() {
    game.bossActive = true;
    game.bossLevel = game.bossCount + 1;
    game.boss = new Boss(game.bossLevel);
    el.bossName.textContent = 'BOSS Lv.' + game.bossLevel;
    el.bossBarContainer.classList.remove('hidden');
  }

  function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = rand(40, 220);
      game.particles.push(new Particle(
        x, y,
        Math.cos(a) * sp, Math.sin(a) * sp,
        rand(0.3, 0.8), color, rand(2, 5)
      ));
    }
  }

  function dropRewards(x, y, big) {
    const coinCount = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < coinCount; i++) {
      game.coins.push(new Coin(x + rand(-12, 12), y + rand(-6, 6)));
    }
    if (Math.random() < (big ? 0.9 : 0.12)) {
      const types = ['attack', 'magnet', 'shield'];
      game.items.push(new Item(x + rand(-10, 10), y, types[Math.floor(Math.random() * types.length)]));
    }
  }

  function applyItem(type) {
    if (type === 'attack') {
      game.player.damageMultiplier += 0.5;
      if (game.player.bulletsPerShot < 5) game.player.bulletsPerShot += 1;
      game.player.fireRate = Math.max(0.12, game.player.fireRate - 0.02);
      addPowerupIndicator('공격 강화', 5);
    } else if (type === 'magnet') {
      game.player.magnetRange = 140;
      addPowerupIndicator('코인 자석', 6);
    } else if (type === 'shield') {
      game.player.shieldTimer = 7;
      addPowerupIndicator('방어막', 7);
    }
  }

  let powerupTimers = [];
  function addPowerupIndicator(text, dur) {
    powerupTimers.push({ text, t: dur });
  }

  function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function updatePlayerHit(dt) {
    const p = game.player;
    if (p.invuln > 0) return;
    // vs enemies
    for (const e of game.enemies) {
      if (e.dead) continue;
      if (rectsOverlap(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h,
                       e.x - e.w / 2, e.y - e.h / 2, e.w, e.h)) {
        if (p.shieldTimer > 0) {
          e.hp = 0;
          killEnemy(e);
          p.shieldTimer = 0;
          game.shake = 0.2;
        } else {
          damagePlayer();
          return;
        }
      }
    }
    // vs enemy bullets
    for (const b of game.enemyBullets) {
      if (b.dead) continue;
      if (rectsOverlap(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h,
                       b.x - b.r, b.y - b.r, b.r * 2, b.r * 2)) {
        b.dead = true;
        if (p.shieldTimer > 0) {
          p.shieldTimer = 0;
          spawnParticles(b.x, b.y, '#7ec8ff', 8);
        } else {
          damagePlayer();
          return;
        }
      }
    }
    // vs boss body
    if (game.boss && !game.boss.dead && game.boss.entering === false) {
      const bo = game.boss;
      if (rectsOverlap(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h,
                       bo.x - bo.w / 2, bo.y - bo.h / 2, bo.w, bo.h)) {
        if (p.shieldTimer > 0) {
          p.shieldTimer = 0;
        } else {
          damagePlayer();
          return;
        }
      }
    }
    // vs meteors (active)
    for (const m of game.meteors) {
      if (m.warning || m.dead) continue;
      const r = m.getRect();
      if (rectsOverlap(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h, r.x, r.y, r.w, r.h)) {
        if (p.shieldTimer > 0) {
          p.shieldTimer = 0;
          m.dead = true;
          spawnParticles(m.x, m.y, '#8a7658', 14);
        } else {
          damagePlayer();
          return;
        }
      }
    }
  }

  function damagePlayer() {
    const p = game.player;
    p.hp -= 1;
    p.invuln = 1.2;
    game.shake = 0.35;
    spawnParticles(p.x, p.y, '#4fa8ff', 20);
    if (p.hp <= 0) {
      gameOver();
    }
  }

  function killEnemy(e) {
    e.dead = true;
    game.kills++;
    game.score += 10;
    spawnParticles(e.x, e.y, e.color === 'red' ? '#ff5a6b' : '#b56bff', 16);
    dropRewards(e.x, e.y, false);
  }

  function updateCollisions() {
    const p = game.player;
    // player bullets vs enemies
    for (const b of game.bullets) {
      if (b.dead) continue;
      for (const e of game.enemies) {
        if (e.dead) continue;
        if (Math.abs(b.x - e.x) < e.w / 2 + b.r && Math.abs(b.y - e.y) < e.h / 2 + b.r) {
          e.hp -= b.dmg;
          b.dead = true;
          spawnParticles(b.x, b.y, '#bff2ff', 4);
          e.hitFlash = 0.1;
          if (e.hp <= 0) { killEnemy(e); }
          break;
        }
      }
      // vs boss
      if (b.dead) continue;
      if (game.boss && !game.boss.dead && !game.boss.entering) {
        const bo = game.boss;
        if (Math.abs(b.x - bo.x) < bo.w / 2 && Math.abs(b.y - bo.y) < bo.h / 2) {
          bo.hp -= b.dmg;
          b.dead = true;
          spawnParticles(b.x, b.y, '#bff2ff', 4);
          bo.hitFlash = 0.08;
          game.score += 2;
          if (bo.hp <= 0) { destroyBoss(); }
        }
      }
    }
    // coins pickup
    for (const co of game.coins) {
      if (co.dead) continue;
      if (Math.hypot(co.x - p.x, co.y - p.y) < 20) {
        co.dead = true;
        game.coinsCount += co.value;
        game.score += 1;
        spawnParticles(co.x, co.y, '#ffd86b', 5);
      }
    }
    // items pickup
    for (const it of game.items) {
      if (it.dead) continue;
      if (Math.hypot(it.x - p.x, it.y - p.y) < 24) {
        it.dead = true;
        applyItem(it.type);
        spawnParticles(it.x, it.y, '#fff', 12);
      }
    }
  }

  function destroyBoss() {
    const bo = game.boss;
    bo.dead = true;
    game.bossActive = false;
    el.bossBarContainer.classList.add('hidden');
    game.score += 200;
    spawnParticles(bo.x, bo.y, '#ff3b5c', 40);
    spawnParticles(bo.x, bo.y, '#ffd86b', 30);
    game.shake = 0.5;
    // guaranteed drop
    game.items.push(new Item(bo.x, bo.y, 'attack'));
    for (let i = 0; i < 5; i++) {
      game.coins.push(new Coin(bo.x + rand(-40, 40), bo.y + rand(-20, 20)));
    }
  }

  function updateHUD() {
    el.score.textContent = game.score;
    el.distance.textContent = Math.floor(game.distance) + 'm';
    el.kills.textContent = game.kills;
    el.coins.textContent = game.coinsCount;
    if (game.boss && game.bossActive) {
      el.bossBarFill.style.width = clamp(game.boss.hp / game.boss.maxHp * 100, 0, 100) + '%';
    }
    // powerup indicators
    let html = '';
    for (const pu of powerupTimers) {
      html += `<div class="powerup-indicator">${pu.text} ${pu.t.toFixed(1)}s</div>`;
    }
    el.powerups.innerHTML = html;
  }

  function endGame() {
    game.running = false;
    el.finalScore.textContent = game.score;
    el.finalDistance.textContent = Math.floor(game.distance) + 'm';
    el.finalKills.textContent = game.kills;
    el.finalCoins.textContent = game.coinsCount;
    el.hud.classList.add('hidden');
    el.gameOverScreen.classList.remove('hidden');
    state = STATE.OVER;
  }

  function update(dt, t) {
    if (state !== STATE.PLAYING) return;
    game.elapsed += dt;

    // difficulty scales with distance
    game.distance += game.scrollSpeed * dt * 0.1;
    game.level = 1 + Math.floor(game.distance / 120);
    game.scrollSpeed = 120 + game.distance * 0.06;

    // stars
    game.stars.update(dt, game.scrollSpeed);

    // spawn waves (not while boss active)
    if (!game.bossActive) {
      game.spawnTimer -= dt;
      if (game.spawnTimer <= 0) {
        spawnEnemyWave();
        game.spawnInterval = Math.max(0.55, 1.4 - game.level * 0.06);
        game.spawnTimer = game.spawnInterval;
      }
      // items occasionally
      game.itemTimer -= dt;
      if (game.itemTimer <= 0) {
        game.itemTimer = rand(6, 12);
        const types = ['attack', 'magnet', 'shield'];
        game.items.push(new Item(rand(W / 8, W * 7 / 8), -20, types[Math.floor(Math.random() * types.length)]));
      }
      // boss every bossSpawnDist
      if (game.distance >= game.bossSpawnDist) {
        game.bossSpawnDist += 1400;
        game.bossCount = (game.bossCount || 0) + 1;
        spawnBoss();
      }
      // meteors
      if (Math.random() < 0.02 + game.level * 0.002) {
        const lane = Math.floor(Math.random() * 6);
        game.meteors.push(new Meteor(lane));
      }
    }

    // player
    game.player.update(dt);

    // boss update
    if (game.boss) {
      game.boss.update(dt);
      if (game.boss.dead) game.boss = null;
    }

    // meteors
    for (const m of game.meteors) m.update(dt, game.scrollSpeed);
    game.meteors = game.meteors.filter(m => !m.dead);

    // entities
    for (const b of game.bullets) b.update(dt);
    game.bullets = game.bullets.filter(b => !b.dead);
    for (const e of game.enemies) e.update(dt, game.scrollSpeed);
    game.enemies = game.enemies.filter(e => !e.dead);
    for (const b of game.enemyBullets) b.update(dt);
    game.enemyBullets = game.enemyBullets.filter(b => !b.dead);
    for (const co of game.coins) co.update(dt, game.player.magnetRange);
    game.coins = game.coins.filter(co => !co.dead);
    for (const it of game.items) it.update(dt);
    game.items = game.items.filter(it => !it.dead);
    for (const p of game.particles) p.update(dt);
    game.particles = game.particles.filter(p => p.life > 0);

    // powerup timers
    powerupTimers = powerupTimers.filter(p => { p.t -= dt; return p.t > 0; });

    if (game.shake > 0) game.shake -= dt;

    updateCollisions();
    updatePlayerHit(dt);
    updateHUD();
  }

  function render(t) {
    ctx.clearRect(0, 0, W, H);

    // background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#080b1a');
    bg.addColorStop(0.5, '#0a1024');
    bg.addColorStop(1, '#0c0f22');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    if (game && game.shake > 0) {
      const s = game.shake * 12;
      ctx.translate(rand(-s, s), rand(-s, s));
    }

    if (game) {
      game.stars.draw(ctx);

      // lane guides (subtle)
      ctx.strokeStyle = 'rgba(90,120,200,0.06)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(i * (W / 6), 0);
        ctx.lineTo(i * (W / 6), H);
        ctx.stroke();
      }

      for (const m of game.meteors) m.draw(ctx, t);
      for (const co of game.coins) co.draw(ctx);
      for (const it of game.items) it.draw(ctx);
      for (const b of game.bullets) b.draw(ctx);
      for (const e of game.enemies) e.draw(ctx);
      for (const b of game.enemyBullets) b.draw(ctx);
      if (game.boss) game.boss.draw(ctx);
      game.player.draw(ctx);
      for (const p of game.particles) p.draw(ctx);
    }

    ctx.restore();
  }

  let lastTime = performance.now();
  function loop(now) {
    let dt = (now - lastTime) / 1000;
    if (dt > 0.05) dt = 0.05;
    lastTime = now;
    const t = now / 1000;

    update(dt, t);
    render(t);
    requestAnimationFrame(loop);
  }

  // ---------- Flow ----------
  function startGame() {
    game = newGame();
    game.bossCount = 0;
    powerupTimers = [];
    state = STATE.PLAYING;
    el.startScreen.classList.add('hidden');
    el.gameOverScreen.classList.add('hidden');
    el.hud.classList.remove('hidden');
    mouseX = W / 2;
    mouseActive = false;
    keys.left = keys.right = false;
  }

  function gameOver() {
    spawnParticles(game.player.x, game.player.y, '#4fa8ff', 40);
    endGame();
  }

  el.startButton.addEventListener('click', startGame);
  el.restartButton.addEventListener('click', startGame);

  requestAnimationFrame(loop);
})();
