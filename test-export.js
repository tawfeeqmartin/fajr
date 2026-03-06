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
  
  // Collect console errors
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(err.message));

  await page.setViewport({ width: 430, height: 932, deviceScaleFactor: 2 });
  await page.goto('http://localhost:7747/#clock', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.setItem('agot_clock_onboarded', '1');
    localStorage.setItem('agot_loc', JSON.stringify({ lat: 34.0522, lon: -118.2437, name: 'Los Angeles' }));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 15000));

  // Force build prayer sectors
  await page.evaluate(() => {
    if (window._prayerTimingsReady && typeof window.buildPrayerSectors === 'function' && window.prayerSectors.length === 0) {
      window.buildPrayerSectors();
    }
  });
  await new Promise(r => setTimeout(r, 2000));

  const sectors = await page.evaluate(() => window.prayerSectors ? window.prayerSectors.length : 0);
  console.log('Sectors:', sectors);

  // Try export
  const result = await page.evaluate(async () => {
    try {
      const blob = await window._exportFrame({ width: 1080, height: 1080, dpr: 2, hideChrome: true, prayer: 5, download: false });
      return { size: blob.size, type: blob.type };
    } catch(e) {
      return { error: e.message };
    }
  });
  console.log('Export result:', result);

  // Also take a regular screenshot for comparison
  await page.screenshot({ path: '/tmp/test-screenshot.png' });
  
  // Save the export via base64
  const b64 = await page.evaluate(async () => {
    const blob = await window._exportFrame({ width: 1080, height: 1080, dpr: 2, hideChrome: true, prayer: 5, download: false });
    return new Promise(resolve => {
      const r = new FileReader();
      r.onload = () => resolve(r.result.split(',')[1]);
      r.readAsDataURL(blob);
    });
  });
  fs.writeFileSync('/tmp/test-export.png', Buffer.from(b64, 'base64'));
  
  console.log('Errors:', errors.length ? errors : 'none');
  await browser.close();
})();
