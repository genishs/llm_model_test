// Tetris - Arcade Style with Credits & Continue System

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 24;
const NEXT_BLOCK_SIZE = 20;

// Atari-style colors
const COLORS = [
    null,
    '#00f0f0', // I - Cyan
    '#f0f000', // J - Yellow
    '#f00000', // L - Red
    '#00f000', // O - Green
    '#0000f0', // S - Blue
    '#f0a000', // T - Orange
    '#00f000'  // Z - Green
];

// Tetromino shapes
const SHAPES = [
    [],
    [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], // I
    [[2,0,0],[2,2,2],[0,0,0]],                 // J
    [[0,0,3],[3,3,3],[0,0,0]],                 // L
    [[4,4],[4,4]],                             // O
    [[0,5,5],[5,5,0],[0,0,0]],                 // S
    [[0,6,0],[6,6,6],[0,0,0]],                 // T
    [[7,7,0],[0,7,7],[0,0,0]]                  // Z
];

let board = [];
let currentPiece = null;
let nextPiece = null;
let score = 0;
let level = 1;
let lines = 0;
let credits = 0;
let gameRunning = false;
let gamePaused = false;
let dropInterval = 1000;
let lastDropTime = 0;
let animationId = null;

// Game states
const STATE_TITLE = 'title';
const STATE_PLAYING = 'playing';
const STATE_GAMEOVER = 'gameover';
const STATE_CONTINUE = 'continue';

let currentState = STATE_TITLE;
let continueTimer = null;
let continueCountdown = 10;

// Initialize board
function initBoard() {
    board = [];
    for (let r = 0; r < ROWS; r++) {
        board[r] = new Array(COLS).fill(0);
    }
}

// Create a new piece
function createPiece(type) {
    return {
        type: type,
        shape: SHAPES[type].map(row => [...row]),
        x: Math.floor(COLS / 2) - Math.floor(SHAPES[type][0].length / 2),
        y: 0
    };
}

// Get random piece type
function randomPieceType() {
    return Math.floor(Math.random() * 7) + 1;
}

// Rotate piece clockwise
function rotatePiece(piece) {
    const shape = piece.shape;
    const rotated = [];
    const size = shape.length;
    
    for (let i = 0; i < size; i++) {
        rotated[i] = [];
        for (let j = 0; j < size; j++) {
            rotated[i][j] = shape[size - 1 - j][i];
        }
    }
    
    return rotated;
}

// Check collision
function collides(piece, board, offsetX = 0, offsetY = 0) {
    const shape = piece.shape;
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
                const newX = piece.x + c + offsetX;
                const newY = piece.y + r + offsetY;
                
                if (newX < 0 || newX >= COLS || newY >= ROWS) {
                    return true;
                }
                
                if (newY >= 0 && board[newY][newX]) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Merge piece into board
function mergePiece(piece) {
    const shape = piece.shape;
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
                const boardY = piece.y + r;
                const boardX = piece.x + c;
                if (boardY >= 0) {
                    board[boardY][boardX] = piece.type;
                }
            }
        }
    }
}

// Clear full lines
function clearLines() {
    let linesCleared = 0;
    
    for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r].every(cell => cell !== 0)) {
            board.splice(r, 1);
            board.unshift(new Array(COLS).fill(0));
            linesCleared++;
            r++;
        }
    }
    
    if (linesCleared > 0) {
        lines += linesCleared;
        
        // Atari scoring system
        const scoreTable = [0, 40, 100, 300, 1200];
        score += scoreTable[linesCleared] * level;
        
        // Level up every 10 lines
        level = Math.floor(lines / 10) + 1;
        
        // Speed up: faster drop at higher levels
        dropInterval = Math.max(100, 1000 - (level - 1) * 100);
    }
    
    updateScoreBoard();
}

// Draw block on canvas
function drawBlock(ctx, x, y, color, blockSize) {
    ctx.fillStyle = color;
    ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
    
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(x * blockSize, y * blockSize, blockSize, blockSize);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(x * blockSize, y * blockSize, blockSize, 2);
    ctx.fillRect(x * blockSize, y * blockSize, 2, blockSize);
}

// Draw board
function drawBoard() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (board[r][c]) {
                drawBlock(ctx, c, r, COLORS[board[r][c]], BLOCK_SIZE);
            }
        }
    }
}

// Draw current piece
function drawPiece(piece, ctx, blockSize) {
    const shape = piece.shape;
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
                drawBlock(ctx, piece.x + c, piece.y + r, COLORS[piece.type], blockSize);
            }
        }
    }
}

// Draw next piece
function drawNextPiece() {
    nextCtx.fillStyle = '#000';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    if (nextPiece) {
        const offsetX = (4 - nextPiece.shape[0].length) / 2;
        const offsetY = (4 - nextPiece.shape.length) / 2;
        
        const shape = nextPiece.shape;
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    drawBlock(nextCtx, offsetX + c, offsetY + r, COLORS[nextPiece.type], NEXT_BLOCK_SIZE);
                }
            }
        }
    }
}

// Ghost piece
function drawGhostPiece() {
    if (!currentPiece) return;
    
    let ghostY = currentPiece.y;
    while (!collides(currentPiece, board, 0, ghostY - currentPiece.y + 1)) {
        ghostY++;
    }
    
    if (ghostY !== currentPiece.y) {
        const shape = currentPiece.shape;
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    ctx.strokeStyle = COLORS[currentPiece.type];
                    ctx.lineWidth = 1;
                    ctx.strokeRect(
                        (currentPiece.x + c) * BLOCK_SIZE,
                        (ghostY + r) * BLOCK_SIZE,
                        BLOCK_SIZE,
                        BLOCK_SIZE
                    );
                }
            }
        }
    }
}

// Update score board display
function updateScoreBoard() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('lines').textContent = lines;
    document.getElementById('credits').textContent = credits;
}

// Soft drop
function softDrop() {
    if (!collides(currentPiece, board, 0, 1)) {
        currentPiece.y++;
        score += 1;
        updateScoreBoard();
    }
}

// Hard drop
function hardDrop() {
    while (!collides(currentPiece, board, 0, 1)) {
        currentPiece.y++;
        score += 2;
    }
    updateScoreBoard();
    lockPiece();
}

// Lock piece in place
function lockPiece() {
    mergePiece(currentPiece);
    clearLines();
    
    currentPiece = nextPiece;
    nextPiece = createPiece(randomPieceType());
    drawNextPiece();
    
    if (collides(currentPiece, board)) {
        gameOver();
    }
}

// Game over - show continue screen
function gameOver() {
    gameRunning = false;
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    currentState = STATE_GAMEOVER;
    
    const overlay = document.getElementById('overlay');
    const overlayContent = document.getElementById('overlay-content');
    
    overlayContent.innerHTML = `
        <h2>GAME OVER</h2>
        <p>Score: <span class="highlight">${score}</span></p>
        <p>Level: <span class="highlight">${level}</span></p>
        <p class="countdown" id="continue-countdown">10</p>
        <p>Press <span class="highlight">C</span> or <span class="highlight">SPACE</span> to Continue (1 Credit)</p>
    `;
    overlay.style.display = 'flex';
    
    // Start continue countdown
    continueCountdown = 10;
    updateContinueCountdown();
    continueTimer = setInterval(() => {
        continueCountdown--;
        updateContinueCountdown();
        if (continueCountdown <= 0) {
            toTitleScreen();
        }
    }, 1000);
}

// Update continue countdown display
function updateContinueCountdown() {
    const countdownEl = document.getElementById('continue-countdown');
    if (countdownEl) {
        countdownEl.textContent = continueCountdown;
    }
}

// Continue game using 1 credit
function continueGame() {
    if (credits <= 0) {
        return;
    }
    
    credits--;
    updateScoreBoard();
    
    if (continueTimer) {
        clearInterval(continueTimer);
    }
    
    currentState = STATE_PLAYING;
    
    const overlay = document.getElementById('overlay');
    overlay.style.display = 'none';
    
    gameRunning = true;
    gamePaused = false;
    lastDropTime = performance.now();
    gameLoop();
}

// Go to title screen
function toTitleScreen() {
    if (continueTimer) {
        clearInterval(continueTimer);
    }
    
    currentState = STATE_TITLE;
    gameRunning = false;
    
    const overlay = document.getElementById('overlay');
    const overlayContent = document.getElementById('overlay-content');
    
    overlayContent.innerHTML = `
        <h2>TETRIS</h2>
        <p>Credits: <span class="highlight">${credits}</span></p>
        <p>Press <span class="highlight">ENTER</span> to Start</p>
        <p id="credit-info">Insert Coin (C or SPACE)</p>
    `;
    overlay.style.display = 'flex';
}

// Start game
function startGame() {
    if (credits <= 0) {
        return;
    }
    
    credits--;
    updateScoreBoard();
    
    initBoard();
    score = 0;
    level = 1;
    lines = 0;
    dropInterval = 1000;
    gameRunning = true;
    gamePaused = false;
    currentState = STATE_PLAYING;
    
    updateScoreBoard();
    
    currentPiece = createPiece(randomPieceType());
    nextPiece = createPiece(randomPieceType());
    drawNextPiece();
    
    const overlay = document.getElementById('overlay');
    overlay.style.display = 'none';
    
    lastDropTime = performance.now();
    gameLoop();
}

// Game loop
function gameLoop(time = 0) {
    if (!gameRunning || gamePaused) return;
    
    const deltaTime = time - lastDropTime;
    
    if (deltaTime > dropInterval) {
        if (!collides(currentPiece, board, 0, 1)) {
            currentPiece.y++;
        } else {
            lockPiece();
        }
        lastDropTime = time;
    }
    
    drawBoard();
    drawGhostPiece();
    drawPiece(currentPiece, ctx, BLOCK_SIZE);
    
    animationId = requestAnimationFrame(gameLoop);
}

// Handle keyboard input
document.addEventListener('keydown', (e) => {
    // Credit input (C or SPACE on title/gameover screen)
    if (e.key === 'c' || e.key === 'C' || e.key === ' ') {
        if (currentState === STATE_TITLE || currentState === STATE_GAMEOVER) {
            credits++;
            updateScoreBoard();
            
            if (currentState === STATE_TITLE) {
                const creditInfo = document.getElementById('credit-info');
                if (creditInfo) {
                    creditInfo.textContent = `Credits: ${credits} - Press ENTER to Start`;
                }
            }
            return;
        }
    }
    
    // Start game with ENTER
    if (e.key === 'Enter') {
        if (currentState === STATE_TITLE && credits > 0) {
            startGame();
        }
        return;
    }
    
    // Continue with C or SPACE
    if ((e.key === 'c' || e.key === 'C' || e.key === ' ') && currentState === STATE_GAMEOVER) {
        continueGame();
        return;
    }
    
    // Pause with P
    if ((e.key === 'p' || e.key === 'P') && currentState === STATE_PLAYING) {
        gamePaused = !gamePaused;
        if (!gamePaused) {
            lastDropTime = performance.now();
            gameLoop();
        } else {
            const overlay = document.getElementById('overlay');
            const overlayContent = document.getElementById('overlay-content');
            overlayContent.innerHTML = `
                <h2>PAUSED</h2>
                <p>Press P to Resume</p>
            `;
            overlay.style.display = 'flex';
        }
        return;
    }
    
    // Game controls during play
    if (!gameRunning || gamePaused || currentState !== STATE_PLAYING) return;
    
    switch(e.key) {
        case 'ArrowLeft':
            if (!collides(currentPiece, board, -1, 0)) {
                currentPiece.x--;
            }
            break;
        case 'ArrowRight':
            if (!collides(currentPiece, board, 1, 0)) {
                currentPiece.x++;
            }
            break;
        case 'ArrowUp':
            const rotated = rotatePiece(currentPiece);
            const originalShape = currentPiece.shape;
            currentPiece.shape = rotated;
            
            if (collides(currentPiece, board)) {
                if (!collides(currentPiece, board, -1, 0)) {
                    currentPiece.x--;
                } else if (!collides(currentPiece, board, 1, 0)) {
                    currentPiece.x++;
                } else {
                    currentPiece.shape = originalShape;
                }
            }
            break;
        case 'ArrowDown':
            softDrop();
            break;
        case ' ':
            hardDrop();
            break;
    }
});

// Touch control handlers
function handleTouchAction(action) {
    if (!gameRunning || gamePaused || currentState !== STATE_PLAYING) return;
    
    switch(action) {
        case 'left':
            if (!collides(currentPiece, board, -1, 0)) {
                currentPiece.x--;
            }
            break;
        case 'right':
            if (!collides(currentPiece, board, 1, 0)) {
                currentPiece.x++;
            }
            break;
        case 'up':
            const rotated = rotatePiece(currentPiece);
            const originalShape = currentPiece.shape;
            currentPiece.shape = rotated;
            
            if (collides(currentPiece, board)) {
                if (!collides(currentPiece, board, -1, 0)) {
                    currentPiece.x--;
                } else if (!collides(currentPiece, board, 1, 0)) {
                    currentPiece.x++;
                } else {
                    currentPiece.shape = originalShape;
                }
            }
            break;
        case 'down':
            softDrop();
            break;
        case 'drop':
            hardDrop();
            break;
    }
}

// Touch button event listeners
document.getElementById('btn-left').addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleTouchAction('left');
});

document.getElementById('btn-right').addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleTouchAction('right');
});

document.getElementById('btn-rotate').addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleTouchAction('up');
});

document.getElementById('btn-down').addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleTouchAction('down');
});

document.getElementById('btn-drop').addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleTouchAction('drop');
});

// Credit button (touch)
document.getElementById('btn-credit').addEventListener('touchstart', (e) => {
    e.preventDefault();
    credits++;
    updateScoreBoard();
    
    if (currentState === STATE_TITLE) {
        const creditInfo = document.getElementById('credit-info');
        if (creditInfo) {
            creditInfo.textContent = `Credits: ${credits} - Press ENTER to Start`;
        }
    }
});

// Also support click events for desktop testing
document.getElementById('btn-left').addEventListener('click', () => handleTouchAction('left'));
document.getElementById('btn-right').addEventListener('click', () => handleTouchAction('right'));
document.getElementById('btn-rotate').addEventListener('click', () => handleTouchAction('up'));
document.getElementById('btn-down').addEventListener('click', () => handleTouchAction('down'));
document.getElementById('btn-drop').addEventListener('click', () => handleTouchAction('drop'));
document.getElementById('btn-credit').addEventListener('click', () => {
    credits++;
    updateScoreBoard();
    if (currentState === STATE_TITLE) {
        const creditInfo = document.getElementById('credit-info');
        if (creditInfo) {
            creditInfo.textContent = `Credits: ${credits} - Press ENTER to Start`;
        }
    }
});

// Initial draw
initBoard();
drawBoard();
updateScoreBoard();