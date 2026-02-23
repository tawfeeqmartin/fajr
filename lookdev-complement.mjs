import puppeteer from 'puppeteer-core';
import fs from 'fs';

const CHROME = '/usr/bin/google-chrome-stable';
const URL = 'http://localhost:8891';
const OUT = '/tmp/lookdev-comp';
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
if (!renderer.includes('NVIDIA')) {
    console.error('NOT on GPU! Aborting.');
    await browser.close();
    process.exit(1);
}

// Landing page
await page.screenshot({ path: `${OUT}/landing.png` });
console.log('Landing captured');

// Clock center crop
await page.screenshot({
    path: `${OUT}/clock-center.png`,
    clip: { x: 60, y: 190, width: 740, height: 740 }
});
console.log('Clock center captured');

// Kaaba closeup - sacred center with complementary halo
await page.screenshot({
    path: `${OUT}/kaaba-closeup.png`,
    clip: { x: 250, y: 400, width: 360, height: 360 }
});
console.log('Kaaba closeup captured');

// Now enter fullscreen mode by clicking the clock
await page.click('#dialHero');
await new Promise(r => setTimeout(r, 3000));
await page.screenshot({ path: `${OUT}/fullscreen.png` });
console.log('Fullscreen captured');

// Wait for tawaf flare at the minute boundary
const now = Date.now();
const msToNextMinute = 60000 - (now % 60000);
console.log(`Waiting ${Math.round(msToNextMinute/1000)}s for flare...`);
await new Promise(r => setTimeout(r, msToNextMinute + 300));

// Capture flare sequence
for (let i = 0; i < 10; i++) {
    await page.screenshot({ path: `${OUT}/flare-${String(i).padStart(2,'0')}.png` });
    await new Promise(r => setTimeout(r, 400));
}
console.log('Flare sequence captured');

// Exit fullscreen
await page.keyboard.press('Escape');
await new Promise(r => setTimeout(r, 1000));

console.log('All screenshots saved to', OUT);
await browser.close();
