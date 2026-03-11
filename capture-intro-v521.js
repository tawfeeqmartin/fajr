const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

(async () => {
  const outDir = '/tmp/intro-frames';
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome-stable',
    headless: true,
    defaultViewport: null,
    args: [
      '--window-size=430,932',
      '--no-sandbox',
      '--disable-gpu-sandbox',
      '--use-gl=angle',
      '--use-angle=gl-egl',
      '--ozone-platform=headless',
      '--ignore-gpu-blocklist',
      '--disable-dev-shm-usage',
      '--in-process-gpu',
      '--enable-webgl'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 430, height: 932, deviceScaleFactor: 3, isMobile: true });

  const client = await page.target().createCDPSession();
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 430,
    height: 932,
    deviceScaleFactor: 3,
    mobile: true,
    screenWidth: 430,
    screenHeight: 932
  });

  let frameCount = 0;
  client.on('Page.screencastFrame', async ({ data, sessionId }) => {
    frameCount += 1;
    const file = path.join(outDir, `frame-${String(frameCount).padStart(5, '0')}.png`);
    fs.writeFileSync(file, Buffer.from(data, 'base64'));
    await client.send('Page.screencastFrameAck', { sessionId });
  });

  await client.send('Page.startScreencast', {
    format: 'png',
    everyNthFrame: 1,
    maxWidth: 1290,
    maxHeight: 2796
  });

  await page.goto('http://localhost:7747/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 14000));

  await client.send('Page.stopScreencast');
  await new Promise(r => setTimeout(r, 1000));
  await browser.close();

  console.log(`Captured ${frameCount} frames`);
})();
