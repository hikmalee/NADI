
/* ==========================================
   NADI - GAME ENGINE
   Top Down 2D Pixel Adventure
   Version 0.2
========================================== */

// ==========================================
// 1. CANVAS SETTINGS
// ==========================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const statusText = document.getElementById("game-status");

ctx.imageSmoothingEnabled = false;


// ==========================================
// 2. WORLD SETTINGS
// ==========================================

const world = {
    width: 2400,
    height: 1800,
    tileSize: 48
};


// ==========================================
// 3. TREE OBSTACLES
// ==========================================

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


// ==========================================
// 4. PLAYER SETTINGS
// ==========================================

const player = {
    x: 1200,
    y: 900,
    width: 24,
    height: 32,
    speed: 180,
    direction: "down"
};


// ==========================================
// 5. CAMERA SETTINGS
// ==========================================

const camera = {
    x: 0,
    y: 0
};


// ==========================================
// 6. KEYBOARD INPUT
// ==========================================

const keys = {};

window.addEventListener("keydown", (event) => {

    const key = event.key.toLowerCase();

    keys[key] = true;

    if (
        [
            "arrowup",
            "arrowdown",
            "arrowleft",
            "arrowright",
            " "
        ].includes(key)
    ) {
        event.preventDefault();
    }

});

window.addEventListener("keyup", (event) => {

    keys[event.key.toLowerCase()] = false;

});

window.addEventListener("blur", () => {

    for (const key in keys) {
        keys[key] = false;
    }

});


// ==========================================
// 7. DRAW WORLD
// ==========================================

function drawWorld() {

    const tile = world.tileSize;

    // Grass background
    ctx.fillStyle = "#263d2d";
    ctx.fillRect(
        0,
        0,
        world.width,
        world.height
    );

    // Grass pattern
    for (
        let x = 0;
        x < world.width;
        x += tile
    ) {

        for (
            let y = 0;
            y < world.height;
            y += tile
        ) {

            const variation =
                ((x / tile + y / tile) % 3);

            if (variation === 0) {
                ctx.fillStyle = "#294431";
            } else if (variation === 1) {
                ctx.fillStyle = "#2d4934";
            } else {
                ctx.fillStyle = "#304b37";
            }

            ctx.fillRect(
                x,
                y,
                tile,
                tile
            );

        }
    }


    // Walking path
    ctx.fillStyle = "#71634a";

    ctx.fillRect(
        0,
        840,
        world.width,
        120
    );

    ctx.fillRect(
        1140,
        0,
        120,
        world.height
    );


    // Path details
    ctx.fillStyle = "#817153";

    for (
        let x = 0;
        x < world.width;
        x += 96
    ) {

        ctx.fillRect(
            x,
            892,
            48,
            4
        );

    }


    // World boundaries
    ctx.strokeStyle = "#9a8050";
    ctx.lineWidth = 12;

    ctx.strokeRect(
        0,
        0,
        world.width,
        world.height
    );


    // Draw trees
    trees.forEach(([x, y]) => {

        // Tree shadow
        ctx.fillStyle = "#17251b";

        ctx.fillRect(
            x + 5,
            y + 18,
            40,
            18
        );


        // Tree trunk
        ctx.fillStyle = "#59432e";

        ctx.fillRect(
            x + 15,
            y + 20,
            16,
            25
        );


        // Tree leaves
        ctx.fillStyle = "#183a28";

        ctx.fillRect(
            x,
            y,
            46,
            30
        );


        ctx.fillStyle = "#3d6941";

        ctx.fillRect(
            x + 8,
            y - 8,
            30,
            25
        );

    });

}


// ==========================================
// 8. DRAW PLAYER
// ==========================================

function drawPlayer() {

    const x = player.x;
    const y = player.y;


    // Player shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";

    ctx.fillRect(
        x - 2,
        y + 25,
        28,
        9
    );


    // Player body
    ctx.fillStyle = "#293c52";

    ctx.fillRect(
        x + 4,
        y + 12,
        16,
        15
    );


    // Player head
    ctx.fillStyle = "#d6a77a";

    ctx.fillRect(
        x + 5,
        y,
        14,
        13
    );


    // Player hair
    ctx.fillStyle = "#30251f";

    ctx.fillRect(
        x + 4,
        y - 2,
        16,
        6
    );


    // Player feet
    ctx.fillStyle = "#29231e";

    ctx.fillRect(
        x + 3,
        y + 27,
        8,
        5
    );

    ctx.fillRect(
        x + 14,
        y + 27,
        8,
        5
    );

}


// ==========================================
// 9. COLLISION SYSTEM
// ==========================================

function isBlocked(x, y) {

    // World boundaries
    if (
        x < 0 ||
        y < 0 ||
        x + player.width > world.width ||
        y + player.height > world.height
    ) {

        return true;

    }


    // Check tree collision
    for (const [treeX, treeY] of trees) {

        const obstacle = {

            x: treeX + 2,
            y: treeY + 4,
            width: 42,
            height: 38

        };


        const collision =

            x < obstacle.x + obstacle.width &&

            x + player.width > obstacle.x &&

            y < obstacle.y + obstacle.height &&

            y + player.height > obstacle.y;


        if (collision) {

            return true;

        }

    }

    return false;

}


// ==========================================
// 10. UPDATE PLAYER MOVEMENT
// ==========================================

function updatePlayer(deltaTime) {

    let dx = 0;
    let dy = 0;


    // Keyboard controls
    if (keys["w"] || keys["arrowup"]) {
        dy -= 1;
    }

    if (keys["s"] || keys["arrowdown"]) {
        dy += 1;
    }

    if (keys["a"] || keys["arrowleft"]) {
        dx -= 1;
    }

    if (keys["d"] || keys["arrowright"]) {
        dx += 1;
    }


    // Normalize diagonal movement
    if (dx !== 0 || dy !== 0) {

        const length = Math.sqrt(
            dx * dx + dy * dy
        );

        dx /= length;
        dy /= length;


        // Calculate movement
        const moveX =
            dx * player.speed * deltaTime;

        const moveY =
            dy * player.speed * deltaTime;


        // Horizontal collision
        if (
            !isBlocked(
                player.x + moveX,
                player.y
            )
        ) {

            player.x += moveX;

        }


        // Vertical collision
        if (
            !isBlocked(
                player.x,
                player.y + moveY
            )
        ) {

            player.y += moveY;

        }


        // Update player direction
        if (Math.abs(dx) > Math.abs(dy)) {

            player.direction =
                dx > 0 ? "right" : "left";

        } else {

            player.direction =
                dy > 0 ? "down" : "up";

        }

    }

}


// ==========================================
// 11. UPDATE CAMERA
// ==========================================

function updateCamera() {

    // Follow player
    camera.x =
        player.x +
        player.width / 2 -
        canvas.width / 2;

    camera.y =
        player.y +
        player.height / 2 -
        canvas.height / 2;


    // Camera boundaries
    camera.x = Math.max(
        0,
        Math.min(
            world.width - canvas.width,
            camera.x
        )
    );

    camera.y = Math.max(
        0,
        Math.min(
            world.height - canvas.height,
            camera.y
        )
    );

}


// ==========================================
// 12. MAIN GAME LOOP
// ==========================================

let lastTime = 0;

function gameLoop(timestamp) {

    const deltaTime = Math.min(
        (timestamp - lastTime) / 1000,
        0.05
    );

    lastTime = timestamp;


    // Update game
    updatePlayer(deltaTime);

    updateCamera();


    // Clear canvas
    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // Apply camera
    ctx.save();

    ctx.translate(
        -camera.x,
        -camera.y
    );


    // Draw game objects
    drawWorld();

    drawPlayer();


    // Restore camera
    ctx.restore();


    // Update game status
    statusText.textContent =
        "NADI | WASD / ARROW KEYS | Direction: " +
        player.direction.toUpperCase();


    // Continue game loop
    requestAnimationFrame(gameLoop);

}


// ==========================================
// 13. START GAME
// ==========================================

requestAnimationFrame(gameLoop);

console.log(
    "NADI game initialized successfully!"
);
