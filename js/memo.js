// memo.js - 메모 CRUD 및 Bottom Sheet 관리
const Memo = {
  currentDate: null,
  currentMemoId: null,
  currentCategory: 'schedule',
  isEditing: false,

  init() {
    this._bindCategoryButtons();
    this._bindForm();
    this._bindClose();
  },

  // 새 메모 작성 열기
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
    document.getElementById('memoDelete').style.display = 'none';

    this._setCategory('schedule');
    this._openSheet();

    setTimeout(() => document.getElementById('memoTitle').focus(), 350);
  },

  // 메모 수정 열기
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
    document.getElementById('memoDelete').style.display = 'block';

    this._setCategory(memo.category);
    this._openSheet();
  },

  // 해당 날짜 메모가 여러 개일 때 - 목록 보여주기 (첫번째 메모 편집으로 열기)
  showDayMemos(dateStr) {
    const memos = Storage.getMemos(dateStr);
    if (memos.length === 1) {
      this.openEdit(dateStr, memos[0].id);
    } else if (memos.length > 1) {
      // 여러 개면 첫번째 열기 (향후 목록 UI 추가 가능)
      this.openEdit(dateStr, memos[0].id);
    }
  },

  // 메모 저장
  _save() {
    const dateStr = document.getElementById('memoDateDisplay').value;
    const title = document.getElementById('memoTitle').value.trim();
    const content = document.getElementById('memoContent').value.trim();
    const time = document.getElementById('memoTime').value;
    const reminder = document.getElementById('memoReminder').value;

    if (!title) {
      document.getElementById('memoTitle').focus();
      return;
    }

    const memoData = {
      title,
      content,
      category: this.currentCategory,
      time: time || '',
      reminder,
      done: false
    };

    if (this.isEditing && this.currentMemoId) {
      // 날짜가 변경되었으면 newDate 추가
      if (dateStr !== this.currentDate) {
        memoData.newDate = dateStr;
      }
      Storage.updateMemo(this.currentDate, this.currentMemoId, memoData);
    } else {
      Storage.addMemo(dateStr, memoData);
    }

    this._closeSheet();
    Calendar.refresh();
    NotificationManager.scheduleCheck();
  },

  // 메모 삭제
  _delete() {
    if (!this.currentDate || !this.currentMemoId) return;
    Storage.deleteMemo(this.currentDate, this.currentMemoId);
    this._closeSheet();
    Calendar.refresh();
  },

  _setCategory(cat) {
    this.currentCategory = cat;
    document.querySelectorAll('.cat-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.cat === cat);
    });
  },

  _openSheet() {
    document.getElementById('overlay').classList.add('active');
    document.getElementById('bottomSheet').classList.add('active');
  },

  _closeSheet() {
    document.getElementById('overlay').classList.remove('active');
    document.getElementById('bottomSheet').classList.remove('active');
  },

  _bindCategoryButtons() {
    document.querySelectorAll('.cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._setCategory(btn.dataset.cat);
      });
    });
  },

  _bindForm() {
    document.getElementById('memoForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this._save();
    });

    document.getElementById('memoDelete').addEventListener('click', () => {
      this._delete();
    });
  },

  _bindClose() {
    document.getElementById('sheetClose').addEventListener('click', () => this._closeSheet());
    document.getElementById('overlay').addEventListener('click', () => this._closeSheet());
  }
};
