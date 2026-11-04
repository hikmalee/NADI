
/* ==================================================
   NADI - ACTION RPG GAME ENGINE
   Prototype 0.3
   Top Down 2D Pixel Adventure
================================================== */

// ==================================================
// 1. CANVAS
// ==================================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const statusText = document.getElementById("game-status");

ctx.imageSmoothingEnabled = false;


// ==================================================
// 2. WORLD
// ==================================================

const world = {
    width: 2400,
    height: 1800,
    tileSize: 48
};


// ==================================================
// 3. TREES AND OBSTACLES
// ==================================================

const trees = [
    [250, 250],
    [450, 450],
    [700, 300],
    [1800, 250],
    [2050, 500],
    [2200, 1200],
    [300, 1400],
    [650, 1550],
    [1800, 1500]
];


// ==================================================
// 4. PLAYER
// ==================================================

const player = {
    x: 1200,
    y: 900,
    width: 24,
    height: 32,

    speed: 180,
    direction: "down",

    hp: 100,
    maxHp: 100,

    attack: 20,
    defense: 0,

    level: 1,
    exp: 0,
    nextExp: 100,

    potions: 3,

    attackCooldown: 0,
    attackDuration: 0,

    invulnerability: 0,

    alive: true
};


// ==================================================
// 5. CAMERA
// ==================================================

const camera = {
    x: 0,
    y: 0
};


// ==================================================
// 6. INPUT
// ==================================================

const keys = {};

window.addEventListener("keydown", (event) => {

    const key = event.key.toLowerCase();

    if (
        ["arrowup", "arrowdown", "arrowleft",
         "arrowright", " ", "e"].includes(key)
    ) {
        event.preventDefault();
    }

    if (!keys[key]) {

        if (key === " ") {
            startAttack();
        }

        if (key === "e") {
            usePotion();
        }

        if (key === "r" && !player.alive) {
            restartGame();
        }
    }

    keys[key] = true;

});


window.addEventListener("keyup", (event) => {
    keys[event.key.toLowerCase()] = false;
});


window.addEventListener("blur", () => {

    for (const key in keys) {
        keys[key] = false;
    }

});


// ==================================================
// 7. ENEMIES
// ==================================================

const enemyTemplates = [
    { x: 1400, y: 900 },
    { x: 1550, y: 750 },
    { x: 900, y: 650 },
    { x: 1650, y: 1100 },
    { x: 750, y: 1150 }
];

let enemies = [];

function createEnemies() {

    enemies = enemyTemplates.map((position, index) => ({

        id: index,

        x: position.x,
        y: position.y,

        width: 28,
        height: 28,

        hp: 50,
        maxHp: 50,

        speed: 65,

        damage: 8,

        expReward: 35,

        attackCooldown: 0,

        alive: true

    }));

}

createEnemies();


// ==================================================
// 8. COLLISION
// ==================================================

function rectanglesOverlap(a, b) {

    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );

}


function isBlocked(x, y, width, height) {

    // World boundaries
    if (
        x < 0 ||
        y < 0 ||
        x + width > world.width ||
        y + height > world.height
    ) {
        return true;
    }

    // Tree collision
    for (const [treeX, treeY] of trees) {

        const obstacle = {
            x: treeX + 2,
            y: treeY + 4,
            width: 42,
            height: 38
        };

        if (
            rectanglesOverlap(
                { x, y, width, height },
                obstacle
            )
        ) {
            return true;
        }

    }

    return false;

}


// ==================================================
// 9. PLAYER MOVEMENT
// ==================================================

function updatePlayer(deltaTime) {

    if (!player.alive) return;

    let dx = 0;
    let dy = 0;

    if (keys["w"] || keys["arrowup"]) dy -= 1;
    if (keys["s"] || keys["arrowdown"]) dy += 1;
    if (keys["a"] || keys["arrowleft"]) dx -= 1;
    if (keys["d"] || keys["arrowright"]) dx += 1;

    if (dx !== 0 || dy !== 0) {

        const length = Math.sqrt(dx * dx + dy * dy);

        dx /= length;
        dy /= length;

        const moveX = dx * player.speed * deltaTime;
        const moveY = dy * player.speed * deltaTime;

        // Horizontal movement
        if (!isBlocked(
            player.x + moveX,
            player.y,
            player.width,
            player.height
        )) {
            player.x += moveX;
        }

        // Vertical movement
        if (!isBlocked(
            player.x,
            player.y + moveY,
            player.width,
            player.height
        )) {
            player.y += moveY;
        }

        // Direction
        if (Math.abs(dx) > Math.abs(dy)) {
            player.direction = dx > 0 ? "right" : "left";
        } else {
            player.direction = dy > 0 ? "down" : "up";
        }

    }

}


// ==================================================
// 10. FIGHTING SYSTEM
// ==================================================

let hitEnemies = new Set();

function startAttack() {

    if (!player.alive) return;

    if (player.attackCooldown > 0) return;

    player.attackDuration = 0.18;
    player.attackCooldown = 0.45;

    hitEnemies = new Set();

    attackEnemies();

}


function getAttackArea() {

    const range = 48;

    if (player.direction === "up") {
        return {
            x: player.x - 12,
            y: player.y - range,
            width: 48,
            height: range
        };
    }

    if (player.direction === "down") {
        return {
            x: player.x - 12,
            y: player.y + player.height,
            width: 48,
            height: range
        };
    }

    if (player.direction === "left") {
        return {
            x: player.x - range,
            y: player.y - 8,
            width: range,
            height: 48
        };
    }

    return {
        x: player.x + player.width,
        y: player.y - 8,
        width: range,
        height: 48
    };

}


function attackEnemies() {

    const attackArea = getAttackArea();

    for (const enemy of enemies) {

        if (!enemy.alive) continue;

        if (hitEnemies.has(enemy.id)) continue;

        const enemyBox = {
            x: enemy.x,
            y: enemy.y,
            width: enemy.width,
            height: enemy.height
        };

        if (rectanglesOverlap(attackArea, enemyBox)) {

            enemy.hp -= player.attack;

            hitEnemies.add(enemy.id);

            if (enemy.hp <= 0) {

                enemy.hp = 0;
                enemy.alive = false;

                gainExp(enemy.expReward);

            }

        }

    }

}


// ==================================================
// 11. EXPERIENCE AND LEVEL SYSTEM
// ==================================================

function gainExp(amount) {

    player.exp += amount;

    while (player.exp >= player.nextExp) {

        player.exp -= player.nextExp;

        player.level++;

        player.nextExp = Math.floor(
            player.nextExp * 1.4
        );

        // Level up rewards
        player.maxHp += 15;
        player.hp = player.maxHp;

        player.attack += 5;

        console.log(
            "LEVEL UP! Current level:",
            player.level
        );

    }

}


// ==================================================
// 12. HEALTH AND POTION SYSTEM
// ==================================================

function usePotion() {

    if (!player.alive) return;

    if (player.potions <= 0) return;

    if (player.hp >= player.maxHp) return;

    player.potions--;

    player.hp = Math.min(
        player.maxHp,
        player.hp + 40
    );

}


function damagePlayer(amount) {

    if (!player.alive) return;

    if (player.invulnerability > 0) return;

    const finalDamage = Math.max(
        1,
        amount - player.defense
    );

    player.hp -= finalDamage;

    player.invulnerability = 0.7;

    if (player.hp <= 0) {

        player.hp = 0;
        player.alive = false;

    }

}


// ==================================================
// 13. ENEMY AI
// ==================================================

function updateEnemies(deltaTime) {

    if (!player.alive) return;

    for (const enemy of enemies) {

        if (!enemy.alive) continue;

        enemy.attackCooldown = Math.max(
            0,
            enemy.attackCooldown - deltaTime
        );

        const dx =
            player.x - enemy.x;

        const dy =
            player.y - enemy.y;

        const distance = Math.sqrt(
            dx * dx + dy * dy
        );

        // Chase player
        if (distance > 38 && distance < 450) {

            const moveX =
                (dx / distance) * enemy.speed * deltaTime;

            const moveY =
                (dy / distance) * enemy.speed * deltaTime;

            const nextX = enemy.x + moveX;
            const nextY = enemy.y + moveY;

            // Avoid trees
            if (!isBlocked(
                nextX,
                enemy.y,
                enemy.width,
                enemy.height
            )) {
                enemy.x = nextX;
            }

            if (!isBlocked(
                enemy.x,
                nextY,
                enemy.width,
                enemy.height
            )) {
                enemy.y = nextY;
            }

        }

        // Attack player
        if (distance <= 42 && enemy.attackCooldown <= 0) {

            damagePlayer(enemy.damage);

            enemy.attackCooldown = 1.2;

        }

    }

}


// ==================================================
// 14. DRAW WORLD
// ==================================================

function drawWorld() {

    const tile = world.tileSize;

    ctx.fillStyle = "#263d2d";

    ctx.fillRect(
        0,
        0,
        world.width,
        world.height
    );

    // Grass
    for (let x = 0; x < world.width; x += tile) {

        for (let y = 0; y < world.height; y += tile) {

            const variation =
                ((x / tile + y / tile) % 3);

            ctx.fillStyle =
                variation === 0 ? "#294431" :
                variation === 1 ? "#2d4934" :
                "#304b37";

            ctx.fillRect(x, y, tile, tile);

        }

    }

    // Roads
    ctx.fillStyle = "#71634a";

    ctx.fillRect(
        0, 840,
        world.width, 120
    );

    ctx.fillRect(
        1140, 0,
        120, world.height
    );

    // Road details
    ctx.fillStyle = "#817153";

    for (let x = 0; x < world.width; x += 96) {
        ctx.fillRect(x, 892, 48, 4);
    }

    // Trees
    for (const [x, y] of trees) {

        // Shadow
        ctx.fillStyle = "#17251b";
        ctx.fillRect(x + 5, y + 18, 40, 18);

        // Trunk
        ctx.fillStyle = "#59432e";
        ctx.fillRect(x + 15, y + 20, 16, 25);

        // Leaves
        ctx.fillStyle = "#183a28";
        ctx.fillRect(x, y, 46, 30);

        ctx.fillStyle = "#3d6941";
        ctx.fillRect(x + 8, y - 8, 30, 25);

    }

    // World boundary
    ctx.strokeStyle = "#9a8050";
    ctx.lineWidth = 12;

    ctx.strokeRect(
        0, 0,
        world.width,
        world.height
    );

}


// ==================================================
// 15. DRAW PLAYER
// ==================================================

function drawPlayer() {

    if (
        player.invulnerability > 0 &&
        Math.floor(performance.now() / 100) % 2 === 0
    ) {
        return;
    }

    const x = player.x;
    const y = player.y;

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(x - 2, y + 25, 28, 9);

    // Body
    ctx.fillStyle = "#293c52";
    ctx.fillRect(x + 4, y + 12, 16, 15);

    // Head
    ctx.fillStyle = "#d6a77a";
    ctx.fillRect(x + 5, y, 14, 13);

    // Hair
    ctx.fillStyle = "#30251f";
    ctx.fillRect(x + 4, y - 2, 16, 6);

    // Direction indicator
    ctx.fillStyle = "#f2d28b";

    if (player.direction === "up") {
        ctx.fillRect(x + 10, y - 3, 4, 3);
    }

    if (player.direction === "down") {
        ctx.fillRect(x + 10, y + 10, 4, 3);
    }

    if (player.direction === "left") {
        ctx.fillRect(x + 3, y + 5, 4, 4);
    }

    if (player.direction === "right") {
        ctx.fillRect(x + 17, y + 5, 4, 4);
    }

    // Feet
    ctx.fillStyle = "#29231e";
    ctx.fillRect(x + 3, y + 27, 8, 5);
    ctx.fillRect(x + 14, y + 27, 8, 5);

}


// ==================================================
// 16. DRAW ENEMIES
// ==================================================

function drawEnemies() {

    for (const enemy of enemies) {

        if (!enemy.alive) continue;

        const x = enemy.x;
        const y = enemy.y;

        // Shadow
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.fillRect(x, y + 25, 30, 7);

        // Enemy body
        ctx.fillStyle = "#542c38";
        ctx.fillRect(x + 3, y + 8, 22, 20);

        // Enemy head
        ctx.fillStyle = "#a34d52";
        ctx.fillRect(x + 4, y, 20, 16);

        // Eyes
        ctx.fillStyle = "#f4c66b";
        ctx.fillRect(x + 7, y + 6, 4, 4);
        ctx.fillRect(x + 17, y + 6, 4, 4);

        // Enemy HP background
        ctx.fillStyle = "#241a1a";
        ctx.fillRect(x - 2, y - 10, 32, 5);

        // Enemy HP
        ctx.fillStyle = "#d74a4a";

        ctx.fillRect(
            x - 2,
            y - 10,
            32 * (enemy.hp / enemy.maxHp),
            5
        );

    }

}


// ==================================================
// 17. DRAW PLAYER ATTACK
// ==================================================

function drawAttack() {

    if (player.attackDuration <= 0) return;

    const area = getAttackArea();

    ctx.fillStyle = "rgba(255, 220, 130, 0.55)";

    ctx.fillRect(
        area.x,
        area.y,
        area.width,
        area.height
    );

    ctx.strokeStyle = "#f8dc9b";
    ctx.lineWidth = 3;

    ctx.strokeRect(
        area.x,
        area.y,
        area.width,
        area.height
    );

}


// ==================================================
// 18. DRAW HUD
// ==================================================

function drawHUD() {

    ctx.save();

    // Panel
    ctx.fillStyle = "rgba(12, 18, 15, 0.88)";
    ctx.fillRect(16, 16, 270, 112);

    ctx.strokeStyle = "#a18a5a";
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 16, 270, 112);


    // Player level
    ctx.fillStyle = "#f1d18a";
    ctx.font = "bold 17px monospace";

    ctx.fillText(
        "NADI  |  LV " + player.level,
        28,
        40
    );


    // HP bar
    ctx.fillStyle = "#482426";
    ctx.fillRect(28, 53, 220, 13);

    ctx.fillStyle = "#d64c4c";

    ctx.fillRect(
        28,
        53,
        220 * (player.hp / player.maxHp),
        13
    );

    ctx.fillStyle = "#ffffff";
    ctx.font = "11px monospace";

    ctx.fillText(
        "HP " + player.hp + " / " + player.maxHp,
        30,
        64
    );


    // EXP bar
    ctx.fillStyle = "#34344b";
    ctx.fillRect(28, 77, 220, 10);

    ctx.fillStyle = "#9a83e8";

    ctx.fillRect(
        28,
        77,
        220 * (player.exp / player.nextExp),
        10
    );

    ctx.fillStyle = "#ffffff";
    ctx.fillText(
        "EXP " + player.exp + " / " + player.nextExp,
        28,
        103
    );

    ctx.fillText(
        "POTION [E]: " + player.potions,
        28,
        119
    );


    // Controls
    ctx.fillStyle = "rgba(12, 18, 15, 0.8)";
    ctx.fillRect(690, 16, 254, 54);

    ctx.fillStyle = "#e8e5d5";
    ctx.font = "12px monospace";

    ctx.fillText("SPACE : ATTACK", 705, 38);
    ctx.fillText("E : POTION", 705, 56);

    ctx.restore();

}


// ==================================================
// 19. GAME OVER
// ==================================================

function drawGameOver() {

    if (player.alive) return;

    ctx.fillStyle = "rgba(0, 0, 0, 0.78)";

    ctx.fillRect(
        0, 0,
        canvas.width,
        canvas.height
    );

    ctx.textAlign = "center";

    ctx.fillStyle = "#d85b5b";
    ctx.font = "bold 42px monospace";

    ctx.fillText(
        "GAME OVER",
        canvas.width / 2,
        canvas.height / 2 - 25
    );

    ctx.fillStyle = "#ffffff";
    ctx.font = "17px monospace";

    ctx.fillText(
        "Press R to restart",
        canvas.width / 2,
        canvas.height / 2 + 25
    );

    ctx.textAlign = "left";

}


// ==================================================
// 20. CAMERA
// ==================================================

function updateCamera() {

    camera.x =
        player.x + player.width / 2 -
        canvas.width / 2;

    camera.y =
        player.y + player.height / 2 -
        canvas.height / 2;

    camera.x = Math.max(
        0,
        Math.min(world.width - canvas.width, camera.x)
    );

    camera.y = Math.max(
        0,
        Math.min(world.height - canvas.height, camera.y)
    );

}


// ==================================================
// 21. RESTART GAME
// ==================================================

function restartGame() {

    player.x = 1200;
    player.y = 900;

    player.hp = 100;
    player.maxHp = 100;

    player.attack = 20;
    player.defense = 0;

    player.level = 1;
    player.exp = 0;
    player.nextExp = 100;

    player.potions = 3;

    player.attackCooldown = 0;
    player.attackDuration = 0;
    player.invulnerability = 0;

    player.direction = "down";
    player.alive = true;

    hitEnemies.clear();

    createEnemies();

    for (const key in keys) {
        keys[key] = false;
    }

}


// ==================================================
// 22. UPDATE GAME
// ==================================================

function updateGame(deltaTime) {

    if (player.alive) {

        updatePlayer(deltaTime);
        updateEnemies(deltaTime);

    }

    player.attackCooldown = Math.max(
        0,
        player.attackCooldown - deltaTime
    );

    player.attackDuration = Math.max(
        0,
        player.attackDuration - deltaTime
    );

    player.invulnerability = Math.max(
        0,
        player.invulnerability - deltaTime
    );

}


// ==================================================
// 23. MAIN GAME LOOP
// ==================================================

let lastTime = 0;

function gameLoop(timestamp) {

    const deltaTime = Math.min(
        (timestamp - lastTime) / 1000,
        0.05
    );

    lastTime = timestamp;

    updateGame(deltaTime);
    updateCamera();


    // Clear screen
    ctx.clearRect(
        0, 0,
        canvas.width,
        canvas.height
    );


    // Camera
    ctx.save();

    ctx.translate(
        -camera.x,
        -camera.y
    );


    // Draw world objects
    drawWorld();
    drawEnemies();
    drawPlayer();
    drawAttack();


    ctx.restore();


    // Draw interface
    drawHUD();
    drawGameOver();


    // Status
    if (player.alive) {

        statusText.textContent =
            "NADI | LEVEL " + player.level +
            " | " + player.direction.toUpperCase();

    } else {

        statusText.textContent =
            "NADI | GAME OVER | PRESS R TO RESTART";

    }


    requestAnimationFrame(gameLoop);

}


// ==================================================
// 24. START GAME
// ==================================================

requestAnimationFrame(gameLoop);

console.log("NADI Prototype 0.3 initialized!");
