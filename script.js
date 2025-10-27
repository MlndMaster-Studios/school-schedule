// ===== Feather icons =====
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
    const easedX = currentX + (deltaX * 0.03);
    const easedY = currentY + (deltaY * 0.03);
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

// ===== School Day Clock =====
const clockDisplay = document.getElementById("school-day");
const scheduleOrder = ["A","F","D","B","G","E","C"];

const scheduleOverrides = {
  "2025-10-17": "PAUSE",
  "2025-10-16": "PAUSE",
  "2025-10-15": "PAUSE"
};

const startDate = new Date("2025-10-09T00:00:00");

function calculateDay(today = new Date()) {
  today.setHours(0,0,0,0);
  const dayMS = 1000*60*60*24;
  let current = new Date(startDate);
  let index = scheduleOrder.indexOf("G");
  while(current < today) {
    const yyyy_mm_dd = current.toISOString().slice(0,10);
    const dayOfWeek = current.getDay();
    if(dayOfWeek !== 0 && dayOfWeek !== 6) {
      if(scheduleOverrides[yyyy_mm_dd] === "PAUSE") {
      } else if(scheduleOverrides[yyyy_mm_dd]) {
        index = scheduleOrder.indexOf(scheduleOverrides[yyyy_mm_dd]);
      } else {
        index = (index + 1) % scheduleOrder.length;
      }
    }
    current = new Date(current.getTime() + dayMS);
  }
  const todayStr = today.toISOString().slice(0,10);
  const todayOverride = scheduleOverrides[todayStr];
  if(todayOverride === "PAUSE") return "No Classes 🎉";
  if(todayOverride && todayOverride !== "PAUSE") return todayOverride + " Day";
  return scheduleOrder[index] + " Day";
}

function updateDayDisplay() {
  if(clockDisplay) clockDisplay.textContent = calculateDay();
}
updateDayDisplay();

setInterval(() => {
  const now = new Date();
  if(now.getHours() === 0 && now.getMinutes() === 1) updateDayDisplay();
}, 60*1000);

// ===== Redirect mobile users =====
if (window.innerWidth <= 768) {
  window.location.href = "https://mlndmaster-studios.github.io/school-schedule/mobile/";
}

// ===== Time-Based Background Gradient =====
function updateBackgroundByTime() {
  const now = new Date();
  const hour = now.getHours();
  let gradient;
  if (hour >= 5 && hour < 10) gradient = "linear-gradient(135deg, #fbc2eb, #a6c1ee)";
  else if (hour >= 10 && hour < 17) gradient = "linear-gradient(135deg, #89f7fe, #66a6ff)";
  else if (hour >= 17 && hour < 20) gradient = "linear-gradient(135deg, #f6d365, #fda085)";
  else gradient = "linear-gradient(135deg, #0b0f25, #1b1f3e, #3b3f7a, #4f46e5)";
  document.body.style.transition = "background 2s ease";
  document.body.style.background = gradient;
  document.body.style.backgroundSize = "300% 300%";
}
updateBackgroundByTime();
setInterval(updateBackgroundByTime, 15 * 60 * 1000);

// ===== Progress Bar & Widgets =====
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");
const weekdaysLeftElem = document.getElementById("weekdays-left");
const totalDaysElem = document.getElementById("total-days");

// Start & end of school
const schoolStart = new Date("2025-08-20T00:00:00");
const schoolEnd = new Date("2026-05-21T00:00:00");

// Paused days (YYYY-MM-DD)
const pausedDays = ["2025-10-15", "2025-10-16", "2025-10-17"]; // example

// Helper to count weekdays excluding paused days
function countWeekdays(start, end) {
  let count = 0;
  let current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay();
    const yyyy_mm_dd = current.toISOString().slice(0,10);
    if(dayOfWeek !== 0 && dayOfWeek !== 6 && !pausedDays.includes(yyyy_mm_dd)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

// Update progress
function updateProgress() {
  const today = new Date();
  const totalWeekdays = countWeekdays(schoolStart, schoolEnd);
  const elapsedWeekdays = countWeekdays(schoolStart, today);
  const remainingWeekdays = totalWeekdays - elapsedWeekdays;

  const percent = Math.min(Math.max((elapsedWeekdays / totalWeekdays) * 100, 0), 100);

  // Update bar width and color
  progressBar.style.width = percent + "%";

  // Smooth gradient: red -> orange -> yellow -> green
  const color = `hsl(${percent * 1.2}, 75%, 50%)`;
  progressBar.style.background = color;

  // Update text inside bar
  progressText.textContent = Math.round(percent) + "%";

  // Update widgets (only numbers)
  weekdaysLeftElem.textContent = remainingWeekdays;
  totalDaysElem.textContent = totalWeekdays;
}

// Run initially
updateProgress();

// Optional: update every day at midnight
setInterval(updateProgress, 60 * 60 * 1000); // every hour is fine

  function updateProgressBar(percent) {
  const bar = document.getElementById('progress-bar');
  bar.style.width = percent + '%';
  document.getElementById('progress-text').textContent = `${percent}%`;
}
