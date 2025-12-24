document.addEventListener('click', () => {
    document.documentElement.requestFullscreen();
}, { once: true });

document.getElementById("homePageLink").addEventListener("click", () => {
    document.exitFullscreen()
}, {once: true});

const canvas = document.getElementById("artCanvas");
const gif = document.getElementById("gif");
const ctx = canvas.getContext("2d");

var canvasImage;

const leftMainButton = document.getElementById("leftMainButton");
const rightMainButton = document.getElementById("rightMainButton");
const artHeading = document.getElementById("artHeading");
const instruction = document.getElementById("instruction")

const minimumCanvasNumber = 1;
const maxCanvasNumber = 12;
let canvasNumber = 1;

const Colors = ["Red", "Orange", "Yellow", "Green", "Blue", "Pink", "Brown", "White"];

let stroopInterval = null; // Store interval ID globally to clear it

let boidsActive = false;
let boidsAnimId = null;

let constellationPoints = [];
let constellationActive = false;
let constellationAnimId = null;

let reactionStart = 0;
let reactionTimeout = null;

let isDrawing = false;

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function resetCanvas() {
    if (stroopInterval) clearInterval(stroopInterval);
    if (reactionTimeout) clearTimeout(reactionTimeout);

    constellationActive = false;
    constellationPoints.length = 0;

    boidsActive = false;
    if (boidsAnimId) cancelAnimationFrame(boidsAnimId);

    if (constellationAnimId) {
        cancelAnimationFrame(constellationAnimId);
        constellationAnimId = null;
    }

    canvas.onmousedown = null;
    canvas.onmousemove = null;
    window.onmouseup = null;

    gif.style.display = "none";
    gif.src = "";
    gif.classList.replace("above", "below");

    artHeading.style.display = "block";
    canvas.style.visibility = "visible";

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}


function drawDiversionFractal() {
    // --- Parameters from Python script ---
    const startDistance = 110;
    const deduction = 1.25;
    const angle = 25 * Math.PI / 180; // Convert degrees to radians for JS Math
    const minimum = 12.5;

    // Set styles (using your project's color scheme)
    ctx.strokeStyle = randomChoice(Colors); 
    ctx.lineWidth = 2;

    // --- Recursive Drawing Function ---
    function createFractal(distance) {
        if (distance > minimum) {
            const newDist = distance / deduction;
            
            // Draw forward (JS canvas defaults to drawing on the Y-axis when translated/rotated)
            ctx.beginPath();
            ctx.moveTo(0, 0); // Start at current origin
            ctx.lineTo(0, -distance); // Draw up the screen
            ctx.stroke();
            ctx.translate(0, -distance); // Move origin to the end of the line

            // Branch Right
            ctx.save(); // Save current position/rotation
            ctx.rotate(angle); // Rotate right (clockwise)
            createFractal(newDist); // Recurse
            ctx.restore(); // Restore position/rotation

            // Branch Left (We need to rotate left 2*angle from the restored state, then rotate right 1*angle back)
            ctx.save();
            ctx.rotate(-angle); // Rotate left (counter-clockwise)
            createFractal(newDist); // Recurse
            ctx.restore(); // Restore position/rotation

            // Move backward (Move origin back down to the parent branch point)
            ctx.translate(0, distance); 
        }
    }
    
    // --- Initial Setup and Call ---
    // Move to the center bottom of the canvas to start drawing UP
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height - 50); 
    
    // Call the recursive function
    createFractal(startDistance);
    
    ctx.restore(); // Restore context to default (important for resetCanvas function)
}

function startStroop() {
    function doStroopEffect(){
        ctx.clearRect(-canvas.width/2, -canvas.height/2, canvas.width, canvas.height);

        const color = randomChoice(Colors);
        const text = randomChoice(Colors);

        ctx.fillStyle = color.toLowerCase(); 
        ctx.fillText(text, 0, 0);
    }

    ctx.font = "100px Poppins";
    ctx.textAlign = "center"; 
    ctx.textBaseline = "middle";

   ctx.setTransform(1, 0, 0, 1, canvas.width / 2, canvas.height / 2);
    doStroopEffect();

    stroopInterval = window.setInterval(() => {
        doStroopEffect();
    }, 1000);
}

function drawMandelbrotSet() {
    const maxIterations = 100;
    // Define the region of the complex plane we want to view
    const xmin = -2.0;
    const xmax = 1.0;
    const ymin = -1.2;
    const ymax = 1.2;

    const width = canvas.width;
    const height = canvas.height;

    // Iterate over every pixel
    for (let px = 0; px < width; px++) {
        for (let py = 0; py < height; py++) {
            // Map pixel coordinates (px, py) to complex coordinates (cx, cy)
            let cx = xmin + (xmax - xmin) * px / width;
            let cy = ymin + (ymax - ymin) * py / height;

            let x = 0.0; // Real part of Z
            let y = 0.0; // Imaginary part of Z
            let iterations = 0;

            // The main algorithm loop
            while (x * x + y * y < 4 && iterations < maxIterations) {
                let x_new = x * x - y * y + cx;
                y = 2 * x * y + cy;
                x = x_new;
                iterations++;
            }

            // Color the pixel based on how quickly it escaped
            if (iterations === maxIterations) {
                ctx.fillStyle = '#000000'; // Black if it never escaped (inside the set)
            } else {
                // Use HSL for a nice color gradient based on iterations
                let hue = iterations * 360 / maxIterations;
                ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            }
            ctx.fillRect(px, py, 1, 1); // Draw the pixel
        }
    }
}

function drawEbbinghausIllusion() {
    const centerSize = 40; // The two center circles are the same size
    const largeSurroundSize = 70; // Surrounding circles for the left illusion
    const smallSurroundSize = 25; // Surrounding circles for the right illusion
    const surroundCount = 6; // Number of surrounding circles
    const distance = 90; // Distance of surrounding circles from center

    // Set styles (using your project's color scheme)
    ctx.strokeStyle = randomChoice(Colors)
    ctx.lineWidth = 3;

    // Helper function to draw a circle
    function drawCircle(x, y, radius) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
    }

    // --- Left Illusion (Center looks smaller) ---
    const leftCenterX = canvas.width / 2 - 150;
    const leftCenterY = canvas.height / 2;

    // Draw surrounding large circles
    for (let i = 0; i < surroundCount; i++) {
        const angle = (i / surroundCount) * Math.PI * 2;
        const x = leftCenterX + Math.cos(angle) * distance;
        const y = leftCenterY + Math.sin(angle) * distance;
        drawCircle(x, y, largeSurroundSize / 2);
    }
    // Draw the center circle (the test subject)
    drawCircle(leftCenterX, leftCenterY, centerSize / 2);


    // --- Right Illusion (Center looks larger) ---
    const rightCenterX = canvas.width / 2 + 150;
    const rightCenterY = canvas.height / 2;

    // Draw surrounding small circles
    for (let i = 0; i < surroundCount; i++) {
        const angle = (i / surroundCount) * Math.PI * 2;
        const x = rightCenterX + Math.cos(angle) * distance;
        const y = rightCenterY + Math.sin(angle) * distance;
        drawCircle(x, y, smallSurroundSize / 2);
    }
    // Draw the center circle (the test subject)
    drawCircle(rightCenterX, rightCenterY, centerSize / 2);

    // Optional: Add instructions specific to this illusion
    ctx.font = "20px Poppins";
    ctx.textAlign = "center";
    ctx.fillStyle = '#d6dbff';
    ctx.fillText("Which center circle is bigger?", canvas.width / 2, canvas.height - 40);
}

const mouse = { x: 0, y: 0, down: false };

canvas.addEventListener("mousemove", e => {
    if (canvasNumber != 5) return;
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener("mousedown", () => {if (canvasNumber == 5) mouse.down = true});
canvas.addEventListener("mouseup", () => {if (canvasNumber == 5) mouse.down = false});

class Boid {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = Math.random() * 2 - 1;
        this.vy = Math.random() * 2 - 1;
        this.maxSpeed = 2.5;
    }

    draw() {
        const angle = Math.atan2(this.vy, this.vx);

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);

        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(-6, 4);
        ctx.lineTo(-6, -4);
        ctx.closePath();

        ctx.fill();
        ctx.restore();
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
    }
}

function applyBoidRules(boid, boids) {
    let ax = 0, ay = 0;
    let cx = 0, cy = 0;
    let sx = 0, sy = 0;
    let count = 0;

    for (let other of boids) {
        if (other === boid) continue;

        const dx = other.x - boid.x;
        const dy = other.y - boid.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 70) {
            ax += other.vx;
            ay += other.vy;

            cx += other.x;
            cy += other.y;

            sx -= dx / dist;
            sy -= dy / dist;

            count++;
        }
    }

    if (count) {
        ax /= count;
        ay /= count;
        cx = (cx / count - boid.x) * 0.004;
        cy = (cy / count - boid.y) * 0.004;

        boid.vx += ax * 0.05 + cx + sx * 0.05;
        boid.vy += ay * 0.05 + cy + sy * 0.05;
    }

    // 🐭 mouse attraction / repulsion
    const mdx = mouse.x - boid.x;
    const mdy = mouse.y - boid.y;
    const mdist = Math.hypot(mdx, mdy);

    if (mdist < 200) {
        const force = mouse.down ? -0.15 : 0.05;
        boid.vx += (mdx / mdist) * force;
        boid.vy += (mdy / mdist) * force;
    }

    // speed limit
    const speed = Math.hypot(boid.vx, boid.vy);
    if (speed > boid.maxSpeed) {
        boid.vx = boid.vx / speed * boid.maxSpeed;
        boid.vy = boid.vy / speed * boid.maxSpeed;
    }
}


const boids = [];
for (let i = 0; i < 120; i++) {
    boids.push(new Boid());
}

function animateBoids() {
    if (!boidsActive) return;

    ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#5f6cff";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#5f6cff";

    for (let boid of boids) {
        applyBoidRules(boid, boids);
        boid.update();
        boid.draw();
    }

    boidsAnimId = requestAnimationFrame(animateBoids);
}

canvas.addEventListener("click", e => {
    if (canvasNumber != 6) return;

    const rect = canvas.getBoundingClientRect();
    constellationPoints.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        vx: Math.random() * 0.4 - 0.2,
        vy: Math.random() * 0.4 - 0.2
    });
}); 

function animateConstellation() {
    if (!constellationActive) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draw dots
    ctx.fillStyle = "#5f6cff";
    for (const p of constellationPoints) {
        p.x += p.vx;
        p.y += p.vy;

        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); // 2 is the radius
        ctx.fill();

        // bounce off edges
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
    }

    for (let i = 0; i < constellationPoints.length; i++) {
        for (let j = i + 1; j < constellationPoints.length; j++) {
            const dx = constellationPoints[i].x - constellationPoints[j].x;
            const dy = constellationPoints[i].y - constellationPoints[j].y;
            const dist = Math.hypot(dx, dy);

            if (dist < 140) {
                ctx.strokeStyle = `rgba(95,108,255,${1 - dist / 140})`;
                ctx.beginPath();
                ctx.moveTo(constellationPoints[i].x, constellationPoints[i].y);
                ctx.lineTo(constellationPoints[j].x, constellationPoints[j].y);
                ctx.stroke();
            }
        }
    }

    constellationAnimId = requestAnimationFrame(animateConstellation);
}

function startReactionTest() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "60px Poppins";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#d6dbff";
    ctx.fillText("Wait for green...", canvas.width/2, canvas.height/2);

    reactionTimeout = setTimeout(() => {
        ctx.fillStyle = "#00ff88";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        reactionStart = performance.now();
    }, Math.random() * 3000 + 2000);
}

canvas.addEventListener("click", () => {
    if (canvasNumber != 11 || !reactionStart) return;

    const time = Math.round(performance.now() - reactionStart);
    ctx.fillStyle = "#0b0f1f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#5f6cff";
    ctx.fillText(`${time} ms`, canvas.width/2, canvas.height/2);
    reactionStart = 0;
});

function startMirrorDots() {
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    canvas.onmousedown = (e) => {
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        // Set starting point so we don't draw a line from (0,0)
        lastX = e.clientX - rect.left;
        lastY = e.clientY - rect.top;
    };

    window.onmouseup = () => isDrawing = false;
    
    canvas.onmousemove = (e) => {
        if (!isDrawing) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = canvas.width / 2;
        
        // Mirror Logic
        const mirroredX = centerX + (centerX - x);
        const lastMirroredX = centerX + (centerX - lastX);

        // Styling the line
        ctx.strokeStyle = "#5f6cff";
        ctx.lineWidth = 5;
        ctx.lineCap = "round"; // Makes the ends smooth
        ctx.lineJoin = "round"; // Makes the corners smooth

        // Draw Original Line
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();

        // Draw Mirrored Line
        ctx.beginPath();
        ctx.moveTo(lastMirroredX, lastY);
        ctx.lineTo(mirroredX, y);
        ctx.stroke();

        // Update last position for the next frame
        lastX = x;
        lastY = y;
    };

    // Draw center guide line
    ctx.strokeStyle = "rgba(0, 0, 0, 0.1)"; 
    ctx.setLineDash([5, 5]); // Optional: makes the guide dashed
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash
}

function placeGif(num) {
    canvas.style.visibility = "hidden";   // 🔥 KEY FIX
    gif.style.display = "block";
    gif.classList.remove("below");
    gif.classList.add("above");

    switch (num) {
        case 7:
            gif.src = "../Assets/artMathAndIllusionsAssets/circleIllusion.gif";
            break;
        case 8:
            gif.src = "../Assets/artMathAndIllusionsAssets/wallIllusion.gif";
            break;
        case 9:
            gif.src = "../Assets/artMathAndIllusionsAssets/movingImage.jpg";
            break;
        case 10:
            gif.src = "../Assets/artMathAndIllusionsAssets/colorAssimIllusion.jpg";
            break;
    }
}

function updateCanvas(num) {
    resetCanvas();
    switch (num) {
        case 1:
            artHeading.textContent = "Diversion Fractal";
            instruction.style.display = "none";
            drawDiversionFractal();
            break;
        case 2:
            artHeading.textContent = "The Mandelbrot Set";
            instruction.style.display = "none";
            drawMandelbrotSet(); 
            break;
        case 3:
            artHeading.textContent = "Stroop's Color Test";
            instruction.style.display = "block";
            instruction.textContent = "(say the color of the word)"
            startStroop();
            break;
        case 4:
            artHeading.textContent = "The Ebbinghaus Illusion";
            instruction.style.display = "block";
            instruction.textContent = "(They are both the exact same size!)";
            drawEbbinghausIllusion();
            break;
        case 5:
            artHeading.textContent = "Boids Simulation";
            instruction.style.display = "block";
            instruction.textContent = "(play with the boids using your mouse)";
            boidsActive = true;
            animateBoids();
            break;
        case 6:
            artHeading.textContent = "Constellation Effect";
            instruction.style.display = "block";
            instruction.textContent = "(add more dots by clicking)";
            constellationActive = true;
            animateConstellation();
            break;
        case 7:
            artHeading.textContent = "Circular Illusion";
            instruction.style.display = "block";
            instruction.textContent = "(stare at it for 30 secs then look at your hand)";
            placeGif(7)
            return;
        case 8:
            artHeading.textContent = "Wall Illusion";
            instruction.style.display = "block";
            instruction.textContent = "(stare at it for 30 secs then look at the wall)";
            placeGif(8)
            return;
        case 9: 
            artHeading.textContent = "Moving Image";
            instruction.style.display = "block";
            instruction.textContent = "(its an image not a gif!)"
            placeGif(9); // used gif cuz its easier and more effiecent :)
            return;
        case 10:
            artHeading.textContent = "Color Assimilation Illusion";
            instruction.style.display = "block";
            instruction.textContent = "(there all the same color!)";
            placeGif(10);
            return;
        case 11:
            artHeading.textContent = "Reaction Speed Test";
            instruction.style.display = "block";
            instruction.textContent = "(click when it turns green)";
            startReactionTest();
            break;
        case 12:
            artHeading.textContent = "Mirror Drawing";
            instruction.style.display = "block";
            instruction.textContent = "(draw on one side to see the mirror image)";
            startMirrorDots();
            break;
        default:
            artHeading.textContent = "ERROR";
    }
}

leftMainButton.addEventListener("click", () => {
    if (canvasNumber == minimumCanvasNumber) return;

    canvasNumber -= 1;
    updateCanvas(canvasNumber)

    rightMainButton.classList.replace("unusableButton", "usableButton");
    if (canvasNumber == minimumCanvasNumber) leftMainButton.classList.replace("usableButton", "unusableButton"); return;
});

rightMainButton.addEventListener("click", () => {
    if (canvasNumber == maxCanvasNumber) return;

    canvasNumber += 1;
    updateCanvas(canvasNumber)

    leftMainButton.classList.replace("unusableButton", "usableButton");
    if (canvasNumber == maxCanvasNumber) rightMainButton.classList.replace("usableButton", "unusableButton"); return;
});

updateCanvas(canvasNumber);