const WORLD_WIDTH = 1920;
const WORLD_HEIGHT = 1080;
const tickLength = 20;

let frameAccumulator = 0;
let lastTimestamp = 0;
let playerObj;
let gameStarted = false;
let isPaused = false;

let keys = { space: false, a: false, d: false };

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 80;
        this.height = 80;
        this.velX = 0;
        this.velY = 0;
        this.speed = 8;
    }

    update() {
        this.velX = 0;
        this.velY = 0;

        if (keys.w && !keys.s) this.velY = -this.speed;
        if (keys.s && !keys.w) this.velY = this.speed;
        if (keys.a && !keys.d) this.velX = -this.speed;
        if (keys.d && !keys.a) this.velX = this.speed;

        if (this.velX !== 0 && this.velY !== 0) {
            this.velX *= Math.SQRT1_2;
            this.velY *= Math.SQRT1_2;
        }

        this.x += this.velX;
        this.y += this.velY;

        this.x = Math.max(0, Math.min(this.x, gameArea.width - this.width));
        this.y = Math.max(0, Math.min(this.y, gameArea.height - this.height));
    }

    draw() {
        const ctx = gameArea.context;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

const gameArea = {
    canvas: document.getElementById("gameCanvas"),
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT,
    scale: 1,
    offsetX: 0,
    offsetY: 0,

    setup: function() {
        this.context = this.canvas.getContext("2d");
        this.resize();
        lastTimestamp = performance.now();
        requestAnimationFrame(engineLoop);
    },

    resize: function() {
        const dpr = window.devicePixelRatio || 1;
        const cssW = window.innerWidth;
        const cssH = window.innerHeight;

        this.canvas.style.width = cssW + "px";
        this.canvas.style.height = cssH + "px";
        this.canvas.width = Math.round(cssW * dpr);
        this.canvas.height = Math.round(cssH * dpr);

        this.scale = Math.min(
            this.canvas.width / this.width,
            this.canvas.height / this.height
        );

        this.offsetX = (this.canvas.width - this.width * this.scale) / 2;
        this.offsetY = (this.canvas.height - this.height * this.scale) / 2;
    },

    beginWorld: function() {
        const ctx = this.context;
        ctx.setTransform(this.scale, 0, 0, this.scale, this.offsetX, this.offsetY);
        ctx.beginPath();
        ctx.rect(0, 0, this.width, this.height);
        ctx.clip();
    }
};

function update() {
    if (!gameStarted || isPaused) return;
    playerObj.update();
}

function renderGame() {
    if (!gameArea.context) return;

    gameArea.context.setTransform(1, 0, 0, 1, 0, 0);
    gameArea.context.fillStyle = "black";
    gameArea.context.fillRect(0, 0, gameArea.canvas.width, gameArea.canvas.height);

    if (gameStarted && playerObj) {
        const ctx = gameArea.context;
        ctx.save();
        gameArea.beginWorld();

        ctx.fillStyle = "#1a1a1a";
        ctx.fillRect(0, 0, gameArea.width, gameArea.height);

        playerObj.draw();

        ctx.restore();
    }
}

function engineLoop(currentTime) {
    const deltaTime = currentTime - lastTimestamp;
    lastTimestamp = currentTime;
    frameAccumulator += deltaTime;

    while (frameAccumulator >= tickLength) {
        update();
        frameAccumulator -= tickLength;
    }

    renderGame();
    requestAnimationFrame(engineLoop);
}

function startGame() {
    gameStarted = true;
    isPaused = false;
    playerObj = new Player(
        gameArea.width / 2 - 40,
        gameArea.height / 2 - 40
    );
}

function init() {
    gameArea.setup();
    startGame();
}

document.addEventListener("keydown", e => {
    const key = e.key.startsWith("Arrow") ? e.key : e.key.toLowerCase();
    if (keys.hasOwnProperty(key)) keys[key] = true;
});

document.addEventListener("keyup", e => {
    const key = e.key.startsWith("Arrow") ? e.key : e.key.toLowerCase();
    if (keys.hasOwnProperty(key)) keys[key] = false;
});

window.addEventListener("resize", () => {
    gameArea.resize();
});

window.addEventListener("load", init);
