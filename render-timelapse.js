const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const CHROME = '/usr/bin/google-chrome-stable';
const URL_BASE = 'http://localhost:7747/#clock';
const OUT = path.join(__dirname, 'renders', 'timelapse');
const FRAMES = 720;       // 24s at 30fps — 2-min steps for smooth minute hand
const TOTAL_MIN = 1440;   // full 24h cycle
const STEP = TOTAL_MIN / FRAMES; // loop-safe playback: last->first is one normal frame step
const SIZE = { w: 1080, h: 1080, dpr: 2 }; // square for social, full res

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
  await page.setViewport({ width: SIZE.w, height: SIZE.h, deviceScaleFactor: SIZE.dpr });

  await page.goto(URL_BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.setItem('agot_clock_onboarded', '1');
    localStorage.setItem('agot_loc', JSON.stringify({ lat: 34.0522, lon: -118.2437, name: 'Los Angeles' }));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 15000));

  const gpu = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    const gl = c && (c.getContext('webgl2') || c.getContext('webgl'));
    const ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unknown';
  });
  console.log('GPU:', gpu);

  // Wait for prayers
  for (let i = 0; i < 30; i++) {
    const n = await page.evaluate(() => {
      if (window._prayerTimingsReady && typeof window.buildPrayerSectors === 'function' && window.prayerSectors.length === 0)
        window.buildPrayerSectors();
      return window.prayerSectors ? window.prayerSectors.length : 0;
    });
    if (n > 0) { console.log(`Prayer sectors: ${n}`); break; }
    await new Promise(r => setTimeout(r, 500));
  }

  // Hide chrome
  await page.evaluate(() => {
    document.body.classList.add('chrome-hidden');
    document.querySelectorAll('.fs-header,.mode-pill,.compass-chrome,#fsTapHint,.mode-label,.clock-onboard').forEach(el => {
      el.style.visibility = 'hidden';
    });
  });

  console.log(`Capturing ${FRAMES} frames (24h cycle)...`);

  for (let i = 0; i < FRAMES; i++) {
    const min = (i * STEP) % 1440;

    // Set deterministic render time (loop-safe, no stateful swipe lerps)
    await page.evaluate(m => {
      window._forceTimeMin = m;
      window._swipeTimeOverride = null;
      window._swipeTimeTarget = null;
      if (window._swipeRevertTimer) clearTimeout(window._swipeRevertTimer);
    }, min);

    // Let render loop process (2 frames worth)
    await new Promise(r => setTimeout(r, 150));

    const padded = String(i).padStart(4, '0');
    await page.screenshot({ path: path.join(OUT, `frame-${padded}.png`), type: 'png' });

    const h = Math.floor(min / 60), m = min % 60;
    if (i % 10 === 0) process.stdout.write(`  ${padded}/${FRAMES} (${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m})\n`);
  }

  await browser.close();
  console.log(`\n${FRAMES} frames captured.`);

  // Stitch with ffmpeg
  console.log('Stitching GIF...');
  const gifPath = path.join(__dirname, 'renders', 'agot-timelapse-24h.gif');
  const mp4Path = path.join(__dirname, 'renders', 'agot-timelapse-24h.mp4');

  // MP4 only — GIF can't handle this scene's subtlety
  execSync(`ffmpeg -y -framerate 30 -i "${OUT}/frame-%04d.png" -c:v libx264 -pix_fmt yuv420p -crf 16 -preset slow "${mp4Path}"`, { stdio: 'inherit' });
  console.log(`✓ MP4: ${mp4Path} (${(fs.statSync(mp4Path).size / 1024 / 1024).toFixed(1)}MB)`);
}

run().catch(e => { console.error(e); process.exit(1); });
