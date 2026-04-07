// storage.js - localStorage 기반 데이터 관리
const Storage = {
  KEY: 'memo-calendar-data',

  _getData() {
    try {
      return JSON.parse(localStorage.getItem(this.KEY)) || {};
    } catch {
      return {};
    }
  },

  _saveData(data) {
    localStorage.setItem(this.KEY, JSON.stringify(data));
  },

  // 특정 날짜의 메모 목록 반환
  getMemos(dateStr) {
    const data = this._getData();
    return data[dateStr] || [];
  },

  // 특정 월의 모든 메모 반환 (YYYY-MM 형식)
  getMonthMemos(yearMonth) {
    const data = this._getData();
    const memos = [];
    for (const [dateStr, items] of Object.entries(data)) {
      if (dateStr.startsWith(yearMonth)) {
        items.forEach(item => {
          memos.push({ ...item, date: dateStr });
        });
      }
    }
    // 날짜순 정렬, 같은 날짜는 시간순
    memos.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      if (a.time && b.time) return a.time.localeCompare(b.time);
      if (a.time) return -1;
      if (b.time) return 1;
      return 0;
    });
    return memos;
  },

  // 모든 메모 반환 (알림 체크용)
  getAllMemos() {
    const data = this._getData();
    const memos = [];
    for (const [dateStr, items] of Object.entries(data)) {
      items.forEach(item => {
        memos.push({ ...item, date: dateStr });
      });
    }
    return memos;
  },

  // 메모 추가
  addMemo(dateStr, memo) {
    const data = this._getData();
    if (!data[dateStr]) data[dateStr] = [];
    memo.id = this._generateId();
    memo.createdAt = new Date().toISOString();
    data[dateStr].push(memo);
    this._saveData(data);
    return memo;
  },

  // 메모 수정
  updateMemo(dateStr, memoId, updates) {
    const data = this._getData();
    const memos = data[dateStr];
    if (!memos) return null;
    const idx = memos.findIndex(m => m.id === memoId);
    if (idx === -1) return null;

    // 날짜가 변경된 경우
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

  // 메모 삭제
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

  // 할일 완료 토글
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

  // 날짜에 메모가 있는지 확인
  hasMemosOnDate(dateStr) {
    const data = this._getData();
    return data[dateStr] && data[dateStr].length > 0;
  },

  // 알림 설정 저장
  getNotifDismissed() {
    return localStorage.getItem('notif-dismissed') === 'true';
  },

  setNotifDismissed() {
    localStorage.setItem('notif-dismissed', 'true');
  },

  _generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
};
