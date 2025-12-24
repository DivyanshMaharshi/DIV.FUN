/* ==============================
   catsVsDogs.js — Clean Final
   (Formatting/cleanup only; logic preserved)
   ============================== */

/* ----- DOM refs ----- */
const gameArea = document.getElementById("gameArea");
const player = document.getElementById("player");
const dangerLine = document.getElementById("dangerLine");
const startBtn = document.getElementById("startBtn");
const bottomUI = document.getElementById("bottomUI");
const moneyEl = document.getElementById("money");
const timerEl = document.getElementById("timer");
const statsBox = document.querySelector(".stats");
const fireRateBtn = document.getElementById("fireRateBtn");

/* ----- SFX ----- */
const sfxPew = new Audio("../Assets/catsVsDogsAssets/pew.mp3");
const sfxHit = new Audio("../Assets/catsVsDogsAssets/hit.mp3");
const sfxBoom = new Audio("../Assets/catsVsDogsAssets/boom.mp3");

/* allow overlapping sounds (low volume) */
sfxPew.volume = 0.008;
sfxHit.volume = 0.01;
sfxBoom.volume = 0.01;

/* safety checks */
if (!gameArea || !player) {
  console.error("Missing #gameArea or #player element — JS will not run correctly.");
}

/* ----- Config / State ----- */
const DOG_TYPES = {};

let dogSpawnInterval = null;
let lastShot = 0;
let mouseDown = false;
let money = 0;
let lives = 25;
let startTime = null;
let isRunning = false;

/* upgrades / stats */
let fireRateMs = 300;     // ms per shot
let bulletRange = 600;    // px bullet can travel
let bulletDamage = 1;     // damage per bullet

let fireRateCost = 10;
let rangeUpgradeCost = 15;
let damageUpgradeCost = 20;

/* boss spawn control (seconds) */
let nextBossSpawn = 180;
let bossSpawned = false;

/* create & append lives display into stats */
const livesDisplay = document.createElement("p");
livesDisplay.style.fontSize = "18px";
livesDisplay.style.margin = "6px 0 0 0";
livesDisplay.innerText = "Lives: " + lives;
if (statsBox) statsBox.appendChild(livesDisplay);

/* sync money UI initially */
if (moneyEl) moneyEl.innerText = money;

/* ----- DOG TYPE CREATOR ----- */
function createDogType(name, data) {
  DOG_TYPES[name] = {
    speed: data.speed ?? 2,
    health: data.health ?? 2,
    reward: data.reward ?? 1,
    src: data.src,
    size: data.size ?? 80,
    behavior: data.behavior || null,
  };
}

/* ----- DOG DEFINITIONS ----- */
createDogType("normal", {
  speed: 2,
  health: 2,
  reward: 2,
  src: "../Assets/catsVsDogsAssets/normDog.png",
  size: 75,
});

createDogType("speedy", {
  speed: 4,
  health: 1,
  reward: 2,
  src: "../Assets/catsVsDogsAssets/speedDog.png",
  size: 70,
});

createDogType("tank", {
  speed: 1,
  health: 4,
  reward: 5,
  src: "../Assets/catsVsDogsAssets/tankDog.png",
  size: 110,
});

createDogType("coinDog", {
  speed: 1,
  health: 6,
  reward: 10,
  src: "../Assets/catsVsDogsAssets/coinDog.png",
  size: 90,
});

createDogType("nyanDog", {
  speed: 5,
  health: 3,
  reward: 8,
  src: "../Assets/catsVsDogsAssets/nyanDog.png",
  size: 90,
});

/* special behavior dogs */
createDogType("flyingDog", {
  speed: 2,
  health: 2,
  reward: 4,
  size: 90,
  src: "../Assets/catsVsDogsAssets/flyingDog.png",
  behavior(dog) {
    dog.style.top = "20px";
  }
});

createDogType("zigzagDog", {
  speed: 1,
  health: 3,
  reward: 3,
  size: 80,
  src: "../Assets/catsVsDogsAssets/zigzagDog.png",
  behavior(dog, tools) {
    let dir = 1;
    const id = setInterval(() => {
      let nextY = dog.offsetTop + dir * 25;
      nextY = Math.max(0, Math.min(gameArea.offsetHeight - dog.offsetHeight, nextY));
      dog.style.top = nextY + "px";
      if (nextY <= 0 || nextY >= gameArea.offsetHeight - dog.offsetHeight) dir *= -1;
    }, 200);
    tools.onCleanup(() => clearInterval(id));
  }
});

createDogType("rushDog", {
  speed: 1.5,
  health: 2,
  reward: 4,
  size: 90,
  src: "../Assets/catsVsDogsAssets/rushDog.png",
  behavior(dog, tools) {
    const id = setInterval(() => {
      dog.speed += 0.3;
    }, 500);
    tools.onCleanup(() => clearInterval(id));
  }
});

createDogType("teleportDog", {
  speed: 1,
  health: 3,
  reward: 6,
  size: 90,
  src: "../Assets/catsVsDogsAssets/teleportDog.png",
  behavior(dog, tools) {
    const id = setInterval(() => {
      dog.style.top = (Math.random() * (gameArea.offsetHeight - dog.offsetHeight)) + "px";
    }, 1000);
    tools.onCleanup(() => clearInterval(id));
  }
});

createDogType("slimeDog", {
  speed: 1.8,
  health: 5,
  reward: 6,
  size: 85,
  src: "../Assets/catsVsDogsAssets/slimeDog.png",
  behavior(dog, tools) {
    dog.onDeath = () => {
      const slime = document.createElement("img");
      slime.src = "../Assets/catsVsDogsAssets/slime.png";
      slime.className = "slimePuddle";
      slime.style.position = "absolute";
      slime.style.width = "90px";
      slime.style.left = dog.style.left;
      slime.style.top = dog.style.top;
      slime.style.opacity = "0";
      gameArea.appendChild(slime);

      requestAnimationFrame(() => {
        slime.style.transition = "opacity 0.4s";
        slime.style.opacity = "1";
      });

      const slowEffect = setInterval(() => {
        const bullets = document.querySelectorAll(".bullet");
        const S = slime.getBoundingClientRect();
        bullets.forEach(b => {
          const B = b.getBoundingClientRect();
          const overlap = !(B.right < S.left || B.left > S.right || B.bottom < S.top || B.top > S.bottom);
          if (overlap) {
            b.style.filter = "hue-rotate(90deg)";
            b.slowed = true;
          }
        });
      }, 40);

      tools.onCleanup(() => clearInterval(slowEffect));

      setTimeout(() => {
        if (slime.parentElement) slime.remove();
      }, 4000);
    };
  }
});

createDogType("stinkyDog", {
  speed: 2,
  health: 3,
  reward: 5,
  size: 90,
  src: "../Assets/catsVsDogsAssets/stinkyDog.png",
  behavior(dog, tools) {
    dog.onDeath = () => {
      const fart = document.createElement("img");
      fart.src = "../Assets/catsVsDogsAssets/fart.png";
      fart.className = "fartCloud";
      fart.style.position = "absolute";
      fart.style.width = "120px";
      fart.style.left = dog.style.left;
      fart.style.top = dog.style.top;
      fart.style.opacity = "0.3";
      gameArea.appendChild(fart);

      requestAnimationFrame(() => {
        fart.style.transition = "opacity 0.8s ease-out, transform 0.8s ease-out";
        fart.style.transform = "scale(1.8)";
        fart.style.opacity = "0.8";
      });

      document.body.style.transition = "filter 0.3s";
      document.body.style.filter = "brightness(0.6) hue-rotate(60deg)";

      setTimeout(() => {
        document.body.style.filter = "";
      }, 1500);

      setTimeout(() => {
        if (fart.parentElement) fart.remove();
      }, 1000);
    };
  }
});

createDogType("mamaDog", {
  speed: 1.6,
  health: 8,
  reward: 12,
  size: 120,
  src: "../Assets/catsVsDogsAssets/mamaDog.png",
  behavior(dog) {
    dog.onDeath = () => {
      const pupCount = Math.floor(Math.random() * 2) + 2; // 2–3 pups
      for (let i = 0; i < pupCount; i++) {
        spawnDog("pupDog", {
          overrideTop: dog.offsetTop + (Math.random() * 50 - 25),
          sharedSprite: dog.src
        });
      }
    };
  }
});

createDogType("pupDog", {
  speed: 3.5,
  health: 1,
  reward: 1,
  size: 50,
  src: "../Assets/catsVsDogsAssets/mamaDog.png",
});

createDogType("bossDog", {
  speed: 1.2,
  health: 120,
  reward: 50,
  size: 160,
  src: "../Assets/catsVsDogsAssets/bossDog.png",

  behavior(dog) {
    // 1) Slow speed ramps over time
    const speedInterval = setInterval(() => {
      dog.speed += 0.15;
      if (!dog.parentElement) clearInterval(speedInterval);
    }, 500);

    // 2) Shoots pupDog every 3 seconds
    const spawnInterval = setInterval(() => {
      if (!dog.parentElement) {
        clearInterval(spawnInterval);
        return;
      }
      spawnDog("pupDog");
    }, 3000);

    // 3) Teleports randomly (every 1.7 sec)
    const tpInterval = setInterval(() => {
      if (!dog.parentElement) {
        clearInterval(tpInterval);
        return;
      }
      dog.style.top = Math.random() * (gameArea.offsetHeight - dog.offsetHeight) + "px";
    }, 1700);
  }
});


/* ----- START BUTTON ----- */
startBtn.addEventListener("click", () => {
  startBtn.classList.add("hidden");
  bottomUI.classList.remove("hidden");

  startTime = Date.now();
  isRunning = true;

  player.style.top =
    Math.max(10, gameArea.offsetHeight / 2 - player.offsetHeight / 2) + "px";
  playerY = player.offsetTop;

  startSpawningDogs();
});

/* ----- DOG SPAWNING & MOVEMENT ----- */
function spawnDog(typeName, options = {}) {
  const info = DOG_TYPES[typeName];
  if (!info) return console.error("Unknown dog type:", typeName);

  const dog = document.createElement("img");
  dog.classList.add("enemy");

  dog.src = options.sharedSprite || info.src;
  dog.health = info.health;
  dog.speed = info.speed;
  dog.reward = info.reward;

  dog.style.position = "absolute";
  dog.style.width = info.size + "px";
  dog.hasDamaged = false;

  dog.style.top =
    options.overrideTop !== undefined
      ? options.overrideTop + "px"
      : Math.random() * (gameArea.offsetHeight - info.size) + "px";

  dog.style.left = gameArea.offsetWidth + 20 + "px";

  dog._cleanupTasks = [];

  gameArea.appendChild(dog);

  function runBehavior() {
    if (info.behavior) {
      try {
        info.behavior(dog, {
          onCleanup(fn) {
            if (typeof fn === "function") dog._cleanupTasks.push(fn);
          }
        });
      } catch (err) {
        console.error("Dog behavior error for", typeName, err);
      }
    }
    moveDog(dog);
  }

  if (dog.complete) {
    requestAnimationFrame(runBehavior);
  } else {
    dog.addEventListener("load", () => requestAnimationFrame(runBehavior), { once: true });
    setTimeout(() => {
      if (!dog._behaviorStarted) {
        dog._behaviorStarted = true;
        runBehavior();
      }
    }, 300);
  }
}

function cleanupDog(dog) {
  if (dog._cleanupTasks && dog._cleanupTasks.length) {
    dog._cleanupTasks.forEach(fn => {
      try { fn(); } catch (e) { console.warn("cleanup error", e); }
    });
    dog._cleanupTasks = [];
  }
}

function moveDog(dog) {
  function step() {
    if (dog.isDead) return;
    const currentLeft = parseFloat(dog.style.left) || 0;
    const nextLeft = currentLeft - dog.speed;
    dog.style.left = nextLeft + "px";

    //const dogRect = dog.getBoundingClientRect();
    //const dangerRect = dangerLine.getBoundingClientRect();

    // DOG HAS ENTERED THE RED ZONE
    if (nextLeft <= 6) {       // because your dangerLine width = 6px
    if (!dog.hasDamaged) {
        dog.hasDamaged = true;
        lives--;
        livesDisplay.innerText = "Lives: " + lives;

        if (lives <= 0) {
            clearInterval(dogSpawnInterval);
            alert("GAME OVER! Cats got cooked 💀😿");
            location.reload();
        }
      }
      dog.remove();
      return;
    }

    if (nextLeft + dog.offsetWidth < 0) {
      cleanupDog(dog);
      if (dog.parentElement) dog.remove();
      return;
    }

    dog._raf = requestAnimationFrame(step);
  }

  dog._raf = requestAnimationFrame(step);
}

function startSpawningDogs() {
  if (dogSpawnInterval !== null) return;

  // NORMAL DOG SPAWNS
  dogSpawnInterval = setInterval(() => {
    if (!isRunning) return;
    spawnDog(getRandomDogType());
  }, 2000);

  // BOSS SPAWN — after 120 seconds (2 minutes)
  setTimeout(() => {
    if (!bossSpawned && isRunning) {
      bossSpawned = true;
      spawnDog("bossDog");
      console.log("🔥 BOSS DOG ENTERS THE BATTLEFIELD 🔥");
    }
  }, 120000); // 120,000 ms = 2 minutes
}


function getRandomDogType() {
  const keys = Object.keys(DOG_TYPES).filter(name => name !== "bossDog");
  return keys[Math.floor(Math.random() * keys.length)];
}

/* ----- PLAYER MOVEMENT (smooth via RAF loop) ----- */
let playerY = 0;
const moveSpeed = 220;
const keys = { up: false, down: false };

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp" || e.key === "w") keys.up = true;
  if (e.key === "ArrowDown" || e.key === "s") keys.down = true;
});

window.addEventListener("keyup", (e) => {
  if (e.key === "ArrowUp" || e.key === "w") keys.up = false;
  if (e.key === "ArrowDown" || e.key === "s") keys.down = false;
});

let lastFrameTime = performance.now();

function playerLoop(now) {
  const dt = Math.min(60, now - lastFrameTime) / 1000;
  lastFrameTime = now;

  if (keys.up) playerY -= moveSpeed * dt;
  if (keys.down) playerY += moveSpeed * dt;

  const minY = 0;
  const maxY = gameArea.offsetHeight - player.offsetHeight;

  playerY = Math.max(minY, Math.min(maxY, playerY));
  player.style.top = playerY + "px";

  const timeSurvived = ((Date.now() - startTime) / 1000).toFixed(1);
  if (timerEl) timerEl.textContent = `${timeSurvived} s`;

  requestAnimationFrame(playerLoop);
}

playerY = player.offsetTop || 20;
requestAnimationFrame(playerLoop);

/* ----- SHOOTING: click, hold, space ----- */
let lastShotTime = 0;

gameArea.addEventListener("click", () => shoot());
gameArea.addEventListener("mousedown", () => (mouseDown = true));
window.addEventListener("mouseup", () => (mouseDown = false));

window.addEventListener("keydown", (e) => {
  if (e.code === "Space") shoot();
});

function shoot() {
  const now = performance.now();
  if (now - lastShotTime < fireRateMs) return;

  lastShotTime = now;

  const bullet = document.createElement("img");
  bullet.src = "../Assets/catsVsDogsAssets/bullet.png";
  bullet.classList.add("bullet");
  bullet.style.position = "absolute";

  gameArea.appendChild(bullet);

  sfxPew.currentTime = 0;
  sfxPew.play();

  const left = player.offsetLeft + player.offsetWidth;
  const top = player.offsetTop + player.offsetHeight / 2 - 10;

  bullet.style.left = left + "px";
  bullet.style.top = top + "px";
  bullet.startX = left;

  flashPlayer();
  moveBullet(bullet);
}

function autoFireLoop() {
  if (mouseDown) shoot();
  requestAnimationFrame(autoFireLoop);
}
requestAnimationFrame(autoFireLoop);

/* ----- BULLETS: movement, collision, money ----- */
function moveBullet(bullet) {
  const speed = 12;
  const startX = bullet.startX || 0;

  function step() {
    const cur = parseFloat(bullet.style.left) || 0;
    const next = cur + speed;

    bullet.style.left = next + "px";

    const dogs = Array.from(document.querySelectorAll(".enemy"));

    for (const dog of dogs) {
      if (isColliding(bullet, dog)) {
        dog.health -= bulletDamage;

        sfxHit.currentTime = 0;
        sfxHit.play();

        if (bullet.parentElement) bullet.remove();

        if (dog.health <= 0) {
          sfxBoom.currentTime = 0;
          sfxBoom.play();

          if (dog.onDeath) {
            try { dog.onDeath(); } catch (e) { console.warn("onDeath error", e); }
          }

          cleanupDog(dog);

          if (dog._raf) cancelAnimationFrame(dog._raf);
          if (dog.parentElement) dog.remove();
          dog.isDead = true;

          money += dog.reward || 2;
          if (moneyEl) moneyEl.innerText = money;

          const px = parseFloat(dog.style.left) || 0;
          const py = parseFloat(dog.style.top) || 0;
          spawnPoof(px, py);
        }
        return;
      }
    }

    if (next - startX > bulletRange) {
      if (bullet.parentElement) bullet.remove();
      return;
    }

    requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

/* ----- COLLISION HELPER ----- */
function isColliding(a, b) {
  const A = a.getBoundingClientRect();
  const B = b.getBoundingClientRect();

  return !(
    A.right < B.left ||
    A.left > B.right ||
    A.bottom < B.top ||
    A.top > B.bottom
  );
}

/* ----- EFFECTS (poof + screen shake) ----- */
function spawnPoof(x, y) {
  const p = document.createElement("div");
  p.className = "poof";

  p.style.left = parseFloat(x) + "px";
  p.style.top = parseFloat(y) + "px";

  p.style.transform = "scale(0.4)";
  p.style.opacity = "0";

  gameArea.appendChild(p);

  requestAnimationFrame(() => {
    p.style.transition = "transform 0.25s ease-out, opacity 0.25s ease-out";
    p.style.transform = "scale(1.2)";
    p.style.opacity = "1";
  });

  setTimeout(() => {
    p.style.transform = "scale(1.6)";
    p.style.opacity = "0";
  }, 200);

  setTimeout(() => {
    if (p.parentElement) p.remove();
  }, 400);
}

function screenShake() {
  gameArea.style.transition = "transform 0.08s";
  gameArea.style.transform = "translateX(-6px)";

  setTimeout(() => {
    gameArea.style.transform = "";
  }, 80);
}

function flashPlayer() {
  player.style.transition = "filter 0.06s";
  player.style.filter = "brightness(1.8)";

  setTimeout(() => {
    player.style.filter = "";
  }, 60);
}

/* ----- UPGRADES ----- */
if (fireRateBtn) {
  fireRateBtn.innerText = `Upgrade Fire Rate (Cost: ${fireRateCost})`;
  fireRateBtn.addEventListener("click", () => {
    if (money < fireRateCost) {
      fireRateBtn.style.transform = "translateY(-3px)";
      setTimeout(() => { fireRateBtn.style.transform = ""; }, 120);
      return;
    }

    money -= fireRateCost;
    if (moneyEl) moneyEl.innerText = money;

    fireRateMs = Math.max(80, fireRateMs - 60);
    fireRateCost = Math.round(fireRateCost * 1.7);

    fireRateBtn.innerText = `Upgrade Fire Rate (Cost: ${fireRateCost})`;
  });
}

const rangeBtn = document.getElementById("rangeBtn");
if (rangeBtn) {
  rangeBtn.addEventListener("click", () => {
    if (money < rangeUpgradeCost) return;

    money -= rangeUpgradeCost;
    if (moneyEl) moneyEl.innerText = money;

    bulletRange += 120;
    rangeUpgradeCost = Math.round(rangeUpgradeCost * 1.65);

    rangeBtn.innerText = `Upgrade Range (Cost: ${rangeUpgradeCost})`;
  });
}

const damageBtn = document.getElementById("damageBtn");
if (damageBtn) {
  damageBtn.addEventListener("click", () => {
    if (money < damageUpgradeCost) return;

    money -= damageUpgradeCost;
    if (moneyEl) moneyEl.innerText = money;

    bulletDamage += 1;
    damageUpgradeCost = Math.round(damageUpgradeCost * 1.8);

    damageBtn.innerText = `Upgrade Damage (Cost: ${damageUpgradeCost})`;
  });
}

/* ===== End of file ===== */
