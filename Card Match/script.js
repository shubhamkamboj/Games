/* Memory Card Match
   - supports 4x4 or 6x6 grid (select on start)
   - leaderboard stored in localStorage as top 10 times (lower is better)
   - responsive, mobile touch support
*/

const startScreen = document.getElementById('startScreen');
const gameScreen  = document.getElementById('gameScreen');
const leaderScreen= document.getElementById('leaderScreen');
const howScreen   = document.getElementById('howScreen');

const startBtn = document.getElementById('startBtn');
const howBtn   = document.getElementById('howBtn');
const howClose = document.getElementById('howClose');
const gridSelect = document.getElementById('gridSelect');

const boardEl = document.getElementById('board');
const playerLabel = document.getElementById('playerLabel');
const foundEl = document.getElementById('found');
const totalPairsEl = document.getElementById('totalPairs');
const timerEl = document.getElementById('timer');

const restartBtn = document.getElementById('restartBtn');
const quitBtn    = document.getElementById('quitBtn');
const showLeaderBtn = document.getElementById('showLeaderBtn');
const clearLeaderBtn = document.getElementById('clearLeaderBtn');

const leaderList = document.getElementById('leaderList');
const leaderBackBtn = document.getElementById('leaderBackBtn');
const leaderClearBtn= document.getElementById('leaderClearBtn');

let rows = 4;             // grid size (rows == cols)
let totalPairs = 8;
let icons = [];           // array of symbols
let deck = [];            // shuffled deck
let firstCard = null, secondCard = null;
let lockBoard = false;
let matchesFound = 0;
let startTime = 0, timerInterval = null;
let playerName = '';

/* --- icons: emoji set (you can change) --- */
const EMOJI_POOL = [
  '🍎','🍌','🍒','🍇','🍉','🍍','🥝','🍑','🍓','🍋','🍐','🥥','🥕','🌽','🍆','🍅','🫐','🥭'
];

/* HELPER: shuffle array */
function shuffle(a){
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()* (i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* START GAME */
startBtn.addEventListener('click', () => {
  const input = document.getElementById('playerName');
  const name = (input && input.value.trim()) || 'Player';
  playerName = name;
  rows = parseInt(gridSelect.value,10);
  totalPairs = (rows*rows)/2;
  playerLabel.textContent = playerName;
  totalPairsEl.textContent = totalPairs;
  startScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  initBoard();
});

/* HOW popup */
if(howBtn) howBtn.addEventListener('click', ()=>{ howScreen.classList.remove('hidden'); });
if(howClose) howClose.addEventListener('click', ()=>{ howScreen.classList.add('hidden'); });

/* INIT & RENDER BOARD */
function initBoard(){
  clearTimer();
  matchesFound = 0;
  foundEl.textContent = matchesFound;
  firstCard = secondCard = null;
  lockBoard = false;
  boardEl.innerHTML = '';

  // pick icons needed
  const needed = (rows*rows)/2;
  const pool = EMOJI_POOL.slice(0);
  shuffle(pool);
  icons = pool.slice(0, needed);

  // build deck (pairs)
  deck = shuffle([...icons, ...icons]);

  // render grid
  boardEl.style.gridTemplateColumns = `repeat(${rows}, 1fr)`;
  boardEl.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  for (let i=0;i<deck.length;i++){
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.index = i;
    const inner = document.createElement('div'); inner.className='cell-inner';
    const front = document.createElement('div'); front.className='face front'; front.textContent = '?';
    const back  = document.createElement('div'); back.className='face back'; back.textContent = deck[i];
    inner.appendChild(front); inner.appendChild(back);
    cell.appendChild(inner);
    cell.addEventListener('click', onCardClick);
    boardEl.appendChild(cell);
  }

  // start timer
  startTime = Date.now();
  timerEl.textContent = '0';
  timerInterval = setInterval(()=> {
    const secs = Math.floor((Date.now()-startTime)/1000);
    timerEl.textContent = secs;
  }, 300);
}

/* CARD CLICK */
function onCardClick(evt){
  const cell = evt.currentTarget;
  if(lockBoard) return;
  if(cell.classList.contains('flipped')) return;

  // flip
  cell.classList.add('flipped');

  if(!firstCard){
    firstCard = cell;
    return;
  }
  secondCard = cell;
  lockBoard = true;

  // compare values
  const a = deck[ parseInt(firstCard.dataset.index,10) ];
  const b = deck[ parseInt(secondCard.dataset.index,10) ];

  if(a === b){
    // match
    setTimeout(()=> {
      firstCard.removeEventListener('click', onCardClick);
      secondCard.removeEventListener('click', onCardClick);
      resetSelection(true);
      matchesFound++;
      foundEl.textContent = matchesFound;
      if(matchesFound === totalPairs) finishGame();
    }, 550);
  } else {
    setTimeout(()=> {
      firstCard.classList.remove('flipped');
      secondCard.classList.remove('flipped');
      resetSelection(false);
    }, 900);
  }
}

function resetSelection(matched){
  firstCard = secondCard = null;
  lockBoard = false;
}

/* FINISH */
function finishGame(){
  clearTimer();
  const timeSec = Math.floor((Date.now()-startTime)/1000);
  saveScore(playerName, timeSec, rows);
  // show leaderboard after short delay
  setTimeout(() => { showLeaderboard(); }, 500);
}

/* TIMER */
function clearTimer(){
  if(timerInterval) clearInterval(timerInterval);
  timerInterval = null;
}

/* LEADERBOARD (localStorage) */
const STORAGE_KEY = 'memory_leaderboard_v1';

/* save new record: we keep separate leaderboards per grid size (4x4 vs 6x6) */
function saveScore(name, time, gridSize){
  const listAll = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  const key = `${gridSize}x${gridSize}`;
  const arr = listAll[key] || [];
  arr.push({name, time, when: new Date().toISOString()});
  arr.sort((a,b)=> a.time - b.time); // lower time is better
  listAll[key] = arr.slice(0,10);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(listAll));
}

/* render leaderboard screen */
function showLeaderboard(){
  gameScreen.classList.add('hidden');
  leaderScreen.classList.remove('hidden');
  renderLeaderboardList();
}

function renderLeaderboardList(){
  const listAll = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  const key = `${rows}x${rows}`;
  const arr = listAll[key] || [];
  leaderList.innerHTML = '';
  if(arr.length===0){
    leaderList.innerHTML = '<li style="opacity:.7">No scores yet — play a round!</li>';
    return;
  }
  arr.forEach((it, idx) => {
    const li = document.createElement('li');
    li.textContent = `${idx+1}. ${it.name} — ${it.time}s (on ${new Date(it.when).toLocaleDateString()})`;
    leaderList.appendChild(li);
  });
}

/* UI buttons wiring */
restartBtn.addEventListener('click', ()=>{ initBoard(); });
quitBtn.addEventListener('click', ()=>{ clearTimer(); gameScreen.classList.add('hidden'); startScreen.classList.remove('hidden'); });
showLeaderBtn.addEventListener('click', showLeaderboard);
clearLeaderBtn.addEventListener('click', ()=>{ localStorage.removeItem(STORAGE_KEY); renderLeaderboardList(); });
leaderBackBtn.addEventListener('click', ()=>{ leaderScreen.classList.add('hidden'); gameScreen.classList.remove('hidden'); });
leaderClearBtn.addEventListener('click', ()=>{ localStorage.removeItem(STORAGE_KEY); renderLeaderboardList(); });

/* keyboard accessibility: allow Enter to start, and space to flip focused card */
document.addEventListener('keydown', (e)=>{
  if(e.key === 'Enter' && !startScreen.classList.contains('hidden')){
    startBtn.click();
  }
});
