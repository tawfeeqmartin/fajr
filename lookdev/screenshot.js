const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome-stable',
    headless: true,
    args: [
      '--no-sandbox', '--disable-gpu-sandbox', '--use-gl=angle', '--use-angle=gl-egl',
      '--ozone-platform=headless', '--ignore-gpu-blocklist', '--disable-dev-shm-usage',
      '--in-process-gpu', '--enable-webgl', '--allow-file-access-from-files', '--disable-web-security'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 430, height: 932, deviceScaleFactor: 2 });
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text());
  });

  await page.goto('file:///home/tawfeeq/ramadan-clock-site/index.html', { waitUntil: 'domcontentloaded' });
  
  // Wait for Three.js to initialize
  await new Promise(r => setTimeout(r, 6000));
  
  // Force prayer timings so prayer wash activates even in file:// mode
  await page.evaluate(() => {
    window._prayerTimings = {
      Fajr: '05:30', Sunrise: '07:00', Dhuhr: '12:15',
      Asr: '15:30', Maghrib: '18:00', Isha: '19:30', Midnight: '23:45'
    };
    window._prayerTimingsReady = true;
  });
  
  // Wait for prayer sectors to build + scene to fully render with lighting
  await new Promise(r => setTimeout(r, 10000));

  const renderer = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    if (!c) return 'no canvas';
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return 'no gl';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'no debug ext';
  });
  console.log('Renderer:', renderer);

  const suffix = process.argv[2] || 'baseline';
  await page.screenshot({ path: `/home/tawfeeq/ramadan-clock-site/lookdev/${suffix}.png` });
  console.log(`Screenshot saved: ${suffix}.png`);

  await browser.close();
})();
