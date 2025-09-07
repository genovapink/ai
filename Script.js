// Platformer core (canvas) - single file game logic
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// UI
const livesEl = document.getElementById('lives');
const levelEl = document.getElementById('level');
const msgEl = document.getElementById('msg');

// mobile buttons
const leftBtn = document.getElementById('left');
const rightBtn = document.getElementById('right');
const upBtn = document.getElementById('up');

// sizes
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// global game state
let keys = {};
let touchState = { left:false, right:false, up:false };
let gravity = 0.9;
let levels;
let currentLevel = 0;
let lives = 3;

// basic tile size for drawing platforms
const TILE = 48;

// Player object
class Player {
  constructor(x,y){
    this.x = x; this.y = y;
    this.w = 36; this.h = 48;
    this.vx = 0; this.vy = 0;
    this.onGround = false;
    this.color = getComputedStyle(document.documentElement).getPropertyValue('--player').trim() || '#ffdd57';
  }
  reset(x,y){
    this.x=x; this.y=y; this.vx=0; this.vy=0; this.onGround=false;
  }
  update(map){
    // horizontal
    const acc = 1.0;
    const maxSpeed = 6;
    if (keys.ArrowLeft || keys.a || touchState.left) this.vx = Math.max(this.vx - acc, -maxSpeed);
    else if (keys.ArrowRight || keys.d || touchState.right) this.vx = Math.min(this.vx + acc, maxSpeed);
    else this.vx *= 0.8;

    // jump
    if ((keys.ArrowUp || keys.w || keys.Space || touchState.up) && this.onGround){
      this.vy = -18;
      this.onGround = false;
    }

    // apply gravity
    this.vy += gravity;
    if (this.vy > 25) this.vy = 25;

    // tentative move
    let nextX = this.x + this.vx;
    let nextY = this.y + this.vy;

    // collision with platforms (AABB)
    // check horizontal collisions
    const horizHit = collideWithPlatforms(this.x, this.y, nextX, this.y, this.w, this.h, map);
    if (horizHit.collided) {
      // stop horizontal movement at collision edge
      if (this.vx > 0) nextX = horizHit.x - this.w - 0.1;
      else if (this.vx < 0) nextX = horizHit.x + horizHit.w + 0.1;
      this.vx = 0;
    }

    // check vertical collisions
    const vertHit = collideWithPlatforms(nextX, this.y, nextX, nextY, this.w, this.h, map);
    if (vertHit.collided) {
      if (this.vy > 0) { // falling -> landed
        nextY = vertHit.y - this.h - 0.1;
        this.onGround = true;
      } else { // hitting head
        nextY = vertHit.y + vertHit.h + 0.1;
      }
      this.vy = 0;
    } else {
      this.onGround = false;
    }

    this.x = nextX;
    this.y = nextY;
  }
  draw(ctx){
    ctx.fillStyle = this.color;
    roundRect(ctx, this.x, this.y, this.w, this.h, 6, true, false);
    // eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(this.x + 8, this.y + 12, 4, 4);
    ctx.fillRect(this.x + this.w - 12, this.y + 12, 4, 4);
  }
}

// Enemy simple patroller
class Enemy {
  constructor(x,y,w=40,h=40,range=120){
    this.startX = x; this.x = x; this.y = y; this.w=w; this.h=h;
    this.range = range; this.vx = 1.5; this.dir = 1;
    this.color = getComputedStyle(document.documentElement).getPropertyValue('--enemy').trim() || '#e74c3c';
  }
  update(){
    this.x += this.vx * this.dir;
    if (this.x > this.startX + this.range) this.dir = -1;
    if (this.x < this.startX - this.range) this.dir = 1;
  }
  draw(ctx){
    ctx.fillStyle = this.color;
    roundRect(ctx, this.x, this.y, this.w, this.h, 6, true, false);
    // eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(this.x + 8, this.y + 10, 4, 4);
    ctx.fillRect(this.x + this.w - 12, this.y + 10, 4, 4);
  }
}

// Utilities
function roundRect(ctx, x, y, w, h, r, fill, stroke){
  if (r === undefined) r = 5;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function rectsOverlap(a, b){
  return !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h);
}

function collideWithPlatforms(oldX, oldY, newX, newY, w, h, map){
  // AABB cast between (newX,newY)-(newX+w,newY+h)
  const A = {x:newX, y:newY, w, h};
  for (let p of map.platforms){
    if (rectsOverlap(A, p)) return {collided:true, ...p};
  }
  return {collided:false};
}

// Level format: platforms[], spikes[], enemies[], start, finish
levels = [
  // Level 1
  {
    platforms:[
      {x:0, y:HEIGHT-40, w:WIDTH, h:40}, // ground
      {x:200, y:420, w:160, h:20},
      {x:420, y:340, w:140, h:20},
      {x:620, y:260, w:180, h:20},
      {x:860, y:200, w:120, h:20},
      {x:1020, y:420, w:240, h:20}, // offscreen extra (for bigger maps)
    ],
    spikes:[
      {x:360,y:HEIGHT-40-18,w:40,h:18},
    ],
    enemies:[
      new Enemy(450, 300, 36,36, 80)
    ],
    start:{x:40,y:HEIGHT-40-48},
    finish:{x:900,y:150,w:36,h:80}
  },
  // Level 2 (bigger challenge)
  {
    platforms:[
      {x:0,y:HEIGHT-40,w:WIDTH,h:40},
      {x:150,y:460,w:120,h:20},
      {x:320,y:400,w:120,h:20},
      {x:480,y:340,w:120,h:20},
      {x:640,y:280,w:120,h:20},
      {x:860,y:220,w:120,h:20},
      {x:1040,y:420,w:220,h:20},
      {x:1250,y:360,w:180,h:20}
    ],
    spikes:[
      {x:250,y:HEIGHT-40-18,w:40,h:18},
      {x:1010,y:HEIGHT-40-18,w:60,h:18}
    ],
    enemies:[
      new Enemy(520, 300, 36,36, 120),
      new Enemy(1100, 330, 36,36, 90)
    ],
    start:{x:20,y:HEIGHT-40-48},
    finish:{x:1300,y:300,w:36,h:80}
  }
];

// Camera for scrolling world
let cameraX = 0;

let player = new Player(levels[0].start.x, levels[0].start.y);

function resetLevel(index){
  const lvl = levels[index];
  player.reset(lvl.start.x, lvl.start.y);
  // re-create enemies for this level (to reset pos)
  lvl.enemies = lvl.enemies.map(e => {
    // if already Enemy instances, rebuild a new one with same params
    if (e instanceof Enemy) return new Enemy(e.startX, e.y, e.w, e.h, e.range);
    return new Enemy(e.x, e.y);
  });
  cameraX = 0;
  livesEl.textContent = `Lives: ${lives}`;
  levelEl.textContent = `Level: ${index+1}`;
}

function restartGame(){
  lives = 3;
  currentLevel = 0;
  resetLevel(currentLevel);
}

// input handlers
window.addEventListener('keydown', e => {
  keys[e.key] = true;
});
window.addEventListener('keyup', e => {
  keys[e.key] = false;
});

// mobile touch controls
leftBtn.addEventListener('touchstart', ()=> touchState.left=true);
leftBtn.addEventListener('touchend', ()=> touchState.left=false);
rightBtn.addEventListener('touchstart', ()=> touchState.right=true);
rightBtn.addEventListener('touchend', ()=> touchState.right=false);
upBtn.addEventListener('touchstart', ()=> { touchState.up=true; setTimeout(()=>touchState.up=false,150); });

// also mouse/tap for mobile
leftBtn.addEventListener('mousedown', ()=> touchState.left=true);
leftBtn.addEventListener('mouseup', ()=> touchState.left=false);
rightBtn.addEventListener('mousedown', ()=> touchState.right=true);
rightBtn.addEventListener('mouseup', ()=> touchState.right=false);
upBtn.addEventListener('mousedown', ()=> { touchState.up=true; setTimeout(()=>touchState.up=false,150); });

// Game loop
let last = 0;
function loop(ts){
  const dt = Math.min(32, ts - last);
  last = ts;
  update(dt/16);
  render();
  requestAnimationFrame(loop);
}

function update(dt){
  const lvl = levels[currentLevel];

  // update player with current level map
  player.update(lvl);

  // update enemies
  lvl.enemies.forEach(e => e.update());

  // camera follow
  cameraX = Math.max(0, player.x - 200);

  // check falling off world (too low)
  if (player.y > HEIGHT + 200){
    loseLife();
  }

  // check spike collisions
  for (let s of lvl.spikes){
    if (rectsOverlap({x:player.x,y:player.y,w:player.w,h:player.h}, s)){
      loseLife();
      return;
    }
  }

  // check enemy collisions
  for (let e of lvl.enemies){
    if (rectsOverlap({x:player.x,y:player.y,w:player.w,h:player.h}, {x:e.x,y:e.y,w:e.w,h:e.h})){
      loseLife();
      return;
    }
  }

  // check finish
  const f = lvl.finish;
  if (rectsOverlap({x:player.x,y:player.y,w:player.w,h:player.h}, f)){
    currentLevel++;
    if (currentLevel >= levels.length){
      showMessage("You Win! Congratulations 🎉", true);
      // reset after win
      setTimeout(()=>{ restartGame(); hideMessage(); }, 2000);
      return;
    } else {
      showMessage(`Level ${currentLevel} Cleared!`, true);
      setTimeout(()=>{ resetLevel(currentLevel); hideMessage(); }, 1000);
    }
  }
}

function loseLife(){
  lives--;
  if (lives <= 0){
    showMessage("Game Over! Restarting...", true);
    setTimeout(()=>{ restartGame(); hideMessage(); }, 1400);
  } else {
    showMessage("You Died! -1 life", true);
    // respawn at start of level
    setTimeout(()=>{ resetLevel(currentLevel); hideMessage(); }, 900);
  }
  livesEl.textContent = `Lives: ${lives}`;
}

// draw world
function render(){
  ctx.clearRect(0,0,WIDTH,HEIGHT);

  // sky / background gradient
  const grad = ctx.createLinearGradient(0,0,0,HEIGHT);
  grad.addColorStop(0,'#aee1ff');
  grad.addColorStop(1,'#dbefff');
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,WIDTH,HEIGHT);

  // draw parallax hills
  drawHills();

  // world transform (camera)
  ctx.save();
  ctx.translate(-cameraX, 0);

  const lvl = levels[currentLevel];

  // platforms
  lvl.platforms.forEach(p => {
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--platform').trim() || '#654321';
    roundRect(ctx, p.x, p.y, p.w, p.h, 6, true, false);
  });

  // spikes
  lvl.spikes.forEach(s => {
    drawSpikes(s.x, s.y, s.w, s.h);
  });

  // enemies
  lvl.enemies.forEach(e => e.draw(ctx));

  // finish flag
  const f = lvl.finish;
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--finish').trim() || '#ffd700';
  // flag pole
  ctx.fillRect(f.x + f.w/2 - 3, f.y, 6, f.h);
  // flag
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.moveTo(f.x + f.w/2 + 3, f.y + 10);
  ctx.lineTo(f.x + f.w/2 + 40, f.y + 22);
  ctx.lineTo(f.x + f.w/2 + 3, f.y + 34);
  ctx.closePath();
  ctx.fill();

  // player
  player.draw(ctx);

  ctx.restore();
}

function drawSpikes(x,y,w,h){
  ctx.fillStyle = '#222';
  // simple triangle spikes
  const spikeCount = Math.max(1, Math.floor(w / 12));
  const step = w / spikeCount;
  for (let i=0;i<spikeCount;i++){
    const sx = x + i*step;
    ctx.beginPath();
    ctx.moveTo(sx, y+h);
    ctx.lineTo(sx + step/2, y);
    ctx.lineTo(sx + step, y+h);
    ctx.closePath();
    ctx.fill();
  }
}

function drawHills(){
  // small parallax hills
  ctx.save();
  ctx.translate(-cameraX * 0.3, 0);
  ctx.fillStyle = '#8fd48f';
  ctx.beginPath();
  ctx.ellipse(120, 420, 260, 100, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(520, 430, 200, 80, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();
}

// initial setup
resetLevel(0);
requestAnimationFrame(loop);

// message helpers
function showMessage(text, persist=false){
  msgEl.textContent = text;
  msgEl.classList.remove('hidden');
  if (!persist){
    setTimeout(()=>hideMessage(), 1200);
  }
}
function hideMessage(){
  msgEl.classList.add('hidden');
}

// expose restart via double-click on canvas
canvas.addEventListener('dblclick', ()=>{ restartGame(); showMessage('Restarting...', true); setTimeout(()=>hideMessage(),1000) });

// basic instructions overlay first time
showMessage('Use ← → to move, ↑ / Space to jump. Double-click canvas to restart. Good luck!', false);

// optional: resize canvas while keeping same resolution scale
window.addEventListener('resize', ()=> {
  // keep canvas size fixed but scale in CSS automatically via max-width
});

