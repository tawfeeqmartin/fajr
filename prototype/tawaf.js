// tawaf.js — Generative Tawaf Clock
// Orbital resonance patterns driven by Islamic calendar variables
// Each prayer period generates a unique artwork through CCW orbital traces
// Location-aware: Qibla bearing orients the pattern; lat/lng seeds uniqueness

// ═══════════════════════════════════════════════════════════════
// CONSTANTS & CONFIG
// ═══════════════════════════════════════════════════════════════

const TWO_PI = Math.PI * 2;

// Fibonacci-adjacent ratios → beautiful n-fold symmetry
const RATIO_BANK = [
    [3, 5],   // 2-fold
    [5, 8],   // 3-fold — Fibonacci
    [4, 7],   // 3-fold
    [5, 9],   // 4-fold
    [3, 7],   // 4-fold
    [5, 13],  // 8-fold — octagonal (Islamic)
    [8, 13],  // 5-fold — Venus rose (Fibonacci)
    [7, 12],  // 5-fold
    [7, 11],  // 4-fold
    [5, 12],  // 7-fold — seven heavens
    [7, 19],  // 12-fold
    [8, 19],  // 11-fold
    [11, 19], // 8-fold — octagonal
    [3, 8],   // 5-fold
    [2, 7],   // 5-fold
    [13, 21], // 8-fold — Fibonacci pair
];

const PRAYER_PALETTES = {
    fajr:    { h: 220, s: 50, l: 55, name: 'Fajr',    ar: 'فجر'    },
    dhuhr:   { h: 42,  s: 55, l: 60, name: 'Dhuhr',   ar: 'ظهر'    },
    asr:     { h: 28,  s: 50, l: 55, name: 'Asr',     ar: 'عصر'    },
    maghrib: { h: 340, s: 50, l: 55, name: 'Maghrib', ar: 'مغرب'   },
    isha:    { h: 265, s: 45, l: 50, name: 'Isha',    ar: 'عشاء'    },
};

// Kaaba coordinates
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

// ═══════════════════════════════════════════════════════════════
// LOCATION & QIBLA
// ═══════════════════════════════════════════════════════════════

let userLat = 34.05;   // default: Los Angeles
let userLng = -118.24;
let qiblaBearing = 0;  // radians from north, CW positive
let deviceHeading = null; // radians from north, null = no compass

function computeQibla(lat, lng) {
    const toRad = d => d * Math.PI / 180;
    const φ1 = toRad(lat), φ2 = toRad(KAABA_LAT);
    const Δλ = toRad(KAABA_LNG - lng);
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    return Math.atan2(y, x); // radians from north, CW positive
}

function initGeolocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            userLat = pos.coords.latitude;
            userLng = pos.coords.longitude;
            qiblaBearing = computeQibla(userLat, userLng);
            lastPrayerPeriod = null; // force regeneration with new location
        },
        () => { /* keep defaults */ },
        { timeout: 5000, enableHighAccuracy: false }
    );
    qiblaBearing = computeQibla(userLat, userLng);
}

function initCompass() {
    const handler = (e) => {
        // iOS: webkitCompassHeading (degrees, 0=N, CW)
        // Android: alpha (degrees, 0=N but may need adjustment)
        let heading = null;
        if (e.webkitCompassHeading !== undefined) {
            heading = e.webkitCompassHeading;
        } else if (e.alpha !== null) {
            // Android: alpha is 0-360 CCW from north in some browsers
            heading = (360 - e.alpha) % 360;
        }
        if (heading !== null) {
            deviceHeading = heading * Math.PI / 180; // to radians
        }
    };

    // iOS 13+ requires permission request
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
        // Will be triggered by user tap (see button handler below)
        window._compassHandler = handler;
    } else if (typeof DeviceOrientationEvent !== 'undefined') {
        window.addEventListener('deviceorientationabsolute', handler, true);
        window.addEventListener('deviceorientation', handler, true);
    }
}

function requestCompassPermission() {
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().then(state => {
            if (state === 'granted') {
                window.addEventListener('deviceorientation', window._compassHandler, true);
            }
        }).catch(() => {});
    }
}

// Quantize lat/lng to ~10km grid for seed (nearby people share artwork)
function locationKey(lat, lng) {
    return `${(lat * 10) | 0},${(lng * 10) | 0}`;
}

// ═══════════════════════════════════════════════════════════════
// ISLAMIC CALENDAR
// ═══════════════════════════════════════════════════════════════

function getHijriDate(date) {
    const jd = Math.floor((date.getTime() / 86400000) + 2440587.5);
    const l = jd - 1948440 + 10632;
    const n = Math.floor((l - 1) / 10631);
    const l2 = l - 10631 * n + 354;
    const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719)
            + Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
    const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50)
             - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
    const month = Math.floor((24 * l3) / 709);
    const day = l3 - Math.floor((709 * month) / 24);
    const year = 30 * n + j - 30;
    return { year, month, day };
}

function getRamadanDay(hijri) {
    if (hijri.month === 9) return hijri.day;
    return 0;
}

function getMoonPhase(date) {
    const knownNew = new Date('2024-01-11T11:57:00Z').getTime();
    const synodic = 29.53058770576;
    const daysSince = (date.getTime() - knownNew) / (1000 * 60 * 60 * 24);
    return ((daysSince % synodic) + synodic) % synodic / synodic;
}

function isLaylatulQadr(ramadanDay) {
    return ramadanDay >= 21 && ramadanDay % 2 === 1;
}

function isJumuah(date) {
    return date.getDay() === 5;
}

function getDemoPrayerTimes() {
    return {
        fajr: { h: 5, m: 15 }, dhuhr: { h: 12, m: 10 },
        asr: { h: 15, m: 40 }, maghrib: { h: 18, m: 5 }, isha: { h: 19, m: 25 },
    };
}

function getCurrentPrayerPeriod(now, times) {
    const mins = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
    const order = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const minsArr = order.map(k => times[k].h * 60 + times[k].m);
    for (let i = order.length - 1; i >= 0; i--) {
        if (mins >= minsArr[i]) {
            const start = minsArr[i];
            const end = i < order.length - 1 ? minsArr[i + 1] : minsArr[0] + 1440;
            return { name: order[i], index: i, progress: Math.min((mins - start) / (end - start), 1), start, end };
        }
    }
    const start = minsArr[4], end = minsArr[0] + 1440;
    return { name: 'isha', index: 4, progress: Math.min((mins + 1440 - start) / (end - start), 1), start, end };
}

// ═══════════════════════════════════════════════════════════════
// SEED & DETERMINISTIC RANDOM
// ═══════════════════════════════════════════════════════════════

function hashSeed(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    return h;
}

function seededRandom(seed) {
    let s = seed;
    return () => { s = (s * 1664525 + 1013904223) & 0x7fffffff; return s / 0x7fffffff; };
}

// ═══════════════════════════════════════════════════════════════
// GENERATIVE ALGORITHM
// ═══════════════════════════════════════════════════════════════

function generateArtwork(variables) {
    const {
        prayerPeriod, hijriDay, hijriMonth, ramadanDay,
        moonPhase, isLQN, isFriday, dateStr, locKey, qibla,
    } = variables;

    // Location is part of the seed — different cities get different art
    const seedStr = `${dateStr}-${prayerPeriod}-${hijriDay}-${hijriMonth}-${locKey}`;
    const seed = hashSeed(seedStr);
    const rng = seededRandom(seed);

    // Pair count: 2-4 base, ramadan/LQN/jumuah add more
    let pairCount = 2 + Math.floor(rng() * 3);
    if (ramadanDay > 0) pairCount += 1;
    if (ramadanDay >= 21) pairCount += 1;
    if (isLQN) pairCount += 2;
    if (isFriday) pairCount += 1;
    pairCount = Math.min(pairCount, 8);

    const pairs = [];
    const palette = PRAYER_PALETTES[prayerPeriod];

    for (let i = 0; i < pairCount; i++) {
        const ratioIdx = Math.floor(rng() * RATIO_BANK.length);
        const [p, q] = RATIO_BANK[ratioIdx];

        // Wider radii range for more spread
        const r1 = 0.12 + rng() * 0.28;  // 12-40%
        const r2 = 0.38 + rng() * 0.42;  // 38-80%

        const speedBase = 0.4 + rng() * 1.2;
        const speed1 = speedBase * p;
        const speed2 = speedBase * q;

        // Qibla-aligned: first orbiter pair starts at the Qibla angle
        // Subsequent pairs fan out from there
        const offset = qibla + (i / pairCount) * TWO_PI * 0.618; // golden angle spread from Qibla

        const hueShift = (rng() - 0.5) * 35;
        const h = (palette.h + hueShift + 360) % 360;
        const s = palette.s + (rng() - 0.5) * 15;
        const l = palette.l + (rng() - 0.5) * 15;

        const alpha = isLQN ? 0.025 + rng() * 0.04 : 0.012 + rng() * 0.03;

        // Depth: 0 = ghosted background, 1 = sharp foreground
        // Bias toward middle with some extremes for contrast
        const depth = rng() * rng(); // clusters near 0 (ghosted) with occasional pops

        pairs.push({ p, q, r1, r2, speed1, speed2, offset, h, s, l, alpha, depth });
    }

    // LQN: golden Venus rose
    if (isLQN) {
        const [p, q] = [8, 13];
        pairs.push({
            p, q, r1: 0.18 + rng() * 0.12, r2: 0.48 + rng() * 0.2,
            speed1: 1.1 * p, speed2: 1.1 * q, offset: qibla,
            h: 45, s: 70, l: 65, alpha: 0.045,
        });
    }

    const totalRevolutions = 50 + Math.floor(rng() * 90);

    return { pairs, totalRevolutions, seed, palette, variables, qibla };
}

// ═══════════════════════════════════════════════════════════════
// RENDERER
// ═══════════════════════════════════════════════════════════════

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const liveCanvas = document.getElementById('canvas-live');
const liveCtx = liveCanvas.getContext('2d');

let W, H, cx, cy, radius;
let artwork = null;
let drawProgress = 0;
let lastDrawProgress = 0;
let speedMultiplier = 1;
let virtualTimeOffset = 0;
let lastRealTime = Date.now();
let manualSeedOffset = 0;

function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth || 1280;
    H = window.innerHeight || 800;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    liveCanvas.width = W * dpr;
    liveCanvas.height = H * dpr;
    liveCanvas.style.width = W + 'px';
    liveCanvas.style.height = H + 'px';
    liveCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = W / 2;
    cy = H / 2;
    radius = Math.min(W, H) * 0.42;
}

function clearCanvas() {
    ctx.fillStyle = getBgColor();
    ctx.fillRect(0, 0, W, H);
    drawProgress = 0;
    lastDrawProgress = 0;
}

function drawCenterGlow() {
    if (!artwork) return;
    const night = isNightTime();
    const dotColor = night ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
    const glowColor1 = night ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
    const glowColor2 = night ? 'rgba(255,255,255,0)' : 'rgba(0,0,0,0)';
    const qiblaColor = night ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.025)';

    // Subtle Kaaba glow at center
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 0.06);
    grad.addColorStop(0, glowColor1);
    grad.addColorStop(1, glowColor2);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.06, 0, TWO_PI);
    ctx.fill();

    // Center dot
    ctx.fillStyle = dotColor;
    ctx.beginPath();
    ctx.arc(cx, cy, 1.5, 0, TWO_PI);
    ctx.fill();

    // Qibla direction indicator — faint line from center toward Qibla
    const qLen = radius * 0.92;
    const qa = -artwork.qibla + Math.PI / 2;
    ctx.strokeStyle = qiblaColor;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(qa) * qLen, cy - Math.sin(qa) * qLen);
    ctx.stroke();
}

function orbiterPos(pair, t) {
    const a1 = -pair.speed1 * t + pair.offset;
    const a2 = -pair.speed2 * t + pair.offset;
    return {
        x1: cx + Math.cos(a1) * pair.r1 * radius,
        y1: cy + Math.sin(a1) * pair.r1 * radius,
        x2: cx + Math.cos(a2) * pair.r2 * radius,
        y2: cy + Math.sin(a2) * pair.r2 * radius,
    };
}

function drawTraces(fromProgress, toProgress) {
    if (!artwork) return;
    const totalSteps = artwork.totalRevolutions * 360;
    const fromStep = Math.floor(fromProgress * totalSteps);
    const toStep = Math.floor(toProgress * totalSteps);
    if (toStep <= fromStep) return;

    const night = isNightTime();
    ctx.lineCap = 'round';

    for (const pair of artwork.pairs) {
        const d = pair.depth !== undefined ? pair.depth : 0.5;
        // Depth scales: ghosted (d≈0) → 0.55x, sharp (d≈1) → 1.45x
        const depthScale = 0.55 + d * 0.9;

        // Day mode: darken colors, boost alpha for visibility on light background
        const traceL = night ? pair.l : Math.max(pair.l - 30, 10);
        const traceS = night ? pair.s : Math.min(pair.s + 20, 95);
        const baseAlpha = night ? pair.alpha : Math.min(pair.alpha * 2.5, 0.15);
        const traceAlpha = baseAlpha * depthScale;

        // Midpoint rosette traces — thinner, subtler
        ctx.strokeStyle = `hsla(${pair.h}, ${traceS}%, ${traceL}%, ${traceAlpha})`;
        ctx.lineWidth = (night ? 0.7 : 0.4) * (0.7 + d * 0.3);
        ctx.beginPath();
        for (let step = fromStep; step <= toStep; step++) {
            const t = (step / totalSteps) * artwork.totalRevolutions * TWO_PI;
            const { x1, y1, x2, y2 } = orbiterPos(pair, t);
            const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
            step === fromStep ? ctx.moveTo(mx, my) : ctx.lineTo(mx, my);
        }
        ctx.stroke();

        // Connecting lines — radial structure, more prominent in day
        if (toStep - fromStep > 3) {
            const connAlpha = night ? traceAlpha * 0.35 : Math.min(pair.alpha * 3.5, 0.18) * depthScale;
            ctx.strokeStyle = `hsla(${pair.h}, ${traceS}%, ${traceL}%, ${connAlpha})`;
            ctx.lineWidth = (night ? 0.3 : 0.35) * (0.5 + d * 0.5);
            ctx.beginPath();
            for (let step = fromStep; step <= toStep; step += (night ? 4 : 4)) {
                const t = (step / totalSteps) * artwork.totalRevolutions * TWO_PI;
                const { x1, y1, x2, y2 } = orbiterPos(pair, t);
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
            }
            ctx.stroke();
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// LEADING EDGES — live orbiter visualization
// ═══════════════════════════════════════════════════════════════

// All leading-edge drawing goes to the live overlay canvas (liveCtx)
// which is cleared every frame — no artifacts

function drawLeadingEdges(progress, now) {
    if (!artwork) return;
    const c = liveCtx;
    c.clearRect(0, 0, W, H);

    const night = isNightTime();
    const t = progress * artwork.totalRevolutions * TWO_PI;
    const totalSteps = artwork.totalRevolutions * 360;

    for (const pair of artwork.pairs) {
        const { x1, y1, x2, y2 } = orbiterPos(pair, t);
        const dotL = night ? pair.l : Math.max(pair.l - 20, 18);
        const dotS = night ? pair.s : Math.min(pair.s + 10, 85);

        // Comet tails first (behind dots)
        drawCometTail(c, pair, t, totalSteps, 'inner');
        drawCometTail(c, pair, t, totalSteps, 'outer');
        drawCometTail(c, pair, t, totalSteps, 'mid');

        // Connecting line (the force/tension between orbiters)
        c.strokeStyle = `hsla(${pair.h}, ${dotS}%, ${dotL}%, ${night ? 0.2 : 0.15})`;
        c.lineWidth = 0.5;
        c.beginPath();
        c.moveTo(x1, y1);
        c.lineTo(x2, y2);
        c.stroke();

        // Tawaf orbiter dots — uniform small size, subdued
        drawOrbiterDot(c, x1, y1, 1.5, pair.h, dotS, dotL, night ? 0.3 : 0.35);
        drawOrbiterDot(c, x2, y2, 1.5, pair.h, dotS, dotL, night ? 0.35 : 0.4);

        // Midpoint — the "pen" drawing the rosette
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        const midL = night ? Math.min(pair.l + 15, 85) : Math.max(pair.l - 15, 20);
        drawOrbiterDot(c, mx, my, 1.5, pair.h, dotS, midL, night ? 0.45 : 0.5);
    }

    // Clock hand orbiters on top
    drawClockHands(now);
}

function drawOrbiterDot(c, x, y, size, h, s, l, intensity) {
    const night = isNightTime();

    if (night) {
        // Soft glow halo — only at night
        const grad = c.createRadialGradient(x, y, 0, x, y, size * 5);
        grad.addColorStop(0, `hsla(${h}, ${s}%, ${l}%, ${intensity * 0.25})`);
        grad.addColorStop(0.4, `hsla(${h}, ${s}%, ${l}%, ${intensity * 0.06})`);
        grad.addColorStop(1, `hsla(${h}, ${s}%, ${l}%, 0)`);
        c.fillStyle = grad;
        c.beginPath();
        c.arc(x, y, size * 5, 0, TWO_PI);
        c.fill();
    }

    // Core — bright on dark, dark on light
    const coreL = night ? Math.min(l + 30, 92) : l;
    const coreAlpha = night ? intensity : Math.min(intensity * 1.4, 1.0);
    c.fillStyle = `hsla(${h}, ${s}%, ${coreL}%, ${coreAlpha})`;
    c.beginPath();
    c.arc(x, y, size, 0, TWO_PI);
    c.fill();
}

function drawCometTail(c, pair, tNow, totalSteps, which) {
    const tailLen = 30;
    const dt = artwork.totalRevolutions * TWO_PI / totalSteps;
    const night = isNightTime();
    const tailL = night ? pair.l : Math.max(pair.l - 20, 18);
    const tailS = night ? pair.s : Math.min(pair.s + 10, 85);
    c.lineCap = 'round';

    for (let i = 1; i <= tailLen; i++) {
        const tA = tNow - i * dt;
        const tB = tNow - (i + 1) * dt;
        const posA = orbiterPos(pair, tA);
        const posB = orbiterPos(pair, tB);

        let ax, ay, bx, by;
        if (which === 'inner') {
            ax = posA.x1; ay = posA.y1; bx = posB.x1; by = posB.y1;
        } else if (which === 'outer') {
            ax = posA.x2; ay = posA.y2; bx = posB.x2; by = posB.y2;
        } else {
            ax = (posA.x1 + posA.x2) / 2; ay = (posA.y1 + posA.y2) / 2;
            bx = (posB.x1 + posB.x2) / 2; by = (posB.y1 + posB.y2) / 2;
        }

        const alpha = (1 - i / tailLen) * (which === 'mid' ? 0.18 : 0.1);
        const width = (1 - i / tailLen) * (which === 'mid' ? 1.5 : 1.0);

        c.strokeStyle = `hsla(${pair.h}, ${tailS}%, ${tailL}%, ${alpha})`;
        c.lineWidth = width;
        c.beginPath();
        c.moveTo(bx, by);
        c.lineTo(ax, ay);
        c.stroke();
    }
}

// ═══════════════════════════════════════════════════════════════
// QIBLA COMPASS INDICATOR
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// CLOCK HAND ORBITERS — seconds, minutes, hours as orbiting dots
// ═══════════════════════════════════════════════════════════════

function drawClockHands(now) {
    const c = liveCtx;
    const s = now.getSeconds() + now.getMilliseconds() / 1000;
    const m = now.getMinutes() + s / 60;
    const h = (now.getHours() % 12) + m / 60;

    const night = isNightTime();

    // Clockwise from 12 o'clock (top) — contrasts with CCW tawaf
    // -PI/2 rotates 0 to top, positive = CW
    const secAngle = TWO_PI * (s / 60) - Math.PI / 2;
    const minAngle = TWO_PI * (m / 60) - Math.PI / 2;
    const hrAngle  = TWO_PI * (h / 12) - Math.PI / 2;

    // Radii: seconds outermost, hours innermost
    const secR = radius * 0.75;
    const minR = radius * 0.51;
    const hrR  = radius * 0.34;

    // Color: neutral white/black depending on day/night, with subtle prayer tint
    const palette = artwork ? artwork.palette : PRAYER_PALETTES.isha;
    const baseH = palette.h;

    // Hand lines from center to dot — drawn first so dots sit on top
    if (night) {
        drawHandLine(c, hrAngle, hrR, baseH, 15, 75, 0.55, 1.5);   // hour — thickest
        drawHandLine(c, minAngle, minR, baseH, 15, 80, 0.45, 1.0); // minute
        drawHandLine(c, secAngle, secR, baseH, 15, 85, 0.35, 0.5); // second — thinnest
    } else {
        drawHandLine(c, hrAngle, hrR, baseH, 30, 20, 0.55, 1.5);
        drawHandLine(c, minAngle, minR, baseH, 35, 18, 0.45, 1.0);
        drawHandLine(c, secAngle, secR, baseH, 35, 15, 0.35, 0.5);
    }

    if (night) {
        // Seconds — outermost
        drawClockDot(c, secAngle, secR, 3.5, baseH, 15, 88, 0.85);
        drawClockTrail(c, s, 60, secR, 14, baseH, 15, 80, night);

        // Minutes — medium
        drawClockDot(c, minAngle, minR, 6.4, baseH, 20, 80, 0.75);
        drawClockRing(c, minAngle, minR, 10, baseH, 18, 80, 0.12, night);
        drawClockTrail(c, m, 60, minR, 10, baseH, 15, 75, night);

        // Hours — innermost, largest
        drawClockDot(c, hrAngle, hrR, 8.8, baseH, 12, 75, 0.7);
        drawClockRing(c, hrAngle, hrR, 13, baseH, 12, 75, 0.15, night);
        drawClockRing(c, hrAngle, hrR, 18, baseH, 10, 70, 0.06, night);
        drawClockTrail(c, h, 12, hrR, 8, baseH, 10, 68, night);
    } else {
        // Day mode — crisp dark dots, no glow, high contrast on white
        drawClockDot(c, secAngle, secR, 4.0, baseH, 40, 15, 0.9);
        drawClockTrail(c, s, 60, secR, 14, baseH, 35, 18, night);

        drawClockDot(c, minAngle, minR, 7.2, baseH, 40, 18, 0.85);
        drawClockRing(c, minAngle, minR, 11, baseH, 35, 20, 0.18, night);
        drawClockTrail(c, m, 60, minR, 10, baseH, 35, 20, night);

        drawClockDot(c, hrAngle, hrR, 9.6, baseH, 35, 20, 0.8);
        drawClockRing(c, hrAngle, hrR, 14, baseH, 30, 22, 0.2, night);
        drawClockRing(c, hrAngle, hrR, 21, baseH, 25, 25, 0.08, night);
        drawClockTrail(c, h, 12, hrR, 8, baseH, 30, 22, night);
    }
}

function drawHandLine(c, angle, r, h, s, l, alpha, width) {
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    c.strokeStyle = `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
    c.lineWidth = width;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(cx, cy);
    c.lineTo(x, y);
    c.stroke();
}

function drawClockDot(c, angle, r, size, h, s, l, intensity) {
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    const night = isNightTime();

    if (night) {
        // Soft glow — only at night where it reads well against dark bg
        const grad = c.createRadialGradient(x, y, 0, x, y, size * 4);
        grad.addColorStop(0, `hsla(${h}, ${s}%, ${l}%, ${intensity * 0.3})`);
        grad.addColorStop(0.5, `hsla(${h}, ${s}%, ${l}%, ${intensity * 0.06})`);
        grad.addColorStop(1, `hsla(${h}, ${s}%, ${l}%, 0)`);
        c.fillStyle = grad;
        c.beginPath();
        c.arc(x, y, size * 4, 0, TWO_PI);
        c.fill();
    }

    // Solid core — sharper and more opaque in day mode
    const coreAlpha = night ? intensity : Math.min(intensity * 1.6, 1.0);
    c.fillStyle = `hsla(${h}, ${s}%, ${l}%, ${coreAlpha})`;
    c.beginPath();
    c.arc(x, y, size, 0, TWO_PI);
    c.fill();
}

function drawClockRing(c, angle, r, ringRadius, h, s, l, alpha, night) {
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    c.strokeStyle = `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
    c.lineWidth = 0.8;
    c.beginPath();
    c.arc(x, y, ringRadius, 0, TWO_PI);
    c.stroke();
}

function drawClockTrail(c, value, period, r, steps, h, s, l, night) {
    c.lineCap = 'round';
    for (let i = 1; i <= steps; i++) {
        const frac = (value - i * 0.15) / period; // trail goes back a few "ticks"
        const a1 = TWO_PI * frac - Math.PI / 2;  // CW to match clock hands
        const frac2 = (value - (i + 1) * 0.15) / period;
        const a2 = TWO_PI * frac2 - Math.PI / 2;

        const alpha = (1 - i / steps) * (night ? 0.15 : 0.12);
        const width = (1 - i / steps) * 1.2;

        c.strokeStyle = `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
        c.lineWidth = width;
        c.beginPath();
        c.moveTo(cx + Math.cos(a2) * r, cy + Math.sin(a2) * r);
        c.lineTo(cx + Math.cos(a1) * r, cy + Math.sin(a1) * r);
        c.stroke();
    }
}

// ═══════════════════════════════════════════════════════════════
// DAY / NIGHT MODE
// ═══════════════════════════════════════════════════════════════

function isNightTime() {
    return currentVars && (currentVars.prayerPeriod === 'maghrib' || currentVars.prayerPeriod === 'isha');
}

function getBgColor() {
    return isNightTime() ? '#020204' : '#f5f2ed';
}

// ═══════════════════════════════════════════════════════════════
// MAIN LOOP
// ═══════════════════════════════════════════════════════════════

function getVirtualTime() {
    const now = Date.now();
    const dt = now - lastRealTime;
    lastRealTime = now;
    virtualTimeOffset += dt * (speedMultiplier - 1);
    return new Date(now + virtualTimeOffset);
}

function computeVariables(now) {
    const hijri = getHijriDate(now);
    const ramadanDay = getRamadanDay(hijri);
    const moonPhase = getMoonPhase(now);
    const times = getDemoPrayerTimes();
    const period = getCurrentPrayerPeriod(now, times);

    return {
        prayerPeriod: period.name, prayerIndex: period.index,
        prayerProgress: period.progress,
        hijriDay: hijri.day, hijriMonth: hijri.month, hijriYear: hijri.year,
        ramadanDay, moonPhase,
        isLQN: isLaylatulQadr(ramadanDay),
        isFriday: isJumuah(now),
        dateStr: now.toISOString().slice(0, 10),
        locKey: locationKey(userLat, userLng),
        qibla: qiblaBearing,
        times, period,
    };
}

let lastPrayerPeriod = null;
let currentVars = null;

let lastDayNight = null;

function update() {
    requestAnimationFrame(update);

    const now = getVirtualTime();
    const vars = computeVariables(now);
    currentVars = vars;

    // Detect prayer period change → new artwork
    const periodKey = `${vars.dateStr}-${vars.prayerPeriod}-${manualSeedOffset}-${vars.locKey}`;
    if (periodKey !== lastPrayerPeriod) {
        lastPrayerPeriod = periodKey;
        const modVars = { ...vars };
        if (manualSeedOffset > 0) modVars.dateStr = `${vars.dateStr}-v${manualSeedOffset}`;
        artwork = generateArtwork(modVars);
        clearCanvas();
        drawCenterGlow();
    }

    // Detect day/night transition — redraw background + traces
    const dayNight = isNightTime() ? 'night' : 'day';
    if (dayNight !== lastDayNight && lastDayNight !== null) {
        // Background changed — full redraw with new bg
        clearCanvas();
        drawCenterGlow();
        lastDrawProgress = 0;
        drawTraces(0, drawProgress);
        lastDrawProgress = drawProgress;
        updateBodyColors();
    }
    lastDayNight = dayNight;

    // Draw new trace segments
    const targetProgress = vars.prayerProgress;
    if (targetProgress > lastDrawProgress) {
        drawTraces(lastDrawProgress, targetProgress);
        lastDrawProgress = targetProgress;
        drawProgress = targetProgress;
    }

    // Leading edges + clock hands on the overlay canvas
    drawLeadingEdges(targetProgress, now);

    updateUI(now, vars);
}

function updateBodyColors() {
    const night = isNightTime();
    document.body.style.background = getBgColor();

    const textHi  = night ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.30)';
    const textMid = night ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.22)';
    const textLo  = night ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.18)';
    const textXLo = night ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.12)';
    const btnBg   = night ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
    const btnClr  = night ? 'rgba(255,255,255,0.3)'  : 'rgba(0,0,0,0.3)';
    const btnBrd  = night ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

    document.getElementById('prayer-name').style.color = textHi;
    document.getElementById('time-display').style.color = textMid;
    document.getElementById('progress-label').style.color = textLo;
    document.getElementById('seed-info').style.color = textXLo;

    document.querySelectorAll('.ctrl-btn').forEach(btn => {
        btn.style.background = btnBg;
        btn.style.color = btnClr;
        btn.style.borderColor = btnBrd;
    });
}

function updateUI(now, vars) {
    const palette = PRAYER_PALETTES[vars.prayerPeriod];
    const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
    const h12 = h % 12 || 12;
    const ampm = h < 12 ? 'AM' : 'PM';

    document.getElementById('prayer-name').textContent = `${palette.name} · ${palette.ar}`;
    document.getElementById('time-display').textContent =
        `${h12}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} ${ampm}`;

    const pct = Math.floor(vars.prayerProgress * 100);
    document.getElementById('progress-label').textContent = `${pct}% complete`;

    if (artwork) {
        const hijri = `${vars.hijriDay}/${vars.hijriMonth}/${vars.hijriYear}`;
        const rm = vars.ramadanDay > 0 ? ` · Ramadan ${vars.ramadanDay}` : '';
        const lqn = vars.isLQN ? ' · ليلة القدر' : '';
        const loc = `${userLat.toFixed(1)}°, ${userLng.toFixed(1)}°`;
        const qDeg = ((qiblaBearing * 180 / Math.PI) + 360) % 360;
        document.getElementById('seed-info').textContent =
            `${hijri}${rm}${lqn} · ${loc} · qibla ${qDeg.toFixed(0)}° · ${artwork.pairs.length} orbits · seed ${artwork.seed}`;
    }
}

// ═══════════════════════════════════════════════════════════════
// EVENTS
// ═══════════════════════════════════════════════════════════════

window.addEventListener('resize', () => {
    resize();
    if (artwork) {
        clearCanvas();
        drawCenterGlow();
        lastDrawProgress = 0;
        drawTraces(0, drawProgress);
        lastDrawProgress = drawProgress;
    }
});

// Right-click save: swap in a composited canvas, restore after menu closes
const saveCanvas = document.createElement('canvas');
const saveCtx = saveCanvas.getContext('2d');

canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    // Composite both layers onto offscreen canvas
    saveCanvas.width = canvas.width;
    saveCanvas.height = canvas.height;
    saveCtx.drawImage(canvas, 0, 0);
    saveCtx.drawImage(liveCanvas, 0, 0);
    // Convert to blob and open save dialog
    saveCanvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const now = new Date();
        const ts = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
        a.download = `tawaf-${ts}.png`;
        a.click();
        URL.revokeObjectURL(url);
    }, 'image/png');
});

document.getElementById('btn-next').addEventListener('click', () => {
    manualSeedOffset++;
    lastPrayerPeriod = null;
});

document.getElementById('btn-speed').addEventListener('click', (e) => {
    const btn = e.currentTarget;
    if (speedMultiplier === 1) {
        speedMultiplier = 120;
        btn.textContent = '1×';
        btn.classList.add('active');
    } else {
        speedMultiplier = 1;
        btn.textContent = '120×';
        btn.classList.remove('active');
    }
});

document.getElementById('btn-daynight').addEventListener('click', (e) => {
    const btn = e.currentTarget;
    const vt = getVirtualTime();
    const currentlyNight = isNightTime();
    const times = getDemoPrayerTimes();

    // Jump to the opposite: if day → jump to Maghrib, if night → jump to Fajr
    let targetH, targetM;
    if (currentlyNight) {
        // Jump to Fajr (day)
        targetH = times.fajr.h;
        targetM = times.fajr.m + 2; // a couple mins into the period
    } else {
        // Jump to Maghrib (night)
        targetH = times.maghrib.h;
        targetM = times.maghrib.m + 2;
    }

    // Calculate offset to reach target time
    const targetDate = new Date(vt);
    targetDate.setHours(targetH, targetM, 0, 0);
    // If target is behind current virtual time, jump to next day's occurrence
    if (targetDate <= vt) targetDate.setDate(targetDate.getDate() + 1);
    virtualTimeOffset += targetDate.getTime() - vt.getTime();
    lastPrayerPeriod = null; // force artwork regeneration

    // Update button label to show what the NEXT click will do
    btn.textContent = currentlyNight ? 'Night' : 'Day';
    btn.classList.toggle('active');
});

document.getElementById('btn-clear').addEventListener('click', () => {
    if (artwork) {
        clearCanvas();
        drawCenterGlow();
        lastDrawProgress = 0;
        drawProgress = 0;
    }
});

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════

resize();
// Initialize day/night state before first clear
currentVars = computeVariables(new Date());
lastDayNight = isNightTime() ? 'night' : 'day';
updateBodyColors();
clearCanvas();
initGeolocation();
initCompass();

// iOS compass permission — needs user gesture; trigger on first tap anywhere
document.addEventListener('click', function iosCompass() {
    requestCompassPermission();
    document.removeEventListener('click', iosCompass);
}, { once: true });

update();
