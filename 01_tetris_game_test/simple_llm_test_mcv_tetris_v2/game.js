// Tetris - Atari 1988 Arcade Style Implementation

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
    '#00f000'  // Z - Green (different shade)
];

// Tetromino shapes (Atari 1988 style)
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
let gameRunning = false;
let gamePaused = false;
let dropInterval = 1000;
let lastDropTime = 0;
let animationId = null;

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
        
        // Speed up
        dropInterval = Math.max(100, 1000 - (level - 1) * 100);
    }
    
    updateScoreBoard();
}

// Draw block on canvas
function drawBlock(ctx, x, y, color, blockSize) {
    ctx.fillStyle = color;
    ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
    
    // Add border for Atari-style look
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(x * blockSize, y * blockSize, blockSize, blockSize);
    
    // Add highlight
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
        // Center the next piece in the preview
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

// Ghost piece (preview where piece will land)
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
    
    // Get next piece
    currentPiece = nextPiece;
    nextPiece = createPiece(randomPieceType());
    drawNextPiece();
    
    // Check game over
    if (collides(currentPiece, board)) {
        gameOver();
    }
}

// Game over
function gameOver() {
    gameRunning = false;
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    const overlay = document.getElementById('overlay');
    const overlayContent = document.getElementById('overlay-content');
    overlayContent.innerHTML = `
        <h2>GAME OVER</h2>
        <p>Score: ${score}</p>
        <p>Press ENTER to Restart</p>
    `;
    overlay.style.display = 'flex';
}

// Start game
function startGame() {
    initBoard();
    score = 0;
    level = 1;
    lines = 0;
    dropInterval = 1000;
    gameRunning = true;
    gamePaused = false;
    
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
    if (!gameRunning && e.key === 'Enter') {
        startGame();
        return;
    }
    
    if (!gameRunning || gamePaused) return;
    
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
            // Rotate
            const rotated = rotatePiece(currentPiece);
            const originalShape = currentPiece.shape;
            currentPiece.shape = rotated;
            
            // Wall kick (simple)
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
        case 'p':
        case 'P':
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
            break;
    }
});

// Touch control handlers
function handleTouchAction(action) {
    if (!gameRunning || gamePaused) return;
    
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
            // Rotate
            const rotated = rotatePiece(currentPiece);
            const originalShape = currentPiece.shape;
            currentPiece.shape = rotated;
            
            // Wall kick (simple)
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

// Add touch event listeners for buttons
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

// Also support click events for testing on desktop
document.getElementById('btn-left').addEventListener('click', () => handleTouchAction('left'));
document.getElementById('btn-right').addEventListener('click', () => handleTouchAction('right'));
document.getElementById('btn-rotate').addEventListener('click', () => handleTouchAction('up'));
document.getElementById('btn-down').addEventListener('click', () => handleTouchAction('down'));
document.getElementById('btn-drop').addEventListener('click', () => handleTouchAction('drop'));

// Initial draw
initBoard();
drawBoard();