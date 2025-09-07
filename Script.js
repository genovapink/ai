const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 400;

// Player
const player = {
  x: 50,
  y: 0,
  width: 40,
  height: 40,
  color: "red",
  dy: 0,
  dx: 0,
  speed: 4,
  jumpPower: -12,
  onGround: false,
};

// Physics
const gravity = 0.6;

// Ground
const groundHeight = 60;

// Platforms (lubang dibuat dengan gap)
const platforms = [
  { x: 0, y: canvas.height - groundHeight, width: 200, height: groundHeight },
  { x: 300, y: canvas.height - groundHeight, width: 200, height: groundHeight },
  { x: 600, y: canvas.height - groundHeight, width: 200, height: groundHeight },
];

// Enemy
const enemy = { x: 400, y: canvas.height - groundHeight - 40, width: 40, height: 40, color: "purple", dx: 2 };

// Finish
const finish = { x: 750, y: canvas.height - groundHeight - 50, width: 30, height: 50, color: "gold" };

// Controls
const keys = {};
document.addEventListener("keydown", e => (keys[e.code] = true));
document.addEventListener("keyup", e => (keys[e.code] = false));

function update() {
  // Movement
  if (keys["ArrowLeft"]) player.dx = -player.speed;
  else if (keys["ArrowRight"]) player.dx = player.speed;
  else player.dx = 0;

  if (keys["Space"] && player.onGround) {
    player.dy = player.jumpPower;
    player.onGround = false;
  }

  // Apply gravity
  player.dy += gravity;
  player.x += player.dx;
  player.y += player.dy;

  // Collision with platforms
  player.onGround = false;
  for (let p of platforms) {
    if (
      player.x < p.x + p.width &&
      player.x + player.width > p.x &&
      player.y + player.height >= p.y &&
      player.y + player.height <= p.y + p.height
    ) {
      player.y = p.y - player.height;
      player.dy = 0;
      player.onGround = true;
    }
  }

  // Enemy movement
  enemy.x += enemy.dx;
  if (enemy.x < 350 || enemy.x > 500) enemy.dx *= -1;

  // Collision with enemy
  if (
    player.x < enemy.x + enemy.width &&
    player.x + player.width > enemy.x &&
    player.y < enemy.y + enemy.height &&
    player.y + player.height > enemy.y
  ) {
    gameOver("Kena musuh!");
  }

  // Fell in hole
  if (player.y > canvas.height) {
    gameOver("Jatuh ke lubang!");
  }

  // Win condition
  if (
    player.x < finish.x + finish.width &&
    player.x + player.width > finish.x &&
    player.y < finish.y + finish.height &&
    player.y + player.height > finish.y
  ) {
    winGame();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw platforms
  ctx.fillStyle = "#654321";
  for (let p of platforms) {
    ctx.fillRect(p.x, p.y, p.width, p.height);
  }

  // Draw player
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // Draw enemy
  ctx.fillStyle = enemy.color;
  ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

  // Draw finish
  ctx.fillStyle = finish.color;
  ctx.fillRect(finish.x, finish.y, finish.width, finish.height);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

function gameOver(msg) {
  alert("Game Over: " + msg);
  document.location.reload();
}

function winGame() {
  alert("YOU WIN 🎉");
  document.location.reload();
}

loop();
