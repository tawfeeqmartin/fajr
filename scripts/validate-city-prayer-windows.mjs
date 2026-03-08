#!/usr/bin/env node
import puppeteer from 'puppeteer-core';

const BASE = process.env.BASE_URL || 'http://localhost:7748';
const CHROME = '/usr/bin/google-chrome-stable';

const CITIES = [
  { name:'Makkah', lat:21.4225, lon:39.8262, tz:'Asia/Riyadh' },
  { name:'London', lat:51.5074, lon:-0.1278, tz:'Europe/London' },
  { name:'New York', lat:40.7128, lon:-74.0060, tz:'America/New_York' },
  { name:'Jakarta', lat:-6.2088, lon:106.8456, tz:'Asia/Jakarta' },
  { name:'Cape Town', lat:-33.9249, lon:18.4241, tz:'Africa/Johannesburg' }
];

function toM(s){ const [h,m]=String(s||'0:0').split(':').map(Number); return ((h||0)*60+(m||0))%1440; }
function inRange(m,a,b){ return a<=b ? (m>=a&&m<b) : (m>=a||m<b); }
function prayerAt(marks,m){
  const sunrise=marks.Sunrise, dhuha=(sunrise+20)%1440;
  const sectors=[
    ['Qiyam',marks.Midnight,marks.Fajr],['Fajr',marks.Fajr,marks.Sunrise],['Sunrise',marks.Sunrise,dhuha],
    ['Dhuha',dhuha,marks.Dhuhr],['Dhuhr',marks.Dhuhr,marks.Asr],['Asr',marks.Asr,marks.Maghrib],
    ['Maghrib',marks.Maghrib,marks.Isha],['Isha',marks.Isha,marks.Midnight]
  ];
  for(const s of sectors){ if(inRange(m,s[1],s[2])) return s[0]; }
  return 'Isha';
}

(async()=>{
  const browser = await puppeteer.launch({ executablePath: CHROME, headless:'new', args:['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width:430, height:932, deviceScaleFactor:2, isMobile:true, hasTouch:true });
  await page.goto(`${BASE}/`, { waitUntil:'domcontentloaded' });
  await new Promise(r=>setTimeout(r,5500));

  let failed = false;
  for (const city of CITIES) {
    const row = await page.evaluate(async (city) => {
      window._cityTz = city.tz;
      window._setPrayerLocation(city.lat, city.lon, city.name, true);
      await new Promise(r=>setTimeout(r,200));
      if (window.updateNavClock) window.updateNavClock();

      const t = window._prayerTimings;
      const now = window._cityNow();
      const nowM = (now.getHours()*60+now.getMinutes())%1440;
      const marks = {
        Fajr: toM(t.Fajr), Sunrise: toM(t.Sunrise), Dhuhr: toM(t.Dhuhr), Asr: toM(t.Asr),
        Maghrib: toM(t.Maghrib), Isha: toM(t.Isha), Midnight: toM(t.Midnight||'00:00')
      };
      const expected = prayerAt(marks, nowM);
      const active = window._activePrayerName || null;
      const label = (document.querySelector('#fsCountdown .nav-label')||{}).textContent || '';
      return { city: city.name, expected, active, label, ok: expected === active };

      function toM(s){ const [h,m]=String(s||'0:0').split(':').map(Number); return ((h||0)*60+(m||0))%1440; }
      function inRange(m,a,b){ return a<=b ? (m>=a&&m<b) : (m>=a||m<b); }
      function prayerAt(marks,m){
        const sunrise=marks.Sunrise, dhuha=(sunrise+20)%1440;
        const sectors=[
          ['Qiyam',marks.Midnight,marks.Fajr],['Fajr',marks.Fajr,marks.Sunrise],['Sunrise',marks.Sunrise,dhuha],
          ['Dhuha',dhuha,marks.Dhuhr],['Dhuhr',marks.Dhuhr,marks.Asr],['Asr',marks.Asr,marks.Maghrib],
          ['Maghrib',marks.Maghrib,marks.Isha],['Isha',marks.Isha,marks.Midnight]
        ];
        for(const s of sectors){ if(inRange(m,s[1],s[2])) return s[0]; }
        return 'Isha';
      }
    }, city);

    console.log(`${row.ok ? '✅' : '❌'} ${row.city}: expected=${row.expected}, active=${row.active}, label=${row.label}`);
    if (!row.ok) failed = true;
  }

  await page.screenshot({ path: 'test-validate-city-prayer-windows.png' });
  await browser.close();
  if (failed) process.exit(1);
})();
