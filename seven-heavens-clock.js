// seven-heavens-clock.js
// Seven Heavens — Orbital Prayer Clock Prototype
// Inspired by Ressence Type 8 DE1 (Pink) × Daniel Engelberg "Inside Out"

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const TWO_PI = Math.PI * 2;
const DOME_R = 300;
const DIAL_R = 80;

const RING_DEFS = [
    { name: 'kaaba',   iR: 0,    oR: 10,   color: 0x0a0608, metal: 0.95, rough: 0.08, cc: 0.8 },
    { name: 'hours',   iR: 11.5, oR: 24,   color: 0x1c1018, metal: 0.85, rough: 0.15, cc: 0.6 },
    { name: 'minutes', iR: 25.5, oR: 38,   color: 0x2d1822, metal: 0.70, rough: 0.25, cc: 0.5 },
    { name: 'prayer',  iR: 39.5, oR: 50,   color: 0x4a2838, metal: 0.55, rough: 0.32, cc: 0.4 },
    { name: 'qibla',   iR: 51.5, oR: 58,   color: 0x1a3a42, metal: 0.60, rough: 0.22, cc: 0.5 },
    { name: 'moon',    iR: 59.5, oR: 68,   color: 0x6a3850, metal: 0.40, rough: 0.38, cc: 0.35 },
    { name: 'chapter', iR: 69.5, oR: 80,   color: 0x8a4a62, metal: 0.30, rough: 0.42, cc: 0.3 },
];

const LUME_COLOR = new THREE.Color(0x4488ff);
const LUME_INTENSITY_MAX = 3.5;
const GROOVE_RADII = [10.75, 24.75, 39.0, 51.0, 59.0, 69.0];

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let renderer, scene, camera, controls, composer, bloomPass;
let clockGroup, ambLight, keyLight, fillLight, topLight;
let ringMeshes = [];
let origRingColors = [];
let lumeMeshes = [];
let softLumeMeshes = []; // large-area elements with lower glow
let hourOrbitGroup, minuteOrbitGroup, prayerGroup, moonGroup;
let hourSatMesh, minuteSatMesh;
let hourTexture, minuteTexture;
let lastHour = -1, lastMinute = -1;
let nightBlend = 0, nightTarget = 0;
let speedMultiplier = 1;
let virtualTimeOffset = 0, lastRealTime = Date.now();

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function domeZ(r) {
    if (r >= DOME_R) return DOME_R;
    return DOME_R - Math.sqrt(DOME_R * DOME_R - r * r);
}

function createDomeRing(innerR, outerR, thetaSegs = 128, phiSegs = 10) {
    const geo = new THREE.RingGeometry(innerR, outerR, thetaSegs, phiSegs);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const r = Math.sqrt(x * x + y * y);
        pos.setZ(i, domeZ(r));
    }
    geo.computeVertexNormals();
    return geo;
}

function createArcGeo(innerR, outerR, startAngle, endAngle, segs = 48) {
    const shape = new THREE.Shape();
    for (let i = 0; i <= segs; i++) {
        const a = startAngle + (endAngle - startAngle) * (i / segs);
        const x = Math.cos(a) * outerR, y = Math.sin(a) * outerR;
        i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y);
    }
    for (let i = segs; i >= 0; i--) {
        const a = startAngle + (endAngle - startAngle) * (i / segs);
        shape.lineTo(Math.cos(a) * innerR, Math.sin(a) * innerR);
    }
    shape.closePath();
    const geo = new THREE.ShapeGeometry(shape);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i);
        const r = Math.sqrt(x * x + y * y);
        pos.setZ(i, domeZ(r) + 0.15);
    }
    geo.computeVertexNormals();
    return geo;
}

function getVirtualTime() {
    const now = Date.now();
    const dt = now - lastRealTime;
    lastRealTime = now;
    virtualTimeOffset += dt * (speedMultiplier - 1);
    return new Date(now + virtualTimeOffset);
}

// ═══════════════════════════════════════════════════════════════
// SCENE SETUP
// ═══════════════════════════════════════════════════════════════

function initScene() {
    const container = document.getElementById('canvas-container');
    const W = window.innerWidth || 1280, H = window.innerHeight || 800;

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060608);

    camera = new THREE.PerspectiveCamera(24, W / H, 1, 2000);
    const tilt = 7 * (Math.PI / 180);
    camera.position.set(0, Math.sin(tilt) * 380, Math.cos(tilt) * 380);
    camera.lookAt(0, 0, domeZ(0));

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.04;
    controls.minDistance = 180;
    controls.maxDistance = 600;
    controls.target.set(0, 0, domeZ(0));
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.25;
    controls.update();

    clockGroup = new THREE.Group();
    scene.add(clockGroup);
}

function initLighting() {
    ambLight = new THREE.AmbientLight(0xfff8f2, 0.15);
    scene.add(ambLight);

    keyLight = new THREE.RectAreaLight(0xfff4e8, 3.5, 200, 300);
    keyLight.position.set(-180, 80, 240);
    keyLight.lookAt(0, 0, 0);
    scene.add(keyLight);

    fillLight = new THREE.RectAreaLight(0xe0ecff, 0.5, 250, 250);
    fillLight.position.set(140, -60, 200);
    fillLight.lookAt(0, 0, 0);
    scene.add(fillLight);

    topLight = new THREE.RectAreaLight(0xffffff, 0.35, 300, 300);
    topLight.position.set(0, 30, 320);
    topLight.lookAt(0, 0, 0);
    scene.add(topLight);
}

function initHDRI() {
    new RGBELoader().load('studio.hdr', (tex) => {
        const pmrem = new THREE.PMREMGenerator(renderer);
        const envMap = pmrem.fromEquirectangular(tex).texture;
        scene.environment = envMap;
        scene.environmentIntensity = 1.6;
        scene.environmentRotation = new THREE.Euler(0.2, 2.4, 0);
        tex.dispose();
        pmrem.dispose();
    });
}

function initBloom() {
    const W = window.innerWidth || 1280, H = window.innerHeight || 800;
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bloomPass = new UnrealBloomPass(new THREE.Vector2(W, H), 0.0, 0.02, 0.92);
    composer.addPass(bloomPass);
}

// ═══════════════════════════════════════════════════════════════
// BUILD — BASE & RINGS
// ═══════════════════════════════════════════════════════════════

function buildBase() {
    // Dark base plate under dome (visible through ring gaps = groove effect)
    const geo = new THREE.CircleGeometry(DIAL_R + 2, 128);
    const mat = new THREE.MeshStandardMaterial({ color: 0x020204, metalness: 0.95, roughness: 0.05 });
    const base = new THREE.Mesh(geo, mat);
    base.position.z = -0.3;
    clockGroup.add(base);

    // Outer bezel
    const bezelGeo = createDomeRing(DIAL_R, DIAL_R + 4);
    const bezelMat = new THREE.MeshPhysicalMaterial({
        color: 0x404040, metalness: 0.95, roughness: 0.08,
        clearcoat: 0.9, clearcoatRoughness: 0.1, envMapIntensity: 2.5
    });
    const bezel = new THREE.Mesh(bezelGeo, bezelMat);
    clockGroup.add(bezel);
}

function buildRings() {
    RING_DEFS.forEach((def, i) => {
        const geo = createDomeRing(def.iR, def.oR);
        const mat = new THREE.MeshPhysicalMaterial({
            color: def.color,
            metalness: def.metal,
            roughness: def.rough,
            clearcoat: def.cc,
            clearcoatRoughness: 0.15,
            envMapIntensity: 2.0,
            side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(geo, mat);
        ringMeshes.push(mesh);
        origRingColors.push(new THREE.Color(def.color));

        // Rings 2-6 go in orbit groups; 1 & 7 are fixed
        if (i === 1) { hourOrbitGroup.add(mesh); }
        else if (i === 2) { minuteOrbitGroup.add(mesh); }
        else if (i === 3) { prayerGroup.add(mesh); }
        else if (i === 5) { moonGroup.add(mesh); }
        else { clockGroup.add(mesh); }
    });
}

function buildGrooves() {
    const mat = new THREE.MeshStandardMaterial({ color: 0x010102, metalness: 0.95, roughness: 0.05 });
    GROOVE_RADII.forEach(r => {
        const geo = createDomeRing(r - 0.35, r + 0.35, 128, 1);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.z = -0.05;
        clockGroup.add(mesh);
    });
}

// ═══════════════════════════════════════════════════════════════
// BUILD — KAABA CENTER
// ═══════════════════════════════════════════════════════════════

function buildKaaba() {
    // Diamond shape (rotated square)
    const s = 5;
    const shape = new THREE.Shape();
    shape.moveTo(0, s);
    shape.lineTo(s, 0);
    shape.lineTo(0, -s);
    shape.lineTo(-s, 0);
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.8, bevelEnabled: true, bevelThickness: 0.2, bevelSize: 0.2, bevelSegments: 3 });
    const mat = new THREE.MeshPhysicalMaterial({
        color: 0x050404, metalness: 0.98, roughness: 0.04,
        clearcoat: 1.0, clearcoatRoughness: 0.05, envMapIntensity: 3.0
    });
    const diamond = new THREE.Mesh(geo, mat);
    diamond.position.z = domeZ(0) + 0.3;

    // Center dot
    const dotGeo = new THREE.CircleGeometry(0.8, 32);
    const dotMat = new THREE.MeshStandardMaterial({
        color: 0x222222, emissive: LUME_COLOR.clone(), emissiveIntensity: 0
    });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.z = domeZ(0) + 1.3;
    lumeMeshes.push(dot);

    clockGroup.add(diamond);
    clockGroup.add(dot);
}

// ═══════════════════════════════════════════════════════════════
// BUILD — SATELLITE TEXTURES
// ═══════════════════════════════════════════════════════════════

function makeSatelliteTexture(value, tickCount, bgHex) {
    const s = 512, c = document.createElement('canvas');
    c.width = c.height = s;
    const ctx = c.getContext('2d');
    const cx = s / 2, r = s * 0.46;

    // Background
    ctx.fillStyle = bgHex;
    ctx.beginPath();
    ctx.arc(cx, cx, r, 0, TWO_PI);
    ctx.fill();

    // Outer ring
    ctx.strokeStyle = 'rgba(180,140,160,0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Ticks
    for (let i = 0; i < tickCount; i++) {
        const a = (i / tickCount) * TWO_PI - Math.PI / 2;
        const isMajor = tickCount === 12 ? (i % 3 === 0) : (i % 5 === 0);
        const ri = r * (isMajor ? 0.76 : 0.84);
        const ro = r * 0.92;
        ctx.strokeStyle = isMajor ? 'rgba(180,140,160,0.4)' : 'rgba(180,140,160,0.12)';
        ctx.lineWidth = isMajor ? 2 : 0.8;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * ri, cx + Math.sin(a) * ri);
        ctx.lineTo(cx + Math.cos(a) * ro, cx + Math.sin(a) * ro);
        ctx.stroke();
    }

    // Numeral
    const display = tickCount === 12 ? (value === 0 ? '12' : String(value)) : String(value).padStart(2, '0');
    ctx.fillStyle = 'rgba(200,160,180,0.85)';
    ctx.font = `200 ${s * 0.28}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(display, cx, cx);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

// ═══════════════════════════════════════════════════════════════
// BUILD — HOUR & MINUTE SATELLITES
// ═══════════════════════════════════════════════════════════════

function buildHourSatellite() {
    const orbitR = 17.5;
    const discR = 5.5;
    hourTexture = makeSatelliteTexture(0, 12, '#120c10');

    const geo = new THREE.CircleGeometry(discR, 64);
    const mat = new THREE.MeshPhysicalMaterial({
        map: hourTexture, metalness: 0.7, roughness: 0.2,
        clearcoat: 0.7, clearcoatRoughness: 0.1, envMapIntensity: 1.5
    });
    hourSatMesh = new THREE.Mesh(geo, mat);
    hourSatMesh.position.set(0, orbitR, domeZ(orbitR) + 0.4);

    // Lume ring on satellite edge
    const lumeRingGeo = new THREE.RingGeometry(discR - 0.3, discR, 64);
    const lumeRingMat = new THREE.MeshStandardMaterial({
        color: 0x112244, emissive: LUME_COLOR.clone(), emissiveIntensity: 0,
        transparent: true, opacity: 0.6
    });
    const lumeRing = new THREE.Mesh(lumeRingGeo, lumeRingMat);
    lumeRing.position.z = hourSatMesh.position.z + 0.1;
    lumeRing.position.y = orbitR;
    lumeMeshes.push(lumeRing);

    hourOrbitGroup.add(hourSatMesh);
    hourOrbitGroup.add(lumeRing);
}

function buildMinuteSatellite() {
    const orbitR = 31.5;
    const discR = 5;
    minuteTexture = makeSatelliteTexture(0, 60, '#1a1018');

    const geo = new THREE.CircleGeometry(discR, 64);
    const mat = new THREE.MeshPhysicalMaterial({
        map: minuteTexture, metalness: 0.6, roughness: 0.25,
        clearcoat: 0.6, clearcoatRoughness: 0.12, envMapIntensity: 1.5
    });
    minuteSatMesh = new THREE.Mesh(geo, mat);
    minuteSatMesh.position.set(0, orbitR, domeZ(orbitR) + 0.4);

    const lumeRingGeo = new THREE.RingGeometry(discR - 0.3, discR, 64);
    const lumeRingMat = new THREE.MeshStandardMaterial({
        color: 0x112244, emissive: LUME_COLOR.clone(), emissiveIntensity: 0,
        transparent: true, opacity: 0.6
    });
    const lumeRing = new THREE.Mesh(lumeRingGeo, lumeRingMat);
    lumeRing.position.z = minuteSatMesh.position.z + 0.1;
    lumeRing.position.y = orbitR;
    lumeMeshes.push(lumeRing);

    minuteOrbitGroup.add(minuteSatMesh);
    minuteOrbitGroup.add(lumeRing);
}

// ═══════════════════════════════════════════════════════════════
// BUILD — PRAYER ARCS
// ═══════════════════════════════════════════════════════════════

function buildPrayerArcs() {
    // Demo: 5 roughly proportional arcs (Fajr, Dhuhr, Asr, Maghrib, Isha)
    const iR = 40, oR = 49.5;
    const prayerData = [
        { name: 'fajr',    frac: 0.08, color: 0x302848 },
        { name: 'dhuhr',   frac: 0.25, color: 0x503040 },
        { name: 'asr',     frac: 0.15, color: 0x503830 },
        { name: 'maghrib', frac: 0.07, color: 0x482838 },
        { name: 'isha',    frac: 0.45, color: 0x201830 },
    ];

    let angle = Math.PI / 2; // start at 12 o'clock
    const gap = 0.02;

    prayerData.forEach((p, idx) => {
        const sweep = p.frac * TWO_PI - gap;
        const geo = createArcGeo(iR, oR, angle, angle + sweep);
        const mat = new THREE.MeshPhysicalMaterial({
            color: p.color, metalness: 0.5, roughness: 0.35,
            clearcoat: 0.3, envMapIntensity: 1.5,
            emissive: LUME_COLOR.clone(), emissiveIntensity: 0
        });
        const mesh = new THREE.Mesh(geo, mat);

        // Highlight the "active" prayer (demo: Dhuhr)
        if (idx === 1) {
            mat.emissiveIntensity = 0.05;
            mat.color.set(0x6a3848);
        }

        prayerGroup.add(mesh);
        softLumeMeshes.push(mesh);
        angle += p.frac * TWO_PI;
    });
}

// ═══════════════════════════════════════════════════════════════
// BUILD — QIBLA ARROW
// ═══════════════════════════════════════════════════════════════

function buildQiblaArrow() {
    const r = 54.5;
    const shape = new THREE.Shape();
    shape.moveTo(0, 3);
    shape.lineTo(1.2, -1);
    shape.lineTo(0, 0.3);
    shape.lineTo(-1.2, -1);
    shape.closePath();

    const geo = new THREE.ShapeGeometry(shape);
    const mat = new THREE.MeshPhysicalMaterial({
        color: 0x20887a, metalness: 0.6, roughness: 0.2,
        clearcoat: 0.6, emissive: new THREE.Color(0x2090a0), emissiveIntensity: 0
    });
    const arrow = new THREE.Mesh(geo, mat);

    // Position at qibla bearing (demo: ~58° from north for US locations)
    const qiblaAngle = (58 / 360) * TWO_PI + Math.PI / 2;
    arrow.position.set(Math.cos(qiblaAngle) * r, Math.sin(qiblaAngle) * r, domeZ(r) + 0.3);
    arrow.rotation.z = qiblaAngle - Math.PI / 2;

    lumeMeshes.push(arrow);
    clockGroup.add(arrow);

    // 8 cardinal ticks on Ring 5
    const tickMat = new THREE.MeshPhysicalMaterial({
        color: 0x1a5050, metalness: 0.7, roughness: 0.2, clearcoat: 0.5
    });
    for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TWO_PI;
        const geo = new THREE.PlaneGeometry(0.4, 1.8);
        const tick = new THREE.Mesh(geo, tickMat.clone());
        tick.material.side = THREE.DoubleSide;
        tick.position.set(Math.cos(a) * r, Math.sin(a) * r, domeZ(r) + 0.2);
        tick.rotation.z = a + Math.PI / 2;
        clockGroup.add(tick);
    }
}

// ═══════════════════════════════════════════════════════════════
// BUILD — MOON CRESCENT
// ═══════════════════════════════════════════════════════════════

function buildMoon() {
    // Calculate current lunar phase
    const knownNew = new Date('2024-01-11T11:57:00Z').getTime();
    const synodic = 29.53058770576;
    const daysSince = (Date.now() - knownNew) / (1000 * 60 * 60 * 24);
    const phase = ((daysSince % synodic) + synodic) % synodic / synodic;

    const moonR = 3.5;
    const shape = new THREE.Shape();
    const segs = 48;

    // Right semicircle (always lit)
    for (let i = 0; i <= segs; i++) {
        const a = -Math.PI / 2 + (i / segs) * Math.PI;
        const x = Math.cos(a) * moonR, y = Math.sin(a) * moonR;
        i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y);
    }

    // Terminator curve
    const k = Math.cos(phase * TWO_PI);
    for (let i = segs; i >= 0; i--) {
        const a = -Math.PI / 2 + (i / segs) * Math.PI;
        const x = Math.cos(a) * moonR * k, y = Math.sin(a) * moonR;
        shape.lineTo(x, y);
    }
    shape.closePath();

    const geo = new THREE.ShapeGeometry(shape);
    const mat = new THREE.MeshPhysicalMaterial({
        color: 0xd8d0d8, metalness: 0.25, roughness: 0.12,
        clearcoat: 0.95, clearcoatRoughness: 0.05,
        envMapIntensity: 2.5,
        emissive: LUME_COLOR.clone(), emissiveIntensity: 0
    });
    const moon = new THREE.Mesh(geo, mat);
    const orbR = 63.5;
    moon.position.set(0, orbR, domeZ(orbR) + 0.4);
    moon.rotation.z = Math.PI / 4;

    lumeMeshes.push(moon);
    moonGroup.add(moon);
}

// ═══════════════════════════════════════════════════════════════
// BUILD — CHAPTER RING INDICES
// ═══════════════════════════════════════════════════════════════

function buildChapterIndices() {
    const r = 74.5;

    for (let i = 0; i < 60; i++) {
        const angle = Math.PI / 2 - (i / 60) * TWO_PI;
        const isMajor = i % 5 === 0;
        const w = isMajor ? 0.7 : 0.3;
        const h = isMajor ? 3.5 : 1.8;

        const geo = new THREE.PlaneGeometry(w, h);
        const mat = new THREE.MeshPhysicalMaterial({
            color: isMajor ? 0xb08090 : 0x604050,
            metalness: 0.8, roughness: 0.15, clearcoat: 0.5,
            envMapIntensity: 1.8, side: THREE.DoubleSide,
        });
        const tick = new THREE.Mesh(geo, mat);
        const x = Math.cos(angle) * r, y = Math.sin(angle) * r;
        tick.position.set(x, y, domeZ(r) + 0.3);
        tick.rotation.z = angle + Math.PI / 2;
        clockGroup.add(tick);
    }
}

// ═══════════════════════════════════════════════════════════════
// BUILD — LUME MARKERS
// ═══════════════════════════════════════════════════════════════

function buildLumeMarkers() {
    const positions = [
        { r: 73, count: 12, size: 1.0 },   // Major hour dots on chapter ring
        { r: 17.5, count: 12, size: 0.6 },  // Hour ring indices
    ];

    positions.forEach(({ r, count, size }) => {
        for (let i = 0; i < count; i++) {
            const angle = Math.PI / 2 - (i / count) * TWO_PI;
            const geo = new THREE.CircleGeometry(size, 24);
            const mat = new THREE.MeshStandardMaterial({
                color: 0x112244,
                emissive: LUME_COLOR.clone(),
                emissiveIntensity: 0,
            });
            const dot = new THREE.Mesh(geo, mat);
            dot.position.set(Math.cos(angle) * r, Math.sin(angle) * r, domeZ(r) + 0.5);

            lumeMeshes.push(dot);

            // Hour ring dots go in the hour orbit group
            if (r < 25) { hourOrbitGroup.add(dot); }
            else { clockGroup.add(dot); }
        }
    });
}

// ═══════════════════════════════════════════════════════════════
// ANIMATION
// ═══════════════════════════════════════════════════════════════

function updateOrbits(now) {
    const h = now.getHours() % 12;
    const m = now.getMinutes();
    const s = now.getSeconds();
    const ms = now.getMilliseconds();

    const secFrac = s + ms / 1000;
    const minFrac = m + secFrac / 60;
    const hourFrac = h + minFrac / 60;

    // CCW orbits: positive rotation.z in Three.js = CCW when viewed from +z
    hourOrbitGroup.rotation.z = (hourFrac / 12) * TWO_PI;
    minuteOrbitGroup.rotation.z = (minFrac / 60) * TWO_PI;

    // Prayer ring: slow 24h sweep
    const dayFrac = (now.getHours() + minFrac / 60) / 24;
    prayerGroup.rotation.z = dayFrac * TWO_PI;

    // Moon: ~29.53 day orbit
    const knownNew = new Date('2024-01-11T11:57:00Z').getTime();
    const daysSince = (now.getTime() - knownNew) / (1000 * 60 * 60 * 24);
    const moonFrac = (daysSince % 29.53058770576) / 29.53058770576;
    moonGroup.rotation.z = moonFrac * TWO_PI;

    // Counter-rotate satellites to keep numerals upright
    hourSatMesh.rotation.z = -hourOrbitGroup.rotation.z;
    minuteSatMesh.rotation.z = -minuteOrbitGroup.rotation.z;

    // Update satellite textures when value changes
    const displayHour = h;
    if (displayHour !== lastHour) {
        lastHour = displayHour;
        hourTexture.dispose();
        hourTexture = makeSatelliteTexture(displayHour, 12, '#120c10');
        hourSatMesh.material.map = hourTexture;
        hourSatMesh.material.needsUpdate = true;
    }
    if (m !== lastMinute) {
        lastMinute = m;
        minuteTexture.dispose();
        minuteTexture = makeSatelliteTexture(m, 60, '#1a1018');
        minuteSatMesh.material.map = minuteTexture;
        minuteSatMesh.material.needsUpdate = true;
    }
}

function updateNightMode() {
    nightBlend += (nightTarget - nightBlend) * 0.06;

    const nightCol = new THREE.Color(0x020204);

    // Darken ring materials
    ringMeshes.forEach((mesh, i) => {
        mesh.material.color.copy(origRingColors[i]).lerp(nightCol, nightBlend * 0.75);
    });

    // Lume glow — point elements (dots, rings, arrow)
    lumeMeshes.forEach(m => {
        m.material.emissiveIntensity = nightBlend * LUME_INTENSITY_MAX;
    });

    // Soft lume — large area elements (prayer arcs) at ~15% intensity
    softLumeMeshes.forEach(m => {
        m.material.emissiveIntensity = nightBlend * 0.5;
    });

    // Bloom — tighter, more subtle
    bloomPass.strength = nightBlend * 0.8;
    bloomPass.threshold = 0.92 - nightBlend * 0.02;

    // Lighting dims
    ambLight.intensity = 0.15 * (1 - nightBlend * 0.85);
    keyLight.intensity = 3.5 * (1 - nightBlend * 0.8);
    fillLight.intensity = 0.5 * (1 - nightBlend * 0.7);
    topLight.intensity = 0.35 * (1 - nightBlend * 0.6);

    // Environment dims
    if (scene.environment) {
        scene.environmentIntensity = 1.6 * (1 - nightBlend * 0.55);
    }

    // Background darkens
    const bgDay = new THREE.Color(0x060608);
    const bgNight = new THREE.Color(0x010102);
    scene.background.copy(bgDay).lerp(bgNight, nightBlend);
}

function updateTimeDisplay(now) {
    const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
    const h12 = h % 12 || 12;
    const ampm = h < 12 ? 'AM' : 'PM';
    const str = `${h12}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} ${ampm}`;
    document.getElementById('time-display').textContent = str;
}

function animate() {
    requestAnimationFrame(animate);

    const now = getVirtualTime();
    updateOrbits(now);
    updateNightMode();
    updateTimeDisplay(now);
    controls.update();

    if (nightBlend > 0.01) {
        try { composer.render(); } catch (e) { renderer.render(scene, camera); }
    } else {
        renderer.render(scene, camera);
    }
}

// ═══════════════════════════════════════════════════════════════
// EVENTS
// ═══════════════════════════════════════════════════════════════

function initEvents() {
    window.addEventListener('resize', () => {
        const W = window.innerWidth || 1280, H = window.innerHeight || 800;
        camera.aspect = W / H;
        camera.updateProjectionMatrix();
        renderer.setSize(W, H);
        composer.setSize(W, H);
    });

    document.getElementById('btn-lume').addEventListener('click', (e) => {
        nightTarget = nightTarget > 0.5 ? 0 : 1;
        e.currentTarget.classList.toggle('active', nightTarget > 0.5);
    });

    document.getElementById('btn-speed').addEventListener('click', (e) => {
        const btn = e.currentTarget;
        if (speedMultiplier === 1) {
            speedMultiplier = 60;
            btn.textContent = '1×';
            btn.classList.add('active');
        } else {
            speedMultiplier = 1;
            btn.textContent = '60×';
            btn.classList.remove('active');
        }
    });
}

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════

function init() {
    initScene();
    initLighting();
    initHDRI();
    initBloom();

    // Create orbit groups before building rings
    hourOrbitGroup = new THREE.Group();
    minuteOrbitGroup = new THREE.Group();
    prayerGroup = new THREE.Group();
    moonGroup = new THREE.Group();

    clockGroup.add(hourOrbitGroup);
    clockGroup.add(minuteOrbitGroup);
    clockGroup.add(prayerGroup);
    clockGroup.add(moonGroup);

    buildBase();
    buildRings();
    buildGrooves();
    buildKaaba();
    buildHourSatellite();
    buildMinuteSatellite();
    buildPrayerArcs();
    buildQiblaArrow();
    buildMoon();
    buildChapterIndices();
    buildLumeMarkers();

    initEvents();
    animate();
}

init();
