#!/bin/bash
# GPU Chrome render script for Chris — call after every change
# Usage: bash .crew/render.sh [output_name]
# Output saved to .crew/renders/

set -e
OUTPUT_NAME="${1:-render}"
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

# GPU Chrome screenshot
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
  var url = process.env.RENDER_URL || 'http://localhost:7747/';
  await page.goto(url, {waitUntil:'domcontentloaded'});
  await new Promise(r => setTimeout(r, 12000));
  const renderer = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    const gl = c && (c.getContext('webgl2') || c.getContext('webgl'));
    const ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unknown';
  });
  console.log('GPU:', renderer);
  await page.screenshot({path: '$OUTPUT'});
  await browser.close();
  console.log('Saved:', '$OUTPUT');
})().catch(e => { console.error(e.message); process.exit(1); });
"

# Kill server
kill $SERVER_PID 2>/dev/null || true

echo "Render complete: $OUTPUT"
echo "Use Read tool to view: $OUTPUT"
