// memo.js - 메모 CRUD, 날짜별 목록, 반복일정
const Memo = {
  currentDate: null,
  currentMemoId: null,
  currentCategory: 'schedule',
  isEditing: false,

  init() {
    this._bindCategoryButtons();
    this._bindForm();
    this._bindClose();
    this._bindRepeat();
    this._bindDayMemoSheet();
  },

  openNew(dateStr) {
    this.isEditing = false;
    this.currentDate = dateStr;
    this.currentMemoId = null;
    this.currentCategory = 'schedule';

    document.getElementById('sheetTitle').textContent = '새 메모';
    document.getElementById('memoId').value = '';
    document.getElementById('memoDateDisplay').value = dateStr;
    document.getElementById('memoTitle').value = '';
    document.getElementById('memoContent').value = '';
    document.getElementById('memoTime').value = '';
    document.getElementById('memoReminder').value = '1week';
    document.getElementById('memoRepeat').value = 'none';
    document.getElementById('memoRepeatEnd').value = '';
    document.getElementById('repeatEndGroup').style.display = 'none';
    document.getElementById('memoDelete').style.display = 'none';

    this._setCategory('schedule');
    this._closeDayMemoSheet();
    this._openSheet('bottomSheet');

    setTimeout(() => document.getElementById('memoTitle').focus(), 350);
  },

  openEdit(dateStr, memoId) {
    const memos = Storage.getMemos(dateStr);
    const memo = memos.find(m => m.id === memoId);
    if (!memo) return;

    this.isEditing = true;
    this.currentDate = dateStr;
    this.currentMemoId = memoId;
    this.currentCategory = memo.category;

    document.getElementById('sheetTitle').textContent = '메모 수정';
    document.getElementById('memoId').value = memoId;
    document.getElementById('memoDateDisplay').value = dateStr;
    document.getElementById('memoTitle').value = memo.title || '';
    document.getElementById('memoContent').value = memo.content || '';
    document.getElementById('memoTime').value = memo.time || '';
    document.getElementById('memoReminder').value = memo.reminder || 'none';
    document.getElementById('memoRepeat').value = 'none';
    document.getElementById('memoRepeatEnd').value = '';
    document.getElementById('repeatEndGroup').style.display = 'none';
    document.getElementById('memoDelete').style.display = 'block';

    // 할일 완료 버튼 표시
    const doneBtn = document.getElementById('memoDone');
    if (memo.category === 'todo') {
      doneBtn.style.display = 'block';
      doneBtn.textContent = memo.done ? '↩ 미완료' : '✓ 완료';
      doneBtn.className = memo.done ? 'btn btn-delete' : 'btn btn-done';
    } else {
      doneBtn.style.display = 'none';
    }

    this._setCategory(memo.category);
    this._closeDayMemoSheet();
    this._openSheet('bottomSheet');
  },

  // 날짜별 메모 목록 모달
  showDayMemoList(dateStr) {
    const memos = Storage.getMemos(dateStr);
    if (memos.length === 0) return;

    const parts = dateStr.split('-');
    document.getElementById('dayMemoTitle').textContent =
      `${parseInt(parts[1])}월 ${parseInt(parts[2])}일 메모`;

    const list = document.getElementById('dayMemoList');
    list.innerHTML = '';

    memos.forEach(memo => {
      const item = document.createElement('div');
      item.className = 'day-memo-item' + (memo.done ? ' done' : '');

      let html = '';
      if (memo.category === 'todo') {
        html += `<div class="todo-check ${memo.done ? 'checked' : ''}" data-date="${dateStr}" data-id="${memo.id}"></div>`;
      } else {
        html += `<div class="schedule-dot ${memo.category}"></div>`;
      }
      html += `<div class="day-memo-info">`;
      html += `<span class="day-memo-text">${Calendar._escapeHtml(memo.title)}</span>`;
      if (memo.time) html += `<span class="day-memo-time">${memo.time}</span>`;
      if (memo.content) html += `<span class="day-memo-desc">${Calendar._escapeHtml(memo.content)}</span>`;
      html += `</div>`;

      item.innerHTML = html;

      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('todo-check')) return;
        this.openEdit(dateStr, memo.id);
      });

      const checkbox = item.querySelector('.todo-check');
      if (checkbox) {
        checkbox.addEventListener('click', (e) => {
          e.stopPropagation();
          Storage.toggleDone(dateStr, memo.id);
          Calendar.refresh();
          this.showDayMemoList(dateStr);
        });
      }

      list.appendChild(item);
    });

    // "새 메모 추가" 버튼의 날짜 설정
    document.getElementById('dayMemoAdd').onclick = () => {
      this.openNew(dateStr);
    };

    this._openSheet('dayMemoSheet');
  },

  _save() {
    const dateStr = document.getElementById('memoDateDisplay').value;
    const title = document.getElementById('memoTitle').value.trim();
    const content = document.getElementById('memoContent').value.trim();
    const time = document.getElementById('memoTime').value;
    const reminder = document.getElementById('memoReminder').value;
    const repeat = document.getElementById('memoRepeat').value;
    const repeatEnd = document.getElementById('memoRepeatEnd').value;

    if (!title) { document.getElementById('memoTitle').focus(); return; }

    const memoData = {
      title, content,
      category: this.currentCategory,
      time: time || '',
      reminder,
      done: false
    };

    if (this.isEditing && this.currentMemoId) {
      if (dateStr !== this.currentDate) memoData.newDate = dateStr;
      Storage.updateMemo(this.currentDate, this.currentMemoId, memoData);
    } else if (repeat !== 'none') {
      Storage.createRepeating(dateStr, memoData, repeat, repeatEnd);
    } else {
      Storage.addMemo(dateStr, memoData);
    }

    this._closeSheet('bottomSheet');
    Calendar.refresh();
    NotificationManager.scheduleCheck();
  },

  _delete() {
    if (!this.currentDate || !this.currentMemoId) return;
    Storage.deleteMemo(this.currentDate, this.currentMemoId);
    this._closeSheet('bottomSheet');
    Calendar.refresh();
  },

  _setCategory(cat) {
    this.currentCategory = cat;
    document.querySelectorAll('.cat-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.cat === cat);
    });
  },

  _openSheet(id) {
    document.getElementById('overlay').classList.add('active');
    document.getElementById(id).classList.add('active');
  },

  _closeSheet(id) {
    document.getElementById('overlay').classList.remove('active');
    document.getElementById(id).classList.remove('active');
  },

  _closeDayMemoSheet() {
    document.getElementById('dayMemoSheet').classList.remove('active');
  },

  _closeAll() {
    document.getElementById('overlay').classList.remove('active');
    document.getElementById('bottomSheet').classList.remove('active');
    document.getElementById('dayMemoSheet').classList.remove('active');
    document.getElementById('settingsSheet').classList.remove('active');
  },

  _bindCategoryButtons() {
    document.querySelectorAll('.cat-btn').forEach(btn => {
      btn.addEventListener('click', () => this._setCategory(btn.dataset.cat));
    });
  },

  _bindForm() {
    document.getElementById('memoForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this._save();
    });
    document.getElementById('memoDelete').addEventListener('click', () => this._delete());

    document.getElementById('memoDone').addEventListener('click', () => {
      if (this.currentDate && this.currentMemoId) {
        Storage.toggleDone(this.currentDate, this.currentMemoId);
        this._closeSheet('bottomSheet');
        Calendar.refresh();
      }
    });
  },

  _bindClose() {
    document.getElementById('sheetClose').addEventListener('click', () => this._closeSheet('bottomSheet'));
    document.getElementById('overlay').addEventListener('click', () => this._closeAll());
  },

  _bindRepeat() {
    document.getElementById('memoRepeat').addEventListener('change', (e) => {
      document.getElementById('repeatEndGroup').style.display =
        e.target.value !== 'none' ? '' : 'none';
    });
  },

  _bindDayMemoSheet() {
    document.getElementById('dayMemoClose').addEventListener('click', () => {
      this._closeSheet('dayMemoSheet');
    });
  }
};
