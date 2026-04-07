// calendar.js - 캘린더 렌더링, 주간뷰, D-day, 통계
const Calendar = {
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth(),
  selectedDate: null,
  viewMode: 'month', // 'month' or 'week'
  weekStart: null,
  MAX_MINI_MEMOS: 2,

  MONTH_NAMES: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
                'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
  MONTH_NAMES_KR: ['1월', '2월', '3월', '4월', '5월', '6월',
                    '7월', '8월', '9월', '10월', '11월', '12월'],

  init() {
    const today = new Date();
    this.selectedDate = this._formatDate(today);
    this.weekStart = this._getWeekStart(today);
    this.render();
    this.renderScheduleList();
    this.renderStats();
  },

  goToday() {
    const today = new Date();
    this.currentYear = today.getFullYear();
    this.currentMonth = today.getMonth();
    this.selectedDate = this._formatDate(today);
    this.weekStart = this._getWeekStart(today);
    this.render();
    this.renderScheduleList();
    this.renderStats();
  },

  setView(mode) {
    this.viewMode = mode;
    document.getElementById('monthViewBtn').classList.toggle('active', mode === 'month');
    document.getElementById('weekViewBtn').classList.toggle('active', mode === 'week');
    this.render();
    this.renderScheduleList();
  },

  prev() {
    if (this.viewMode === 'week') {
      this.weekStart.setDate(this.weekStart.getDate() - 7);
      this.currentMonth = this.weekStart.getMonth();
      this.currentYear = this.weekStart.getFullYear();
    } else {
      this.currentMonth--;
      if (this.currentMonth < 0) { this.currentMonth = 11; this.currentYear--; }
    }
    this.render();
    this.renderScheduleList();
    this.renderStats();
  },

  next() {
    if (this.viewMode === 'week') {
      this.weekStart.setDate(this.weekStart.getDate() + 7);
      this.currentMonth = this.weekStart.getMonth();
      this.currentYear = this.weekStart.getFullYear();
    } else {
      this.currentMonth++;
      if (this.currentMonth > 11) { this.currentMonth = 0; this.currentYear++; }
    }
    this.render();
    this.renderScheduleList();
    this.renderStats();
  },

  render() {
    const titleEl = document.getElementById('monthTitle');
    if (this.viewMode === 'week') {
      const endOfWeek = new Date(this.weekStart);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      const sm = this.weekStart.getMonth() + 1;
      const sd = this.weekStart.getDate();
      const em = endOfWeek.getMonth() + 1;
      const ed = endOfWeek.getDate();
      titleEl.textContent = `${sm}/${sd} - ${em}/${ed}`;
      this._renderWeek();
    } else {
      titleEl.textContent = `${this.MONTH_NAMES[this.currentMonth]} ${this.currentYear}`;
      this._renderMonth();
    }
  },

  _renderMonth() {
    const container = document.getElementById('calendarDays');
    container.innerHTML = '';
    container.className = 'days';

    const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(this.currentYear, this.currentMonth, 0).getDate();
    const todayStr = this._formatDate(new Date());

    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const m = this.currentMonth === 0 ? 11 : this.currentMonth - 1;
      const y = this.currentMonth === 0 ? this.currentYear - 1 : this.currentYear;
      container.appendChild(this._createDayEl(day, this._fmtParts(y, m, day), true));
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = this._fmtParts(this.currentYear, this.currentMonth, d);
      const el = this._createDayEl(d, dateStr, false);
      const dow = new Date(this.currentYear, this.currentMonth, d).getDay();
      if (dow === 0) el.classList.add('sunday');
      if (dow === 6) el.classList.add('saturday');
      if (dateStr === todayStr) el.classList.add('today');
      if (dateStr === this.selectedDate) el.classList.add('selected');
      container.appendChild(el);
    }

    const total = container.children.length;
    const remaining = total <= 35 ? 35 - total : 42 - total;
    for (let d = 1; d <= remaining; d++) {
      const m = this.currentMonth === 11 ? 0 : this.currentMonth + 1;
      const y = this.currentMonth === 11 ? this.currentYear + 1 : this.currentYear;
      container.appendChild(this._createDayEl(d, this._fmtParts(y, m, d), true));
    }
  },

  _renderWeek() {
    const container = document.getElementById('calendarDays');
    container.innerHTML = '';
    container.className = 'days days-week';
    const todayStr = this._formatDate(new Date());

    for (let i = 0; i < 7; i++) {
      const d = new Date(this.weekStart);
      d.setDate(d.getDate() + i);
      const dateStr = this._formatDate(d);
      const el = this._createDayEl(d.getDate(), dateStr, false);
      if (d.getDay() === 0) el.classList.add('sunday');
      if (d.getDay() === 6) el.classList.add('saturday');
      if (dateStr === todayStr) el.classList.add('today');
      if (dateStr === this.selectedDate) el.classList.add('selected');
      el.classList.add('week-day');
      container.appendChild(el);
    }
  },

  _createDayEl(day, dateStr, isOtherMonth) {
    const el = document.createElement('div');
    el.className = 'day' + (isOtherMonth ? ' other-month' : '');
    el.dataset.date = dateStr;

    const numEl = document.createElement('div');
    numEl.className = 'day-number';
    numEl.textContent = day;
    el.appendChild(numEl);

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

    el.addEventListener('click', () => this.selectDate(dateStr));
    return el;
  },

  selectDate(dateStr) {
    this.selectedDate = dateStr;
    document.querySelectorAll('.day.selected').forEach(e => e.classList.remove('selected'));
    const dayEl = document.querySelector(`.day[data-date="${dateStr}"]`);
    if (dayEl) dayEl.classList.add('selected');

    const memos = Storage.getMemos(dateStr);
    if (memos.length > 1) {
      Memo.showDayMemoList(dateStr);
    } else if (memos.length === 1) {
      Memo.openEdit(dateStr, memos[0].id);
    } else {
      Memo.openNew(dateStr);
    }
  },

  renderScheduleList() {
    const container = document.getElementById('scheduleList');
    let memos;

    if (this.viewMode === 'week') {
      memos = Storage.getWeekMemos(this.weekStart);
    } else {
      const ym = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}`;
      memos = Storage.getMonthMemos(ym);
    }

    if (memos.length === 0) {
      container.innerHTML = '<div class="empty-state">일정이 없습니다</div>';
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    container.innerHTML = '';

    memos.forEach(memo => {
      const day = parseInt(memo.date.split('-')[2]);
      const month = parseInt(memo.date.split('-')[1]);
      const memoDate = new Date(memo.date + 'T00:00:00');
      const diffDays = Math.ceil((memoDate - today) / (1000 * 60 * 60 * 24));

      const item = document.createElement('div');
      item.className = 'schedule-item' + (memo.done ? ' done' : '');
      item.dataset.date = memo.date;
      item.dataset.id = memo.id;

      let html = '';
      if (memo.category === 'todo') {
        html += `<div class="todo-check ${memo.done ? 'checked' : ''}" data-date="${memo.date}" data-id="${memo.id}"></div>`;
      } else {
        html += `<div class="schedule-dot ${memo.category}"></div>`;
      }

      html += `<span class="schedule-date">${month}/${day}</span>`;
      html += `<span class="schedule-text">${this._escapeHtml(memo.title)}</span>`;

      // D-day 표시
      if (!memo.done && diffDays >= 0 && memo.category !== 'idea') {
        let ddayText = diffDays === 0 ? 'D-DAY' : `D-${diffDays}`;
        let ddayClass = diffDays === 0 ? 'dday-today' : (diffDays <= 3 ? 'dday-soon' : 'dday');
        html += `<span class="${ddayClass}">${ddayText}</span>`;
      }

      if (memo.time) html += `<span class="schedule-time">${memo.time}</span>`;

      item.innerHTML = html;

      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('todo-check')) return;
        Memo.openEdit(memo.date, memo.id);
      });

      const checkbox = item.querySelector('.todo-check');
      if (checkbox) {
        checkbox.addEventListener('click', (e) => {
          e.stopPropagation();
          Storage.toggleDone(memo.date, memo.id);
          this.refresh();
        });
      }

      container.appendChild(item);
    });
  },

  renderStats() {
    const ym = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}`;
    const stats = Storage.getMonthStats(ym);

    document.getElementById('statSchedule').textContent = stats.schedule;
    document.getElementById('statIdea').textContent = stats.idea;
    document.getElementById('statTodo').textContent = stats.todo;

    const progress = stats.todo > 0 ? Math.round((stats.todoDone / stats.todo) * 100) : 0;
    document.getElementById('statProgress').textContent = progress + '%';
    document.getElementById('progressFill').style.width = progress + '%';
  },

  renderSearchResults(query) {
    const results = Storage.searchMemos(query);
    const container = document.getElementById('searchResultList');
    const section = document.getElementById('searchResults');
    const scheduleSection = document.getElementById('scheduleSection');
    const calendarContainer = document.getElementById('calendarContainer');
    const statsBar = document.getElementById('statsBar');

    if (!query) {
      section.style.display = 'none';
      scheduleSection.style.display = '';
      calendarContainer.style.display = '';
      statsBar.style.display = '';
      return;
    }

    section.style.display = '';
    scheduleSection.style.display = 'none';
    calendarContainer.style.display = 'none';
    statsBar.style.display = 'none';

    if (results.length === 0) {
      container.innerHTML = '<div class="empty-state">검색 결과가 없습니다</div>';
      return;
    }

    container.innerHTML = '';
    results.forEach(memo => {
      const parts = memo.date.split('-');
      const item = document.createElement('div');
      item.className = 'schedule-item';

      let html = `<div class="schedule-dot ${memo.category}"></div>`;
      html += `<span class="schedule-date">${parseInt(parts[1])}/${parseInt(parts[2])}</span>`;
      html += `<span class="schedule-text">${this._escapeHtml(memo.title)}</span>`;
      if (memo.time) html += `<span class="schedule-time">${memo.time}</span>`;

      item.innerHTML = html;
      item.addEventListener('click', () => Memo.openEdit(memo.date, memo.id));
      container.appendChild(item);
    });
  },

  refresh() {
    this.render();
    this.renderScheduleList();
    this.renderStats();
  },

  _getWeekStart(date) {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    return d;
  },

  _formatDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  },

  _fmtParts(y, m, d) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  },

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};
