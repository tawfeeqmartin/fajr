// Render all 7 prayer windows with GPU Chrome
const puppeteer = require('puppeteer-core');

const PRAYERS = [
  { name: 'tahajjud', min: 1425 },  // 23:45 — violet
  { name: 'fajr',     min: 350 },   // 05:50 — blue-violet
  { name: 'dhuha',    min: 480 },   // 08:00 — amber
  { name: 'dhuhr',    min: 750 },   // 12:30 — green
  { name: 'asr',      min: 960 },   // 16:00 — orange
  { name: 'maghrib',  min: 1100 },  // 18:20 — red
  { name: 'isha',     min: 1200 },  // 20:00 — blue
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox','--disable-gpu-sandbox','--use-gl=angle','--use-angle=gl-egl',
           '--ozone-platform=headless','--ignore-gpu-blocklist','--disable-dev-shm-usage',
           '--in-process-gpu','--enable-webgl'],
    headless: true
  });
  
  const page = await browser.newPage();
  await page.setViewport({width:430, height:932, deviceScaleFactor:2});
  
  for (const prayer of PRAYERS) {
    console.log(`\nRendering ${prayer.name} (min=${prayer.min})...`);
    await page.goto('http://localhost:7747/', {waitUntil:'domcontentloaded'});
    
    // Force prayer time
    await page.evaluate((min) => { window._forceTimeMin = min; }, prayer.min);
    
    // Wait for scene + prayer light lerp (lerp rate is 1.0 when _forceTimeMin set, so instant)
    await new Promise(r => setTimeout(r, 14000));
    
    const outPath = `/home/tawfeeq/ramadan-clock-site/.crew/renders/prayer-${prayer.name}-v8.png`;
    await page.screenshot({path: outPath});
    console.log(`Saved: ${outPath}`);
    
    // Check prayer debug state
    const debug = await page.evaluate(() => window._prayerDebug);
    console.log('Prayer debug:', JSON.stringify(debug));
  }
  
  await browser.close();
  console.log('\nAll 7 prayers rendered.');
})().catch(e => { console.error(e.message); process.exit(1); });
