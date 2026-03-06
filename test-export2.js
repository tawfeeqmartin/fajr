const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome-stable',
    headless: 'new',
    args: ['--no-sandbox','--disable-gpu-sandbox','--use-gl=angle','--use-angle=gl-egl',
      '--ozone-platform=headless','--ignore-gpu-blocklist','--disable-dev-shm-usage',
      '--in-process-gpu','--enable-webgl'],
    env: { ...process.env, GALLIUM_DRIVER:'d3d12', MESA_D3D12_DEFAULT_ADAPTER_NAME:'NVIDIA',
      LD_LIBRARY_PATH:'/usr/lib/wsl/lib:'+(process.env.LD_LIBRARY_PATH||'') },
  });

  const page = await browser.newPage();

  // Set export viewport directly — high-res from the start
  await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });

  await page.goto('http://localhost:7747/#clock', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.setItem('agot_clock_onboarded', '1');
    localStorage.setItem('agot_loc', JSON.stringify({ lat: 34.0522, lon: -118.2437, name: 'Los Angeles' }));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 15000));

  // Wait for prayers
  for (let i = 0; i < 20; i++) {
    const n = await page.evaluate(() => {
      if (window._prayerTimingsReady && typeof window.buildPrayerSectors === 'function' && window.prayerSectors.length === 0)
        window.buildPrayerSectors();
      return window.prayerSectors ? window.prayerSectors.length : 0;
    });
    if (n > 0) break;
    await new Promise(r => setTimeout(r, 500));
  }

  // Set prayer to Maghrib (idx 5), hide chrome
  await page.evaluate(() => {
    if (typeof _swipeShowPreview === 'function') _swipeShowPreview(5);
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => document.body.classList.add('chrome-hidden'));
  await new Promise(r => setTimeout(r, 500));

  // Simple page.screenshot — captures what's actually rendered on screen
  await page.screenshot({ path: '/tmp/test-screenshot-hires.png', type: 'png' });
  console.log('Screenshot saved');

  await browser.close();
})();
