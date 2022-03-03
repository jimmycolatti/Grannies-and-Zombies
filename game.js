const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = 900;
canvas.height = 600;

// global variables
const cellSize = 100;
const cellGap = 3;
let numberOfResources = 300;
let enemiesInterval = 800;
let frame = 0;
let gameOver = false;
let score = 0;
const winningScore = 200;
let chosenDefender = 1;

const gameGrid = [];
const defenders = [];
const enemies = [];
const enemyPositions = [];
const projectiles = [];
const resources = [];

// mouse
const mouse = {
  x: 10,
  y: 10,
  width: 0.1,
  height: 0.1,
  clicked: false,
};
canvas.addEventListener('mousedown', function () {
  mouse.clicked = true;
  tapSound.play();
});
canvas.addEventListener('mouseup', function () {
  mouse.clicked = false;
});

let canvasPosition = canvas.getBoundingClientRect();
canvas.addEventListener('mousemove', function (e) {
  mouse.x = e.x - canvasPosition.left;
  mouse.y = e.y - canvasPosition.top;
});

canvas.addEventListener('mouseleave', function () {
  mouse.x = undefined;
  mouse.y = undefined;
});

// background
const background = new Image();
background.src = '/sprites/background1.png';
const grass = new Image();
grass.src = '/sprites/grass.png';

const BG = {
  x: 0,
  y: 200,
};

function handleBackground() {
  ctx.drawImage(background, 0, -200, canvas.width, canvas.height);
  ctx.drawImage(grass, BG.x, BG.y, canvas.width, canvas.height);
}

// game board
const controlsBar = {
  width: canvas.width,
  height: cellSize,
};
class Cell {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = cellSize;
    this.height = cellSize;
  }
  draw() {
    if (mouse.x && mouse.y && collision(this, mouse)) {
      ctx.strokeStyle = 'black';
      ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
  }
}
function createGrid() {
  for (let y = cellSize; y < canvas.height; y += cellSize) {
    for (let x = 0; x < canvas.width; x += cellSize) {
      gameGrid.push(new Cell(x, y));
    }
  }
}
createGrid();
function handleGameGrid() {
  for (let i = 0; i < gameGrid.length; i++) {
    gameGrid[i].draw();
  }
}

// audio
let mute = localStorage.getItem('mute');

let gameMusic = new Audio();
gameMusic.src = '/audio/gameMusic.mp3';
gameMusic.volume = 0.5;
gameMusic.loop = true;
document.onload = gameMusic.play();

let gameOverSound = new Audio();
gameOverSound.src = '/audio/gameOver.mp3';

let winnerSound = new Audio();
winnerSound.src = '/audio/Winner.mp3';

let resourcesSound = new Audio();
resourcesSound.src = '/audio/resources.mp3';
resourcesSound.volume = 0.5;

let zombieDeathSound = new Audio();
zombieDeathSound.src = '/audio/zombie-death.mp3';
zombieDeathSound.volume = 0.3;

let shotgunSound = new Audio();
shotgunSound.src = '/audio/shotgun_sound.mp3';
shotgunSound.volume = 0.1;

let tapSound = new Audio();
tapSound.src = '/audio/tap.mp3';
tapSound.volume = 1;

let zombieGroan = new Audio();
zombieGroan.src = '/audio/zombie-groan.mp3';
zombieGroan.volume = 0.5;

if (mute == 'true') {
  gameMusic.src = '';
  gameOverSound.src = '';
  winnerSound.src = '';
  resourcesSound.src = '';
  zombieDeathSound.src = '';
  shotgunSound.src = '';
  tapSound.src = '';
  zombieGroan.src = '';
}

// projectiles

class Projectile {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 10;
    this.height = 10;
    this.power = 20;
    this.speed = 5;
  }
  update() {
    this.x += this.speed;
  }
  draw() {
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2);
    ctx.fill();
  }
}

function handleProjectiles() {
  for (let i = 0; i < projectiles.length; i++) {
    projectiles[i].update();
    projectiles[i].draw();

    for (let j = 0; j < enemies.length; j++) {
      if (
        enemies[j] &&
        projectiles[i] &&
        collision(projectiles[i], enemies[j])
      ) {
        enemies[j].health -= projectiles[i].power;
        projectiles.splice(i, 1);
        i--;
      }
    }

    if (projectiles[i] && projectiles[i].x > canvas.width - cellSize) {
      projectiles.splice(i, 1);
      i--;
    }
  }
}

// defenders
const defender1 = new Image();
defender1.src = './sprites/oldlady1.png';
const defender2 = new Image();
defender2.src = './sprites/oldlady2.png';

class Defender {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = cellSize - cellGap * 2;
    this.height = cellSize - cellGap * 2;
    this.shooting = false;
    this.shootNow = false;
    this.health = 100;
    this.projectiles = [];
    this.timer = 0;
    this.frameX = 0;
    this.frameY = 0;
    this.spriteWidth = 1143.22;
    this.spriteHeight = 996;
    this.minFrame = 0;
    this.maxFrame = 19;
    this.chosenDefender = chosenDefender;
  }
  draw() {
    // ctx.fillStyle = 'blue';
    // ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = 'gold';
    ctx.font = '30px Orbitron';
    ctx.fillText(Math.floor(this.health), this.x + 25, this.y + 17);

    if (this.chosenDefender === 1) {
      ctx.drawImage(
        defender1,
        this.frameX * this.spriteWidth,
        0,
        this.spriteWidth,
        this.spriteHeight,
        this.x,
        this.y,
        this.width,
        this.height
      );
    } else if (this.chosenDefender === 2) {
      ctx.drawImage(
        defender2,
        this.frameX * this.spriteWidth,
        0,
        this.spriteWidth,
        this.spriteHeight,
        this.x,
        this.y,
        this.width,
        this.height
      );
    }
  }
  update() {
    if (frame % 5 === 0) {
      if (this.frameX < this.maxFrame) this.frameX++;
      else this.frameX = this.minFrame;
      if (this.frameX === 22) this.shootNow = true;
    }

    if (this.shooting) {
      this.minFrame = 0;
      this.maxFrame = 25;
    } else {
      this.minFrame = 0;
      this.maxFrame = 19;
    }

    if (this.shooting && this.shootNow) {
      shotgunSound.play();
      projectiles.push(new Projectile(this.x + 70, this.y + 50));
      this.shootNow = false;
    }
  }
}

function handleDefenders() {
  for (let i = 0; i < defenders.length; i++) {
    defenders[i].draw();
    defenders[i].update();

    if (enemyPositions.indexOf(defenders[i].y) !== -1) {
      defenders[i].shooting = true;
    } else {
      defenders[i].shooting = false;
    }
    for (let j = 0; j < enemies.length; j++) {
      if (defenders[i] && collision(defenders[i], enemies[j])) {
        enemies[j].movement = 0;
        defenders[i].health -= 0.2;
      }
      if (defenders[i] && defenders[i].health <= 0) {
        defenders.splice(i, 1);
        i--;
        enemies[j].movement = enemies[j].speed;
      }
    }
  }
}

const card1 = {
  x: 10,
  y: 10,
  width: 70,
  height: 85,
};
const card2 = {
  x: 90,
  y: 10,
  width: 70,
  height: 85,
};

const card1Img = new Image();
card1Img.src = './sprites/card_oldlady1.png';
const card2Img = new Image();
card2Img.src = './sprites/card_oldlady2.png';

function chooseDefender() {
  let card1Stroke = 'gold';
  let card2Stroke = 'black';

  if (collision(mouse, card1) && mouse.clicked) {
    chosenDefender = 2;
  } else if (collision(mouse, card2) && mouse.clicked) {
    chosenDefender = 1;
  }

  if (chosenDefender === 1) {
    card1Stroke = 'black';
    card2Stroke = 'gold';
  } else if (chosenDefender === 2) {
    card1Stroke = 'gold';
    card2Stroke = 'black';
  } else {
    card1Stroke = 'black';
    card2Stroke = 'black';
  }

  ctx.lineWidth = 1;
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(card1.x, card1.y, card1.width, card1.height);
  ctx.strokeStyle = card1Stroke;
  ctx.strokeRect(card1.x, card1.y, card1.width, card1.height);
  ctx.drawImage(
    card1Img,
    card1.x - 5,
    card1.y - 7,
    cellSize - cellGap * 2,
    cellSize - cellGap * 2
  );
  ctx.fillRect(card2.x, card2.y, card2.width, card2.height);
  ctx.strokeStyle = card2Stroke;
  ctx.strokeRect(card2.x, card2.y, card2.width, card2.height);
  ctx.drawImage(
    card2Img,
    card2.x - 5,
    card2.y - 7,
    cellSize - cellGap * 2,
    cellSize - cellGap * 2
  );
}

// Floating Messages
const floatingMessages = [];

class FloatingMessage {
  constructor(value, x, y, size, color) {
    this.value = value;
    this.x = x;
    this.y = y;
    this.size = size;
    this.lifeSpan = 0;
    this.color = color;
    this.opacity = 1;
  }
  update() {
    this.y -= 0.3;
    this.lifeSpan += 1;
    if (this.opacity > 0.03) this.opacity -= 0.03;
  }
  draw() {
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = this.color;
    ctx.font = this.size + 'px Orbitron';
    ctx.fillText(this.value, this.x, this.y);
    ctx.globalAlpha = 1;
  }
}
function handleFloatingMessages() {
  for (let i = 0; i < floatingMessages.length; i++) {
    floatingMessages[i].update();
    floatingMessages[i].draw();
    if (floatingMessages[i].lifeSpan >= 50) {
      floatingMessages.splice(i, 1);
      i--;
    }
  }
}

// enemies
const enemyTypes = [];
const enemy1 = new Image();
enemy1.src = './sprites/zombie1.png';
enemyTypes.push(enemy1);
const enemy2 = new Image();
enemy2.src = './sprites/zombie2.png';
enemyTypes.push(enemy2);

class Enemy {
  constructor(verticalPosition) {
    this.x = canvas.width;
    this.y = verticalPosition;
    this.width = cellSize - cellGap * 2;
    this.height = cellSize - cellGap * 2;
    this.speed = Math.random() * 0.2 + 0.6;
    this.movement = this.speed;
    this.health = 100;
    this.maxHealth = this.health;
    this.enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    this.frameX = 0;
    this.frameY = 0;
    this.minFrame = 0;
    this.maxFrame = 3;
    this.spriteWidth = 972;
    this.spriteHeight = 818;
  }

  update() {
    this.x -= this.movement;
    if (frame % 10 === 0) {
      if (this.frameX === this.maxFrame && this.frameY === this.maxFrame) {
        this.frameX = 0;
        this.frameY = 0;
      } else if (this.frameX === this.maxFrame) {
        this.frameX = 0;
        this.frameY++;
      } else if (this.frameX < this.maxFrame) {
        this.frameX++;
      }
    }
  }
  draw() {
    // ctx.fillStyle = 'red';
    // ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = 'black';
    ctx.font = '30px Orbitron';
    ctx.fillText(Math.floor(this.health), this.x + 40, this.y + 15);
    // ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
    ctx.drawImage(
      this.enemyType,
      this.frameX * this.spriteWidth,
      this.frameY * this.spriteHeight,
      this.spriteWidth,
      this.spriteHeight,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }
}
function handleEnemies() {
  for (let i = 0; i < enemies.length; i++) {
    enemies[i].update();
    enemies[i].draw();
    if (enemies[i].x < 0) {
      gameOver = true;
    }
    if (enemies[i].health <= 0) {
      zombieDeathSound.play();
      let gainedResources = enemies[i].maxHealth / 10;
      floatingMessages.push(
        new FloatingMessage(
          '+' + gainedResources,
          enemies[i].x,
          enemies[i].y,
          30,
          'black'
        )
      );
      floatingMessages.push(
        new FloatingMessage('+' + gainedResources, 250, 50, 30, 'gold')
      );
      numberOfResources += gainedResources;
      score += gainedResources;
      const findThisIndex = enemyPositions.indexOf(enemies[i].y);
      enemyPositions.splice(findThisIndex, 1);
      enemies.splice(i, 1);
      i--;
    }
  }
  if (frame % enemiesInterval === 0 && score < winningScore) {
    zombieGroan.play();
    let verticalPosition =
      Math.floor(Math.random() * 5 + 1) * cellSize + cellGap;
    enemies.push(new Enemy(verticalPosition));
    enemyPositions.push(verticalPosition);
    if (enemiesInterval > 300) enemiesInterval -= 50; // game difficulty
  }
}

// resources
const amounts = [20, 30, 40];
const resourcesTypes = [];

const greenBag = new Image();
greenBag.src = './sprites/resources/green_handbag.png';
resourcesTypes.push(greenBag);
const pinkBag = new Image();
pinkBag.src = './sprites/resources/pink_handbag.png';
resourcesTypes.push(pinkBag);
const purpleBag = new Image();
purpleBag.src = './sprites/resources/purple_handbag.png';
resourcesTypes.push(purpleBag);
const redBag = new Image();
redBag.src = './sprites/resources/red_handbag.png';
resourcesTypes.push(redBag);
const turquoiseBag = new Image();
turquoiseBag.src = './sprites/resources/turquoise_handbag.png';
resourcesTypes.push(turquoiseBag);
const yellowBag = new Image();
yellowBag.src = './sprites/resources/yellow_handbag.png';
resourcesTypes.push(yellowBag);

class Resource {
  constructor() {
    this.x = Math.random() * (canvas.width - cellSize);
    this.y = (Math.floor(Math.random() * 5) + 1) * cellSize + 25;
    this.width = cellSize * 0.6;
    this.height = cellSize * 0.6;
    this.amount = amounts[Math.floor(Math.random() * amounts.length)];
    this.resourceType =
      resourcesTypes[Math.floor(Math.random() * resourcesTypes.length)];
  }

  draw() {
    // ctx.fillStyle = 'yellow';
    // ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.drawImage(
      this.resourceType,
      this.x + 45,
      this.y + 10,
      this.width / 1.2,
      this.height / 1.2
    );
    ctx.fillStyle = 'black';
    ctx.font = '20px Orbitron';
    ctx.fillText(this.amount, this.x + 15, this.y + 25);
  }
}

function handleResources() {
  if (frame % 500 === 0 && score < winningScore) {
    resources.push(new Resource());
  }
  for (let i = 0; i < resources.length; i++) {
    resources[i].draw();
    if (resources[i] && mouse.x && mouse.y && collision(resources[i], mouse)) {
      numberOfResources += resources[i].amount;
      resourcesSound.play();
      floatingMessages.push(
        new FloatingMessage(
          '+' + resources[i].amount,
          resources[i].x,
          resources[i].y,
          30,
          'black'
        )
      );
      floatingMessages.push(
        new FloatingMessage('+' + resources[i].amount, 470, 85, 30, 'gold')
      );
      resources.splice(i, 1);
      i--;
    }
  }
}

// utilities
function handleGameStatus() {
  ctx.fillStyle = 'gold';
  ctx.font = '30px Orbitron';
  ctx.fillText('Score: ' + score, 180, 40);
  ctx.fillText('Resources: ' + numberOfResources, 180, 80);
  if (gameOver) {
    gameMusic.pause();
    gameOverSound.play();
    ctx.fillStyle = 'black';
    ctx.font = '90px Orbitron';
    ctx.fillText('GAME OVER', 135, 330);
  }
  if (score >= winningScore && enemies.length === 0) {
    gameMusic.pause();
    winnerSound.play();
    ctx.fillStyle = 'black';
    ctx.font = '60px Orbitron';
    ctx.fillText('LEVEL COMPLETE', 130, 300);
    ctx.font = '30px Orbitron';
    ctx.fillText('You win with ' + score + ' points!', 134, 340);
  }
}

canvas.addEventListener('click', function () {
  const gridPositionX = mouse.x - (mouse.x % cellSize) + cellGap;
  const gridPositionY = mouse.y - (mouse.y % cellSize) + cellGap;
  if (gridPositionY < cellSize) return;
  for (let i = 0; i < defenders.length; i++) {
    if (defenders[i].x === gridPositionX && defenders[i].y === gridPositionY)
      return;
  }
  let defenderCost = 100;
  if (numberOfResources >= defenderCost) {
    defenders.push(new Defender(gridPositionX, gridPositionY));
    numberOfResources -= defenderCost;
  } else {
    floatingMessages.push(
      new FloatingMessage('need more resources', mouse.x, mouse.y, 20, 'blue')
    );
  }
});

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  handleBackground();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; // top bar color
  ctx.fillRect(0, 0, controlsBar.width, controlsBar.height);
  handleGameGrid();
  handleDefenders();
  handleResources();
  handleProjectiles();
  handleEnemies();
  chooseDefender();
  handleGameStatus();
  handleFloatingMessages();
  frame++;
  if (!gameOver) requestAnimationFrame(animate);
}
animate();

function collision(first, second) {
  if (
    !(
      first.x > second.x + second.width ||
      first.x + first.width < second.x ||
      first.y > second.y + second.height ||
      first.y + first.height < second.y
    )
  ) {
    return true;
  }
}

window.addEventListener('resize', function () {
  canvasPosition = canvas.getBoundingClientRect();
});
