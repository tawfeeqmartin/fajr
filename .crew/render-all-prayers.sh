#!/bin/bash
# Render all 7 prayer times with GPU Chrome — Chris v7
set -e

RENDER_DIR="$(dirname "$0")/renders"
mkdir -p "$RENDER_DIR"

pkill -f "http.server 7747" 2>/dev/null || true
sleep 0.5

cd /home/tawfeeq/ramadan-clock-site
python3 -m http.server 7747 --bind 0.0.0.0 &>/tmp/agot-serve.log &
SERVER_PID=$!
sleep 2

VERSION="${1:-v7}"

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
  
  const prayers = [
    { name: 'tahajjud', min: 120 },
    { name: 'fajr',     min: 375 },
    { name: 'dhuha',    min: 578 },
    { name: 'dhuhr',    min: 832 },
    { name: 'asr',      min: 1005 },
    { name: 'maghrib',  min: 1125 },
    { name: 'isha',     min: 1298 },
  ];
  
  for (const p of prayers) {
    const page = await browser.newPage();
    await page.setViewport({width:430, height:932, deviceScaleFactor:2});
    await page.goto('http://localhost:7747/?dev', {waitUntil:'domcontentloaded'});
    await new Promise(r => setTimeout(r, 12000));
    
    // Jump to prayer time, then hide dev panel for clean render
    await page.evaluate((min) => {
      window._devJumpToTime(min);
      var panel = document.getElementById('_devPanel');
      if (panel) panel.style.display = 'none';
    }, p.min);
    
    await new Promise(r => setTimeout(r, 6000));
    
    const debug = await page.evaluate(() => window._prayerDebug);
    console.log(p.name + ':', JSON.stringify(debug));
    
    const output = '${RENDER_DIR}/prayer-' + p.name + '-${VERSION}.png';
    await page.screenshot({path: output});
    console.log('Saved:', output);
    await page.close();
  }
  
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
"

kill $SERVER_PID 2>/dev/null || true
echo "All renders complete in $RENDER_DIR"
