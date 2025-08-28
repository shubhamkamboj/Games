const startBtn = document.getElementById('startBtn');
const boardEl = document.getElementById('board');
const turnEl = document.getElementById('turn');
const restartBtn = document.getElementById('restartBtn');
const leaderboardEl = document.getElementById('leaderboard');

let player1 = "";
let player2 = "";
let currentPlayer = "";
let board = ["", "", "", "", "", "", "", "", ""];
let gameActive = true;

const winningCombinations = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

// Start Game
startBtn.addEventListener('click', () => {
  player1 = document.getElementById('player1').value || "Player 1";
  player2 = document.getElementById('player2').value || "Player 2";
  currentPlayer = player1;
  document.getElementById('start-screen').style.display = "none";
  document.getElementById('game-screen').style.display = "block";
  turnEl.innerText = currentPlayer + "'s Turn";
  renderBoard();
  loadLeaderboard();
});

// Render board
function renderBoard(){
  boardEl.innerHTML = "";
  board.forEach((cell, index) => {
    const div = document.createElement('div');
    div.classList.add('cell');
    div.innerText = cell;
    div.addEventListener('click', () => handleMove(index));
    boardEl.appendChild(div);
  });
}

function handleMove(index){
  if(board[index] !== "" || !gameActive) return;
  board[index] = currentPlayer === player1 ? "X" : "O";
  renderBoard();
  checkResult();
  if(gameActive){
    currentPlayer = currentPlayer === player1 ? player2 : player1;
    turnEl.innerText = currentPlayer + "'s Turn";
  }
}

function checkResult(){
  let roundWon = false;
  for(let combo of winningCombinations){
    const [a,b,c] = combo;
    if(board[a] && board[a] === board[b] && board[a] === board[c]){
      roundWon = true;
      break;
    }
  }
  if(roundWon){
    turnEl.innerText = currentPlayer + " Wins!";
    gameActive = false;
    updateLeaderboard(currentPlayer);
    return;
  }
  if(!board.includes("")){
    turnEl.innerText = "It's a Draw!";
    gameActive = false;
  }
}

restartBtn.addEventListener('click', () => {
  board = ["", "", "", "", "", "", "", "", ""];
  gameActive = true;
  currentPlayer = player1;
  turnEl.innerText = currentPlayer + "'s Turn";
  renderBoard();
});

function updateLeaderboard(winner){
  let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || {};
  leaderboard[winner] = (leaderboard[winner] || 0) + 1;
  localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
  loadLeaderboard();
}

function loadLeaderboard(){
  leaderboardEl.innerHTML = "";
  let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || {};
  let sorted = Object.entries(leaderboard).sort((a,b) => b[1]-a[1]).slice(0,10);
  sorted.forEach(([name,score]) => {
    const li = document.createElement('li');
    li.innerText = name + " : " + score;
    leaderboardEl.appendChild(li);
  });
}
