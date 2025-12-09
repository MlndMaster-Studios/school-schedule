// ===== Feather icons =====
feather.replace();

(function () {
  const overlay = document.getElementById('construction-overlay');

  // Prevent scroll on page behind overlay
  const prevDocOverflow = document.documentElement.style.overflow;
  const prevBodyOverflow = document.body.style.overflow;
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';

  // Hide underlying content from assistive tech and disable keyboard tabbing
  const bodyChildren = Array.from(document.body.children);
  const saved = [];
  bodyChildren.forEach(el => {
    if (el === overlay) return; // keep overlay alone
    // store previous attributes to restore later
    saved.push({
      node: el,
      ariaHidden: el.getAttribute('aria-hidden'),
      tabIndex: el.getAttribute('tabindex')
    });
    try { el.setAttribute('aria-hidden', 'true'); } catch(e){}
    // remove ability to tab into focusable elements by setting tabindex = -1
    // but don't override if it already had tabindex saved (we store it above)
    try { el.setAttribute('tabindex', '-1'); } catch(e){}
  });

  // Store restore info globally, so removal can restore things
  window.__constructionOverlayRestore = {
    saved,
    prevDocOverflow,
    prevBodyOverflow
  };

  // Prevent pointer events going through (overlay itself covers entire viewport,
  // but this ensures underlying pointer-events are disabled if something odd)
  document.body.style.pointerEvents = 'none';
  overlay.style.pointerEvents = 'auto';

  // Focus overlay to catch keyboard events (keeps focus inside)
  overlay.setAttribute('tabindex','0');
  overlay.focus();

  // Helper to remove overlay and restore page to previous state
  window.removeConstructionOverlay = function() {
    try {
      const s = window.__constructionOverlayRestore;
      if (s && s.saved) {
        s.saved.forEach(item => {
          if (item.ariaHidden === null) item.node.removeAttribute('aria-hidden');
          else item.node.setAttribute('aria-hidden', item.ariaHidden);
          if (item.tabIndex === null) item.node.removeAttribute('tabindex');
          else item.node.setAttribute('tabindex', item.tabIndex);
        });
      }
      document.documentElement.style.overflow = (s && s.prevDocOverflow) || '';
      document.body.style.overflow = (s && s.prevBodyOverflow) || '';
    } catch (e) {
      console.warn('Error restoring page after removing construction overlay', e);
    } finally {
      // restore pointer events and remove overlay from DOM
      document.body.style.pointerEvents = '';
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
      delete window.__constructionOverlayRestore;
      delete window.removeConstructionOverlay;
    }
  };

  // Optional: prevent certain user input on overlay (escape key does nothing,
  // but you can change it to call removeConstructionOverlay() if you like)
  overlay.addEventListener('keydown', function (ev) {
    // prevent tab from moving focus outside overlay
    if (ev.key === 'Tab') {
      ev.preventDefault();
      overlay.focus();
    }
    // keep ESC from doing anything by default; uncomment next lines to allow ESC to remove overlay
    // if (ev.key === 'Escape') {
    //   window.removeConstructionOverlay();
    // }
  });
})();

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

// ===== Soft drifting particles (no mouse follow) =====
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
    // Slower movement
    this.speedX = Math.random() * 0.5 - 0.25;
    this.speedY = Math.random() * 0.5 - 0.25;
    this.color = `rgba(139,92,246,${Math.random() * 0.5 + 0.2})`;
  }
  update() {
    // Subtle drift variation for natural motion
    this.speedX += (Math.random() - 0.5) * 0.01;
    this.speedY += (Math.random() - 0.5) * 0.01;

    this.x += this.speedX;
    this.y += this.speedY;

    // Bounce on edges
    if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
    if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
  }
  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Initialize particles at random positions
for (let i = 0; i < particleCount; i++) {
  particles.push(new Particle(Math.random() * canvas.width, Math.random() * canvas.height));
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
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

// ===== Auto-Fill Week View with Correct Letter Days =====
function updateWeekView() {
  const weekSection = document.getElementById("WEEK-day");
  if (!weekSection) return;

  // Get Monday of this week
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const cards = weekSection.querySelectorAll(".schedule-card");

  weekdays.forEach((day, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);

    const letterDay = calculateDay(date).replace(" Day", "");
    const card = cards[i];
    if (card) {
      // Find or create the paragraph to update
      let textEl = card.querySelector(".day-type");
      if (!textEl) {
        // Replace placeholder <p> with our dynamic one
        card.querySelector("p").remove();
        textEl = document.createElement("p");
        textEl.classList.add("day-type");
        card.appendChild(textEl);
      }
      textEl.textContent = `${letterDay} Day`;
    }
  });
}

// Run every time dropdown changes
document.querySelectorAll(".dropdown-item").forEach(item => {
  item.addEventListener("click", e => {
    if (e.target.dataset.day === "WEEK") {
      updateWeekView();
    }
  });
});

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

  // --- Calendar-based total days remaining ---
  const totalCalendarDays = Math.ceil((schoolEnd - today) / (1000 * 60 * 60 * 24));

  // --- Weekday counts ---
  const totalWeekdays = countWeekdays(schoolStart, schoolEnd);
  const elapsedWeekdays = countWeekdays(schoolStart, today);
  const remainingWeekdays = totalWeekdays - elapsedWeekdays;

  // --- Progress percentage based on weekdays ---
  const percent = Math.min(Math.max((elapsedWeekdays / totalWeekdays) * 100, 0), 100);

  // Update bar
  progressBar.style.width = percent + "%";
  progressText.textContent = Math.round(percent) + "%";

  // Update widgets
  weekdaysLeftElem.textContent = remainingWeekdays;
  totalDaysElem.textContent = totalCalendarDays;
}

// Run initially
updateProgress();

// Optional: update every hour
setInterval(updateProgress, 60 * 60 * 1000);

  function updateProgressBar(percent) {
  const bar = document.getElementById('progress-bar');
  bar.style.width = percent + '%';
  document.getElementById('progress-text').textContent = `${percent}%`;
}
