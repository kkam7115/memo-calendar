// calendar.js - 캘린더 렌더링 및 월별 스케줄 목록
const Calendar = {
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth(),
  selectedDate: null,
  MAX_MINI_MEMOS: 2,

  MONTH_NAMES: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
                'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],

  init() {
    this.selectedDate = this._formatDate(new Date());
    this.render();
    this.renderScheduleList();
  },

  prev() {
    this.currentMonth--;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    this.render();
    this.renderScheduleList();
  },

  next() {
    this.currentMonth++;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this.render();
    this.renderScheduleList();
  },

  render() {
    // Update title
    const titleEl = document.getElementById('monthTitle');
    titleEl.textContent = `${this.MONTH_NAMES[this.currentMonth]} ${this.currentYear}`;

    const container = document.getElementById('calendarDays');
    container.innerHTML = '';

    const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(this.currentYear, this.currentMonth, 0).getDate();

    const today = new Date();
    const todayStr = this._formatDate(today);

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const prevMonth = this.currentMonth === 0 ? 11 : this.currentMonth - 1;
      const prevYear = this.currentMonth === 0 ? this.currentYear - 1 : this.currentYear;
      const dateStr = this._formatDateParts(prevYear, prevMonth, day);
      container.appendChild(this._createDayEl(day, dateStr, true));
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = this._formatDateParts(this.currentYear, this.currentMonth, d);
      const dayEl = this._createDayEl(d, dateStr, false);

      const dayOfWeek = new Date(this.currentYear, this.currentMonth, d).getDay();
      if (dayOfWeek === 0) dayEl.classList.add('sunday');
      if (dayOfWeek === 6) dayEl.classList.add('saturday');
      if (dateStr === todayStr) dayEl.classList.add('today');
      if (dateStr === this.selectedDate) dayEl.classList.add('selected');

      container.appendChild(dayEl);
    }

    // Next month days (fill to complete grid)
    const totalCells = container.children.length;
    const remaining = totalCells <= 35 ? 35 - totalCells : 42 - totalCells;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = this.currentMonth === 11 ? 0 : this.currentMonth + 1;
      const nextYear = this.currentMonth === 11 ? this.currentYear + 1 : this.currentYear;
      const dateStr = this._formatDateParts(nextYear, nextMonth, d);
      container.appendChild(this._createDayEl(d, dateStr, true));
    }
  },

  _createDayEl(day, dateStr, isOtherMonth) {
    const el = document.createElement('div');
    el.className = 'day' + (isOtherMonth ? ' other-month' : '');
    el.dataset.date = dateStr;

    // Day number
    const numEl = document.createElement('div');
    numEl.className = 'day-number';
    numEl.textContent = day;
    el.appendChild(numEl);

    // Mini memos
    const memos = Storage.getMemos(dateStr);
    if (memos.length > 0) {
      const miniContainer = document.createElement('div');
      miniContainer.className = 'mini-memos';

      const showCount = Math.min(memos.length, this.MAX_MINI_MEMOS);
      for (let i = 0; i < showCount; i++) {
        const miniEl = document.createElement('div');
        miniEl.className = 'mini-memo ' + memos[i].category;
        if (memos[i].done) miniEl.classList.add('done');
        miniEl.textContent = memos[i].title;
        miniContainer.appendChild(miniEl);
      }

      if (memos.length > this.MAX_MINI_MEMOS) {
        const moreEl = document.createElement('div');
        moreEl.className = 'memo-more';
        moreEl.textContent = `+${memos.length - this.MAX_MINI_MEMOS}`;
        miniContainer.appendChild(moreEl);
      }

      el.appendChild(miniContainer);
    }

    // Click handler
    el.addEventListener('click', () => {
      this.selectDate(dateStr);
    });

    return el;
  },

  selectDate(dateStr) {
    this.selectedDate = dateStr;

    // Update selected visual
    document.querySelectorAll('.day.selected').forEach(el => el.classList.remove('selected'));
    const dayEl = document.querySelector(`.day[data-date="${dateStr}"]`);
    if (dayEl) dayEl.classList.add('selected');

    // Open memo list or create new
    const memos = Storage.getMemos(dateStr);
    if (memos.length > 0) {
      Memo.showDayMemos(dateStr);
    } else {
      Memo.openNew(dateStr);
    }
  },

  renderScheduleList() {
    const container = document.getElementById('scheduleList');
    const yearMonth = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}`;
    const memos = Storage.getMonthMemos(yearMonth);

    if (memos.length === 0) {
      container.innerHTML = '<div class="empty-state">이번 달 일정이 없습니다</div>';
      return;
    }

    container.innerHTML = '';
    memos.forEach(memo => {
      const day = parseInt(memo.date.split('-')[2]);
      const month = parseInt(memo.date.split('-')[1]);

      const item = document.createElement('div');
      item.className = 'schedule-item' + (memo.done ? ' done' : '');
      item.dataset.date = memo.date;
      item.dataset.id = memo.id;

      let html = '';

      // Checkbox for todos
      if (memo.category === 'todo') {
        html += `<div class="todo-check ${memo.done ? 'checked' : ''}" data-date="${memo.date}" data-id="${memo.id}"></div>`;
      } else {
        html += `<div class="schedule-dot ${memo.category}"></div>`;
      }

      html += `<span class="schedule-date">${month}/${day}</span>`;
      html += `<span class="schedule-text">${this._escapeHtml(memo.title)}</span>`;
      if (memo.time) {
        html += `<span class="schedule-time">${memo.time}</span>`;
      }

      item.innerHTML = html;

      // Click to edit (not on checkbox)
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('todo-check')) return;
        Memo.openEdit(memo.date, memo.id);
      });

      // Checkbox toggle
      const checkbox = item.querySelector('.todo-check');
      if (checkbox) {
        checkbox.addEventListener('click', (e) => {
          e.stopPropagation();
          Storage.toggleDone(memo.date, memo.id);
          this.render();
          this.renderScheduleList();
        });
      }

      container.appendChild(item);
    });
  },

  refresh() {
    this.render();
    this.renderScheduleList();
  },

  _formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  _formatDateParts(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  },

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};
