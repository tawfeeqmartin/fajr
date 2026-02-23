// tawaf-gl.js — Three.js Generative Tawaf Clock
// Orbital resonance patterns with additive blending + bloom
// Port of tawaf.js (Canvas 2D) to WebGL via Three.js
// v76: 3D glass Kaaba cube (MeshPhysicalMaterial transmission) — beams refract through real glass

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// ═══════════════════════════════════════════════════════════════
// CONTAINER DETECTION (production mode)
// ═══════════════════════════════════════════════════════════════

const CONTAINER = window._clockContainer || null;
const CONTAINED = !!CONTAINER;
let _isFullscreen = false;

// ═══════════════════════════════════════════════════════════════
// CONSTANTS & CONFIG
// ═══════════════════════════════════════════════════════════════

const TWO_PI = Math.PI * 2;

// Theme mode: 'turrell' = pure Aten Reign rings only (no orbiter traces)
//             'orbiter' = orbital traces + blur layers (future theme)
const THEME_MODE = 'turrell';

// ── STARTUP PRESET (canonical — saved 2026-02-21) ──────────────
// These are the locked-in startup values. GUI tweaks are ephemeral.
// To save new defaults: update STARTUP_PRESET, then Object.assign into PRESETS on load.
const STARTUP_PRESET = Object.freeze({
    // Turrell Ganzfeld: luminous, desaturated color field.
    // The visual IS the light itself — traces are barely perceptible.
    // "Subtract. Soften. Slow. Lighten. Desaturate. Dissolve."
    night: Object.freeze({
        alphaMul: 2.0,
        alphaMax: 0.05,        // traces are barely there — gossamer threads in light
        bloomStrength: 0.03,   // whisper of bloom — Turrell light is uniform, not point-source
        bloomThreshold: 0.70,
        bloomRadius: 1.2,      // wide, diffuse — no visible glow halos
        bg: '#eae7f0',
    }),
    day: Object.freeze({
        alphaMul: 2.0,
        alphaMax: 0.05,        // same gossamer traces
        bloomStrength: 0.02,
        bloomThreshold: 0.75,
        bloomRadius: 1.2,
        bg: '#f8f7f4',
    }),
    shared: Object.freeze({
        depthFactor: 0.7,
        radiusPower: 2.0,
        midDipStrength: 0.55,
        velCap: 1.5,
        connAlphaMul: 0.008,   // connection lines barely perceptible
        noiseSigma: 0.0003,
        hueJitter: 10,
        pathGradient: 16,
    }),
    turrell: Object.freeze({
        glowIntensity: 0.02,   // barely there — let the rings speak
        blurPasses: 8,         // enough dissolution
        blurScale: 1.2,        // moderate kernels
        tintStrength: 0.45,    // light tint — blur is atmospheric texture, not color override
        fadeTarget: 0.15,      // whisper of atmosphere — rings dominate, blur adds life
        fadeRate: 0.002,       // slow build
    }),
});

// Live presets — initialized from startup values
const PRESETS = {
    night:   { ...STARTUP_PRESET.night   },
    day:     { ...STARTUP_PRESET.day     },
    shared:  { ...STARTUP_PRESET.shared  },
    turrell: { ...STARTUP_PRESET.turrell },
};

const RATIO_BANK = [
    [3, 5], [5, 8], [4, 7], [5, 9], [3, 7],
    [5, 13], [8, 13], [7, 12], [7, 11], [5, 12],
    [7, 19], [8, 19], [11, 19], [3, 8], [2, 7], [13, 21],
];

const PRAYER_PALETTES = {
    // Base palette for traces/UI — used for non-ring elements.
    fajr:    { h: 210, s: 50, l: 80, name: 'Fajr',    ar: 'فجر'    },
    dhuhr:   { h: 42,  s: 45, l: 82, name: 'Dhuhr',   ar: 'ظهر'    },
    asr:     { h: 25,  s: 50, l: 78, name: 'Asr',     ar: 'عصر'    },
    maghrib: { h: 338, s: 48, l: 74, name: 'Maghrib', ar: 'مغرب'   },
    isha:    { h: 262, s: 45, l: 72, name: 'Isha',    ar: 'عشاء'    },
};

// 7 concentric ring palettes — the Seven Heavens (سبع سماوات).
// Each prayer has 7 DISTINCT hues radiating from luminous center to immersive edge.
// Turrell Aten Reign structure with Islamic cosmological depth.
// [h, s, l] per ring, center (0) to edge (6).
//
// ── Miraj depth progression ──
// Each heaven the Prophet ﷺ ascended through had greater glory.
// Steeper saturation climb: S:18 (near-pure divine light) → S:68 (deep immersion).
// Steeper lightness descent: L:92 (luminous source) → L:26 (infinite depth).
// Wider hue spread per prayer for richer simultaneous contrast between bands.
const PRAYER_RING_PALETTES = {
    fajr: [
        [188, 50, 72],   // 1st heaven (Adam ﷺ): vivid dawn — the glowing inner ring
        [196, 26, 82],   // 2nd heaven (Isa & Yahya ﷺ): soft cerulean
        [206, 34, 72],   // 3rd heaven (Yusuf ﷺ): morning blue
        [216, 42, 60],   // 4th heaven (Idris ﷺ): steel blue
        [226, 50, 48],   // 5th heaven (Harun ﷺ): deepening azure
        [238, 60, 36],   // 6th heaven (Musa ﷺ): twilight blue
        [250, 68, 26],   // 7th heaven (Ibrahim ﷺ): indigo — Sidrat al-Muntaha
    ],
    dhuhr: [
        [52,  50, 72],   // 1st heaven: vivid sunlight — glowing inner ring
        [48,  26, 82],   // 2nd heaven: warm gold
        [42,  34, 72],   // 3rd heaven: golden amber
        [34,  42, 60],   // 4th heaven: deep amber
        [24,  50, 48],   // 5th heaven: sienna warmth
        [14,  60, 36],   // 6th heaven: burnt umber
        [4,   68, 26],   // 7th heaven: earth depth
    ],
    asr: [
        [34,  50, 72],   // 1st heaven: vivid peach — glowing inner ring
        [28,  26, 82],   // 2nd heaven: soft coral
        [20,  34, 72],   // 3rd heaven: warm terracotta
        [12,  42, 60],   // 4th heaven: deep terracotta
        [4,   50, 48],   // 5th heaven: deepening rust
        [354, 60, 36],   // 6th heaven: dark rust
        [344, 68, 26],   // 7th heaven: crimson depth
    ],
    maghrib: [
        [350, 50, 72],   // 1st heaven: vivid rose — glowing inner ring
        [344, 26, 82],   // 2nd heaven: soft rose
        [335, 34, 72],   // 3rd heaven: warm magenta
        [326, 42, 60],   // 4th heaven: deep rose
        [316, 50, 48],   // 5th heaven: deepening plum
        [304, 60, 36],   // 6th heaven: dark plum
        [292, 68, 26],   // 7th heaven: purple depth
    ],
    isha: [
        [280, 50, 72],   // 1st heaven: vivid lavender — glowing inner ring
        [274, 26, 82],   // 2nd heaven: soft lavender
        [266, 34, 72],   // 3rd heaven: warm violet
        [258, 42, 60],   // 4th heaven: violet
        [248, 50, 48],   // 5th heaven: deepening purple
        [238, 60, 36],   // 6th heaven: dark purple
        [228, 68, 26],   // 7th heaven: deep indigo — Sidrat al-Muntaha
    ],
};

// prettier-ignore
const HOUR_PATHS = {
"1":{"a":"١","w":11.6,"h":39.76,"c":[["M",-5.8,-10.42],["L",-5.8,-10.42],["L",-3.66,-19.88],["Q",2.53,-11.87,4.78,-1.86],["Q",7.03,8.14,4.32,19.88],["L",4.32,19.88],["L",3.8,19.88],["Q",3.51,11.76,1.37,3.9],["Q",-0.77,-3.96,-5.8,-10.42],["Z"]]},
"2":{"a":"٢","w":18.88,"h":39.76,"c":[["M",8.91,-19.35],["L",9.44,-19.35],["Q",9.44,-15.56,8.42,-12.43],["Q",7.4,-9.3,5.59,-7.44],["Q",3.78,-5.57,1.42,-5.57],["L",1.42,-5.57],["Q",-0.4,-5.57,-2.41,-6.84],["L",-2.41,-6.84],["L",-4.2,-15.35],["Q",-3.18,-13.66,-1.74,-12.78],["Q",-0.3,-11.9,1.28,-11.9],["L",1.28,-11.9],["Q",3.5,-11.9,5.61,-13.71],["Q",7.72,-15.52,8.91,-19.35],["L",8.91,-19.35],["Z"],["M",-9.44,-10.42],["L",-9.44,-10.42],["L",-7.29,-19.88],["Q",-1.11,-11.87,1.14,-1.86],["Q",3.39,8.14,0.69,19.88],["L",0.69,19.88],["L",0.16,19.88],["Q",-0.12,11.76,-2.27,3.9],["Q",-4.41,-3.96,-9.44,-10.42],["Z"]]},
"3":{"a":"٣","w":26.26,"h":39.76,"c":[["M",12.6,-18.62],["L",12.6,-18.62],["L",13.13,-18.62],["Q",13.13,-14.78,12.09,-11.6],["Q",11.06,-8.42,9.35,-6.52],["Q",7.65,-4.62,5.61,-4.62],["L",5.61,-4.62],["Q",3.32,-4.62,1.25,-7.26],["L",1.25,-7.26],["Q",-0.44,-4.83,-3.15,-4.83],["L",-3.15,-4.83],["Q",-4.87,-4.83,-6.1,-6.1],["L",-6.1,-6.1],["L",-7.12,-14.01],["Q",-5.5,-11.06,-3.46,-11.06],["L",-3.46,-11.06],["Q",-1.81,-11.06,-0.25,-13.08],["Q",1.32,-15.1,2.41,-18.62],["L",2.41,-18.62],["L",2.94,-18.62],["Q",2.94,-10.92,6.59,-10.92],["L",6.59,-10.92],["Q",8.1,-10.92,10.02,-12.64],["Q",11.94,-14.36,12.6,-18.62],["Z"],["M",-13.13,-10.42],["L",-13.13,-10.42],["L",-10.99,-19.88],["Q",-4.8,-11.87,-2.55,-1.86],["Q",-0.3,8.14,-3.01,19.88],["L",-3.01,19.88],["L",-3.53,19.88],["Q",-3.81,11.76,-5.96,3.9],["Q",-8.1,-3.96,-13.13,-10.42],["Z"]]},
"4":{"a":"٤","w":19.23,"h":38.43,"c":[["M",9.62,13.34],["L",9.62,13.34],["L",7.86,19.21],["Q",6.98,19.11,5.08,18.67],["Q",3.18,18.23,0.9,17.54],["Q",-1.39,16.86,-3.5,16.01],["Q",-5.61,15.17,-6.96,14.24],["Q",-8.31,13.31,-8.31,12.39],["L",-8.31,12.39],["Q",-8.31,11.23,-7.28,9.58],["Q",-6.24,7.93,-4.9,6.29],["Q",-3.57,4.66,-2.53,3.45],["Q",-1.49,2.23,-1.49,1.92],["L",-1.49,1.92],["Q",-1.49,1.49,-2.72,1],["Q",-3.96,0.51,-5.55,-0.14],["Q",-7.15,-0.79,-8.38,-1.6],["Q",-9.62,-2.41,-9.62,-3.46],["L",-9.62,-3.46],["Q",-9.62,-4.59,-8.6,-6.5],["Q",-7.58,-8.42,-5.94,-10.6],["Q",-4.31,-12.78,-2.5,-14.75],["Q",-0.69,-16.72,0.95,-17.96],["Q",2.58,-19.21,3.6,-19.21],["L",3.6,-19.21],["L",1.85,-11.87],["Q",0.02,-11.72,-1.83,-10.86],["Q",-3.67,-10,-4.9,-9.02],["Q",-6.13,-8.03,-6.13,-7.54],["L",-6.13,-7.54],["Q",-6.13,-7.01,-4.68,-6.42],["Q",-3.22,-5.82,-1.3,-5.1],["Q",0.62,-4.38,2.07,-3.5],["Q",3.53,-2.62,3.53,-1.49],["L",3.53,-1.49],["Q",3.53,-0.83,2.44,0.47],["Q",1.35,1.78,-0.07,3.29],["Q",-1.49,4.8,-2.58,6.12],["Q",-3.67,7.44,-3.67,8.17],["L",-3.67,8.17],["Q",-3.67,8.91,-2.2,9.7],["Q",-0.72,10.49,1.49,11.23],["Q",3.71,11.97,5.92,12.52],["Q",8.14,13.06,9.62,13.34],["Z"]]},
"5":{"a":"٥","w":18.39,"h":27.42,"c":[["M",-1.95,-13.71],["L",-1.95,-13.71],["Q",-0.12,-12.09,1.83,-11.09],["Q",3.78,-10.09,5.45,-8.96],["Q",7.12,-7.84,8.16,-5.98],["Q",9.19,-4.11,9.19,-0.77],["L",9.19,-0.77],["Q",9.19,2.85,7.59,6.17],["Q",5.99,9.49,3.38,11.6],["Q",0.76,13.71,-2.34,13.71],["L",-2.34,13.71],["Q",-5.96,13.71,-7.58,11.44],["Q",-9.19,9.18,-9.19,5.66],["L",-9.19,5.66],["Q",-9.19,2.81,-8.28,-0.53],["Q",-7.37,-3.87,-5.73,-7.28],["Q",-4.1,-10.69,-1.95,-13.71],["Z"],["M",-1.42,7.45],["L",-1.42,7.45],["Q",-0.37,7.45,1.14,7.12],["Q",2.65,6.79,4.11,6.03],["Q",5.57,5.27,6.54,4.01],["Q",7.51,2.74,7.51,0.88],["L",7.51,0.88],["Q",7.51,-0.46,6.08,-1.55],["Q",4.66,-2.64,2.67,-3.59],["Q",0.69,-4.54,-1.16,-5.41],["Q",-3.01,-6.29,-3.85,-7.14],["L",-3.85,-7.14],["Q",-4.97,-4.61,-5.75,-2.09],["Q",-6.52,0.42,-6.52,2.46],["L",-6.52,2.46],["Q",-6.52,4.68,-5.38,6.06],["Q",-4.24,7.45,-1.42,7.45],["Z"]]},
"6":{"a":"٦","w":22.98,"h":38.95,"c":[["M",-11.08,-19.48],["L",-11.08,-19.48],["L",-10.55,-19.48],["Q",-9.08,-18.14,-7.28,-17.54],["Q",-5.49,-16.95,-3.45,-16.95],["L",-3.45,-16.95],["Q",-1.48,-16.95,0.64,-17.42],["Q",2.77,-17.89,5.02,-18.74],["L",5.02,-18.74],["Q",5.02,-12.8,5.67,-7.26],["Q",6.32,-1.72,7.76,2.85],["Q",9.2,7.42,11.49,10.55],["L",11.49,10.55],["L",9.24,19.48],["Q",7.31,16.66,6.11,12.69],["Q",4.92,8.72,4.32,4.18],["Q",3.72,-0.35,3.51,-4.9],["Q",3.3,-9.46,3.3,-13.43],["L",3.3,-13.43],["L",3.65,-13.25],["Q",-0.53,-10.62,-4.89,-10.62],["L",-4.89,-10.62],["Q",-8.23,-10.62,-9.73,-11.53],["Q",-11.22,-12.45,-11.43,-14.4],["Q",-11.64,-16.35,-11.08,-19.48],["Z"]]},
"7":{"a":"٧","w":25.42,"h":38.95,"c":[["M",0.47,19.48],["L",0.47,19.48],["L",-0.05,19.48],["Q",-1.39,8.02,-4.9,0.11],["Q",-8.42,-7.8,-12.71,-11.99],["L",-12.71,-11.99],["L",-11.65,-19.48],["Q",-8.28,-16.17,-6.05,-12.57],["Q",-3.81,-8.96,-2.27,-4.38],["Q",-0.72,0.21,0.58,6.47],["L",0.58,6.47],["L",0.4,6.54],["Q",1.56,0.07,2.92,-4.69],["Q",4.27,-9.46,6.56,-13.03],["Q",8.84,-16.59,12.71,-19.48],["L",12.71,-19.48],["L",11.65,-11.99],["Q",8.38,-9.21,6.03,-4.18],["Q",3.67,0.84,2.29,7.01],["Q",0.9,13.18,0.47,19.48],["Z"]]},
"8":{"a":"٨","w":25.42,"h":38.95,"c":[["M",-0.47,-19.48],["L",-0.47,-19.48],["L",0.05,-19.48],["Q",1.39,-8.05,4.9,-0.12],["Q",8.42,7.8,12.71,11.99],["L",12.71,11.99],["L",11.65,19.48],["Q",8.31,16.14,6.06,12.55],["Q",3.81,8.96,2.27,4.38],["Q",0.72,-0.21,-0.58,-6.47],["L",-0.58,-6.47],["L",-0.4,-6.54],["Q",-1.53,-0.11,-2.9,4.68],["Q",-4.27,9.46,-6.54,13.03],["Q",-8.81,16.59,-12.71,19.48],["L",-12.71,19.48],["L",-11.65,11.99],["Q",-8.35,9.18,-6.01,4.17],["Q",-3.67,-0.84,-2.27,-7.01],["Q",-0.86,-13.18,-0.47,-19.48],["Z"]]},
"9":{"a":"٩","w":18.67,"h":39.48,"c":[["M",1.67,-6.35],["L",2.76,-1.04],["Q",2.2,-0.23,0.37,0.63],["Q",-1.46,1.49,-3.11,1.49],["L",-3.11,1.49],["Q",-6.91,1.49,-8.12,-0.16],["Q",-9.33,-1.81,-9.33,-4.38],["L",-9.33,-4.38],["Q",-9.33,-6.21,-8.89,-8.79],["Q",-8.46,-11.37,-7.52,-13.89],["Q",-6.59,-16.4,-5.12,-18.07],["Q",-3.64,-19.74,-1.56,-19.74],["L",-1.56,-19.74],["Q",-0.12,-19.74,0.83,-18.05],["Q",1.78,-16.37,2.48,-13.59],["Q",3.18,-10.81,3.78,-7.45],["Q",4.38,-4.1,5.1,-0.72],["Q",5.82,2.65,6.84,5.55],["Q",7.86,8.46,9.33,10.28],["L",9.33,10.28],["L",8.28,19.74],["Q",6.73,17.77,5.7,14.59],["Q",4.66,11.41,3.92,7.68],["Q",3.18,3.96,2.57,0.23],["Q",1.95,-3.5,1.23,-6.59],["Q",0.51,-9.69,-0.47,-11.55],["Q",-1.46,-13.41,-2.97,-13.41],["L",-2.97,-13.41],["Q",-4.27,-13.41,-5.15,-12.57],["Q",-6.03,-11.72,-6.56,-10.55],["Q",-7.08,-9.37,-7.29,-8.4],["Q",-7.51,-7.44,-7.51,-7.15],["L",-7.51,-7.15],["Q",-7.51,-6.24,-6.01,-5.54],["Q",-4.52,-4.83,-2.58,-4.83],["L",-2.58,-4.83],["Q",-1.32,-4.83,-0.16,-5.19],["Q",1,-5.54,1.67,-6.35],["L",1.67,-6.35],["Z"]]},
"10":{"a":"١٠","w":25.91,"h":39.76,"c":[["M",-12.96,-10.42],["L",-12.96,-10.42],["L",-10.81,-19.88],["Q",-4.62,-11.87,-2.37,-1.86],["Q",-0.12,8.14,-2.83,19.88],["L",-2.83,19.88],["L",-3.36,19.88],["Q",-3.64,11.76,-5.78,3.9],["Q",-7.93,-3.96,-12.96,-10.42],["Z"],["M",8.28,-3.74],["L",8.28,-3.74],["Q",8.56,-3.74,9.32,-3.11],["Q",10.07,-2.48,10.92,-1.58],["Q",11.76,-0.69,12.36,0.11],["Q",12.96,0.9,12.96,1.21],["L",12.96,1.21],["Q",12.96,1.53,12.38,2.36],["Q",11.79,3.18,10.97,4.11],["Q",10.14,5.04,9.39,5.7],["Q",8.63,6.35,8.28,6.35],["L",8.28,6.35],["Q",8,6.35,7.24,5.7],["Q",6.49,5.04,5.63,4.15],["Q",4.76,3.25,4.15,2.43],["Q",3.53,1.6,3.53,1.28],["L",3.53,1.28],["Q",3.53,0.9,4.15,0.09],["Q",4.76,-0.72,5.63,-1.62],["Q",6.49,-2.51,7.24,-3.13],["Q",8,-3.74,8.28,-3.74],["Z"]]},
"11":{"a":"١١","w":28.09,"h":39.76,"c":[["M",-14.05,-10.42],["L",-14.05,-10.42],["L",-11.9,-19.88],["Q",-5.71,-11.87,-3.46,-1.86],["Q",-1.21,8.14,-3.92,19.88],["L",-3.92,19.88],["L",-4.45,19.88],["Q",-4.73,11.76,-6.87,3.9],["Q",-9.02,-3.96,-14.05,-10.42],["Z"],["M",2.44,-10.42],["L",2.44,-10.42],["L",4.59,-19.88],["Q",10.77,-11.87,13.02,-1.86],["Q",15.27,8.14,12.57,19.88],["L",12.57,19.88],["L",12.04,19.88],["Q",11.76,11.76,9.61,3.9],["Q",7.47,-3.96,2.44,-10.42],["Z"]]},
"12":{"a":"١٢","w":35.37,"h":39.76,"c":[["M",-17.68,-10.42],["L",-17.68,-10.42],["L",-15.54,-19.88],["Q",-9.35,-11.87,-7.1,-1.86],["Q",-4.85,8.14,-7.56,19.88],["L",-7.56,19.88],["L",-8.09,19.88],["Q",-8.37,11.76,-10.51,3.9],["Q",-12.66,-3.96,-17.68,-10.42],["Z"],["M",17.16,-19.35],["L",17.68,-19.35],["Q",17.68,-15.56,16.66,-12.43],["Q",15.64,-9.3,13.83,-7.44],["Q",12.02,-5.57,9.67,-5.57],["L",9.67,-5.57],["Q",7.84,-5.57,5.84,-6.84],["L",5.84,-6.84],["L",4.04,-15.35],["Q",5.06,-13.66,6.5,-12.78],["Q",7.95,-11.9,9.53,-11.9],["L",9.53,-11.9],["Q",11.74,-11.9,13.85,-13.71],["Q",15.96,-15.52,17.16,-19.35],["L",17.16,-19.35],["Z"],["M",-1.2,-10.42],["L",-1.2,-10.42],["L",0.95,-19.88],["Q",7.14,-11.87,9.39,-1.86],["Q",11.64,8.14,8.93,19.88],["L",8.93,19.88],["L",8.4,19.88],["Q",8.12,11.76,5.98,3.9],["Q",3.83,-3.96,-1.2,-10.42],["Z"]]},
};

// Kaaba geometric outline — iconic 3/4 view for epicycle drawing
const KAABA_CONTOURS = [
    // Simple cube (diamond) rotated 45 degrees — single closed path
    [
        {x: 50, y: 0},   // top
        {x: 100, y: 50},  // right
        {x: 50, y: 100},  // bottom
        {x: 0, y: 50},    // left
        {x: 50, y: 0},    // close
    ],
];

const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

// ═══════════════════════════════════════════════════════════════
// LOCATION & QIBLA
// ═══════════════════════════════════════════════════════════════

let userLat = 34.05, userLng = -118.24;
let qiblaBearing = 0;
let deviceHeading = null;

function computeQibla(lat, lng) {
    const toRad = d => d * Math.PI / 180;
    const φ1 = toRad(lat), φ2 = toRad(KAABA_LAT);
    const Δλ = toRad(KAABA_LNG - lng);
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    return Math.atan2(y, x);
}

function initGeolocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            userLat = pos.coords.latitude;
            userLng = pos.coords.longitude;
            qiblaBearing = computeQibla(userLat, userLng);
            lastPrayerPeriod = null;
        },
        () => {},
        { timeout: 5000, enableHighAccuracy: false }
    );
    qiblaBearing = computeQibla(userLat, userLng);
}

function initCompass() {
    const handler = (e) => {
        let heading = null;
        if (e.webkitCompassHeading !== undefined) heading = e.webkitCompassHeading;
        else if (e.alpha !== null) heading = (360 - e.alpha) % 360;
        if (heading !== null) deviceHeading = heading * Math.PI / 180;
    };
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
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
            if (state === 'granted') window.addEventListener('deviceorientation', window._compassHandler, true);
        }).catch(() => {});
    }
}

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

function getRamadanDay(hijri) { return hijri.month === 9 ? hijri.day : 0; }
function getMoonPhase(date) {
    const knownNew = new Date('2024-01-11T11:57:00Z').getTime();
    const synodic = 29.53058770576;
    const daysSince = (date.getTime() - knownNew) / (1000 * 60 * 60 * 24);
    return ((daysSince % synodic) + synodic) % synodic / synodic;
}
function isLaylatulQadr(ramadanDay) { return ramadanDay >= 21 && ramadanDay % 2 === 1; }
function isJumuah(date) { return date.getDay() === 5; }

// LA fallback times (Feb/Mar 2026 — used when window._prayerTimings is not yet populated)
const _LA_FALLBACK_TIMES = {
    fajr: { h: 5, m: 22 }, dhuhr: { h: 12, m: 13 },
    asr: { h: 15, m: 33 }, maghrib: { h: 17, m: 52 }, isha: { h: 19, m: 8 },
};

function getPrayerTimes() {
    const src = window._prayerTimings;
    if (!src) return { ..._LA_FALLBACK_TIMES };
    // Parse "H:MM" or "HH:MM" strings from Aladhan API
    function parseHM(str) {
        if (!str) return null;
        // Strip any suffix like " (PST)"
        const clean = str.replace(/\s*\(.*\)/, '').trim();
        const parts = clean.split(':');
        if (parts.length < 2) return null;
        return { h: parseInt(parts[0], 10), m: parseInt(parts[1], 10) };
    }
    const fajr    = parseHM(src.Fajr)    || _LA_FALLBACK_TIMES.fajr;
    const dhuhr   = parseHM(src.Dhuhr)   || _LA_FALLBACK_TIMES.dhuhr;
    const asr     = parseHM(src.Asr)     || _LA_FALLBACK_TIMES.asr;
    const maghrib = parseHM(src.Maghrib) || _LA_FALLBACK_TIMES.maghrib;
    const isha    = parseHM(src.Isha)    || _LA_FALLBACK_TIMES.isha;
    return { fajr, dhuhr, asr, maghrib, isha };
}

function getCurrentPrayerPeriod(now, times) {
    const mins = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60 + now.getMilliseconds() / 60000;
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
    const { prayerPeriod, hijriDay, hijriMonth, ramadanDay, moonPhase, isLQN, isFriday, dateStr, locKey, qibla } = variables;

    const seedStr = `${dateStr}-${prayerPeriod}-${hijriDay}-${hijriMonth}-${locKey}`;
    const seed = hashSeed(seedStr);
    const rng = seededRandom(seed);

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
        // Higher min radii — prevents dense inner rings
        const r1 = 0.25 + rng() * 0.30;  // min 0.25 (was 0.08)
        const r2 = 0.50 + rng() * 0.45;  // min 0.50 (was 0.45)
        const speedBase = 0.4 + rng() * 1.2;
        // Near-rational perturbation: very subtle precession preserves geometry
        const epsilon = (rng() - 0.5) * 0.002;
        const speed1 = speedBase * (p + epsilon);
        const speed2 = speedBase * (q + epsilon);
        // Third arm: disabled to preserve clean rosette geometry
        const r3 = 0;
        const speed3 = speedBase * (p + q) * 0.5 + (rng() - 0.5) * 0.2;
        const offset = qibla + (i / pairCount) * TWO_PI * 0.618;
        const hueShift = (rng() - 0.5) * 35;
        const h = (palette.h + hueShift + 360) % 360;
        const s = palette.s + (rng() - 0.5) * 15;
        const l = palette.l + (rng() - 0.5) * 15;
        const alpha = isLQN ? 0.025 + rng() * 0.04 : 0.012 + rng() * 0.03;
        const depth = rng() * rng();
        pairs.push({ p, q, r1, r2, speed1, speed2, speed3, r3, offset, h, s, l, alpha, depth });
    }

    if (isLQN) {
        const [p, q] = [8, 13];
        pairs.push({
            p, q, r1: 0.18 + rng() * 0.12, r2: 0.48 + rng() * 0.2,
            speed1: 1.1 * p, speed2: 1.1 * q, offset: qibla,
            h: 45, s: 70, l: 65, alpha: 0.045, depth: 0.8,
            r3: 0, speed3: 0,
        });
    }

    // Near-rational perturbation + center-distance dimming allow more revs
    const totalRevolutions = 70 + Math.floor(rng() * 80);

    return { pairs, totalRevolutions, seed, palette, prayerPeriod, variables, qibla };
}

// ═══════════════════════════════════════════════════════════════
// HELPER: HSL → THREE.Color
// ═══════════════════════════════════════════════════════════════

function hslToColor(h, s, l) {
    return new THREE.Color().setHSL(h / 360, s / 100, l / 100);
}

// ═══════════════════════════════════════════════════════════════
// DFT INFRASTRUCTURE — path parsing, Fourier transform, epicycle evaluation
// ═══════════════════════════════════════════════════════════════

function parsePathToContours(pathData) {
    const commands = pathData.c;
    const contours = [];
    let current = [];
    let cx = 0, cy = 0;
    let startX = 0, startY = 0;
    const BEZIER_STEPS = 20;

    for (const cmd of commands) {
        const type = cmd[0];
        if (type === 'M') {
            if (current.length > 0) contours.push(current);
            cx = cmd[1]; cy = cmd[2];
            startX = cx; startY = cy;
            current = [{ x: cx, y: cy }];
        } else if (type === 'L') {
            cx = cmd[1]; cy = cmd[2];
            const last = current[current.length - 1];
            if (!last || Math.abs(last.x - cx) > 0.001 || Math.abs(last.y - cy) > 0.001) {
                current.push({ x: cx, y: cy });
            }
        } else if (type === 'Q') {
            const x0 = cx, y0 = cy;
            const cpx = cmd[1], cpy = cmd[2], x2 = cmd[3], y2 = cmd[4];
            for (let i = 1; i <= BEZIER_STEPS; i++) {
                const t = i / BEZIER_STEPS, mt = 1 - t;
                current.push({ x: mt*mt*x0 + 2*mt*t*cpx + t*t*x2, y: mt*mt*y0 + 2*mt*t*cpy + t*t*y2 });
            }
            cx = x2; cy = y2;
        } else if (type === 'C') {
            const x0 = cx, y0 = cy;
            const cp1x = cmd[1], cp1y = cmd[2], cp2x = cmd[3], cp2y = cmd[4], x3 = cmd[5], y3 = cmd[6];
            for (let i = 1; i <= BEZIER_STEPS; i++) {
                const t = i / BEZIER_STEPS, mt = 1 - t;
                current.push({ x: mt*mt*mt*x0 + 3*mt*mt*t*cp1x + 3*mt*t*t*cp2x + t*t*t*x3, y: mt*mt*mt*y0 + 3*mt*mt*t*cp1y + 3*mt*t*t*cp2y + t*t*t*y3 });
            }
            cx = x3; cy = y3;
        } else if (type === 'Z') {
            const last = current[current.length - 1];
            if (last && (Math.abs(last.x - startX) > 0.01 || Math.abs(last.y - startY) > 0.01)) {
                current.push({ x: startX, y: startY });
            }
            contours.push(current);
            current = [];
            cx = startX; cy = startY;
        }
    }
    if (current.length > 0) contours.push(current);
    return contours;
}

function stitchContours(contours) {
    if (contours.length === 0) return [];
    if (contours.length === 1) return contours[0];
    const JUMP_POINTS = 10;
    const result = [...contours[0]];
    for (let c = 1; c < contours.length; c++) {
        const from = result[result.length - 1], to = contours[c][0];
        for (let i = 1; i <= JUMP_POINTS; i++) {
            const t = i / (JUMP_POINTS + 1);
            result.push({ x: from.x + t * (to.x - from.x), y: from.y + t * (to.y - from.y) });
        }
        result.push(...contours[c]);
    }
    const from = result[result.length - 1], to = result[0];
    for (let i = 1; i <= JUMP_POINTS; i++) {
        const t = i / (JUMP_POINTS + 1);
        result.push({ x: from.x + t * (to.x - from.x), y: from.y + t * (to.y - from.y) });
    }
    return result;
}

function resamplePath(points, N) {
    if (points.length < 2) return points;
    const lengths = [0];
    for (let i = 1; i < points.length; i++) {
        const dx = points[i].x - points[i - 1].x, dy = points[i].y - points[i - 1].y;
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

function computeDFT(points) {
    const N = points.length;
    const coefficients = [];
    for (let k = -Math.floor(N / 2); k <= Math.floor(N / 2); k++) {
        let re = 0, im = 0;
        for (let n = 0; n < N; n++) {
            const angle = -TWO_PI * k * n / N;
            const cos = Math.cos(angle), sin = Math.sin(angle);
            re += points[n].x * cos - points[n].y * sin;
            im += points[n].x * sin + points[n].y * cos;
        }
        re /= N; im /= N;
        coefficients.push({ freq: k, amp: Math.sqrt(re * re + im * im), phase: Math.atan2(im, re) });
    }
    coefficients.sort((a, b) => b.amp - a.amp);
    return coefficients;
}

// Pre-allocated epicycle evaluation result (zero per-frame alloc)
const EPICYCLE_NUM_COEFFS = 250;
const _epiCircles = new Array(EPICYCLE_NUM_COEFFS);
for (let i = 0; i < EPICYCLE_NUM_COEFFS; i++) _epiCircles[i] = { cx: 0, cy: 0, r: 0, ex: 0, ey: 0 };
const _epiResult = { x: 0, y: 0, circles: _epiCircles, circleCount: 0 };

function evaluateEpicycles(coeffs, t, numCoeffs) {
    let x = 0, y = 0;
    const n = Math.min(numCoeffs, coeffs.length);
    for (let i = 0; i < n; i++) {
        const { freq, amp, phase } = coeffs[i];
        const c = _epiCircles[i];
        c.cx = x; c.cy = y; c.r = amp;
        x += amp * Math.cos(freq * t + phase);
        y += amp * Math.sin(freq * t + phase);
        c.ex = x; c.ey = y;
    }
    _epiResult.x = x; _epiResult.y = y; _epiResult.circleCount = n;
    return _epiResult;
}

// ═══════════════════════════════════════════════════════════════
// THREE.JS SETUP
// ═══════════════════════════════════════════════════════════════

let W = CONTAINED ? CONTAINER.clientWidth : window.innerWidth;
let H = CONTAINED ? CONTAINER.clientHeight : window.innerHeight;
const aspect = W / H;
const frustum = 2; // world units from center to edge vertically
const radius = frustum * 1.6; // orbital radius in world units — scaled up for larger drawing fill

const scene = new THREE.Scene();
// No scene.background — Aten Reign quad provides the concentric ring background
scene.background = null;

const camera = new THREE.OrthographicCamera(
    aspect >= 1 ? -frustum * aspect : -frustum,
    aspect >= 1 ?  frustum * aspect :  frustum,
    aspect >= 1 ?  frustum          :  frustum / aspect,
    aspect >= 1 ? -frustum          : -frustum / aspect,
    0.1, 100
);
camera.position.set(0, 0, 10);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
});
renderer.setSize(W, H);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// Higher transmission resolution — glass cube needs crisp refraction
renderer.transmissionResolutionScale = 1.0; // default 0.5 makes glass look blurry
if (CONTAINED) {
    CONTAINER.appendChild(renderer.domElement);
} else {
    document.body.insertBefore(renderer.domElement, document.getElementById('overlay'));
}

// Post-processing: bloom
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(W, H),
    0.12,  // strength — gentle bloom, preserve ring saturation
    0.4,   // radius — tighter spread
    0.72   // threshold — high, only beam tips and flare bloom
);
composer.addPass(bloomPass);

// Turrell Skyspace aperture — you look INTO light. Center radiates, edges deepen.
// Inverted vignette: center brightens (aperture glow), edges saturate deeper.
const TurrellApertureShader = {
    uniforms: {
        tDiffuse:    { value: null },
        uGlow:       { value: 0.0 },     // killed — dark glass core needs contrast, not glow
        uDeepen:     { value: 0.14 },    // deeper edge immersion
        uEdgeColor:  { value: new THREE.Color(0.5, 0.45, 0.55) }, // deeper prayer tint at edges
        uAspect:     { value: W / H },
        uFlare:      { value: 0.0 },     // tawaf lens flare intensity (0 = off, 1 = peak)
        uFlarePos:   { value: new THREE.Vector2(0.5, 0.2) }, // flare source in UV space
        uFlareColor: { value: new THREE.Color(1.0, 0.97, 0.92) }, // warm prayer-tinted white
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uGlow;
        uniform float uDeepen;
        uniform vec3 uEdgeColor;
        uniform float uAspect;
        uniform float uFlare;
        uniform vec2 uFlarePos;
        uniform vec3 uFlareColor;
        varying vec2 vUv;
        void main() {
            vec4 texel = texture2D(tDiffuse, vUv);
            vec2 uv = (vUv - 0.5) * 2.0;
            // Correct for non-square viewport — keeps glow/deepening circular
            uv *= vec2(max(uAspect, 1.0), max(1.0 / uAspect, 1.0));
            float dist = length(uv);

            // Center glow — Turrell Ganzfeld: gentle radiance from the center of the field
            float glow = 1.0 - smoothstep(0.0, 1.4, dist * 0.5);
            texel.rgb += glow * uGlow;

            // Edge deepening — looking deeper into the color field
            // Subtle shift toward a richer version of the prayer color
            float edge = smoothstep(0.5, 1.5, dist);
            texel.rgb = mix(texel.rgb, uEdgeColor, edge * uDeepen);

            // ── TAWAF LENS FLARE (post-processing, screen-space) ──
            // Fires every 7 circuits. Cinematic camera-lens light event.
            if (uFlare > 0.001) {
                vec2 flareUV = vUv - uFlarePos;
                float fAspect = max(uAspect, 1.0) / max(1.0 / uAspect, 1.0);
                flareUV.x *= fAspect;

                // 1. Gentle luminance bloom — subtle brightening of the field
                float wash = uFlare * 0.05;
                texel.rgb = mix(texel.rgb, uFlareColor, wash);

                // 2. Soft radial glow from source — wide, diffuse
                float flareDist = length(flareUV);
                float burst = exp(-flareDist * flareDist * 8.0) * uFlare;
                texel.rgb += uFlareColor * burst * 0.12;

                // 3. Subtle anamorphic streak — barely there horizontal
                float streakY = exp(-flareUV.y * flareUV.y * 1200.0);
                float streakX = exp(-flareUV.x * flareUV.x * 0.8);
                float streak = streakX * streakY * uFlare * 0.06;
                texel.rgb += uFlareColor * streak;
            }

            gl_FragColor = texel;
        }
    `,
};
const vignettePass = new ShaderPass(TurrellApertureShader);
composer.addPass(vignettePass);

// ═══════════════════════════════════════════════════════════════
// BOKEH DISC BLUR INFRASTRUCTURE — render-to-texture + single-pass disc blur
// ═══════════════════════════════════════════════════════════════

// Two ping-pong render targets: capture → bokeh
function makeBlurTarget(w, h) {
    return new THREE.WebGLRenderTarget(w, h, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.UnsignedByteType,
        depthBuffer: false,
        stencilBuffer: false,
    });
}
let blurTargetA = makeBlurTarget(W, H);
let blurTargetB = makeBlurTarget(W, H);

// Pass-through vertex shader (shared)
const BLUR_VERT = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Bokeh disc blur — 61-tap concentric rings with brightness-weighted scatter,
// soft disc falloff, and chromatic fringing.
//
// Ring layout:
//   Ring 0 (r=0.25):  6 samples  at 60° spacing
//   Ring 1 (r=0.50): 12 samples  at 30° spacing
//   Ring 2 (r=0.75): 18 samples  at 20° spacing
//   Ring 3 (r=1.00): 24 samples  at 15° spacing
//   Center tap:        1 sample
//   Total:            61 taps
const BOKEH_FRAG = `
uniform sampler2D tDiffuse;
uniform vec2 uResolution;
uniform float uBokehRadius;
uniform vec3 uTintColor;    // prayer palette tint
uniform float uTintStrength; // how much to shift toward tint
uniform float uGlowIntensity; // 0 = no luminance boost, 1 = nuclear
varying vec2 vUv;

void main() {
    vec2 texel = vec2(uBokehRadius) / uResolution;

    // ── Atmospheric scatter kernel ──────────────────────────
    // 3 concentric rings with Gaussian-weighted falloff
    // Turrell effect: light doesn't have edges, it dissolves into space
    
    vec4 totalColor = vec4(0.0);
    float totalWeight = 0.0;

    // Center tap
    vec4 center = texture2D(tDiffuse, vUv);
    float centerW = 2.0;
    totalColor += center * centerW;
    totalWeight += centerW;

    // Ring 1: r=0.33, 8 samples — inner atmospheric scatter
    const int R1 = 8;
    float r1Rad = 0.33;
    for (int i = 0; i < R1; i++) {
        float a = float(i) / float(R1) * 6.28318;
        vec2 off = vec2(cos(a), sin(a)) * r1Rad * texel;
        vec4 s = texture2D(tDiffuse, vUv + off);
        float w = 1.5; // Gaussian-ish weight
        totalColor += s * w;
        totalWeight += w;
    }

    // Ring 2: r=0.67, 16 samples — mid diffusion
    const int R2 = 16;
    float r2Rad = 0.67;
    for (int i = 0; i < R2; i++) {
        float a = float(i) / float(R2) * 6.28318;
        vec2 off = vec2(cos(a), sin(a)) * r2Rad * texel;
        vec4 s = texture2D(tDiffuse, vUv + off);
        float w = 0.8;
        totalColor += s * w;
        totalWeight += w;
    }

    // Ring 3: r=1.0, 24 samples — outer atmospheric haze
    const int R3 = 24;
    float r3Rad = 1.0;
    for (int i = 0; i < R3; i++) {
        float a = float(i) / float(R3) * 6.28318;
        vec2 off = vec2(cos(a), sin(a)) * r3Rad * texel;
        vec4 s = texture2D(tDiffuse, vUv + off);
        float w = 0.4;
        totalColor += s * w;
        totalWeight += w;
    }

    vec4 blurred = totalColor / totalWeight;

    // ── Turrell color tint ──────────────────────────────────
    // Shift the blurred layer toward the prayer palette color
    // Like colored light flooding through a Turrell aperture
    vec3 tinted = mix(blurred.rgb, blurred.rgb * uTintColor, uTintStrength);

    // ── Atmospheric luminance boost ─────────────────────────
    // Turrell's light appears to glow from within — push midtones
    float lum = dot(tinted, vec3(0.299, 0.587, 0.114));
    float boost = smoothstep(0.005, 0.15, lum) * uGlowIntensity;
    tinted += boost;

    // Pre-multiply RGB by alpha so transparent bg pixels stay transparent (day mode).
    // Night mode uses opaque bg (alpha=1) so this is a no-op at night.
    gl_FragColor = vec4(tinted * blurred.a, blurred.a);
}
`;

// Single bokeh disc material — replaces blurMatH + blurMatV
const bokehMat = new THREE.ShaderMaterial({
    uniforms: {
        tDiffuse:        { value: null },
        uResolution:     { value: new THREE.Vector2(W, H) },
        uBokehRadius:    { value: 35.0 },
        uTintColor:      { value: new THREE.Color(1, 1, 1) },
        uTintStrength:   { value: 0.0 },
        uGlowIntensity: { value: PRESETS.turrell.glowIntensity },
    },
    vertexShader:   BLUR_VERT,
    fragmentShader: BOKEH_FRAG,
    depthTest:  false,
    depthWrite: false,
});

// Fullscreen quad used for blur passes (orthographic, NDC-space)
const _fsQuadGeo = new THREE.PlaneGeometry(2, 2);
const _fsQuadScene = new THREE.Scene();
const _fsQuadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const _fsQuadMesh = new THREE.Mesh(_fsQuadGeo, bokehMat);
_fsQuadScene.add(_fsQuadMesh);

/**
 * Render `captureGroup` in isolation to an offscreen target, apply a single-pass
 * bokeh disc blur, and return blurTargetB whose texture holds the blurred result.
 * Caller must not dispose blurTargetB — it is reused each prayer transition.
 */
function renderGroupBlurred(captureGroup) {
    // 1. Isolate the group — hide everything else in the scene temporarily.
    const prevBg = scene.background;
    scene.background = null;

    liveGroup.visible = false;
    atenReignQuad.visible = false;  // hide Aten Reign bg during capture
    if (blurredLayer) blurredLayer.mesh.visible = false;

    // Render captureGroup to blurTargetA
    // Transparent background — traces captured in isolation, then blurred as atmospheric wash
    const night = isNightTime();
    const prevClearAlpha = renderer.getClearAlpha();
    renderer.getClearColor(_blurPrevClearColor);
    renderer.setClearColor(0x000000, 0);
    renderer.setRenderTarget(blurTargetA);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.setClearColor(_blurPrevClearColor, prevClearAlpha);

    // Restore visibility
    liveGroup.visible = true;
    atenReignQuad.visible = true;
    if (blurredLayer) blurredLayer.mesh.visible = true;
    scene.background = prevBg;

    // 2. Multi-pass atmospheric blur — ping-pong A↔B
    //    Each pass compounds, dissolving geometry into pure light.
    //    Turrell's light has no edges. 4 passes at increasing radii
    //    completely melt any line structure into a soft color field.
    const palette = artwork ? artwork.palette : PRAYER_PALETTES.isha;
    // Tint toward a luminous version of the prayer color — between bg and trace lightness
    _blurTintColor.setHSL(palette.h / 360, (palette.s * 0.5) / 100, Math.min(0.85, (palette.l + 15) / 100));

    bokehMat.uniforms.uResolution.value.set(W, H);
    bokehMat.uniforms.uTintColor.value.copy(_blurTintColor);
    _fsQuadMesh.material = bokehMat;

    // Turrell atmospheric dissolution — configurable via PRESETS.turrell
    const T = PRESETS.turrell;
    const baseRadii = [30, 45, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240];
    const baseTint  = [0.05, 0.08, 0.12, 0.18, 0.25, 0.32, 0.38, 0.44, 0.48, 0.52, 0.55, night ? 0.6 : 0.4];
    const numPasses = Math.max(1, Math.min(12, Math.round(T.blurPasses)));
    let src = blurTargetA;
    let dst = blurTargetB;

    for (let p = 0; p < numPasses; p++) {
        bokehMat.uniforms.tDiffuse.value = src.texture;
        bokehMat.uniforms.uBokehRadius.value = baseRadii[p] * T.blurScale;
        // Only apply tint and glow on the LAST pass — compounding across passes causes nuclear white-out
        const isLastPass = (p === numPasses - 1);
        bokehMat.uniforms.uTintStrength.value = isLastPass ? baseTint[p] * T.tintStrength : 0.0;
        bokehMat.uniforms.uGlowIntensity.value = isLastPass ? T.glowIntensity : 0.0;

        renderer.setRenderTarget(dst);
        renderer.clear();
        renderer.render(_fsQuadScene, _fsQuadCam);
        renderer.setRenderTarget(null);

        // Ping-pong
        const tmp = src; src = dst; dst = tmp;
    }

    // After even number of passes, result is in blurTargetA; odd → blurTargetB
    // 8 passes (even) → result in src which is blurTargetA after last swap
    // Return whichever holds the final result
    return src;
}

// ═══════════════════════════════════════════════════════════════
// BLURRED LAYER — tracks a single previous-prayer blurred quad
// ═══════════════════════════════════════════════════════════════

// blurredLayer: { mesh, opacity, fadeTarget } | null
let blurredLayer = null;

function disposeBlurredLayer() {
    if (!blurredLayer) return;
    scene.remove(blurredLayer.mesh);
    blurredLayer.mesh.geometry.dispose();
    blurredLayer.mesh.material.dispose();
    // Note: the texture lives in blurTargetA — do NOT dispose the render target here
    blurredLayer = null;
}

// Pre-allocated Color objects for renderGroupBlurred — avoids per-frame allocation
const _blurPrevClearColor = new THREE.Color();
const _blurTintColor = new THREE.Color();

// ═══════════════════════════════════════════════════════════════
// ATEN REIGN BACKGROUND — concentric rings of luminous color
// ═══════════════════════════════════════════════════════════════
// Inspired by James Turrell's "Aten Reign" (Guggenheim, 2013).
// Concentric ellipses of luminous color breathe independently,
// creating depth through color alone — you look INTO light.
// Center: near-white aperture. Edges: richer, deeper prayer color.
// Each ring shifts hue slightly for the multi-chromatic field effect.

const ATEN_REIGN_FRAG = `
    uniform vec3 uRing0;
    uniform vec3 uRing1;
    uniform vec3 uRing2;
    uniform vec3 uRing3;
    uniform vec3 uRing4;
    uniform vec3 uRing5;
    uniform vec3 uRing6;
    uniform float uTime;
    uniform float uAspect;
    uniform vec2 uTilt;           // gyroscope parallax (Miraj portal depth)
    uniform float uTasbihPulse;   // dhikr breathing pulse (0..1)
    uniform float uQiblaBeam;     // 0 = off, 1 = compass mode on
    uniform float uQiblaAngle;    // beam direction in radians (0 = noon/top)
    uniform float uQiblaAlign;    // 0 = away, 1 = facing qibla
    uniform vec3  uQiblaColor;    // prayer-tinted beam color
    uniform vec3  uHandAngles;   // hr, min, sec angles (shader coords)
    uniform vec3  uHandLens;     // hr, min, sec beam lengths (UV dist)
    uniform float uHandVis;      // hand visibility (0-1)
    uniform vec3  uHandColor;    // prayer-tinted hand color
    varying vec2 vUv;
    void main() {
        vec2 uv = (vUv - 0.5) * 2.0;
        // Correct for non-square viewport — keeps rings circular
        uv *= vec2(max(uAspect, 1.0), max(1.0 / uAspect, 1.0));

        // ── Miraj portal depth (gyroscope parallax) ──
        // Outer rings shift more on tilt — looking through layers of sacred space.
        // Quadratic scaling: the 7th heaven feels farther than the 1st.
        float rawDist = length(uv);
        vec2 parallax = uTilt * rawDist * rawDist * 0.18;
        uv += parallax;
        float dist = length(uv);

        // ── Glass is now a real 3D mesh — shader just renders rings + beams ──

        // Each ring breathes at glacier pace — Turrell's shifts are IMPERCEPTIBLE.
        float b0 = sin(uTime * 0.14) * 0.015;
        float b1 = sin(uTime * 0.11 + 0.9) * 0.018;
        float b2 = sin(uTime * 0.09 + 1.8) * 0.020;
        float b3 = sin(uTime * 0.07 + 2.7) * 0.022;
        float b4 = sin(uTime * 0.06 + 3.6) * 0.025;
        float b5 = sin(uTime * 0.04 + 4.5) * 0.028;
        float b6 = sin(uTime * 0.03 + 5.4) * 0.030;

        vec3 r0 = uRing0 + b0;
        vec3 r1 = uRing1 + b1;
        vec3 r2 = uRing2 + b2;
        vec3 r3 = uRing3 + b3;
        vec3 r4 = uRing4 + b4;
        vec3 r5 = uRing5 + b5;
        vec3 r6 = uRing6 + b6;

        // ── Seven Heavens (سبع سماوات) — sacred proportion ring widths ──
        // "He created seven heavens in layers" — Quran 67:3
        // Ring widths follow φ^⅓ (≈1.175) growth.
        // CHROMATIC SAMPLING: inside the prism, R/G/B sample at different radii
        // creating visible spectral splitting — the glass refracts the rings.

        // Green channel (main) — standard ring sampling
        // r0 ring boundary pushed outward so it forms a VISIBLE saturated
        // band around the prism (dist 0.095–0.16) before transitioning to r1.
        // This is the Turrell key: the innermost ring is the richest color.
        vec3 color = r0;
        color = mix(color, r1, smoothstep(0.16, 0.24, dist));
        color = mix(color, r2, smoothstep(0.25, 0.35, dist));
        color = mix(color, r3, smoothstep(0.36, 0.46, dist));
        color = mix(color, r4, smoothstep(0.47, 0.58, dist));
        color = mix(color, r5, smoothstep(0.59, 0.74, dist));
        color = mix(color, r6, smoothstep(0.76, 0.96, dist));

        // Chromatic ring splitting is handled by the 3D glass cube's IOR refraction

        // ── Ayat an-Nur (24:35) — "Light upon light" (نور على نور) ──
        // Nur manifests through the ring colors themselves, not white wash.
        // The innermost ring carries the warmth of the lamp (misbah).

        // Glass body, edges, and caustics handled by 3D MeshPhysicalMaterial cube

        // ── Turrell luminance lift at ring boundaries ──
        // Bright seams between color bands — light bleeding between Skyspace panels.
        // Positions follow sacred proportion boundaries.
        float w = 12.0;
        // Skip innermost boundary — let the r0 ring color speak for itself
        float edge12 = exp(-pow((dist - 0.245) * w, 2.0));
        float edge23 = exp(-pow((dist - 0.355) * w, 2.0));
        float edge34 = exp(-pow((dist - 0.465) * w, 2.0));
        float edge45 = exp(-pow((dist - 0.585) * w, 2.0));
        float edge56 = exp(-pow((dist - 0.750) * w, 2.0));
        float liftMask = (edge12 + edge23 + edge34 + edge45 + edge56);
        float localLum = dot(color, vec3(0.299, 0.587, 0.114));
        float lift = liftMask * (0.04 + localLum * 0.06);
        color += lift;

        // ── Tasbih dhikr pulse ──
        // 33× SubhanAllah, 33× Alhamdulillah, 34× Allahu Akbar
        // Subtle deepening of all rings — the sacred rhythm of remembrance
        color = mix(color, color * 0.85, uTasbihPulse * 0.25);

        // ── Qibla Beam of Light + Prism (Compass Mode) ──
        // Light travels INWARD from the edge toward the Kaaba — the sacred
        // direction calling the worshipper. When aligned with qibla, the
        // Kaaba refracts the beam outward into a prismatic cone:
        // "the glass as if it were a pearly white star" — Quran 24:35
        if (uQiblaBeam > 0.01) {
            float angle = atan(uv.x, uv.y);
            float aDiff = angle - uQiblaAngle;
            aDiff = aDiff - 6.28318 * floor((aDiff + 3.14159) / 6.28318);

            // ── INCOMING BEAM — travels from edge TOWARD Kaaba ──
            // Visible ~8° arc, brightens as it converges on the sacred center.
            float bw = 40.0;
            float inBeam = exp(-aDiff * aDiff * bw);
            // Radial: visible from outer edge, peaks approaching Kaaba
            float inMask = smoothstep(1.15, 0.30, dist) * smoothstep(0.04, 0.18, dist);
            // Convergent sparkle — light particles streaming inward
            float sparkle = sin(dist * 35.0 - uTime * 3.5) * 0.5 + 0.5;
            sparkle = sparkle * sparkle * 0.2 + 0.8;
            color += uQiblaColor * inBeam * inMask * uQiblaBeam * 0.35 * sparkle;

            // ── PRISM — Kaaba refracts light outward on alignment ──
            // The incoming beam strikes the Kaaba and splits into a spectral
            // fan on the opposite side — "the glass as if it were a pearly
            // white star" refracting light through the 7 heavens.
            if (uQiblaAlign > 0.25) {
                float pStr = smoothstep(0.25, 0.85, uQiblaAlign) * uQiblaBeam;

                // Prism rays emerge OPPOSITE to the incoming beam
                float outAngle = uQiblaAngle + 3.14159;
                float oDiff = angle - outAngle;
                oDiff = oDiff - 6.28318 * floor((oDiff + 3.14159) / 6.28318);

                // Wide fan for visible spectral separation
                float fan = 0.18 * pStr;
                // Outward mask — emanates from center, extends to edge
                float outMask = smoothstep(0.06, 0.22, dist) * (1.0 - smoothstep(0.82, 1.12, dist));

                // 7 spectral rays — one for each heaven, warm to cool
                float pw = bw * 0.7;  // wider rays for visible separation
                float r1 = exp(-(oDiff + fan * 3.0) * (oDiff + fan * 3.0) * pw) * outMask;
                float r2 = exp(-(oDiff + fan * 2.0) * (oDiff + fan * 2.0) * pw) * outMask;
                float r3 = exp(-(oDiff + fan * 1.0) * (oDiff + fan * 1.0) * pw) * outMask;
                float r4 = exp(-oDiff * oDiff * pw) * outMask;
                float r5 = exp(-(oDiff - fan * 1.0) * (oDiff - fan * 1.0) * pw) * outMask;
                float r6 = exp(-(oDiff - fan * 2.0) * (oDiff - fan * 2.0) * pw) * outMask;
                float r7 = exp(-(oDiff - fan * 3.0) * (oDiff - fan * 3.0) * pw) * outMask;

                // Warm (deep red) → pure (prayer color) → cool (deep violet)
                float pI = pStr * 0.20;
                color += vec3(1.35, 0.60, 0.40) * r1 * pI;  // deep red
                color += vec3(1.25, 0.85, 0.50) * r2 * pI;  // amber-orange
                color += vec3(1.10, 1.05, 0.70) * r3 * pI;  // golden white
                color += uQiblaColor * 1.3      * r4 * pI;   // prayer color
                color += vec3(0.70, 1.00, 1.20) * r5 * pI;  // aqua
                color += vec3(0.50, 0.80, 1.35) * r6 * pI;  // cerulean
                color += vec3(0.45, 0.55, 1.40) * r7 * pI;  // deep violet

                // Gentle center warmth — Kaaba glows softly, not nuclear
                float coreGlow = exp(-dist * dist * 12.0) * pStr * 0.06;
                color += uQiblaColor * coreGlow;
            }

            // ── Ring response — heavens brighten toward qibla ──
            float dirBias = max(0.0, cos(aDiff));
            color += dirBias * uQiblaAlign * uQiblaBeam * 0.09;
        }

        // ── LIGHT BEAMS — refracted through the 3D glass cube at center ──
        // Beams start from the center and radiate outward. The 3D glass cube
        // (MeshPhysicalMaterial with transmission) refracts them naturally.
        if (uHandVis > 0.005) {
            float hAngle = atan(uv.x, uv.y);

            // Chromatic dispersion — increases with distance from center
            float dispersion = dist * 0.015;

            // Ring band boundaries
            float rb0 = 0.16;   float rb1 = 0.245;  float rb2 = 0.355;
            float rb3 = 0.465;  float rb4 = 0.585;  float rb5 = 0.750;

            // Band collision function: Gaussian flare at ring boundary
            float bandW = 18.0;
            // ── Hour beam — widest, deepest dispersion ──
            float adH = hAngle - uHandAngles.x;
            adH -= 6.28318 * floor((adH + 3.14159) / 6.28318);
            float adH_r = adH + dispersion;
            float adH_b = adH - dispersion;
            // Beams start from the center — the 3D glass cube refracts them
            float maskH = smoothstep(0.02, 0.06, dist) * smoothstep(uHandLens.x + 0.02, uHandLens.x - 0.02, dist);
            // Band collision — hour beam crosses rings 0-3, flares at each
            float hBand = exp(-pow((dist - rb0) * bandW, 2.0))
                        + exp(-pow((dist - rb1) * bandW, 2.0))
                        + exp(-pow((dist - rb2) * bandW, 2.0))
                        + exp(-pow((dist - rb3) * bandW, 2.0));
            float hBoost = 1.0 + hBand * 0.6;
            vec3 beamH;
            beamH.r = (exp(-adH_r * adH_r * 500.0) * 0.14 + exp(-adH_r * adH_r * 120.0) * 0.03) * hBoost;
            beamH.g = (exp(-adH   * adH   * 550.0) * 0.12 + exp(-adH   * adH   * 130.0) * 0.025) * hBoost;
            beamH.b = (exp(-adH_b * adH_b * 500.0) * 0.14 + exp(-adH_b * adH_b * 120.0) * 0.03) * hBoost;
            color += beamH * maskH * uHandVis;

            // ── Minute beam — tighter, crosses more rings ──
            float adM = hAngle - uHandAngles.y;
            adM -= 6.28318 * floor((adM + 3.14159) / 6.28318);
            float adM_r = adM + dispersion * 0.8;
            float adM_b = adM - dispersion * 0.8;
            float maskM = smoothstep(0.02, 0.06, dist) * smoothstep(uHandLens.y + 0.02, uHandLens.y - 0.02, dist);
            float mBand = exp(-pow((dist - rb0) * bandW, 2.0))
                        + exp(-pow((dist - rb1) * bandW, 2.0))
                        + exp(-pow((dist - rb2) * bandW, 2.0))
                        + exp(-pow((dist - rb3) * bandW, 2.0))
                        + exp(-pow((dist - rb4) * bandW, 2.0));
            float mBoost = 1.0 + mBand * 0.5;
            vec3 beamM;
            beamM.r = (exp(-adM_r * adM_r * 750.0) * 0.12 + exp(-adM_r * adM_r * 170.0) * 0.025) * mBoost;
            beamM.g = (exp(-adM   * adM   * 800.0) * 0.10 + exp(-adM   * adM   * 180.0) * 0.02) * mBoost;
            beamM.b = (exp(-adM_b * adM_b * 750.0) * 0.12 + exp(-adM_b * adM_b * 170.0) * 0.025) * mBoost;
            color += beamM * maskM * uHandVis;

            // ── Second beam — razor-thin, crosses all rings, sparkle ──
            float adS = hAngle - uHandAngles.z;
            adS -= 6.28318 * floor((adS + 3.14159) / 6.28318);
            float adS_r = adS + dispersion;
            float adS_b = adS - dispersion;
            float maskS = smoothstep(0.02, 0.06, dist) * smoothstep(uHandLens.z + 0.02, uHandLens.z - 0.02, dist);
            float hSparkle = sin(dist * 45.0 + uTime * 5.0) * 0.5 + 0.5;
            hSparkle = hSparkle * 0.2 + 0.8;
            float sBand = exp(-pow((dist - rb0) * bandW, 2.0))
                        + exp(-pow((dist - rb1) * bandW, 2.0))
                        + exp(-pow((dist - rb2) * bandW, 2.0))
                        + exp(-pow((dist - rb3) * bandW, 2.0))
                        + exp(-pow((dist - rb4) * bandW, 2.0))
                        + exp(-pow((dist - rb5) * bandW, 2.0));
            float sBoost = 1.0 + sBand * 0.4;
            vec3 beamS;
            beamS.r = (exp(-adS_r * adS_r * 1200.0) * 0.10 + exp(-adS_r * adS_r * 260.0) * 0.02) * sBoost;
            beamS.g = (exp(-adS   * adS   * 1300.0) * 0.08 + exp(-adS   * adS   * 280.0) * 0.015) * sBoost;
            beamS.b = (exp(-adS_b * adS_b * 1200.0) * 0.10 + exp(-adS_b * adS_b * 260.0) * 0.02) * sBoost;
            color += beamS * maskS * uHandVis * hSparkle;

            // ── Ring illumination — bands brighten where beams cross them ──
            float beamHit = exp(-adH * adH * 60.0) * maskH
                          + exp(-adM * adM * 80.0) * maskM
                          + exp(-adS * adS * 100.0) * maskS;
            float ringResponse = (exp(-pow((dist - rb0) * 12.0, 2.0))
                               +  exp(-pow((dist - rb1) * 12.0, 2.0))
                               +  exp(-pow((dist - rb2) * 12.0, 2.0))
                               +  exp(-pow((dist - rb3) * 12.0, 2.0))
                               +  exp(-pow((dist - rb4) * 12.0, 2.0))
                               +  exp(-pow((dist - rb5) * 12.0, 2.0)));
            color += beamHit * ringResponse * 0.03 * uHandVis;
        }

        gl_FragColor = vec4(color, 1.0);
    }
`;

const atenReignMat = new THREE.ShaderMaterial({
    uniforms: {
        uRing0: { value: new THREE.Color(0.88, 0.52, 0.28) },
        uRing1: { value: new THREE.Color(0.85, 0.70, 0.58) },
        uRing2: { value: new THREE.Color(0.88, 0.80, 0.76) },
        uRing3: { value: new THREE.Color(0.85, 0.80, 0.84) },
        uRing4: { value: new THREE.Color(0.75, 0.72, 0.80) },
        uRing5: { value: new THREE.Color(0.68, 0.64, 0.74) },
        uRing6: { value: new THREE.Color(0.60, 0.56, 0.68) },
        uTime:  { value: 0.0 },
        uAspect: { value: W / H },
        uTilt: { value: new THREE.Vector2(0, 0) },
        uTasbihPulse: { value: 0.0 },
        uQiblaBeam:  { value: 0.0 },
        uQiblaAngle: { value: 0.0 },
        uQiblaAlign: { value: 0.0 },
        uQiblaColor: { value: new THREE.Color(0.95, 0.92, 0.88) },
        uHandAngles: { value: new THREE.Vector3(0, 0, 0) },
        uHandLens:   { value: new THREE.Vector3(0.383, 0.575, 0.719) },
        uHandVis:    { value: 1.0 },
        uHandColor:  { value: new THREE.Color(0.95, 0.93, 0.90) },
    },
    vertexShader: BLUR_VERT,  // reuse the pass-through vertex shader
    fragmentShader: ATEN_REIGN_FRAG,
    depthTest: false,
    depthWrite: false,
});

// Fullscreen quad covering the camera frustum — slightly oversized for safety
const _atenAspect = W / H;
const _atenW = frustum * (_atenAspect >= 1 ? _atenAspect : 1) * 2.4;
const _atenH = frustum * (_atenAspect >= 1 ? 1 : 1 / _atenAspect) * 2.4;
const atenReignQuad = new THREE.Mesh(
    new THREE.PlaneGeometry(_atenW, _atenH),
    atenReignMat
);
atenReignQuad.position.set(0, 0, -0.5);
atenReignQuad.renderOrder = -10;
scene.add(atenReignQuad);

// ═══════════════════════════════════════════════════════════════
// 3D GLASS KAABA CUBE — real MeshPhysicalMaterial with transmission
// "the glass as if it were a pearly white star" — Quran 24:35
// The cube refracts the Turrell rings and light beams behind it,
// making the beams appear to originate from within the glass.
// ═══════════════════════════════════════════════════════════════

// Scene lights — minimal, just enough for glass Fresnel and edge highlights
// Heavy lighting makes the glass look solid; we want transmission to dominate
const _glassAmbient = new THREE.AmbientLight(0xffffff, 0.15);
scene.add(_glassAmbient);
const _glassKey = new THREE.DirectionalLight(0xfff8f0, 0.3);
_glassKey.position.set(0, 3, 5);  // top-front — catches top face edge
scene.add(_glassKey);

// Cube size — matches the shader prism diamond footprint
// Shader diamond: manhattan dist 0.095 in UV ≈ 0.19 WU half-diagonal
// For isometric cube rotated 45°, side ≈ 0.27 WU
const _glassCubeSide = 0.32;
const _glassCubeGeo = new THREE.BoxGeometry(_glassCubeSide, _glassCubeSide, _glassCubeSide);
const _glassCubeMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,           // neutral — transmission shows what's behind
    metalness: 0,
    roughness: 0.0,            // perfect crystal — no surface diffusion
    transmission: 1.0,         // fully transmissive
    thickness: 1.2,            // more refraction depth — visible distortion
    ior: 1.7,                  // high IOR — more visible refraction + stronger Fresnel edges
    transparent: true,
    side: THREE.DoubleSide,    // see through all faces
    envMapIntensity: 0.2,
    specularIntensity: 1.5,    // strong Fresnel at edges — the key to looking like glass
    specularColor: new THREE.Color(0xffffff),
});
const glassCube = new THREE.Mesh(_glassCubeGeo, _glassCubeMat);
// Isometric 3/4 view: top vertex points up, right and top faces visible
// Classic isometric: rotate Y by 45°, then X by atan(1/√2) ≈ 35.264°
glassCube.rotation.set(
    Math.atan(1 / Math.SQRT2),  // ~35.264° — tilt to show top face
    Math.PI / 4,                 // 45° — show right face
    0
);
glassCube.position.set(0, 0, 0.1);  // in front of ring quad, behind overlays
glassCube.renderOrder = 0;
scene.add(glassCube);

// Pre-allocated Color for ring computation
const _ringColor = new THREE.Color();

// Groups
let traceGroup = new THREE.Group();
const liveGroup = new THREE.Group();
scene.add(traceGroup);
scene.add(liveGroup);

// (Dev GUI removed for production)

// ═══════════════════════════════════════════════════════════════
// TRACE GEOMETRY — pre-computed orbital positions
// ═══════════════════════════════════════════════════════════════

let traceObjects = []; // { rosetteLine, connectSegments, pair, totalVerts }
let traceLayers = [];  // kept for compatibility but capped at 0 entries now (blurring replaces them)

function disposeTraceLayer(layer) {
    for (const obj of layer.traceObjects) {
        obj.rosetteLine.geometry.dispose();
        obj.rosetteLine.material.dispose();
        obj.connectSegments.geometry.dispose();
        obj.connectSegments.material.dispose();
    }
    scene.remove(layer.group);
}

function disposeAllTraceLayers() {
    for (const layer of traceLayers) disposeTraceLayer(layer);
    traceLayers = [];
    disposeBlurredLayer();
}

function orbiterXY(pair, t, rad) {
    const a1 = -pair.speed1 * t + pair.offset;
    const a2 = -pair.speed2 * t + pair.offset;
    return {
        x1: Math.cos(a1) * pair.r1 * rad,
        y1: Math.sin(a1) * pair.r1 * rad,
        x2: Math.cos(a2) * pair.r2 * rad,
        y2: Math.sin(a2) * pair.r2 * rad,
    };
}

function buildTraceGeometry(artwork) {
    // Dispose previous GPU resources before clearing
    for (const child of traceGroup.children) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
    }
    traceGroup.clear();
    traceObjects = [];

    const night = isNightTime();
    const stepsPerRev = 240;
    const totalSteps = artwork.totalRevolutions * stepsPerRev;

    for (let pi = 0; pi < artwork.pairs.length; pi++) {
        const pair = artwork.pairs[pi];
        const d = pair.depth !== undefined ? pair.depth : 0.5;
        const depthScale = 1.0 - d * PRESETS.shared.depthFactor;
        const avgR = (pair.r1 + pair.r2) / 2;
        const radiusScale = Math.pow(avgR, PRESETS.shared.radiusPower) * 4.0;

        // --- Colors (Turrell Ganzfeld mode) ---
        // Traces are ghostly — barely visible structure within the luminous color field.
        // The blur layer does the heavy lifting; traces just seed the atmosphere.
        const preset = night ? PRESETS.night : PRESETS.day;
        const traceL = Math.min(96, pair.l + 18);
        const traceS = Math.max(8, pair.s - 15);
        const baseAlpha = Math.min(pair.alpha * preset.alphaMul, preset.alphaMax);
        const traceAlpha = baseAlpha * depthScale * radiusScale * 0.45; // ghostly but perceivable — structure within the light field

        const color = hslToColor(pair.h, traceS, traceL);

        // --- Midpoint rosette trace with VELOCITY + CENTER-DISTANCE vertex colors ---
        // Dense areas (slow-moving cusps) get dimmer; sparse areas stay bright
        const rosettePositions = new Float32Array(totalSteps * 3);
        const rosetteColors = new Float32Array(totalSteps * 3);

        // First pass: compute positions with third-arm + positional noise
        const noiseRng = seededRandom(artwork.seed + pi * 7919);
        const noiseSigma = PRESETS.shared.noiseSigma * radius;
        const velocities = new Float32Array(totalSteps);
        for (let step = 0; step < totalSteps; step++) {
            const t = (step / totalSteps) * artwork.totalRevolutions * TWO_PI;
            const { x1, y1, x2, y2 } = orbiterXY(pair, t, radius);
            let mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
            // Third arm: extra harmonic enriches the rosette
            if (pair.r3 > 0) {
                const a3 = -pair.speed3 * t + pair.offset;
                mx += Math.cos(a3) * pair.r3 * radius;
                my += Math.sin(a3) * pair.r3 * radius;
            }
            // Positional noise: photographic softness (Box-Muller Gaussian)
            // Clamp u1 to (0,1) exclusive — avoids NaN from log(0) or sqrt(negative)
            const u1 = Math.max(1e-6, Math.min(noiseRng(), 1 - 1e-6));
            const u2 = noiseRng();
            const gMag = noiseSigma * Math.sqrt(-2 * Math.log(u1));
            mx += gMag * Math.cos(TWO_PI * u2);
            my += gMag * Math.sin(TWO_PI * u2);
            rosettePositions[step * 3] = mx;
            rosettePositions[step * 3 + 1] = my;
            rosettePositions[step * 3 + 2] = 0;

            if (step > 0) {
                const dx = mx - rosettePositions[(step - 1) * 3];
                const dy = my - rosettePositions[(step - 1) * 3 + 1];
                velocities[step] = Math.sqrt(dx * dx + dy * dy);
            }
        }
        velocities[0] = velocities[1]; // copy first

        // Approximate median velocity via sampling (avoids sorting full array)
        const sampleCount = Math.ceil(totalSteps / 10);
        const sampled = new Float32Array(sampleCount);
        for (let i = 0; i < sampleCount; i++) sampled[i] = velocities[i * 10];
        sampled.sort();
        const medianV = sampled[Math.floor(sampleCount * 0.5)];

        // Second pass: vertex colors = velocity × center-distance × hue jitter × path gradient
        const maxR = radius;
        const stepColor = new THREE.Color();
        for (let step = 0; step < totalSteps; step++) {
            // Velocity-based: equalizes dense (slow) vs sparse (fast) regions
            const vRatio = medianV > 0 ? velocities[step] / medianV : 1;
            const velBrightness = Math.min(Math.sqrt(vRatio), PRESETS.shared.velCap);

            const hueJitter = (noiseRng() - 0.5) * PRESETS.shared.hueJitter;
            const pathGradient = ((step / totalSteps) - 0.5) * PRESETS.shared.pathGradient;
            const jH = ((pair.h + hueJitter + pathGradient) % 360 + 360) % 360;
            stepColor.setHSL(jH / 360, traceS / 100, traceL / 100);

            // Center-distance: U-shape bright at center + edges, dim in mid-range
            const px = rosettePositions[step * 3];
            const py = rosettePositions[step * 3 + 1];
            const dist = Math.sqrt(px * px + py * py);
            const distRatio = Math.min(dist / maxR, 1.0);
            const midDip = 4.0 * distRatio * (1.0 - distRatio);
            const distBrightness = 1.0 - midDip * PRESETS.shared.midDipStrength;

            const brightness = velBrightness * distBrightness;
            rosetteColors[step * 3]     = stepColor.r * brightness;
            rosetteColors[step * 3 + 1] = stepColor.g * brightness;
            rosetteColors[step * 3 + 2] = stepColor.b * brightness;
        }

        const rosetteGeo = new THREE.BufferGeometry();
        rosetteGeo.setAttribute('position', new THREE.BufferAttribute(rosettePositions, 3));
        rosetteGeo.setAttribute('color', new THREE.Float32BufferAttribute(rosetteColors, 3));
        rosetteGeo.setDrawRange(0, 0);

        const rosetteMat = new THREE.LineBasicMaterial({
            transparent: true,
            opacity: traceAlpha,
            blending: THREE.NormalBlending,  // always normal — traces seen through light
            vertexColors: true,
            depthTest: false,
        });
        const rosetteLine = new THREE.Line(rosetteGeo, rosetteMat);
        traceGroup.add(rosetteLine);

        // --- Connecting lines (every Nth step) ---
        const connectStep = 6;
        const connectCount = Math.floor(totalSteps / connectStep);
        const connectPositions = new Float32Array(connectCount * 6); // 2 verts per segment
        for (let i = 0; i < connectCount; i++) {
            const step = i * connectStep;
            const t = (step / totalSteps) * artwork.totalRevolutions * TWO_PI;
            const { x1, y1, x2, y2 } = orbiterXY(pair, t, radius);
            connectPositions[i * 6] = x1;
            connectPositions[i * 6 + 1] = y1;
            connectPositions[i * 6 + 2] = 0;
            connectPositions[i * 6 + 3] = x2;
            connectPositions[i * 6 + 4] = y2;
            connectPositions[i * 6 + 5] = 0;
        }

        const connectGeo = new THREE.BufferGeometry();
        connectGeo.setAttribute('position', new THREE.BufferAttribute(connectPositions, 3));
        connectGeo.setDrawRange(0, 0);

        const connAlpha = Math.min(pair.alpha * 1.2, PRESETS.shared.connAlphaMul) * depthScale;
        const connectMat = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: connAlpha,
            blending: THREE.NormalBlending,
            depthTest: false,
        });
        const connectSegments = new THREE.LineSegments(connectGeo, connectMat);
        traceGroup.add(connectSegments);

        traceObjects.push({
            rosetteLine, connectSegments, pair,
            totalRosetteVerts: totalSteps,
            totalConnectVerts: connectCount * 2,
            connectStep,
        });
    }
}

function updateTraceDrawRange(progress) {
    for (const obj of traceObjects) {
        const rosetteCount = Math.floor(progress * obj.totalRosetteVerts);
        obj.rosetteLine.geometry.setDrawRange(0, rosetteCount);

        const connectCount = Math.floor(progress * obj.totalConnectVerts);
        // Must be even for LineSegments
        obj.connectSegments.geometry.setDrawRange(0, connectCount - (connectCount % 2));
    }
}

// ═══════════════════════════════════════════════════════════════
// LIVE ELEMENTS — pre-allocated orbiter dots, connecting lines, clock hands
// ═══════════════════════════════════════════════════════════════

// Reusable sprite texture for dots
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

// Hard-core lume texture — bright solid center, tight falloff (SuperLuminova pip)
function createLumeTexture(size) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const center = size / 2;
    const grad = ctx.createRadialGradient(center, center, 0, center, center, center);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.5, 'rgba(255,255,255,1)');
    grad.addColorStop(0.75, 'rgba(255,255,255,0.5)');
    grad.addColorStop(0.9, 'rgba(255,255,255,0.15)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
}
const lumeTexture = createLumeTexture(64);

// --- Pre-allocate all live elements ONCE ---
const MAX_PAIRS = 10;
const MAX_DOTS = MAX_PAIRS * 3; // inner + outer + midpoint per pair

// Orbiter dots (single Points object with pre-sized buffers)
const liveDotPosArray = new Float32Array(MAX_DOTS * 3);
const liveDotColorArray = new Float32Array(MAX_DOTS * 3);
const liveDotGeo = new THREE.BufferGeometry();
liveDotGeo.setAttribute('position', new THREE.BufferAttribute(liveDotPosArray, 3));
liveDotGeo.setAttribute('color', new THREE.BufferAttribute(liveDotColorArray, 3));
liveDotGeo.setDrawRange(0, 0);
const liveDotMat = new THREE.PointsMaterial({
    size: 5,
    map: dotTexture,
    transparent: true,
    opacity: 0.5,
    blending: THREE.NormalBlending,
    vertexColors: true,
    depthTest: false,
    sizeAttenuation: false,
});
const liveDots = new THREE.Points(liveDotGeo, liveDotMat);
liveGroup.add(liveDots);

// Connecting lines (one Line per pair, pre-allocated)
const liveConnLines = [];
for (let i = 0; i < MAX_PAIRS; i++) {
    const posArr = new Float32Array(6); // 2 verts × 3
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    const mat = new THREE.LineBasicMaterial({
        color: 0x444444,
        transparent: true,
        opacity: 0.12,
        blending: THREE.NormalBlending,
        depthTest: false,
    });
    const line = new THREE.Line(geo, mat);
    line.visible = false;
    liveGroup.add(line);
    liveConnLines.push({ line, posArr, geo, mat });
}

// Clock hand lines (hr, min, sec)
const handDefs = [
    { alpha: 0.85 }, // hour
    { alpha: 0.75 }, // minute
    { alpha: 0.65 }, // second
];
const liveHands = handDefs.map(def => {
    const posArr = new Float32Array(6); // 2 verts × 3 (origin + tip)
    posArr[2] = 0.01; posArr[5] = 0.01; // z = 0.01
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    const mat = new THREE.LineBasicMaterial({
        color: 0x333333,
        transparent: true,
        opacity: def.alpha,
        blending: THREE.NormalBlending,
        depthTest: false,
    });
    const line = new THREE.Line(geo, mat);
    liveGroup.add(line);
    return { line, posArr, geo, mat };
});

// Seconds comet trail (8 segments = 16 verts)
const TRAIL_STEPS = 8;
const trailPosArr = new Float32Array(TRAIL_STEPS * 6);
const trailColorArr = new Float32Array(TRAIL_STEPS * 6);
// Pre-compute fade colors (static)
for (let i = 0; i < TRAIL_STEPS; i++) {
    const fade = 1 - (i + 1) / TRAIL_STEPS;
    trailColorArr[i * 6]     = fade; trailColorArr[i * 6 + 1] = fade; trailColorArr[i * 6 + 2] = fade;
    trailColorArr[i * 6 + 3] = fade; trailColorArr[i * 6 + 4] = fade; trailColorArr[i * 6 + 5] = fade;
}
const trailGeo = new THREE.BufferGeometry();
trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPosArr, 3));
trailGeo.setAttribute('color', new THREE.BufferAttribute(trailColorArr, 3));
const trailMat = new THREE.LineBasicMaterial({
    transparent: true, opacity: 0.18,
    blending: THREE.NormalBlending, vertexColors: true, depthTest: false,
});
const trailLine = new THREE.LineSegments(trailGeo, trailMat);
trailLine.visible = false;
liveGroup.add(trailLine);

// Clock dots (hr, min, sec, center) — each a single-point Points object
function makeClockDot(size, opacity, z) {
    const posArr = new Float32Array([0, 0, z]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    const mat = new THREE.PointsMaterial({
        size, map: dotTexture, transparent: true, opacity,
        blending: THREE.NormalBlending, depthTest: false, sizeAttenuation: false,
        color: 0x333333,
    });
    const points = new THREE.Points(geo, mat);
    liveGroup.add(points);
    return { points, posArr, geo, mat };
}

const hrDot = makeClockDot(20, 1.0, 0.02);
const minDot = makeClockDot(14, 1.0, 0.02);
const secDot = makeClockDot(7, 1.0, 0.02);
const centerDot = makeClockDot(4, 0.3, 0.03);

// ═══════════════════════════════════════════════════════════════
// EPICYCLE HOUR NUMERAL — pre-allocated visuals + DFT coefficients
// ═══════════════════════════════════════════════════════════════

const EPICYCLE_SAMPLE_COUNT = 1500;
const EPICYCLE_TRAIL_MAX = 2000;
const EPICYCLE_CIRCLE_POOL = 30;
const EPICYCLE_CYCLE = 60 / 7;  // ~8.571 seconds per circuit — 7 circuits = 60 seconds exactly (synced with second hand)
const EPICYCLE_PAUSE = 2;   // seconds to hold the completed drawing

// Pre-compute DFT coefficients for Kaaba geometric outline
const _kaaba_stitched = stitchContours(KAABA_CONTOURS);
const _kaaba_h = 100;
const _kaaba_gs = 0.455 / _kaaba_h;
const _kaaba_cx = 50, _kaaba_cy = 50; // center of bounding box (0 to 100)
const _kaaba_centered = _kaaba_stitched.map(p => ({
    x: (p.x - _kaaba_cx) * _kaaba_gs,
    y: -(p.y - _kaaba_cy) * _kaaba_gs,
}));
const _kaaba_sampled = resamplePath(_kaaba_centered, EPICYCLE_SAMPLE_COUNT);
const kaabaDFT = computeDFT(_kaaba_sampled);

// Unit circle geometry (shared ring for epicycle circles)
const epicycleCircleSegments = 64;
const epicycleUnitCircle = new Float32Array((epicycleCircleSegments + 1) * 3);
for (let i = 0; i <= epicycleCircleSegments; i++) {
    const a = (i / epicycleCircleSegments) * TWO_PI;
    epicycleUnitCircle[i * 3]     = Math.cos(a);
    epicycleUnitCircle[i * 3 + 1] = Math.sin(a);
    epicycleUnitCircle[i * 3 + 2] = 0;
}

// Epicycle circle pool (LineLoop objects)
const epicycleCircles = [];
for (let i = 0; i < EPICYCLE_CIRCLE_POOL; i++) {
    const posArr = new Float32Array((epicycleCircleSegments + 1) * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    const mat = new THREE.LineBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 0.06,
        blending: THREE.NormalBlending, depthTest: false,
    });
    const line = new THREE.LineLoop(geo, mat);
    line.visible = false;
    liveGroup.add(line);
    epicycleCircles.push({ line, posArr, geo, mat });
}

// Hand epicycle decorations — one circle + orbiting dot per hand
const handEpiCircles = []; // [hr, min, sec] — one circle each
const handEpiDots = [];    // orbiting dot per hand
const HAND_EPI_RADII = [0.14, 0.10, 0.065]; // hr, min, sec circle sizes — big enough for visible orbital motion
for (let h = 0; h < 3; h++) {
    // Circle
    const posArr = new Float32Array((epicycleCircleSegments + 1) * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    const mat = new THREE.LineBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 0.09,
        blending: THREE.NormalBlending, depthTest: false,
    });
    const line = new THREE.LineLoop(geo, mat);
    line.frustumCulled = false;
    liveGroup.add(line);
    handEpiCircles.push({ line, posArr, geo, mat });
    // Orbiting dot
    const dotPosArr = new Float32Array([0, 0, 0.02]);
    const dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute('position', new THREE.BufferAttribute(dotPosArr, 3));
    const dotMat = new THREE.PointsMaterial({
        size: [18, 14, 10][h], map: dotTexture, transparent: true, opacity: 1.0,
        blending: THREE.NormalBlending, depthTest: false, sizeAttenuation: false,
        color: 0xffffff,
    });
    const dotPts = new THREE.Points(dotGeo, dotMat);
    dotPts.frustumCulled = false;
    liveGroup.add(dotPts);
    handEpiDots.push({ points: dotPts, posArr: dotPosArr, geo: dotGeo, mat: dotMat });
}

// --- Glow texture (shared by Kaaba tip + hand glow sprites) ---
function createGlowTexture(size = 128) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const cx = size / 2;
    const grad = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
    grad.addColorStop(0, 'rgba(255,255,240,1)');
    grad.addColorStop(0.08, 'rgba(255,250,220,0.95)');
    grad.addColorStop(0.2, 'rgba(255,220,150,0.6)');
    grad.addColorStop(0.45, 'rgba(255,180,80,0.25)');
    grad.addColorStop(0.7, 'rgba(255,120,40,0.08)');
    grad.addColorStop(1, 'rgba(255,80,20,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
}
const glowTexture = createGlowTexture(128);

// Hand glow sprites — one per hand, half intensity of Kaaba tip glow
const handGlows = [];
for (let h = 0; h < 3; h++) {
    const gGeo = new THREE.BufferGeometry();
    const gPosArr = new Float32Array([0, 0, 0.025]);
    gGeo.setAttribute('position', new THREE.BufferAttribute(gPosArr, 3));
    const gMat = new THREE.PointsMaterial({
        size: [55, 42, 32][h],
        map: glowTexture,
        transparent: true,
        opacity: 0.0,   // hidden — glow is invisible on luminous bg
        blending: THREE.NormalBlending,
        depthTest: false,
        sizeAttenuation: false,
    });
    const gPts = new THREE.Points(gGeo, gMat);
    gPts.frustumCulled = false;
    liveGroup.add(gPts);
    handGlows.push({ points: gPts, posArr: gPosArr, geo: gGeo, mat: gMat });
}

// Epicycle arm line (radius chain)
const epicycleArmPositions = new Float32Array((EPICYCLE_NUM_COEFFS + 1) * 3);
const epicycleArmGeo = new THREE.BufferGeometry();
epicycleArmGeo.setAttribute('position', new THREE.BufferAttribute(epicycleArmPositions, 3));
epicycleArmGeo.setDrawRange(0, 0);
const epicycleArmMat = new THREE.LineBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0.06,
    blending: THREE.NormalBlending, depthTest: false,
});
const epicycleArmLine = new THREE.Line(epicycleArmGeo, epicycleArmMat);
liveGroup.add(epicycleArmLine);

// Epicycle trail line (calligraphy ink)
const epicycleTrailPositions = new Float32Array(EPICYCLE_TRAIL_MAX * 3);
const epicycleTrailColors = new Float32Array(EPICYCLE_TRAIL_MAX * 4);
const epicycleTrailGeo = new THREE.BufferGeometry();
epicycleTrailGeo.setAttribute('position', new THREE.BufferAttribute(epicycleTrailPositions, 3));
epicycleTrailGeo.setAttribute('color', new THREE.BufferAttribute(epicycleTrailColors, 4));
epicycleTrailGeo.setDrawRange(0, 0);
const epicycleTrailMat = new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true,
    blending: THREE.NormalBlending, depthTest: false,
});
const epicycleTrailLine = new THREE.Line(epicycleTrailGeo, epicycleTrailMat);
liveGroup.add(epicycleTrailLine);

// --- Kaaba glow halo layer (bright duplicate behind the main trail) ---
const kaabaGlowPositions = new Float32Array(EPICYCLE_TRAIL_MAX * 3);
const kaabaGlowGeo = new THREE.BufferGeometry();
kaabaGlowGeo.setAttribute('position', new THREE.BufferAttribute(kaabaGlowPositions, 3));
kaabaGlowGeo.setDrawRange(0, 0);
const kaabaGlowMat = new THREE.PointsMaterial({
    size: 8, sizeAttenuation: false,
    transparent: true, opacity: 0.3,
    blending: THREE.AdditiveBlending,  // additive — glow adds to the luminous center
    depthTest: false,
    map: glowTexture,
    color: 0xfff8f0,  // warm white
});
const kaabaGlowPoints = new THREE.Points(kaabaGlowGeo, kaabaGlowMat);
kaabaGlowPoints.position.z = -0.005; // sit just behind the main trail
liveGroup.add(kaabaGlowPoints);

// --- Solid black Kaaba fill (Kiswa) — the sacred dark anchor at the center of light ---
const kaabaHalfDiag = 50 * _kaaba_gs; // 0.2275 — half-diagonal of the diamond
const kaabaFillShape = new THREE.Shape();
kaabaFillShape.moveTo(0, kaabaHalfDiag);       // top
kaabaFillShape.lineTo(kaabaHalfDiag, 0);        // right
kaabaFillShape.lineTo(0, -kaabaHalfDiag);       // bottom
kaabaFillShape.lineTo(-kaabaHalfDiag, 0);       // left
kaabaFillShape.closePath();
const kaabaFillGeo = new THREE.ShapeGeometry(kaabaFillShape);
const kaabaFillMat = new THREE.MeshBasicMaterial({
    color: 0x0c0c18,        // dark crystal glass — deep with a hint of indigo
    transparent: true,
    opacity: 0.45,           // translucent — IOR distortion visible through the prism
    depthTest: false,
    side: THREE.DoubleSide,
});
const kaabaFillMesh = new THREE.Mesh(kaabaFillGeo, kaabaFillMat);
kaabaFillMesh.position.z = 0.005; // behind trail (0.01) but in front of glow (-0.005)
liveGroup.add(kaabaFillMesh);

// --- Pen tip hot glow ---
const tipGlowGeo = new THREE.BufferGeometry();
tipGlowGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0.02]), 3));
const tipGlowMat = new THREE.PointsMaterial({
    size: 48,
    map: glowTexture,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,  // additive — hot point of sacred light
    depthTest: false,
    sizeAttenuation: false,
});
const tipGlowPoint = new THREE.Points(tipGlowGeo, tipGlowMat);
liveGroup.add(tipGlowPoint);

// (tip glow trail removed)

// Epicycle animation state
let epicycleTime = 0;
let currentEpicycleHour = -1;
let epicyclePaused = false;
let epicyclePauseTimer = 0;
let epicycleTrailCount = 0;
let epicycleLastRealTime = 0;

// ═══════════════════════════════════════════════════════════════
// QIBLA COMPASS BEAM — lighthouse ray from Kaaba to edge of heavens
// ═══════════════════════════════════════════════════════════════
// In compass mode, a luminous beam emanates from the Kaaba and sweeps
// the Turrell field as the user rotates. When aligned with qibla,
// the beam hits the noon position and refracts into a prismatic cone.

let _compassMode = false;
let _qiblaRelAngle = 0;          // smoothed relative angle (radians)
let _qiblaAlignVal = 0;          // smoothed alignment (0-1)
let _qiblaFlareArmed = true;     // prevent rapid re-triggering
let _lastHapticTime = 0;
let _handVisibility = 1;          // lerps 0↔1 — hides clock hands in compass mode

function updateQiblaBeam() {
    if (!_compassMode) {
        // Fade out beam smoothly
        const u = atenReignMat.uniforms;
        u.uQiblaBeam.value += (0 - u.uQiblaBeam.value) * 0.08;
        if (u.uQiblaBeam.value < 0.005) u.uQiblaBeam.value = 0;
        return;
    }

    // Need compass heading
    if (deviceHeading === null) {
        atenReignMat.uniforms.uQiblaBeam.value = 0;
        return;
    }

    // Relative angle: qibla direction from phone's perspective
    // When facing qibla: relAngle ≈ 0 → beam points to noon (top)
    let relAngle = qiblaBearing - deviceHeading;
    // Wrap to [-PI, PI]
    relAngle = relAngle - TWO_PI * Math.floor((relAngle + Math.PI) / TWO_PI);

    // Smooth the angle to prevent jitter
    // Handle angle wrapping in smoothing
    let diff = relAngle - _qiblaRelAngle;
    if (diff > Math.PI) diff -= TWO_PI;
    if (diff < -Math.PI) diff += TWO_PI;
    _qiblaRelAngle += diff * 0.12;

    // Alignment: 1.0 when perfectly facing qibla, 0 when perpendicular
    const rawAlign = Math.max(0, Math.cos(_qiblaRelAngle));
    // Sharpen to only activate prism when very close (within ~15°)
    const sharpAlign = Math.pow(rawAlign, 6);
    _qiblaAlignVal += (sharpAlign - _qiblaAlignVal) * 0.08;

    // Drive shader uniforms
    const u = atenReignMat.uniforms;
    u.uQiblaBeam.value += (1.0 - u.uQiblaBeam.value) * 0.08; // fade in
    u.uQiblaAngle.value = _qiblaRelAngle;
    u.uQiblaAlign.value = _qiblaAlignVal;

    // Tint beam to current prayer color (luminous, high lightness)
    const palette = artwork ? artwork.palette : PRAYER_PALETTES.isha;
    _ringColor.setHSL(palette.h / 360, Math.min(palette.s / 100, 0.5), 0.92);
    u.uQiblaColor.value.copy(_ringColor);

    // ── Qibla flare + haptic on alignment ──
    if (_qiblaAlignVal > 0.85 && _qiblaFlareArmed) {
        // Trigger the existing tawaf flare system from the noon tip of Kaaba
        triggerTawafFlare(0, kaabaHalfDiag);
        _qiblaFlareArmed = false;

        // Haptic pulse — gentle confirmation vibration
        const now = performance.now();
        if (now - _lastHapticTime > 3000 && navigator.vibrate) {
            navigator.vibrate(80); // short, gentle pulse
            _lastHapticTime = now;
        }
    }

    // Re-arm flare when user rotates away
    if (_qiblaAlignVal < 0.3) {
        _qiblaFlareArmed = true;
    }
}

// ═══════════════════════════════════════════════════════════════
// TAWAF LENS FLARE — cinematic light event on every 7th circuit
// ═══════════════════════════════════════════════════════════════
// Tawaf = 7 circuits around the Kaaba. On the 7th circuit's completion,
// when the pen tip reaches the topmost (noon-facing) vertex of the diamond,
// a cinematic lens flare fires from that point.

let tawafCircuitCount = 0;   // 0–6, resets after firing
let tawafLastWrap = false;    // edge-detect the epicycleTime wrap

// ── Tasbih dhikr rhythm ──
// 33× SubhanAllah, 33× Alhamdulillah, 34× Allahu Akbar = 100
// Every tawaf completion (every minute) increments the counter.
// At counts 33, 66, 100: a subtle visual pulse — ring deepening.
let tasbihCount = 0;          // 0-99, resets after 100
let tasbihPulseStart = 0;     // timestamp (seconds) of last dhikr pulse
const TASBIH_PULSE_DURATION = 5.0; // seconds — slow meditative fade

// ── Gyroscope parallax (Miraj portal depth) ──
// Device tilt creates the illusion of looking through layered sacred space.
let _deviceTiltX = 0, _deviceTiltY = 0;
const _tiltSmooth = { x: 0, y: 0 };

function handleDeviceOrientation(e) {
    // gamma: left-right tilt (-90..90), beta: front-back tilt (-180..180)
    // Normalize around typical phone holding angle (~45° pitch)
    _deviceTiltX = (e.gamma || 0) / 90;
    _deviceTiltY = ((e.beta || 45) - 45) / 90;
}

// iOS 13+ requires user gesture for DeviceOrientation permission
let _gyroGranted = false;

function _enableGyro() {
    if (_gyroGranted) return;
    _gyroGranted = true;
    window._gyroGranted = true;
    window.addEventListener('deviceorientation', handleDeviceOrientation, true);
    // Hide prompt if visible
    const btn = document.getElementById('gyroPrompt');
    if (btn) { btn.style.opacity = '0'; setTimeout(() => btn.style.display = 'none', 300); }
}

function initGyroscope() {
    if (typeof DeviceOrientationEvent === 'undefined') return;

    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        // iOS: requestPermission() MUST be called directly inside a user gesture handler.
        // Do NOT wrap in async or call through another function — iOS loses the gesture context.
        const tryRequest = (e) => {
            if (_gyroGranted) {
                document.removeEventListener('click', tryRequest, true);
                document.removeEventListener('touchstart', tryRequest, true);
                return;
            }
            // Call DIRECTLY — no async wrapper, no intermediate function
            DeviceOrientationEvent.requestPermission().then(state => {
                if (state === 'granted') {
                    _enableGyro();
                    document.removeEventListener('click', tryRequest, true);
                    document.removeEventListener('touchstart', tryRequest, true);
                }
            }).catch(() => { /* will retry on next tap */ });
        };
        // Use touchstart (not touchend) — more reliable gesture context on iOS
        document.addEventListener('click', tryRequest, true);
        document.addEventListener('touchstart', tryRequest, true);
        // Do NOT call requestPermission() here without gesture — iOS will silently deny
    } else {
        // Android / desktop — no permission needed
        _enableGyro();
    }
}
// Expose for fullscreen entry
window._requestGyroPermission = function() {
    if (_gyroGranted) return;
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().then(state => {
            if (state === 'granted') _enableGyro();
        }).catch(() => {});
    }
};
initGyroscope();

// Flare textures — procedural generation
function createFlareDiscTexture(size = 256) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const cx = size / 2;
    // Bright core with wide soft falloff — classic anamorphic disc
    const grad = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
    grad.addColorStop(0,    'rgba(255,255,250,1)');
    grad.addColorStop(0.03, 'rgba(255,252,240,0.98)');
    grad.addColorStop(0.08, 'rgba(255,240,210,0.7)');
    grad.addColorStop(0.2,  'rgba(255,210,150,0.35)');
    grad.addColorStop(0.4,  'rgba(255,180,100,0.12)');
    grad.addColorStop(0.7,  'rgba(255,140,60,0.03)');
    grad.addColorStop(1,    'rgba(255,100,30,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
}

function createFlareStreakTexture(size = 256) {
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    const cx = size / 2, cy = size / 2;
    // Horizontal anamorphic streak
    const grad = ctx.createLinearGradient(0, cy, size, cy);
    grad.addColorStop(0, 'rgba(255,220,180,0)');
    grad.addColorStop(0.3, 'rgba(255,240,210,0.15)');
    grad.addColorStop(0.45, 'rgba(255,250,240,0.6)');
    grad.addColorStop(0.5, 'rgba(255,255,250,0.85)');
    grad.addColorStop(0.55, 'rgba(255,250,240,0.6)');
    grad.addColorStop(0.7, 'rgba(255,240,210,0.15)');
    grad.addColorStop(1, 'rgba(255,220,180,0)');
    // Narrow vertical falloff
    ctx.fillStyle = grad;
    for (let y = 0; y < size; y++) {
        const dy = Math.abs(y - cy) / cy;
        const falloff = Math.exp(-dy * dy * 12);
        ctx.globalAlpha = falloff;
        ctx.fillRect(0, y, size, 1);
    }
    return new THREE.CanvasTexture(c);
}

function createFlareGhostTexture(size = 128) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const cx = size / 2;
    // Soft ring — ghost element (bright ring, hollow center)
    const grad = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
    grad.addColorStop(0,   'rgba(255,240,220,0)');
    grad.addColorStop(0.5, 'rgba(255,240,220,0.02)');
    grad.addColorStop(0.7, 'rgba(255,230,200,0.25)');
    grad.addColorStop(0.85,'rgba(255,220,180,0.15)');
    grad.addColorStop(1,   'rgba(255,200,150,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
}

const flareDiscTex = createFlareDiscTexture(256);
const flareStreakTex = createFlareStreakTexture(256);
const flareGhostTex = createFlareGhostTexture(128);

// Flare element pool — a group of sprites
const flareGroup = new THREE.Group();
flareGroup.visible = false;
flareGroup.renderOrder = 100; // always on top
scene.add(flareGroup);

// Main disc — bright central flash
const flareDiscMat = new THREE.SpriteMaterial({
    map: flareDiscTex, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false,
    color: 0xfffff0,
});
const flareDisc = new THREE.Sprite(flareDiscMat);
flareDisc.scale.set(1.2, 1.2, 1);
flareGroup.add(flareDisc);

// Anamorphic streak — wide horizontal line through the source
const flareStreakMat = new THREE.SpriteMaterial({
    map: flareStreakTex, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false,
    color: 0xfff8e0,
});
const flareStreak = new THREE.Sprite(flareStreakMat);
flareStreak.scale.set(4.0, 0.15, 1); // wide and narrow
flareGroup.add(flareStreak);

// Ghost elements — 4 smaller discs spread along axis from source through center
const flareGhosts = [];
const GHOST_POSITIONS = [-0.3, 0.5, 0.8, 1.3]; // offset along source→center axis (1.0 = center)
const GHOST_SCALES = [0.15, 0.25, 0.12, 0.35];
const GHOST_COLORS = [0xffeedd, 0xeeddff, 0xddeeff, 0xffddee]; // subtle color fringing
for (let i = 0; i < 4; i++) {
    const gMat = new THREE.SpriteMaterial({
        map: flareGhostTex, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false,
        color: GHOST_COLORS[i],
    });
    const ghost = new THREE.Sprite(gMat);
    const s = GHOST_SCALES[i];
    ghost.scale.set(s, s, 1);
    flareGroup.add(ghost);
    flareGhosts.push({ sprite: ghost, mat: gMat, axisPos: GHOST_POSITIONS[i] });
}

// Flare animation state
let flareActive = false;
let flareStartTime = 0;
const FLARE_DURATION = 4.0; // seconds — soft bloom, long meditative fade
const FLARE_ATTACK = 0.6;   // seconds to peak — gentle rise, not a flash

function triggerTawafFlare(sourceX, sourceY) {
    flareActive = true;
    flareStartTime = performance.now() / 1000;
    flareGroup.visible = true;

    // Position main elements at the source (noon tip of Kaaba)
    flareDisc.position.set(sourceX, sourceY, 0.04);
    flareStreak.position.set(sourceX, sourceY, 0.04);

    // Position ghosts along the axis from source through scene center (0,0)
    const dx = -sourceX, dy = -sourceY; // direction toward center
    for (const g of flareGhosts) {
        g.sprite.position.set(
            sourceX + dx * g.axisPos,
            sourceY + dy * g.axisPos,
            0.04
        );
    }

    // ── Compute screen-space UV for the post-processing shader flare ──
    // Project world position → NDC → UV (0,0 = bottom-left, 1,1 = top-right)
    const uvX = (sourceX - camera.left) / (camera.right - camera.left);
    const uvY = (sourceY - camera.bottom) / (camera.top - camera.bottom);
    vignettePass.uniforms.uFlarePos.value.set(uvX, uvY);

    // Tint flare to current prayer palette
    const palette = artwork ? artwork.palette : PRAYER_PALETTES.isha;
    vignettePass.uniforms.uFlareColor.value.setHSL(
        palette.h / 360, Math.min((palette.s + 10) / 100, 0.8), 0.95
    );
}

function updateTawafFlare() {
    if (!flareActive) {
        // Ensure shader flare is off when not active
        vignettePass.uniforms.uFlare.value = 0.0;
        return;
    }
    const elapsed = (performance.now() / 1000) - flareStartTime;
    if (elapsed > FLARE_DURATION) {
        flareActive = false;
        flareGroup.visible = false;
        flareDiscMat.opacity = 0;
        flareStreakMat.opacity = 0;
        for (const g of flareGhosts) g.mat.opacity = 0;
        vignettePass.uniforms.uFlare.value = 0.0;
        return;
    }

    // Envelope: gentle rise → long meditative fade
    let envelope;
    if (elapsed < FLARE_ATTACK) {
        // Attack: smooth ease-in — a breath of light, not a flash
        const t = elapsed / FLARE_ATTACK;
        envelope = t * t * (3 - 2 * t); // smoothstep
    } else {
        // Decay: slow exponential — light lingers like an afterimage
        const decayT = (elapsed - FLARE_ATTACK) / (FLARE_DURATION - FLARE_ATTACK);
        envelope = Math.exp(-decayT * 2.0) * (1 - decayT * 0.15);
    }

    // ── Drive the post-processing shader flare ──
    // This creates the cinematic screen-space wash, streaks, ghosts, and starburst
    vignettePass.uniforms.uFlare.value = envelope;

    // Main disc: subtle glow, barely visible
    const discScale = 0.6 + envelope * 0.3;
    flareDisc.scale.set(discScale, discScale, 1);
    flareDiscMat.opacity = envelope * 0.12;
    flareDiscMat.needsUpdate = true;

    // Streak: whisper-thin horizontal
    const streakW = 2.0 + envelope * 1.0;
    flareStreak.scale.set(streakW, 0.06 + envelope * 0.03, 1);
    flareStreakMat.opacity = envelope * 0.08;
    flareStreakMat.needsUpdate = true;

    // Ghosts: barely perceptible
    for (let i = 0; i < flareGhosts.length; i++) {
        const delay = i * 0.08;
        const ghostT = Math.max(0, elapsed - delay);
        let gEnv;
        if (ghostT < FLARE_ATTACK) {
            const t = ghostT / FLARE_ATTACK;
            gEnv = t * t;
        } else {
            const dt = (ghostT - FLARE_ATTACK) / (FLARE_DURATION - FLARE_ATTACK);
            gEnv = Math.exp(-dt * 4.0);
        }
        flareGhosts[i].mat.opacity = gEnv * 0.04;
        flareGhosts[i].mat.needsUpdate = true;
    }
}

// Temp color for reuse (avoids allocations)
const _tmpColor = new THREE.Color();

function updateLiveElements(progress, now) {
    if (!artwork) return;

    const night = isNightTime();
    const t = progress * artwork.totalRevolutions * TWO_PI;
    const blending = THREE.NormalBlending;  // always normal — luminous bg
    const pairCount = artwork.pairs.length;

    // --- Update orbiter dots ---
    // TURRELL MODE: hide ALL orbiter dots and connection lines.
    // The color field IS the art — no visual noise.
    if (THEME_MODE === 'turrell') {
        liveDotGeo.setDrawRange(0, 0);
        for (let i = 0; i < MAX_PAIRS; i++) liveConnLines[i].line.visible = false;
    } else {
        for (let pi = 0; pi < pairCount; pi++) {
            const pair = artwork.pairs[pi];
            const { x1, y1, x2, y2 } = orbiterXY(pair, t, radius);
            let mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
            if (pair.r3 > 0) {
                const a3 = -pair.speed3 * t + pair.offset;
                mx += Math.cos(a3) * pair.r3 * radius;
                my += Math.sin(a3) * pair.r3 * radius;
            }
            const dotL = Math.min(97, pair.l + 25);
            const dotS = Math.max(5, pair.s - 15);
            _tmpColor.setHSL(pair.h / 360, dotS / 100, dotL / 100);
            const base = pi * 9;
            liveDotPosArray[base]     = x1; liveDotPosArray[base + 1] = y1; liveDotPosArray[base + 2] = 0;
            liveDotColorArray[base]   = _tmpColor.r * 0.5; liveDotColorArray[base + 1] = _tmpColor.g * 0.5; liveDotColorArray[base + 2] = _tmpColor.b * 0.5;
            liveDotPosArray[base + 3] = x2; liveDotPosArray[base + 4] = y2; liveDotPosArray[base + 5] = 0;
            liveDotColorArray[base + 3] = _tmpColor.r * 0.5; liveDotColorArray[base + 4] = _tmpColor.g * 0.5; liveDotColorArray[base + 5] = _tmpColor.b * 0.5;
            liveDotPosArray[base + 6] = mx; liveDotPosArray[base + 7] = my; liveDotPosArray[base + 8] = 0;
            liveDotColorArray[base + 6] = _tmpColor.r * 0.6; liveDotColorArray[base + 7] = _tmpColor.g * 0.6; liveDotColorArray[base + 8] = _tmpColor.b * 0.6;
            const conn = liveConnLines[pi];
            conn.posArr[0] = mx; conn.posArr[1] = my; conn.posArr[2] = 0;
            conn.posArr[3] = 0;  conn.posArr[4] = 0;  conn.posArr[5] = 0;
            conn.geo.attributes.position.needsUpdate = true;
            conn.mat.color.copy(_tmpColor);
            conn.mat.opacity = 0.10 * _handVisibility;
            conn.mat.blending = blending;
            conn.mat.needsUpdate = true;
            conn.line.visible = true;
        }
        for (let i = pairCount; i < MAX_PAIRS; i++) liveConnLines[i].line.visible = false;
        liveDotGeo.setDrawRange(0, pairCount * 3);
        liveDotGeo.attributes.position.needsUpdate = true;
        liveDotGeo.attributes.color.needsUpdate = true;
        liveDotMat.size = 5;
        liveDotMat.opacity = 0.5 * _handVisibility;
        liveDotMat.blending = blending;
        liveDotMat.needsUpdate = true;
    }

    // --- Update clock hands ---
    updateClockHands(now, night, blending);
}

function updateClockHands(now, night, blending) {
    // Smooth hand visibility for compass mode transitions
    const handTarget = _compassMode ? 0 : 1;
    _handVisibility += (handTarget - _handVisibility) * 0.15;
    if (_handVisibility < 0.005) _handVisibility = 0;

    const s = now.getSeconds() + now.getMilliseconds() / 1000;
    const m = now.getMinutes() + s / 60;
    const h = now.getHours() % 12; // snap to hour — no interpolation

    const secAngle = -TWO_PI * (s / 60) + Math.PI / 2;
    const minAngle = -TWO_PI * (m / 60) + Math.PI / 2;
    const hrAngle  = -TWO_PI * (h / 12) + Math.PI / 2;

    // Hand lengths fixed (not scaled with radius) — keeps hands the same size as drawing scales up
    const secR = 1.725;
    const minR = 1.38;
    const hrR  = 0.92;

    const palette = artwork ? artwork.palette : PRAYER_PALETTES.isha;
    const baseH = palette.h;

    // Hand configs: [angle, radius, saturation, lightness, opacity]
    // Hands: luminous — brighter than bg, high opacity for readability
    const pS = Math.max(palette.s - 10, 8);
    const pL = Math.min(palette.l + 18, 93);  // brighter than bg — hands are light within the field
    const hv = _handVisibility;

    // Drive shader beam uniforms — beams of light replace line-based hands
    const _bu = atenReignMat.uniforms;
    _bu.uHandAngles.value.set(
        Math.PI / 2 - hrAngle,
        Math.PI / 2 - minAngle,
        Math.PI / 2 - secAngle
    );
    _bu.uHandVis.value = hv;
    _bu.uHandColor.value.setHSL(baseH / 360, Math.min(pS / 100, 0.4), 0.92);

    // Line-based hands hidden — shader beams are the visual representation
    for (let i = 0; i < 3; i++) {
        liveHands[i].line.visible = false;
    }

    // Clock dot positions
    const hx = Math.cos(hrAngle) * hrR, hy = Math.sin(hrAngle) * hrR;
    const mx = Math.cos(minAngle) * minR, my = Math.sin(minAngle) * minR;
    const sx = Math.cos(secAngle) * secR, sy = Math.sin(secAngle) * secR;

    // --- Seconds comet trail ---
    for (let i = 0; i < TRAIL_STEPS; i++) {
        const frac1 = (s - (i + 1) * 0.12) / 60;
        const frac2 = (s - (i + 2) * 0.12) / 60;
        const a1 = -TWO_PI * frac1 + Math.PI / 2;
        const a2 = -TWO_PI * frac2 + Math.PI / 2;
        const off = i * 6;
        trailPosArr[off]     = Math.cos(a2) * secR; trailPosArr[off + 1] = Math.sin(a2) * secR; trailPosArr[off + 2] = 0.01;
        trailPosArr[off + 3] = Math.cos(a1) * secR; trailPosArr[off + 4] = Math.sin(a1) * secR; trailPosArr[off + 5] = 0.01;
    }
    trailGeo.attributes.position.needsUpdate = true;
    trailMat.opacity = 0.15 * hv;
    trailMat.blending = THREE.NormalBlending;
    trailMat.needsUpdate = true;

    // --- Update clock dots ---
    const lumeBlend = THREE.NormalBlending;
    const activeTex = dotTexture;

    // --- Epicycle hour numeral (clock-synced tawaf) ---
    // Derive tawaf phase from wall-clock seconds so 7 circuits = exactly 60 seconds.
    // The tawaf completes its 7th circuit precisely when the second hand hits 12 (minute boundary).
    // Tawaf direction is opposite to second hand (anti-clockwise) — handled by the negative sign in evaluateEpicycles.
    const tawafSeconds = s; // s = fractional seconds from the clock hand computation above
    const tawafPhase = (tawafSeconds / 60) * 7; // 0→7 over 60 seconds
    const tawafCurrentCircuit = Math.floor(tawafPhase); // which circuit (0-6)
    epicycleTime = (tawafPhase - tawafCurrentCircuit) * TWO_PI; // position within current circuit

    // Detect minute boundary (tawaf completion) — fire lens flare + tasbih rhythm
    if (tawafSeconds < 0.5 && tawafLastWrap) {
        // Second hand just crossed 12 — 7th circuit complete
        triggerTawafFlare(0, kaabaHalfDiag);
        tawafLastWrap = false;

        // Tasbih dhikr rhythm: 33 SubhanAllah, 33 Alhamdulillah, 34 Allahu Akbar
        tasbihCount = (tasbihCount + 1) % 100;
        if (tasbihCount === 33 || tasbihCount === 66 || tasbihCount === 0) {
            tasbihPulseStart = performance.now() / 1000;
        }
    } else if (tawafSeconds > 59) {
        tawafLastWrap = true; // arm the trigger for the next crossing
    }

    // ── Epicycle draw DISABLED — prism cube is pure shader glass now ──
    // Tawaf timing + flare trigger are still computed above (tawafPhase, triggerTawafFlare).
    // All Three.js overlay geometry (trail, circles, arm, fill, glow, tip) hidden.
    epicycleTrailLine.visible = false;
    kaabaGlowPoints.visible = false;
    kaabaFillMesh.visible = false;
    tipGlowPoint.visible = false;
    epicycleArmLine.visible = false;
    for (let i = 0; i < EPICYCLE_CIRCLE_POOL; i++) epicycleCircles[i].line.visible = false;

    // Hide all hand dots and epicycle circles
    hrDot.mat.opacity = 0; hrDot.mat.needsUpdate = true;
    minDot.mat.opacity = 0; minDot.mat.needsUpdate = true;
    secDot.mat.opacity = 0; secDot.mat.needsUpdate = true;

    // Hand tip glows — still visible, these are the beam endpoints
    const handTips = [
        { x: hx, y: hy },  // hour
        { x: mx, y: my },  // minute
        { x: sx, y: sy },  // second
    ];
    for (let h = 0; h < 3; h++) {
        const tip = handTips[h];
        const hg = handGlows[h];
        handEpiCircles[h].line.visible = false;
        handEpiDots[h].points.visible = false;

        // Scale glow sizes to world-space proportions (DPR-aware)
        const dpr = renderer.getPixelRatio();
        const pxPerWU = Math.min(W, H) * dpr / (2 * frustum);
        const GLOW_WU = [0.32, 0.26, 0.22];
        hg.posArr[0] = tip.x;
        hg.posArr[1] = tip.y;
        hg.posArr[2] = 0.025;
        hg.geo.attributes.position.needsUpdate = true;
        hg.mat.size = GLOW_WU[h] * pxPerWU;
        hg.mat.opacity = (h === 2 ? 0.45 : h === 0 ? 0.40 : 0.45) * hv;
        hg.mat.color.setHSL(baseH / 360, 0.30, h === 2 ? 0.88 : 0.86);
        hg.mat.blending = THREE.AdditiveBlending;
        hg.mat.needsUpdate = true;
    }

    centerDot.mat.opacity = 0.3 * hv;
    centerDot.mat.blending = THREE.NormalBlending;
    centerDot.mat.color.setHSL(baseH / 360, pS / 100, pL / 100);
    centerDot.mat.needsUpdate = true;
}

// ═══════════════════════════════════════════════════════════════
// DAY / NIGHT
// ═══════════════════════════════════════════════════════════════

let forceNight = null; // null = auto, true = force night, false = force day
function isNightTime() {
    if (forceNight !== null) return forceNight;
    return currentVars && (currentVars.prayerPeriod === 'maghrib' || currentVars.prayerPeriod === 'isha');
}

function applyDayNight() {
    // ═══════════════════════════════════════════════════════════════
    // TURRELL SKYSPACE APPROACH: ALL prayers are luminous.
    // No dark mode. The difference between prayers is COLOR, not brightness.
    // You look into radiant light — like a Ganzfeld or Aten Reign.
    // ═══════════════════════════════════════════════════════════════
    const night = isNightTime();
    const preset = night ? PRESETS.night : PRESETS.day;

    const palette = artwork ? artwork.palette : (currentVars ? PRAYER_PALETTES[currentVars.prayerPeriod] : PRAYER_PALETTES.isha);

    // ── ATEN REIGN MULTI-CHROMATIC RINGS ──
    // Each ring has its own DISTINCT hue — simultaneous color contrast.
    // Turrell: "peach to pink, lavender to deep purple to electric blue"
    const pH = palette.h;
    const pS = palette.s;
    const pL = palette.l;
    const prayerName = artwork ? artwork.prayerPeriod : (currentVars ? currentVars.prayerPeriod : 'isha');
    const rings = PRAYER_RING_PALETTES[prayerName] || PRAYER_RING_PALETTES.isha;

    const ringUniforms = ['uRing0', 'uRing1', 'uRing2', 'uRing3', 'uRing4', 'uRing5', 'uRing6'];
    for (let i = 0; i < 7; i++) {
        const [rh, rs, rl] = rings[i];
        _ringColor.setHSL(rh / 360, rs / 100, rl / 100);
        atenReignMat.uniforms[ringUniforms[i]].value.copy(_ringColor);
    }

    // scene.background stays null — Aten Reign quad handles everything

    // Bloom — near-zero. Turrell light is perceptually uniform. No point-source glow.
    bloomPass.strength = preset.bloomStrength;
    bloomPass.threshold = preset.bloomThreshold;
    bloomPass.radius = preset.bloomRadius;

    // ── VIGNETTE — amplifies the Aten Reign depth ──
    // Center glow: strong aperture radiance, the "inner light" of Quaker practice.
    // Edge: reinforces ring 4's rich prayer color — like Turrell's Skyspace surround.
    vignettePass.uniforms.uGlow.value = 0.0;          // no center glow — dark prism needs contrast
    vignettePass.uniforms.uDeepen.value = 0.15;     // edge immersion — reinforces 7th heaven depth
    // Edge color from ring 6 (7th heaven) — deepest ring, pushed even richer
    const [r6h, r6s, r6l] = rings[6];
    const edgeColor = new THREE.Color().setHSL(r6h / 360, Math.min(r6s * 1.3, 100) / 100, r6l * 0.7 / 100);
    vignettePass.uniforms.uEdgeColor.value.copy(edgeColor);

    // ── Tint lens flare to prayer palette ──
    // The flare should feel native to the current Turrell color field
    const flareBaseColor = new THREE.Color().setHSL(pH / 360, Math.min(pS + 10, 80) / 100, 0.95);
    flareDiscMat.color.copy(flareBaseColor);
    flareStreakMat.color.setHSL(pH / 360, Math.min(pS + 5, 70) / 100, 0.97);

    // ── Trace materials (orbiter mode only) ──
    if (THEME_MODE !== 'orbiter') { /* skip trace updates in turrell mode */ }
    else for (const obj of traceObjects) {
        const pair = obj.pair;
        const d = pair.depth !== undefined ? pair.depth : 0.5;
        const depthScale = 1.0 - d * PRESETS.shared.depthFactor;
        const avgR = (pair.r1 + pair.r2) / 2;
        const radiusScale = Math.pow(avgR, PRESETS.shared.radiusPower) * 4.0;

        // Traces: gossamer threads within the color field — barely perceptible.
        // They add life and structure but should never dominate the rings.
        const traceL = Math.min(96, pair.l + 15);  // luminous — lighter than most rings
        const traceS = Math.max(8, pair.s - 12);   // desaturated — ghost-like
        const baseAlpha = Math.min(pair.alpha * preset.alphaMul, preset.alphaMax);
        const traceAlpha = baseAlpha * depthScale * radiusScale * 0.18; // gossamer — rings dominate
        const connAlpha = Math.min(pair.alpha * 1.2, PRESETS.shared.connAlphaMul) * depthScale * 0.04;

        obj.rosetteLine.material.opacity = traceAlpha;
        obj.rosetteLine.material.blending = THREE.NormalBlending;
        obj.rosetteLine.material.needsUpdate = true;

        obj.connectSegments.material.color = hslToColor(pair.h, traceS, traceL);
        obj.connectSegments.material.opacity = connAlpha;
        obj.connectSegments.material.blending = THREE.NormalBlending;
        obj.connectSegments.material.needsUpdate = true;
    }

    // Historical trace layers + blurred layer (orbiter mode only)
    if (THEME_MODE === 'orbiter') {
        for (const layer of traceLayers) {
            for (let j = 0; j < layer.traceObjects.length; j++) {
                const obj = layer.traceObjects[j];
                const pair = obj.pair;
                const d = pair.depth !== undefined ? pair.depth : 0.5;
                const depthScale = 1.0 - d * PRESETS.shared.depthFactor;
                const avgR = (pair.r1 + pair.r2) / 2;
                const radiusScale = Math.pow(avgR, PRESETS.shared.radiusPower) * 4.0;
                const baseAlpha = Math.min(pair.alpha * preset.alphaMul, preset.alphaMax);
                const traceAlpha = baseAlpha * depthScale * radiusScale;
                const connAlpha = Math.min(pair.alpha * 1.2, PRESETS.shared.connAlphaMul) * depthScale;
                layer.origOpacities[j].rosetteAlpha = traceAlpha;
                layer.origOpacities[j].connectAlpha = connAlpha;
                obj.rosetteLine.material.opacity = traceAlpha * layer.opacity;
                obj.rosetteLine.material.blending = THREE.NormalBlending;
                obj.rosetteLine.material.needsUpdate = true;
                obj.connectSegments.material.blending = THREE.NormalBlending;
                obj.connectSegments.material.opacity = connAlpha * layer.opacity;
                obj.connectSegments.material.needsUpdate = true;
            }
        }
        if (blurredLayer) {
            blurredLayer.mesh.visible = true;
            blurredLayer.mesh.material.blending = THREE.AdditiveBlending;
            blurredLayer.mesh.material.premultipliedAlpha = false;
            blurredLayer.mesh.material.opacity = blurredLayer.opacity * 0.25;
            blurredLayer.mesh.material.needsUpdate = true;
        }
    }

    updateBodyColors();
}

function updateBodyColors() {
    // Always luminous background — text is always dark on light
    const textHi  = 'rgba(0,0,0,0.30)';
    const textMid = 'rgba(0,0,0,0.22)';
    const textLo  = 'rgba(0,0,0,0.18)';
    const textXLo = 'rgba(0,0,0,0.12)';
    const btnBg   = 'rgba(0,0,0,0.04)';
    const btnClr  = 'rgba(0,0,0,0.3)';
    const btnBrd  = 'rgba(0,0,0,0.08)';

    if (_elPrayerName)    _elPrayerName.style.color    = textHi;
    if (_elTimeDisplay)   _elTimeDisplay.style.color   = textMid;
    if (_elProgressLabel) _elProgressLabel.style.color = textLo;
    if (_elSeedInfo)      _elSeedInfo.style.color      = textXLo;

    document.querySelectorAll('.ctrl-btn').forEach(btn => {
        btn.style.background = btnBg;
        btn.style.color = btnClr;
        btn.style.borderColor = btnBrd;
    });

    // Skyspace page tinting — page bg MATCHES outer ring for seamless dissolve.
    // The page IS the continuation of the outer light field. No visible boundary.
    const pName = artwork ? artwork.prayerPeriod : (currentVars ? currentVars.prayerPeriod : 'isha');
    const outerRings = PRAYER_RING_PALETTES[pName] || PRAYER_RING_PALETTES.isha;
    const [pgH, pgS, pgL] = outerRings[6]; // ring 6 = 7th heaven (outermost)
    // Page bg: the museum wall beyond the rings — same hue family as outermost ring
    // but much lighter for seamless dissolve through the CSS mask.
    const pageTint = `hsl(${pgH}, ${Math.round(pgS * 0.28)}%, ${Math.round(Math.min(pgL + 48, 90))}%)`;
    document.documentElement.style.setProperty('--bg', pageTint);
    // dialHero background: transparent — Aten Reign shader fills the canvas,
    // CSS mask fades reveal the page bg directly.
    const heroEl = document.getElementById('dialHero');
    if (heroEl) heroEl.style.background = 'transparent';
    // Keep fullscreen overlay bg in sync (Turrell mode is luminous, not dark)
    const fsOverlay = document.getElementById('clockFullscreen');
    if (fsOverlay && fsOverlay.classList.contains('active')) fsOverlay.style.background = pageTint;
}

// ═══════════════════════════════════════════════════════════════
// MAIN LOOP
// ═══════════════════════════════════════════════════════════════

let artwork = null;
let speedMultiplier = 1;
let virtualTimeOffset = 0;
let lastRealTime = Date.now();
let manualSeedOffset = 0;
let lastPrayerPeriod = null;
let currentVars = null;
let lastDayNight = null;
let lastFrameTime = 0;
let _turrellSeeded = false;  // true once we've auto-seeded the atmospheric base layer
let _firstPaintTime = 0;     // timestamp of first frame with trace geometry

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
    const times = getPrayerTimes();
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

// ── Sabr (patience) — slow prayer transition ──
// During the last 15 minutes of each prayer period, imperceptibly crossfade
// the ring palette toward the next prayer's colors. The change is so slow
// you can't see it happening — then suddenly you realize the world shifted.
// This is how Turrell works. This is how prayer time works.
const TRANSITION_MINUTES = 15;
const _transRingColor = new THREE.Color();
const _PRAYER_ORDER = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

function updatePrayerTransition(vars) {
    if (!vars || !vars.period || !artwork) return;

    const period = vars.period;
    const periodDuration = period.end - period.start; // in minutes
    const minutesRemaining = (1 - period.progress) * periodDuration;

    if (minutesRemaining > TRANSITION_MINUTES || minutesRemaining <= 0) return;

    // We're in the transition zone — sabr begins
    const transitionProgress = 1 - (minutesRemaining / TRANSITION_MINUTES);
    // Smoothstep ease-in-out — imperceptible at first, accelerates gently
    const t = transitionProgress * transitionProgress * (3 - 2 * transitionProgress);

    const currentPrayer = vars.prayerPeriod;
    const currentIdx = _PRAYER_ORDER.indexOf(currentPrayer);
    const nextIdx = (currentIdx + 1) % 5;
    const nextPrayerName = _PRAYER_ORDER[nextIdx];

    const currentRings = PRAYER_RING_PALETTES[currentPrayer] || PRAYER_RING_PALETTES.isha;
    const nextRings = PRAYER_RING_PALETTES[nextPrayerName];

    const ringUniforms = ['uRing0', 'uRing1', 'uRing2', 'uRing3', 'uRing4', 'uRing5', 'uRing6'];
    for (let i = 0; i < 7; i++) {
        const [ch, cs, cl] = currentRings[i];
        const [nh, ns, nl] = nextRings[i];
        // Interpolate HSL — handle hue wrap-around
        let dh = nh - ch;
        if (dh > 180) dh -= 360;
        if (dh < -180) dh += 360;
        const blendH = ((ch + dh * t) % 360 + 360) % 360;
        const blendS = cs + (ns - cs) * t;
        const blendL = cl + (nl - cl) * t;
        _transRingColor.setHSL(blendH / 360, blendS / 100, blendL / 100);
        atenReignMat.uniforms[ringUniforms[i]].value.copy(_transRingColor);
    }

    // Also blend the page background during transition
    if (t > 0.3) { // only start page tinting halfway through
        const pageTintT = (t - 0.3) / 0.7; // 0..1 over the second half
        const [pgH, pgS, pgL] = currentRings[6];
        const [npgH, npgS, npgL] = nextRings[6];
        let dpgH = npgH - pgH;
        if (dpgH > 180) dpgH -= 360;
        if (dpgH < -180) dpgH += 360;
        const bpgH = ((pgH + dpgH * pageTintT) % 360 + 360) % 360;
        const bpgS = pgS + (npgS - pgS) * pageTintT;
        const bpgL = pgL + (npgL - pgL) * pageTintT;
        const pageTint = `hsl(${bpgH}, ${Math.round(bpgS * 0.28)}%, ${Math.round(Math.min(bpgL + 48, 90))}%)`;
        document.documentElement.style.setProperty('--bg', pageTint);
    }
}

function update(timestamp) {
    requestAnimationFrame(update);

    // Throttle to ~60fps on high-refresh displays
    if (timestamp - lastFrameTime < 16) return;
    lastFrameTime = timestamp;

    const now = getVirtualTime();
    const vars = computeVariables(now);
    currentVars = vars;

    // Detect prayer period change → new artwork
    const periodKey = `${vars.dateStr}-${vars.prayerPeriod}-${manualSeedOffset}-${vars.locKey}`;
    if (periodKey !== lastPrayerPeriod) {
        lastPrayerPeriod = periodKey;
        _turrellSeeded = true;
        _firstPaintTime = 0;

        if (THEME_MODE === 'orbiter') {
            // Push current traces as a blurred historical layer (if any exist)
            if (traceObjects.length > 0) {
                for (const obj of traceObjects) {
                    obj.rosetteLine.geometry.setDrawRange(0, obj.totalRosetteVerts);
                    obj.connectSegments.geometry.setDrawRange(0, obj.totalConnectVerts);
                }
                disposeBlurredLayer();
                const blurredRT = renderGroupBlurred(traceGroup);
                const aspect2 = W / H;
                const quadW = frustum * aspect2 * 2;
                const quadH = frustum * 2;
                const quadGeo = new THREE.PlaneGeometry(quadW, quadH);
                const quadMat = new THREE.MeshBasicMaterial({
                    map: blurredRT.texture,
                    transparent: true,
                    premultipliedAlpha: false,
                    opacity: 1.0,
                    depthTest: false,
                    depthWrite: false,
                    blending: THREE.NormalBlending,
                });
                const quadMesh = new THREE.Mesh(quadGeo, quadMat);
                quadMesh.position.set(0, 0, -0.1);
                quadMesh.renderOrder = -1;
                scene.add(quadMesh);
                blurredLayer = { mesh: quadMesh, opacity: 1.0, fadeTarget: PRESETS.turrell.fadeTarget };
                disposeTraceLayer({ traceObjects: [...traceObjects], group: traceGroup });
                traceGroup = new THREE.Group();
                scene.add(traceGroup);
                traceObjects = [];
            }
        } else {
            // Turrell mode: dispose any lingering traces/blur from previous sessions
            if (traceObjects.length > 0) {
                disposeTraceLayer({ traceObjects: [...traceObjects], group: traceGroup });
                traceGroup = new THREE.Group();
                scene.add(traceGroup);
                traceObjects = [];
            }
            disposeBlurredLayer();
        }

        const modVars = { ...vars };
        if (manualSeedOffset > 0) modVars.dateStr = `${vars.dateStr}-v${manualSeedOffset}`;
        artwork = generateArtwork(modVars);
        if (THEME_MODE === 'orbiter') buildTraceGeometry(artwork);
        // Always update palette on prayer change — fixes flash when API times
        // differ from fallback times (e.g. maghrib→isha, both "night")
        applyDayNight();
    }

    // Detect day/night transition (bloom/theme presets)
    const dayNight = isNightTime() ? 'night' : 'day';
    if (dayNight !== lastDayNight) {
        if (THEME_MODE === 'orbiter' && lastDayNight !== null && artwork) {
            buildTraceGeometry(artwork);
        }
        applyDayNight();
        lastDayNight = dayNight;
    }

    if (THEME_MODE === 'orbiter') {
        // Update trace reveal
        updateTraceDrawRange(vars.prayerProgress);

        // Auto-seed Turrell atmosphere on first load
        if (!_turrellSeeded && traceObjects.length > 0) {
            if (_firstPaintTime === 0) _firstPaintTime = timestamp;
            if (timestamp - _firstPaintTime > 10000) {
                _turrellSeeded = true;
                for (const obj of traceObjects) {
                    obj.rosetteLine.geometry.setDrawRange(0, obj.totalRosetteVerts);
                    obj.connectSegments.geometry.setDrawRange(0, obj.totalConnectVerts);
                }
                disposeBlurredLayer();
                const blurredRT = renderGroupBlurred(traceGroup);
                const aspect2 = W / H;
                const quadW = frustum * aspect2 * 2;
                const quadH = frustum * 2;
                const quadGeo = new THREE.PlaneGeometry(quadW, quadH);
                const quadMat = new THREE.MeshBasicMaterial({
                    map: blurredRT.texture, transparent: true, premultipliedAlpha: false,
                    opacity: 0.0, depthTest: false, depthWrite: false, blending: THREE.NormalBlending,
                });
                const quadMesh = new THREE.Mesh(quadGeo, quadMat);
                quadMesh.position.set(0, 0, -0.1);
                quadMesh.renderOrder = -1;
                scene.add(quadMesh);
                blurredLayer = { mesh: quadMesh, opacity: 0.0, fadeTarget: PRESETS.turrell.fadeTarget };
                updateTraceDrawRange(vars.prayerProgress);
            }
        }

        // Fade blurred layer
        if (blurredLayer) {
            blurredLayer.fadeTarget = PRESETS.turrell.fadeTarget;
            blurredLayer.opacity += (blurredLayer.fadeTarget - blurredLayer.opacity) * PRESETS.turrell.fadeRate;
            blurredLayer.mesh.material.opacity = blurredLayer.opacity;
        }

        // Legacy traceLayers fade
        for (let i = 0; i < traceLayers.length; i++) {
            const layer = traceLayers[i];
            const fromEnd = traceLayers.length - 1 - i;
            layer.fadeTarget = fromEnd === 0 ? 0.15 : fromEnd === 1 ? 0.05 : 0.02;
            layer.opacity += (layer.fadeTarget - layer.opacity) * 0.002;
            for (let j = 0; j < layer.traceObjects.length; j++) {
                const obj = layer.traceObjects[j];
                const orig = layer.origOpacities[j];
                obj.rosetteLine.material.opacity = orig.rosetteAlpha * layer.opacity;
                obj.connectSegments.material.opacity = orig.connectAlpha * layer.opacity;
            }
        }

        // Rotate trace dial
        const _s = now.getSeconds() + now.getMilliseconds() / 1000;
        traceGroup.rotation.z = TWO_PI * (_s / 60);
        if (blurredLayer) blurredLayer.mesh.rotation.z = traceGroup.rotation.z;
    }
    // Rebuild live overlay
    updateLiveElements(vars.prayerProgress, now);

    // ── Gyroscope parallax — smooth device tilt into portal depth ──
    _tiltSmooth.x += (_deviceTiltX - _tiltSmooth.x) * 0.06;
    _tiltSmooth.y += (_deviceTiltY - _tiltSmooth.y) * 0.06;
    atenReignMat.uniforms.uTilt.value.set(_tiltSmooth.x * 0.15, _tiltSmooth.y * 0.15);

    // ── Tasbih dhikr pulse — subtle ring deepening ──
    if (tasbihPulseStart > 0) {
        const tasbihElapsed = performance.now() / 1000 - tasbihPulseStart;
        const tasbihRaw = Math.max(0, 1 - tasbihElapsed / TASBIH_PULSE_DURATION);
        atenReignMat.uniforms.uTasbihPulse.value = tasbihRaw * tasbihRaw; // quadratic easeout
        if (tasbihRaw <= 0) tasbihPulseStart = 0; // done
    } else {
        atenReignMat.uniforms.uTasbihPulse.value = 0;
    }

    // ── Sabr (patience) — slow prayer transition crossfade ──
    // During the last 15 minutes, imperceptibly blend toward the next prayer's palette.
    // "Indeed, prayer has been decreed upon the believers at specified times" (4:103)
    updatePrayerTransition(vars);

    // Animate Aten Reign breathing
    atenReignMat.uniforms.uTime.value = timestamp * 0.001;

    // Update tawaf lens flare animation
    updateTawafFlare();

    // Update qibla compass beam
    updateQiblaBeam();

    // Render
    composer.render();

    updateUI(now, vars);
}

function updateUI(now, vars) {
    const palette = PRAYER_PALETTES[vars.prayerPeriod];
    const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
    const h12 = h % 12 || 12;
    const ampm = h < 12 ? 'AM' : 'PM';

    if (_elPrayerName)    _elPrayerName.textContent    = `${palette.name} · ${palette.ar}`;
    if (_elTimeDisplay)   _elTimeDisplay.textContent   =
        `${h12}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} ${ampm}`;

    const pct = Math.floor(vars.prayerProgress * 100);
    if (_elProgressLabel) _elProgressLabel.textContent = `${pct}% complete`;

    if (artwork && _elSeedInfo) {
        const hijri = `${vars.hijriDay}/${vars.hijriMonth}/${vars.hijriYear}`;
        const rm = vars.ramadanDay > 0 ? ` · Ramadan ${vars.ramadanDay}` : '';
        const lqn = vars.isLQN ? ' · ليلة القدر' : '';
        const loc = `${userLat.toFixed(1)}°, ${userLng.toFixed(1)}°`;
        const qDeg = ((qiblaBearing * 180 / Math.PI) + 360) % 360;
        _elSeedInfo.textContent =
            `GL · ${hijri}${rm}${lqn} · ${loc} · qibla ${qDeg.toFixed(0)}° · ${artwork.pairs.length} orbits · ${artwork.totalRevolutions} rev · seed ${artwork.seed}`;
    }
}

// ═══════════════════════════════════════════════════════════════
// EVENTS
// ═══════════════════════════════════════════════════════════════

function onResize() {
    // In fullscreen the canvas is a circle (square CSS) — use its actual rendered size, not window size
    const canvasEl = renderer.domElement;
    W = _isFullscreen ? canvasEl.clientWidth : (CONTAINED ? CONTAINER.clientWidth : window.innerWidth);
    H = _isFullscreen ? canvasEl.clientHeight : (CONTAINED ? CONTAINER.clientHeight : window.innerHeight);
    const aspect = W / H;
    if (aspect >= 1) {
        // Landscape / square — fit vertically, expand horizontally
        camera.left   = -frustum * aspect;
        camera.right  =  frustum * aspect;
        camera.top    =  frustum;
        camera.bottom = -frustum;
    } else {
        // Portrait (fullscreen phone) — fit horizontally, expand vertically
        camera.left   = -frustum;
        camera.right  =  frustum;
        camera.top    =  frustum / aspect;
        camera.bottom = -frustum / aspect;
    }

    // Center clock within safe area (accounts for notch + gesture bar)
    if (_isFullscreen) {
        const m = document.createElement('div');
        m.style.cssText = 'position:fixed;left:0;width:0;visibility:hidden;pointer-events:none';
        m.style.top = 'env(safe-area-inset-top, 0px)';
        document.body.appendChild(m);
        const safeTop = m.getBoundingClientRect().top;
        m.style.top = 'auto';
        m.style.bottom = 'env(safe-area-inset-bottom, 0px)';
        const safeBottom = window.innerHeight - m.getBoundingClientRect().top;
        document.body.removeChild(m);
        // Shift frustum so scene center aligns with safe area center
        const offsetPx = (safeTop - safeBottom) / 2; // positive = shift scene down
        const frustumH = camera.top - camera.bottom;
        const offsetWorld = offsetPx / H * frustumH;
        camera.top    -= offsetWorld;
        camera.bottom -= offsetWorld;
    }

    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
    composer.setSize(W, H);

    // Update aspect ratio for ring and vignette shaders (keeps circles circular)
    const newAspectRatio = W / H;
    atenReignMat.uniforms.uAspect.value = newAspectRatio;
    vignettePass.uniforms.uAspect.value = newAspectRatio;

    // Resize blur render targets to match new resolution
    blurTargetA.setSize(W, H);
    blurTargetB.setSize(W, H);
    bokehMat.uniforms.uResolution.value.set(W, H);

    // Resize Aten Reign background quad to match new frustum
    {
        const newAspect = W / H;
        const aqW = frustum * (newAspect >= 1 ? newAspect : 1) * 2.4;
        const aqH = frustum * (newAspect >= 1 ? 1 : 1 / newAspect) * 2.4;
        atenReignQuad.geometry.dispose();
        atenReignQuad.geometry = new THREE.PlaneGeometry(aqW, aqH);
    }

    // Resize blurred quad to match new frustum
    if (blurredLayer) {
        const newAspect = W / H;
        const quadW = newAspect >= 1 ? frustum * newAspect * 2 : frustum * 2;
        const quadH = newAspect >= 1 ? frustum * 2 : (frustum / newAspect) * 2;
        blurredLayer.mesh.geometry.dispose();
        blurredLayer.mesh.geometry = new THREE.PlaneGeometry(quadW, quadH);
    }
}

window.addEventListener('resize', onResize);

// Right-click save
renderer.domElement.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    renderer.domElement.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const d = new Date();
        const ts = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}`;
        a.download = `tawaf-gl-${ts}.png`;
        a.click();
        URL.revokeObjectURL(url);
    }, 'image/png');
});

// Button event listeners — only wire up if elements exist (standalone mode)
const _btnNext = document.getElementById('btn-next');
if (_btnNext) _btnNext.addEventListener('click', () => {
    manualSeedOffset++;
    lastPrayerPeriod = null;
});

const _btnSpeed = document.getElementById('btn-speed');
if (_btnSpeed) _btnSpeed.addEventListener('click', (e) => {
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

const _btnDaynight = document.getElementById('btn-daynight');
if (_btnDaynight) _btnDaynight.addEventListener('click', (e) => {
    const btn = e.currentTarget;
    const vt = getVirtualTime();
    const currentlyNight = isNightTime();
    const times = getPrayerTimes();
    let targetH, targetM;
    if (currentlyNight) {
        targetH = times.fajr.h; targetM = times.fajr.m + 2;
    } else {
        targetH = times.maghrib.h; targetM = times.maghrib.m + 2;
    }
    const targetDate = new Date(vt);
    targetDate.setHours(targetH, targetM, 0, 0);
    if (targetDate <= vt) targetDate.setDate(targetDate.getDate() + 1);
    virtualTimeOffset += targetDate.getTime() - vt.getTime();
    lastPrayerPeriod = null;
    btn.textContent = currentlyNight ? 'Night' : 'Day';
    btn.classList.toggle('active');
});

const _btnClear = document.getElementById('btn-clear');
if (_btnClear) _btnClear.addEventListener('click', () => {
    if (artwork) {
        lastPrayerPeriod = null;
    }
});

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════

// Cache DOM element references once (safe — elements may not exist in production)
const _elPrayerName    = document.getElementById('prayer-name');
const _elTimeDisplay   = document.getElementById('time-display');
const _elProgressLabel = document.getElementById('progress-label');
const _elSeedInfo      = document.getElementById('seed-info');

currentVars = computeVariables(new Date());
lastDayNight = isNightTime() ? 'night' : 'day';
applyDayNight();
// Delay reveal until API prayer times have loaded (or timeout after 800ms).
// This prevents the double-pop where fallback times show one palette,
// then API times arrive mid-fade and switch to another.
function revealWhenReady() {
    if (window._prayerTimingsReady) {
        // API loaded — recompute with real times before revealing
        currentVars = computeVariables(new Date());
        applyDayNight();
        requestAnimationFrame(() => document.body.classList.add('clock-ready'));
    } else {
        // Poll briefly — API usually loads within 200-500ms on refresh
        setTimeout(revealWhenReady, 50);
    }
}
// Hard deadline: reveal after 800ms even if API is slow
setTimeout(() => {
    if (!document.body.classList.contains('clock-ready')) {
        requestAnimationFrame(() => document.body.classList.add('clock-ready'));
    }
}, 800);
revealWhenReady();
initGeolocation();
initCompass();

document.addEventListener('click', function iosCompass() {
    requestCompassPermission();
    document.removeEventListener('click', iosCompass);
}, { once: true });

// ═══════════════════════════════════════════════════════════════
// WINDOW INTERFACE — production site integration
// ═══════════════════════════════════════════════════════════════

window._clockReady = true;

window._clockSwitchDial = function(name) { /* no-op — single design */ };
window._clockGetDial    = function() { return 'tawaf'; };

window._clockSetNight = function(on, snap) {
    forceNight = on ? true : false;
    applyDayNight();
};

window._clockSetFullscreen = function(on, snapNight) {
    _isFullscreen = !!on;
    if (snapNight !== undefined) {
        forceNight = snapNight ? true : false;
        applyDayNight();
    }
    onResize();
};

window._clockOnResize = onResize;

window._clockSetScrollSection = function(idx) { /* no-op */ };
window._clockToggleCompass = function(on) {
    _compassMode = !!on;
    // Request compass permission on activation (iOS requires user gesture)
    if (_compassMode) requestCompassPermission();
};
window._clockIsCompassMode = function() { return _compassMode; };

update();
