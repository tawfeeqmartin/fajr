const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME = '/usr/bin/google-chrome-stable';
const URL = 'http://localhost:7747/#clock';
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
  await page.setViewport({ width: 430, height: 932, deviceScaleFactor: 2 });

  // Skip onboarding + set location (LA) so prayers load
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
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

  // Wait for prayer data — check _prayerTimingsReady + prayerSectors
  let prayerCount = 0;
  for (let retry = 0; retry < 30; retry++) {
    prayerCount = await page.evaluate(() => {
      // Force rebuild if timings exist but sectors haven't built
      if (window._prayerTimingsReady && typeof buildPrayerSectors === 'function' && prayerSectors.length === 0) {
        buildPrayerSectors();
      }
      return typeof prayerSectors !== 'undefined' ? prayerSectors.length : 0;
    });
    if (prayerCount > 0) break;
    await new Promise(r => setTimeout(r, 1000));
  }
  console.log(`Prayer sectors: ${prayerCount}`);

  // Export each prayer at each size using global _exportFrame
  for (let pi = 0; pi < prayerCount; pi++) {
    const name = await page.evaluate(i =>
      prayerSectors[i] && prayerSectors[i].def ? prayerSectors[i].def.name : 'prayer-' + i
    , pi);
    console.log(`\n${name}:`);

    for (const size of SIZES) {
      // Use the in-browser export handle — get blob as base64
      const b64 = await page.evaluate(async (opts) => {
        const blob = await window._exportFrame({
          width: opts.w, height: opts.h, dpr: opts.dpr,
          hideChrome: true, prayer: opts.prayer, download: false
        });
        return new Promise(resolve => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(blob);
        });
      }, { w: size.w, h: size.h, dpr: size.dpr, prayer: pi });

      const filename = `agot-${name}-${size.label}-${size.w}x${size.h}.png`;
      fs.writeFileSync(path.join(OUT, filename), Buffer.from(b64, 'base64'));
      console.log(`  ✓ ${filename}`);
    }
  }

  // Live with chrome
  console.log('\nLive with chrome:');
  await page.evaluate(() => {
    if (typeof _swipeRevert === 'function') _swipeRevert();
  });
  await new Promise(r => setTimeout(r, 1500));

  for (const size of SIZES) {
    const b64 = await page.evaluate(async (opts) => {
      const blob = await window._exportFrame({
        width: opts.w, height: opts.h, dpr: opts.dpr,
        hideChrome: false, download: false
      });
      return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(blob);
      });
    }, { w: size.w, h: size.h, dpr: size.dpr });

    const filename = `agot-live-chrome-${size.label}-${size.w}x${size.h}.png`;
    fs.writeFileSync(path.join(OUT, filename), Buffer.from(b64, 'base64'));
    console.log(`  ✓ ${filename}`);
  }

  await browser.close();
  console.log(`\nDone! ${fs.readdirSync(OUT).length} renders in ${OUT}`);
}

run().catch(e => { console.error(e); process.exit(1); });
