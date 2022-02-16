
var canvas, ctx, ctxbuf;
var characterPosX, characterPosY;
var characterImage;
const characterR = 16;

var enemyPosX, enemyPosY;
var enemyImage;
const enemyR = 16;

var speed = 0;
var acceleration = 0;
var score;
var enemySpeed = 5;

const characterInitPosY = 400;

onload = function () {
  canvas = document.getElementById('gamecanvas');
  ctx = canvas.getContext('2d');
  canvas = document.getElementById('buffercanvas');
  ctxbuf = canvas.getContext('2d');

  init();
  document.onkeydown = keydown;
  setInterval(gameloop, 16);  // 1000ms/60f = 16fps
};

function init() {
  characterPosX = 100;
  characterPosY = 400;
  characterImage = new Image();
  characterImage.src = './img/reimu.png';

  enemyPosX = 600;
  enemyPosY = 400;
  enemyImage = new Image();
  enemyImage.src = '../img/marisa.png';

  score = 0;

}

function keydown(e) {
  console.log('keydown called.');
  if (speed === 0) {
    speed = -20;
    acceleration = 1.5;
  }
}

function gameloop() {
  update();
  draw();
}

function update() {
  speed = speed + acceleration;
  characterPosY += speed;
  if (characterPosY > characterInitPosY) {
    speed = 0;
    acceleration = 0;
    characterPosY = characterInitPosY;
  }

  enemyPosX -= enemySpeed;
  if (enemyPosX < -100) {
    enemyPosX = 600;
    score += 100;
  }

  const diffX = characterPosX - enemyPosX;
  const diffY = characterPosY - enemyPosY;
  const distance = diffX ** 2 + diffY ** 2;
  if (distance < (characterR + enemyR) ** 2) {
    enemySpeed = 0;
  }

}

function draw() {
  ctxbuf.fillStyle = 'black';
  ctxbuf.fillRect(0, 0, 480, 480);
  ctxbuf.drawImage(
    characterImage,
    characterPosX - characterImage.width / 2,
    characterPosY - characterImage.height / 2
  );

  ctxbuf.drawImage(
    enemyImage,
    enemyPosX - enemyImage.width / 2,
    enemyPosY - enemyImage.height / 2
  );

  ctxbuf.fillStyle = 'white';
  ctxbuf.font = '16pt Arial';
  const scoreLabel = `SCORE : ${score}`;
  const scoreLabelWidth = ctxbuf.measureText(scoreLabel).width;
  ctxbuf.fillText(scoreLabel, 460 - scoreLabelWidth, 40);

  ctx.putImageData(ctxbuf.getImageData(0, 0, 480, 480), 0, 0);
}
