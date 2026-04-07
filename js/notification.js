// notification.js - 웹 푸시 알림 관리
const NotificationManager = {
  checkInterval: null,

  init() {
    // 알림 권한 배너 표시 여부
    if ('Notification' in window && Notification.permission === 'default' && !Storage.getNotifDismissed()) {
      setTimeout(() => {
        document.getElementById('notifBanner').style.display = 'flex';
      }, 2000);
    }

    // 알림 허용 버튼
    document.getElementById('notifAllow').addEventListener('click', () => {
      this.requestPermission();
    });

    // 알림 닫기 버튼
    document.getElementById('notifDismiss').addEventListener('click', () => {
      document.getElementById('notifBanner').style.display = 'none';
      Storage.setNotifDismissed();
    });

    // 이미 허용된 경우 주기적 체크 시작
    if ('Notification' in window && Notification.permission === 'granted') {
      this.startChecking();
    }

    // 앱 열 때 즉시 체크
    this.scheduleCheck();
  },

  async requestPermission() {
    if (!('Notification' in window)) return;

    const permission = await Notification.requestPermission();
    document.getElementById('notifBanner').style.display = 'none';

    if (permission === 'granted') {
      this.startChecking();
      this._showNotification('메모 캘린더', '알림이 활성화되었습니다!');
    }
  },

  startChecking() {
    // 매 분마다 알림 체크
    if (this.checkInterval) clearInterval(this.checkInterval);
    this.checkInterval = setInterval(() => this.scheduleCheck(), 60000);
  },

  scheduleCheck() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const now = new Date();
    const todayStr = this._formatDate(now);
    const allMemos = Storage.getAllMemos();

    allMemos.forEach(memo => {
      if (memo.reminder === 'none' || memo.done) return;

      const memoDate = new Date(memo.date + 'T00:00:00');
      const reminderDate = this._getReminderDate(memoDate, memo.reminder);
      const reminderStr = this._formatDate(reminderDate);

      // 오늘이 알림 날짜인 경우
      if (reminderStr === todayStr) {
        const notifKey = `notified-${memo.id}-${reminderStr}`;
        if (!localStorage.getItem(notifKey)) {
          const daysUntil = Math.round((memoDate - now) / (1000 * 60 * 60 * 24));
          let body = memo.title;
          if (daysUntil > 0) {
            body += ` (${daysUntil}일 후)`;
          } else if (daysUntil === 0) {
            body += ' (오늘)';
          }
          if (memo.time) body += ` ${memo.time}`;

          this._showNotification('메모 캘린더', body);
          localStorage.setItem(notifKey, 'true');
        }
      }
    });
  },

  _getReminderDate(memoDate, reminder) {
    const d = new Date(memoDate);
    switch (reminder) {
      case 'same': return d;
      case '1day': d.setDate(d.getDate() - 1); return d;
      case '3days': d.setDate(d.getDate() - 3); return d;
      case '1week': d.setDate(d.getDate() - 7); return d;
      default: return d;
    }
  },

  _showNotification(title, body) {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        vibrate: [200, 100, 200]
      });
    }
  },

  _formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
};
