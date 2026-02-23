// fourier-bismillah.js — Fourier epicycle drawing of Bismillah calligraphy
// Three.js + bloom post-processing, matching tawaf-gl.js conventions

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import GUI from 'lil-gui';
import { computeDFT, evaluateEpicycles, getEpicycleChain } from './fourier-dft.js';
import { loadBismillahPath, stitchSubPaths, samplePath, warpToCircle } from './fourier-path.js';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const TWO_PI = Math.PI * 2;
const FONT_URL = 'https://cdn.jsdelivr.net/gh/aliftype/amiri@0.113/Amiri-Regular.ttf';

// Prayer palette (from tawaf-gl.js)
const PRAYER_PALETTES = {
    fajr:    { h: 220, s: 50, l: 55 },
    dhuhr:   { h: 42,  s: 55, l: 60 },
    asr:     { h: 28,  s: 50, l: 55 },
    maghrib: { h: 340, s: 50, l: 55 },
    isha:    { h: 265, s: 45, l: 50 },
};

// ═══════════════════════════════════════════════════════════════
// CONFIG (GUI-driven)
// ═══════════════════════════════════════════════════════════════

const config = {
    coeffCount: 800,
    showCircles: true,
    circleCount: 30,
    trailOpacity: 0.7,
    forceNight: true,
    sampleCount: 3000,
    fontSize: 72,
    yScale: 0.28, // radial thickness as fraction of clockRadius
};

// ═══════════════════════════════════════════════════════════════
// THREE.JS SETUP (matching tawaf-gl.js)
// ═══════════════════════════════════════════════════════════════

let W = window.innerWidth, H = window.innerHeight;
const aspect = W / H;
const frustum = 2;
const clockRadius = frustum * 0.88;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#020204');

const camera = new THREE.OrthographicCamera(
    -frustum * aspect, frustum * aspect, frustum, -frustum, 0.1, 100
);
camera.position.set(0, 0, 10);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true,
    powerPreference: 'high-performance',
});
renderer.setSize(W, H);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.insertBefore(renderer.domElement, document.getElementById('overlay'));

// Post-processing: bloom
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(W, H),
    0.45,  // strength
    0.6,   // radius
    0.15   // threshold
);
composer.addPass(bloomPass);

// ═══════════════════════════════════════════════════════════════
// PRE-ALLOCATED SCENE OBJECTS
// ═══════════════════════════════════════════════════════════════

// --- Trail line: the "ink" drawn by the pen ---
const TRAIL_MAX = 3600; // 60fps × 60s
const trailPositions = new Float32Array(TRAIL_MAX * 3);
const trailGeo = new THREE.BufferGeometry();
trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
trailGeo.setDrawRange(0, 0);
const trailMat = new THREE.LineBasicMaterial({
    color: new THREE.Color().setHSL(265 / 360, 0.45, 0.50),
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthTest: false,
});
const trailLine = new THREE.Line(trailGeo, trailMat);
scene.add(trailLine);

// --- Epicycle circles (top N by amplitude) ---
const MAX_CIRCLES = 50;
const circleSegments = 64;
// Pre-compute unit circle positions for reuse
const unitCirclePositions = new Float32Array((circleSegments + 1) * 3);
for (let i = 0; i <= circleSegments; i++) {
    const a = (i / circleSegments) * TWO_PI;
    unitCirclePositions[i * 3]     = Math.cos(a);
    unitCirclePositions[i * 3 + 1] = Math.sin(a);
    unitCirclePositions[i * 3 + 2] = 0;
}

const epicycleCircles = [];
for (let i = 0; i < MAX_CIRCLES; i++) {
    const posArr = new Float32Array((circleSegments + 1) * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    const mat = new THREE.LineBasicMaterial({
        color: 0x4466aa,
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
        depthTest: false,
    });
    const line = new THREE.LineLoop(geo, mat);
    line.visible = false;
    scene.add(line);
    epicycleCircles.push({ line, posArr, geo, mat });
}

// --- Epicycle arms (connecting line segments) ---
const armPositions = new Float32Array((MAX_CIRCLES + 1) * 3);
const armGeo = new THREE.BufferGeometry();
armGeo.setAttribute('position', new THREE.BufferAttribute(armPositions, 3));
armGeo.setDrawRange(0, 0);
const armMat = new THREE.LineBasicMaterial({
    color: 0x6688cc,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending,
    depthTest: false,
});
const armLine = new THREE.Line(armGeo, armMat);
scene.add(armLine);

// --- Pen dot (current drawing position) ---
function createDotTexture(size) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const center = size / 2;
    const grad = ctx.createRadialGradient(center, center, 0, center, center, center);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.3, 'rgba(255,255,255,0.8)');
    grad.addColorStop(0.6, 'rgba(255,255,255,0.2)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
}
const dotTexture = createDotTexture(64);

const penDotPosArr = new Float32Array(3);
const penDotGeo = new THREE.BufferGeometry();
penDotGeo.setAttribute('position', new THREE.BufferAttribute(penDotPosArr, 3));
const penDotMat = new THREE.PointsMaterial({
    size: 12,
    map: dotTexture,
    transparent: true,
    opacity: 1.0,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    sizeAttenuation: false,
    color: 0xffffff,
});
const penDot = new THREE.Points(penDotGeo, penDotMat);
scene.add(penDot);

// --- Ghost path: faint outline of the target shape ---
let ghostLine = null;

function buildGhostPath(warpedPoints) {
    if (ghostLine) {
        ghostLine.geometry.dispose();
        ghostLine.material.dispose();
        scene.remove(ghostLine);
    }
    const positions = new Float32Array(warpedPoints.length * 3);
    for (let i = 0; i < warpedPoints.length; i++) {
        positions[i * 3]     = warpedPoints[i].x;
        positions[i * 3 + 1] = warpedPoints[i].y;
        positions[i * 3 + 2] = -0.01;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({
        color: 0x445566,
        transparent: true,
        opacity: 0.08,
        blending: THREE.AdditiveBlending,
        depthTest: false,
    });
    ghostLine = new THREE.Line(geo, mat);
    scene.add(ghostLine);
}

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let coefficients = null;
let trailCount = 0;
let lastTrailT = -1;
let lastFrameTime = 0;
let loading = true;

// ═══════════════════════════════════════════════════════════════
// INIT: Load font, extract path, compute DFT
// ═══════════════════════════════════════════════════════════════

async function init() {
    const statusEl = document.getElementById('status');
    statusEl.textContent = 'Loading Amiri font...';

    try {
        // Dynamic import of opentype.js
        const opentype = await import('https://esm.sh/opentype.js@1.3.4');

        statusEl.textContent = 'Extracting Bismillah path...';
        const { subPaths } = await loadBismillahPath(opentype, FONT_URL, config.fontSize);

        statusEl.textContent = `Stitching ${subPaths.length} sub-paths...`;
        const stitched = stitchSubPaths(subPaths, 0.5);

        statusEl.textContent = `Resampling to ${config.sampleCount} points...`;
        const sampled = samplePath(stitched, config.sampleCount);

        statusEl.textContent = 'Warping to circle...';
        const warped = warpToCircle(sampled, clockRadius, clockRadius * config.yScale);

        // Build ghost path
        buildGhostPath(warped);

        statusEl.textContent = `Computing DFT (${warped.length} points)...`;
        // Defer DFT to next frame to avoid blocking UI
        await new Promise(r => requestAnimationFrame(r));
        coefficients = computeDFT(warped);

        statusEl.textContent = `Ready — ${coefficients.length} coefficients`;
        setTimeout(() => { statusEl.style.opacity = '0'; }, 2000);

        loading = false;
        resetTrail();
    } catch (err) {
        statusEl.textContent = `Error: ${err.message}`;
        console.error(err);
    }
}

function resetTrail() {
    trailCount = 0;
    lastTrailT = -1;
    trailGeo.setDrawRange(0, 0);
}

// ═══════════════════════════════════════════════════════════════
// DAY / NIGHT
// ═══════════════════════════════════════════════════════════════

function isNight() {
    return config.forceNight;
}

function applyDayNight() {
    const night = isNight();
    const bg = night ? '#020204' : '#f5f2ed';
    scene.background = new THREE.Color(bg);
    document.body.style.background = bg;

    bloomPass.strength = night ? 0.45 : 0;
    bloomPass.threshold = night ? 0.15 : 0;
    bloomPass.radius = night ? 0.6 : 0;

    trailMat.blending = night ? THREE.AdditiveBlending : THREE.NormalBlending;
    trailMat.needsUpdate = true;

    armMat.blending = night ? THREE.AdditiveBlending : THREE.NormalBlending;
    armMat.needsUpdate = true;

    penDotMat.blending = night ? THREE.AdditiveBlending : THREE.NormalBlending;
    penDotMat.needsUpdate = true;

    for (const c of epicycleCircles) {
        c.mat.blending = night ? THREE.AdditiveBlending : THREE.NormalBlending;
        c.mat.needsUpdate = true;
    }

    // Update overlay text colors
    const versionEl = document.getElementById('version-tag');
    if (versionEl) versionEl.style.color = night ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
    const statusEl = document.getElementById('status');
    if (statusEl) statusEl.style.color = night ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
}

// ═══════════════════════════════════════════════════════════════
// RENDER LOOP
// ═══════════════════════════════════════════════════════════════

function update(timestamp) {
    requestAnimationFrame(update);

    // Throttle to ~60fps
    if (timestamp - lastFrameTime < 16) return;
    lastFrameTime = timestamp;

    if (loading || !coefficients) {
        composer.render();
        return;
    }

    const now = new Date();
    const s = now.getSeconds() + now.getMilliseconds() / 1000;
    const t = (s / 60) * TWO_PI;

    const maxTerms = Math.min(config.coeffCount, coefficients.length);
    const night = isNight();

    // --- Evaluate pen position ---
    const pen = evaluateEpicycles(coefficients, t, maxTerms);

    // --- Accumulate trail ---
    // Add a point each frame, ring-buffer style
    if (trailCount < TRAIL_MAX) {
        trailPositions[trailCount * 3]     = pen.x;
        trailPositions[trailCount * 3 + 1] = pen.y;
        trailPositions[trailCount * 3 + 2] = 0;
        trailCount++;
        trailGeo.setDrawRange(0, trailCount);
        trailGeo.attributes.position.needsUpdate = true;
    } else {
        // Ring buffer: shift forward
        trailPositions.copyWithin(0, 3, TRAIL_MAX * 3);
        trailPositions[(TRAIL_MAX - 1) * 3]     = pen.x;
        trailPositions[(TRAIL_MAX - 1) * 3 + 1] = pen.y;
        trailPositions[(TRAIL_MAX - 1) * 3 + 2] = 0;
        trailGeo.attributes.position.needsUpdate = true;
    }

    // Detect full revolution: reset trail for clean re-draw
    if (lastTrailT > 0 && t < lastTrailT && (lastTrailT - t) > Math.PI) {
        resetTrail();
    }
    lastTrailT = t;

    // Trail appearance
    const palette = PRAYER_PALETTES.isha;
    trailMat.color.setHSL(palette.h / 360, palette.s / 100, palette.l / 100);
    trailMat.opacity = config.trailOpacity;

    // --- Update epicycle circles ---
    if (config.showCircles) {
        const chain = getEpicycleChain(coefficients, t, Math.min(config.circleCount, maxTerms));

        for (let i = 0; i < MAX_CIRCLES; i++) {
            const circle = epicycleCircles[i];
            if (i < chain.length) {
                const c = chain[i];
                // Scale and translate the unit circle
                for (let j = 0; j <= circleSegments; j++) {
                    circle.posArr[j * 3]     = c.cx + unitCirclePositions[j * 3] * c.radius;
                    circle.posArr[j * 3 + 1] = c.cy + unitCirclePositions[j * 3 + 1] * c.radius;
                    circle.posArr[j * 3 + 2] = 0;
                }
                circle.geo.attributes.position.needsUpdate = true;
                // Fade opacity by index
                circle.mat.opacity = night
                    ? 0.12 * (1 - i / chain.length)
                    : 0.08 * (1 - i / chain.length);
                circle.mat.color.setHSL(palette.h / 360, 0.3, night ? 0.5 : 0.3);
                circle.mat.needsUpdate = true;
                circle.line.visible = true;
            } else {
                circle.line.visible = false;
            }
        }

        // Update arms
        const armCount = Math.min(config.circleCount, maxTerms);
        const armChain = getEpicycleChain(coefficients, t, armCount);
        // First point is origin of first circle
        if (armChain.length > 0) {
            armPositions[0] = armChain[0].cx;
            armPositions[1] = armChain[0].cy;
            armPositions[2] = 0;
            for (let i = 0; i < armChain.length; i++) {
                armPositions[(i + 1) * 3]     = armChain[i].tipX;
                armPositions[(i + 1) * 3 + 1] = armChain[i].tipY;
                armPositions[(i + 1) * 3 + 2] = 0;
            }
            armGeo.setDrawRange(0, armChain.length + 1);
            armGeo.attributes.position.needsUpdate = true;
            armMat.opacity = night ? 0.15 : 0.08;
            armMat.color.setHSL(palette.h / 360, 0.3, night ? 0.5 : 0.3);
            armMat.needsUpdate = true;
        }
        armLine.visible = true;
    } else {
        for (const c of epicycleCircles) c.line.visible = false;
        armLine.visible = false;
    }

    // --- Update pen dot ---
    penDotPosArr[0] = pen.x;
    penDotPosArr[1] = pen.y;
    penDotPosArr[2] = 0.01;
    penDotGeo.attributes.position.needsUpdate = true;
    penDotMat.color.setHSL(palette.h / 360, 0.6, night ? 0.85 : 0.4);

    // --- Render ---
    composer.render();
}

// ═══════════════════════════════════════════════════════════════
// GUI (lil-gui)
// ═══════════════════════════════════════════════════════════════

const gui = new GUI({ title: 'Fourier Bismillah', width: 260 });
gui.domElement.style.opacity = '0.85';

gui.add(config, 'coeffCount', 50, 2000, 1).name('Coefficients');
gui.add(config, 'showCircles').name('Show Circles');
gui.add(config, 'circleCount', 5, 50, 1).name('Visible Circles');
gui.add(config, 'trailOpacity', 0.05, 1.0, 0.01).name('Trail Opacity');
gui.add(config, 'forceNight').name('Night Mode').onChange(() => applyDayNight());
gui.add({ reset: () => resetTrail() }, 'reset').name('Reset Trail');
gui.add({
    rebuild: async () => {
        loading = true;
        resetTrail();
        coefficients = null;
        const statusEl = document.getElementById('status');
        statusEl.style.opacity = '1';
        await init();
    }
}, 'rebuild').name('Rebuild DFT');

gui.close();

// ═══════════════════════════════════════════════════════════════
// EVENTS
// ═══════════════════════════════════════════════════════════════

window.addEventListener('resize', () => {
    W = window.innerWidth;
    H = window.innerHeight;
    const a = W / H;
    camera.left = -frustum * a;
    camera.right = frustum * a;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
    composer.setSize(W, H);
});

// Right-click save
renderer.domElement.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    renderer.domElement.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const d = new Date();
        const ts = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}`;
        a.download = `fourier-bismillah-${ts}.png`;
        a.click();
        URL.revokeObjectURL(url);
    }, 'image/png');
});

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════

applyDayNight();
init();
requestAnimationFrame(update);
