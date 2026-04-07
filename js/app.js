// app.js - 앱 초기화 및 이벤트 바인딩
(function() {
  'use strict';

  // Initialize modules
  Calendar.init();
  Memo.init();
  NotificationManager.init();

  // Navigation buttons
  document.getElementById('prevMonth').addEventListener('click', () => Calendar.prev());
  document.getElementById('nextMonth').addEventListener('click', () => Calendar.next());

  // FAB button - 선택된 날짜 또는 오늘 날짜로 새 메모
  document.getElementById('fabBtn').addEventListener('click', () => {
    const dateStr = Calendar.selectedDate || Calendar._formatDate(new Date());
    Memo.openNew(dateStr);
  });

  // Touch swipe for month navigation
  let touchStartX = 0;
  let touchEndX = 0;
  const calendarEl = document.querySelector('.calendar');

  calendarEl.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  calendarEl.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 60) {
      if (diff > 0) Calendar.next();
      else Calendar.prev();
    }
  }, { passive: true });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (document.getElementById('bottomSheet').classList.contains('active')) return;
    if (e.key === 'ArrowLeft') Calendar.prev();
    if (e.key === 'ArrowRight') Calendar.next();
  });

  // Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

})();
