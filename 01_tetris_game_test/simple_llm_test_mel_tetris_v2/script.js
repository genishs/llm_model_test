const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const cellSize = 30;
const width = 10;
const height = 20;
canvas.width = width * cellSize;
canvas.height = height * cellSize;

let board = Array.from({ length: height }, () => Array(width).fill(0));
let currentPiece = null;
let currentX = 0,
    currentY = 0,
    currentRotation = 0;
let score = 0;
let linesCleared = 0;
let level = 1;
let gameRunning = false;
let dropInterval = 1000;
let lastDropTime = Date.now();

const pieces = [
    // I
    [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    // O
    [
        [2, 2],
        [2, 2]
    ],
    // T
    [
        [0, 3, 0],
        [3, 3, 3],
        [0, 0, 0]
    ],
    // S
    [
        [0, 4, 4],
        [4, 4, 0],
        [0, 0, 0]
    ],
    // Z
    [
        [5, 5, 0],
        [0, 5, 5],
        [0, 0, 0]
    ],
    // J
    [
        [0, 0, 6],
        [6, 6, 6],
        [0, 0, 0]
    ],
    // L
    [
        [6, 0, 0],
        [6, 6, 6],
        [0, 0, 0]
    ]
];

function createPiece() {
    const pieceIndex = Math.floor(Math.random() * pieces.length);
    const shape = pieces[pieceIndex];
    currentPiece = {
        shape,
        type: pieceIndex + 1,
        x: Math.floor(width / 2) - Math.floor(shape[0].length / 2),
        y: 0
    };
    currentRotation = 0;
    // Check collision immediately
    if (checkCollision()) {
        gameOver();
    }
}

function rotatePiece() {
    const rotated = rotateMatrix(currentPiece.shape);
    const originalShape = currentPiece.shape;
    currentPiece.shape = rotated;
    if (checkCollision()) {
        currentPiece.shape = originalShape; // revert if collision
    }
}

function rotateMatrix(matrix) {
    const N = matrix.length;
    const M = matrix[0].length;
    const result = Array.from({ length: M }, () => Array(N).fill(0));
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < M; j++) {
            result[j][N - 1 - i] = matrix[i][j];
        }
    }
    return result;
}

function checkCollision(offsetX = 0, offsetY = 0, rotation = currentRotation) {
    const shape = rotateMatrix(currentPiece.shape, rotation);
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x] !== 0) {
                const boardX = currentX + x + offsetX;
                const boardY = currentY + y + offsetY;
                if (
                    boardX < 0 || boardX >= width ||
                    boardY >= height ||
                    (boardY >= 0 && board[boardY][boardX] !== 0)
                ) {
                    return true;
                }
            }
        }
    }
    return false;
}

function mergePiece() {
    const shape = currentPiece.shape;
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x] !== 0) {
                const boardY = currentY + y;
                const boardX = currentX + x;
                if (boardY >= 0) {
                    board[boardY][boardX] = shape[y][x];
                }
            }
        }
    }
}

function clearLines() {
    let linesToRemove = 0;
    for (let y = height - 1; y >= 0; y--) {
        if (board[y].every(cell => cell !== 0)) {
            linesToRemove++;
            board.splice(y, 1);
            board.unshift(Array(width).fill(0));
            y++; // Check the same row again
        }
    }
    if (linesToRemove > 0) {
        linesCleared += linesToRemove;
        score += linesToRemove * 100 * level;
        updateStats();
    }
}

function updateStats() {
    document.getElementById('score').innerText = 'Score: ' + score;
    document.getElementById('lines').innerText = 'Lines: ' + linesCleared;
    document.getElementById('level').innerText = 'Level: ' + level;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw board
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (board[y][x] !== 0) {
                ctx.fillStyle = `hsl(${(board[y][x] - 1) * 60}, 100%, 50%)`;
                ctx.fillRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);
            }
        }
    }
    // Draw current piece
    if (currentPiece) {
        const shape = currentPiece.shape;
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x] !== 0) {
                    const boardX = currentX + x;
                    const boardY = currentY + y;
                    if (boardY >= 0) {
                        ctx.fillStyle = `hsl(${(currentPiece.type - 1) * 60}, 100%, 50%)`;
                        ctx.fillRect(boardX * cellSize, boardY * cellSize, cellSize - 1, cellSize - 1);
                    }
                }
            }
        }
    }
}

function drop() {
    currentY++;
    if (checkCollision()) {
        currentY--;
        mergePiece();
        clearLines();
        createPiece();
        gameRunning = checkCollision();
        if (!gameRunning) {
            gameOver();
        }
    }
}

function hardDrop() {
    while (!checkCollision(0, 1)) {
        currentY++;
    }
    currentY--;
    drop();
}

function move(dx, dy = 0) {
    if (!checkCollision(dx, dy)) {
        currentX += dx;
        currentY += dy;
        return true;
    }
    return false;
}

function gameOver() {
    gameRunning = false;
    document.getElementById('game-over').style.display = 'block';
}

function startGame() {
    board = Array.from({ length: height }, () => Array(width).fill(0));
    score = 0;
    linesCleared = 0;
    level = 1;
    updateStats();
    document.getElementById('game-over').style.display = 'none';
    createPiece();
    gameRunning = true;
    lastDropTime = Date.now();
    adjustSpeed();
}

function adjustSpeed() {
    dropInterval = 1000 - (level - 1) * 100;
    if (dropInterval < 200) dropInterval = 200;
}

function gameLoop() {
    if (!gameRunning) return;
    const now = Date.now();
    const delta = now - lastDropTime;
    if (delta > dropInterval) {
        drop();
        lastDropTime = now;
    }
    draw();
    requestAnimationFrame(gameLoop);
}

// Event listeners
document.addEventListener('keydown', e => {
    if (!gameRunning && e.key === ' ') {
        startGame();
        return;
    }
    if (!gameRunning) return;
    switch (e.key) {
        case 'ArrowLeft':
            move(-1);
            break;
        case 'ArrowRight':
            move(1);
            break;
        case 'ArrowDown':
            drop();
            break;
        case 'ArrowUp':
            rotatePiece();
            break;
        case ' ': // Space for hard drop
            hardDrop();
            break;
        case 'p':
        case 'P':
            if (gameRunning) {
                gameRunning = false;
                document.getElementById('game-over').style.display = 'none';
            } else {
                startGame();
            }
            break;
    }
});

document.getElementById('restart-btn').addEventListener('click', () => {
    startGame();
});

// Touch controls
const touchLeft = document.querySelector('.touch-left');
const touchUp = document.querySelector('.touch-up');
const touchRight = document.querySelector('.touch-right');
const touchDown = document.querySelector('.touch-down');
const touchRotate = document.querySelector('.touch-rotate');

if (touchLeft) touchLeft.addEventListener('click', () => {
    if (gameRunning) move(-1);
});
if (touchUp) touchUp.addEventListener('click', () => {
    if (gameRunning) rotatePiece();
});
if (touchRight) touchRight.addEventListener('click', () => {
    if (gameRunning) move(1);
});
if (touchDown) touchDown.addEventListener('click', () => {
    if (gameRunning) drop();
});
if (touchRotate) touchRotate.addEventListener('click', () => {
    if (gameRunning) rotatePiece();
});
    startGame();
});

// Start the game
createPiece();
gameLoop();
