/* ====== VIEW CONSTANTS ======
const SCREEN_WIDTH  = 1920;
const SCREEN_HEIGHT = 1080;
const WORLD_SCREENS_X = 5;
const WORLD_SCREENS_Y = 5;
const WORLD_WIDTH  = SCREEN_WIDTH  * WORLD_SCREENS_X;   // 9600
const WORLD_HEIGHT = SCREEN_HEIGHT * WORLD_SCREENS_Y;   // 5400

const VIEW_WIDTH  = SCREEN_WIDTH;
const VIEW_HEIGHT = SCREEN_HEIGHT;

const tickLength = 20; // 50 tps

/* ====== PHYSICS CONSTANTS ======
const GRAVITY = 0.9;
const MAX_FALL_SPEED = 40;
const MOVE_SPEED = 8;
const JUMP_SPEED = 30;

/* ====== GAME STATE ======
let frameAccumulator = 0;
let lastTimestamp = 0;
let playerObj;
let gameStarted = false;
let isPaused = false;

const keys = { w: false, a: false, s: false, d: false, space: false, p: false };

/* ====== HELPER FUNCTIONS ======
function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(v, hi));
}

function isColliding(a, b) {
    return a.x < b.x + b.width  &&
           a.x + a.width  > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

/* ====== LEVEL ======
const platforms = [];
const GROUND_HEIGHT = 60;

function buildLevel() {
    platforms.length = 0;

    const groundY = WORLD_HEIGHT - GROUND_HEIGHT;

    // Ground slab spanning the entire world.
    platforms.push({ x: 0, y: groundY, width: WORLD_WIDTH, height: GROUND_HEIGHT });
    
    // All blue zig-zag ledges have been removed.
}

// ====== PLAYER CLASS ======
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width  = 80;
        this.height = 80;
        this.velX = 0;
        this.velY = 0;
        this.speed = MOVE_SPEED;

        this.onGround = false;
        this.jumpHeld = false;   // is the jump key still down from this jump?
        this.jumpCut  = false;   // has the short-hop already been applied?
        this.facing   = 1;
    }

    // ====== UPDATE PLAYER ======
    update() {
        // ------ Horizontal Input ------
        let dir = 0;
        if (keys.a && !keys.d) dir = -1;
        else if (keys.d && !keys.a) dir = 1;

        this.velX = dir * this.speed;
        if (dir !== 0) this.facing = dir;

        // ------ Jump Logic ------
        if (keys.space) {
            if (this.onGround && !this.jumpHeld) {
                this.velY     = -JUMP_SPEED;
                this.onGround = false;
                this.jumpCut  = false;
            }
            this.jumpHeld = true;
        } else {
            this.jumpHeld = false;
            // Short hop: releasing the key early clips the jump once.
            if (this.velY < 0 && !this.jumpCut) {
                this.velY *= 0.5;
                this.jumpCut = true;
            }
        }

        // ------ Gravity Engine ------
        this.velY = Math.min(this.velY + GRAVITY, MAX_FALL_SPEED);
        
        this.x += this.velX;
        this.collide(0);

        this.onGround = false;
        this.y += this.velY;
        this.collide(1);

        // ------ Keep Player Inside Canvas ------
        this.x = clamp(this.x, 0, WORLD_WIDTH  - this.width);
        this.y = clamp(this.y, 0, WORLD_HEIGHT - this.height);
    }

    // ====== COLLISION ENGINE ======
    collide(axis) {
        for (const p of platforms) {
            if (!isColliding(this, p)) continue;

            if (axis === 0) {                       // horizontal
                if (this.velX > 0)      this.x = p.x - this.width;
                else if (this.velX < 0) this.x = p.x + p.width;
                this.velX = 0;
            } else {                                // vertical
                if (this.velY > 0) {                // falling -> landed
                    this.y = p.y - this.height;
                    this.onGround = true;
                } else if (this.velY < 0) {         // rising -> bonk
                    this.y = p.y + p.height;
                }
                this.velY = 0;
            }
        }
    }

    // ====== DRAW PLAYER ======
    draw(ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // little eyes so you can tell which way you're facing
        const eyeSize = this.width * 0.14;
        const eyeY    = this.y + this.height * 0.28;
        const cx      = this.x + this.width / 2 + this.facing * this.width * 0.12;

        ctx.fillStyle = "#1a1a1a";
        ctx.fillRect(cx - this.width * 0.22, eyeY, eyeSize, eyeSize);
        ctx.fillRect(cx + this.width * 0.22 - eyeSize, eyeY, eyeSize, eyeSize);
    }
}

/* ====== CAMERA ======
const camera = {
    x: 0,
    y: 0,
    // ------ Follow Player ------
    follow(target) {
        const targetX = target.x + target.width  / 2 - VIEW_WIDTH  / 2;
        const targetY = target.y + target.height / 2 - VIEW_HEIGHT / 2;

        this.x = clamp(targetX, 0, WORLD_WIDTH  - VIEW_WIDTH);
        this.y = clamp(targetY, 0, WORLD_HEIGHT - VIEW_HEIGHT);
    }
};

// ====== GAME AREA & CANVAS ======
const gameArea = {
    canvas: document.getElementById("gameCanvas"),
    width: VIEW_WIDTH,
    height: VIEW_HEIGHT,
    scale: 1,
    offsetX: 0,
    offsetY: 0,

    // ------ Setup ------
    setup() {
        this.context = this.canvas.getContext("2d");
        this.resize();
        buildLevel();
        lastTimestamp = performance.now();
        requestAnimationFrame(engineLoop);
    },

    // ------ GameArea Resize ------
    resize() {
        const dpr  = window.devicePixelRatio || 1;
        const cssW = window.innerWidth;
        const cssH = window.innerHeight;

        this.canvas.style.width  = cssW + "px";
        this.canvas.style.height = cssH + "px";
        this.canvas.width  = Math.round(cssW * dpr);
        this.canvas.height = Math.round(cssH * dpr);

        // Fit one screen worth of world into the window (letterboxed).
        this.scale = Math.min(
            this.canvas.width  / this.width,
            this.canvas.height / this.height
        );

        this.offsetX = (this.canvas.width  - this.width  * this.scale) / 2;
        this.offsetY = (this.canvas.height - this.height * this.scale) / 2;
    }
};

// ====== UPDATE GAME ======
function update() {
    if (!gameStarted || isPaused || !playerObj) return;

    playerObj.update();
    camera.follow(playerObj);
}

// ====== RENDER VISUALS ======
function renderGame() {
    const ctx = gameArea.context;
    if (!ctx) return;

    // --- clear the whole device-sized canvas (letterbox bars) ---
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, gameArea.canvas.width, gameArea.canvas.height);

    if (!gameStarted || !playerObj) return;

    const s = gameArea.scale;

    ctx.save();
    ctx.setTransform(s, 0, 0, s, gameArea.offsetX - camera.x * s, gameArea.offsetY - camera.y * s);
    
    // Clip to the viewport so nothing bleeds into the letterbox bars
    ctx.beginPath();
    ctx.rect(camera.x, camera.y, VIEW_WIDTH, VIEW_HEIGHT);
    ctx.clip();

    drawWorld(ctx);
    playerObj.draw(ctx);

    ctx.restore();

    ctx.save();
    ctx.setTransform(s, 0, 0, s, gameArea.offsetX, gameArea.offsetY);
    drawHud(ctx);
    ctx.restore();
}

function drawWorld(ctx) {
    const viewRight  = camera.x + VIEW_WIDTH;
    const viewBottom = camera.y + VIEW_HEIGHT;

    // Backdrop (only the visible slice).
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(camera.x, camera.y, VIEW_WIDTH, VIEW_HEIGHT);

    // Subtle grid.
    const GRID = 240;
    ctx.strokeStyle = "#242424";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = Math.floor(camera.x / GRID) * GRID; x <= viewRight; x += GRID) {
        ctx.moveTo(x, camera.y);
        ctx.lineTo(x, viewBottom);
    }
    for (let y = Math.floor(camera.y / GRID) * GRID; y <= viewBottom; y += GRID) {
        ctx.moveTo(camera.x, y);
        ctx.lineTo(viewRight, y);
    }
    ctx.stroke();

    // Screen boundaries — makes the 5x5 layout readable while scrolling.
    ctx.strokeStyle = "#3a3a3a";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let x = 0; x <= WORLD_WIDTH; x += SCREEN_WIDTH) {
        ctx.moveTo(x, camera.y);
        ctx.lineTo(x, viewBottom);
    }
    for (let y = 0; y <= WORLD_HEIGHT; y += SCREEN_HEIGHT) {
        ctx.moveTo(camera.x, y);
        ctx.lineTo(viewRight, y);
    }
    ctx.stroke();

    // Platforms (culled).
    for (const p of platforms) {
        if (p.x + p.width  < camera.x || p.x > viewRight)  continue;
        if (p.y + p.height < camera.y || p.y > viewBottom) continue;

        ctx.fillStyle = "#3b7dd8";
        ctx.fillRect(p.x, p.y, p.width, p.height);

        ctx.fillStyle = "#5aa0ff";
        ctx.fillRect(p.x, p.y, p.width, 8);
    }
}

function drawHud(ctx) {
    ctx.textBaseline = "top";

    // Top-left HUD text has been removed.

    // ---- minimap of the world ----
    const mmW = 240;
    const mmH = 135;
    const mmX = VIEW_WIDTH  - mmW - 30;
    const mmY = 30;
    const kx  = mmW / WORLD_WIDTH;
    const ky  = mmH / WORLD_HEIGHT;

    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(mmX, mmY, mmW, mmH);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 2;
    ctx.strokeRect(mmX, mmY, mmW, mmH);

    // camera window
    ctx.strokeStyle = "rgba(90, 160, 255, 0.9)";
    ctx.strokeRect(
        mmX + camera.x * kx,
        mmY + camera.y * ky,
        VIEW_WIDTH  * kx,
        VIEW_HEIGHT * ky
    );

    // player blip
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(
        mmX + playerObj.x * kx - 2,
        mmY + playerObj.y * ky - 2,
        5, 5
    );

    if (isPaused) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
        ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 96px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("PAUSED", VIEW_WIDTH / 2, VIEW_HEIGHT / 2);
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
    }
}

/* ====== MAIN LOOP ======
function engineLoop(currentTime) {
    let deltaTime = currentTime - lastTimestamp;
    lastTimestamp = currentTime;

    if (!Number.isFinite(deltaTime) || deltaTime < 0) deltaTime = 0;
    if (deltaTime > 250) deltaTime = 250;          // tab was backgrounded

    frameAccumulator += deltaTime;

    let steps = 0;
    while (frameAccumulator >= tickLength && steps < 10) {
        update();
        frameAccumulator -= tickLength;
        steps++;
    }
    if (steps === 10) frameAccumulator = 0;        // don't build up a debt

    renderGame();
    requestAnimationFrame(engineLoop);
}

/* ====== STARTUP ======
function startGame() {
    gameStarted = true;
    isPaused = false;

    const spawnX = 60;                                        // bottom-left
    const spawnY = WORLD_HEIGHT - GROUND_HEIGHT - 80;         // standing on the ground

    playerObj = new Player(spawnX, spawnY);
    camera.follow(playerObj);
}

function init() {
    gameArea.setup();
    startGame();
}

// ====== INPUT ======
function normalizeKey(e) {
    const k = e.key.toLowerCase();
    if (k === " " || k === "spacebar") return "space";
    if (k === "arrowleft")  return "a";
    if (k === "arrowright") return "d";
    if (k === "arrowup")    return "w";
    if (k === "arrowdown")  return "s";
    return k;
}

document.addEventListener("keydown", e => {
    const key = normalizeKey(e);
    if (!(key in keys)) return;

    if (e.key === " " || e.key.startsWith("Arrow")) e.preventDefault();

    if (key === "p" && !e.repeat) isPaused = !isPaused;
    keys[key] = true;
});

document.addEventListener("keyup", e => {
    const key = normalizeKey(e);
    if (!(key in keys)) return;

    if (e.key === " " || e.key.startsWith("Arrow")) e.preventDefault();
    keys[key] = false;
});

// Release everything if the window loses focus (avoids stuck keys).
window.addEventListener("blur", () => {
    for (const k in keys) keys[k] = false;
});

window.addEventListener("resize", () => {
    gameArea.resize();
});

window.addEventListener("load", init);
