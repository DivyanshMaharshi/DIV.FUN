const mouse = document.getElementById("mouse");
const cat = document.getElementById("cat");
const timer = document.getElementById("mouseChaseTimer");
const button = document.getElementById("mouseChaseButton");
let playing = 0;
let startTime; 

mouse.style.display = "none";
cat.style.display = "none";
timer.style.display = "none";
button.style.display = "block";

let catX = 200;
let catY = 200;

document.addEventListener("mousemove", function(e) {
    if (playing == 1) {
        mouse.style.left = e.pageX + "px";
        mouse.style.top = e.pageY + "px";
    }
});

function chase() {
    const mouseRect = mouse.getBoundingClientRect();
    const mouseX = mouseRect.left;
    const mouseY = mouseRect.top;

    const speed = 0.05;

    catX += (mouseX - catX) * speed;
    catY += (mouseY - catY) * speed;

    cat.style.left = catX + "px";
    cat.style.top = catY + "px";

    const angle = Math.atan2(mouseY - catY, mouseX - catX);
    cat.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`;

    const dx = mouseX - catX;
    const dy = mouseY - catY;
    const distance = Math.sqrt(dx*dx + dy*dy);

    const timeSurvived = ((Date.now() - startTime) / 1000).toFixed(2);
    timer.textContent = `${timeSurvived} seconds`;

    if (distance < 30) {
        reset();
        return; 
    }
    requestAnimationFrame(chase);
}

function play() {
    playing = 1;
    mouse.style.display = "block";
    cat.style.display = "block";
    timer.style.display = "block";
    button.style.display = "none";
    document.body.style.cursor = "none";
    startTime = Date.now(); // set global startTime
    chase();
}

function reset() {
    playing = 0;
    document.body.style.cursor = "default";
    button.style.display = "block";
    catX = 200;
    catY = 200;
}
