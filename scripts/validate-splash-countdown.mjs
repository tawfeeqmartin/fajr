#!/usr/bin/env node
import puppeteer from 'puppeteer-core';

const BASE = process.env.BASE_URL || 'http://localhost:7748';
const CHROME = '/usr/bin/google-chrome-stable';

function fail(msg){ console.error('❌', msg); process.exit(1); }
function ok(msg){ console.log('✅', msg); }

const launchArgs = {
  executablePath: CHROME,
  headless: 'new',
  args: [
    '--no-sandbox','--disable-gpu-sandbox','--use-gl=angle','--use-angle=gl-egl',
    '--ozone-platform=headless','--ignore-gpu-blocklist','--disable-dev-shm-usage',
    '--in-process-gpu','--enable-webgl'
  ]
};

async function checkSplash(){
  const browser = await puppeteer.launch(launchArgs);
  const page = await browser.newPage();
  await page.setViewport({ width:430, height:932, deviceScaleFactor:2, isMobile:true, hasTouch:true });
  await page.goto(`${BASE}/?splashdebug=1`, { waitUntil:'domcontentloaded' });

  const timeline = [];
  for(let i=0;i<10;i++){
    await new Promise(r=>setTimeout(r,500));
    const snap = await page.evaluate(() => {
      const paths=[...document.querySelectorAll('#splash svg path')];
      const strokes=paths.map(p=>p.getAttribute('stroke'));
      return {
        splash: !!document.getElementById('splash'),
        total: paths.length,
        hour: strokes.filter(s=>s==='#9900ff').length,
        minute: strokes.filter(s=>s==='#1133ff').length,
      };
    });
    timeline.push(snap);
  }
  await page.screenshot({ path:'test-validate-splash.png' });
  await browser.close();

  const sawCubeOnly = timeline.some(t => t.total === 7 && t.hour===0 && t.minute===0);
  const sawHands = timeline.some(t => t.total >= 9 && t.hour>=1 && t.minute>=1);
  const regressed = (() => {
    let seenHands = false;
    for (const t of timeline){
      if(t.total >= 9) seenHands = true;
      if(seenHands && t.total === 7) return true;
    }
    return false;
  })();

  if(!sawCubeOnly) fail('Splash never showed cube-only phase (7 paths).');
  if(!sawHands) fail('Splash never showed hour/minute hand paths.');
  if(regressed) fail('Splash regressed from hand phase back to cube-only phase (race/flicker).');
  ok('Splash timeline validated (cube phase -> stable hand phase).');
}

async function checkCountdown(){
  const browser = await puppeteer.launch({ executablePath: CHROME, headless:'new', args:['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width:430, height:932, deviceScaleFactor:2, isMobile:true, hasTouch:true });
  await page.goto(`${BASE}/`, { waitUntil:'domcontentloaded' });
  await new Promise(r=>setTimeout(r,5500));

  const seq = await page.evaluate(async () => {
    const el=document.getElementById('fsCountdown');
    if(!el) return { err:'missing #fsCountdown' };
    const out=[];
    const snap=()=>out.push({pref:window._countdownPref,label:(el.querySelector('.nav-label')||{}).textContent||''});
    const tap=()=>{ el.dispatchEvent(new Event('touchend',{bubbles:true,cancelable:true})); el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true})); };

    // Simulate city change
    if(window._setPrayerLocation) window._setPrayerLocation(40.7128,-74.006,'NYC');
    window._isRamadan=false;
    if(window.updateNavClock) window.updateNavClock();

    snap();
    for(let i=0;i<4;i++){
      tap();
      await new Promise(r=>setTimeout(r,520));
      if(window.updateNavClock) window.updateNavClock();
      snap();
    }
    return { out };
  });

  await page.screenshot({ path:'test-validate-countdown.png' });
  await browser.close();

  if(seq.err) fail(seq.err);
  const out = seq.out;
  const prefs = out.map(x=>x.pref);
  // Expect alternation once user starts toggling.
  const toggled = prefs.slice(1);
  for(let i=1;i<toggled.length;i++){
    if(toggled[i]===toggled[i-1]) fail(`Countdown pref repeated at step ${i}: ${toggled[i]}`);
  }
  ok(`Countdown toggle validated after city change: ${prefs.join(' -> ')}`);
}

(async()=>{
  await checkSplash();
  await checkCountdown();
  ok('Validation suite passed.');
})();
