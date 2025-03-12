var canvas, ctx;
var width, height, birdPos;
var sky, land, bird, pipe, pipeUp, pipeDown, scoreBoard, ready, splash;
var dist, birdY, birdF, birdN, birdV;
var animation, death, deathAnim;
var pipes = [],
  pipesDir = [],
  pipeSt,
  pipeNumber;
var maxScore;
var dropSpeed;
var flashlight_switch = false,
  hidden_switch = false;
var mode, delta;
var playend = false,
  playdata = [];
var difficultyIncrease;
var lastScoreMilestone = 0;
var jumpSound = new Audio("sounds/jump.mp3");
var hitSound = new Audio("sounds/hit.mp3");
var bgMusic = new Audio("sounds/background.mp3");
window.score = 0;
bgMusic.loop = true;
bgMusic.volume = 0.5;

sky = new Image();
sky.src = "images/sky.png";
var clearCanvas = function () {
  ctx.fillStyle = "";
  ctx.fillRect(0, 0, width, height);
};

var loadImages = function () {
  var imgNumber = 9,
    imgComplete = 0;
  var onImgLoad = function () {
    imgComplete++;
    if (imgComplete == imgNumber) {
      death = 1;
      dist = 0;
      birdY = (height - 112) / 2;
      birdF = 0;
      birdN = 0;
      birdV = 0;
      birdPos = width * 0.35;
      score = 0;
      pipeSt = 0;
      pipeNumber = 10;
      pipes = [];
      pipesDir = [];
      for (var i = 0; i < 10; ++i) {
        pipes.push(Math.floor(Math.random() * (height - 300 - delta) + 10));
        pipesDir.push(Math.random() > 0.5);
      }
      drawCanvas();
    }
  };
  sky = new Image();
  sky.src = "images/sky.png";
  sky.onload = onImgLoad;
  land = new Image();
  land.src = "images/land.png";
  land.onload = onImgLoad;

  bird = new Image();
  bird.src = "images/bird.png";
  bird.onload = onImgLoad;

  pipe = new Image();
  pipe.src = "images/pipe.png";
  pipe.onload = onImgLoad;

  pipeUp = new Image();
  pipeUp.src = "images/pipe-up.png";
  pipeUp.onload = onImgLoad;

  pipeDown = new Image();
  pipeDown.src = "images/pipe-down.png";
  pipeDown.onload = onImgLoad;

  scoreBoard = new Image();
  scoreBoard.src = "images/scoreboard.png";
  scoreBoard.onload = onImgLoad;

  ready = new Image();
  ready.src = "images/replay.png";
  ready.onload = onImgLoad;

  splash = new Image();
  splash.src = "images/splash.png";
  splash.onload = onImgLoad;
};

function is_touch_device() {
  try {
    document.createEvent("TouchEvent");
    return true;
  } catch (e) {
    return false;
  }
}

var initCanvas = function () {
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");

  canvas.width = width = window.innerWidth;
  canvas.height = height = window.innerHeight;
  if (is_touch_device()) {
    // bgMusic.play();

    canvas.addEventListener(
      "touchend",
      function (e) {
        e.preventDefault();
      },
      false
    );
    canvas.addEventListener(
      "touchstart",
      function (e) {
        jump();
        e.preventDefault();
      },
      false
    );
  } else {
    canvas.onmousedown = jump;
  }
  window.onkeydown = jump;
  clearInterval(difficultyIncrease);
  difficultyIncrease = setInterval(() => {
    if (score > lastScoreMilestone) {
      lastScoreMilestone = score;
      if (dropSpeed < 0.5) {
        dropSpeed *= 1.05;
      }
      if (delta > 50) {
        delta *= 0.95;
      }
    }
  }, 5000);
  FastClick.attach(canvas);
  loadImages();
};

function showScoreModal() {
  dropSpeed = 0.3;
  delta = 100;
  isShowSubmitForm = true;
  document.getElementById("scoreModal").style.display = "flex";
  bgMusic.pause();

  // 🛑 Dừng tăng độ khó khi game kết thúc
  clearInterval(difficultyIncrease);
}

// Gửi điểm lên Firebase

var deathAnimation = function () {
  if (splash) {
    ctx.drawImage(splash, width / 2 - 94, height / 2 - 54);
    splash = undefined;
  } else {
    ctx.drawImage(scoreBoard, width / 2 - 118, height / 2 - 54);
    playend = true;
    playdata = [mode, score];
    if (window.window.WeixinApi && window.WeixinJSBridge) {
    }
  }
  ctx.drawImage(ready, width / 2 - 57, height / 2 + 10);
  maxScore = Math.max(maxScore, score);
};

var drawSky = function () {
  var isMobile = width < 768;
  var scale = isMobile ? 0.5 : 0.8;

  var imgRatio = sky.width / sky.height;
  var canvasRatio = width / height;

  if (imgRatio > canvasRatio) {
    var newWidth = height * imgRatio * scale;
    var offsetX = (width - newWidth) / 2;
    ctx.drawImage(sky, offsetX, isMobile ? 100 : 0, newWidth, height * scale);
  } else {
    var newHeight = (width / imgRatio) * scale;
    var offsetY = (height - newHeight) / 2;
    ctx.drawImage(sky, isMobile ? 0 : 200, offsetY, width * scale, newHeight);
  }
};

var drawLand = function () {
  var totWidth = -dist;
  while (totWidth < width) {
    ctx.drawImage(land, totWidth, height - 112);
    totWidth += land.width;
  }
  dist = dist + 2;
  var tmp = Math.floor(dist - width * 0.65) % 220;
  if (dist >= width * 0.65 && Math.abs(tmp) <= 1) {
    score++;
  }
};

var drawBird = function () {
  ctx.drawImage(
    bird,
    0,
    birdN * 24,
    bird.width,
    bird.height,
    birdPos,
    birdY,
    bird.width,
    bird.height
  );

  birdY -= birdV;
  birdV -= dropSpeed;
  if (birdY + 138 > height) {
    clearInterval(animation);
    death = 1;
    hitSound.play();
    bgMusic.pause();
    bgMusic.currentTime = 0;
    showScoreModal();
  }
  if (death) deathAnimation();
};

var drawPipe = function (x, y) {
  ctx.drawImage(pipe, x, 0, pipe.width, y);
  ctx.drawImage(pipeDown, x, y);
  ctx.drawImage(pipe, x, y + 168 + delta, pipe.width, height - 112);
  ctx.drawImage(pipeUp, x, y + 144 + delta);
  if (
    x < birdPos + 32 &&
    x + 50 > birdPos &&
    (birdY < y + 22 || birdY + 22 > y + 144 + delta)
  ) {
    clearInterval(animation);
    death = 1;
    showScoreModal();
  } else if (x + 40 < 0) {
    pipeSt++;
    pipeNumber++;
    pipes.push(Math.floor(Math.random() * (height - 300 - delta) + 10));
    pipesDir.push(Math.random() > 0.5);
  }
};
var drawScore = function () {
  ctx.font = '50px "Press Start 2P"';
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#fff";
  ctx.fillStyle = "#000";
  var txt = "" + score;
  ctx.strokeText(
    txt,
    50,
    80,
    (width - ctx.measureText(txt).width) / 2,
    height * 0.15
  );
  ctx.fillText(
    txt,
    50,
    80,
    (width - ctx.measureText(txt).width) / 2,
    height * 0.15
  );
};

var drawShadow = function () {
  var left_shadow =
    "linear, " +
    ((width * 0.35 - 170) / width) * 100 +
    "% 0, " +
    ((width * 0.35 + 60) / width) * 100 +
    "% 0, from(black), to(rgba(0,0,0,0))";
  var right_shadow =
    "linear, " +
    ((width * 0.35 + 190) / width) * 100 +
    "% 0, " +
    ((width * 0.35 - 30) / width) * 100 +
    "% 0, from(black), to(rgba(0,0,0,0))";
  var grd = ctx.createLinearGradient(
    width * 0.35 - 170,
    0,
    width * 0.35 + 60,
    0
  );
  grd.addColorStop(0, "black");
  grd.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = grd;
  ctx.fillRect(width * 0.35 - 170, 0, 230, height);
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, width * 0.35 - 170, height);
  grd = ctx.createLinearGradient(width * 0.35 - 30, 0, width * 0.35 + 190, 0);
  grd.addColorStop(0, "rgba(0, 0, 0, 0)");
  grd.addColorStop(1, "black");
  ctx.fillStyle = grd;
  ctx.fillRect(width * 0.35 - 30, 0, 220, height);
  ctx.fillStyle = "black";
  ctx.fillRect(width * 0.35 + 190, 0, width * 0.65 - 190, height);
};

var drawHidden = function () {
  ctx.fillStyle = "black";
  ctx.fillRect(width * 0.35, 30, 300, height - 180);
};

var drawCanvas = function () {
  clearCanvas();
  drawSky();
  for (var i = pipeSt; i < pipeNumber; ++i) {
    drawPipe(width - dist + i * 220, pipes[i]);
    if (mode == 2) {
      if (pipesDir[i]) {
        if (pipes[i] + 1 > height - 300) {
          pipesDir[i] = !pipesDir[i];
          pipes[i] -= 1;
        } else pipes[i] += 1;
      } else {
        if (pipes[i] - 1 < 10) {
          pipesDir[i] = !pipesDir[i];
          pipes[i] += 1;
        } else pipes[i] -= 1;
      }
    }
  }
  drawLand();
  if (flashlight_switch) drawShadow();
  else if (hidden_switch) drawHidden();
  drawBird();
  drawScore();
};

var anim = function () {
  animation = setInterval(drawCanvas, 1000 / 60);
};

var jump = function () {
  if (isShowSubmitForm == true) {
    return;
  }
  if (death) {
    dist = 0;
    birdY = (height - 112) / 2;
    birdF = 0;
    birdN = 0;
    birdV = 0;
    death = 0;
    score = 0;
    birdPos = width * 0.35;
    pipeSt = 0;
    pipeNumber = 10;
    pipes = [];
    pipesDir = [];
    dropSpeed = 0.3;
    delta = 100;
    lastScoreMilestone = 0;

    for (var i = 0; i < 10; ++i) {
      pipes.push(Math.floor(Math.random() * (height - 300 - delta) + 10));
      pipesDir.push(Math.random() > 0.5);
    }

    anim();
  }
  bgMusic.play();

  jumpSound.currentTime = 0;
  jumpSound.play();
  birdV = 6;
};

window.onload = function () {
  mode = 0;
  score = 0;
  playdata = [0, 0];
  maxScore = 0;
  dropSpeed = 0.3;
  delta = 100;

  initCanvas();

  window.onresize = function () {
    canvas.width = width = window.innerWidth;
    canvas.height = height = window.innerHeight;
    drawCanvas();
  };
};
