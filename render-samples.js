const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME = '/usr/bin/google-chrome-stable';
const URL_BASE = 'http://localhost:7747/#clock';
const OUT = path.join(__dirname, 'renders');

const SIZES = [
  { w: 1080, h: 1920, label: 'stories', dpr: 2 },
  { w: 2160, h: 3840, label: 'twitter', dpr: 1 },
  { w: 1080, h: 1080, label: 'square',  dpr: 2 },
];

async function run() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: [
      '--no-sandbox', '--disable-gpu-sandbox', '--use-gl=angle', '--use-angle=gl-egl',
      '--ozone-platform=headless', '--ignore-gpu-blocklist', '--disable-dev-shm-usage',
      '--in-process-gpu', '--enable-webgl',
    ],
    env: {
      ...process.env,
      GALLIUM_DRIVER: 'd3d12',
      MESA_D3D12_DEFAULT_ADAPTER_NAME: 'NVIDIA',
      LD_LIBRARY_PATH: '/usr/lib/wsl/lib:' + (process.env.LD_LIBRARY_PATH || ''),
    },
  });

  const page = await browser.newPage();

  // Start at mobile size
  await page.setViewport({ width: 430, height: 932, deviceScaleFactor: 2 });

  // Skip onboarding + set location
  await page.goto(URL_BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.setItem('agot_clock_onboarded', '1');
    localStorage.setItem('agot_loc', JSON.stringify({ lat: 34.0522, lon: -118.2437, name: 'Los Angeles' }));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });

  // Wait for Three.js + HDRI
  await new Promise(r => setTimeout(r, 15000));

  // Verify GPU
  const gpu = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    if (!c) return 'NO CANVAS';
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return 'NO GL';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'no ext';
  });
  console.log('GPU:', gpu);

  // Wait for prayers to load
  for (let i = 0; i < 30; i++) {
    const n = await page.evaluate(() => {
      if (window._prayerTimingsReady && typeof window.buildPrayerSectors === 'function' && window.prayerSectors.length === 0)
        window.buildPrayerSectors();
      return window.prayerSectors ? window.prayerSectors.length : 0;
    });
    if (n > 0) { console.log(`Prayer sectors: ${n}`); break; }
    await new Promise(r => setTimeout(r, 500));
  }

  // Get prayer names
  const prayers = await page.evaluate(() =>
    window.prayerSectors.map((ps, i) => ({ idx: i, name: ps.def ? ps.def.name : 'prayer-' + i }))
  );

  // Render each prayer at each size using page.screenshot at export viewport
  for (const prayer of prayers) {
    console.log(`\n${prayer.name}:`);

    // Set prayer time directly (bypass lerp + auto-revert)
    await page.evaluate(idx => {
      var ps = window.prayerSectors[idx];
      if (!ps) return;
      // Set time override directly — no lerp, no auto-revert timer
      window._swipeTimeOverride = ps.startMin;
      window._swipeTimeTarget = ps.startMin;
      window._swipePreviewIdx = idx;
      // Clear any revert timer
      if (window._swipeRevertTimer) clearTimeout(window._swipeRevertTimer);
    }, prayer.idx);
    // Wait for render loop to process the new time (prayer window colors, hand positions)
    await new Promise(r => setTimeout(r, 3000));

    // Hide all chrome
    await page.evaluate(() => {
      document.body.classList.add('chrome-hidden');
      var dp = document.getElementById('_devPanel');
      if (dp) dp.style.display = 'none';
      document.querySelectorAll('.fs-header,.mode-pill,.compass-chrome,#fsTapHint,.mode-label,.clock-onboard').forEach(function(el) {
        el.style.visibility = 'hidden';
      });
    });
    await new Promise(r => setTimeout(r, 300));

    for (const size of SIZES) {
      // Resize viewport to export dimensions
      await page.setViewport({ width: size.w, height: size.h, deviceScaleFactor: size.dpr });
      // Let renderer adapt + run a few frames at new size
      await new Promise(r => setTimeout(r, 2000));

      const filename = `agot-${prayer.name}-${size.label}-${size.w}x${size.h}.png`;
      await page.screenshot({ path: path.join(OUT, filename), type: 'png' });
      console.log(`  ✓ ${filename}`);
    }
  }

  // Live with chrome
  console.log('\nLive with chrome:');
  await page.evaluate(() => {
    if (typeof _swipeRevert === 'function') _swipeRevert();
    document.body.classList.remove('chrome-hidden');
    document.querySelectorAll('.fs-header,.mode-pill,.compass-chrome,#fsTapHint,.mode-label').forEach(function(el) {
      el.style.visibility = '';
    });
  });
  await new Promise(r => setTimeout(r, 2000));

  for (const size of SIZES) {
    await page.setViewport({ width: size.w, height: size.h, deviceScaleFactor: size.dpr });
    await new Promise(r => setTimeout(r, 2000));
    const filename = `agot-live-chrome-${size.label}-${size.w}x${size.h}.png`;
    await page.screenshot({ path: path.join(OUT, filename), type: 'png' });
    console.log(`  ✓ ${filename}`);
  }

  await browser.close();
  console.log(`\nDone! ${fs.readdirSync(OUT).length} renders in ${OUT}`);
}

run().catch(e => { console.error(e); process.exit(1); });
