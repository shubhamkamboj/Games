
/* 2048 Game - mobile swipe + arrow keys + leaderboard (localStorage) */
const boardSize = 4;
let board = [];
let score = 0;
let playerName = '';
let history = [];

// DOM
const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const leaderScreen = document.getElementById('leaderScreen');
const startBtn = document.getElementById('startBtn');
const viewBoardBtn = document.getElementById('viewBoardBtn');
const grid = document.getElementById('grid');
const scoreEl = document.getElementById('score');
const restartBtn = document.getElementById('restartBtn');
const undoBtn = document.getElementById('undoBtn');
const backBtn = document.getElementById('backBtn');
const leaderList = document.getElementById('leaderList');
const clearBoardBtn = document.getElementById('clearBoardBtn');
const closeBoardBtn = document.getElementById('closeBoardBtn');

// start
startBtn.addEventListener('click', ()=>{
  const name = document.getElementById('playerName').value.trim();
  if(!name) return alert('Enter name please');
  playerName = name;
  startScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  initGame();
});

viewBoardBtn.addEventListener('click', ()=>{ showLeaderboard(); });

restartBtn.addEventListener('click', ()=>{ initGame(); });
backBtn.addEventListener('click', ()=>{ gameScreen.classList.add('hidden'); startScreen.classList.remove('hidden'); });
clearBoardBtn.addEventListener('click', ()=>{ localStorage.removeItem('leader2048'); renderLeaderboard(); });
closeBoardBtn.addEventListener('click', ()=>{ leaderScreen.classList.add('hidden'); startScreen.classList.remove('hidden'); });

// init
function initGame(){
  board = Array.from({length:boardSize}, ()=>Array(boardSize).fill(0));
  score = 0; history = [];
  addRandomTile(); addRandomTile();
  render();
}

// utilities
function addRandomTile(){
  const empties = [];
  for(let r=0;r<boardSize;r++) for(let c=0;c<boardSize;c++) if(board[r][c]===0) empties.push([r,c]);
  if(empties.length===0) return;
  const [r,c] = empties[Math.floor(Math.random()*empties.length)];
  board[r][c] = Math.random()<0.9?2:4;
}

function cloneBoard(b){ return b.map(row=>row.slice()); }

// moves
function slideLeft(row){
  const arr = row.filter(v=>v);
  for(let i=0;i<arr.length-1;i++){
    if(arr[i]===arr[i+1]){ arr[i]*=2; score+=arr[i]; arr[i+1]=0; }
  }
  const res = arr.filter(v=>v);
  while(res.length<boardSize) res.push(0);
  return res;
}

function moveLeft(){
  const before = cloneBoard(board);
  for(let r=0;r<boardSize;r++) board[r]=slideLeft(board[r]);
  afterMove(before);
}
function moveRight(){ const before=cloneBoard(board); for(let r=0;r<boardSize;r++){ board[r]=slideLeft(board[r].slice().reverse()).reverse(); } afterMove(before); }
function moveUp(){ const before=cloneBoard(board); board = rotateCW(board); moveLeft(); board = rotateCCW(board); afterMove(before); }
function moveDown(){ const before=cloneBoard(board); board = rotateCW(board); moveRight(); board = rotateCCW(board); afterMove(before); }

function rotateCW(mat){ return mat[0].map((_,i)=>mat.map(row=>row[i]).reverse()); }
function rotateCCW(mat){ return rotateCW(rotateCW(rotateCW(mat))); }

function afterMove(before){
  if(JSON.stringify(before)!==JSON.stringify(board)){
    history.push({board:cloneBoard(before), scoreBefore: score});
    addRandomTile(); render();
    if(isGameOver()) onGameOver();
  }
}

// render
function render(){
  grid.innerHTML='';
  for(let r=0;r<boardSize;r++){
    for(let c=0;c<boardSize;c++){
      const val = board[r][c];
      const cell = document.createElement('div');
      cell.className='cell';
      if(val>0){
        const tile = document.createElement('div');
        tile.className='tile tile-'+val;
        tile.textContent = val;
        cell.appendChild(tile);
      }
      grid.appendChild(cell);
    }
  }
  scoreEl.textContent = score;
}

// undo
undoBtn.addEventListener('click', ()=>{
  if(history.length===0) return;
  const last = history.pop();
  board = cloneBoard(last.board);
  score = last.scoreBefore;
  render();
});

// game over
function isGameOver(){
  for(let r=0;r<boardSize;r++) for(let c=0;c<boardSize;c++){
    if(board[r][c]===0) return false;
    if(c<boardSize-1 && board[r][c]===board[r][c+1]) return false;
    if(r<boardSize-1 && board[r][c]===board[r+1][c]) return false;
  }
  return true;
}

function onGameOver(){
  saveScore();
  setTimeout(()=>{ showLeaderboard(); }, 200);
}

// leaderboard
function saveScore(){
  const list = JSON.parse(localStorage.getItem('leader2048')||'[]');
  list.push({name:playerName,score});
  list.sort((a,b)=>b.score-a.score);
  localStorage.setItem('leader2048', JSON.stringify(list.slice(0,10)));
}

function renderLeaderboard(){
  leaderList.innerHTML='';
  const list = JSON.parse(localStorage.getItem('leader2048')||'[]');
  if(list.length===0){ leaderList.innerHTML='<li>No scores yet</li>'; return; }
  list.forEach(it=>{
    const li = document.createElement('li');
    li.textContent = `${it.name} — ${it.score}`;
    leaderList.appendChild(li);
  });
}

// show leaderboard
function showLeaderboard(){
  gameScreen.classList.add('hidden');
  leaderScreen.classList.remove('hidden');
  renderLeaderboard();
}

// input handlers (keyboard + swipe)
let touchStartX=0, touchStartY=0;
window.addEventListener('keydown', e=>{
  if(document.activeElement.tagName==='INPUT') return;
  switch(e.key){
    case 'ArrowLeft': moveLeft(); break;
    case 'ArrowRight': moveRight(); break;
    case 'ArrowUp': moveUp(); break;
    case 'ArrowDown': moveDown(); break;
  }
});

window.addEventListener('touchstart', e=>{
  touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY;
}, {passive:true});
window.addEventListener('touchend', e=>{
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if(Math.abs(dx)>Math.abs(dy)){
    if(dx>30) moveRight(); else if(dx<-30) moveLeft();
  } else {
    if(dy>30) moveDown(); else if(dy<-30) moveUp();
  }
}, {passive:true});

// init first rendering (start screen shows by default)
renderLeaderboard();
