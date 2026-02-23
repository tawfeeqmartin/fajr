const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome-stable',
    headless: false,
    args: ['--no-sandbox','--disable-gpu-sandbox','--use-gl=angle','--use-angle=gl-egl','--ignore-gpu-blocklist','--disable-dev-shm-usage','--in-process-gpu','--enable-webgl']
  });
  const page = await browser.newPage();
  await page.setViewport({width:430, height:932, deviceScaleFactor:2});
  await page.goto('http://localhost:8765', {waitUntil:'domcontentloaded'});
  await new Promise(r=>setTimeout(r,15000));
  await page.screenshot({path:'test-aten-full.png', fullPage:false});
  await page.screenshot({path:'test-aten-clock.png', clip:{x:60, y:190, width:740, height:740}});
  const renderer = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    if (!c) return 'no canvas';
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return 'no gl';
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    return info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : 'no info ext';
  });
  console.log('GPU:', renderer);
  await browser.close();
})();
