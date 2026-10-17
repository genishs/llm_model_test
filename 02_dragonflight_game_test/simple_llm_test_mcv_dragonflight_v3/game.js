const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 게임 상태
const GameState = {
    TITLE: 0,
    PLAYING: 1,
    GAME_OVER: 2,
    CONTINUE: 3
};

let gameState = GameState.TITLE;

// 게임 데이터
let score = 0;
let distance = 0;
let coins = 0; // 게임 안 코인
let killCount = 0;
let stage = 1;
let frameCount = 0;

// 크레딧 (코인과 별개)
let credits = 0;
let creditCoinCount = 0; // 크레딧 입력용 코인 개수

// 컨티뉴 관련
let continueTimer = 0;
let continueTimeout = 180; // 3초 (60fps * 3)

// 플레이어 (용)
const player = {
    x: canvas.width / 2,
    y: canvas.height - 80,
    width: 40,
    height: 40,
    speed: 5,
    defense: false,
    defenseTimer: 0,
    magnet: false,
    magnetTimer: 0,
    attackPower: 1
};

// 총알
let bullets = [];
// 적
let enemies = [];
// 코인
let coinsList = [];
// 아이템
let items = [];
// 운석 경고
let meteorWarnings = [];
// 운석
let meteors = [];
// 스타 배경
let stars = [];

// 웨이브 관리
let waveCount = 0;
let enemiesInWave = 0;
let waveTimer = 0;
let bossTimer = 0;

// 입력 상태
let keys = {};
let mouseX = canvas.width / 2;
let touchStartX = null;
let touchCurrentX = null;

// 초기화 (게임 플레이용)
function initGame() {
    score = 0;
    distance = 0;
    coins = 0;
    killCount = 0;
    player.x = canvas.width / 2;
    player.defense = false;
    player.magnet = false;
    player.attackPower = 1;
    bullets = [];
    enemies = [];
    coinsList = [];
    items = [];
    meteors = [];
    meteorWarnings = [];
    waveCount = 0;
    
    // 별 배경 생성
    stars = [];
    for (let i = 0; i < 50; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 1,
            speed: Math.random() * 1 + 0.5
        });
    }
}

// 입력 이벤트
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    // 크레딧 입력 (title 화면에서)
    if (gameState === GameState.TITLE) {
        if (e.key === '1' || e.key === 'numpad1') {
            addCredit(1);
        } else if (e.key === '2' || e.key === 'numpad2') {
            addCredit(2);
        } else if (e.key === '5' || e.key === 'numpad5') {
            addCredit(5);
        } else if (e.key === 'Enter' || e.key === ' ') {
            startGame();
        }
    }
    
    // 컨티뉴 화면에서 크레딧 입력
    if (gameState === GameState.CONTINUE) {
        if (e.key === '1' || e.key === 'numpad1') {
            addCredit(1);
        } else if (e.key === '2' || e.key === 'numpad2') {
            addCredit(2);
        } else if (e.key === '5' || e.key === 'numpad5') {
            addCredit(5);
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
});

// 터치 이벤트 (모바일)
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    touchStartX = touch.clientX - rect.left;
    touchCurrentX = touchStartX;
    
    if (gameState === GameState.TITLE) {
        startGame();
    } else if (gameState === GameState.CONTINUE) {
        // 컨티뉴 화면에서 터치 = 크레딧 입력 (1코인)
        addCredit(1);
    } else if (gameState === GameState.GAME_OVER) {
        // GAME_OVER는 CONTINUE로 전환
        gameState = GameState.CONTINUE;
        continueTimer = 0;
    }
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    touchCurrentX = touch.clientX - rect.left;
    mouseX = touchCurrentX;
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    touchStartX = null;
    touchCurrentX = null;
});

canvas.addEventListener('click', () => {
    if (gameState === GameState.TITLE) {
        startGame();
    } else if (gameState === GameState.CONTINUE) {
        addCredit(1);
    } else if (gameState === GameState.GAME_OVER) {
        gameState = GameState.CONTINUE;
        continueTimer = 0;
    }
});

// 크레딧 추가
function addCredit(amount) {
    if (credits + amount > 99) return; // 최대 99
    credits += amount;
    creditCoinCount += amount;
}

// 게임 시작
function startGame() {
    if (credits <= 0) return;
    credits--;
    initGame();
    gameState = GameState.PLAYING;
    stage = 1;
}

// 플레이어 그리기 (용)
function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    
    // 용 body
    ctx.fillStyle = player.defense ? '#4CAF50' : '#2196F3';
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(-15, 10);
    ctx.lineTo(0, 5);
    ctx.lineTo(15, 10);
    ctx.closePath();
    ctx.fill();
    
    // 용 머리
    ctx.fillStyle = player.defense ? '#81C784' : '#64B5F6';
    ctx.beginPath();
    ctx.arc(0, -15, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // 눈
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(-3, -16, 2, 0, Math.PI * 2);
    ctx.arc(3, -16, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // 날개
    ctx.fillStyle = player.defense ? '#66BB6A' : '#42A5F5';
    ctx.beginPath();
    ctx.moveTo(-15, 0);
    ctx.lineTo(-25, -5);
    ctx.lineTo(-20, 10);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(25, -5);
    ctx.lineTo(20, 10);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
    
    // 방어막 효과
    if (player.defense) {
        ctx.strokeStyle = 'rgba(76, 175, 80, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(player.x, player.y, 25, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// 총알 그리기
function drawBullets() {
    bullets.forEach(bullet => {
        ctx.fillStyle = '#FFEB3B';
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // 총알 트레일
        ctx.strokeStyle = 'rgba(255, 235, 59, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bullet.x, bullet.y);
        ctx.lineTo(bullet.x, bullet.y + 8);
        ctx.stroke();
    });
}

// 적 그리기 (적용)
function drawEnemy(enemy) {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    
    // 적 용 body
    ctx.fillStyle = enemy.health > enemy.maxHealth / 2 ? '#F44336' : '#D32F2F';
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(-12, 8);
    ctx.lineTo(0, 4);
    ctx.lineTo(12, 8);
    ctx.closePath();
    ctx.fill();
    
    // 적 용 머리
    ctx.fillStyle = enemy.health > enemy.maxHealth / 2 ? '#EF5350' : '#C62828';
    ctx.beginPath();
    ctx.arc(0, -10, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // 적 눈
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(-2, -11, 1.5, 0, Math.PI * 2);
    ctx.arc(2, -11, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // 날개
    ctx.fillStyle = '#E53935';
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(-20, -3);
    ctx.lineTo(-16, 6);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(20, -3);
    ctx.lineTo(16, 6);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
    
    // 체력바
    const healthPercent = enemy.health / enemy.maxHealth;
    ctx.fillStyle = '#333';
    ctx.fillRect(enemy.x - 15, enemy.y - 25, 30, 4);
    ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : '#F44336';
    ctx.fillRect(enemy.x - 15, enemy.y - 25, 30 * healthPercent, 4);
}

// 보스 그리기
function drawBoss(boss) {
    ctx.save();
    ctx.translate(boss.x, boss.y);
    
    // 보스 용 body (더 크고 화려하게)
    ctx.fillStyle = boss.health > boss.maxHealth / 2 ? '#9C27B0' : '#7B1FA2';
    ctx.beginPath();
    ctx.moveTo(0, -25);
    ctx.lineTo(-20, 15);
    ctx.lineTo(0, 10);
    ctx.lineTo(20, 15);
    ctx.closePath();
    ctx.fill();
    
    // 보스 머리
    ctx.fillStyle = boss.health > boss.maxHealth / 2 ? '#BA68C8' : '#8E24AA';
    ctx.beginPath();
    ctx.arc(0, -20, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // 보스 뿔
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(-5, -25);
    ctx.lineTo(-8, -35);
    ctx.lineTo(-2, -28);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(5, -25);
    ctx.lineTo(8, -35);
    ctx.lineTo(2, -28);
    ctx.closePath();
    ctx.fill();
    
    // 보스 눈
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(-4, -21, 3, 0, Math.PI * 2);
    ctx.arc(4, -21, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // 날개
    ctx.fillStyle = '#9C27B0';
    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.lineTo(-35, -10);
    ctx.lineTo(-30, 15);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(35, -10);
    ctx.lineTo(30, 15);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
    
    // 보스 체력바
    const healthPercent = boss.health / boss.maxHealth;
    ctx.fillStyle = '#333';
    ctx.fillRect(boss.x - 25, boss.y - 40, 50, 6);
    ctx.fillStyle = healthPercent > 0.5 ? '#9C27B0' : '#E91E63';
    ctx.fillRect(boss.x - 25, boss.y - 40, 50 * healthPercent, 6);
    
    // 보스 라벨
    ctx.fillStyle = '#FFF';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('BOSS', boss.x, boss.y - 45);
}

// 코인 그리기
function drawCoins() {
    coinsList.forEach(coin => {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#FFA000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, 8, 0, Math.PI * 2);
        ctx.stroke();
        
        // 코인 안의 $ 기호
        ctx.fillStyle = '#FFA000';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', coin.x, coin.y);
    });
}

// 아이템 그리기
function drawItems() {
    items.forEach(item => {
        ctx.save();
        ctx.translate(item.x, item.y);
        
        if (item.type === 'attack') {
            // 공격 강화 - 빨간 불꽃
            ctx.fillStyle = '#FF5722';
            ctx.beginPath();
            ctx.moveTo(0, -10);
            ctx.lineTo(-8, 5);
            ctx.lineTo(8, 5);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#FFC107';
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();
        } else if (item.type === 'magnet') {
            // 자석 - 파란색 자석
            ctx.fillStyle = '#2196F3';
            ctx.fillRect(-6, -8, 12, 16);
            ctx.fillStyle = '#1565C0';
            ctx.fillRect(-4, -8, 3, 16);
            ctx.fillRect(1, -8, 3, 16);
        } else if (item.type === 'defense') {
            // 방어막 - 초록색 Shield
            ctx.strokeStyle = '#4CAF50';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = 'rgba(76, 175, 80, 0.3)';
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
        
        // 아이템 라벨
        ctx.fillStyle = '#FFF';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        const label = item.type === 'attack' ? 'ATK' : item.type === 'magnet' ? 'MAG' : 'DEF';
        ctx.fillText(label, item.x, item.y - 15);
    });
}

// 운석 경고 그리기
function drawMeteorWarnings() {
    meteorWarnings.forEach(warning => {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.fillRect(0, warning.y - 20, canvas.width, 40);
        
        ctx.fillStyle = '#FF0000';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⚠Warning⚠', canvas.width / 2, warning.y);
    });
}

// 운석 그리기
function drawMeteors() {
    meteors.forEach(meteor => {
        ctx.fillStyle = '#795548';
        ctx.beginPath();
        ctx.arc(meteor.x, meteor.y, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // 운석 트레일
        ctx.strokeStyle = 'rgba(121, 85, 72, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(meteor.x, meteor.y);
        ctx.lineTo(meteor.x, meteor.y - 20);
        ctx.stroke();
    });
}

// 별 배경 그리기
function drawStars() {
    stars.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.speed / 2})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

// UI 그리기 (플레이 중)
function drawUI() {
    ctx.fillStyle = '#FFF';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    
    ctx.fillText(`스테이지: ${stage}`, 10, 20);
    ctx.fillText(`점수: ${score}`, 10, 40);
    ctx.fillText(`거리: ${distance}m`, 10, 60);
    ctx.fillText(`코인: ${coins}`, 10, 80);
    ctx.fillText(`처치: ${killCount}`, 10, 100);
    
    // 크레딧 표시 (오른쪽 상단)
    ctx.textAlign = 'right';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`크레딧: ${credits}`, canvas.width - 10, 20);
    ctx.fillStyle = '#AAA';
    ctx.font = '10px Arial';
    ctx.fillText('(1: +1, 2: +2, 5: +5)', canvas.width - 10, 35);
    
    // 플레이어 상태
    if (player.defense) {
        ctx.fillStyle = '#4CAF50';
        ctx.textAlign = 'left';
        ctx.font = '14px Arial';
        ctx.fillText('방어막 활성화', 10, 120);
    }
    if (player.magnet) {
        ctx.fillStyle = '#2196F3';
        ctx.textAlign = 'left';
        ctx.font = '14px Arial';
        ctx.fillText('자석 활성화', 10, 140);
    }
    if (player.attackPower > 1) {
        ctx.fillStyle = '#FF5722';
        ctx.textAlign = 'left';
        ctx.font = '14px Arial';
        ctx.fillText(`공격력: x${player.attackPower}`, 10, 160);
    }
}

// 타이틀 화면 그리기
function drawTitle() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#2196F3';
    ctx.font = '32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('DragonFlight', canvas.width / 2, canvas.height / 4);
    
    ctx.fillStyle = '#FFF';
    ctx.font = '16px Arial';
    ctx.fillText('세로 스크롤 슈팅 게임', canvas.width / 2, canvas.height / 4 + 40);
    
    // 크레딧 표시
    ctx.fillStyle = '#FFD700';
    ctx.font = '20px Arial';
    ctx.fillText(`크레딧: ${credits}`, canvas.width / 2, canvas.height / 2);
    
    ctx.fillStyle = '#AAA';
    ctx.font = '14px Arial';
    ctx.fillText('크레딧 코인 입력:', canvas.width / 2, canvas.height / 2 + 40);
    ctx.fillText('키보드: 1, 2, 5 키 / 터치: 탭', canvas.width / 2, canvas.height / 2 + 60);
    
    if (credits > 0) {
        ctx.fillStyle = '#4CAF50';
        ctx.font = '16px Arial';
        ctx.fillText('Enter 또는 클릭하여 시작', canvas.width / 2, canvas.height / 2 + 100);
    } else {
        ctx.fillStyle = '#F44336';
        ctx.font = '16px Arial';
        ctx.fillText('크레딧이 필요합니다', canvas.width / 2, canvas.height / 2 + 100);
    }
}

// 게임오버 화면 그리기
function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#F44336';
    ctx.font = '28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 3);
    
    ctx.fillStyle = '#FFF';
    ctx.font = '16px Arial';
    ctx.fillText(`최종 점수: ${score}`, canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillText(`스테이지: ${stage} | 처치: ${killCount}`, canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillText(`코인: ${coins}`, canvas.width / 2, canvas.height / 2 + 40);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = '14px Arial';
    ctx.fillText('컨티뉴: 크레딧을 넣어 이어서 플레이', canvas.width / 2, canvas.height / 2 + 80);
}

// 컨티뉴 화면 그리기
function drawContinue() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#FF9800';
    ctx.font = '28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CONTINUE', canvas.width / 2, canvas.height / 3);
    
    ctx.fillStyle = '#FFF';
    ctx.font = '16px Arial';
    ctx.fillText(`현재 스테이지: ${stage}`, canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillText(`현재 점수: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
    
    // 카운트다운
    const remaining = Math.max(0, Math.ceil((continueTimeout - continueTimer) / 60));
    ctx.fillStyle = '#F44336';
    ctx.font = '24px Arial';
    ctx.fillText(`남은 시간: ${remaining}초`, canvas.width / 2, canvas.height / 2 + 50);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = '14px Arial';
    ctx.fillText(`크레딧: ${credits} (1: +1, 2: +2, 5: +5, Enter: 컨티뉴)`, canvas.width / 2, canvas.height / 2 + 90);
}

//菜单 그리기
function drawMenu() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#2196F3';
    ctx.font = '28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('DragonFlight', canvas.width / 2, canvas.height / 3);
    
    ctx.fillStyle = '#FFF';
    ctx.font = '16px Arial';
    ctx.fillText('세로 스크롤 슈팅 게임', canvas.width / 2, canvas.height / 3 + 40);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = '14px Arial';
    ctx.fillText('클릭하여 시작', canvas.width / 2, canvas.height / 2 + 20);
    
    ctx.fillStyle = '#AAA';
    ctx.font = '12px Arial';
    ctx.fillText('키보드: ← → (이동)', canvas.width / 2, canvas.height / 2 + 60);
    ctx.fillText('마우스: 이동', canvas.width / 2, canvas.height / 2 + 80);
}

// 적 생성
function spawnEnemyWave() {
    waveCount++;
    const waveSize = Math.min(3 + Math.floor(waveCount / 2), 6);
    const rows = Math.min(1 + Math.floor(waveCount / 3), 3);
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < waveSize; col++) {
            const x = 50 + col * 60;
            const y = -30 - row * 40;
            const health = 1 + Math.floor(stage / 2);
            
            enemies.push({
                x: x,
                y: y,
                width: 24,
                height: 30,
                health: health,
                maxHealth: health,
                speed: 1 + stage * 0.2,
                isBoss: false
            });
        }
    }
    
    enemiesInWave = enemies.length;
}

// 보스 생성
function spawnBoss() {
    const boss = {
        x: canvas.width / 2,
        y: -30,
        width: 40,
        height: 50,
        health: 5 + stage * 3,
        maxHealth: 5 + stage * 3,
        speed: 1.5,
        isBoss: true,
        moveDirection: 1,
        moveSpeed: 2
    };
    
    enemies.push(boss);
    enemiesInWave = 1;
}

// 운석 생성
function spawnMeteorWarning() {
    const x = Math.random() * (canvas.width - 30) + 15;
    meteorWarnings.push({
        x: x,
        y: 0,
        timer: 60
    });
}

function spawnMeteor() {
    const warning = meteorWarnings.shift();
    if (warning) {
        meteors.push({
            x: warning.x,
            y: -20,
            speed: 3 + stage * 0.5
        });
    }
}

// 아이템-drop
function dropItem(x, y) {
    const rand = Math.random();
    let type;
    if (rand < 0.3) {
        type = 'attack';
    } else if (rand < 0.6) {
        type = 'magnet';
    } else {
        type = 'defense';
    }
    
    items.push({
        x: x,
        y: y,
        type: type,
        speed: 2
    });
}

//碰撞检测
function checkCollision(a, b) {
    return Math.abs(a.x - b.x) < (a.width + b.width) / 2 &&
           Math.abs(a.y - b.y) < (a.height + b.height) / 2;
}

// 업데이트
function update() {
    frameCount++;
    
    if (gameState === GameState.PLAYING) {
        // 플레이어 이동
        if (keys['ArrowLeft'] || keys['a']) {
            player.x -= player.speed;
        }
        if (keys['ArrowRight'] || keys['d']) {
            player.x += player.speed;
        }
        
        // 마우스 이동
        player.x = mouseX;
        
        // 플레이어 경계
        player.x = Math.max(20, Math.min(canvas.width - 20, player.x));
        
        // 자동 공격
        if (frameCount % 10 === 0) {
            if (player.attackPower >= 3) {
                bullets.push({ x: player.x, y: player.y - 20, speed: 8 });
                bullets.push({ x: player.x - 10, y: player.y - 15, speed: 7 });
                bullets.push({ x: player.x + 10, y: player.y - 15, speed: 7 });
            } else if (player.attackPower >= 2) {
                bullets.push({ x: player.x, y: player.y - 20, speed: 8 });
                bullets.push({ x: player.x - 8, y: player.y - 15, speed: 7 });
                bullets.push({ x: player.x + 8, y: player.y - 15, speed: 7 });
            } else {
                bullets.push({ x: player.x, y: player.y - 20, speed: 8 });
            }
        }
        
        // 총알 업데이트
        bullets.forEach(bullet => {
            bullet.y -= bullet.speed;
        });
        bullets = bullets.filter(bullet => bullet.y > -10);
        
        // 적 업데이트
        enemies.forEach(enemy => {
            if (enemy.isBoss) {
                enemy.y += enemy.speed;
                enemy.x += enemy.moveDirection * enemy.moveSpeed;
                
                if (enemy.x < 30 || enemy.x > canvas.width - 30) {
                    enemy.moveDirection *= -1;
                }
            } else {
                enemy.y += enemy.speed;
            }
        });
        
        // 적과 총알碰撞
        bullets.forEach(bullet => {
            enemies.forEach(enemy => {
                if (checkCollision(bullet, enemy)) {
                    enemy.health -= player.attackPower;
                    bullet.y = -100; // 총알 제거
                    
                    if (enemy.health <= 0) {
                        score += enemy.isBoss ? 100 : 10;
                        killCount++;
                        coins += enemy.isBoss ? 10 : 1;
                        
                        if (!enemy.isBoss) {
                            dropItem(enemy.x, enemy.y);
                        } else {
                            // 보스는 항상 아이템-drop
                            dropItem(enemy.x, enemy.y);
                            dropItem(enemy.x - 15, enemy.y);
                            dropItem(enemy.x + 15, enemy.y);
                            
                            // 보스 쓰러뜨리면 다음 스테이지
                            stage++;
                        }
                        
                        enemies = enemies.filter(e => e !== enemy);
                        enemiesInWave--;
                    }
                }
            });
        });
        
        // 적과 플레이어碰撞
        enemies.forEach(enemy => {
            if (checkCollision(player, enemy)) {
                if (!player.defense) {
                    gameState = GameState.GAME_OVER;
                }
            }
        });
        
        // 적 제거 (화면 خارج)
        enemies = enemies.filter(enemy => enemy.y < canvas.height + 50);
        
        // 웨이브 관리
        waveTimer++;
        if (enemies.length === 0 && waveTimer > 30) {
            waveTimer = 0;
            
            if (waveCount % 5 === 0) {
                spawnBoss();
            } else {
                spawnEnemyWave();
            }
        }
        
        // 운석 관리
        if (frameCount % 120 === 0) {
            spawnMeteorWarning();
        }
        
        meteorWarnings.forEach(warning => {
            warning.y += 2;
            warning.timer--;
        });
        meteorWarnings = meteorWarnings.filter(w => w.timer > 0 && w.y < canvas.height);
        
        meteors.forEach(meteor => {
            meteor.y += meteor.speed;
        });
        
        // 운석과 플레이어碰撞
        meteors.forEach(meteor => {
            if (checkCollision(player, meteor)) {
                if (!player.defense) {
                    gameState = GameState.GAME_OVER;
                }
            }
        });
        
        meteors = meteors.filter(meteor => meteor.y < canvas.height + 20);
        
        // 코인 업데이트
        coinsList.forEach(coin => {
            coin.y += 2;
            
            // 자석 효과
            if (player.magnet) {
                const dx = player.x - coin.x;
                const dy = player.y - coin.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 100) {
                    coin.x += dx / dist * 3;
                    coin.y += dy / dist * 3;
                }
            }
        });
        
        coinsList = coinsList.filter(coin => coin.y < canvas.height + 10);
        
        // 아이템 업데이트
        items.forEach(item => {
            item.y += item.speed;
            
            // 자석 효과
            if (player.magnet) {
                const dx = player.x - item.x;
                const dy = player.y - item.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    item.x += dx / dist * 4;
                    item.y += dy / dist * 4;
                }
            }
        });
        
        // 아이템과 플레이어 collision
        items.forEach(item => {
            if (checkCollision(player, item)) {
                if (item.type === 'attack') {
                    player.attackPower = Math.min(player.attackPower + 1, 3);
                    setTimeout(() => { player.attackPower = Math.max(1, player.attackPower - 1); }, 5000);
                } else if (item.type === 'magnet') {
                    player.magnet = true;
                    setTimeout(() => { player.magnet = false; }, 8000);
                } else if (item.type === 'defense') {
                    player.defense = true;
                    setTimeout(() => { player.defense = false; }, 5000);
                }
                items = items.filter(i => i !== item);
            }
        });
        
        items = items.filter(item => item.y < canvas.height + 10);
        
        // 별 업데이트
        stars.forEach(star => {
            star.y += star.speed;
            if (star.y > canvas.height) {
                star.y = 0;
                star.x = Math.random() * canvas.width;
            }
        });
        
        // 점수 업데이트
        distance++;
        score = distance + killCount * 5 + coins * 2;
        
    } else if (gameState === GameState.CONTINUE) {
        continueTimer++;
        if (continueTimer >= continueTimeout) {
            // 시간 초과 시 타이틀로
            gameState = GameState.TITLE;
        }
    }
}

// 렌더링
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawStars();
    
    if (gameState === GameState.TITLE) {
        drawTitle();
        return;
    }
    
    if (gameState === GameState.PLAYING) {
        drawBullets();
        drawEnemies();
        drawCoins();
        drawItems();
        drawMeteorWarnings();
        drawMeteors();
        drawPlayer();
        drawUI();
    }
    
    if (gameState === GameState.GAME_OVER) {
        drawGameOver();
    }
    
    if (gameState === GameState.CONTINUE) {
        drawContinue();
    }
}

function drawEnemies() {
    enemies.forEach(enemy => {
        if (enemy.isBoss) {
            drawBoss(enemy);
        } else {
            drawEnemy(enemy);
        }
    });
}

function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// 게임 시작
initGame();
gameLoop();
