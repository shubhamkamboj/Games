const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");

let box = 20;
let snake;
let direction;
let foods = [];
let score;
let speed;
let game;

// 🎮 Start Game
function startGame() {
  snake = [{ x: 10 * box, y: 10 * box }];
  direction = null;
  foods = generateFoods(2); // start with 2 foods
  score = 0;
  speed = 200;

  clearInterval(game);
  game = setInterval(draw, speed);
}

// 🎯 Generate multiple foods
function generateFoods(count = 1) {
  let newFoods = [];
  for (let i = 0; i < count; i++) {
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * 20) * box,
        y: Math.floor(Math.random() * 20) * box,
      };
    } while (
      collision(newFood, snake) ||
      newFoods.some(f => f.x === newFood.x && f.y === newFood.y)
    );
    newFoods.push(newFood);
  }
  return newFoods;
}

function collision(food, snakeArray) {
  return snakeArray.some(segment => segment.x === food.x && segment.y === food.y);
}

document.addEventListener("keydown", changeDirection);

function changeDirection(event) {
  if (event.keyCode === 37 && direction !== "RIGHT") direction = "LEFT";
  else if (event.keyCode === 38 && direction !== "DOWN") direction = "UP";
  else if (event.keyCode === 39 && direction !== "LEFT") direction = "RIGHT";
  else if (event.keyCode === 40 && direction !== "UP") direction = "DOWN";
}

function draw() {
  ctx.fillStyle = "#2c3e50";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 🟢 Draw snake
  for (let i = 0; i < snake.length; i++) {
    ctx.fillStyle = i === 0 ? "#1abc9c" : "#16a085";
    ctx.fillRect(snake[i].x, snake[i].y, box, box);
  }

  // 🍎 Draw foods
  foods.forEach(f => {
    ctx.fillStyle = "#e74c3c";
    ctx.beginPath();
    ctx.arc(f.x + box / 2, f.y + box / 2, box / 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // Snake head
  let snakeX = snake[0].x;
  let snakeY = snake[0].y;

  if (direction === "LEFT") snakeX -= box;
  if (direction === "UP") snakeY -= box;
  if (direction === "RIGHT") snakeX += box;
  if (direction === "DOWN") snakeY += box;

  // Check walls
 if (snakeX < 0) snakeX = canvas.width - box;
if (snakeY < 0) snakeY = canvas.height - box;
if (snakeX >= canvas.width) snakeX = 0;
if (snakeY >= canvas.height) snakeY = 0;

  // Check self collision
  for (let i = 1; i < snake.length; i++) {
    if (snakeX === snake[i].x && snakeY === snake[i].y) {
      clearInterval(game);
      alert("Game Over! Final Score: " + score);
      return;
    }
  }

  // ✅ Check if snake eats any food
  let ateFoodIndex = foods.findIndex(f => f.x === snakeX && f.y === snakeY);
  if (ateFoodIndex !== -1) {
    score++;

    // increase snake length
    let tail = { ...snake[snake.length - 1] };
    snake.push(tail);

    // replace eaten food with new one
    foods[ateFoodIndex] = generateFoods(1)[0];

    // speed up every 6 nodes
    if (snake.length % 6 === 0) {
      clearInterval(game);
      speed = Math.max(20, speed - 10);
      game = setInterval(draw, speed);
    }
  } else {
    snake.pop();
  }

  // add new head
  let newHead = { x: snakeX, y: snakeY };
  snake.unshift(newHead);

  // Show score
  ctx.fillStyle = "#fff";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, box, 1.5 * box);
}

// 🚀 Button Events
startBtn.addEventListener("click", () => {
  startScreen.style.display = "none";
  gameScreen.style.display = "block";
  startGame();
});

restartBtn.addEventListener("click", () => {
  startGame();
});
