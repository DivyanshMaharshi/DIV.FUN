const parts = {
  body: { index: 1, max: 5 },
  head: { index: 1, max: 5 },
  eyes: { index: 1, max: 5 },
  mouth:{ index: 1, max: 5 },
  extra:{ index: 1, max: 5 }
};

function updatePart(part) {
  const img = document.querySelector(
    `.layer[src*="/${capitalize(part)}/"]`
  );

  if (!img) return;

  img.src = `../Assets/makeAMonsterAssets/${capitalize(part)}/${parts[part].index}.png`;
}

document.querySelectorAll('button[data-part]').forEach(btn => {
  btn.addEventListener('click', () => {
    const part = btn.dataset.part;
    const dir = Number(btn.dataset.dir);

    parts[part].index += dir;

    if (parts[part].index < 1) parts[part].index = parts[part].max;
    if (parts[part].index > parts[part].max) parts[part].index = 1;

    updatePart(part);
  });
});

// 🎲 RANDOM MONSTER
document.querySelector('.randomBtn').addEventListener('click', () => {
  for (let part in parts) {
    parts[part].index =
      Math.floor(Math.random() * parts[part].max) + 1;
    updatePart(part);
  }
});

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const SAVE_KEY = "mam_monsters";

const collectionContainer = document.getElementById("monsterCollection");

const nameInput = document.getElementById("monsterNameInput");
const saveBtn = document.getElementById("saveMonsterBtn");
const shareBtn = document.getElementById("shareMonsterBtn");

/* ---------- SAVE ---------- */
saveBtn.addEventListener("click", () => {
  const name = nameInput.value.trim();

  if (!name) {
    nameInput.classList.add("inputError");
    nameInput.focus();
    return;
  }

  const monsters = loadMonsters();

  monsters.push({
    name,
    body: parts.body.index,
    head: parts.head.index,
    eyes: parts.eyes.index,
    mouth: parts.mouth.index,
    extra: parts.extra.index
  });

  localStorage.setItem(SAVE_KEY, JSON.stringify(monsters));

  nameInput.value = "";
  nameInput.classList.remove("inputError");

  renderCollection();
});

/* ---------- LOAD ---------- */
function loadMonsters() {
  return JSON.parse(localStorage.getItem(SAVE_KEY)) || [];
}

/* ---------- APPLY ---------- */
function applyMonster(data) {
  ["body", "head", "eyes", "mouth", "extra"].forEach(part => {
    if (data[part] !== undefined) {
      parts[part].index = data[part];
      updatePart(part);
    }
  });

  if (data.name) {
    nameInput.value = data.name;
  }
}


/* ---------- RENDER COLLECTION ---------- */
function renderCollection() {
  const monsters = loadMonsters();
  collectionContainer.innerHTML = "";

  if (monsters.length === 0) {
    collectionContainer.innerHTML = `<p class="emptyCollection">
      No monsters yet 👀<br>Save one to see it here.
    </p>`;
    return;
  }

  monsters.forEach((monster, i) => {
    const card = document.createElement("div");
    card.className = "monsterCard";

    card.innerHTML = `
    <div class="monsterThumb">
    <img src="../Assets/makeAMonsterAssets/Head/${monster.head}.png">
    <img src="../Assets/makeAMonsterAssets/Body/${monster.body}.png">
    <img src="../Assets/makeAMonsterAssets/Eyes/${monster.eyes}.png">
    <img src="../Assets/makeAMonsterAssets/Mouth/${monster.mouth}.png">
    <img src="../Assets/makeAMonsterAssets/Extra/${monster.extra}.png">
    </div>
    <div class="monsterInfo">
    <p class="monsterName">${monster.name}</p>
    <p class="monsterMeta">Click to edit</p>
    </div>
`;

    card.addEventListener("click", () => applyMonster(monster));
    collectionContainer.appendChild(card);
  });
}

function getImgMap() {
  return {
    body: document.querySelector('.layer[src*="/Body/"]'),
    head: document.querySelector('.layer[src*="/Head/"]'),
    eyes: document.querySelector('.layer[src*="/Eyes/"]'),
    mouth: document.querySelector('.layer[src*="/Mouth/"]'),
    extra: document.querySelector('.layer[src*="/Extra/"]')
  };
}


/* ---------- EXPORT PNG ---------- */
function exportPNG() {
  const stage = document.querySelector(".monsterStage");
  const canvas = document.createElement("canvas");
  canvas.width = 408;
  canvas.height = 612;
  const ctx = canvas.getContext("2d");

  const layers = stage.querySelectorAll("img");
  let loaded = 0;

  layers.forEach(img => {
    const i = new Image();
    i.crossOrigin = "anonymous"; // 🔥 THIS LINE SAVES LIVES
    i.src = img.src;

    i.onload = () => {
      ctx.drawImage(i, 0, 0, 408, 612);
      loaded++;
      if (loaded === layers.length) {
        const a = document.createElement("a");
        a.href = canvas.toDataURL("image/png");
        const safeName = (nameInput.value || "my-monster")
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();

        a.download = `${safeName}.png`;
        a.click();
      }
    };
  });
}

/* ---------- SHARE ---------- */
shareBtn.addEventListener("click", () => {
  const name = nameInput.value.trim() || "My Monster";

  const data = btoa(JSON.stringify({
    name,
    body: parts.body.index,
    head: parts.head.index,
    eyes: parts.eyes.index,
    mouth: parts.mouth.index,
    extra: parts.extra.index
  }));

  const url = `${location.origin}${location.pathname}?monster=${data}`;
  navigator.clipboard.writeText(url);

  shareBtn.textContent = "Copied!";
  setTimeout(() => (shareBtn.textContent = "Share"), 1200);
});

/* ---------- LOAD FROM SHARE LINK ---------- */
const params = new URLSearchParams(window.location.search);
const shared = params.get("monster");
const previewTitle = document.getElementById("previewTitle");

if (shared) {
  try {
    const data = JSON.parse(atob(shared));
    applyMonster(data);
    nameInput.value = data.name || "";

    // 👑 THIS LINE
    previewTitle.textContent = "MY MONSTER";

  } catch (e) {
    console.warn("Invalid monster link");
  }
}


/* ---------- INIT ---------- */
renderCollection();
