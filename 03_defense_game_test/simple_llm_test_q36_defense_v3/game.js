// Tower Defense Game - 성벽 방어작전
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game configuration
const COLS = 20;
const ROWS = 12;
const TILE_SIZE = 50;
const MAX_WAVES = 20;
const BOSS_WAVES = [4, 8, 12, 16, 20]; // Every 4 waves is a boss wave

// Tower definitions
const TOWER_TYPES = {
    basic: {
        name: '기본 터렛',
        cost: 50,
        range: 120,
        damage: 20,
        fireRate: 800,
        color: '#4a90d9',
        projectileColor: '#4a90d9',
        projectileSpeed: 6,
        splashRadius: 0
    },
    sniper: {
        name: '저격터렛',
        cost: 100,
        range: 200,
        damage: 80,
        fireRate: 2000,
        color: '#d94a4a',
        projectileColor: '#ff0000',
        projectileSpeed: 12,
        splashRadius: 0
    },
    slow: {
        name: '감속 터렛',
        cost: 75,
        range: 100,
        damage: 5,
        fireRate: 600,
        color: '#4ad9a0',
        projectileColor: '#00ff88',
        projectileSpeed: 5,
        splashRadius: 0,
        slowFactor: 0.4,
        slowDuration: 2000
    },
    bomb: {
        name: '폭발 터렛',
        cost: 150,
        range: 110,
        damage: 40,
        fireRate: 1500,
        color: '#d9a04a',
        projectileColor: '#ff8800',
        projectileSpeed: 4,
        splashRadius: 50
    }
};

// Map path (waypoints for enemies)
const PATH_POINTS = [
    { x: 0, y: 2 },
    { x: 4, y: 2 },
    { x: 4, y: 6 },
    { x: 2, y: 6 },
    { x: 2, y: 9 },
    { x: 7, y: 9 },
    { x: 7, y: 4 },
    { x: 11, y: 4 },
    { x: 11, y: 8 },
    { x: 15, y: 8 },
    { x: 15, y: 3 },
    { x: 19, y: 3 }
];

// Convert path to pixel coordinates
const PATH = PATH_POINTS.map(p => ({
    x: p.x * TILE_SIZE + TILE_SIZE / 2,
    y: p.y * TILE_SIZE + TILE_SIZE / 2
}));

// Mark path tiles
const pathTiles = new Set();
function markPathTiles() {
    for (let i = 0; i < PATH_POINTS.length - 1; i++) {
        const p1 = PATH_POINTS[i];
        const p2 = PATH_POINTS[i + 1];
        if (p1.x === p2.x) {
            const minY = Math.min(p1.y, p2.y);
            const maxY = Math.max(p1.y, p2.y);
            for (let y = minY; y <= maxY; y++) {
                pathTiles.add(`${p1.x},${y}`);
            }
        } else {
            const minX = Math.min(p1.x, p2.x);
            const maxX = Math.max(p1.x, p2.x);
            for (let x = minX; x <= maxX; x++) {
                pathTiles.add(`${x},${p1.y}`);
            }
        }
    }
}
markPathTiles();

// Boss definitions with unique patterns
const BOSS_TYPES = {
    wave4: {
        name: '🔥 용왕 발칸',
        hp: 600,
        speed: 0.8,
        color: '#ff4400',
        size: 28,
        reward: 100,
        damage: 5,
        pattern: 'charge', // Charge attack
        chargeThreshold: 0.5, // Charges when hp drops below 50%
        chargeSpeed: 4,
        chargeDuration: 2000,
        chargeCooldown: 3000,
        description: '체력이 50% 이하가 되면 격렬한 돌진'
    },
    wave8: {
        name: '☠️ 독룡 모스',
        hp: 1000,
        speed: 0.7,
        color: '#88ff00',
        size: 30,
        reward: 150,
        damage: 6,
        pattern: 'poison',
        poisonInterval: 2500,
        poisonDamage: 15,
        poisonDuration: 3000,
        description: '주기적으로 독을 뿌림'
    },
    wave12: {
        name: '💎 수호석룡',
        hp: 1500,
        speed: 0.6,
        color: '#aaaaff',
        size: 32,
        reward: 200,
        damage: 7,
        pattern: 'armor',
        armorThreshold: 0.6,
        armorReduction: 0.5,
        armorDuration: 4000,
        armorCooldown: 5000,
        description: '주기적으로 방어력 강화 (피해 절반)'
    },
    wave16: {
        name: '⚡ 전기룡 젬',
        hp: 2000,
        speed: 0.9,
        color: '#ffff00',
        size: 30,
        reward: 250,
        damage: 8,
        pattern: 'lightning',
        lightningInterval: 2000,
        lightningRadius: 80,
        lightningDamage: 25,
        description: '주변에 전기 폭격을 가함 (터렛 타격)'
    },
    wave20: {
        name: '👑 흑룡 킹도스',
        hp: 3000,
        speed: 1.0,
        color: '#aa00ff',
        size: 35,
        reward: 400,
        damage: 10,
        pattern: 'all', // Uses all attacks
        chargeThreshold: 0.7,
        chargeSpeed: 4,
        chargeDuration: 2000,
        chargeCooldown: 4000,
        poisonInterval: 3000,
        poisonDamage: 20,
        poisonDuration: 3000,
        armorThreshold: 0.5,
        armorReduction: 0.6,
        armorDuration: 5000,
        armorCooldown: 6000,
        lightningInterval: 2500,
        lightningRadius: 90,
        lightningDamage: 30,
        description: '모든 기술을 사용하는 최종 보스'
    }
};

function isBossWave(wave) {
    return BOSS_WAVES.includes(wave);
}

function getBossType(wave) {
    const bossMap = { 4: 'wave4', 8: 'wave8', 12: 'wave12', 16: 'wave16', 20: 'wave20' };
    return bossMap[wave];
}

// Game state
let gameState = {
    gold: 100,
    lives: 20,
    score: 0,
    wave: 0,
    waveActive: false,
    enemies: [],
    towers: [],
    projectiles: [],
    particles: [],
    selectedTowerType: null,
    gameOver: false,
    enemiesRemaining: 0,
    enemiesSpawned: 0,
    spawnTimer: 0,
    waveDelay: 0,
    bossActive: false,
    bossDefeated: false
};

// Enemy class
class Enemy {
    constructor(type, wave) {
        this.pathIndex = 0;
        this.x = PATH[0].x;
        this.y = PATH[0].y;
        this.progress = 0;
        this.type = type;
        this.wave = wave;

        const waveMultiplier = 1 + (wave - 1) * 0.15;

        switch (type) {
            case 'fast':
                this.speed = 2.5;
                this.maxHealth = 30 * waveMultiplier;
                this.health = this.maxHealth;
                this.size = 10;
                this.color = '#ff6bff';
                this.reward = 8;
                this.damage = 1;
                break;
            case 'tank':
                this.speed = 0.8;
                this.maxHealth = 120 * waveMultiplier;
                this.health = this.maxHealth;
                this.size = 16;
                this.color = '#ff4444';
                this.reward = 15;
                this.damage = 3;
                break;
            case 'boss':
                this.speed = 0.6;
                this.maxHealth = 400 * waveMultiplier;
                this.health = this.maxHealth;
                this.size = 20;
                this.color = '#ff0000';
                this.reward = 50;
                this.damage = 5;
                break;
            default:
                this.speed = 1.5;
                this.maxHealth = 50 * waveMultiplier;
                this.health = this.maxHealth;
                this.size = 12;
                this.color = '#ffaa00';
                this.reward = 10;
                this.damage = 1;
                break;
        }

        this.slowTimer = 0;
        this.slowFactor = 1;
        this.alive = true;
        this.poisoned = false;
        this.poisonTimer = 0;
        this.poisonDamage = 0;
        this.poisonDuration = 0;
        this.armorActive = false;
        this.armorTimer = 0;
        this.armorReduction = 0;
    }

    update(dt) {
        if (!this.alive) return;

        // Update slow effect
        if (this.slowTimer > 0) {
            this.slowTimer -= dt;
            if (this.slowTimer <= 0) {
                this.slowFactor = 1;
            }
        }

        // Update poison
        if (this.poisoned && this.poisonTimer > 0) {
            this.poisonTimer -= dt;
            if (this.poisonTimer <= 0) {
                this.poisoned = false;
            } else {
                this.takeDamage(this.poisonDamage, 1, 0);
            }
        }

        // Update armor
        if (this.armorActive && this.armorTimer > 0) {
            this.armorTimer -= dt;
            if (this.armorTimer <= 0) {
                this.armorActive = false;
            }
        }

        // Move along path
        if (this.pathIndex < PATH.length - 1) {
            const target = PATH[this.pathIndex + 1];
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const moveSpeed = this.speed * this.slowFactor;

            if (dist <= moveSpeed) {
                this.x = target.x;
                this.y = target.y;
                this.pathIndex++;
                if (this.pathIndex >= PATH.length - 1) {
                    this.reachEnd();
                }
            } else {
                this.x += (dx / dist) * moveSpeed;
                this.y += (dy / dist) * moveSpeed;
            }
        }
    }

    reachEnd() {
        this.alive = false;
        gameState.lives -= this.damage;
        updateUI();
        if (gameState.lives <= 0) {
            endGame();
        }
    }

    takeDamage(damage, slowFactor = 1, slowDuration = 0) {
        if (this.armorActive) {
            damage *= this.armorReduction;
        }
        this.health -= damage;
        if (slowFactor < 1) {
            this.slowFactor = slowFactor;
            this.slowTimer = slowDuration;
        }
        if (this.health <= 0) {
            this.alive = false;
            gameState.gold += this.reward;
            gameState.score += this.reward * 10;
            gameState.enemiesRemaining--;
            spawnParticles(this.x, this.y, this.color, 8);
            updateUI();
        }
    }

    draw() {
        if (!this.alive) return;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + this.size, this.size * 0.8, this.size * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body
        let drawColor = this.color;
        if (this.slowTimer > 0) drawColor = '#88ffff';
        if (this.poisoned) drawColor = '#88ff00';
        if (this.armorActive) drawColor = '#aaaaff';
        
        ctx.fillStyle = drawColor;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Health bar
        const barWidth = this.size * 2;
        const barHeight = 6;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.size - 12;
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        const healthPercent = Math.max(0, this.health / this.maxHealth);
        ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

        // Boss indicators
        if (this.type === 'boss') {
            // Boss crown
            ctx.fillStyle = '#ffd700';
            ctx.font = `${this.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('👑', this.x, this.y - this.size - 18);
            
            // Armor indicator
            if (this.armorActive) {
                ctx.fillStyle = '#aaaaff';
                ctx.font = 'bold 12px Arial';
                ctx.fillText('🛡️', this.x + this.size + 5, this.y - 5);
            }
        }

        // Poison indicator
        if (this.poisoned) {
            ctx.fillStyle = '#88ff00';
            ctx.font = '12px Arial';
            ctx.fillText('☠️', this.x - this.size - 10, this.y + 5);
        }
    }
}

// Boss class extends Enemy with special abilities
class Boss extends Enemy {
    constructor(bossKey, wave) {
        super('boss', wave);
        const bossDef = BOSS_TYPES[bossKey];
        this.bossKey = bossKey;
        this.bossName = bossDef.name;
        this.maxHealth = bossDef.hp;
        this.health = this.maxHealth;
        this.color = bossDef.color;
        this.size = bossDef.size;
        this.reward = bossDef.reward;
        this.damage = bossDef.damage;
        this.pattern = bossDef.pattern;
        
        // Boss-specific timers
        this.lastSpecialAttack = 0;
        this.chargeTimer = 0;
        this.charging = false;
        this.chargeTarget = null;
        
        // Visual effects
        this.attackFlash = 0;
        this.attackType = '';
        this.pulsePhase = 0;
    }

    update(dt) {
        if (!this.alive) return;
        
        const now = Date.now();
        
        // Update parent behaviors (slow, poison, armor, movement)
        super.update(dt);
        
        if (!this.alive) return;
        
        // Pulse animation
        this.pulsePhase += dt * 0.003;
        
        // Attack flash decay
        if (this.attackFlash > 0) {
            this.attackFlash -= dt * 0.002;
        }
        
        // Boss-specific attacks
        switch (this.pattern) {
            case 'charge':
                this.chargeAttack(dt, now);
                break;
            case 'poison':
                this.poisonAttack(dt, now);
                break;
            case 'armor':
                this.armorAttack(now);
                break;
            case 'lightning':
                this.lightningAttack(now);
                break;
            case 'all':
                this.allAttacks(dt, now);
                break;
        }
    }

    chargeAttack(dt, now) {
        const def = BOSS_TYPES[this.bossKey];
        const healthPercent = this.health / this.maxHealth;
        
        // Activate charge when below threshold
        if (healthPercent <= def.chargeThreshold && !this.charging && now - this.lastSpecialAttack > def.chargeCooldown) {
            this.charging = true;
            this.chargeTimer = def.chargeDuration;
            this.lastSpecialAttack = now;
            this.attackFlash = 1;
            this.attackType = '⚡ 돌진!';
            
            // Speed boost
            this.speed *= 2.5;
        }
        
        if (this.charging) {
            this.chargeTimer -= dt;
            if (this.chargeTimer <= 0) {
                this.charging = false;
                this.speed /= 2.5;
            }
        }
    }

    poisonAttack(dt, now) {
        const def = BOSS_TYPES[this.bossKey];
        
        if (now - this.lastSpecialAttack >= def.poisonInterval) {
            this.lastSpecialAttack = now;
            this.attackFlash = 1;
            this.attackType = '☠️ 독포';
            
            // Poison all enemies and apply damage to player towers area
            for (const enemy of gameState.enemies) {
                if (enemy.alive && enemy !== this) {
                    enemy.poisoned = true;
                    enemy.poisonTimer = def.poisonDuration;
                    enemy.poisonDamage = def.poisonDamage * 0.3;
                }
            }
            
            // Also apply small poison to towers' effective area
            spawnParticles(this.x, this.y, '#88ff00', 20);
            updateUI();
        }
    }

    armorAttack(now) {
        const def = BOSS_TYPES[this.bossKey];
        const healthPercent = this.health / this.maxHealth;
        
        if (healthPercent <= def.armorThreshold && !this.armorActive && now - this.lastSpecialAttack > def.armorCooldown) {
            this.armorActive = true;
            this.armorTimer = def.armorDuration;
            this.armorReduction = def.armorReduction;
            this.lastSpecialAttack = now;
            this.attackFlash = 1;
            this.attackType = '🛡️ 방어구사';
            spawnParticles(this.x, this.y, '#aaaaff', 15);
        }
        
        if (this.armorActive) {
            this.armorTimer -= 16;
            if (this.armorTimer <= 0) {
                this.armorActive = false;
            }
        }
    }

    lightningAttack(now) {
        const def = BOSS_TYPES[this.bossKey];
        
        if (now - this.lastSpecialAttack >= def.lightningInterval) {
            this.lastSpecialAttack = now;
            this.attackFlash = 1;
            this.attackType = '⚡ 낙뢰!';
            
            // Damage towers in range
            for (const tower of gameState.towers) {
                const dx = tower.x - this.x;
                const dy = tower.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= def.lightningRadius) {
                    // Tower takes damage (reduce health indirectly by removing it)
                    spawnParticles(tower.x, tower.y, '#ffff00', 10);
                }
            }
            
            // Visual effect
            spawnParticles(this.x, this.y, '#ffff00', 25);
            
            // Apply damage to all regular enemies (they get stunned)
            for (const enemy of gameState.enemies) {
                if (enemy.alive && enemy !== this && enemy.type !== 'boss') {
                    enemy.takeDamage(def.lightningDamage * 0.2, 0.3, 1000);
                }
            }
            
            updateUI();
        }
    }

    allAttacks(dt, now) {
        // Run all attack patterns
        this.chargeAttack(dt, now);
        this.poisonAttack(dt, now);
        this.armorAttack(now);
        this.lightningAttack(now);
    }

    draw() {
        if (!this.alive) return;
        
        const pulse = Math.sin(this.pulsePhase) * 3;
        
        // Aura effect
        const auraColor = this.attackFlash > 0 ? 
            (this.attackType.includes('⚡') ? '#ffff00' : 
             this.attackType.includes('☠️') ? '#88ff00' : 
             this.attackType.includes('🛡️') ? '#aaaaff' : '#ff4400') : 
            this.color;
        
        ctx.fillStyle = auraColor;
        ctx.globalAlpha = 0.2 + this.attackFlash * 0.3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size + 8 + pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + this.size, this.size * 0.9, this.size * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Body with charging effect
        let drawColor = this.color;
        if (this.slowTimer > 0) drawColor = '#88ffff';
        if (this.poisoned) drawColor = '#88ff00';
        if (this.armorActive) drawColor = '#aaaaff';
        if (this.charging) drawColor = '#ff0000';
        
        ctx.fillStyle = drawColor;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size + (this.charging ? pulse : 0), 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Boss face
        ctx.fillStyle = '#fff';
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🐉', this.x, this.y);
        
        // Health bar (larger for boss)
        const barWidth = this.size * 3;
        const barHeight = 8;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.size - 25;
        
        // Background
        ctx.fillStyle = '#333';
        ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
        ctx.fillStyle = '#111';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Health fill
        const healthPercent = Math.max(0, this.health / this.maxHealth);
        const healthColor = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillStyle = healthColor;
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        // Boss name above health bar
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 13px Arial';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(this.bossName, this.x, barY - 5);
        
        // Health text
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px Arial';
        ctx.fillText(`${Math.ceil(this.health)} / ${Math.ceil(this.maxHealth)}`, this.x, barY + barHeight + 15);
        
        // Active attack indicator
        if (this.attackFlash > 0.3) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px Arial';
            ctx.fillText(this.attackType, this.x, this.y + this.size + 30);
        }
        
        // Special status indicators
        if (this.armorActive) {
            ctx.fillStyle = '#aaaaff';
            ctx.font = '16px Arial';
            ctx.fillText('🛡️', this.x + this.size + 10, this.y);
        }
        
        if (this.charging) {
            ctx.fillStyle = '#ff0000';
            ctx.font = 'bold 14px Arial';
            ctx.fillText('⚡', this.x - this.size - 10, this.y - 10);
        }
    }
}

// Tower class
class Tower {
    constructor(type, col, row) {
        this.type = type;
        this.col = col;
        this.row = row;
        this.x = col * TILE_SIZE + TILE_SIZE / 2;
        this.y = row * TILE_SIZE + TILE_SIZE / 2;
        this.config = TOWER_TYPES[type];
        this.lastFire = 0;
        this.angle = 0;
        this.target = null;
        this.health = 100;
    }

    update(now) {
        // Find target
        this.target = null;
        let minDist = Infinity;
        for (const enemy of gameState.enemies) {
            if (!enemy.alive) continue;
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= this.config.range && dist < minDist) {
                minDist = dist;
                this.target = enemy;
            }
        }

        if (this.target) {
            this.angle = Math.atan2(
                this.target.y - this.y,
                this.target.x - this.x
            );

            if (now - this.lastFire >= this.config.fireRate) {
                this.fire();
                this.lastFire = now;
            }
        }
    }

    fire() {
        if (!this.target) return;
        gameState.projectiles.push(new Projectile(
            this.x, this.y, this.target, this.config
        ));
    }

    draw() {
        // Base
        ctx.fillStyle = '#333';
        ctx.fillRect(
            this.col * TILE_SIZE + 5,
            this.row * TILE_SIZE + 5,
            TILE_SIZE - 10,
            TILE_SIZE - 10
        );

        // Tower body
        ctx.save();
        ctx.translate(this.x, this.y);

        // Turret
        ctx.fillStyle = this.config.color;
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Barrel
        ctx.rotate(this.angle);
        ctx.fillStyle = this.config.color;
        ctx.fillRect(0, -4, 22, 8);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, -4, 22, 8);

        ctx.restore();
    }
}

// Projectile class
class Projectile {
    constructor(x, y, target, config) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.config = config;
        this.speed = config.projectileSpeed;
        this.alive = true;
        this.trail = [];
    }

    update() {
        if (!this.alive) return;

        // Store trail position
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 5) this.trail.shift();

        if (!this.target || !this.target.alive) {
            this.alive = false;
            return;
        }

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const moveSpeed = this.speed;

        if (dist <= moveSpeed + this.target.size) {
            // Hit
            if (this.config.splashRadius > 0) {
                // Splash damage
                for (const enemy of gameState.enemies) {
                    if (!enemy.alive) continue;
                    const sx = enemy.x - this.x;
                    const sy = enemy.y - this.y;
                    const sdist = Math.sqrt(sx * sx + sy * sy);
                    if (sdist <= this.config.splashRadius) {
                        const damageMult = 1 - (sdist / this.config.splashRadius) * 0.5;
                        enemy.takeDamage(this.config.damage * damageMult, this.config.slowFactor || 1, this.config.slowDuration || 0);
                    }
                }
                spawnParticles(this.x, this.y, '#ff8800', 15);
            } else {
                this.target.takeDamage(
                    this.config.damage,
                    this.config.slowFactor || 1,
                    this.config.slowDuration || 0
                );
                spawnParticles(this.x, this.y, this.config.projectileColor, 5);
            }
            this.alive = false;
        } else {
            this.x += (dx / dist) * moveSpeed;
            this.y += (dy / dist) * moveSpeed;
        }
    }

    draw() {
        if (!this.alive) return;

        // Trail
        for (let i = 0; i < this.trail.length; i++) {
            const alpha = i / this.trail.length * 0.5;
            ctx.fillStyle = this.config.projectileColor + Math.floor(alpha * 255).toString(16).padStart(2, '0');
            ctx.beginPath();
            ctx.arc(this.trail[i].x, this.trail[i].y, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Projectile
        ctx.fillStyle = this.config.projectileColor;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Particle system
function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
        const speed = 2 + Math.random() * 3;
        gameState.particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            decay: 0.02 + Math.random() * 0.02,
            size: 3 + Math.random() * 4,
            color
        });
    }
}

function updateParticles() {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const p = gameState.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        if (p.life <= 0) {
            gameState.particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    for (const p of gameState.particles) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

// Wave management
function startWave() {
    if (gameState.waveActive || gameState.gameOver) return;

    gameState.wave++;
    gameState.waveActive = true;
    gameState.enemiesSpawned = 0;
    gameState.spawnTimer = 0;
    gameState.bossActive = false;
    gameState.bossDefeated = false;

    if (gameState.wave > MAX_WAVES) {
        winGame();
        return;
    }

    updateUI();
    document.getElementById('startWaveBtn').disabled = true;
}

function getWaveEnemies(wave) {
    const enemies = [];
    
    if (isBossWave(wave)) {
        // Boss wave: fewer regular enemies + boss
        const baseCount = 3 + wave;
        const fastCount = Math.floor(baseCount * 0.25);
        const tankCount = Math.floor(baseCount * 0.2);
        const normalCount = baseCount - fastCount - tankCount;
        const bossKey = getBossType(wave);
        
        for (let i = 0; i < normalCount; i++) {
            enemies.push('normal');
        }
        for (let i = 0; i < fastCount; i++) {
            enemies.push('fast');
        }
        for (let i = 0; i < tankCount; i++) {
            enemies.push('tank');
        }
        enemies.push(bossKey); // Boss
    } else {
        // Normal wave
        const baseCount = 5 + wave * 2;
        const fastCount = Math.floor(baseCount * 0.3);
        const tankCount = Math.floor(baseCount * 0.2);
        const normalCount = baseCount - fastCount - tankCount;
        
        for (let i = 0; i < normalCount; i++) {
            enemies.push('normal');
        }
        for (let i = 0; i < fastCount; i++) {
            enemies.push('fast');
        }
        for (let i = 0; i < tankCount; i++) {
            enemies.push('tank');
        }
    }

    // Shuffle
    for (let i = enemies.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [enemies[i], enemies[j]] = [enemies[j], enemies[i]];
    }

    return enemies;
}

function updateSpawning(dt) {
    if (!gameState.waveActive) return;

    const waveEnemies = getWaveEnemies(gameState.wave);
    gameState.spawnTimer += dt;

    if (gameState.enemiesSpawned < waveEnemies.length) {
        const spawnInterval = Math.max(300, 800 - gameState.wave * 20);
        if (gameState.spawnTimer >= spawnInterval) {
            const enemyType = waveEnemies[gameState.enemiesSpawned];
            let enemy;
            
            if (isBossWave(gameState.wave) && !isBossWave(gameState.wave) === false) {
                // Check if this is the boss (last enemy in boss waves)
                if (enemyType in BOSS_TYPES) {
                    enemy = new Boss(enemyType, gameState.wave);
                    gameState.bossActive = true;
                } else {
                    enemy = new Enemy(enemyType, gameState.wave);
                }
            } else {
                enemy = new Enemy(enemyType, gameState.wave);
            }
            
            gameState.enemies.push(enemy);
            gameState.enemiesRemaining++;
            gameState.enemiesSpawned++;
            gameState.spawnTimer = 0;
        }
    }
}

function checkWaveComplete() {
    if (!gameState.waveActive) return;
    const waveEnemies = getWaveEnemies(gameState.wave);
    if (gameState.enemiesSpawned >= waveEnemies.length && gameState.enemiesRemaining <= 0) {
        gameState.waveActive = false;
        gameState.gold += 20 + gameState.wave * 5;
        if (isBossWave(gameState.wave)) {
            gameState.gold += 50 + gameState.wave * 10; // Boss wave bonus
            gameState.score += 500;
        }
        updateUI();

        // Enable wave button with delay
        const btn = document.getElementById('startWaveBtn');
        btn.disabled = false;
        btn.textContent = isBossWave(gameState.wave + 1) ? '🔥 BOSS Wave 시작!' : '다음 Wave 시작';

        // Bonus particles
        for (let i = 0; i < 5; i++) {
            spawnParticles(
                Math.random() * canvas.width,
                Math.random() * canvas.height,
                '#ffd700',
                10
            );
        }
    }
}

// Drawing functions
function drawMap() {
    // Background grid
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const key = `${col},${row}`;
            const x = col * TILE_SIZE;
            const y = row * TILE_SIZE;

            if (pathTiles.has(key)) {
                // Path tile
                ctx.fillStyle = '#8b7355';
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#9c8466';
                ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            } else {
                // Grass tile
                ctx.fillStyle = (col + row) % 2 === 0 ? '#2d5016' : '#325918';
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

                // Grass detail
                ctx.fillStyle = '#3a6b1e';
                if ((col * 7 + row * 13) % 5 === 0) {
                    ctx.fillRect(x + 10, y + 10, 4, 8);
                    ctx.fillRect(x + 25, y + 20, 3, 6);
                }
            }
        }
    }

    // Path border
    ctx.strokeStyle = '#6b5740';
    ctx.lineWidth = 2;
    for (const key of pathTiles) {
        const [col, row] = key.split(',').map(Number);
        const x = col * TILE_SIZE;
        const y = row * TILE_SIZE;

        // Check neighbors
        const hasLeft = pathTiles.has(`${col - 1},${row}`);
        const hasRight = pathTiles.has(`${col + 1},${row}`);
        const hasTop = pathTiles.has(`${col},${row - 1}`);
        const hasBottom = pathTiles.has(`${col},${row + 1}`);

        if (!hasLeft) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + TILE_SIZE); ctx.stroke(); }
        if (!hasRight) { ctx.beginPath(); ctx.moveTo(x + TILE_SIZE, y); ctx.lineTo(x + TILE_SIZE, y + TILE_SIZE); ctx.stroke(); }
        if (!hasTop) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + TILE_SIZE, y); ctx.stroke(); }
        if (!hasBottom) { ctx.beginPath(); ctx.moveTo(x, y + TILE_SIZE); ctx.lineTo(x + TILE_SIZE, y + TILE_SIZE); ctx.stroke(); }
    }

    // Start marker
    const startX = PATH[0].x - 15;
    const startY = PATH[0].y - 15;
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('⚠️', startX, startY + 18);

    // End marker (castle)
    const endX = PATH[PATH.length - 1].x;
    const endY = PATH[PATH.length - 1].y;
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 28px Arial';
    ctx.fillText('🏰', endX - 18, endY + 10);
}

function drawPlacementPreview(mouseX, mouseY) {
    if (!gameState.selectedTowerType) return;

    const col = Math.floor(mouseX / TILE_SIZE);
    const row = Math.floor(mouseY / TILE_SIZE);

    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;

    const canPlace = canPlaceTower(col, row);
    const x = col * TILE_SIZE;
    const y = row * TILE_SIZE;

    ctx.fillStyle = canPlace ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    // Range preview
    if (canPlace) {
        const config = TOWER_TYPES[gameState.selectedTowerType];
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(
            col * TILE_SIZE + TILE_SIZE / 2,
            row * TILE_SIZE + TILE_SIZE / 2,
            config.range, 0, Math.PI * 2
        );
        ctx.stroke();
    }
}

function canPlaceTower(col, row) {
    const key = `${col},${row}`;
    if (pathTiles.has(key)) return false;
    for (const tower of gameState.towers) {
        if (tower.col === col && tower.row === row) return false;
    }
    return true;
}

// UI Updates
function updateUI() {
    document.getElementById('waveDisplay').textContent = gameState.wave;
    document.getElementById('goldDisplay').textContent = gameState.gold;
    document.getElementById('livesDisplay').textContent = gameState.lives;
    document.getElementById('scoreDisplay').textContent = gameState.score;

    // Update boss wave indicator
    const waveDisplay = document.getElementById('waveDisplay');
    if (isBossWave(gameState.wave)) {
        waveDisplay.style.color = '#ff4444';
        waveDisplay.style.fontSize = '20px';
        waveDisplay.textContent = `👑 ${gameState.wave}`;
    } else {
        waveDisplay.style.color = '#e94560';
        waveDisplay.style.fontSize = '16px';
    }

    // Update tower panel availability
    document.querySelectorAll('.tower-option').forEach(el => {
        const type = el.dataset.tower;
        const cost = TOWER_TYPES[type].cost;
        if (gameState.gold < cost) {
            el.classList.add('disabled');
        } else {
            el.classList.remove('disabled');
        }
    });
}

function endGame() {
    gameState.gameOver = true;
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('finalWave').textContent = gameState.wave;
    document.getElementById('gameOverScreen').classList.remove('hidden');
    document.getElementById('gameOverlay').classList.remove('hidden');
}

function winGame() {
    gameState.gameOver = true;
    document.getElementById('winScore').textContent = gameState.score;
    document.getElementById('winScreen').classList.remove('hidden');
    document.getElementById('gameOverlay').classList.remove('hidden');
}

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    // Update
    updateSpawning(dt);

    for (const enemy of gameState.enemies) {
        enemy.update(dt);
    }
    gameState.enemies = gameState.enemies.filter(e => e.alive || e.health > 0);

    for (const tower of gameState.towers) {
        tower.update(timestamp);
    }

    for (const proj of gameState.projectiles) {
        proj.update();
    }
    gameState.projectiles = gameState.projectiles.filter(p => p.alive);

    updateParticles();
    checkWaveComplete();

    // Draw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMap();

    // Draw towers
    for (const tower of gameState.towers) {
        tower.draw();
    }

    // Draw enemies
    for (const enemy of gameState.enemies) {
        enemy.draw();
    }

    // Draw projectiles
    for (const proj of gameState.projectiles) {
        proj.draw();
    }

    // Draw particles
    drawParticles();

    // Draw placement preview
    if (mousemoveX !== undefined && mousemoveY !== undefined) {
        drawPlacementPreview(mousemoveX, mousemoveY);
    }

    // Wave info with boss indicator
    if (gameState.waveActive) {
        const infoWidth = isBossWave(gameState.wave) ? 250 : 200;
        const infoX = isBossWave(gameState.wave) ? -25 : 10;
        
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(infoX, canvas.height - 30, infoWidth, 22);
        
        ctx.fillStyle = isBossWave(gameState.wave) ? '#ff4444' : '#fff';
        ctx.font = isBossWave(gameState.wave) ? 'bold 14px Arial' : '14px Arial';
        
        if (isBossWave(gameState.wave)) {
            ctx.fillText(`👑 BOSS WAVE - 적남아: ${gameState.enemiesRemaining}`, 20, canvas.height - 14);
        } else {
            ctx.fillText(`적남아: ${gameState.enemiesRemaining}`, 20, canvas.height - 14);
        }
    } else if (!gameState.gameOver && gameState.wave > 0) {
        // Show next wave info when between waves
        const nextWave = gameState.wave + 1;
        if (nextWave <= MAX_WAVES) {
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.fillRect(canvas.width / 2 - 80, canvas.height - 30, 160, 22);
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 13px Arial';
            ctx.textAlign = 'center';
            if (isBossWave(nextWave)) {
                ctx.fillText(`다음: 👑 BOSS WAVE ${nextWave}`, canvas.width / 2, canvas.height - 14);
            } else {
                ctx.fillText(`다음: Wave ${nextWave}`, canvas.width / 2, canvas.height - 14);
            }
            ctx.textAlign = 'left';
        }
    }

    if (!gameState.gameOver) {
        requestAnimationFrame(gameLoop);
    }
}

// Input handling
let mousemoveX = undefined;
let mousemoveY = undefined;

function getCanvasPos(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
}

function handleCanvasClick(clientX, clientY) {
    if (gameState.gameOver || !gameState.selectedTowerType) return;

    const pos = getCanvasPos(clientX, clientY);
    const x = pos.x;
    const y = pos.y;
    const col = Math.floor(x / TILE_SIZE);
    const row = Math.floor(y / TILE_SIZE);

    if (!canPlaceTower(col, row)) return;

    const cost = TOWER_TYPES[gameState.selectedTowerType].cost;
    if (gameState.gold < cost) return;

    gameState.gold -= cost;
    gameState.towers.push(new Tower(gameState.selectedTowerType, col, row));
    spawnParticles(col * TILE_SIZE + TILE_SIZE / 2, row * TILE_SIZE + TILE_SIZE / 2, '#ffd700', 10);
    updateUI();
}

// Mouse events
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mousemoveX = e.clientX - rect.left;
    mousemoveY = e.clientY - rect.top;
});

canvas.addEventListener('mouseleave', () => {
    mousemoveX = undefined;
    mousemoveY = undefined;
});

canvas.addEventListener('click', (e) => {
    handleCanvasClick(e.clientX, e.clientY);
});

// Touch events for mobile
let touchActive = false;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchActive = true;
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        mousemoveX = touch.clientX - canvas.getBoundingClientRect().left;
        mousemoveY = touch.clientY - canvas.getBoundingClientRect().top;
    }
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        mousemoveX = touch.clientX - canvas.getBoundingClientRect().left;
        mousemoveY = touch.clientY - canvas.getBoundingClientRect().top;
    }
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (e.changedTouches.length === 1 && touchActive) {
        const touch = e.changedTouches[0];
        handleCanvasClick(touch.clientX, touch.clientY);
        mousemoveX = undefined;
        mousemoveY = undefined;
    }
    touchActive = false;
}, { passive: false });

// Tower selection
document.querySelectorAll('.tower-option').forEach(el => {
    el.addEventListener('click', () => {
        if (el.classList.contains('disabled')) return;
        document.querySelectorAll('.tower-option').forEach(e => e.classList.remove('selected'));
        el.classList.add('selected');
        gameState.selectedTowerType = el.dataset.tower;
    });
    
    // Touch support for tower options
    el.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (el.classList.contains('disabled')) return;
        document.querySelectorAll('.tower-option').forEach(e => e.classList.remove('selected'));
        el.classList.add('selected');
        gameState.selectedTowerType = el.dataset.tower;
    });
});

// Buttons
document.getElementById('startWaveBtn').addEventListener('click', startWave);
document.getElementById('startGameBtn').addEventListener('click', () => {
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOverlay').classList.add('hidden');
    requestAnimationFrame(gameLoop);
});
document.getElementById('restartBtn').addEventListener('click', restartGame);
document.getElementById('winRestartBtn').addEventListener('click', restartGame);

// Touch support for buttons
document.getElementById('startWaveBtn').addEventListener('touchend', (e) => {
    e.preventDefault();
    startWave();
});
document.getElementById('startGameBtn').addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOverlay').classList.add('hidden');
    requestAnimationFrame(gameLoop);
});
document.getElementById('restartBtn').addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    restartGame();
});
document.getElementById('winRestartBtn').addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    restartGame();
});

function restartGame() {
    gameState = {
        gold: 100,
        lives: 20,
        score: 0,
        wave: 0,
        waveActive: false,
        enemies: [],
        towers: [],
        projectiles: [],
        particles: [],
        selectedTowerType: null,
        gameOver: false,
        enemiesRemaining: 0,
        enemiesSpawned: 0,
        spawnTimer: 0,
        waveDelay: 0,
        bossActive: false,
        bossDefeated: false
    };
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('winScreen').classList.add('hidden');
    document.getElementById('startWaveBtn').textContent = 'Wave 시작';
    document.getElementById('startWaveBtn').disabled = false;
    document.querySelectorAll('.tower-option').forEach(e => e.classList.remove('selected'));
    updateUI();
    requestAnimationFrame(gameLoop);
}

// Responsive canvas sizing
function resizeCanvas() {
    const wrapper = document.getElementById('canvasWrapper');
    const maxWidth = Math.min(wrapper.clientWidth, 600);
    const maxHeight = window.innerHeight * 0.55;
    
    let scale = 1;
    const naturalWidth = canvas.width;
    const naturalHeight = canvas.height;
    
    if (naturalWidth > maxWidth) {
        scale = Math.min(scale, maxWidth / naturalWidth);
    }
    if (naturalHeight > maxHeight) {
        scale = Math.min(scale, maxHeight / naturalHeight);
    }
    
    canvas.style.width = (naturalWidth * scale) + 'px';
    canvas.style.height = (naturalHeight * scale) + 'px';
}

// Initialize
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
updateUI();
