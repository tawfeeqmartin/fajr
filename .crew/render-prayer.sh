#!/bin/bash
# Render a specific prayer by forcing time via window._forceTimeMin
# Usage: bash .crew/render-prayer.sh <prayer_name> <time_minutes> <output_name>
# Example: bash .crew/render-prayer.sh tahajjud 120 prayer-tahajjud-v6

set -e
PRAYER_NAME="${1}"
TIME_MIN="${2}"
OUTPUT_NAME="${3:-render}"
RENDER_DIR="$(dirname "$0")/renders"
mkdir -p "$RENDER_DIR"
OUTPUT="$RENDER_DIR/${OUTPUT_NAME}.png"

# Kill any existing server on 7747
pkill -f "http.server 7747" 2>/dev/null || true
sleep 0.5

# Start dev server
cd /home/tawfeeq/ramadan-clock-site
python3 -m http.server 7747 --bind 0.0.0.0 &>/tmp/agot-serve.log &
SERVER_PID=$!
sleep 2

# GPU Chrome screenshot with forced prayer time
NODE_PATH=/home/tawfeeq/node_modules \
GALLIUM_DRIVER=d3d12 \
MESA_D3D12_DEFAULT_ADAPTER_NAME=NVIDIA \
LD_LIBRARY_PATH=/usr/lib/wsl/lib:$LD_LIBRARY_PATH \
node -e "
const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox','--disable-gpu-sandbox','--use-gl=angle','--use-angle=gl-egl',
           '--ozone-platform=headless','--ignore-gpu-blocklist','--disable-dev-shm-usage',
           '--in-process-gpu','--enable-webgl'],
    headless: true
  });
  const page = await browser.newPage();
  await page.setViewport({width:430, height:932, deviceScaleFactor:2});
  await page.goto('http://localhost:7747/', {waitUntil:'domcontentloaded'});
  // Force specific prayer time
  await page.evaluate((min) => { window._forceTimeMin = min; }, ${TIME_MIN});
  // Wait for scene + prayer lights to settle (lerpRate=1.0 with _forceTimeMin)
  await new Promise(r => setTimeout(r, 14000));
  const renderer = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    const gl = c && (c.getContext('webgl2') || c.getContext('webgl'));
    const ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unknown';
  });
  console.log('GPU:', renderer);
  console.log('Prayer: ${PRAYER_NAME} at minute ${TIME_MIN}');
  await page.screenshot({path: '${OUTPUT}'});
  await browser.close();
  console.log('Saved: ${OUTPUT}');
})().catch(e => { console.error(e.message); process.exit(1); });
"

# Kill server
kill $SERVER_PID 2>/dev/null || true

echo "Render complete: $OUTPUT"
