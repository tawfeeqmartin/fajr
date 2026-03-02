#!/usr/bin/env node
/**
 * test-compass-onboard.js — GPU Chrome visual test for compass onboarding
 *
 * Tests:
 * 1. Onboarding shows on first compass open
 * 2. Arc fills and changes color as accuracy improves
 * 3. Good state (checkmark) fires when accuracy <= 25
 * 4. Auto-dismisses after ~1.2s
 * 5. Does NOT show again in same session after calibration
 * 6. Shows again if sessionStorage cleared (new session)
 *
 * Uses window._mockCompassAccuracy to bypass iOS-only webkitCompassAccuracy
 */

const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:7748/';
const OUT_DIR = '/home/openclaw-agent/.openclaw/workspace/references/compass-test';
const CHROME = '/usr/bin/google-chrome-stable';

const env = {
  GALLIUM_DRIVER: 'd3d12',
  MESA_D3D12_DEFAULT_ADAPTER_NAME: 'NVIDIA',
  LD_LIBRARY_PATH: `/usr/lib/wsl/lib:${process.env.LD_LIBRARY_PATH || ''}`
};
Object.assign(process.env, env);

fs.mkdirSync(OUT_DIR, { recursive: true });

let passed = 0, failed = 0;

function assert(name, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.log(`  ❌ ${name}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

async function shot(page, name) {
  const p = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: p });
  return p;
}

async function fireCompass(page, accuracy, heading = 45) {
  await page.evaluate(({ accuracy, heading }) => {
    window._mockCompassAccuracy = accuracy;
    window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', {
      alpha: heading, beta: 10, gamma: 5
    }));
  }, { accuracy, heading });
  await new Promise(r => setTimeout(r, 400));
}

async function getOnboardState(page) {
  return page.evaluate(() => {
    const el = document.querySelector('.compass-onboard');
    if (!el) return { exists: false };
    const style = window.getComputedStyle(el);
    const arcFill = document.querySelector('.compass-onboard-arc-fill');
    const goodEl = document.querySelector('.compass-onboard-good');
    const textEl = document.querySelector('.compass-onboard-text');
    return {
      exists: true,
      visible: parseFloat(style.opacity) > 0.1,
      arcStroke: arcFill ? arcFill.style.stroke : null,
      arcOffset: arcFill ? parseFloat(arcFill.style.strokeDashoffset) : null,
      arcCirc: arcFill ? parseFloat(arcFill.style.strokeDasharray) : null,
      goodVisible: goodEl ? parseFloat(window.getComputedStyle(goodEl).opacity) > 0.1 : false,
      text: textEl ? textEl.textContent : null
    };
  });
}

async function launch() {
  return puppeteer.launch({
    executablePath: CHROME,
    args: [
      '--no-sandbox', '--disable-gpu-sandbox',
      '--use-gl=angle', '--use-angle=gl-egl',
      '--ozone-platform=headless', '--ignore-gpu-blocklist',
      '--disable-dev-shm-usage', '--in-process-gpu', '--enable-webgl'
    ],
    headless: 'new'
  });
}

async function openCompass(page) {
  await page.evaluate(() => switchMode('compass'));
  await new Promise(r => setTimeout(r, 1500));
}

async function runTests() {
  const browser = await launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 430, height: 932, deviceScaleFactor: 1 });

  const errors = [];
  // Only track JS errors, not network failures (CORS/429 from external APIs are expected on localhost)
  page.on('console', m => {
    if (m.type() === 'error' && !m.text().includes('ERR_FAILED') && !m.text().includes('CORS') && !m.text().includes('429') && !m.text().includes('fetch'))
      errors.push(m.text());
  });
  page.on('pageerror', e => errors.push(e.message));

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 13000));

  // ── TEST 1: Onboarding visible on first open ──────────────────────
  console.log('\nTest 1: Onboarding shows on first compass open');
  await openCompass(page);
  await shot(page, '1-onboard-open');
  const s1 = await getOnboardState(page);
  assert('overlay exists', s1.exists);
  assert('overlay visible', s1.visible);
  assert('shows calibrating text', s1.text && s1.text.includes('Calibrating'));
  assert('arc starts empty', s1.arcOffset !== null && s1.arcOffset >= s1.arcCirc * 0.8,
    `offset=${s1.arcOffset} circ=${s1.arcCirc}`);

  // ── TEST 2: Arc fills as accuracy improves ────────────────────────
  console.log('\nTest 2: Arc fills red→green as accuracy improves');
  await fireCompass(page, 55);
  await shot(page, '2-poor-accuracy');
  const s2 = await getOnboardState(page);
  assert('still visible at poor accuracy', s2.visible);
  const offset55 = s2.arcOffset;

  await fireCompass(page, 35);
  const s2b = await getOnboardState(page);
  const offset35 = s2b.arcOffset;
  assert('arc fills as accuracy improves', offset35 < offset55,
    `55deg offset=${offset55} 35deg offset=${offset35}`);
  await shot(page, '2b-medium-accuracy');

  // ── TEST 3: Good state fires at <= 25 degrees ─────────────────────
  console.log('\nTest 3: Good state fires when calibrated');
  await fireCompass(page, 10);
  await new Promise(r => setTimeout(r, 500));
  await shot(page, '3-calibrated');
  const s3 = await getOnboardState(page);
  assert('good indicator visible', s3.goodVisible);
  assert('arc fully filled', s3.arcOffset !== null && s3.arcOffset < 5,
    `offset=${s3.arcOffset}`);

  // ── TEST 4: Auto-dismisses after ~1.2s ───────────────────────────
  console.log('\nTest 4: Auto-dismisses after calibration');
  await new Promise(r => setTimeout(r, 2000));
  await shot(page, '4-dismissed');
  const s4 = await getOnboardState(page);
  assert('overlay dismissed', !s4.visible, `visible=${s4.visible}`);
  assert('sessionStorage flag set', await page.evaluate(() =>
    sessionStorage.getItem('agot_compass_ok') === '1'));

  // ── TEST 5: Does NOT show again same session ──────────────────────
  console.log('\nTest 5: Does not show again in same session');
  await page.evaluate(() => switchMode('clock'));
  await new Promise(r => setTimeout(r, 500));
  await openCompass(page);
  await shot(page, '5-no-repeat');
  const s5 = await getOnboardState(page);
  assert('onboarding not shown again', !s5.visible, `visible=${s5.visible}`);

  // ── TEST 6: Shows again after sessionStorage cleared ─────────────
  console.log('\nTest 6: Shows again after sessionStorage cleared (new session)');
  await page.evaluate(() => switchMode('clock'));
  await new Promise(r => setTimeout(r, 500));
  await page.evaluate(() => {
    sessionStorage.removeItem('agot_compass_ok');
    if (typeof window._resetCompassOnboard === 'function') window._resetCompassOnboard();
  });
  await new Promise(r => setTimeout(r, 200));
  await openCompass(page);
  await shot(page, '6-new-session');
  const s6 = await getOnboardState(page);
  assert('onboarding shows after session clear', s6.visible);

  // ── Console errors ────────────────────────────────────────────────
  console.log('\nConsole errors:');
  if (errors.length === 0) {
    console.log('  ✅ None');
    passed++;
  } else {
    errors.forEach(e => { console.log(`  ❌ ${e}`); failed++; });
  }

  await browser.close();

  console.log(`\n${'─'.repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`Screenshots: ${OUT_DIR}/`);

  if (failed > 0) process.exit(1);
}

runTests().catch(e => { console.error('FATAL:', e); process.exit(1); });
