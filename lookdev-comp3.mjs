import puppeteer from 'puppeteer-core';
import fs from 'fs';

const CHROME = '/usr/bin/google-chrome-stable';
const URL = 'http://localhost:8891';
const OUT = '/tmp/lookdev-comp3';
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

// Get the clock position to compute correct crop coordinates
const clockBounds = await page.evaluate(() => {
    const el = document.getElementById('dialHero');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
});
console.log('Clock bounds (CSS px):', clockBounds);

// Landing page — full viewport
await page.screenshot({ path: `${OUT}/landing.png` });
console.log('Landing captured');

if (clockBounds) {
    // Clock crop — full dial
    await page.screenshot({
        path: `${OUT}/clock-full.png`,
        clip: { x: clockBounds.x, y: clockBounds.y, width: clockBounds.w, height: clockBounds.h }
    });
    console.log('Clock full captured');

    // Kaaba center — inner 40% of dial
    const cx = clockBounds.x + clockBounds.w / 2;
    const cy = clockBounds.y + clockBounds.h / 2;
    const innerSize = clockBounds.w * 0.35;
    await page.screenshot({
        path: `${OUT}/kaaba-center.png`,
        clip: { x: cx - innerSize/2, y: cy - innerSize/2, width: innerSize, height: innerSize }
    });
    console.log('Kaaba center captured');
}

// Wait for tawaf flare
const now = Date.now();
const msToNextMinute = 60000 - (now % 60000);
console.log(`Waiting ${Math.round(msToNextMinute/1000)}s for flare...`);
await new Promise(r => setTimeout(r, Math.max(msToNextMinute - 300, 0)));

// Flare onset
await page.screenshot({ path: `${OUT}/flare-onset.png` });
// Wait through attack (0.6s)
await new Promise(r => setTimeout(r, 700));
// Peak
await page.screenshot({ path: `${OUT}/flare-peak.png` });
// Mid decay
await new Promise(r => setTimeout(r, 1500));
await page.screenshot({ path: `${OUT}/flare-decay.png` });

// Also capture a Kaaba center during the flare if still active
if (clockBounds) {
    const cx = clockBounds.x + clockBounds.w / 2;
    const cy = clockBounds.y + clockBounds.h / 2;
    const innerSize = clockBounds.w * 0.35;
    await page.screenshot({
        path: `${OUT}/kaaba-flare.png`,
        clip: { x: cx - innerSize/2, y: cy - innerSize/2, width: innerSize, height: innerSize }
    });
    console.log('Kaaba during flare captured');
}

console.log('Done. Screenshots in', OUT);
await browser.close();
