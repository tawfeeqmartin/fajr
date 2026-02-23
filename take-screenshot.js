const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome-stable',
    headless: 'new',
    args: ['--no-sandbox','--disable-gpu-sandbox','--use-gl=angle','--use-angle=gl-egl','--ozone-platform=headless','--ignore-gpu-blocklist','--disable-dev-shm-usage','--in-process-gpu','--enable-webgl']
  });
  const page = await browser.newPage();
  await page.setViewport({width:430, height:932, deviceScaleFactor:2});
  await page.goto('http://localhost:8766/index.html', {waitUntil:'domcontentloaded'});
  await new Promise(r => setTimeout(r, 15000));
  await page.screenshot({path:'test-aten-v21.png', fullPage:false});
  console.log('Screenshot saved: test-aten-v21.png');
  await browser.close();
})();
