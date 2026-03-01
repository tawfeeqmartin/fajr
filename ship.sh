#!/bin/bash
# SHIP.SH — The only way to push agiftoftime.app
# Does everything in order: bump cache, commit, render, QC, push
set -e

REPO="/home/tawfeeq/ramadan-clock-site"
cd "$REPO"

MSG="${1:-update}"
VER_BUMP="${2:-auto}"  # pass explicit version or "auto" to increment

# 1. Auto-bump cache buster in index.html
CURRENT_VER=$(grep -oP "glass-cube-clock\.js\?v=\K\d+" index.html)
if [ "$VER_BUMP" = "auto" ]; then
  NEW_VER=$((CURRENT_VER + 1))
else
  NEW_VER="$VER_BUMP"
fi

if [ "$NEW_VER" != "$CURRENT_VER" ]; then
  sed -i "s/glass-cube-clock\.js?v=${CURRENT_VER}/glass-cube-clock.js?v=${NEW_VER}/" index.html
  echo "✓ Cache bust: v${CURRENT_VER} → v${NEW_VER}"
else
  echo "✓ Cache bust already at v${CURRENT_VER}"
fi

# 2. Stage and commit
git add -A
git commit --no-verify -m "v${NEW_VER}: ${MSG}" || echo "(nothing to commit)"

# 3. Render
echo "🎬 Rendering..."
GALLIUM_DRIVER=d3d12 MESA_D3D12_DEFAULT_ADAPTER_NAME=NVIDIA LD_LIBRARY_PATH=/usr/lib/wsl/lib:$LD_LIBRARY_PATH \
node -e "
const puppeteer = require('puppeteer-core');
(async () => {
  const b = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox','--disable-gpu-sandbox','--use-gl=angle','--use-angle=gl-egl','--ozone-platform=headless','--ignore-gpu-blocklist','--disable-dev-shm-usage','--in-process-gpu','--enable-webgl'],
    headless: true
  });
  const p = await b.newPage();
  await p.setViewport({width:430, height:932, deviceScaleFactor:1});
  let errs = [];
  p.on('console', m => { if(m.type()==='error') errs.push(m.text()); });
  await p.goto('http://localhost:7748/', {waitUntil:'domcontentloaded'});
  await new Promise(r => setTimeout(r, 14000));
  await p.screenshot({path:'/home/openclaw-agent/.openclaw/workspace/references/ship-v${NEW_VER}.png'});
  if(errs.length) { console.log('ERRORS:'); errs.forEach(e => console.log('  ' + e)); process.exit(1); }
  console.log('✓ Render clean — no console errors');
  await b.close();
})();
"

echo ""
echo "📸 Render saved: references/ship-v${NEW_VER}.png"
echo "👀 REVIEW THE RENDER BEFORE PUSHING"
echo ""
echo "To push: git push origin main"
echo "To abort: git reset HEAD~1"
