function checkOrientation() {
  const isPortrait = window.innerHeight > window.innerWidth
  document.getElementById("rotateOverlay").style.display =
    isPortrait ? "flex" : "none"
}

window.addEventListener("resize", checkOrientation)
window.addEventListener("orientationchange", checkOrientation)
checkOrientation()

// ================================
// SUPABASE SETUP
// ================================
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://afhclxrwgqmekgzkouii.supabase.co";
const supabaseKey = "sb_publishable_7X84ypm22RYajJVMFThX3g_LC_6J2rW";

const supabase = createClient(supabaseUrl, supabaseKey);


// ================================
// DOM REFERENCES
// ================================
const memeGrid = document.getElementById("memeGrid");

const createOverlay = document.getElementById("createOverlay");
const createButton = document.getElementById("createButton");
const closeBtn = document.getElementById("closeBtn");

let paymentInterval = null;
let isPaying = false;
const cartCount = document.getElementById("cartCount");
const cartBtn = document.getElementById("cart");
const checkoutOverlay = document.getElementById("checkoutOverlay");
const checkoutList = document.getElementById("checkoutList");
const checkoutBtn = document.getElementById("checkoutBtn");
const bankText = document.getElementById("bankText");
const progressBar = document.getElementById("bankBar"); 

const submitBtn = document.getElementById("submitBtn");
const modal = document.getElementById("createModal");

const nameInput = document.getElementById("nameInput");
const textInput = document.getElementById("textInput");
const costInput = document.getElementById("costInput");
const categorySelect = document.getElementById("categorySelect");

let cart = [];

// ================================
// CONSTANTS
// ================================
const emojiData = new Map([
    ["funny", "😂"],
    ["pain", "💀"],
    ["brain", "🤯"],
    ["hot-take", "🔥"],
    ["sarcasm", "🙃"],
    ["overwhelmed", "🫠"],
    ["awkward", "😬"],
    ["cringe", "🤡"],
    ["lying", "🧢"],
    ["slay", "💅"],
    ["tired", "🫩"],
    ["gossip", "☕"],
    ["caution", "🚩"]
]);


// ================================
// UI HELPERS
// ================================
function shakeModal() {
    modal.classList.remove("shake");
    void modal.offsetWidth; // force reflow 🔥
    modal.classList.add("shake");
}

function popSubmit() {

    confetti({
        particleCount: 200,
        angle: 60,
        spread: 80,
        origin: { x: 0 }
    });
    confetti({
        particleCount: 200,
        angle: 120,
        spread: 80,
        origin: { x: 1 }
    });

    submitBtn.classList.remove("submitPop");
    void submitBtn.offsetWidth;
    submitBtn.classList.add("submitPop");
}


// ================================
// MEME CARD LOGIC
// ================================
function memeCardLikes(likeBtn, likesSpan, meme) {
    const key = `liked_${meme.id}`;

    if (localStorage.getItem(key)) {
        likeBtn.disabled = true;
        likeBtn.style.opacity = 0.6;    
        return;
    }

    likeBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        localStorage.setItem(key, "true");

        meme.likes += 1;
        likesSpan.textContent = meme.likes;

        await supabase
            .from("memes")
            .update({ likes: meme.likes })
            .eq("id", meme.id);

        likeBtn.disabled = true;
    });
}

function memeCardReport(reportBtn, meme) {
    reportBtn.addEventListener("click", async () => {
        e.stopPropagation();
        meme.reports += 1;

        await supabase
            .from("memes")
            .update({ reports: meme.reports })
            .eq("id", meme.id);

        if (meme.reports >= 10) {
            alert("⚠️ This meme will be reviewed.");
        }

        reportBtn.disabled = true;
    });
}

function createMemeCard(meme) {
    const memeCard = document.createElement("div");
    memeCard.className = "memeCard";
    memeCard.dataset.id = meme.id;
    memeCard.setAttribute("data-category", meme.category);

    // TOP
    const memeTop = document.createElement("div");
    memeTop.id = "memeTop";

    const memeUsername = document.createElement("span");
    memeUsername.id = "username";
    memeUsername.textContent = meme.name;

    const reportBtn = document.createElement("button");
    reportBtn.id = "reportBtn";
    reportBtn.textContent = "⚠️";

    memeTop.append(memeUsername, reportBtn);
    memeCard.appendChild(memeTop);

    // ICON
    const memeIcon = document.createElement("div");
    memeIcon.id = "memeIcon";
    memeIcon.className = meme.category + "Icon";
    memeIcon.textContent = emojiData.get(meme.category) || "❓";

    memeCard.appendChild(memeIcon);

    // TEXT AND COST
    const memeText = document.createElement("p");
    memeText.id = "memeText";
    memeText.textContent = meme.text;

    memeCard.appendChild(memeText);

    const memeCost = document.createElement("p");
    memeCost.id = "memeCost";
    memeCost.textContent = meme.cost + " $";

    memeCard.appendChild(memeCost);

    // BOTTOM
    const memeBottom = document.createElement("div");
    memeBottom.id = "memeBottom";

    const likeBtn = document.createElement("button");
    likeBtn.id = "likeBtn";
    likeBtn.textContent = "⭐ ";

    const likes = document.createElement("span");
    likes.id = "likes";
    likes.textContent = meme.likes;

    likeBtn.appendChild(likes);
    memeBottom.appendChild(likeBtn);

    const memeBuys = document.createElement("p");
    memeBuys.id = "buys";
    memeBuys.textContent = "🛒" + meme.buys;

    memeBottom.appendChild(memeBuys);

    memeCard.appendChild(memeBottom);

    // FINISHING

    memeCardLikes(likeBtn, likes, meme);
    memeCardReport(reportBtn, meme);

    memeCard.addEventListener("click", (e) => {
        if (e.target.closest("button")) return;
        addToCart(meme, memeCard);
    });




    memeGrid.appendChild(memeCard);
}


// ================================
// MODAL CONTROLS
// ================================
createButton.addEventListener("click", () => {
    createOverlay.classList.add("active");
});

closeBtn.addEventListener("click", () => {
    createOverlay.classList.remove("active");
});


// ================================
// SUBMIT MEME
// ================================
submitBtn.addEventListener("click", async () => {
    const name = nameInput.value.trim();
    const text = textInput.value.trim();
    const category = categorySelect.value;
    const cost = costInput.value.trim();

    if (!name || !text || !cost) {
        shakeModal();
        return; 
    }

    popSubmit();

    const { data, error } = await supabase
        .from("memes")
        .insert([{
            name,
            text,
            category,
            cost,
            likes: 0,
            buys : 0,
            reports: 0
        }])
        .select()
        .single();

    if (error) {
        console.error(error);
        return;
    }

    createMemeCard(data);
    createOverlay.classList.remove("active");

    nameInput.value = "";
    textInput.value = "";
});


// ================================
// LOAD MEMES
// ================================
async function loadMemes() {
    const { data, error } = await supabase
        .from("memes")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    memeGrid.innerHTML = "";
    data.forEach(createMemeCard);
}

loadMemes();

// ================================
// SEARCH BAR
// ================================

async function globalSearch(query) {
    memeGrid.innerHTML = "";

    if (!query) {
        loadMemes(); // fallback
        return;
    }

    const { data, error } = await supabase
        .from("memes")
        .select("*")
        .or(
            `text.ilike.%${query}%,name.ilike.%${query}%`
        )
        .order("created_at", { ascending: false })
        .limit(50);

    if (error) {
        console.error(error);
        return;
    }

    data.forEach(meme => createMemeCard(meme));
}

const searchBar = document.getElementById("searchBar");

let searchTimeout;

searchBar.addEventListener("input", () => {
    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
        globalSearch(searchBar.value.trim());
    }, 300); // debounce = 🔥
});

// ================================
// SEARCH BAR
// ================================

const sortSelect = document.getElementById("sortSelect");

sortSelect.addEventListener("change", () => {
    applySort(sortSelect.value);
});

async function applySort(type) {
    memeGrid.innerHTML = "";

    // No sort selected
    if (!type) {
        loadMemes();
        return;
    }

    let query = supabase.from("memes").select("*");

    if (type === "new") {
        query = query.order("created_at", { ascending: false });
    }

    if (type === "likes") {
        query = query.order("likes", { ascending: false });
    }

    if (type === "bought") {
        query = query.order("reports", { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
        console.error(error);
        return;
    }

    data.forEach(meme => createMemeCard(meme));
}

cartBtn.addEventListener("click", () => {
    checkoutOverlay.classList.add("active");
    renderCheckout();
});

function renderCheckout() {
    checkoutList.innerHTML = "";

    if (cart.length === 0) {
        checkoutList.textContent = "🫥 Cart empty";
        return;
    }

    let totalCash = 0;

    cart.forEach(meme => {
        const row = document.createElement("div");
        row.className = "checkoutRow";
        row.innerHTML = `
            <span>${meme.text}</span>
            <span>$${meme.cost}</span>
        `;

        checkoutList.appendChild(row);
        totalCash += Number(meme.cost);
    });

    const totalRow = document.createElement("div");
    totalRow.className = "checkoutTotal";
    totalRow.textContent = `Total: $${totalCash.toFixed(2)}`;

    checkoutList.appendChild(totalRow);
}

async function finishCheckout() {
    bankText.textContent = "✅ Payment approved by Totally Legit Bank!";

    for (const meme of cart) {
        await supabase
            .from("memes")
            .update({ buys: meme.buys + 1 })
            .eq("id", meme.id);
    }

    cart = [];
    cartCount.textContent = 0;

    setTimeout(()=> {
        checkoutOverlay.classList.remove("active");
    }, 800);

    setTimeout(() => {
        progressBar.value = 0;
        progressBar.style.display = "none";
        bankText.style.display = "none";
    }, 800);

    
}

function startFakePayment() {
    if (isPaying) return;

    isPaying = true;
    progressBar.value = 0;
    progressBar.style.display = "block";
    bankText.style.display = "block";
    bankText.textContent = "Asking TLB to purchase...";

    paymentInterval = setInterval(() => {
        progressBar.value += 1;

        if (progressBar.value >= 100) {
            clearInterval(paymentInterval);
            paymentInterval = null;
            isPaying = false;

            finishCheckout(); // whatever ends payment
        }
    }, 30);
}

function addToCart(meme, memeCard) {
    const index = cart.findIndex(item => item.id === meme.id);

    if (index !== -1) {
        cart.splice(index, 1);
        memeCard.classList.remove("addedToCart");
    } else {
        cart.push(meme);
        memeCard.classList.add("addedToCart");

        cartBtn.classList.remove("cartPop");
        void cartBtn.offsetWidth;
        cartBtn.classList.add("cartPop");
    }

    cartCount.textContent = cart.length;
}

checkoutBtn.addEventListener("click", () => {
    if (isPaying) return;
    if (cart.length === 0) {
        bankText.textContent = "❌ No memes to buy";
        return;
    }

    startFakePayment();
});

const cancelCheckout = document.getElementById("cancelCheckout");

cancelCheckout.addEventListener("click", (e) => {
    e.stopPropagation();
    if (isPaying) return; // 🔥 THIS LINE WAS MISSING
    checkoutOverlay.classList.remove("active");
});