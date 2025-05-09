const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const levelEl = document.getElementById("level");
const shotsEl = document.getElementById("shots");
const backgroundImage = new Image();
backgroundImage.src = "haikei.png";
const player = {
  x: canvas.width / 2,
  y: canvas.height - 60,
  width: 20,
  height: 20,
  speed: 5,
  color: "lime",
  canMove: true
};

let bullets = [];
let playerShots = [];
let score = 0;
let level = 1;
let bombs = []; // 爆弾用配列
let shotCooldown = 0; // 弾連射制限用
let shotCount = 0; // 連続発射数
let gameOver = false; // ゲームオーバー状態を示すフラグ

function createBullet() {
  const baseCount = 5 + Math.floor(level * 0.8);
  const bulletWidth = 20;
  for (let i = 0; i < baseCount; i++) {
    const x = Math.random() * (canvas.width - bulletWidth);
    const typeRoll = Math.random();
    
    // 縦スピードをランダムに設定（速さはレベルによって増加）
    const vy = 1.5 + Math.random() * (1 + level * 0.2);
    
    if (typeRoll < 0.8 - level * 0.01) {
      bullets.push({ x: x, y: 0, width: bulletWidth, height: 20, vy: vy, color: "yellow" });
    } else {
      bullets.push({
        x: x,
        y: 0,
        width: bulletWidth,
        height: 20,
        vy: vy,
        vx: Math.random() * 2 - 1,
        angle: 0,
        curve: true,
        color: "orange"
      });
    }
  }

  // レア爆弾生成（5%の確率）
  if (Math.random() < 0.05) {
    const bx = Math.random() * (canvas.width - 30);
    bombs.push({ x: bx, y: 0, width: 30, height: 30, vy: 1.5 + level * 0.2, color: "purple", blink: true });
  }
}

function drawPlayer() {
  ctx.fillStyle = player.color;
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(player.x - 10, player.y + 20);
  ctx.lineTo(player.x + 10, player.y + 20);
  ctx.closePath();
  ctx.fill();
}

function drawBullets() {
  bullets.forEach(b => {
    ctx.fillStyle = b.color;
    if (b.curve) {
      // インベーダ風：中央の円と左右に小さな円
      ctx.beginPath();
      ctx.arc(b.x + b.width / 2, b.y + b.height / 2, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(b.x + 5, b.y + b.height / 2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(b.x + b.width - 5, b.y + b.height / 2, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(b.x, b.y, b.width, b.height);
    }
  });
}

function drawBombs() {
  bombs.forEach((b, index) => {
    if (b.blink && frame % 30 < 15) {
      ctx.fillStyle = "#ff00ff"; // チカチカカラー1
    } else {
      ctx.fillStyle = b.color; // 元の色
    }
    ctx.beginPath();
    ctx.arc(b.x + b.width / 2, b.y + b.height / 2, b.width / 2, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawPlayerShots() {
  playerShots.forEach(s => {
    ctx.fillStyle = s.color || "red";
    ctx.fillRect(s.x, s.y, s.width, s.height);
  });
}

function updateBullets() {
  bullets.forEach(b => {
    if (b.curve) {
      b.angle += 0.1;
      b.x += Math.sin(b.angle) * 2 + b.vx;
    }
    b.y += b.vy;
  });
  bullets = bullets.filter(b => b.y < canvas.height && b.x > -b.width && b.x < canvas.width);
}

function updateBombs() {
  bombs.forEach(b => b.y += b.vy);
  bombs = bombs.filter(b => b.y < canvas.height);
}

function updatePlayerShots() {
  playerShots.forEach(s => {
    s.y -= s.speed;
    if (s.vx) s.x += s.vx;
  });
  playerShots = playerShots.filter(s => s.y > 0 && s.x > 0 && s.x < canvas.width);
}

function handleShotCollision() {
  // 敵弾との衝突処理
  for (let i = bullets.length - 1; i >= 0; i--) {
    for (let j = playerShots.length - 1; j >= 0; j--) {
      if (checkCollision(bullets[i], playerShots[j])) {
        bullets.splice(i, 1);
        playerShots.splice(j, 1);
        score++;
        updateLevel();
        return;
      }
    }
  }

  // 爆弾との衝突処理
  for (let i = bombs.length - 1; i >= 0; i--) {
    for (let j = playerShots.length - 1; j >= 0; j--) {
      if (checkCollision(bombs[i], playerShots[j])) {
        bombs.splice(i, 1);  // 爆弾を破壊
        playerShots.splice(j, 1);  // 発射した弾を消去
        score += 10;

        // 破壊した敵弾をすべて消去
        const destroyed = bullets.length;
        bullets = [];  // 全弾破壊
        score += destroyed;  // 破壊した弾数分スコア加算
        updateLevel();
        return;
      }
    }
  }
}

function checkCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function handleCollision() {
  for (let b of bullets) {
    if (checkCollision(player, b)) {
      gameOver = true;  // ゲームオーバー
      alert("ゲームオーバー\nスコア: " + score);
      document.location.reload();
      break;
    }
  }
}

function movePlayer() {
  if (!player.canMove || gameOver) return;
  if (keys["ArrowLeft"] && player.x - 10 > 0) player.x -= player.speed;
  if (keys["ArrowRight"] && player.x + 10 < canvas.width) player.x += player.speed;
  if (keys["ArrowUp"] && player.y > 0) player.y -= player.speed;
  if (keys["ArrowDown"] && player.y + 20 < canvas.height) player.y += player.speed;
}

const keys = {};
document.addEventListener("keydown", e => {
  keys[e.key] = true;
});

document.addEventListener("keyup", e => {
  keys[e.key] = false;
  if (e.key === " ") {
    shotCount = 0; // スペースキーを離したらカウントリセット
  }
});

function shoot() {
  if (shotCooldown > 0) return;
  if (shotCount >= 3) return; // 最大3発まで

  const shotLevel = Math.min(Math.floor(level / 5), 9);
  const shotPatterns = [
    [0],
    [0],
    [-5, 5],
    [-5, 0, 5],
    [-7, -3, 3, 7],
    [-10, -5, 0, 5, 10],
    [-12, -6, 0, 6, 12],
    [-15, -7, -3, 3, 7, 15],
    [-20, -10, -5, 0, 5, 10, 20],
    [-25, -15, -5, 0, 5, 15, 25]
  ];

  const angles = shotPatterns[shotLevel];
  angles.forEach(offsetX => {
    playerShots.push({
      x: player.x - 5,
      y: player.y,
      width: 10,
      height: 20,
      speed: 8,
      vx: offsetX * 0.1,
      color: "red"
    });
  });

  shotCount++;
  shotCooldown = 5; // 少し待ってから次の発射を許可
}

function updateLevel() {
  const newLevel = Math.min(Math.floor(score / 10) + 1, 50);
  if (newLevel !== level) {
    level = newLevel;
    levelEl.textContent = level;
  }
  
  if (level >= 50) {
    gameOver = true; // レベル50でゲームクリア
    alert("ゲームクリア!\nスコア: " + score);
    document.location.reload();
  }
}

let frame = 0;
function gameLoop() {
  if (backgroundImage.complete) {
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // 読み込み前は白背景
  }

  movePlayer();
  drawPlayer();

  if (frame % 45 === 0) createBullet();
  updateBullets();
  drawBullets();

  updateBombs();
  drawBombs();

  if (keys[" "]) shoot();
  updatePlayerShots();
  drawPlayerShots();
  handleShotCollision();
  handleCollision();

  if (shotCooldown > 0) shotCooldown--;

  shotsEl.textContent = score;
  frame++;
  requestAnimationFrame(gameLoop);
}


gameLoop();
