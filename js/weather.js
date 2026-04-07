// weather.js - Open-Meteo API (무료, API키 불필요)
const Weather = {
  cached: null,
  cacheTime: 0,
  CACHE_DURATION: 30 * 60 * 1000, // 30분

  WMO_ICONS: {
    0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
    45: '🌫️', 48: '🌫️',
    51: '🌦️', 53: '🌦️', 55: '🌧️',
    61: '🌧️', 63: '🌧️', 65: '🌧️',
    71: '🌨️', 73: '🌨️', 75: '❄️',
    77: '❄️', 80: '🌦️', 81: '🌧️', 82: '⛈️',
    85: '🌨️', 86: '❄️',
    95: '⛈️', 96: '⛈️', 99: '⛈️'
  },

  async fetchWeather() {
    // 캐시 확인
    if (this.cached && (Date.now() - this.cacheTime) < this.CACHE_DURATION) {
      this._display(this.cached);
      return;
    }

    try {
      // 위치 가져오기
      const pos = await this._getPosition();
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.current) {
        this.cached = {
          temp: Math.round(data.current.temperature_2m),
          code: data.current.weather_code
        };
        this.cacheTime = Date.now();
        this._display(this.cached);
      }
    } catch {
      // 위치 권한 거부 또는 네트워크 오류 시 기본값
      document.getElementById('weatherIcon').textContent = '🌡️';
      document.getElementById('weatherTemp').textContent = '--°';
    }
  },

  _display(weather) {
    const icon = this.WMO_ICONS[weather.code] || '🌡️';
    document.getElementById('weatherIcon').textContent = icon;
    document.getElementById('weatherTemp').textContent = weather.temp + '°';
  },

  _getPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('No geolocation'));
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 600000 // 10분 캐시
      });
    });
  }
};
