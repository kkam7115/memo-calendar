// storage.js - localStorage 기반 데이터 관리
const Storage = {
  KEY: 'memo-calendar-data',
  SETTINGS_KEY: 'memo-calendar-settings',

  _getData() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || {}; }
    catch { return {}; }
  },

  _saveData(data) {
    localStorage.setItem(this.KEY, JSON.stringify(data));
  },

  getMemos(dateStr) {
    return this._getData()[dateStr] || [];
  },

  getMonthMemos(yearMonth) {
    const data = this._getData();
    const memos = [];
    for (const [dateStr, items] of Object.entries(data)) {
      if (dateStr.startsWith(yearMonth)) {
        items.forEach(item => memos.push({ ...item, date: dateStr }));
      }
    }
    memos.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      if (a.time && b.time) return a.time.localeCompare(b.time);
      if (a.time) return -1;
      if (b.time) return 1;
      return 0;
    });
    return memos;
  },

  getWeekMemos(startDate) {
    const data = this._getData();
    const memos = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = this._formatDate(d);
      if (data[dateStr]) {
        data[dateStr].forEach(item => memos.push({ ...item, date: dateStr }));
      }
    }
    memos.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      if (a.time && b.time) return a.time.localeCompare(b.time);
      return 0;
    });
    return memos;
  },

  getAllMemos() {
    const data = this._getData();
    const memos = [];
    for (const [dateStr, items] of Object.entries(data)) {
      items.forEach(item => memos.push({ ...item, date: dateStr }));
    }
    return memos;
  },

  searchMemos(query) {
    if (!query || query.length < 1) return [];
    const q = query.toLowerCase();
    const data = this._getData();
    const results = [];
    for (const [dateStr, items] of Object.entries(data)) {
      items.forEach(item => {
        if ((item.title && item.title.toLowerCase().includes(q)) ||
            (item.content && item.content.toLowerCase().includes(q))) {
          results.push({ ...item, date: dateStr });
        }
      });
    }
    results.sort((a, b) => b.date.localeCompare(a.date));
    return results;
  },

  addMemo(dateStr, memo) {
    const data = this._getData();
    if (!data[dateStr]) data[dateStr] = [];
    memo.id = this._generateId();
    memo.createdAt = new Date().toISOString();
    data[dateStr].push(memo);
    this._saveData(data);
    return memo;
  },

  updateMemo(dateStr, memoId, updates) {
    const data = this._getData();
    const memos = data[dateStr];
    if (!memos) return null;
    const idx = memos.findIndex(m => m.id === memoId);
    if (idx === -1) return null;

    if (updates.newDate && updates.newDate !== dateStr) {
      const memo = { ...memos[idx], ...updates };
      delete memo.newDate;
      memos.splice(idx, 1);
      if (memos.length === 0) delete data[dateStr];
      if (!data[updates.newDate]) data[updates.newDate] = [];
      data[updates.newDate].push(memo);
      this._saveData(data);
      return memo;
    }

    memos[idx] = { ...memos[idx], ...updates };
    this._saveData(data);
    return memos[idx];
  },

  deleteMemo(dateStr, memoId) {
    const data = this._getData();
    const memos = data[dateStr];
    if (!memos) return false;
    const idx = memos.findIndex(m => m.id === memoId);
    if (idx === -1) return false;
    memos.splice(idx, 1);
    if (memos.length === 0) delete data[dateStr];
    this._saveData(data);
    return true;
  },

  toggleDone(dateStr, memoId) {
    const data = this._getData();
    const memos = data[dateStr];
    if (!memos) return null;
    const memo = memos.find(m => m.id === memoId);
    if (!memo) return null;
    memo.done = !memo.done;
    this._saveData(data);
    return memo;
  },

  // 반복 일정 생성
  createRepeating(startDate, memo, repeatType, endDate) {
    const start = new Date(startDate + 'T00:00:00');
    const end = endDate ? new Date(endDate + 'T00:00:00') : new Date(start);
    if (!endDate) {
      // 기본 3개월
      end.setMonth(end.getMonth() + 3);
    }

    const dates = [];
    const current = new Date(start);

    while (current <= end) {
      dates.push(this._formatDate(current));
      switch (repeatType) {
        case 'daily': current.setDate(current.getDate() + 1); break;
        case 'weekly': current.setDate(current.getDate() + 7); break;
        case 'biweekly': current.setDate(current.getDate() + 14); break;
        case 'monthly': current.setMonth(current.getMonth() + 1); break;
        default: return;
      }
    }

    dates.forEach(dateStr => {
      this.addMemo(dateStr, { ...memo });
    });
  },

  // 월별 통계
  getMonthStats(yearMonth) {
    const memos = this.getMonthMemos(yearMonth);
    const stats = { schedule: 0, idea: 0, todo: 0, todoDone: 0, total: 0 };
    memos.forEach(m => {
      stats.total++;
      if (m.category === 'schedule') stats.schedule++;
      else if (m.category === 'idea') stats.idea++;
      else if (m.category === 'todo') {
        stats.todo++;
        if (m.done) stats.todoDone++;
      }
    });
    return stats;
  },

  // 설정
  getSettings() {
    try {
      return JSON.parse(localStorage.getItem(this.SETTINGS_KEY)) || {
        theme: 'dark',
        colors: { schedule: '#4a9eff', idea: '#ffd700', todo: '#ff4444' }
      };
    } catch {
      return { theme: 'dark', colors: { schedule: '#4a9eff', idea: '#ffd700', todo: '#ff4444' } };
    }
  },

  saveSettings(settings) {
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
  },

  // 백업/복원
  exportData() {
    const data = {
      memos: this._getData(),
      settings: this.getSettings(),
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memo-calendar-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importData(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (data.memos) {
        localStorage.setItem(this.KEY, JSON.stringify(data.memos));
      }
      if (data.settings) {
        localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(data.settings));
      }
      return true;
    } catch {
      return false;
    }
  },

  getNotifDismissed() { return localStorage.getItem('notif-dismissed') === 'true'; },
  setNotifDismissed() { localStorage.setItem('notif-dismissed', 'true'); },

  _generateId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); },
  _formatDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
};
