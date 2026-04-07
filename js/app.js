// app.js - 앱 초기화, 테마, 검색, 설정, 이벤트 바인딩
(function() {
  'use strict';

  // Apply saved theme & colors
  const settings = Storage.getSettings();
  applyTheme(settings.theme);
  applyColors(settings.colors);

  // Initialize modules
  Calendar.init();
  Memo.init();
  NotificationManager.init();
  Weather.fetchWeather();

  // Navigation
  document.getElementById('prevMonth').addEventListener('click', () => Calendar.prev());
  document.getElementById('nextMonth').addEventListener('click', () => Calendar.next());
  document.getElementById('todayBtn').addEventListener('click', () => Calendar.goToday());

  // View toggle
  document.getElementById('monthViewBtn').addEventListener('click', () => Calendar.setView('month'));
  document.getElementById('weekViewBtn').addEventListener('click', () => Calendar.setView('week'));

  // FAB
  document.getElementById('fabBtn').addEventListener('click', () => {
    const dateStr = Calendar.selectedDate || Calendar._formatDate(new Date());
    Memo.openNew(dateStr);
  });

  // Search
  const searchInput = document.getElementById('searchInput');
  const searchClear = document.getElementById('searchClear');
  let searchTimer;

  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    const q = searchInput.value.trim();
    searchClear.style.display = q ? '' : 'none';
    searchTimer = setTimeout(() => Calendar.renderSearchResults(q), 300);
  });

  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchClear.style.display = 'none';
    Calendar.renderSearchResults('');
  });

  // Theme toggle
  document.getElementById('themeToggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    const s = Storage.getSettings();
    s.theme = next;
    Storage.saveSettings(s);
  });

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.getElementById('themeToggle').textContent = theme === 'dark' ? '☀️' : '🌙';
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    metaTheme.content = theme === 'dark' ? '#1a1a1a' : '#f5f5f5';
  }

  // Custom colors
  function applyColors(colors) {
    if (!colors) return;
    const root = document.documentElement.style;
    if (colors.schedule) root.setProperty('--schedule', colors.schedule);
    if (colors.idea) root.setProperty('--idea', colors.idea);
    if (colors.todo) root.setProperty('--todo', colors.todo);
  }

  // Settings panel
  document.getElementById('settingsBtn').addEventListener('click', () => {
    const s = Storage.getSettings();
    document.getElementById('colorSchedule').value = s.colors?.schedule || '#4a9eff';
    document.getElementById('colorIdea').value = s.colors?.idea || '#ffd700';
    document.getElementById('colorTodo').value = s.colors?.todo || '#ff4444';
    document.getElementById('overlay').classList.add('active');
    document.getElementById('settingsSheet').classList.add('active');
  });

  document.getElementById('settingsClose').addEventListener('click', () => {
    document.getElementById('overlay').classList.remove('active');
    document.getElementById('settingsSheet').classList.remove('active');
  });

  // Save colors
  document.getElementById('saveColors').addEventListener('click', () => {
    const colors = {
      schedule: document.getElementById('colorSchedule').value,
      idea: document.getElementById('colorIdea').value,
      todo: document.getElementById('colorTodo').value
    };
    const s = Storage.getSettings();
    s.colors = colors;
    Storage.saveSettings(s);
    applyColors(colors);
    Calendar.refresh();
  });

  // Export
  document.getElementById('exportData').addEventListener('click', () => {
    Storage.exportData();
  });

  // Import
  document.getElementById('importData').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (Storage.importData(ev.target.result)) {
        const s = Storage.getSettings();
        applyTheme(s.theme);
        applyColors(s.colors);
        Calendar.refresh();
        alert('데이터를 가져왔습니다!');
      } else {
        alert('파일 형식이 올바르지 않습니다.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  // Touch swipe
  let touchStartX = 0;
  const calEl = document.querySelector('.calendar');
  calEl.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
  calEl.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 60) { diff > 0 ? Calendar.next() : Calendar.prev(); }
  }, { passive: true });

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (document.getElementById('bottomSheet').classList.contains('active')) return;
    if (e.key === 'ArrowLeft') Calendar.prev();
    if (e.key === 'ArrowRight') Calendar.next();
  });

  // Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

})();
