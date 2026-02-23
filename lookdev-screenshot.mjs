import puppeteer from 'puppeteer-core';
import fs from 'fs';

const CHROME = '/usr/bin/google-chrome-stable';
const URL = 'http://localhost:8891';
const OUT_DIR = '/tmp/lookdev';
fs.mkdirSync(OUT_DIR, { recursive: true });

const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: false,   // FULL Chrome, not headless
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

// Navigate and wait for Three.js + HDRI to load
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
await new Promise(r => setTimeout(r, 14000)); // Three.js init + first render cycle

// Verify GPU renderer
const renderer = await page.evaluate(() => {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return 'NO WEBGL';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'no debug ext';
});
console.log('GPU Renderer:', renderer);

// Full page screenshot
await page.screenshot({ path: `${OUT_DIR}/landing-full.png` });

// Clock crop (centered dial)
await page.screenshot({
    path: `${OUT_DIR}/clock-crop.png`,
    clip: { x: 60, y: 190, width: 740, height: 740 }
});

// Now click into fullscreen mode and screenshot
const clockEl = await page.$('#dialHero');
if (clockEl) {
    await clockEl.click();
    await new Promise(r => setTimeout(r, 3000)); // wait for fullscreen transition
    await page.screenshot({ path: `${OUT_DIR}/fullscreen.png` });
}

// Wait 50 seconds for the tawaf flare to fire (one full 60s cycle)
console.log('Waiting for tawaf flare...');
await new Promise(r => setTimeout(r, 50000));
// Take rapid screenshots to catch the flare
for (let i = 0; i < 8; i++) {
    await page.screenshot({ path: `${OUT_DIR}/flare-${i}.png` });
    await new Promise(r => setTimeout(r, 500));
}

await browser.close();
console.log('Lookdev screenshots saved to', OUT_DIR);
