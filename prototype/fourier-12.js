// fourier-12.js — Fourier epicycle drawing of Arabic numerals ١٢ ٣ ٦ ٩
// Three.js + bloom post-processing
// Standalone: all path parsing, DFT, and rendering in one file

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import GUI from 'lil-gui';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const TWO_PI = Math.PI * 2;
const CYCLE_DURATION = 10; // seconds for one full drawing cycle
const PAUSE_DURATION = 1.5; // seconds to pause after completing a cycle

// ═══════════════════════════════════════════════════════════════
// PRE-EXTRACTED GLYPH PATH DATA — from Lateef font
// ═══════════════════════════════════════════════════════════════

const TWELVE_PATH = {
    "a": "١٢",
    "w": 35.37, "h": 39.76,
    "c": [
        ["M",-17.68,-10.42],["L",-17.68,-10.42],["L",-15.54,-19.88],
        ["Q",-9.35,-11.87,-7.1,-1.86],["Q",-4.85,8.14,-7.56,19.88],
        ["L",-7.56,19.88],["L",-8.09,19.88],
        ["Q",-8.37,11.76,-10.51,3.9],["Q",-12.66,-3.96,-17.68,-10.42],["Z"],
        ["M",17.16,-19.35],["L",17.68,-19.35],
        ["Q",17.68,-15.56,16.66,-12.43],["Q",15.64,-9.3,13.83,-7.44],
        ["Q",12.02,-5.57,9.67,-5.57],["L",9.67,-5.57],
        ["Q",7.84,-5.57,5.84,-6.84],["L",5.84,-6.84],["L",4.04,-15.35],
        ["Q",5.06,-13.66,6.5,-12.78],["Q",7.95,-11.9,9.53,-11.9],["L",9.53,-11.9],
        ["Q",11.74,-11.9,13.85,-13.71],["Q",15.96,-15.52,17.16,-19.35],["L",17.16,-19.35],["Z"],
        ["M",-1.2,-10.42],["L",-1.2,-10.42],["L",0.95,-19.88],
        ["Q",7.14,-11.87,9.39,-1.86],["Q",11.64,8.14,8.93,19.88],
        ["L",8.93,19.88],["L",8.4,19.88],
        ["Q",8.12,11.76,5.98,3.9],["Q",3.83,-3.96,-1.2,-10.42],["Z"]
    ]
};

const THREE_PATH = {
    "a": "٣",
    "w": 26.26, "h": 39.76,
    "c": [
        ["M",12.6,-18.62],
        ["L",12.6,-18.62],
        ["L",13.13,-18.62],
        ["Q",13.13,-14.78,12.09,-11.6],
        ["Q",11.06,-8.42,9.35,-6.52],
        ["Q",7.65,-4.62,5.61,-4.62],
        ["L",5.61,-4.62],
        ["Q",3.32,-4.62,1.25,-7.26],
        ["L",1.25,-7.26],
        ["Q",-0.44,-4.83,-3.15,-4.83],
        ["L",-3.15,-4.83],
        ["Q",-4.87,-4.83,-6.1,-6.1],
        ["L",-6.1,-6.1],
        ["L",-7.12,-14.01],
        ["Q",-5.5,-11.06,-3.46,-11.06],
        ["L",-3.46,-11.06],
        ["Q",-1.81,-11.06,-0.25,-13.08],
        ["Q",1.32,-15.1,2.41,-18.62],
        ["L",2.41,-18.62],
        ["L",2.94,-18.62],
        ["Q",2.94,-10.92,6.59,-10.92],
        ["L",6.59,-10.92],
        ["Q",8.1,-10.92,10.02,-12.64],
        ["Q",11.94,-14.36,12.6,-18.62],
        ["Z"],
        ["M",-13.13,-10.42],
        ["L",-13.13,-10.42],
        ["L",-10.99,-19.88],
        ["Q",-4.8,-11.87,-2.55,-1.86],
        ["Q",-0.3,8.14,-3.01,19.88],
        ["L",-3.01,19.88],
        ["L",-3.53,19.88],
        ["Q",-3.81,11.76,-5.96,3.9],
        ["Q",-8.1,-3.96,-13.13,-10.42],
        ["Z"]
    ]
};

const SIX_PATH = {
    "a": "٦",
    "w": 23.13, "h": 38.95,
    "c": [
        ["M",-11,-19.48],
        ["L",-11,-19.48],
        ["L",-10.48,-19.48],
        ["Q",-9,-18.14,-7.21,-17.54],
        ["Q",-5.41,-16.95,-3.37,-16.95],
        ["L",-3.37,-16.95],
        ["Q",-1.41,-16.95,0.72,-17.42],
        ["Q",2.85,-17.89,5.1,-18.74],
        ["L",5.1,-18.74],
        ["Q",5.1,-12.8,5.75,-7.26],
        ["Q",6.4,-1.72,7.84,2.85],
        ["Q",9.28,7.42,11.57,10.55],
        ["L",11.57,10.55],
        ["L",9.32,19.48],
        ["Q",7.38,16.66,6.19,12.69],
        ["Q",4.99,8.72,4.39,4.18],
        ["Q",3.8,-0.35,3.59,-4.9],
        ["Q",3.38,-9.46,3.38,-13.43],
        ["L",3.38,-13.43],
        ["L",3.73,-13.25],
        ["Q",-0.46,-10.62,-4.82,-10.62],
        ["L",-4.82,-10.62],
        ["Q",-8.16,-10.62,-9.65,-11.53],
        ["Q",-11.14,-12.45,-11.36,-14.4],
        ["Q",-11.57,-16.35,-11,-19.48],
        ["Z"]
    ]
};

const NINE_PATH = {
    "a": "٩",
    "w": 18.67, "h": 39.48,
    "c": [
        ["M",1.67,-6.35],
        ["L",2.76,-1.04],
        ["Q",2.2,-0.23,0.37,0.63],
        ["Q",-1.46,1.49,-3.11,1.49],
        ["L",-3.11,1.49],
        ["Q",-6.91,1.49,-8.12,-0.16],
        ["Q",-9.33,-1.81,-9.33,-4.38],
        ["L",-9.33,-4.38],
        ["Q",-9.33,-6.21,-8.89,-8.79],
        ["Q",-8.46,-11.37,-7.52,-13.89],
        ["Q",-6.59,-16.4,-5.12,-18.07],
        ["Q",-3.64,-19.74,-1.56,-19.74],
        ["L",-1.56,-19.74],
        ["Q",-0.12,-19.74,0.83,-18.05],
        ["Q",1.78,-16.37,2.48,-13.59],
        ["Q",3.18,-10.81,3.78,-7.45],
        ["Q",4.38,-4.1,5.1,-0.72],
        ["Q",5.82,2.65,6.84,5.55],
        ["Q",7.86,8.46,9.33,10.28],
        ["L",9.33,10.28],
        ["L",8.28,19.74],
        ["Q",6.73,17.77,5.7,14.59],
        ["Q",4.66,11.41,3.92,7.68],
        ["Q",3.18,3.96,2.57,0.23],
        ["Q",1.95,-3.5,1.23,-6.59],
        ["Q",0.51,-9.69,-0.47,-11.55],
        ["Q",-1.46,-13.41,-2.97,-13.41],
        ["L",-2.97,-13.41],
        ["Q",-4.27,-13.41,-5.15,-12.57],
        ["Q",-6.03,-11.72,-6.56,-10.55],
        ["Q",-7.08,-9.37,-7.29,-8.4],
        ["Q",-7.51,-7.44,-7.51,-7.15],
        ["L",-7.51,-7.15],
        ["Q",-7.51,-6.24,-6.01,-5.54],
        ["Q",-4.52,-4.83,-2.58,-4.83],
        ["L",-2.58,-4.83],
        ["Q",-1.32,-4.83,-0.16,-5.19],
        ["Q",1,-5.54,1.67,-6.35],
        ["L",1.67,-6.35],
        ["Z"]
    ]
};

// ═══════════════════════════════════════════════════════════════
// CONFIG (GUI-driven)
// ═══════════════════════════════════════════════════════════════

const config = {
    numCoeffs: 200,
    speed: 1,
    showCircles: true,
    showRadii: true,
    trailLength: 1000,
};

// ═══════════════════════════════════════════════════════════════
// PATH PARSING — Convert glyph commands to sampled points
// ═══════════════════════════════════════════════════════════════

/**
 * Parse a path command array into separate contours.
 * Each contour is an array of {x, y} points, sampled from lines
 * and quadratic/cubic bezier curves.
 */
function parsePathToContours(pathData) {
    const commands = pathData.c;
    const contours = [];
    let current = [];
    let cx = 0, cy = 0; // current pen position
    let startX = 0, startY = 0; // start of current contour

    const BEZIER_STEPS = 20; // samples per bezier

    for (const cmd of commands) {
        const type = cmd[0];

        if (type === 'M') {
            if (current.length > 0) {
                contours.push(current);
            }
            cx = cmd[1];
            cy = cmd[2];
            startX = cx;
            startY = cy;
            current = [{ x: cx, y: cy }];
        } else if (type === 'L') {
            cx = cmd[1];
            cy = cmd[2];
            const last = current[current.length - 1];
            if (!last || Math.abs(last.x - cx) > 0.001 || Math.abs(last.y - cy) > 0.001) {
                current.push({ x: cx, y: cy });
            }
        } else if (type === 'Q') {
            const x0 = cx, y0 = cy;
            const cpx = cmd[1], cpy = cmd[2];
            const x2 = cmd[3], y2 = cmd[4];

            for (let i = 1; i <= BEZIER_STEPS; i++) {
                const t = i / BEZIER_STEPS;
                const mt = 1 - t;
                current.push({
                    x: mt * mt * x0 + 2 * mt * t * cpx + t * t * x2,
                    y: mt * mt * y0 + 2 * mt * t * cpy + t * t * y2,
                });
            }
            cx = x2;
            cy = y2;
        } else if (type === 'C') {
            // Cubic bezier: from (cx, cy) via (cmd[1],cmd[2]) and (cmd[3],cmd[4]) to (cmd[5],cmd[6])
            const x0 = cx, y0 = cy;
            const cp1x = cmd[1], cp1y = cmd[2];
            const cp2x = cmd[3], cp2y = cmd[4];
            const x3 = cmd[5], y3 = cmd[6];

            for (let i = 1; i <= BEZIER_STEPS; i++) {
                const t = i / BEZIER_STEPS;
                const mt = 1 - t;
                current.push({
                    x: mt*mt*mt*x0 + 3*mt*mt*t*cp1x + 3*mt*t*t*cp2x + t*t*t*x3,
                    y: mt*mt*mt*y0 + 3*mt*mt*t*cp1y + 3*mt*t*t*cp2y + t*t*t*y3,
                });
            }
            cx = x3;
            cy = y3;
        } else if (type === 'Z') {
            const last = current[current.length - 1];
            if (last && (Math.abs(last.x - startX) > 0.01 || Math.abs(last.y - startY) > 0.01)) {
                current.push({ x: startX, y: startY });
            }
            contours.push(current);
            current = [];
            cx = startX;
            cy = startY;
        }
    }

    if (current.length > 0) {
        contours.push(current);
    }

    return contours;
}

/**
 * Stitch multiple contours into one continuous path.
 */
function stitchContours(contours) {
    if (contours.length === 0) return [];
    if (contours.length === 1) return contours[0];

    const JUMP_POINTS = 10;
    const result = [...contours[0]];

    for (let c = 1; c < contours.length; c++) {
        const from = result[result.length - 1];
        const to = contours[c][0];

        for (let i = 1; i <= JUMP_POINTS; i++) {
            const t = i / (JUMP_POINTS + 1);
            result.push({
                x: from.x + t * (to.x - from.x),
                y: from.y + t * (to.y - from.y),
            });
        }

        result.push(...contours[c]);
    }

    // Close the loop
    const from = result[result.length - 1];
    const to = result[0];
    for (let i = 1; i <= JUMP_POINTS; i++) {
        const t = i / (JUMP_POINTS + 1);
        result.push({
            x: from.x + t * (to.x - from.x),
            y: from.y + t * (to.y - from.y),
        });
    }

    return result;
}

/**
 * Resample a polyline to N equidistant points.
 */
function resamplePath(points, N) {
    if (points.length < 2) return points;

    const lengths = [0];
    for (let i = 1; i < points.length; i++) {
        const dx = points[i].x - points[i - 1].x;
        const dy = points[i].y - points[i - 1].y;
        lengths.push(lengths[i - 1] + Math.sqrt(dx * dx + dy * dy));
    }
    const totalLen = lengths[lengths.length - 1];
    if (totalLen === 0) return points.slice(0, N);

    const result = new Array(N);
    let seg = 0;

    for (let i = 0; i < N; i++) {
        const targetLen = (i / N) * totalLen;
        while (seg < lengths.length - 2 && lengths[seg + 1] < targetLen) seg++;
        const segLen = lengths[seg + 1] - lengths[seg];
        const t = segLen > 0 ? (targetLen - lengths[seg]) / segLen : 0;
        result[i] = {
            x: points[seg].x + t * (points[seg + 1].x - points[seg].x),
            y: points[seg].y + t * (points[seg + 1].y - points[seg].y),
        };
    }

    return result;
}

// ═══════════════════════════════════════════════════════════════
// DFT — Discrete Fourier Transform
// ═══════════════════════════════════════════════════════════════

/**
 * Compute the DFT of complex-valued points.
 * Input:  [{x, y}, ...] treated as x + iy
 * Output: [{freq, amp, phase}, ...] sorted by amplitude descending
 */
function computeDFT(points) {
    const N = points.length;
    const coefficients = [];

    for (let k = -Math.floor(N / 2); k <= Math.floor(N / 2); k++) {
        let re = 0, im = 0;
        for (let n = 0; n < N; n++) {
            const angle = -TWO_PI * k * n / N;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            re += points[n].x * cos - points[n].y * sin;
            im += points[n].x * sin + points[n].y * cos;
        }
        re /= N;
        im /= N;

        coefficients.push({
            freq: k,
            amp: Math.sqrt(re * re + im * im),
            phase: Math.atan2(im, re),
        });
    }

    coefficients.sort((a, b) => b.amp - a.amp);
    return coefficients;
}

// ═══════════════════════════════════════════════════════════════
// EPICYCLE EVALUATION
// ═══════════════════════════════════════════════════════════════

/**
 * Evaluate the epicycle chain at parameter t.
 * Returns { x, y, circles } where circles holds intermediate positions.
 */
function evaluateEpicycles(coeffs, t, numCoeffs) {
    let x = 0, y = 0;
    const circles = [];
    const n = Math.min(numCoeffs, coeffs.length);

    for (let i = 0; i < n; i++) {
        const { freq, amp, phase } = coeffs[i];
        const prevX = x, prevY = y;
        x += amp * Math.cos(freq * t + phase);
        y += amp * Math.sin(freq * t + phase);
        circles.push({ cx: prevX, cy: prevY, r: amp, ex: x, ey: y });
    }

    return { x, y, circles };
}

// ═══════════════════════════════════════════════════════════════
// THREE.JS SCENE SETUP
// ═══════════════════════════════════════════════════════════════

let W = window.innerWidth, H = window.innerHeight;
const aspect = W / H;
const frustum = 2;
const halfW = frustum * aspect;
const halfH = frustum;
const clockRadius = Math.min(halfW, halfH) * 0.78;

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
    0.5,   // strength
    0.6,   // radius
    0.15   // threshold
);
composer.addPass(bloomPass);

// ═══════════════════════════════════════════════════════════════
// SHARED TEXTURES
// ═══════════════════════════════════════════════════════════════

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

// Pre-compute unit circle positions (shared across all epicycle pools)
const circleSegments = 64;
const unitCirclePositions = new Float32Array((circleSegments + 1) * 3);
for (let i = 0; i <= circleSegments; i++) {
    const a = (i / circleSegments) * TWO_PI;
    unitCirclePositions[i * 3]     = Math.cos(a);
    unitCirclePositions[i * 3 + 1] = Math.sin(a);
    unitCirclePositions[i * 3 + 2] = 0;
}

// ═══════════════════════════════════════════════════════════════
// SHARED SCENE OBJECTS — center dot
// ═══════════════════════════════════════════════════════════════

const centerDotGeo = new THREE.BufferGeometry();
centerDotGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0.01]), 3));
const centerDotMat = new THREE.PointsMaterial({
    size: 6,
    map: dotTexture,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    sizeAttenuation: false,
    color: 0x667788,
});
const centerDot = new THREE.Points(centerDotGeo, centerDotMat);
scene.add(centerDot);

// ═══════════════════════════════════════════════════════════════
// NUMERAL DRAWER — encapsulates one epicycle chain + visuals
// ═══════════════════════════════════════════════════════════════

const SAMPLE_COUNT = 1500;
const TRAIL_MAX = 2000;
const CIRCLE_POOL_PER = 50;
const MAX_CIRCLES = 500;

/**
 * Create a NumeralDrawer that manages one numeral's epicycle chain,
 * trail, ghost, circles, radii, pen dot, and center line.
 */
function createNumeralDrawer(pathData, position) {
    // --- Compute glyph points ---
    const contours = parsePathToContours(pathData);
    const stitched = stitchContours(contours);
    const sampled = resamplePath(stitched, SAMPLE_COUNT);

    const glyphScale = 0.18 / pathData.h;

    const glyphPoints = sampled.map(p => ({
        x: p.x * glyphScale,
        y: -p.y * glyphScale,
    }));

    // --- Compute DFT ---
    const coefficients = computeDFT(glyphPoints);

    // --- Center-to-position line ---
    const centerLineGeo = new THREE.BufferGeometry();
    centerLineGeo.setAttribute('position', new THREE.BufferAttribute(
        new Float32Array([0, 0, 0, position.x, position.y, 0]), 3
    ));
    const centerLineMat = new THREE.LineBasicMaterial({
        color: 0x334455,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        depthTest: false,
    });
    const centerLine = new THREE.Line(centerLineGeo, centerLineMat);
    scene.add(centerLine);

    // --- Trail line (ink) ---
    const trailPositions = new Float32Array(TRAIL_MAX * 3);
    const trailColors = new Float32Array(TRAIL_MAX * 4);
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    trailGeo.setAttribute('color', new THREE.BufferAttribute(trailColors, 4));
    trailGeo.setDrawRange(0, 0);

    const trailMat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthTest: false,
    });
    const trailLine = new THREE.Line(trailGeo, trailMat);
    scene.add(trailLine);

    // --- Epicycle circle pool ---
    const epicycleCircles = [];
    for (let i = 0; i < CIRCLE_POOL_PER; i++) {
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

    // --- Epicycle radii (arm lines) ---
    const armPositions = new Float32Array((MAX_CIRCLES + 1) * 3);
    const armGeo = new THREE.BufferGeometry();
    armGeo.setAttribute('position', new THREE.BufferAttribute(armPositions, 3));
    armGeo.setDrawRange(0, 0);
    const armMat = new THREE.LineBasicMaterial({
        color: 0x5577aa,
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
        depthTest: false,
    });
    const armLine = new THREE.Line(armGeo, armMat);
    scene.add(armLine);

    // --- Pen dot ---
    const penDotPosArr = new Float32Array(3);
    const penDotGeo = new THREE.BufferGeometry();
    penDotGeo.setAttribute('position', new THREE.BufferAttribute(penDotPosArr, 3));
    const penDotMat = new THREE.PointsMaterial({
        size: 10,
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

    // --- Ghost path (faint outline) ---
    const ghostPositions = new Float32Array(glyphPoints.length * 3);
    for (let i = 0; i < glyphPoints.length; i++) {
        ghostPositions[i * 3]     = glyphPoints[i].x + position.x;
        ghostPositions[i * 3 + 1] = glyphPoints[i].y + position.y;
        ghostPositions[i * 3 + 2] = -0.01;
    }
    const ghostGeo = new THREE.BufferGeometry();
    ghostGeo.setAttribute('position', new THREE.BufferAttribute(ghostPositions, 3));
    const ghostMat = new THREE.LineBasicMaterial({
        color: 0x445566,
        transparent: true,
        opacity: 0.06,
        blending: THREE.AdditiveBlending,
        depthTest: false,
    });
    const ghostLine = new THREE.Line(ghostGeo, ghostMat);
    scene.add(ghostLine);

    // --- State ---
    let trailCount = 0;

    function resetTrail() {
        trailCount = 0;
        trailGeo.setDrawRange(0, 0);
    }

    function update(t, cfg) {
        const maxTerms = Math.min(cfg.numCoeffs, coefficients.length);

        // Evaluate epicycles
        const pen = evaluateEpicycles(coefficients, t, maxTerms);

        const penWorldX = pen.x + position.x;
        const penWorldY = pen.y + position.y;

        // Accumulate trail
        const trailMax = Math.min(cfg.trailLength, TRAIL_MAX);

        if (trailCount < trailMax) {
            trailPositions[trailCount * 3]     = penWorldX;
            trailPositions[trailCount * 3 + 1] = penWorldY;
            trailPositions[trailCount * 3 + 2] = 0;
            trailCount++;
        } else {
            trailPositions.copyWithin(0, 3, trailMax * 3);
            trailPositions[(trailMax - 1) * 3]     = penWorldX;
            trailPositions[(trailMax - 1) * 3 + 1] = penWorldY;
            trailPositions[(trailMax - 1) * 3 + 2] = 0;
        }

        // Trail colors: gradient from faded to bright
        const drawCount = Math.min(trailCount, trailMax);
        for (let i = 0; i < drawCount; i++) {
            const brightness = i / drawCount;
            const r = 0.6 + 0.4 * brightness;
            const g = 0.5 + 0.3 * brightness;
            const b = 0.2 + 0.3 * brightness;
            const a = 0.05 + 0.85 * brightness * brightness;
            trailColors[i * 4]     = r;
            trailColors[i * 4 + 1] = g;
            trailColors[i * 4 + 2] = b;
            trailColors[i * 4 + 3] = a;
        }

        trailGeo.setDrawRange(0, drawCount);
        trailGeo.attributes.position.needsUpdate = true;
        trailGeo.attributes.color.needsUpdate = true;

        // Update epicycle circles
        const visibleCircleCount = Math.min(cfg.showCircles ? maxTerms : 0, CIRCLE_POOL_PER);

        for (let i = 0; i < CIRCLE_POOL_PER; i++) {
            const circle = epicycleCircles[i];
            if (i < visibleCircleCount && i < pen.circles.length) {
                const c = pen.circles[i];
                const cx = c.cx + position.x;
                const cy = c.cy + position.y;

                for (let j = 0; j <= circleSegments; j++) {
                    circle.posArr[j * 3]     = cx + unitCirclePositions[j * 3] * c.r;
                    circle.posArr[j * 3 + 1] = cy + unitCirclePositions[j * 3 + 1] * c.r;
                    circle.posArr[j * 3 + 2] = 0;
                }
                circle.geo.attributes.position.needsUpdate = true;

                circle.mat.opacity = 0.09 * (1 - i / visibleCircleCount);
                circle.mat.color.setHSL(210 / 360, 0.35, 0.5);
                circle.mat.needsUpdate = true;
                circle.line.visible = true;
            } else {
                circle.line.visible = false;
            }
        }

        // Update epicycle radii (arms)
        if (cfg.showRadii && pen.circles.length > 0) {
            const armCount = Math.min(maxTerms, pen.circles.length);
            armPositions[0] = pen.circles[0].cx + position.x;
            armPositions[1] = pen.circles[0].cy + position.y;
            armPositions[2] = 0;

            for (let i = 0; i < armCount; i++) {
                armPositions[(i + 1) * 3]     = pen.circles[i].ex + position.x;
                armPositions[(i + 1) * 3 + 1] = pen.circles[i].ey + position.y;
                armPositions[(i + 1) * 3 + 2] = 0;
            }
            armGeo.setDrawRange(0, armCount + 1);
            armGeo.attributes.position.needsUpdate = true;
            armLine.visible = true;
        } else {
            armLine.visible = false;
        }

        // Update pen dot
        penDotPosArr[0] = penWorldX;
        penDotPosArr[1] = penWorldY;
        penDotPosArr[2] = 0.01;
        penDotGeo.attributes.position.needsUpdate = true;
    }

    return {
        coefficients,
        resetTrail,
        update,
    };
}

// ═══════════════════════════════════════════════════════════════
// BUILD ALL 4 NUMERAL DRAWERS
// ═══════════════════════════════════════════════════════════════

const statusEl = document.getElementById('status');
statusEl.textContent = 'Computing DFT...';

const numerals = [
    createNumeralDrawer(TWELVE_PATH, { x: 0,            y:  clockRadius }),  // 12 o'clock — top
    createNumeralDrawer(THREE_PATH,  { x:  clockRadius,  y: 0           }),  //  3 o'clock — right
    createNumeralDrawer(SIX_PATH,    { x: 0,            y: -clockRadius }),  //  6 o'clock — bottom
    createNumeralDrawer(NINE_PATH,   { x: -clockRadius,  y: 0           }),  //  9 o'clock — left
];

const totalCoeffs = numerals.reduce((sum, n) => sum + n.coefficients.length, 0);
statusEl.textContent = `Ready — ${totalCoeffs} total coefficients`;
setTimeout(() => { statusEl.style.opacity = '0'; }, 2500);

// ═══════════════════════════════════════════════════════════════
// ANIMATION STATE
// ═══════════════════════════════════════════════════════════════

let animTime = 0;
let lastTimestamp = 0;
let paused = false;
let pauseTimer = 0;

function resetAllTrails() {
    for (const n of numerals) {
        n.resetTrail();
    }
}

// ═══════════════════════════════════════════════════════════════
// RENDER LOOP
// ═══════════════════════════════════════════════════════════════

function update(timestamp) {
    requestAnimationFrame(update);

    // Compute delta time
    if (lastTimestamp === 0) lastTimestamp = timestamp;
    const rawDt = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;

    const dt = Math.min(rawDt, 0.1);

    // Handle pause between cycles
    if (paused) {
        pauseTimer -= dt;
        if (pauseTimer <= 0) {
            paused = false;
            animTime = 0;
            resetAllTrails();
        }
        composer.render();
        return;
    }

    // Advance animation time
    animTime += dt * config.speed;

    // Compute t parameter: 0 to TWO_PI over CYCLE_DURATION seconds
    const cycleFraction = animTime / CYCLE_DURATION;
    const t = cycleFraction * TWO_PI;

    // Check if cycle completed
    if (cycleFraction >= 1.0) {
        paused = true;
        pauseTimer = PAUSE_DURATION;
        composer.render();
        return;
    }

    // Update all 4 numeral drawers simultaneously
    for (const numeral of numerals) {
        numeral.update(t, config);
    }

    // Render
    composer.render();
}

// ═══════════════════════════════════════════════════════════════
// GUI (lil-gui)
// ═══════════════════════════════════════════════════════════════

const gui = new GUI({ title: 'Fourier ١٢ ٣ ٦ ٩', width: 240 });
gui.domElement.style.opacity = '0.85';

gui.add(config, 'numCoeffs', 10, 500, 1).name('Coefficients');
gui.add(config, 'speed', 0.1, 3, 0.1).name('Speed');
gui.add(config, 'showCircles').name('Show Circles');
gui.add(config, 'showRadii').name('Show Radii');
gui.add(config, 'trailLength', 100, 2000, 10).name('Trail Length');
gui.add({
    restart: () => {
        paused = false;
        pauseTimer = 0;
        animTime = 0;
        resetAllTrails();
    }
}, 'restart').name('Restart');

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

// Right-click save screenshot
renderer.domElement.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    renderer.domElement.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const d = new Date();
        const ts = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
        a.download = `fourier-cardinal-${ts}.png`;
        a.click();
        URL.revokeObjectURL(url);
    }, 'image/png');
});

// ═══════════════════════════════════════════════════════════════
// START
// ═══════════════════════════════════════════════════════════════

requestAnimationFrame(update);
