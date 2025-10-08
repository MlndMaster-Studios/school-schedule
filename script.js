// ===== Feather Icons =====
feather.replace();

// ===== Day Dropdown =====
const dayBtn = document.getElementById("dayDropdownBtn");
const dropdown = document.getElementById("dayDropdown");
const items = document.querySelectorAll(".dropdown-item");
const days = document.querySelectorAll(".schedule-day");

dayBtn.addEventListener("click", () => {
  dropdown.classList.toggle("hidden");
});

items.forEach(item => {
  item.addEventListener("click", () => {
    const day = item.dataset.day;
    days.forEach(d => d.classList.add("hidden"));
    document.getElementById(day + "-day").classList.remove("hidden");
    dayBtn.textContent = item.textContent + " ▾";
    dropdown.classList.add("hidden");
  });
});

// ===== Smooth Card Cursor-Follow Effect =====
const cards = document.querySelectorAll(".schedule-card");
let mouse = { x: 0, y: 0 };
window.addEventListener("mousemove", e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

function animateCards() {
  cards.forEach(card => {
    const rect = card.getBoundingClientRect();
    const cardX = rect.left + rect.width / 2;
    const cardY = rect.top + rect.height / 2;

    const deltaX = mouse.x - cardX;
    const deltaY = mouse.y - cardY;

    const currentX = parseFloat(card.dataset.tx || 0);
    const currentY = parseFloat(card.dataset.ty || 0);

    const easedX = currentX + deltaX * 0.03;
    const easedY = currentY + deltaY * 0.03;

    card.dataset.tx = easedX;
    card.dataset.ty = easedY;

    card.style.setProperty("--mouseX", easedX);
    card.style.setProperty("--mouseY", easedY);
  });

  requestAnimationFrame(animateCards);
}
animateCards();

cards.forEach(card => {
  card.addEventListener("mouseleave", () => {
    card.dataset.tx = 0;
    card.dataset.ty = 0;
  });
});

// ===== Mouse-following particles =====
const canvas = document.getElementById("bgCanvas");
const ctx = canvas.getContext("2d");
let particles = [];
const particleCount = 60;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 3 + 1;
    this.speedX = Math.random() * 2 - 1;
    this.speedY = Math.random() * 2 - 1;
    this.color = `rgba(139,92,246,${Math.random() * 0.5 + 0.2})`;
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    if(this.x < 0 || this.x > canvas.width) this.speedX *= -1;
    if(this.y < 0 || this.y > canvas.height) this.speedY *= -1;
  }
  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
    ctx.fill();
  }
}

for(let i = 0; i < particleCount; i++){
  particles.push(new Particle(Math.random()*canvas.width, Math.random()*canvas.height));
}

window.addEventListener('mousemove', e => {
  particles.push(new Particle(e.x + Math.random()*20-10, e.y + Math.random()*20-10));
  if(particles.length > particleCount) particles.shift();
});

function animateParticles() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  particles.forEach(p => {
    p.update();
    p.draw();
  });
  requestAnimationFrame(animateParticles);
}
animateParticles();

// ===== Fetch Current Day from GitHub Pages =====
const clockDisplay = document.getElementById("school-day");

// Replace this URL with your GitHub Pages link for day.json
const dayJSON = "https://school-schedule-day.pages.dev/day.json?_=" + Date.now();

fetch(dayJSON)
  .then(res => res.json())
  .then(data => {
    clockDisplay.textContent = data.currentDay + " Day";
  })
  .catch(err => {
    console.error("Error loading current day:", err);
    clockDisplay.textContent = "Loading Day...";
  });

// ===== Auto redirect mobile =====
if (window.innerWidth <= 768) {
  window.location.href = "https://semester-1-schedule-mobile.neocities.org";
}