
// Flappy game - no alert popups. Leaderboard shown inline after game over. Uses localStorage for leaderboard.
const playBtn = document.getElementById('playBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const clearBtn = document.getElementById('clearBtn');
const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const leaderboardScreen = document.getElementById('leaderboardScreen');
const displayName = document.getElementById('displayName');
const displayLevel = document.getElementById('displayLevel');
const displayScore = document.getElementById('displayScore');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const pauseBtn = document.getElementById('pauseBtn');
const restartBtn = document.getElementById('restartBtn');

// responsive canvas sizing
function resizeCanvas() {
  const wrap = canvas.parentElement.getBoundingClientRect();
  const w = Math.min(wrap.width - 20, 720);
  const h = Math.round(w * (600/420));
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  canvas.width = Math.round(w * devicePixelRatio);
  canvas.height = Math.round(h * devicePixelRatio);
  ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
}
window.addEventListener('resize', resizeCanvas);

// game vars
let playerName = '';
let bird = null;
let pipes = [];
let frames = 0;
let score = 0;
let level = 1;
let running = false;
let raf = null;

// leaderboard helpers
function loadBoard(){ try{return JSON.parse(localStorage.getItem('flappy_board')||'[]')}catch(e){return[]} }
function saveBoard(list){ localStorage.setItem('flappy_board', JSON.stringify(list)) }
function addToBoard(entry){
  const list = loadBoard();
  list.push(entry);
  list.sort((a,b)=>b.score-a.score);
  const top = list.slice(0,10);
  saveBoard(top);
  return top;
}

// UI functions
function showLeaderboardScreen(){
  startScreen.hidden = true; gameScreen.hidden = true; leaderboardScreen.hidden = false;
  const tbody = document.querySelector('#leaderTable tbody');
  tbody.innerHTML = '';
  const list = loadBoard();
  if(list.length===0){ tbody.innerHTML = '<tr><td colspan="5">No scores yet</td></tr>'; return; }
  list.forEach((it, idx)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${idx+1}</td><td>${it.name}</td><td>${it.score}</td><td>${it.level}</td><td>${new Date(it.when).toLocaleString()}</td>`;
    tbody.appendChild(tr);
  });
}

function showGameScreen(){
  startScreen.hidden = true; leaderboardScreen.hidden = true; gameScreen.hidden = false;
  resizeCanvas();
  displayName.textContent = playerName;
  displayLevel.textContent = level;
  displayScore.textContent = score;
}

// reset and start
function resetGameVars(){
  frames = 0;
  pipes = [];
  score = 0;
  level = 1;
  running = true;
  bird = { x: 70, y: 200, r: 12, vy: 0 };
  displayLevel.textContent = level;
  displayScore.textContent = score;
}

function startGame(){
  const nameInput = document.getElementById('playerName');
  const name = nameInput.value.trim();
  if(!name) { nameInput.focus(); return; }
  playerName = name;
  resetGameVars();
  showGameScreen();
  loop();
}

// game mechanics
function spawnPipe(){
  const gap = 400 - (level-1)*5;
  const top = Math.random()*(canvas.height/devicePixelRatio - gap - 60) + 30;
  pipes.push({ x: canvas.width/devicePixelRatio, top: top, bottom: top+gap, w: 50, passed:false });
}

function update(){
  if(!running) return;
  frames++;
  // spawn regularly
  if(frames % 90 === 0) spawnPipe();
  // update pipes
  for(let i=pipes.length-1;i>=0;i--){
    pipes[i].x -= 2 + (level-1)*0.3;
    // check pass
    if(!pipes[i].passed && pipes[i].x + pipes[i].w < bird.x){
      pipes[i].passed = true; score++; displayScore.textContent = score;
      if(score % 5 === 0){ level++; displayLevel.textContent = level; }
    }
    // collision
    if(bird.x + bird.r > pipes[i].x && bird.x - bird.r < pipes[i].x + pipes[i].w){
      if(bird.y - bird.r < pipes[i].top || bird.y + bird.r > pipes[i].bottom){
        endGame(); return;
      }
    }
    if(pipes[i].x + pipes[i].w < -50) pipes.splice(i,1);
  }
  // physics
  bird.vy += 0.5;
  bird.y += bird.vy;
  if(bird.y + bird.r > canvas.height/devicePixelRatio){ endGame(); return; }
  if(bird.y - bird.r < 0){ bird.y = bird.r; bird.vy = 0; }
}

function draw(){
  // clear
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // sky
  ctx.fillStyle = '#87CEEB'; ctx.fillRect(0,0,canvas.width/devicePixelRatio,canvas.height/devicePixelRatio);
  // draw pipes
  ctx.fillStyle = '#1f7a3a';
  for(const p of pipes){
    ctx.fillRect(p.x, 0, p.w, p.top);
    ctx.fillRect(p.x, p.bottom, p.w, canvas.height/devicePixelRatio - p.bottom);
  }
  // draw bird
  ctx.beginPath(); ctx.fillStyle = '#FFD700'; ctx.arc(bird.x, bird.y, bird.r, 0, Math.PI*2); ctx.fill(); ctx.closePath();
}

function loop(){
  update(); draw();
  if(running) raf = requestAnimationFrame(loop);
}

// input controls
window.addEventListener('keydown', (e)=>{ if(e.code==='Space'){ bird.vy = -8; } });
canvas.addEventListener('touchstart', (e)=>{ e.preventDefault(); bird.vy = -8; }, {passive:false});
canvas.addEventListener('mousedown', ()=>{ bird.vy = -8; });

function endGame(){
  running = false;
  cancelAnimationFrame(raf);
  // save to leaderboard
  const entry = { name: playerName || 'Player', score: score, level: level, when: new Date().toISOString() };
  addToBoard(entry);
  displayLeaderboardInline();
}

function addToBoard(entry){
  const list = loadBoard();
  list.push(entry);
  list.sort((a,b)=>b.score - a.score);
  const top = list.slice(0,10);
  saveBoard(top);
}

function displayLeaderboardInline(){
  showLeaderboardScreen();
}

// UI wiring
playBtn.addEventListener('click', startGame);
playAgainBtn.addEventListener('click', ()=>{ startScreen.hidden=false; leaderboardScreen.hidden=true; gameScreen.hidden=true; });
clearBtn.addEventListener('click', ()=>{ localStorage.removeItem('flappy_board'); displayLeaderboardInline(); });

pauseBtn.addEventListener('click', ()=>{ running = !running; if(running){ loop(); pauseBtn.textContent='Pause'; } else { pauseBtn.textContent='Resume'; } });
restartBtn.addEventListener('click', ()=>{ resetGameVars(); showGameScreen(); });

// initialize view
startScreen.hidden = false; gameScreen.hidden = true; leaderboardScreen.hidden = true;
resizeCanvas();
