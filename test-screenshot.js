const puppeteer = require('puppeteer-core');
(async () => {
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/google-chrome-stable',
        args: ['--no-sandbox','--disable-gpu-sandbox','--use-gl=angle','--use-angle=gl-egl','--ozone-platform=headless','--ignore-gpu-blocklist','--disable-dev-shm-usage','--in-process-gpu','--enable-webgl'],
        headless: 'new',
        env: { ...process.env, GALLIUM_DRIVER:'d3d12', MESA_D3D12_DEFAULT_ADAPTER_NAME:'NVIDIA', LD_LIBRARY_PATH:'/usr/lib/wsl/lib:' + (process.env.LD_LIBRARY_PATH||'') }
    });
    const page = await browser.newPage();
    await page.setViewport({width:430, height:932, deviceScaleFactor:2});
    await page.goto('http://localhost:8891/#clock', {waitUntil:'domcontentloaded'});
    await new Promise(r => setTimeout(r, 14000));
    await page.screenshot({path:'/tmp/kaaba-contrast.png', fullPage:false});
    // Crop just the clock center
    await page.screenshot({path:'/tmp/kaaba-center.png', fullPage:false, clip:{x:60, y:190, width:740, height:740}});
    const renderer = await page.evaluate(() => {
        const c = document.querySelector('canvas');
        if (!c) return 'no canvas';
        const gl = c.getContext('webgl2') || c.getContext('webgl');
        if (!gl) return 'no gl';
        const dbg = gl.getExtension('WEBGL_debug_renderer_info');
        return dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'no dbg ext';
    });
    console.log('Renderer:', renderer);
    await browser.close();
})();
