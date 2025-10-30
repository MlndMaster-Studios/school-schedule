/* =====================================================================
   site-script.js
   Complete, self-contained JavaScript for the overhauled Day Planner.
   - Live clock
   - Dropdown (mouse + keyboard) with accessible controls
   - Day switching (persists last selection to localStorage)
   - Progress calculation (parses human time ranges in .time)
   - Print-friendly behavior (temporarily reveals all days before print)
   - Canvas particle background (respecting prefers-reduced-motion)
   - Graceful, defensive code (no uncaught exceptions if HTML slightly differs)
   ===================================================================== */

(function () {
  'use strict';

  /* ---------- Utilities ---------- */

  // Safe query helpers
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // Parse time like "8:00 AM" into today's Date object
  function parseTimeToToday(timeStr) {
    // Accepts "8:00 AM" or "08:00 AM" or "14:30"
    if (!timeStr || typeof timeStr !== 'string') return null;
    const now = new Date();
    const cleaned = timeStr.trim();
    const ampmMatch = cleaned.match(/(am|pm)$/i);
    try {
      let parts;
      if (ampmMatch) {
        // "h:mm AM"
        const [timePart, ampm] = cleaned.split(/\s+/);
        parts = timePart.split(':');
        let hour = parseInt(parts[0], 10);
        const minute = parseInt(parts[1] || '0', 10);
        const ampmLower = ampm.toLowerCase();
        if (ampmLower === 'pm' && hour !== 12) hour += 12;
        if (ampmLower === 'am' && hour === 12) hour = 0;
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
        return d;
      } else {
        // 24-hour fallback "14:30" or "9:00"
        parts = cleaned.split(':');
        if (parts.length >= 1) {
          const hour = parseInt(parts[0], 10);
          const minute = parseInt(parts[1] || '0', 10);
          return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
        }
      }
    } catch (e) {
      return null;
    }
    return null;
  }

  // Parse a range like "8:00 AM - 9:00 AM" and return { start: Date, end: Date }
  function parseRange(rangeStr) {
    if (!rangeStr || typeof rangeStr !== 'string') return null;
    const parts = rangeStr.split(/[-–—]/).map(s => s.trim());
    if (parts.length < 2) return null;
    const start = parseTimeToToday(parts[0]);
    const end = parseTimeToToday(parts[1]);
    return { start, end };
  }

  // Debounce helper
  function debounce(fn, wait = 100) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  /* ---------- DOM elements ---------- */
  const daySelectBtn = $('#daySelectBtn');
  const dayDropdown = $('#dayDropdown');
  const currentDayLabel = $('#currentDayLabel');
  const dropdownItems = $$('.dropdown-item', dayDropdown);
  const scheduleDays = $$('.schedule-day');
  const progressBarInner = $('#progressBar');
  const progressLabel = $('#progressLabel');
  const classesDoneEl = $('#classesDone');
  const classesLeftEl = $('#classesLeft');
  const totalClassesEl = $('#totalClasses');
  const printBtn = $('#printBtn');
  const dayClock = $('#dayClock');
  const clockTime = $('#clockTime');
  const footerYear = $('#footerYear');

  /* ---------- State ---------- */
  let selectedDayId = localStorage.getItem('planner:lastDay') || 'monday';
  let lastVisibleState = {}; // to restore visibility after printing

  /* ---------- Accessibility & Dropdown Behavior ---------- */

  function openDropdown() {
    dayDropdown.classList.remove('hidden');
    dayDropdown.setAttribute('aria-expanded', 'true');
    // focus first item
    const first = dayDropdown.querySelector('.dropdown-item');
    if (first) first.focus();
  }
  function closeDropdown() {
    dayDropdown.classList.add('hidden');
    dayDropdown.setAttribute('aria-expanded', 'false');
    daySelectBtn.focus();
  }
  function toggleDropdown() {
    if (dayDropdown.classList.contains('hidden')) openDropdown();
    else closeDropdown();
  }

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!dayDropdown.contains(e.target) && !daySelectBtn.contains(e.target)) {
      closeDropdown();
    }
  });

  // Toggle button
  if (daySelectBtn) {
    daySelectBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDropdown();
    });

    // Keyboard: Enter/Space opens; ArrowDown opens and focuses
    daySelectBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleDropdown();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        openDropdown();
      }
    });
  }

  // Dropdown item interactions
  dropdownItems.forEach((item, idx) => {
    item.setAttribute('tabindex', '0');
    item.addEventListener('click', () => {
      const day = item.dataset.day;
      setActiveDay(day);
      closeDropdown();
    });
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        item.click();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = dropdownItems[idx + 1] || dropdownItems[0];
        next.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = dropdownItems[idx - 1] || dropdownItems[dropdownItems.length - 1];
        prev.focus();
      } else if (e.key === 'Escape') {
        closeDropdown();
      }
    });
  });

  /* ---------- Day switching and persistence ---------- */

  function hideAllDays() {
    scheduleDays.forEach(d => d.classList.add('hidden'));
  }

  function setActiveDay(dayId) {
    if (!dayId) return;
    // normalize ids (allow "Monday" or "monday" or "monday-day")
    const normalized = String(dayId).toLowerCase().replace(/\s+/g, '').replace(/-day$/, '');
    const mapping = {
      monday: 'monday',
      tuesday: 'tuesday',
      wednesday: 'wednesday',
      thursday: 'thursday',
      friday: 'friday',
      week: 'WEEK-day' // not used in current markup but kept for compatibility
    };
    const target = mapping[normalized] || normalized;
    // Find element with id
    const el = document.getElementById(target) || document.getElementById(normalized);
    if (el) {
      hideAllDays();
      el.classList.remove('hidden');
      selectedDayId = el.id;
      currentDayLabel.textContent = (el.querySelector('.week-day-label') || el.querySelector('h2') || el).textContent.trim();
      localStorage.setItem('planner:lastDay', selectedDayId);
      // update progress view immediately
      updateProgress();
      // update focus for screen readers
      el.setAttribute('tabindex', '-1');
      el.focus();
    } else {
      // fallback: show first schedule day
      hideAllDays();
      if (scheduleDays[0]) scheduleDays[0].classList.remove('hidden');
    }
  }

  /* ---------- Live clock (updates every second) ---------- */
  function updateClock() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    let hr12 = hours % 12;
    if (hr12 === 0) hr12 = 12;
    const mm = minutes < 10 ? '0' + minutes : minutes;
    if (dayClock) {
      // If the visible day has a week-day-label, show it; otherwise keep previous
      const visible = scheduleDays.find(d => !d.classList.contains('hidden'));
      if (visible) {
        const label = visible.querySelector('.week-day-label');
        if (label) dayClock.textContent = label.textContent.trim();
      }
    }
    if (clockTime) clockTime.textContent = `${hr12}:${mm} ${ampm}`;
  }

  /* ---------- Progress calculation ---------- */

  // Given the currently visible schedule-day, count total classes and classes done.
  function calculateProgressForVisibleDay() {
    const visible = scheduleDays.find(d => !d.classList.contains('hidden')) || scheduleDays[0];
    if (!visible) return { total: 0, done: 0, percent: 0 };

    const cards = $$('.schedule-card', visible);
    const total = cards.length;
    let done = 0;

    const now = new Date();

    cards.forEach(card => {
      const timeEl = card.querySelector('.time');
      if (!timeEl) return;
      const range = parseRange(timeEl.textContent || '');
      if (!range || !range.end) return;
      // if the current time is after the class end, it's done
      if (now >= range.end) done += 1;
      // if the class is currently in progress (start <= now < end) we will not count it as done (but you can change behavior)
    });

    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, percent };
  }

  function updateProgress() {
    const { total, done, percent } = calculateProgressForVisibleDay();
    // update DOM
    if (progressBarInner) progressBarInner.style.width = percent + '%';
    if (progressLabel) progressLabel.textContent = percent + '%';
    if (classesDoneEl) classesDoneEl.textContent = done;
    if (classesLeftEl) classesLeftEl.textContent = Math.max(total - done, 0);
    if (totalClassesEl) totalClassesEl.textContent = total;
  }

  const debouncedUpdateProgress = debounce(updateProgress, 120);

  /* ---------- Print behavior: reveal all days before printing ---------- */

  function beforePrintRevealAll() {
    // save current visible map
    lastVisibleState = {};
    scheduleDays.forEach(d => {
      lastVisibleState[d.id] = d.classList.contains('hidden');
      d.classList.remove('hidden'); // show all
    });
    // ensure progress uses full-week totals if desired (we keep day-level progress)
    // Add a print class to body for CSS hooks
    document.body.classList.add('print-mode');
  }

  function afterPrintRestore() {
    // restore visibility
    scheduleDays.forEach(d => {
      if (lastVisibleState[d.id]) d.classList.add('hidden');
      else d.classList.remove('hidden');
    });
    document.body.classList.remove('print-mode');
    // re-run UI updates
    updateProgress();
  }

  // Hook into print events
  if ('onbeforeprint' in window) {
    window.onbeforeprint = beforePrintRevealAll;
    window.onafterprint = afterPrintRestore;
  } else {
    // fallback: listen for matchMedia print
    const mediaQueryList = window.matchMedia('print');
    mediaQueryList.addEventListener && mediaQueryList.addEventListener('change', (mql) => {
      if (mql.matches) beforePrintRevealAll();
      else afterPrintRestore();
    });
  }

  if (printBtn) {
    printBtn.addEventListener('click', () => {
      try {
        window.print();
      } catch (e) {
        // as a fallback, open a print window with the visible schedule
        alert('Print failed in this browser. Try using the browser Print command (Ctrl/Cmd+P).');
      }
    });
  }

  /* ---------- Particle canvas background (simple, performant) ---------- */

  function initParticles() {
    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      // make canvas small and invisible to reduce motion
      canvas.style.opacity = '0';
      return;
    }
    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', debounce(resize, 120));

    // Simple particles
    const particles = [];
    const MAX = Math.max(Math.floor((width * height) / (1600 * 9)), 40); // scale with screen
    for (let i = 0; i < MAX; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 2.2 + 0.6,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        hue: 260 + Math.random() * 80,
        alpha: 0.08 + Math.random() * 0.22
      });
    }

    function step() {
      ctx.clearRect(0, 0, width, height);
      // subtle gradient background blend overlay (keeps contrast)
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        ctx.beginPath();
        ctx.fillStyle = `hsla(${p.hue}, 70%, 60%, ${p.alpha})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);

    // add a small burst on mousemove
    let lastBurst = 0;
    window.addEventListener('mousemove', (e) => {
      const now = Date.now();
      if (now - lastBurst < 40) return;
      lastBurst = now;
      // spawn a few particles near pointer
      for (let i = 0; i < 3; i++) {
        particles.push({
          x: e.clientX + (Math.random() - 0.5) * 20,
          y: e.clientY + (Math.random() - 0.5) * 20,
          r: Math.random() * 2 + 0.6,
          vx: (Math.random() - 0.5) * 1.2,
          vy: (Math.random() - 0.5) * 1.2,
          hue: 220 + Math.random() * 120,
          alpha: 0.18 + Math.random() * 0.2
        });
      }
      // cap length
      while (particles.length > MAX * 1.6) particles.shift();
    }, { passive: true });
  }

  /* ---------- Init & lifecycle ---------- */

  function initFooterYear() {
    if (footerYear) footerYear.textContent = new Date().getFullYear();
  }

  function init() {
    // Ensure DOM elements exist
    if (!dayDropdown || !daySelectBtn || scheduleDays.length === 0) {
      console.warn('site-script: core elements missing; aborting some behaviors.');
    }

    // Set initial day
    // If last selected is present on page, use it; otherwise use the first schedule-day id
    let initial = selectedDayId;
    if (!document.getElementById(initial)) {
      initial = scheduleDays[0] ? scheduleDays[0].id : null;
    }
    setActiveDay(initial);

    // populate dropdown label if blank
    if (currentDayLabel && currentDayLabel.textContent.trim() === '') {
      const visible = scheduleDays.find(d => !d.classList.contains('hidden')) || scheduleDays[0];
      if (visible) currentDayLabel.textContent = (visible.querySelector('.week-day-label') || visible).textContent.trim();
    }

    // Live clock
    updateClock();
    setInterval(updateClock, 1000);

    // Progress updates
    updateProgress();
    // Recalculate progress every 30s (classes progress slowly but this keeps things fresh)
    setInterval(updateProgress, 30 * 1000);

    // Recalculate progress on window focus (useful if tab was hidden)
    window.addEventListener('focus', debouncedUpdateProgress);

    // Keyboard shortcuts: 1..5 to switch days (1=Mon ... 5=Fri), p to print
    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) return;
      if (e.key >= '1' && e.key <= '5') {
        const mapping = { '1': 'monday', '2': 'tuesday', '3': 'wednesday', '4': 'thursday', '5': 'friday' };
        setActiveDay(mapping[e.key]);
      } else if (e.key.toLowerCase() === 'p') {
        // quick print
        window.print();
      } else if (e.key === '?') {
        // show tiny help (non-blocking)
        // eslint-disable-next-line no-console
        console.info('Shortcuts: 1-5 switch days, P = print, ? = this help.');
      }
    });

    // initialize dropdown keyboard navigation focusability (already set in markup)
    dropdownItems.forEach(item => item.setAttribute('role', 'button'));

    // init print hooks already set above

    // init particles (won't run if prefers-reduced-motion)
    initParticles();

    // Ensure lucide icons autopopulate if present
    try { window.lucide && window.lucide.createIcons && window.lucide.createIcons(); } catch (e) { /* ignore */ }

    initFooterYear();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ---------- Expose a tiny API on window for debugging / testing (non-enumerable) ---------- */
  try {
    Object.defineProperty(window, '__planner', {
      value: {
        setActiveDay,
        updateProgress,
        parseRange,
        parseTimeToToday
      },
      writable: false,
      configurable: true,
      enumerable: false
    });
  } catch (e) {
    // ignore (some cross-origin pages restrict)
  }
})();
