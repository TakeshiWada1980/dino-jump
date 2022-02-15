
var canvas, ctx, ctxbuf;
var characterPosX, characterPosY;
var characterImage;
var speed = 0;
var acceleration = 0;
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
    characterPosY = characterInitPosY = 400;
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
  ctx.putImageData(ctxbuf.getImageData(0, 0, 480, 480), 0, 0);
}
