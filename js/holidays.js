// holidays.js - 한국 공휴일 데이터
const Holidays = {
  // 양력 고정 공휴일
  fixed: {
    '01-01': '신정',
    '03-01': '삼일절',
    '05-05': '어린이날',
    '06-06': '현충일',
    '08-15': '광복절',
    '10-03': '개천절',
    '10-09': '한글날',
    '12-25': '크리스마스'
  },

  // 음력 기반 공휴일 (년도별 양력 변환 - 2024~2030)
  lunar: {
    2024: {
      '02-09': '설날 연휴', '02-10': '설날', '02-11': '설날 연휴', '02-12': '대체공휴일',
      '04-10': '부처님오신날',
      '09-16': '추석 연휴', '09-17': '추석', '09-18': '추석 연휴'
    },
    2025: {
      '01-28': '설날 연휴', '01-29': '설날', '01-30': '설날 연휴',
      '05-05': '부처님오신날',
      '10-05': '추석 연휴', '10-06': '추석', '10-07': '추석 연휴', '10-08': '대체공휴일'
    },
    2026: {
      '02-16': '설날 연휴', '02-17': '설날', '02-18': '설날 연휴',
      '05-24': '부처님오신날',
      '09-24': '추석 연휴', '09-25': '추석', '09-26': '추석 연휴'
    },
    2027: {
      '02-06': '설날 연휴', '02-07': '설날', '02-08': '설날 연휴', '02-09': '대체공휴일',
      '05-13': '부처님오신날',
      '09-14': '추석 연휴', '09-15': '추석', '09-16': '추석 연휴'
    },
    2028: {
      '01-26': '설날 연휴', '01-27': '설날', '01-28': '설날 연휴',
      '05-02': '부처님오신날',
      '10-02': '추석 연휴', '10-03': '추석', '10-04': '추석 연휴'
    },
    2029: {
      '02-12': '설날 연휴', '02-13': '설날', '02-14': '설날 연휴',
      '05-20': '부처님오신날',
      '09-21': '추석 연휴', '09-22': '추석', '09-23': '추석 연휴'
    },
    2030: {
      '02-02': '설날 연휴', '02-03': '설날', '02-04': '설날 연휴',
      '05-09': '부처님오신날',
      '09-11': '추석 연휴', '09-12': '추석', '09-13': '추석 연휴'
    }
  },

  // 특정 날짜가 공휴일인지 확인
  getHoliday(dateStr) {
    const parts = dateStr.split('-');
    const year = parseInt(parts[0]);
    const monthDay = parts[1] + '-' + parts[2];

    // 양력 공휴일 확인
    if (this.fixed[monthDay]) return this.fixed[monthDay];

    // 음력 기반 공휴일 확인
    const yearHolidays = this.lunar[year];
    if (yearHolidays && yearHolidays[monthDay]) return yearHolidays[monthDay];

    return null;
  },

  // 특정 월의 모든 공휴일 반환
  getMonthHolidays(year, month) {
    const holidays = {};
    const mm = String(month + 1).padStart(2, '0');

    // 양력 고정
    for (const [md, name] of Object.entries(this.fixed)) {
      if (md.startsWith(mm + '-')) {
        const dateStr = `${year}-${md}`;
        holidays[dateStr] = name;
      }
    }

    // 음력 기반
    const yearHolidays = this.lunar[year];
    if (yearHolidays) {
      for (const [md, name] of Object.entries(yearHolidays)) {
        if (md.startsWith(mm + '-')) {
          const dateStr = `${year}-${md}`;
          holidays[dateStr] = name;
        }
      }
    }

    return holidays;
  }
};
