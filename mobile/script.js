const dropdownBtn = document.getElementById('dayDropdownBtn');
const dropdownMenu = document.getElementById('dayDropdown');
const scheduleDays = document.querySelectorAll('.schedule-day');

dropdownBtn.addEventListener('click', () => {
  dropdownMenu.classList.toggle('hidden');
});

dropdownMenu.addEventListener('click', e => {
  if (e.target.classList.contains('dropdown-item')) {
    const day = e.target.dataset.day;
    scheduleDays.forEach(d => d.classList.remove('active'));
    const selectedDay = document.getElementById(`day-${day}`);
    if (selectedDay) selectedDay.classList.add('active');
    dropdownBtn.textContent = `${day} ▾`;
    dropdownMenu.classList.add('hidden');
  }
});

// Optional: close dropdown if clicked outside
document.addEventListener('click', e => {
  if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
    dropdownMenu.classList.add('hidden');
  }
});
