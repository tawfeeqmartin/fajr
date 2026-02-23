import puppeteer from 'puppeteer-core';
import fs from 'fs';

const CHROME = '/usr/bin/google-chrome-stable';
const URL = 'http://localhost:8892';
const OUT = '/tmp/lookdev-v2';
fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: false,
    args: [
        '--no-sandbox', '--disable-gpu-sandbox',
        '--use-gl=angle', '--use-angle=gl-egl',
        '--ozone-platform=headless',
        '--ignore-gpu-blocklist', '--disable-dev-shm-usage',
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
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
await new Promise(r => setTimeout(r, 14000));

// Verify GPU
const renderer = await page.evaluate(() => {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return 'NO WEBGL';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'no debug ext';
});
console.log('GPU:', renderer);

// Landing page
await page.screenshot({ path: `${OUT}/landing.png` });

// Clock crop — center of the dial
await page.screenshot({
    path: `${OUT}/clock-center.png`,
    clip: { x: 180, y: 350, width: 500, height: 500 }
});

// Kaaba close-up — the sacred center with complementary halo
await page.screenshot({
    path: `${OUT}/kaaba-closeup.png`,
    clip: { x: 280, y: 450, width: 300, height: 300 }
});

// Now wait for the tawaf flare — it fires every 60 seconds at the minute boundary.
// Figure out when the next minute starts and wait for it.
const now = Date.now();
const msToNextMinute = 60000 - (now % 60000);
console.log(`Waiting ${Math.round(msToNextMinute/1000)}s for next minute boundary (flare trigger)...`);
await new Promise(r => setTimeout(r, msToNextMinute - 200)); // arrive 200ms early

// Rapid-fire screenshots across the flare event (0.6s attack + 4s decay)
for (let i = 0; i < 12; i++) {
    await page.screenshot({ path: `${OUT}/flare-${String(i).padStart(2,'0')}.png` });
    await new Promise(r => setTimeout(r, 400)); // every 400ms over ~5 seconds
}

console.log('All screenshots saved to', OUT);
await browser.close();
