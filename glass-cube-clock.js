// glass-cube-clock.js — Dichroic Glass Prism Clock
// Seven Heavens Studio — integrated into agiftoftime.app
// Three.js FBO dichroic shader, per-channel IOR, real-time H:M:S hands

import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
// LightProbeGenerator removed — no irradiance probes


// ─── CONTAINER DETECTION ──────────────────────────────────────────────────────
const _isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
const CONTAINER = window._clockContainer || null;
const CONTAINED = !!CONTAINER;
let _isFullscreen = false;

// ─── RENDERER ─────────────────────────────────────────────────────────────────
const rawDpr = window.devicePixelRatio || 1;
const maxPhysical = 2560;
function calcDpr(w, h) {
  const longest = Math.max(w, h);
  return Math.min(rawDpr, maxPhysical / longest, 2);
}

var _canvasEl = null; // set after renderer created
// Measure lvh (Large Viewport Height) — max viewport, never changes during scroll
var _lvhEl = document.createElement('div');
_lvhEl.style.cssText = 'position:fixed;top:0;left:0;width:0;height:100lvh;pointer-events:none;';
document.body.appendChild(_lvhEl);
var _stableW = window.innerWidth;
var _stableH = _lvhEl.offsetHeight || window.innerHeight;
document.body.removeChild(_lvhEl);
// Expose for splash alignment
window._canvasW = _stableW;
window._canvasH = _stableH;

function getSize() {
  if (CONTAINED) {
    return { w: CONTAINER.clientWidth || 400, h: CONTAINER.clientHeight || 400 };
  }
  return { w: _stableW, h: _stableH };
}

let { w: W, h: H } = getSize();
let dpr = calcDpr(W, H);

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.toneMapping = THREE.AgXToneMapping;
renderer.toneMappingExposure = 0.95; // v57: 1.25→0.95 — darken outside arch, dramatic contrast with bright interior
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(dpr);
renderer.setSize(W, H, false);

function publishRendererTelemetrySize() {
  if (!renderer) return;
  const target = new THREE.Vector2();
  renderer.getSize(target);
  window._rendererSize = {
    cssWidth: Math.round(target.x),
    cssHeight: Math.round(target.y),
    drawingBufferWidth: renderer.domElement ? renderer.domElement.width : null,
    drawingBufferHeight: renderer.domElement ? renderer.domElement.height : null,
    pixelRatio: renderer.getPixelRatio()
  };
}
publishRendererTelemetrySize();

if (CONTAINED) {
  CONTAINER.appendChild(renderer.domElement);
} else {
  const c = renderer.domElement;
  c.style.cssText = 'position:fixed;top:0;left:0;z-index:0;width:100vw;height:100lvh;';
  document.body.appendChild(c);
  _canvasEl = c;
}

// FBO render target
const fboRT = new THREE.WebGLRenderTarget(W * dpr, H * dpr, {
  minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat,
  samples: 4,
});

// ─── SCENE ────────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
// Dark scene — glass refraction and dichroic dispersion pop against near-black
scene.background = new THREE.Color(0x0d0d12);
scene.fog = new THREE.FogExp2(0x0d0d12, 0.035);

const camera = new THREE.PerspectiveCamera(78, W / H, 0.01, 1000);

// Two camera presets:
//   LANDING    — tight telephoto crop for the circular hero (cube + proximal rays fill circle)
//   FULLSCREEN — wide shot shows full floor scene
// FOV 35° on both — telephoto/rectilinear, minimal perspective distortion.
// Elevation angle matched: both cameras sit ~33° above cube so top face reads properly.
// Landing was too low (29°) making cube look flat — raised y to match fullscreen proportion.
const CAM_LANDING    = { pos: [0.2, 9.7, 15.0], fov: 35, look: [0, -0.8, 1.0] };
const CAM_FULLSCREEN = { pos: [0.2, 9.7, 15.0], fov: 35, look: [0, -0.8, 1.0] };

function applyCamera(preset) {
  camera.position.set(...preset.pos);
  camera.fov = preset.fov;
  camera.updateProjectionMatrix();
  camera.lookAt(...preset.look);
}

// Start in landing (contained) mode
applyCamera(CONTAINED ? CAM_LANDING : CAM_FULLSCREEN);

// ─── RESIZE ───────────────────────────────────────────────────────────────────
function onResize() {
  ({ w: W, h: H } = getSize());
  dpr = calcDpr(W, H);
  renderer.setPixelRatio(dpr);
  renderer.setSize(W, H, false);
  publishRendererTelemetrySize();
  camera.aspect = W / H;
  camera.updateProjectionMatrix();
  fboRT.setSize(W * dpr, H * dpr);
  cubeMat.uniforms.uRes.value.set(W * dpr, H * dpr);
  cubeMat.uniforms.uAspect.value = W / H;
}
// Desktop: resize on window resize. Mobile: only on orientation change.
var _resizeTimer = null;
window.addEventListener('resize', function() {
  // Debounce to avoid hammering during drag-resize
  if (_resizeTimer) clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(function() {
    _stableW = window.innerWidth;
    // Always re-measure lvh — canvas CSS uses 100lvh, buffer must match
    var el = document.createElement('div');
    el.style.cssText = 'position:fixed;top:0;left:0;width:0;height:100lvh;pointer-events:none;';
    document.body.appendChild(el);
    _stableH = el.offsetHeight || window.innerHeight;
    document.body.removeChild(el);
    onResize();
  }, 100);
});
window.addEventListener('orientationchange', function() {
  setTimeout(function() {
    _stableW = window.innerWidth;
    // Re-measure lvh
    var el = document.createElement('div');
    el.style.cssText = 'position:fixed;top:0;left:0;width:0;height:100lvh;pointer-events:none;';
    document.body.appendChild(el);
    _stableH = el.offsetHeight || window.innerHeight;
    document.body.removeChild(el);
    onResize();
  }, 200);
});

// ─── FLOOR — removed (podium replaces ground plane) ──────────────────────────

// ─── LIGHTING ─────────────────────────────────────────────────────────────────
// Working with the FBO shader: the cube body brightness comes from what the FBO
// captures BEHIND the glass. The backlight is the most critical fixture — it
// illuminates the background scene the shader refracts. Without it, glass goes dark.

// BACKLIGHT — from behind-right. Illuminates the scene behind the cube so the
// FBO captures bright content → glass refracts light and looks transparent/glowing.
const back = new THREE.SpotLight(0x4040a0, 50);
back.position.set(3.0, 3.0, -5.5);
back.target.position.set(0, 0.5, 0);
back.angle = 0.70; back.penumbra = 0.85; back.decay = 1.1;
scene.add(back, back.target);

// ── LIGHTING RIG: Quibla of Light (Chris lookdev, Feb 28) ──
// One dominant sacred shaft. Darkness as co-designer. Floor is the canvas.
// Inspired by: Nasir al-Mulk, Tadao Ando, Lubezki, Deakins.

// Procedural Islamic arch gobo texture
// MASHRABIYA TEXTURES REMOVED v276 — _makeArchTexture + _makeArchOutlineTexture
// All arch stamps (archBloomMesh, archFloorMesh) were disabled since v80

// GOBO REMOVED v275 — was disabled (scene.add commented out) since v80, shadow map still allocated

// CUBE BACKLIGHT — glass transmission (Swarovski technique)
const cubeBack = new THREE.SpotLight(0xffeedd, 7);
cubeBack.position.set(0.5, 10, -5);
cubeBack.target.position.set(0, 0.6, 0);
cubeBack.angle = 0.18;
cubeBack.penumbra = 0.7;
cubeBack.decay = 2;
cubeBack.castShadow = false;
scene.add(cubeBack, cubeBack.target);

// COLD COUNTER — Deakins warm/cold split
// COLD COUNTER REMOVED v275 — merged into back spot

// VIOLET RIM — Swarovski edge catch — sharpened to actually separate cube from dark bg
const violetRim = new THREE.SpotLight(0x8055f0, 6);
violetRim.position.set(-4, 9, -2);
violetRim.target.position.set(0, 0.6, 0);
violetRim.angle = 0.18; // tighter cone — cleaner rim, no floor spill
violetRim.penumbra = 0.2;
violetRim.decay = 1.4;
violetRim.castShadow = false;
scene.add(violetRim, violetRim.target);

// GHOST FILL — floor separation from pure black
// GHOST FILL REMOVED v275 — ambient already covers floor

// PRAYER AMBIENT — hemisphere for colored shadow fill
// PRAYER AMBIENT REMOVED v275 — AmbientLight 0.07 already provides fill

// COOL RIM — catches back edges of cube, separates silhouette from bg
const rim = new THREE.SpotLight(0x8060c0, 5);
rim.position.set(-1.5, 5.5, -3.5);
rim.target.position.set(0, 0.6, 0);
rim.angle = 0.45; rim.penumbra = 0.85;
scene.add(rim, rim.target);

// CUBE SUN — bright point directly behind the cube.
// The FBO shader samples the scene behind the glass — without a bright source
// there, the refracted RGB is dark and no rainbow is visible. This gives it
// bright content to bend, producing visible chromatic dispersion.
const cubeSun = new THREE.PointLight(0xe8f2ff, 30, 14); // v577: 50→30 — kill podium hotspot, dichroic compensates via FBO
cubeSun.position.set(0, 0.2, -2.8);
scene.add(cubeSun);

// SOLAR ARC KEY — subtle day progression for timelapse readability.
// Dawn (warm/low) → Noon (cool/high) → Dusk (warm/low) → Night (off).
// SOLAR KEY REMOVED v275 — plinthSun orbit handles solar effect

// PLINTH ORBIT HIGHLIGHT — explicit circular top-down spot over hour-hand path.
const plinthSun = new THREE.SpotLight(0xffffff, 0);
plinthSun.position.set(0, 3.2, -2.8);
plinthSun.target.position.set(0, -0.03, -2.8);
plinthSun.angle = 0.38;
plinthSun.penumbra = 0.60;
plinthSun.decay = 1.0;
plinthSun.distance = 8.0;
window.plinthSun = plinthSun;
window.cubeSun = cubeSun;
// window.solarKey removed v275
plinthSun.castShadow = true;
plinthSun.shadow.mapSize.width = 384;
plinthSun.shadow.mapSize.height = 384;
plinthSun.shadow.radius = 5;
plinthSun.shadow.camera.near = 0.5;
plinthSun.shadow.camera.far = 8;
scene.add(plinthSun, plinthSun.target);

scene.add(new THREE.AmbientLight(0xffffff, 0.07)); // v57: 0.16→0.07 — deeper darkness outside arch, shadow is absolute

// 12 o'clock spotlight — catches top edge during tawaf rotation
// TAWAF SPOT REMOVED v275 — plinthSun orbit now handles solar circumnavigation

// Podium edge spotlight removed — reverted to pre-Chris lighting

// ── PRAYER-REACTIVE ACCENT SPOTLIGHTS (Chris lookdev, Mar 4) ──────────────────
// Two accent spotlights that breathe with the active prayer window color.
// Concept: the scene's atmosphere shifts with sacred time — not decoration, but
// ambient awareness. Like sunrise warming a room before you notice it.
//
// KEY DESIGN: On layer 1, excluded from FBO pass. The glass cube shader refracts
// what the FBO captures behind the cube. If prayer lights color that background,
// the cube itself turns into a colored blob. Layer isolation means these lights
// ONLY affect the final composite (podium, floor, fog, cube surface lighting)
// without bleeding into the glass refraction. This is the showroom solution.
const PRAYER_LIGHT_LAYER = 1;

// PRAYER WASH — above-forward-left, washes podium front face in prayer color.
// Atmospheric pool that tints the obsidian plinth with sacred time.
const prayerWash = new THREE.SpotLight(0x111122, 0);
prayerWash.position.set(-2.0, -1.5, 4.0);   // v8: low & forward — atmospheric fog tint, not podium flood
prayerWash.target.position.set(0, -4.0, 0);  // v8: aimed at dark floor/fog zone below podium
prayerWash.angle = 0.90;      // v8: wide wash for ambient fog tint
prayerWash.penumbra = 1.0;    // v8: fully soft edges — no hotspot
prayerWash.decay = 1.2;       // v8: moderate falloff
prayerWash.distance = 14;     // v8: reaches fog but dies before overwhelming
prayerWash.castShadow = false;
scene.add(prayerWash, prayerWash.target);

// PRAYER RIM — behind-right, catches cube back edges in prayer color2.
// Hidden during FBO pass via visibility toggle — safe from glass refraction bleed.
const prayerRim = new THREE.SpotLight(0x111122, 0);
prayerRim.position.set(2.5, 2.5, -3.0);     // v8: behind-right, above cube — grazes edges at ~45°
prayerRim.target.position.set(0, 0.57, 0);   // v8: aimed at cube center (CUBE_Y)
prayerRim.angle = 0.20;       // v8d: very tight cone — grazes cube edges only, minimal scene spill
prayerRim.penumbra = 0.80;    // v8d: soft falloff so the tight cone doesn't look harsh
prayerRim.decay = 1.5;        // v8d: dies faster after cube — less background spill
prayerRim.distance = 8;       // v8d: shorter reach — hits cube then dies
prayerRim.castShadow = false;
scene.add(prayerRim, prayerRim.target);

// v8: podium slash — tight colored edge-catch on front face, sharp angle from right
const prayerSlash = new THREE.SpotLight(0x111122, 0);
prayerSlash.position.set(2.0, 1.5, 4.5); // v9: faces front face properly (NdotL 0.75)
prayerSlash.target.position.set(0, -1.5, 1.32); // v8b: aimed at upper-mid of front face — diagonal catch
prayerSlash.angle = 0.18;
prayerSlash.penumbra = 0.55;   // soft edges so it blends
prayerSlash.decay = 1.8;       // v8b: dies faster — stays contained
prayerSlash.distance = 9;
prayerSlash.castShadow = false;
scene.add(prayerSlash, prayerSlash.target);

// Lerp state for prayer accent lights
const _prayerWashColor = new THREE.Color(0x111122);
const _prayerRimColor = new THREE.Color(0x111122);
const _prayerSlashColor = new THREE.Color(0x111122);
let _prayerWashIntensity = 0;
let _prayerRimIntensity = 0;
let _prayerSlashIntensity = 0;
const PRAYER_WASH_MAX = 0.0;   // v8d: DISABLED — slash is hero, wash was flooding blue/green
const PRAYER_RIM_MAX = 5.0;    // v8d: Fresnel edge catch on glass cube
const PRAYER_SLASH_MAX = 25.0; // v9: boosted intensity
const PRAYER_LIGHT_LERP = 0.022; // ~3s transition at 60fps — slower = more sacred

// ─── GROUND FOG LAYER ─────────────────────────────────────────────────────────
const fogLayerMat = new THREE.ShaderMaterial({
  uniforms: {
    uTime:    { value: 0 },
    uOpacity: { value: 0.27 }, // deeper pool — feels like the floor breathes
    uColor:   { value: new THREE.Color(0x1a2888) }, // richer indigo, less cyan
  },
  vertexShader: `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: `
    uniform float uTime; uniform float uOpacity; uniform vec3 uColor;
    varying vec2 vUv;
    void main() {
      vec2 c = vUv - 0.5;
      float dist = length(c) * 2.0;
      float fog = (1.0 - smoothstep(0.15, 1.0, dist));
      float breath = 0.88 + 0.12 * sin(uTime * 0.6);
      gl_FragColor = vec4(uColor, fog * uOpacity * breath);
    }
  `,
  transparent: true, depthWrite: false, blending: THREE.NormalBlending, side: THREE.DoubleSide,
});
const fogLayerMesh = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), fogLayerMat);
fogLayerMesh.rotation.x = -Math.PI / 2;
fogLayerMesh.position.y = 0.018;
scene.add(fogLayerMesh);

// WARM FLOOR GLOW — sacred amber pool in the foreground floor zone.
// Additive: only adds warmth, never darkens. Fills the dead lower frame area.
// Counterbalances the cold indigo fog — sacred warmth vs night cold.
const warmFogMat = new THREE.ShaderMaterial({
  uniforms: {
    uTime:    { value: 0 },
    uOpacity: { value: 0.09 },  // v56: 0.07→0.09 — lower frame breathes, not dead
    uColor:   { value: new THREE.Color(0x9e4200) }, // deep amber, not blown out
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `
    uniform float uTime, uOpacity; uniform vec3 uColor;
    varying vec2 vUv;
    void main() {
      vec2 c = vUv - 0.5;
      float dist = length(c) * 2.5;
      float fog = 1.0 - smoothstep(0.05, 1.0, dist);
      float breath = 0.88 + 0.12 * sin(uTime * 0.52 + 0.9);
      gl_FragColor = vec4(uColor, fog * uOpacity * breath);
    }
  `,
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
});
const warmFogMesh = new THREE.Mesh(new THREE.PlaneGeometry(55, 55), warmFogMat);
warmFogMesh.rotation.x = -Math.PI / 2;
warmFogMesh.position.set(1.2, 0.017, 7.0); // far foreground — past the arch zone, doesn't fill the dark frame
scene.add(warmFogMesh);

// SACRED SHAFT COLUMN — god ray in the gobo beam path.
// Gives the shaft air-mass: light you feel, not just see.
// Positioned along beam from (-2, 16, 5) → (0.5, 0, 1.5), mid-column at y≈6.
const godRayMat = new THREE.ShaderMaterial({
  uniforms: { uTime: { value: 0 }, uOpacity: { value: 0.14 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `
    uniform float uTime, uOpacity;
    varying vec2 vUv;
    void main() {
      float sx = exp(-pow((vUv.x - 0.5) * 5.5, 2.0));
      float sy = smoothstep(0.0, 0.10, vUv.y) * smoothstep(1.0, 0.38, vUv.y);
      float breath = 0.90 + 0.10 * sin(uTime * 0.38 + vUv.y * 2.5);
      vec3 col = mix(vec3(1.0, 0.96, 0.85), vec3(1.0, 0.80, 0.48), vUv.y * 0.8);
      float a = sx * sy * uOpacity * breath;
      if (a < 0.003) discard;
      gl_FragColor = vec4(col, a);
    }
  `,
  transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
});
const godRayMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 13), godRayMat);
// Along beam midpoint: lerp((-2,16,5), (0.5,0,1.5), 0.55) ≈ (-0.6, 7.2, 3.1)
godRayMesh.position.set(-0.6, 7.2, 3.1);
godRayMesh.rotation.y = Math.PI * 0.10; // slight tilt toward camera, follows beam oblique
// v6: DISABLED — this vertical plane reads as a hard diagonal "light leak" streak to the left of
// the cube on mobile (camera sees it nearly edge-on; 13m tall × 0.55m wide at y≈7 = bright line).
// The shaft air-mass concept is now carried by the arch floor stamp + boosted gobo instead.
godRayMesh.visible = false;
// scene.add(godRayMesh); // v80: arch disabled

// ARCH FLOOR STAMP — additive overlay guarantees pointed arch reads on mobile.
// SpotLight.map gobo irradiance on dark floor (albedo 0x18182a) is PBR-dim vs AdditiveBlending rays.
// This stamp uses the same arch texture laid flat: additive blend, black areas contribute 0,
// white arch interior adds warm amber directly. UV orientation with rotation.x=-PI/2 + canvas flipY:
//   canvas bottom (legs, y≈0.99*sz) → UV V≈0 → world +Z (toward camera) ✓
//   canvas top   (tip,  y≈0.04*sz) → UV V≈1 → world -Z (away, behind cube) ✓
// Result: legs open toward camera in lower frame, pointed tip visible above/behind cube. Sacred arch read.
// ARCH STAMPS REMOVED v276 — bloom + floor meshes disabled since v80, texture generator removed

// ─── VOLUMETRIC LIGHT SHAFT ──────────────────────────────────────────────────
// v66: visible beam through air — PlaneGeometry aligned from gobo source toward floor.
// Custom ShaderMaterial: vertical falloff (bright at floor, fades toward source) +
// horizontal Gaussian (bright center, soft edges) + subtle animated noise for dust.
const _shaftMat = new THREE.ShaderMaterial({
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  side: THREE.DoubleSide,
  uniforms: {
    time: { value: 0 },
    color: { value: new THREE.Color(0xffc870) },
    op: { value: 0.07 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float time;
    uniform vec3 color;
    uniform float op;
    varying vec2 vUv;
    // simple hash noise
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1,0)), f.x),
                 mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
    }
    void main() {
      // horizontal: Gaussian bell (bright center, soft edges)
      float hx = exp(-pow((vUv.x - 0.5) * 3.2, 2.0));
      // vertical: brighter toward bottom (floor), fades toward top (source)
      float vy = pow(1.0 - vUv.y, 1.5);
      // dust motes — slow drift
      float dust = noise(vUv * 8.0 + vec2(time * 0.15, time * 0.08));
      dust = 0.7 + 0.3 * dust;
      float a = hx * vy * dust * op;
      gl_FragColor = vec4(color, a);
    }
  `
});

// Plane oriented to match the gobo→floor diagonal
const shaftGeo = new THREE.PlaneGeometry(5, 16);
const shaftMesh = new THREE.Mesh(shaftGeo, _shaftMat);
window._shaftMat = _shaftMat;
// Position: midpoint between gobo (-6,16,3) and floor target (~-1.5,0,-0.5)
shaftMesh.position.set(-3.8, 8, 1.2);
// Rotate to align with beam angle — tilt back and diagonal
shaftMesh.rotation.set(-0.15, -Math.PI * 0.2, 0.08);
shaftMesh.renderOrder = 0;
// scene.add(shaftMesh); // v80: arch disabled

// ─── PRISM GROUP ──────────────────────────────────────────────────────────────
const prismGroup = new THREE.Group();
scene.add(prismGroup);
const CUBE_Y = 0.57;

// ─── FBO DICHROIC GLASS SHADER ────────────────────────────────────────────────
const dichroicVert = `
  varying vec3 vViewNormal;
  varying vec3 vViewDir;
  varying vec3 vLocalPos;
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  void main() {
    vLocalPos = position;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewNormal = normalize(normalMatrix * normal);
    vViewDir = -mvPos.xyz; // DO NOT normalize here — interpolation of normalized vectors creates triangle-edge seams
    gl_Position = projectionMatrix * mvPos;
  }
`;

const dichroicFrag = `
  uniform sampler2D uScene;
  uniform vec2      uRes;
  uniform float     uIorR, uIorG, uIorB;
  uniform float     uAb;
  uniform float     uDich;
  uniform float     uFresnel;
  uniform float     uTime;
  uniform float     uAspect;
  uniform vec3      uSpecLightPos;
  uniform vec3      uCamWorldPos;
  uniform float     uSpecIntensity;
  uniform float     uInternalGlow;
  // CubeEnvMap removed — no irradiance probes

  // ── LTC RectAreaLight uniforms ────────────────────────────────────────────
  uniform sampler2D ltc_1;     // LTC matrix LUT (64×64 RGBA half-float)
  uniform sampler2D ltc_2;     // Fresnel/energy LUT (64×64 RGBA half-float)
  uniform vec3      uRect0Pos;
  uniform vec3      uRect0HW;
  uniform vec3      uRect0HH;
  uniform vec3      uRect0Color;

  varying vec3 vViewNormal;
  varying vec3 vViewDir;
  varying vec3 vLocalPos;
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;

  vec3 thinFilm(float cosT, float t) {
    float p = 6.28318 * 5.0 * cosT + t * 0.25;
    return vec3(0.5+0.5*cos(p), 0.5+0.5*cos(p-2.094), 0.5+0.5*cos(p+2.094));
  }

  // ── LTC Math — Linearly Transformed Cosines (Heitz et al. 2016) ──────────
  // Self-contained — no Three.js chunk dependencies.

  vec2 ltcUv(vec3 N, vec3 V, float roughness) {
    const float LUT_SIZE  = 64.0;
    const float LUT_SCALE = (LUT_SIZE - 1.0) / LUT_SIZE;
    const float LUT_BIAS  = 0.5 / LUT_SIZE;
    float dotNV = clamp(dot(N, V), 0.0, 1.0);
    vec2 uv = vec2(roughness, sqrt(1.0 - dotNV));
    return uv * LUT_SCALE + LUT_BIAS;
  }

  float ltcClippedSphere(vec3 f) {
    float l = length(f);
    return max((l * l + f.z) / (l + 1.0), 0.0);
  }

  vec3 ltcEdgeVector(vec3 v1, vec3 v2) {
    float x = dot(v1, v2);
    float y = abs(x);
    float a = 0.8543985 + (0.4965155 + 0.0145206 * y) * y;
    float b = 3.4175940 + (4.1616724 + y) * y;
    float v = a / b;
    float theta_sintheta = (x > 0.0)
        ? v
        : 0.5 * inversesqrt(max(1.0 - x * x, 1e-7)) - v;
    return cross(v1, v2) * theta_sintheta;
  }

  float ltcEvaluate(vec3 N, vec3 V, vec3 P, mat3 mInv, vec3 rectCoords[4]) {
    // Back-face cull
    vec3 bv1 = rectCoords[1] - rectCoords[0];
    vec3 bv2 = rectCoords[3] - rectCoords[0];
    if (dot(cross(bv1, bv2), P - rectCoords[0]) < 0.0) return 0.0;

    // Build ONB around N, transform rect corners into LTC space
    vec3 T1 = normalize(V - N * dot(V, N));
    vec3 T2 = -cross(N, T1);
    mat3 mat = mInv * transpose(mat3(T1, T2, N));

    vec3 c0 = normalize(mat * (rectCoords[0] - P));
    vec3 c1 = normalize(mat * (rectCoords[1] - P));
    vec3 c2 = normalize(mat * (rectCoords[2] - P));
    vec3 c3 = normalize(mat * (rectCoords[3] - P));

    vec3 vff = ltcEdgeVector(c0, c1)
             + ltcEdgeVector(c1, c2)
             + ltcEdgeVector(c2, c3)
             + ltcEdgeVector(c3, c0);
    return ltcClippedSphere(vff);
  }

  // Evaluate one RectAreaLight's LTC specular contribution on glass.
  // Takes flat vec3 args (avoids GLSL struct uniform limitations).
  vec3 rectLtcContrib(vec3 lpos, vec3 lhw, vec3 lhh, vec3 lcol,
                      vec3 worldPos, vec3 N, vec3 V, float roughness) {
    // Build the four rect corners in world space
    vec3 rectCoords[4];
    rectCoords[0] = lpos + lhw - lhh;
    rectCoords[1] = lpos - lhw - lhh;
    rectCoords[2] = lpos - lhw + lhh;
    rectCoords[3] = lpos + lhw + lhh;

    vec2 uv  = ltcUv(N, V, roughness);
    vec4 t1  = texture2D(ltc_1, uv);
    vec4 t2  = texture2D(ltc_2, uv);

    mat3 mInv = mat3(
      vec3(t1.x, 0.0, t1.y),
      vec3(0.0,  1.0, 0.0),
      vec3(t1.z, 0.0, t1.w)
    );

    // Glass F0 ≈ 0.04 (dielectric at normal incidence)
    vec3 F0      = vec3(0.04);
    vec3 fresnel = F0 * t2.x + (1.0 - F0) * t2.y;

    float spec = ltcEvaluate(N, V, worldPos, mInv, rectCoords);
    return lcol * fresnel * spec;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    vec3 n  = normalize(vViewNormal);
    vec3 e  = normalize(vViewDir);

    // ── Per-face optical differentiation (Chris lookdev, Mar 3) ──────────
    // Each cube face should read as a distinct optical surface — different
    // chromatic spread, different refraction depth, different dichroic band.
    // Use world normal to identify which face dominates this fragment.
    vec3 Nabs = abs(normalize(vWorldNormal));
    // Face weights: how much this fragment belongs to each axis face
    float faceX = smoothstep(0.6, 0.95, Nabs.x); // side faces (left/right)
    float faceY = smoothstep(0.6, 0.95, Nabs.y); // top/bottom
    float faceZ = smoothstep(0.6, 0.95, Nabs.z); // front/back

    // Per-face IOR shift — each face bends light at a different spread
    // Side: wider red-blue split (strongly prismatic). Top: blue-shifted, tight.
    // Front: green-shifted, medium spread. Creates distinct chromatic character.
    float iorShiftR = faceX * 0.05 - faceY * 0.04 + faceZ * (-0.015);
    float iorShiftG = faceX * (-0.025) + faceY * 0.03 - faceZ * 0.03;
    float iorShiftB = faceX * (-0.045) + faceY * 0.02 + faceZ * 0.045;
    float iorR = uIorR + iorShiftR;
    float iorG = uIorG + iorShiftG;
    float iorB = uIorB + iorShiftB;

    // Per-face aberration strength — side faces get MORE spread, top gets LESS
    float abScale = 1.0 + faceX * 0.35 - faceY * 0.3 + faceZ * 0.15;

    // Per-face dichroic band: rotate the diagonal axis per face
    // Side: x-y diagonal (default). Top: x-z sweep. Front: y-z sweep.
    // Stronger rotation so bands run in clearly different directions.
    float diagInput = vLocalPos.x + vLocalPos.y
                    + faceY * (vLocalPos.z * 1.4 - vLocalPos.y * 0.7)
                    + faceZ * (vLocalPos.y * 1.1 - vLocalPos.x * 0.8);
    float diagRaw = sin(diagInput * 1.8) * 0.5 + 0.5; // gentle wave, no peaked line
    float diagF = diagRaw * uDich;
    vec3  dn    = normalize(mix(n, normalize(vec3(1.0, 1.0, 0.0)), diagF * 0.08));

    vec3 rR = refract(-e, dn, 1.0/iorR);
    vec3 rG = refract(-e, dn, 1.0/iorG);
    vec3 rB = refract(-e, dn, 1.0/iorB);
    if(length(rR)<0.001) rR = -e;
    if(length(rG)<0.001) rG = -e;
    if(length(rB)<0.001) rB = -e;

    // Per-face UV offset — each face samples a distinctly different FBO region
    // Larger offsets = more visual separation between faces
    vec2 faceUvOff = vec2(
      dot(normalize(vWorldNormal), vec3(0.025, -0.015, 0.018)),
      dot(normalize(vWorldNormal), vec3(-0.018, 0.022, -0.013))
    );
    vec2 abXY = vec2(uAb / uAspect, uAb) * abScale;
    float R = texture2D(uScene, clamp(uv + faceUvOff + rR.xy * abXY, 0.001, 0.999)).r;
    float G = texture2D(uScene, clamp(uv + faceUvOff + rG.xy * abXY, 0.001, 0.999)).g;
    float B = texture2D(uScene, clamp(uv + faceUvOff + rB.xy * abXY, 0.001, 0.999)).b;
    vec3 refracted = vec3(R, G, B);

    float cosT   = clamp(dot(e, n), 0.0, 1.0);
    float fresnel = pow(1.0 - cosT, uFresnel);
    vec3 irid = thinFilm(cosT, uTime);

    // ── World-space lighting vectors (shared by all world-space effects) ──
    vec3 Nw = normalize(vWorldNormal);
    vec3 Vw = normalize(uCamWorldPos - vWorldPos);

    // ── Transmission: boost brightness — dichroic glass is bright, not dark ──
    // Slight blue-green tint is physically correct for optical glass (kills warm artifacts)
    // Bottom-face attenuation: reduce transmission where normal faces down (cubeSun direct hit)
    // Bottom-face attenuation: strong clamp preserves prismatic color in the hotspot
    float bottomAtten = 1.0 - 0.55 * smoothstep(-0.3, -0.95, Nw.y);
    vec3 col = refracted * vec3(1.00, 1.00, 1.00) * 2.8 * bottomAtten;

    // ── Dichroic iridescence: surface-only, tight diagonal band ──
    col = mix(col, col * irid * 1.4, diagF * 0.22);
    col += irid * diagF * fresnel * 0.12;

    // ── Fresnel edge: cool blue-white, sharp (glass = cold at edges) ──
    col += vec3(0.80, 0.92, 1.00) * fresnel * 0.40;

    // ── Side-face ambient: subtle fill so faces read as glass even without strong light ──
    // Boosted to prevent the right face reading as a dark void during orbit
    float sideFacing = 1.0 - abs(Nw.y); // peaks on vertical faces
    col += vec3(0.22, 0.28, 0.45) * sideFacing * 0.00;

    // ── Sky/environment reflection: top face catches overhead light ──
    // v155 scored 8.9 at 0.45 but top was slightly hot. Dial back to 0.38.
    float skyFacing = max(Nw.y, 0.0);
    col += pow(skyFacing, 1.8) * vec3(0.90, 0.94, 1.00) * 0.06;

    // ── Edge catch: crisp rim light at silhouette — "you could cut yourself" ──
    float NdotV = max(dot(Nw, Vw), 0.0);
    float edgeCatch = pow(1.0 - NdotV, 4.5);
    col += vec3(0.70, 0.85, 1.00) * edgeCatch * 1.30;

    // ── Shadow-side glass fill: subtle reflected skylight on faces facing away from key ──
    // Without this, faces in shadow read as dark solid rather than dark glass.
    // Key light comes from camera-left/behind (cubeSun at 0,0.2,-2.8 + cubeBack at 0.5,10,-5).
    // Shadow side = faces with positive Nw.x (facing right).
    float shadowSide = smoothstep(0.1, 0.7, Nw.x) * sideFacing; // right-facing vertical faces
    col += vec3(0.15, 0.18, 0.30) * shadowSide * 0.00; // cool blue fill, subtle
    // Also boost Fresnel on shadow side — glass edge reads even without direct light
    col += vec3(0.50, 0.60, 0.80) * edgeCatch * shadowSide * 0.05;

    // ── Specular: razor-sharp needle, only at grazing (no 0.4 ambient) ──
    vec3 Lw = normalize(uSpecLightPos - vWorldPos);
    vec3 Hw = normalize(Lw + Vw);
    float fresnelW = pow(1.0 - NdotV, 4.0);
    float spec = pow(max(dot(Nw, Hw), 0.0), 256.0);
    col += vec3(1.00, 0.97, 0.95) * uSpecIntensity * spec * fresnelW;

    // ── LTC RectAreaLight specular contribution ───────────────────────────
    // Physically correct soft rectangular highlight via Linearly Transformed
    // Cosines. Roughness 0.08 = smooth glass (sharp but area-shaped).
    // Takes on dichroic iridescence at band intersections.
    float glassRoughness = 0.08;
    vec3 rectSpec = rectLtcContrib(uRect0Pos, uRect0HW, uRect0HH, uRect0Color,
                                   vWorldPos, Nw, Vw, glassRoughness);
    // Fresnel-weight: area light highlight strongest at grazing angles
    rectSpec *= (0.3 + 0.7 * fresnelW);
    // Subtle dichroic color bleed into the rect highlight
    rectSpec  = mix(rectSpec, rectSpec * irid, diagF * 0.35);
    col += rectSpec;

    // ── Internal glow (prayer-time animation only, off by default) ──
    float glowFresnel = pow(1.0 - cosT, 2.5);
    vec3 glowCol = mix(vec3(0.85, 0.92, 1.00), vec3(0.70, 0.85, 1.00), glowFresnel);
    col += glowCol * uInternalGlow * (0.2 + 0.8 * glowFresnel);

    // ── Top-face dichroic iridescence (Chris lookdev, Mar 3) ──
    // At 33° elevation the top face normal faces the camera at NdotV ≈ 0.54.
    // Real dichroic glass shows thin-film interference at this angle — color shifts
    // as the view angle changes. Previously this was a flat scrim that killed the glass read.
    // ── Top-face dichroic iridescence (reverted to v155 approach — scored 8.9) ──
    float topFace = smoothstep(0.5, 0.92, Nw.y);
    vec3 topIrid = thinFilm(NdotV, uTime * 0.4);
    // Blend: multiplicative color tint + subtle additive shimmer.
    col = mix(col, col * topIrid * 1.6 + topIrid * 0.18, topFace * 0.40);
    // Fresnel color shift at grazing angles
    float topFresnel = pow(1.0 - NdotV, 3.0) * topFace;
    col += vec3(0.25, 0.15, 0.55) * topFresnel * 0.15;
    // Top-face iridescence applied above

    // ── Bottom-face glow: cool emission separates cube from dark podium ──
    // ── Bottom-face effects removed (v568) — uniform rim reverted (v574) ──

    gl_FragColor = vec4(col, 1.0);
  }
`;

const cubeMat = new THREE.ShaderMaterial({
  uniforms: {
    uScene:   { value: null },
    uRes:     { value: new THREE.Vector2(W * dpr, H * dpr) },
    uIorR:    { value: 1.50 },
    uIorG:    { value: 1.56 },
    uIorB:    { value: 1.63 },
    uAb:      { value: 0.09 },
    uDich:    { value: 0.70 },
    uFresnel: { value: 4.0 },
    uTime:    { value: 0 },
    uAspect:  { value: W / H },
    uSpecLightPos: { value: new THREE.Vector3(2.5, 4.0, 2.5) },
    uCamWorldPos:  { value: new THREE.Vector3() },
    uSpecIntensity: { value: 2.8 },
    uInternalGlow:  { value: 0.0 }, // crystal-fix: 0.24→0.0 — warm amber emission = jello/subsurface. Crystal is cold.
    // CubeEnvMap uniforms removed — no probes
    // ── LTC RectAreaLight (wired after RectAreaLightUniformsLib.init()) ──
    ltc_1:       { value: null },
    ltc_2:       { value: null },
    uRect0Pos:   { value: new THREE.Vector3() },
    uRect0HW:    { value: new THREE.Vector3() },
    uRect0HH:    { value: new THREE.Vector3() },
    uRect0Color: { value: new THREE.Color() },
  },
  vertexShader: dichroicVert,
  fragmentShader: dichroicFrag,
  side: THREE.FrontSide,
});

const cubeGroup = new THREE.Group();
const cubeMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2, 4, 4, 4), cubeMat);
cubeMesh.position.y = CUBE_Y;
cubeMesh.castShadow = true;
cubeGroup.add(cubeMesh);
prismGroup.add(cubeGroup);
prismGroup.rotation.y = Math.PI / 4;

// ─── PODIUM ───────────────────────────────────────────────────────────────────
// 110% cube width, same rotation. Top at y=0 (cube bottom), extends down
// well below floor so it reads as a column going into the ground.
const PODIUM_W = 1.2 * 2.2; // 2.64 — double the cube width
const PODIUM_H = 20; // tall enough to extend past any visible floor
// Per-face materials: BoxGeometry groups = +x, -x, +y, -y, +z, -z
// ── Podium materials (Chris lookdev, Mar 3) ──
// Design intent: polished obsidian monolith — catches cube light, breathes with prayer color.
// High clearcoat + low roughness = glass-like specular reflections on column faces.
// Podium materials reverted to pre-reactive state — static emissive, no envMap reactivity
// Podium materials: polished obsidian. Top face = high clearcoat for light pools.
const podiumBase = { roughness: 0.35, metalness: 0.06, clearcoat: 0.5, clearcoatRoughness: 0.12, color: 0x1a1a28, fog: false }; // v7: 0x12121c→0x2a2a3a — lift from near-black so colored SpotLights can paint it (PBR: diffuse = light×surface)
const podiumMats = [
  new THREE.MeshPhysicalMaterial({ ...podiumBase, emissive: 0x606098, emissiveIntensity: 3.5 }), // +x right — KEY face
  new THREE.MeshPhysicalMaterial({ ...podiumBase, emissive: 0x141424, emissiveIntensity: 0.7 }), // -x left — edge hint
  new THREE.MeshPhysicalMaterial({ ...podiumBase, emissive: 0x141428, emissiveIntensity: 0.8, roughness: 0.55, clearcoat: 0.15, clearcoatRoughness: 0.20 }), // +y top — roughened for sun spot diffuse read
  new THREE.MeshPhysicalMaterial({ ...podiumBase, emissive: 0x020204, emissiveIntensity: 0.1 }), // -y bottom — invisible
  new THREE.MeshPhysicalMaterial({ ...podiumBase, emissive: 0x161630, emissiveIntensity: 0.9 }), // +z front — FILL face
  new THREE.MeshPhysicalMaterial({ ...podiumBase, emissive: 0x030306, emissiveIntensity: 0.1 }), // -z back — hidden
];
const podiumMesh = new THREE.Mesh(
  new THREE.BoxGeometry(PODIUM_W, PODIUM_H, PODIUM_W),
  podiumMats
);
podiumMesh.position.y = -PODIUM_H / 2 - 0.03; // top face just below hand beams (y≈0.008) — whisper gap
podiumMesh.receiveShadow = true;
podiumMesh.castShadow = true;
podiumMesh.visible = true;
scene.add(podiumMesh); // axis-aligned (0°) — sides visible while cube rotates 45°

// ── CONCRETE TEXTURE (Look 01 — Gallery Diagonal) ──────────────────────────
{
  const _tl = new THREE.TextureLoader();
  _tl.load('concrete-plinth.jpg', function(cm) {
    cm.wrapS = cm.wrapT = THREE.RepeatWrapping;
    cm.repeat.set(2, 4);
    cm.colorSpace = THREE.SRGBColorSpace;
    _tl.load('concrete-plinth-normal.jpg', function(nm) {
      nm.wrapS = nm.wrapT = THREE.RepeatWrapping;
      nm.repeat.set(2, 4);
      _tl.load('concrete-plinth-rough.jpg', function(rm) {
        rm.wrapS = rm.wrapT = THREE.RepeatWrapping;
        rm.repeat.set(2, 4);
        // Apply to all visible faces
        podiumMats.forEach(function(mat) {
          mat.map = cm;
          mat.normalMap = nm;
          mat.normalScale.set(0.5, 0.5);
          mat.roughnessMap = rm;
          mat.needsUpdate = true;
        });
        window._texturesReady = true; // gate _sceneReady on this
      });
    });
  });
}

// ── PRAYER-DRIVEN PLINTH LIGHTING ───────────────────────────────────────────
// Front RectAreaLight + rear SpotLight interpolate between looks per prayer.
// Only these two lights change — everything else in the rig is untouched.
RectAreaLightUniformsLib.init();

// Wire LTC lookup textures into cubeMat — uses half-float for max mobile compat.
// LTC_HALF_1/2 work on iOS 15+ WebGL 2 (A12+ with LinearFilter support).
cubeMat.uniforms.ltc_1.value = THREE.UniformsLib.LTC_HALF_1;
cubeMat.uniforms.ltc_2.value = THREE.UniformsLib.LTC_HALF_2;

// ── Per-frame rect light → cubeMat uniform updater ────────────────────────
// halfWidth/halfHeight are world-space vectors: local axis * half-dimension,
// rotated by the light's matrixWorld. Must be recomputed each frame because
// the plinth lights interpolate position and lookAt target continuously.
var _rlu_pos = new THREE.Vector3();
var _rlu_hw  = new THREE.Vector3();
var _rlu_hh  = new THREE.Vector3();
function _updateRectLightUniform(light) {
  _rlu_pos.setFromMatrixPosition(light.matrixWorld);
  // local X * width/2, rotated to world — sub position to get direction vector
  _rlu_hw.set(light.width / 2, 0, 0).applyMatrix4(light.matrixWorld).sub(_rlu_pos);
  // local Y * height/2, rotated to world
  _rlu_hh.set(0, light.height / 2, 0).applyMatrix4(light.matrixWorld).sub(_rlu_pos);
  cubeMat.uniforms.uRect0Pos.value.copy(_rlu_pos);
  cubeMat.uniforms.uRect0HW.value.copy(_rlu_hw);
  cubeMat.uniforms.uRect0HH.value.copy(_rlu_hh);
  cubeMat.uniforms.uRect0Color.value.copy(light.color).multiplyScalar(light.intensity);
}

var _plinthRect = new THREE.RectAreaLight(0xddddf8, 8, 6, 3);
_plinthRect.position.set(-2, -8, 4);
_plinthRect.lookAt(1, 0, 1.32);
scene.add(_plinthRect);

var _plinthSpot = new THREE.SpotLight(0xddddf8, 24, 20, 0.5, 0.6, 1);
_plinthSpot.position.set(3, 3, -1.5);
_plinthSpot.target.position.set(-1, -0.5, 1.5);
scene.add(_plinthSpot);
scene.add(_plinthSpot.target);

// Prayer → lighting look presets (raised to hit cube + upper plinth)
// bc/bi = back SpotLight color/intensity (FBO background wash — controls glass opacity feel)
// cc/ci = cubeBack SpotLight color/intensity (glass transmission key)
// ui    = cubeSun PointLight intensity (dichroic dispersion driver)
// GLASS RULE: lower back intensity → less blue wash → more transparent. Keep bc dark for warm prayers.
var _plinthLooks = {
  // Look 01 — Gallery Diagonal (Dhuhr + Asr) — crisp noon/afternoon, cool-white glass
  gallery:   { rc: 0xddddf8, ri: 8,    rp: [-2,-8,4],       rt: [1,0,1.32],
               sc: 0xddddf8, si: 24,   sp: [3,3,-1.5],      st: [-1,-0.5,1.5],
               bc: 0x3038c8, bi: 18,   cc: 0xeef2ff, ci: 10, ui: 42 },
  // Look 03 — Ando Chapel (Qiyam + Isha) — night monolith, deep navy glass
  ando:      { rc: 0xd7e2ff, ri: 11.6, rp: [-2.7,-1.5,0.8], rt: [0.15,0.5,1.0],
               sc: 0xd7e2ff, si: 12,   sp: [2.7,3,0.8],     st: [-0.15,-0.5,1.0],
               bc: 0x1a1a80, bi: 12,   cc: 0x9096e8, ci: 4,  ui: 22 },
  // Look 07 — Void Before Dawn (Last Third) — deepest pre-fajr darkness, barely-lit glass
  lasthird:  { rc: 0xb8c8ff, ri: 10.2, rp: [-2.8,-1.8,0.6], rt: [0.12,0.4,1.0],
               sc: 0xc0caff, si: 9,    sp: [2.8,3,0.6],     st: [-0.12,-0.5,1.0],
               bc: 0x160a58, bi: 8,    cc: 0x6060b8, ci: 3,  ui: 18 },
  // Look 06 — Deakins Ember (Fajr + Sunrise) — pre-dawn indigo, warm transmission
  deakins:   { rc: 0xFFC188, ri: 11.3, rp: [-3.5,-4,3.2],   rt: [0.65,1.0,1.35],
               sc: 0x9AB8E8, si: 14,   sp: [2.8,3,-2.4],    st: [-0.15,-0.5,0.95],
               bc: 0x2c1840, bi: 10,   cc: 0xffd0a0, ci: 9,  ui: 38 },
  // Look 02 — Turrell Void (Dhuha) — golden morning, cool-violet back contrasts amber plinth
  turrell:   { rc: 0x9eb8ff, ri: 10.5, rp: [-3.2,-2,5.6],   rt: [0.2,1.0,1.0],
               sc: 0xffb46e, si: 12,   sp: [2.6,3,2.7],     st: [-0.4,-0.5,1.2],
               bc: 0x302878, bi: 14,   cc: 0xffc070, ci: 8,  ui: 28 },
  // Look 04 — Mihrab Moonbeam (Maghrib) — sunset, dark back so warm plinth breathes
  mihrab:    { rc: 0xBFD4FF, ri: 12.9, rp: [-3.1,-1,1.6],   rt: [0.25,0.6,1.1],
               sc: 0xFFB978, si: 10,   sp: [2.0,3,2.5],     st: [-0.2,-0.5,1.0],
               bc: 0x180a30, bi: 7,    cc: 0xff9860, ci: 5,  ui: 22 },
};

// Prayer name → look mapping
var _prayerLookMap = {
  'Qiyam':      'ando',
  'Last Third': 'lasthird',
  'Fajr':       'deakins',
  'Sunrise':    'deakins',
  'Dhuha':      'turrell',
  'Dhuhr':      'gallery',
  'Asr':        'gallery',
  'Maghrib':    'mihrab',
  'Isha':       'ando',
};

var _plinthLerpRate = 0.02; // smooth ~2s transition
var _curPlinthLook = _plinthLooks.gallery; // start with gallery

// Helper: hex to THREE.Color
function _hexC(h) { return new THREE.Color(h); }

// Called each frame in render loop to interpolate plinth lights
var _plinthRectColor = new THREE.Color(0xddddf8);
var _plinthSpotColor = new THREE.Color(0xddddf8);
var _plinthRectPos = new THREE.Vector3(-2, -8, 4);
var _plinthRectTarget = new THREE.Vector3(1, 0, 1.32);
var _plinthSpotPos = new THREE.Vector3(3, 3, -1.5);
var _plinthSpotTarget = new THREE.Vector3(-1, -0.5, 1.5);
var _plinthRectIntensity = 8;
var _plinthSpotIntensity = 24;
// Lerp state for back/cubeBack/cubeSun — prayer-driven glass opacity control
var _backLerpColor = new THREE.Color(0x4040a0);
var _backLerpIntensity = 50;
var _cubeBackLerpColor = new THREE.Color(0xffeedd);
var _cubeBackLerpIntensity = 7;
var _cubeSunLerpIntensity = 30;

var _lastPlinthPrayer = 'gallery'; // remember last active prayer's look
function _updatePlinthLighting() {
  if (window._lookPreviewActive) return; // look preview mode — don't fight manual values
  var pName = window._swipePreviewPrayer || null;
  if (pName && _prayerLookMap[pName]) _lastPlinthPrayer = _prayerLookMap[pName];
  var lookKey = pName ? (_prayerLookMap[pName] || _lastPlinthPrayer) : _lastPlinthPrayer;
  var target = _plinthLooks[lookKey] || _plinthLooks.gallery;
  var lr = _plinthLerpRate;

  // Lerp rect light
  var tc = _hexC(target.rc);
  _plinthRectColor.lerp(tc, lr);
  _plinthRect.color.copy(_plinthRectColor);
  _plinthRectIntensity += (target.ri - _plinthRectIntensity) * lr;
  _plinthRect.intensity = _plinthRectIntensity;
  _plinthRectPos.lerp(new THREE.Vector3(...target.rp), lr);
  _plinthRect.position.copy(_plinthRectPos);
  _plinthRectTarget.lerp(new THREE.Vector3(...target.rt), lr);
  _plinthRect.lookAt(_plinthRectTarget);

  // Lerp spot light
  var tsc = _hexC(target.sc);
  _plinthSpotColor.lerp(tsc, lr);
  _plinthSpot.color.copy(_plinthSpotColor);
  _plinthSpotIntensity += (target.si - _plinthSpotIntensity) * lr;
  _plinthSpot.intensity = _plinthSpotIntensity;
  _plinthSpotPos.lerp(new THREE.Vector3(...target.sp), lr);
  _plinthSpot.position.copy(_plinthSpotPos);
  _plinthSpotTarget.lerp(new THREE.Vector3(...target.st), lr);
  _plinthSpot.target.position.copy(_plinthSpotTarget);

  // ── Back fill + glass transmission lights — prayer-driven glass opacity control ──
  // back SpotLight: dominates FBO background color → directly sets cube's glass tint.
  // Reducing intensity prevents the blue-block artifact on warm prayers.
  // cubeBack SpotLight: grazes cube from above-rear, adds transmission color.
  // cubeSun PointLight: powers dichroic dispersion — lower = less rainbow visible.
  if (target.bc !== undefined) {
    var tBc = _hexC(target.bc);
    _backLerpColor.lerp(tBc, lr);
    back.color.copy(_backLerpColor);
    _backLerpIntensity += (target.bi - _backLerpIntensity) * lr;
    back.intensity = _backLerpIntensity;
  }
  if (target.cc !== undefined) {
    var tCc = _hexC(target.cc);
    _cubeBackLerpColor.lerp(tCc, lr);
    cubeBack.color.copy(_cubeBackLerpColor);
    _cubeBackLerpIntensity += (target.ci - _cubeBackLerpIntensity) * lr;
    cubeBack.intensity = _cubeBackLerpIntensity;
  }
  if (target.ui !== undefined) {
    _cubeSunLerpIntensity += (target.ui - _cubeSunLerpIntensity) * lr;
    cubeSun.intensity = _cubeSunLerpIntensity;
  }
}

// ── PODIUM SCENE LIGHTS (no probes, no envMap, no reactive emissive) ──────────
// Just two scene lights to illuminate the podium surface. No material changes.
// Warm SpotLight: hits the front face (camera-visible) from above-forward
const podiumFrontWash = new THREE.SpotLight(0xc0a880, 12);
podiumFrontWash.position.set(0, 4.0, 6.0);
podiumFrontWash.target.position.set(0, -2.5, 0);
podiumFrontWash.angle = 0.50; podiumFrontWash.penumbra = 0.75;
podiumFrontWash.decay = 1.2; podiumFrontWash.distance = 12;
podiumFrontWash.castShadow = false;
scene.add(podiumFrontWash, podiumFrontWash.target);
// Lower fill: very subtle, reveals podium form without flattening
// PODIUM LOW FILL REMOVED v275 — podiumFrontWash covers podium

// ── PRAYER GLOW — PointLight at podium base (Approach B, Chris v7) ──────────
// PointLight has no surface-color dependency — paints everything in radius.
// Positioned just below cube, inside podium top face gap. Subtle sacred glow.
const prayerGlow = new THREE.PointLight(0x111122, 0, 2.5); // v8c: very tight radius — cube-only glow, no podium spill
prayerGlow.position.set(0, 0.57, 0);   // v8: at cube center — colored glow emanates from within
prayerGlow.castShadow = false;
scene.add(prayerGlow);
const _prayerGlowColor = new THREE.Color(0x111122);
let _prayerGlowIntensity = 0;
const PRAYER_GLOW_MAX = 0.8; // v8d: barely-there inner glow — cube tint only

// ─── SPECTRAL CLOCK HANDS ─────────────────────────────────────────────────────
// Three floor rays as H / M / S clock hands, synced to real time.
// Lengths stepped by golden ratio φ from second hand.
const TAU = Math.PI * 2;
const clockRays = [];

const VERT = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;
const FRAG = `
  uniform vec3 c1,c2; uniform float op; varying vec2 vUv;
  void main(){
    vec3 col=mix(c1,c2,pow(clamp(vUv.y,0.,1.),0.6));
    float sx=exp(-pow((vUv.x-0.5)*5.6,2.0));  // 4.8→5.6 — tighter beam, precision optics feel
    float sy=smoothstep(0.0,0.08,vUv.y)*smoothstep(1.0,0.36,vUv.y);
    gl_FragColor=vec4(col,sx*sy*op);
  }
`;
function mkMat(c1,c2,op){ return new THREE.ShaderMaterial({ uniforms:{c1:{value:new THREE.Color(c1)},c2:{value:new THREE.Color(c2)},op:{value:op}}, vertexShader:VERT, fragmentShader:FRAG, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide }); }

// Soft variant for prayer beams — wider Gaussian (2.2 vs 4.8) = diffuse zone vs sharp needle
const FRAG_SOFT = `
  uniform vec3 c1,c2; uniform float op; varying vec2 vUv;
  void main(){
    vec3 col=mix(c1,c2,pow(clamp(vUv.y,0.,1.),0.6));
    float sx=exp(-pow((vUv.x-0.5)*2.2,2.0));
    float sy=smoothstep(0.0,0.08,vUv.y)*smoothstep(1.0,0.36,vUv.y);
    gl_FragColor=vec4(col,sx*sy*op);
  }
`;
function mkMatSoft(c1,c2,op){ return new THREE.ShaderMaterial({ uniforms:{c1:{value:new THREE.Color(c1)},c2:{value:new THREE.Color(c2)},op:{value:op}}, vertexShader:VERT, fragmentShader:FRAG_SOFT, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide }); }

function floorRay(az, c1, c2, w, len, op) {
  const g = new THREE.PlaneGeometry(w, len, 1, 16); g.translate(0, len/2, 0);
  const grp = new THREE.Group();
  const mesh = new THREE.Mesh(g, mkMat(c1, c2, op));
  grp.add(mesh);
  grp.position.y = 0.008;
  grp.rotation.order = 'YXZ';
  grp.rotation.y = THREE.MathUtils.degToRad(az);
  grp.rotation.x = Math.PI / 2;
  prismGroup.add(grp);
  clockRays.push({ mesh: grp, beam: mesh, len: len, c1: c1, initY: THREE.MathUtils.degToRad(az) });
}

window.clockRays = clockRays;
window._threeRenderer = renderer;
window._threeScene = scene;
window._threeCamera = camera;
window._fboRT = fboRT;
window._cubeMesh = cubeMesh;
window._cubeMat = cubeMat;
window._prayerLights = { wash: prayerWash, rim: prayerRim, slash: prayerSlash, glow: prayerGlow };
// FBO/cube/shaft exposed after creation (lines above)
// clockRays[0] = hour, clockRays[1] = minute, clockRays[2] = second
// initY = 135° (3π/4): compensates for prismGroup.rotation.y = π/4 so that
// at midnight/noon all hands point at visual 12 o'clock (-Z world direction).
floorRay(135, 0x9900ff, 0xff00ff, 0.40, 4.00, 1.45);   // HOUR   (violet)  shorter + wider
floorRay(135, 0x1133ff, 0x00aaff, 0.30, 7.77, 1.50);   // MINUTE (blue)    4.80 × φ
floorRay(135, 0xffffff, 0xcccccc, 0.30, 12.56, 1.20);  // SECOND (white)   4.80 × φ²

// ─── FLOOR CAUSTICS (Chris lookdev Mar 3 — softer, wider pools) ──────────────
// Reduced intensities, wider distance = soft colored pools, not blown white convergence.
// Spread further from cube center so they don't stack into a single hotspot.
[
  {c:0x6600ff,i:1.2,d:3.2,x:-1.8,y:0.06,z:-0.5},
  {c:0x0033ff,i:0.9,d:2.8,x:-1.3,y:0.06,z:-0.9},
  {c:0x00aaff,i:1.6,d:2.8,x: 0.8,y:0.06,z:-1.2},
  {c:0xeeeeff,i:0.7,d:2.0,x: 0.3,y:0.06,z: 0.3},  // was white 1.5 — almost halved
  {c:0xffee00,i:1.2,d:1.8,x: 0.5,y:0.06,z:-0.4},  // was 2.2 — tamed
  {c:0xff8800,i:1.2,d:1.8,x:-0.4,y:0.06,z: 0.2},
  {c:0xff2200,i:1.0,d:1.5,x:-0.6,y:0.06,z:-0.4},
].forEach(({c,i,d,x,y,z})=>{ const pl=new THREE.PointLight(c,i,d); pl.position.set(x,y,z); scene.add(pl); });

// ─── FULLSCREEN HOOK (called by openClockFullscreen in index.html) ─────────────
window._clockSetFullscreen = function(on) {
  _isFullscreen = !!on;
  applyCamera(_isFullscreen ? CAM_FULLSCREEN : CAM_LANDING);
  setTimeout(onResize, 50);
};

// ─── QIBLA COMPASS MODE ───────────────────────────────────────────────────
var _compassMode = false;
var _compassHeading = 0;      // device heading in radians
var _compassQibla = null;     // qibla bearing in radians
var _compassAligned = false;  // true when 12 o'clock ≈ Qibla
var _qiblaFanDisc = null;    // polar spectral fan disc
var _qiblaEntryDisc = null;  // polar entry beam disc
var _qiblaBloomDisc = null;  // wider dim bloom underlayer
var _compassDevMode = /[?&]compass/.test(location.search); // ?compass = dev lookdev mode
var _compassLocked = false;  // true = dev lock, skip gyro sync

// ─── POLAR PRISM SHADERS ──────────────────────────────────────────────────
const FRAG_PRISM_FAN = `
  uniform float op, fanCenter, fanWidth, time;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    float theta = atan(p.y, p.x);
    // Radial: fade in from center (cube zone), Gaussian fade out
    float radial = smoothstep(0.08, 0.20, r) * exp(-r * r * 3.0);
    // Radial intensity: brighter near cube, fading outward (sells "cast by cube")
    float cubeIntensity = 0.5 + 0.5 * smoothstep(0.35, 0.10, r);
    // Angular fan mask
    float ad = mod(theta - fanCenter + 3.14159, 6.28318) - 3.14159;
    float fanPos = ad / fanWidth;
    float fanMask = smoothstep(1.0, 0.55, abs(fanPos));
    // Spectral color: map position through rainbow
    float t2 = fanPos * 0.5 + 0.5; // 0..1
    vec3 col;
    if (t2 < 0.2) {
      col = mix(vec3(0.3, 0.0, 1.0), vec3(0.1, 0.5, 1.0), t2 / 0.2);
    } else if (t2 < 0.4) {
      col = mix(vec3(0.1, 0.5, 1.0), vec3(0.2, 1.0, 0.4), (t2-0.2) / 0.2);
    } else if (t2 < 0.6) {
      col = mix(vec3(0.2, 1.0, 0.4), vec3(1.0, 0.8, 0.0), (t2-0.4) / 0.2);
    } else if (t2 < 0.8) {
      col = mix(vec3(1.0, 0.8, 0.0), vec3(1.0, 0.5, 0.0), (t2-0.6) / 0.2);
    } else {
      col = mix(vec3(1.0, 0.5, 0.0), vec3(1.0, 0.15, 0.1), (t2-0.8) / 0.2);
    }
    // Caustic shimmer
    float shimmer = 0.9 + 0.1 * sin(r * 40.0 + time * 0.5 + theta * 3.0);
    float bandIntensity = 1.0 - 0.3 * pow(abs(fanPos), 2.0);
    gl_FragColor = vec4(col * shimmer, radial * fanMask * bandIntensity * cubeIntensity * op);
  }
`;
const FRAG_ENTRY_BEAM = `
  uniform float op, fanCenter, fanWidth;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    float theta = atan(p.y, p.x);
    float radial = smoothstep(0.02, 0.12, r) * exp(-r * r * 5.0);
    float ad = mod(theta - fanCenter + 3.14159, 6.28318) - 3.14159;
    float fanMask = smoothstep(1.0, 0.4, abs(ad / fanWidth));
    vec3 col = mix(vec3(1.0, 0.98, 0.94), vec3(1.0, 0.85, 0.4), r);
    gl_FragColor = vec4(col, radial * fanMask * op);
  }
`;

function mkPrismDisc(radius, fragShader, fanCenter, fanWidth, opVal) {
  var mat = new THREE.ShaderMaterial({
    uniforms: { op:{value:opVal}, fanCenter:{value:fanCenter}, fanWidth:{value:fanWidth}, time:{value:0} },
    vertexShader: VERT, fragmentShader: fragShader,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
  });
  var mesh = new THREE.Mesh(new THREE.CircleGeometry(radius, 128), mat);
  mesh.rotation.x = -Math.PI / 2; // lay flat on XZ plane
  mesh.position.y = 0.01;
  mesh.visible = false;
  prismGroup.add(mesh);
  return mesh;
}

// Create polar disc beams — replaces card-based PlaneGeometry approach
(function() {
  // Fan points toward 6 o'clock in UV space
  // CircleGeometry on XZ plane: UV atan gives angle where +X = right
  // We orient via the mesh lying flat + prismGroup's existing 45° Y rotation
  // 6 o'clock = -Z in prismGroup local = PI rotation in UV atan
  // But disc is rotated -PI/2 on X to lie flat, so UV +Y maps to -Z
  // fanCenter = PI/2 points "down" in world (toward 6 o'clock from above)
  var fanAngle = Math.PI / 2 - Math.PI / 4 + Math.PI; // flipped 180° to 6 o'clock
  var entryAngle = fanAngle + Math.PI; // opposite = entry beam

  // Layer 1: Spectral fan disc (main rainbow effect)
  _qiblaFanDisc = mkPrismDisc(12, FRAG_PRISM_FAN, fanAngle, 0.35, 0.0);

  // Layer 2: Bloom underlayer (wider, dimmer halo)
  _qiblaBloomDisc = mkPrismDisc(14, FRAG_PRISM_FAN, fanAngle, 0.55, 0.0);

  // Layer 3: Entry beam (narrow white beam from 12 o'clock)
  _qiblaEntryDisc = mkPrismDisc(4, FRAG_ENTRY_BEAM, entryAngle, 0.07, 0.0);

  // Layer 5: Caustic PointLight under cube — makes cube edges glow with fan colors
  var _causticLight = new THREE.PointLight(0xff8844, 0.0, 8);
  _causticLight.position.set(0, -0.3, 0);
  prismGroup.add(_causticLight);
  window._qiblaCausticLight = _causticLight;

  // Set render order: fan after cube
  if(_qiblaFanDisc) _qiblaFanDisc.renderOrder = 1;
  if(_qiblaBloomDisc) _qiblaBloomDisc.renderOrder = 1;
  if(_qiblaEntryDisc) _qiblaEntryDisc.renderOrder = 1;
  window._qiblaFanDisc = _qiblaFanDisc;
  window._qiblaBloomDisc = _qiblaBloomDisc;
  window._qiblaEntryDisc = _qiblaEntryDisc;

  // Dev mode: auto-enable compass in aligned state for lookdev
  if (_compassDevMode) {
    setTimeout(function() {
      _compassMode = true;
      _compassAligned = true;
      _compassLocked = true; // prevent _syncCompassFromAdhan from overwriting
      window._compassCalibrated = true; // required: animation loop checks this to maintain _compassAligned
      _compassQibla = 0.4;
      _compassHeading = 0.4;
      clockRays[0].mesh.children[0].material.uniforms.op.value = 0;
      clockRays[1].mesh.children[0].material.uniforms.op.value = 0;
      clockRays[2].mesh.children[0].material.uniforms.op.value = 0.95;
      clockRays[2].mesh.rotation.y = clockRays[2].initY;
    }, 500);
  }
})();

// ─── ENTRY BEAM STRIP (3D plane entering the cube) ────────────────────────────
var _qiblaEntryBeam = null;
var _qiblaExitCaustic = null;

(function() {
  // Entry beam: wide plane with shader-painted beam (no edge-on artifact)
  // Uses 1.2 x 2.4 plane — shader narrows it to a soft beam shape
  var entryGeo = new THREE.PlaneGeometry(1.2, 2.4);
  var entryMat = new THREE.ShaderMaterial({
    uniforms: { op: { value: 0 }, time: { value: 0 } },
    vertexShader: VERT,
    fragmentShader: `
      uniform float op, time;
      varying vec2 vUv;
      void main() {
        // Soft center falloff — beam shape painted by shader, reads as light
        float cx = exp(-pow((vUv.x - 0.5) * 10.0, 2.0));
        float cy = smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.7, vUv.y);
        float a = cx * cy * op;
        if (a < 0.005) discard;
        float flicker = 0.92 + 0.08 * sin(time * 2.0 + vUv.y * 8.0);
        vec3 col = mix(vec3(1.0, 0.95, 0.85), vec3(1.0, 0.82, 0.5), vUv.y);
        gl_FragColor = vec4(col * flicker, a);
      }
    `,
    transparent: true, blending: THREE.AdditiveBlending,
    depthWrite: false, side: THREE.DoubleSide
  });
  _qiblaEntryBeam = new THREE.Mesh(entryGeo, entryMat);
  // Lay flat on floor, beam extends along -Z (toward 12 o'clock from cube)
  _qiblaEntryBeam.rotation.order = 'YXZ';
  _qiblaEntryBeam.rotation.y = Math.PI; // flip so beam extends toward -Z
  _qiblaEntryBeam.rotation.x = Math.PI / 2;
  _qiblaEntryBeam.position.set(0, 0.01, 0);
  _qiblaEntryBeam.visible = false;
  scene.add(_qiblaEntryBeam);

  // Exit face caustic hotspot: small plane on opposite face, spectral gradient
  var exitGeo = new THREE.PlaneGeometry(0.35, 0.35);
  var exitMat = new THREE.ShaderMaterial({
    uniforms: { op: { value: 0 }, time: { value: 0 } },
    vertexShader: VERT,
    fragmentShader: `
      uniform float op, time;
      varying vec2 vUv;
      void main() {
        vec2 p = vUv * 2.0 - 1.0;
        float r = length(p);
        float disc = smoothstep(1.0, 0.3, r);
        // Spectral band across the hotspot
        float t2 = vUv.x;
        vec3 col;
        if (t2 < 0.2) {
          col = mix(vec3(0.3, 0.0, 1.0), vec3(0.1, 0.5, 1.0), t2 / 0.2);
        } else if (t2 < 0.4) {
          col = mix(vec3(0.1, 0.5, 1.0), vec3(0.2, 1.0, 0.4), (t2-0.2) / 0.2);
        } else if (t2 < 0.6) {
          col = mix(vec3(0.2, 1.0, 0.4), vec3(1.0, 0.8, 0.0), (t2-0.4) / 0.2);
        } else if (t2 < 0.8) {
          col = mix(vec3(1.0, 0.8, 0.0), vec3(1.0, 0.5, 0.0), (t2-0.6) / 0.2);
        } else {
          col = mix(vec3(1.0, 0.5, 0.0), vec3(1.0, 0.15, 0.1), (t2-0.8) / 0.2);
        }
        float a = disc * op;
        if (a < 0.01) discard;
        float shimmer = 0.9 + 0.1 * sin(time * 1.5 + p.x * 12.0);
        gl_FragColor = vec4(col * shimmer * 1.5, a);
      }
    `,
    transparent: true, blending: THREE.AdditiveBlending,
    depthWrite: false, side: THREE.DoubleSide
  });
  _qiblaExitCaustic = new THREE.Mesh(exitGeo, exitMat);
  _qiblaExitCaustic.rotation.x = -Math.PI / 2; // flat on floor
  // Scene root: exit caustic on +Z side (toward camera, past cube's near face)
  _qiblaExitCaustic.position.set(0, 0.01, 1.0);
  _qiblaExitCaustic.visible = false;
  scene.add(_qiblaExitCaustic);
  window._qiblaEntryBeam = _qiblaEntryBeam;
  window._qiblaExitCaustic = _qiblaExitCaustic;
})();

window._clockToggleCompass = function(on) {
  _compassMode = !!on;
  if (_compassMode) {
    // Hide hour + minute hands, lock second hand to 12 o'clock
    clockRays[0].mesh.children[0].material.uniforms.op.value = 0;
    clockRays[1].mesh.children[0].material.uniforms.op.value = 0;
    clockRays[2].mesh.children[0].material.uniforms.op.value = 0.95;
    _compassAligned = false;
    // Ensure 3D beam/caustic are fully reset on entry — no residual hairline
    if(_qiblaEntryBeam){ _qiblaEntryBeam.visible = false; _qiblaEntryBeam.material.uniforms.op.value = 0; }
    if(_qiblaExitCaustic){ _qiblaExitCaustic.visible = false; _qiblaExitCaustic.material.uniforms.op.value = 0; }
    if(window._qiblaCausticLight){ window._qiblaCausticLight.intensity = 0; }
    // Hide prayer window discs
    _prayerDisc.visible = false; _nextDisc.visible = false; _thirdDisc.visible = false;
    // Zero out prayer accent lights for clean compass look
    prayerWash.intensity = 0;
    prayerRim.intensity = 0;
    prayerSlash.intensity = 0;
    prayerGlow.intensity = 0;
  } else {
    // Restore clock hands
    clockRays[0].mesh.children[0].material.uniforms.op.value = 0.88;
    clockRays[1].mesh.children[0].material.uniforms.op.value = 0.92;
    clockRays[2].mesh.children[0].material.uniforms.op.value = 0.62;
    [_qiblaFanDisc, _qiblaBloomDisc, _qiblaEntryDisc].forEach(function(d){
      if(d){ d.visible = false; d.material.uniforms.op.value = 0; }
    });
    if(_qiblaEntryBeam){ _qiblaEntryBeam.visible = false; _qiblaEntryBeam.material.uniforms.op.value = 0; }
    if(_qiblaExitCaustic){ _qiblaExitCaustic.visible = false; _qiblaExitCaustic.material.uniforms.op.value = 0; }
    cubeMat.uniforms.uInternalGlow.value = 0;
    if(window._qiblaCausticLight){ window._qiblaCausticLight.intensity = 0; }
    // Restore prayer window discs
    _prayerDisc.visible = true; _nextDisc.visible = true; _thirdDisc.visible = true;
    _compassAligned = false;
    _compassLocked = false;
  }
};

// Read compass data directly from adhan globals (already updated by deviceorientation handler)
window._clockUpdateCompass = function(heading, qibla) {
  _compassHeading = heading;
  _compassQibla = qibla;
};

// Auto-read from adhan globals each frame (no separate feed needed)
function _syncCompassFromAdhan() {
  if (_compassLocked) return; // dev lock — skip gyro overwrite
  if (typeof adhanDeviceHeading !== 'undefined') _compassHeading = adhanDeviceHeading;
  if (typeof adhanQiblaAngle !== 'undefined' && adhanQiblaAngle !== null) _compassQibla = adhanQiblaAngle;
}

// ─── TAHAJJUD — LAST THIRD OF THE NIGHT ───────────────────────────────────
// "Our Lord descends every night to the lowest heaven in the last third of the night"
// — Bukhari & Muslim
// Detection: last ⅓ of night = Isha + 2/3 × (Fajr_next - Isha)
var _tahajjudActive = false;
var _tahajjudBlend  = 0.0;    // 0 = normal, 1 = full tahajjud state (lerps)
var _tahajjudStartMin = 0;    // calculated start time in minutes from midnight
var _tahajjudForced = false;  // dev panel override
var _tahajjudLastCheck = 0;   // throttle: check once per 10 seconds

function _isLastThird(now) {
  var T = window._prayerTimings;
  if (!T || !T.Isha || !T.Fajr) return false;
  var ishaMin  = ptParseMin(T.Isha);
  var fajrMin  = ptParseMin(T.Fajr);
  // Fajr is next day — add 24h if needed
  if (fajrMin <= ishaMin) fajrMin += 1440;
  var nightDuration = fajrMin - ishaMin;
  var lastThirdStart = ishaMin + Math.floor(nightDuration * 2 / 3);
  _tahajjudStartMin = lastThirdStart % 1440;
  // Current time in minutes
  var h = now.getHours(), m = now.getMinutes();
  var nowMin = h * 60 + m;
  // Handle midnight wrap: if now < Isha, we're past midnight — add 24h
  if (nowMin < ishaMin) nowMin += 1440;
  return nowMin >= lastThirdStart && nowMin < fajrMin;
}

// ─── PRAYER WINDOW SECTORS ────────────────────────────────────────────────
// Seven glowing fan/pie-slice sectors on the floor, one per Islamic prayer window.
// Subtle atmospheric floor glow — cube remains the visual hero.
// Active: 0.18 max opacity, upcoming: 0.08, Fajr dim: 0.05.

const PRAYER_WINDOWS_DEF = [
  { name: 'Qiyam',      startKey: 'Midnight', endKey: 'Qiyam',    color: 0x8811ff, color2: 0xdd77ff, isFajr: false },
  { name: 'Last Third',  startKey: 'Qiyam',   endKey: 'Fajr',     color: 0xaa44ff, color2: 0xee99ff, isFajr: false },
  { name: 'Fajr',    startKey: 'Fajr',     endKey: 'Sunrise',  color: 0x6633ee, color2: 0xbb88ff, isFajr: true  },
  { name: 'Sunrise', startKey: 'Sunrise',  endKey: 'Sunrise', endOffset: 20, color: 0x888888, color2: 0x888888, isFajr: false, isForbidden: true },
  { name: 'Dhuha',   startKey: 'Sunrise', startOffset: 20, endKey: 'Dhuhr', color: 0xff9900, color2: 0xffee44, isFajr: false },
  { name: 'Dhuhr',   startKey: 'Dhuhr',    endKey: 'Asr',      color: 0x00bb44, color2: 0x66ff99, isFajr: false },
  { name: 'Asr',     startKey: 'Asr',      endKey: 'Maghrib',  color: 0xff8800, color2: 0xffcc44, isFajr: false },
  { name: 'Maghrib', startKey: 'Maghrib',  endKey: 'Isha',     color: 0xff2200, color2: 0xff8866, isFajr: false },
  { name: 'Isha',    startKey: 'Isha',     endKey: 'Midnight', color: 0x1166ff, color2: 0x55ccff, isFajr: false },
];

// ── Hour hand contrast colors per prayer (complementary hue + boosted intensity) ──
// When hour hand is inside a prayer beam, it shifts to this color at higher opacity.
// Default (no active prayer): violet 0x9900ff / 0xff00ff at 0.88
const HOUR_DEFAULT_C1 = new THREE.Color(0x9900ff);
const HOUR_DEFAULT_C2 = new THREE.Color(0xff00ff);
const HOUR_DEFAULT_OP = 0.88;
const HOUR_ACTIVE_OP  = 2.2;  // ~2.5x boost when inside a beam

const HOUR_CONTRAST = {
  Tahajjud: { c1: new THREE.Color(0xffcc44), c2: new THREE.Color(0xffee88) }, // gold vs purple
  Fajr:     { c1: new THREE.Color(0xff9933), c2: new THREE.Color(0xffcc66) }, // warm amber vs indigo
  Sunrise:  { c1: new THREE.Color(0x888888), c2: new THREE.Color(0xaaaaaa) }, // grey — forbidden window
  Dhuha:    { c1: new THREE.Color(0x6622cc), c2: new THREE.Color(0x9944ff) }, // deep violet vs gold
  Dhuhr:    { c1: new THREE.Color(0xff2266), c2: new THREE.Color(0xff6699) }, // magenta/pink vs green
  Asr:      { c1: new THREE.Color(0x00ccff), c2: new THREE.Color(0x66eeff) }, // cyan vs amber
  Maghrib:  { c1: new THREE.Color(0x00ffcc), c2: new THREE.Color(0x88ffee) }, // bright cyan vs red
  Isha:     { c1: new THREE.Color(0xffaa22), c2: new THREE.Color(0xffdd66) }, // warm gold vs blue
};

// Lerp targets (smoothed in animation loop)
let _hourTargetC1 = HOUR_DEFAULT_C1.clone();
let _hourTargetC2 = HOUR_DEFAULT_C2.clone();
let _hourTargetOp = HOUR_DEFAULT_OP;

const PT_FALLBACK = {
  Fajr: '05:30', Sunrise: '07:00', Dhuhr: '12:15',
  Asr: '15:30', Maghrib: '18:00', Isha: '19:30', Midnight: '23:45',
};

function ptParseMin(str) {
  const p = str.split(' ')[0].split(':').map(Number);
  return p[0] * 60 + p[1];
}

// Map minutes-since-midnight on the 12h clock to a beam angle.
// Mirrors the hand formula: initY(135°) - fraction*TAU, so prayer beams
// land at exactly the right clock-face position alongside the hands.
function ptTimeToAngle(totalMinutes) {
  return (3 * Math.PI / 4) - ((totalMinutes % 720) / 720) * TAU;
}

// Prayer windows: triangle-fan sector geometry, but the shader defines the light —
// NOT the geometry. Bright at cube apex, fills entire angular window, radiates
// outward and fades. Soft angular edges. The sector is invisible; only the
// spread of light from the source is perceived.
//
// u=0→1 across arc, v=0 at apex, v=1 at tip (same UV layout as mkMat).
const FRAG_WINDOW = `
  uniform vec3  c1, c2;
  uniform float op;
  varying vec2  vUv;
  void main() {
    // Radial: bright at cube source, spreads and fades outward (light physics)
    float r = vUv.y;
    float radial = smoothstep(0.0, 0.06, r) * (1.0 - smoothstep(0.3, 1.0, r));

    // Angular: fills the full window, soft fade only at the edges
    float edge = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x);

    vec3 col = mix(c1, c2, pow(clamp(r, 0.0, 1.0), 0.5));
    gl_FragColor = vec4(col, radial * edge * op);
  }
`;
function mkMatWindow(c1, c2, op) {
  return new THREE.ShaderMaterial({
    uniforms: { c1:{value:new THREE.Color(c1)}, c2:{value:new THREE.Color(c2)}, op:{value:op} },
    vertexShader: VERT, fragmentShader: FRAG_WINDOW,
    transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide
  });
}

// Triangle fan from cube apex to outer arc, UV-mapped for FRAG_WINDOW.
function makeSectorGeom(radius, thetaHalf, segments) {
  segments = segments || 48;
  const pos = [], uvs = [];
  pos.push(0, 0, 0); uvs.push(0.5, 0);
  for (let i = 0; i <= segments; i++) {
    const t = -thetaHalf + (2 * thetaHalf * i / segments);
    pos.push(Math.sin(t) * radius, Math.cos(t) * radius, 0);
    uvs.push(i / segments, 1);
  }
  const idx = [];
  for (let i = 1; i <= segments; i++) idx.push(0, i, i + 1);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

const SECTOR_RADIUS = 9.12;  // matches second-hand length
const OP_ACTIVE = 1.2;


var prayerSectors = [];
window.prayerSectors = prayerSectors; // expose for export API
var _activePrayer = null; // { startAng, endAng, color, color2, intensity }
var ptSectorsRebuilt = false;

function addBeam(ang, color, color2, initOp, width) {
  const w = width || 0.72;
  const geo = new THREE.PlaneGeometry(w, SECTOR_RADIUS, 1, 16);
  geo.translate(0, SECTOR_RADIUS / 2, 0);
  const mat = mkMat(color, color2, initOp);
  const grp = new THREE.Group();
  grp.add(new THREE.Mesh(geo, mat));
  grp.position.y = 0.008;
  grp.rotation.order = 'YXZ';
  grp.rotation.y = ang;
  grp.rotation.x = Math.PI / 2;
  prismGroup.add(grp);
  return { grp, mat };
}

window.buildPrayerSectors = buildPrayerSectors;
function buildPrayerSectors() {
  prayerSectors.length = 0; // clear without reassigning (keeps window.prayerSectors ref)
  const T = window._prayerTimings || PT_FALLBACK;
  PRAYER_WINDOWS_DEF.forEach(function(def) {
    const startMin = (ptParseMin(T[def.startKey]) + (def.startOffset || 0)) % 1440;
    const endMin   = (ptParseMin(T[def.endKey]) + (def.endOffset || 0)) % 1440;
    const startAng = ptTimeToAngle(startMin);
    const endAng   = ptTimeToAngle(endMin);
    prayerSectors.push({ def, startMin, endMin, startAng, endAng });
  });
}

// ── Polar disc prayer beam (single CircleGeometry + fragment shader) ──
const _prayerDiscGeo = new THREE.CircleGeometry(SECTOR_RADIUS * 1.3, 64);
const _prayerDiscMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  uniforms: {
    uStartAngle: { value: 0.0 },
    uEndAngle:   { value: 0.0 },
    uColor1:     { value: new THREE.Color(0xff0000) },
    uColor2:     { value: new THREE.Color(0xffffff) },
    uIntensity:  { value: 0.0 },
    uOuterRadius:{ value: SECTOR_RADIUS },
    uWidth:      { value: 1.0 },
    uEdgeFade:   { value: 12.0 },
    uFalloff:    { value: 2.2 },
    uHoleSize:   { value: 0.74 },
  },
  vertexShader: `
    varying vec2 vPos;
    void main() {
      vPos = position.xy;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    #define PI  3.14159265
    #define TAU 6.28318530
    uniform float uStartAngle, uEndAngle;
    uniform vec3  uColor1, uColor2;
    uniform float uIntensity, uOuterRadius, uWidth, uEdgeFade, uFalloff, uHoleSize;
    varying vec2  vPos;
    void main() {
      float r = length(vPos);
      float radial = exp(-r / uOuterRadius * uFalloff) * smoothstep(0.0, uHoleSize, r);

      float angle = atan(vPos.x, -vPos.y);

      // Handle wrapping windows (e.g. Tahajjud crossing 12 o'clock)
      float span = uStartAngle - uEndAngle;
      if (span < 0.0) span += TAU;
      float mid = uStartAngle - span * 0.5;
      float hSpan = span * 0.5;

      // Signed angular distance with wrapping
      float d = angle - mid;
      d = d - TAU * floor((d + PI) / TAU);
      float normDist = abs(d) / max(hSpan * uWidth, 0.001);
      // Flat-top — stays bright to 90% of window, sharper rolloff at edges
      float angular = exp(-pow(max(normDist - 0.97, 0.0) * uEdgeFade, 2.0));

      // Dichroic color shift across fan
      float colorT = clamp(0.5 + d / max(hSpan * 2.0, 0.001), 0.0, 1.0);
      vec3 col = mix(uColor1, uColor2, colorT);

      float alpha = radial * angular * uIntensity;
      if (alpha < 0.002) discard;
      gl_FragColor = vec4(col * alpha, alpha);
    }
  `
});

const _prayerDisc = new THREE.Mesh(_prayerDiscGeo, _prayerDiscMat);
_prayerDisc.rotation.x = -Math.PI / 2;
_prayerDisc.position.y = 0.02;
_prayerDisc.visible = false;
prismGroup.add(_prayerDisc);

// ── Second disc for "next upcoming" prayer (dimmer) ──
const _nextDiscMat = _prayerDiscMat.clone();
_nextDiscMat.uniforms = {
  uStartAngle: { value: 0.0 },
  uEndAngle:   { value: 0.0 },
  uColor1:     { value: new THREE.Color(0xff0000) },
  uColor2:     { value: new THREE.Color(0x00ff00) },
  uIntensity:  { value: 0.0 },
  uOuterRadius:{ value: SECTOR_RADIUS },
  uWidth:      { value: 1.0 },
  uEdgeFade:   { value: 12.0 },
  uFalloff:    { value: 2.2 },
    uHoleSize:   { value: 0.74 },
};
const _nextDisc = new THREE.Mesh(_prayerDiscGeo, _nextDiscMat);
_nextDisc.rotation.x = -Math.PI / 2;
_nextDisc.position.y = 0.015;
_nextDisc.visible = false;
prismGroup.add(_nextDisc);

// ── Third disc for prayer after next ──
const _thirdDiscMat = _prayerDiscMat.clone();
_thirdDiscMat.uniforms = {
  uStartAngle: { value: 0.0 },
  uEndAngle:   { value: 0.0 },
  uColor1:     { value: new THREE.Color(0xff0000) },
  uColor2:     { value: new THREE.Color(0x00ff00) },
  uIntensity:  { value: 0.0 },
  uOuterRadius:{ value: SECTOR_RADIUS },
  uWidth:      { value: 1.0 },
  uEdgeFade:   { value: 12.0 },
  uFalloff:    { value: 2.2 },
    uHoleSize:   { value: 0.74 },
};
const _thirdDisc = new THREE.Mesh(_prayerDiscGeo, _thirdDiscMat);
_thirdDisc.rotation.x = -Math.PI / 2;
_thirdDisc.position.y = 0.012;
_thirdDisc.visible = false;
prismGroup.add(_thirdDisc);



const OP_STEP = 0.22; // intensity drop per consecutive prayer
const PRAYER_BLEND_MIN = 10; // minutes before boundary to crossfade active→next

function updatePrayerWindows(now) {
  if (window._prayerTimingsReady && !ptSectorsRebuilt) {
    buildPrayerSectors();
    ptSectorsRebuilt = true;
  }
  // Merge real + custom debug windows
  const allSectors = _devActive && _devCustomSectors && _devCustomSectors.length
    ? prayerSectors.concat(_devCustomSectors) : prayerSectors;

  if (!allSectors.length) {
    _prayerDisc.visible = false; _nextDisc.visible = false;

    return;
  }

  const nowMin = now.getHours() * 60 + now.getMinutes();
  // During swipe preview, lock sector selection to the intended target minute
  // (not the eased/intermediate minute) to prevent header/window bounce.
  const selMin = (typeof _swipeTimeTarget === 'number' && _swipeTimeTarget !== null)
    ? ((Math.floor(_swipeTimeTarget) % 1440) + 1440) % 1440
    : nowMin;

  // Find active prayer, next upcoming, and the one after that
  let activeIdx = -1;
  let nextIdx = -1;
  let thirdIdx = -1;
  let bestDist = 99999;
  let secondBest = 99999;

  allSectors.forEach(function(ps, i) {
    const { startMin, endMin } = ps;
    const wraps = startMin > endMin;
    const isActive = wraps
      ? (selMin >= startMin) || (selMin < endMin)
      : (selMin >= startMin) && (selMin < endMin);
    if (isActive) { activeIdx = i; return; }
    const dist = (startMin - selMin + 1440) % 1440;
    if (dist < bestDist) {
      secondBest = bestDist; thirdIdx = nextIdx;
      bestDist = dist; nextIdx = i;
    } else if (dist < secondBest) {
      secondBest = dist; thirdIdx = i;
    }
  });

  // ── Active prayer disc (full intensity) ──
  const _opA = window._OP_ACTIVE_OVERRIDE != null ? window._OP_ACTIVE_OVERRIDE : OP_ACTIVE;
  const _opS = window._OP_STEP_OVERRIDE != null ? window._OP_STEP_OVERRIDE : OP_STEP;
  const OP_FORBIDDEN = 0.25; // dim grey for forbidden windows (e.g. Sunrise)
  const _lerpRate = (_devSnapIntensity || window._forceTimeMin != null) ? 1.0 : 0.03;
  if (_devSnapIntensity) _devSnapIntensity = false;
  const u = _prayerDiscMat.uniforms;
  const _activeIsForbidden = activeIdx >= 0 && allSectors[activeIdx].def.isForbidden;
  const _activeBase = activeIdx >= 0 ? (_activeIsForbidden ? OP_FORBIDDEN : _opA) : 0.0;

  // Boundary interpolation: fade active out while next fades in before transition.
  var _blendDur = Math.max(1, window._PRAYER_BLEND_MIN || PRAYER_BLEND_MIN);
  var _boundaryBlend = 0;
  if (activeIdx >= 0 && nextIdx >= 0) {
    var _minsToNext = (allSectors[nextIdx].startMin - nowMin + 1440) % 1440;
    if (_minsToNext <= _blendDur) _boundaryBlend = 1.0 - (_minsToNext / _blendDur);
  }

  const activeTarget = _activeBase * (1.0 - _boundaryBlend);
  u.uIntensity.value = THREE.MathUtils.lerp(u.uIntensity.value, activeTarget, _lerpRate);

  var _angLerp = _swipeTimeOverride !== null ? 0.08 : _lerpRate; // faster during swipe for responsive feel
  if (activeIdx >= 0) {
    const ps = allSectors[activeIdx];
    u.uStartAngle.value = THREE.MathUtils.lerp(u.uStartAngle.value, ps.startAng, _angLerp);
    u.uEndAngle.value = THREE.MathUtils.lerp(u.uEndAngle.value, ps.endAng, _angLerp);
    u.uColor1.value.lerp(new THREE.Color(ps.def.color), _angLerp);
    u.uColor2.value.lerp(new THREE.Color(ps.def.color2), _angLerp);
    if (!_compassMode) _prayerDisc.visible = true;
    _activePrayer = { startAng: ps.startAng, endAng: ps.endAng, color: ps.def.color, color2: ps.def.color2, intensity: u.uIntensity.value };
    // Expose highlighted prayer for UI countdown behavior during swipe preview.
    window._swipePreviewPrayer = ps.def && ps.def.name ? ps.def.name : null;

  } else {
    _activePrayer = null;
    window._swipePreviewPrayer = null;
  }
  if (u.uIntensity.value < 0.001 || _compassMode) _prayerDisc.visible = false;

  // ── Plinth lighting interpolation (prayer-driven) ──
  _updatePlinthLighting();

  // ── Next upcoming prayer disc (dim — anticipation) ──
  const nu = _nextDiscMat.uniforms;
  const _maxWindows = window._devWindowCount != null ? window._devWindowCount : 1;
  const _nextIsForbidden = nextIdx >= 0 && allSectors[nextIdx].def.isForbidden;
  const _nextBaseOp = _nextIsForbidden ? OP_FORBIDDEN : _opA;
  var _nextAnticipation = (nextIdx >= 0 && _maxWindows >= 2)
    ? (_devActive ? _nextBaseOp : Math.max(_nextBaseOp - _opS, 0.0))
    : 0.0;
  // During boundary blend, next disc ramps toward full active intensity.
  var _nextBlendBoost = (nextIdx >= 0) ? (_nextBaseOp * _boundaryBlend) : 0.0;
  const nextTarget = Math.max(_nextAnticipation, _nextBlendBoost);
  nu.uIntensity.value = THREE.MathUtils.lerp(nu.uIntensity.value, nextTarget, _lerpRate);

  if (nextIdx >= 0) {
    const ps = allSectors[nextIdx];
    nu.uStartAngle.value = ps.startAng;
    nu.uEndAngle.value = ps.endAng;
    nu.uColor1.value.set(ps.def.color);
    nu.uColor2.value.set(ps.def.color2);
    if (!_compassMode) _nextDisc.visible = true;
  }
  if (nu.uIntensity.value < 0.001 || _compassMode) _nextDisc.visible = false;

  // ── Third prayer disc (prayer after next) ──
  const tu = _thirdDiscMat.uniforms;
  const _thirdIsForbidden = thirdIdx >= 0 && allSectors[thirdIdx].def.isForbidden;
  const _thirdBaseOp = _thirdIsForbidden ? OP_FORBIDDEN : _opA;
  const thirdTarget = (thirdIdx >= 0 && _maxWindows >= 3) ? (_devActive ? _thirdBaseOp : Math.max(_thirdBaseOp - _opS * 2, 0.0)) : 0.0;
  tu.uIntensity.value = THREE.MathUtils.lerp(tu.uIntensity.value, thirdTarget, _lerpRate);

  if (thirdIdx >= 0) {
    const ps = allSectors[thirdIdx];
    tu.uStartAngle.value = ps.startAng;
    tu.uEndAngle.value = ps.endAng;
    tu.uColor1.value.set(ps.def.color);
    tu.uColor2.value.set(ps.def.color2);
    if (!_compassMode) _thirdDisc.visible = true;
  }
  if (tu.uIntensity.value < 0.001 || _compassMode) _thirdDisc.visible = false;
}

// buildPrayerSectors called on first updatePrayerWindows when real data ready

// ─── ANIMATE ──────────────────────────────────────────────────────────────────
const clock = new THREE.Clock();

prismGroup.rotation.y = Math.PI / 4;

let _themeFrameCount = 3599; // triggers on first frame
const _themeBuf = new Uint8Array(4);
const _themeMeta = document.querySelector('meta[name="theme-color"]');

var _targetFPS = 30;
var _idleFPS = 15;
var _frameInterval = 1000 / _targetFPS;
var _lastFrameTime = 0;

// Page Visibility: drop to 15fps when hidden, restore on visible
document.addEventListener('visibilitychange', function() {
  var fps = document.hidden ? _idleFPS : _targetFPS;
  _frameInterval = 1000 / fps;
  // Re-measure canvas on return from background (Safari toolbar state may have changed)
  if (!document.hidden) {
    // Multiple resize passes — iOS standalone viewport settles slowly
    [150, 500, 1000].forEach(function(delay) {
      setTimeout(function() {
        _stableW = window.innerWidth;
        var el = document.createElement('div');
        el.style.cssText = 'position:fixed;top:0;left:0;width:0;height:100lvh;pointer-events:none;';
        document.body.appendChild(el);
        _stableH = el.offsetHeight || window.innerHeight;
        document.body.removeChild(el);
        onResize();
      }, delay);
    });
  }
});

(function loop(timestamp) {
  requestAnimationFrame(loop);
  if (timestamp - _lastFrameTime < _frameInterval) return;
  _lastFrameTime = timestamp - ((timestamp - _lastFrameTime) % _frameInterval);
  let t = clock.getElapsedTime();
  // Loop-safe timelapse mode: bind shader time to forced day-phase (no seam on loop).
  if (window._forceTimeMin != null) {
    t = (window._forceTimeMin / 1440) * 60.0;
  }
  cubeMat.uniforms.uTime.value = t;
  fogLayerMat.uniforms.uTime.value = t;
  warmFogMat.uniforms.uTime.value = t;
  godRayMat.uniforms.uTime.value = t;
  _shaftMat.uniforms.time.value = t;

  // Sync hands to clock time (real, dev override, or swipe preview)
  var now;
  if (typeof _getDevNow === 'function' && _devActive) {
    now = _getDevNow();
  } else if (window._forceTimeMin != null) {
    // Deterministic render mode (timelapse): drive H/M/S directly from forced timeline.
    var _fm = ((window._forceTimeMin % 1440) + 1440) % 1440;
    var _fh = Math.floor(_fm / 60);
    var _fminFloat = _fm % 60;
    var _fmi = Math.floor(_fminFloat);
    var _fsecFloat = (_fminFloat - _fmi) * 60;
    var _fsec = Math.floor(_fsecFloat);
    var _fms = Math.floor((_fsecFloat - _fsec) * 1000);
    now = (typeof window._cityNow === 'function') ? window._cityNow() : new Date();
    now.setHours(_fh, _fmi, _fsec, _fms);
  } else if (typeof _swipeTimeOverride === 'number' && _swipeTimeOverride !== null) {
    // Lerp toward target for smooth hand travel between prayers
    if (_swipeTimeTarget !== null && _swipeTimeOverride !== _swipeTimeTarget) {
      var _swDiff = _swipeTimeTarget - _swipeTimeOverride;
      // Handle midnight wrap — take the short path
      if (_swDiff > 720) _swDiff -= 1440;
      if (_swDiff < -720) _swDiff += 1440;
      var _swStep = _swDiff * 0.12; // ~0.5s ease at 60fps
      if (Math.abs(_swStep) < 0.3) _swipeTimeOverride = _swipeTimeTarget;
      else _swipeTimeOverride = (_swipeTimeOverride + _swStep + 1440) % 1440;
    }
    now = (typeof window._cityNow === 'function') ? window._cityNow() : new Date();
    var _swH = Math.floor(_swipeTimeOverride / 60);
    var _swM = Math.floor(_swipeTimeOverride % 60);
    now.setHours(_swH, _swM, 0, 0); // freeze seconds at 0 during preview
  } else {
    now = (typeof window._cityNow === 'function') ? window._cityNow() : new Date();
  }

  // Immediate UI sync while swiping: avoids one-tick header/countdown bounce at boundaries.
  var _uiSwipeMin = (typeof _swipeTimeTarget === 'number' && _swipeTimeTarget !== null)
    ? _swipeTimeTarget
    : ((typeof _swipeTimeOverride === 'number' && _swipeTimeOverride !== null) ? _swipeTimeOverride : null);
  if (_uiSwipeMin !== null) {
    var _snapMin = ((Math.floor(_uiSwipeMin) % 1440) + 1440) % 1440;
    if (window._lastUISwipeMin !== _snapMin) {
      window._lastUISwipeMin = _snapMin;
      if (typeof window.updateNavClock === 'function') window.updateNavClock();
    }
  }

  const h = (now.getHours() % 12) + now.getMinutes() / 60 + now.getSeconds() / 3600;
  const m = now.getMinutes() + now.getSeconds() / 60 + now.getMilliseconds() / 60000;
  const s = now.getSeconds() + now.getMilliseconds() / 1000;

  // ── Solar day progression (subtle) ────────────────────────────────────────
  var _nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  var _sr = 360, _ss = 1080; // fallback 06:00→18:00
  if (window._prayerTimings && window._prayerTimings.Sunrise && window._prayerTimings.Maghrib) {
    var _toM = function(_s){ var _p=String(_s).split(':').map(Number); return (_p[0]||0)*60 + (_p[1]||0); };
    _sr = _toM(window._prayerTimings.Sunrise);
    _ss = _toM(window._prayerTimings.Maghrib);
  }
  var _daySpan = Math.max(1, _ss - _sr);
  var _dayT = (_nowMin - _sr) / _daySpan;               // 0..1 during daylight
  var _dayPhase = Math.max(0, Math.min(1, _dayT));
  var _sunLift = (_dayT > 0 && _dayT < 1) ? Math.sin(_dayPhase * Math.PI) : 0; // 0 night, 1 noon

  // Hour-hand synced orbit (exact): light tracks directly over the hour hand path.
  var _hourAng = (h / 12) * TAU;

  // Color temperature shift: dawn warm -> noon cool -> dusk warm
  var _dawn = new THREE.Color(0xffb37a), _noon = new THREE.Color(0xf2f7ff), _dusk = new THREE.Color(0xff9966);
  var _solarC = _dayPhase < 0.5
    ? _dawn.clone().lerp(_noon, _dayPhase * 2)
    : _noon.clone().lerp(_dusk, (_dayPhase - 0.5) * 2);

  // Plinth-top highlight orbit: lock to ACTUAL hour-hand direction (exact alignment).
  var _cubeDayC = _solarC.clone().lerp(new THREE.Color(0xe8f2ff), 0.30);
  cubeSun.color.copy(_cubeDayC);
  cubeSun.intensity = 24 + _sunLift * 22; // keep secondary; plinthSun is primary orbital read
  cubeSun.position.set(
    Math.sin(_hourAng) * 2.75,
    1.15 + _sunLift * 0.90,
    -Math.cos(_hourAng) * 2.75
  );

  // Dedicated top-down moving spot for clear circular trace on plinth.
  // Plinth sun orbit: follows hour hand in clock mode, compass needle in compass mode.
  // Analytical direction: same-frame, no 1-frame matrix lag.
  var _orbitR = 1.08; // between cube edge (~0.85) and plinth edge (~1.32)
  var _sunAng;
  if (_compassMode && _compassQibla !== null) {
    // Compass needle angle = qiblaRel, same transform chain as hour hand
    var _qRel = _compassQibla - _compassHeading;
    _sunAng = _qRel; // needle uses same Euler chain: initY offset cancels out
  } else {
    _sunAng = _hourAng;
  }
  // World beam direction = [sin(sunAng), 0, -cos(sunAng)]
  var _ox = Math.sin(_sunAng) * _orbitR;
  var _oz = -Math.cos(_sunAng) * _orbitR;
  // Position high and slightly outward so cone covers both cube top and plinth ring
  plinthSun.position.set(_ox * 1.6, 4.5 + _sunLift * 1.0, _oz * 1.6);
  plinthSun.target.position.set(_ox * 0.5, 0.3, _oz * 0.5);
  // Sunrise→Dhuha hue lock, then noon cool, then warm sunset.
  var _dhuhaSun = new THREE.Color(0xff9900);
  var _sunColor = _dayPhase < 0.25
    ? _dawn.clone().lerp(_dhuhaSun, _dayPhase / 0.25)
    : (_dayPhase < 0.5
      ? _dhuhaSun.clone().lerp(_noon, (_dayPhase - 0.25) / 0.25)
      : _noon.clone().lerp(_dusk, (_dayPhase - 0.5) / 0.5));
  plinthSun.color.copy(_compassMode ? new THREE.Color(0xffe0a0) : _sunColor);
  // Ramp: appear at sunrise (floor 0.15), peak at noon (1.0), fade at sunset
  var _sunRamp = (_dayT >= 0 && _dayT <= 1) ? Math.max(0.15, Math.sin(_dayPhase * Math.PI)) : 0;
  // In compass mode: constant warm glow regardless of TOD (qibla light)
  var _plinthInt = _compassMode ? 100.0 : _sunRamp * 95.0;
  plinthSun.intensity = _plinthInt;
  plinthSun.castShadow = !_compassMode; // shadow flickers with rapid heading changes
  window._sunDebug = {
    hourAng: _hourAng,
    beamDir: { x: Math.sin(_hourAng).toFixed(3), z: (-Math.cos(_hourAng)).toFixed(3) },
    plinthSunPos: { x: _ox, z: _oz, y: plinthSun.position.y },
    orbitR: _orbitR,
    intensity: plinthSun.intensity,
  };

  // ── Tahajjud — last third of the night ──
  var _tahajjudNow = Date.now();
  if (_tahajjudNow - _tahajjudLastCheck > 10000) {
    _tahajjudLastCheck = _tahajjudNow;
    _tahajjudActive = _tahajjudForced || _isLastThird(now);
  }
  var _tahajjudTarget = _tahajjudActive ? 1.0 : 0.0;
  if (window._forceTimeMin != null) {
    _tahajjudBlend = _tahajjudTarget; // deterministic timelapse (no history seam)
  } else {
    _tahajjudBlend += (_tahajjudTarget - _tahajjudBlend) * 0.008; // ~8 second lerp
    if (Math.abs(_tahajjudBlend - _tahajjudTarget) < 0.001) _tahajjudBlend = _tahajjudTarget;
  }

  // Expose for dev panel readout
  window._tahajjudBlend = _tahajjudBlend;
  window._tahajjudActive = _tahajjudActive;

  if (_compassMode) {
    // Pull latest compass data from adhan globals
    _syncCompassFromAdhan();
    // COMPASS MODE — clock hands NEVER tick
    if (_compassQibla !== null) {
      // Compass data available: needle points toward Qibla
      var qiblaRel = _compassQibla - _compassHeading;
      clockRays[2].mesh.rotation.y = clockRays[2].initY - qiblaRel;
      // Needle opacity: fade with calibration confidence
      var calibrated = !!window._compassCalibrated;
      var acc = (typeof window._compassAccuracy === 'number') ? window._compassAccuracy : -1;
      var softCalibrated = !calibrated && acc > 0 && acc <= 35; // guidance-grade (not precise)
      var needleTarget = calibrated ? 0.95 : (softCalibrated ? 0.7 : 0.25);
      var needleCur = clockRays[2].mesh.children[0].material.uniforms.op.value;
      clockRays[2].mesh.children[0].material.uniforms.op.value = needleCur + (needleTarget - needleCur) * 0.08;

      // Check alignment: 12 o'clock pointing at Qibla = qiblaRel near 0
      var alignDelta = Math.abs(((qiblaRel % TAU) + TAU) % TAU);
      if (alignDelta > Math.PI) alignDelta = TAU - alignDelta;
      var aligned = alignDelta < 0.15; // ~8.5° tolerance
      var fullPayoff = calibrated && aligned;
      var softPayoff = softCalibrated && aligned;
      var _wasAligned = _compassAligned;
      _compassAligned = fullPayoff;
      // Edge pulse removed — only fires on page load

      // Prismatic refraction: polar disc shaders
      var breathe = 0.88 + 0.12 * Math.sin(t * 1.0);
      // Update time uniform for caustic shimmer
      if(_qiblaFanDisc) _qiblaFanDisc.material.uniforms.time.value = t;
      if(_qiblaBloomDisc) _qiblaBloomDisc.material.uniforms.time.value = t;

      if (fullPayoff) {
        // Shadow disc + caustic light
        if(window._qiblaCausticLight){
          window._qiblaCausticLight.intensity = Math.min(window._qiblaCausticLight.intensity + 0.03, 0.5 * breathe);
        }
        // Fan disc fades in
        if(_qiblaFanDisc){
          _qiblaFanDisc.visible = true;
          var fop = _qiblaFanDisc.material.uniforms.op.value;
          _qiblaFanDisc.material.uniforms.op.value = Math.min(fop + 0.04, 0.55 * breathe);
        }
        // Bloom underlayer
        if(_qiblaBloomDisc){
          _qiblaBloomDisc.visible = true;
          var bop = _qiblaBloomDisc.material.uniforms.op.value;
          _qiblaBloomDisc.material.uniforms.op.value = Math.min(bop + 0.02, 0.22 * breathe);
        }
        // Entry beam disc
        if(_qiblaEntryDisc){
          _qiblaEntryDisc.visible = true;
          var eop = _qiblaEntryDisc.material.uniforms.op.value;
          _qiblaEntryDisc.material.uniforms.op.value = Math.min(eop + 0.04, 0.18 * breathe);
        }
        // 3D Entry beam strip (horizontal floor plane, no billboard needed)
        if(_qiblaEntryBeam){
          _qiblaEntryBeam.visible = true;
          _qiblaEntryBeam.material.uniforms.time.value = t;
          var ebop = _qiblaEntryBeam.material.uniforms.op.value;
          _qiblaEntryBeam.material.uniforms.op.value = Math.min(ebop + 0.05, 0.35 * breathe);
        }
        // Exit face caustic hotspot (horizontal floor plane, no billboard needed)
        if(_qiblaExitCaustic){
          _qiblaExitCaustic.visible = true;
          _qiblaExitCaustic.material.uniforms.time.value = t;
          var ecop = _qiblaExitCaustic.material.uniforms.op.value;
          _qiblaExitCaustic.material.uniforms.op.value = Math.min(ecop + 0.04, 0.5 * breathe);
        }
        // Internal glow on cube
        cubeMat.uniforms.uInternalGlow.value = Math.min(cubeMat.uniforms.uInternalGlow.value + 0.02, 0.3 * breathe);
      } else if (softPayoff) {
        // Guidance-grade fallback: show a dim payoff when accuracy is decent (<=35°)
        if(window._qiblaCausticLight){
          window._qiblaCausticLight.intensity = Math.min(window._qiblaCausticLight.intensity + 0.02, 0.2 * breathe);
        }
        if(_qiblaFanDisc){
          _qiblaFanDisc.visible = true;
          var sfop = _qiblaFanDisc.material.uniforms.op.value;
          _qiblaFanDisc.material.uniforms.op.value = Math.min(sfop + 0.025, 0.22 * breathe);
        }
        if(_qiblaBloomDisc){
          _qiblaBloomDisc.visible = true;
          var sbop = _qiblaBloomDisc.material.uniforms.op.value;
          _qiblaBloomDisc.material.uniforms.op.value = Math.min(sbop + 0.015, 0.09 * breathe);
        }
        if(_qiblaEntryDisc){
          _qiblaEntryDisc.visible = true;
          var seop = _qiblaEntryDisc.material.uniforms.op.value;
          _qiblaEntryDisc.material.uniforms.op.value = Math.min(seop + 0.02, 0.08 * breathe);
        }
        if(_qiblaEntryBeam){
          _qiblaEntryBeam.visible = true;
          _qiblaEntryBeam.material.uniforms.time.value = t;
          var sebop = _qiblaEntryBeam.material.uniforms.op.value;
          _qiblaEntryBeam.material.uniforms.op.value = Math.min(sebop + 0.025, 0.14 * breathe);
        }
        if(_qiblaExitCaustic){
          _qiblaExitCaustic.visible = true;
          _qiblaExitCaustic.material.uniforms.time.value = t;
          var secop = _qiblaExitCaustic.material.uniforms.op.value;
          _qiblaExitCaustic.material.uniforms.op.value = Math.min(secop + 0.02, 0.2 * breathe);
        }
        cubeMat.uniforms.uInternalGlow.value = Math.min(cubeMat.uniforms.uInternalGlow.value + 0.015, 0.12 * breathe);
      } else if (!_compassDevMode) {
        // Fade out shadow + caustic
        if(window._qiblaCausticLight && window._qiblaCausticLight.intensity > 0.01){ window._qiblaCausticLight.intensity *= 0.9; } else if(window._qiblaCausticLight){ window._qiblaCausticLight.intensity = 0; }
        // Fade out all disc layers
        [_qiblaFanDisc, _qiblaBloomDisc, _qiblaEntryDisc].forEach(function(d){
          if(!d) return;
          var dop = d.material.uniforms.op.value;
          if(dop > 0.005){ d.material.uniforms.op.value = dop * 0.88; }
          else { d.visible = false; d.material.uniforms.op.value = 0; }
        });
        // Fade out entry beam and exit caustic — fast decay to prevent flicker residue.
        [_qiblaEntryBeam, _qiblaExitCaustic].forEach(function(d){
          if(!d) return;
          var dop = d.material.uniforms.op.value;
          if(dop > 0.05){ d.material.uniforms.op.value = dop * 0.7; }
          else { d.visible = false; d.material.uniforms.op.value = 0; }
        });
        if(cubeMat.uniforms.uInternalGlow.value > 0.005){ cubeMat.uniforms.uInternalGlow.value *= 0.9; }
        else { cubeMat.uniforms.uInternalGlow.value = 0; }
      }
    } else {
      // Waiting for compass data: slow searching sweep
      var searchAngle = t * 1.5; // slow rotation
      clockRays[2].mesh.rotation.y = clockRays[2].initY - searchAngle;
      clockRays[2].mesh.children[0].material.uniforms.op.value = 0.5;
    }
  } else {
    // Normal clock mode
    clockRays[0].mesh.rotation.y = clockRays[0].initY - (h / 12) * TAU;   // hour
    clockRays[1].mesh.rotation.y = clockRays[1].initY - (m / 60) * TAU;   // minute
    clockRays[2].mesh.rotation.y = clockRays[2].initY - (s / 60) * TAU;   // second
    // Always recover hour/minute opacity in normal mode (guards against splash/compass resets).
    var _hMatN = clockRays[0].mesh.children[0].material;
    var _mMatN = clockRays[1].mesh.children[0].material;
    _hMatN.uniforms.op.value += (1.45 - _hMatN.uniforms.op.value) * 0.18;
    _mMatN.uniforms.op.value += (1.50 - _mMatN.uniforms.op.value) * 0.18;

    // Tawaf flourish — CCW sweep on swipe revert
    if (_swipeTawafPhase > 0.001) {
      // Ease-out curve for smooth deceleration
      var tawafOffset = _swipeTawafPhase * _swipeTawafPhase * TAU; // quadratic ease-out
      clockRays[0].mesh.rotation.y -= tawafOffset * 0.3;  // hour: subtle
      clockRays[1].mesh.rotation.y -= tawafOffset * 0.6;  // minute: medium
      clockRays[2].mesh.rotation.y -= tawafOffset;         // second: full sweep
      _swipeTawafPhase *= 0.955; // decay ~1.5 seconds at 60fps
      if (_swipeTawafPhase < 0.001) {
        _swipeTawafPhase = 0;
        // Edge pulse removed — only fires on page load
      }
    }

    // Expose hand proximity to 6 o'clock (bottom) for nav pill dichroic effect
    // 6 o'clock = fraction 0.5 on the dial. Proximity = cos-based falloff.
    const hFrac = (h / 12) % 1, mFrac = (m / 60) % 1, sFrac = (s / 60) % 1;
    const sixDist = (f) => Math.max(0, Math.cos((f - 0.5) * TAU)); // 1 at 6, 0 at 12
    // Prayer beam at 6 o'clock check
    let prayerAtSix = 0, prayerC1 = 0, prayerC2 = 0;
    if (_activePrayer) {
      const sixAngle = ptTimeToAngle(360);
      let sa = _activePrayer.startAng, ea = _activePrayer.endAng, sa6 = sixAngle;
      while (ea > sa) ea -= TAU;
      while (sa6 > sa) sa6 -= TAU;
      while (sa6 < ea) sa6 += TAU;
      if (sa6 <= sa && sa6 >= ea) {
        prayerAtSix = _activePrayer.intensity;
        prayerC1 = _activePrayer.color;
        prayerC2 = _activePrayer.color2;
      }
    }
    window._handGlow = { h: sixDist(hFrac), m: sixDist(mFrac), s: sixDist(sFrac), p: prayerAtSix, pc1: prayerC1, pc2: prayerC2 };

    // Hour hand adaptive color + intensity (lerp ~2s at 60fps)
    const hMat = clockRays[0].mesh.children[0].material;
    const lRate = 0.025;
    // Hour hand stays magenta — no adaptive contrast

    // Second hand: reduce base opacity to minimize additive pop at prayer beam edges
    // The white hand + colored beam = blown-out overlap → sudden contrast on exit.
    // Lower base opacity reduces the delta.
    const sMat = clockRays[2].mesh.children[0].material;
    const secBase = _prayerDisc.visible ? 0.40 : 0.62;
    sMat.uniforms.op.value += (secBase - sMat.uniforms.op.value) * 0.03;
  }


  // Specular highlight orbits cube at second-hand speed
  const secAngle = (s / 60) * TAU;
  const specRadius = 3.0;
  cubeMat.uniforms.uSpecLightPos.value.set(
    Math.sin(secAngle) * specRadius,
    3.5,
    -Math.cos(secAngle) * specRadius
  );
  // Damped spring camera orbit — elastic overshoot + boundary bounce
  // Camera swipe orbit DISABLED — camera stays locked at base position
  // Spring physics kept but zeroed so no movement occurs
  _swipeCamAngle = 0; _swipeCamVel = 0; _swipeCamTarget = 0;
  camera.position.set(0.2, 9.7, 15.0);
  camera.lookAt(0, -0.8, 1.0);

  cubeMat.uniforms.uCamWorldPos.value.copy(camera.position);



  // Update prayer window sector opacities
  let prayerNow;
  if (window._forceTimeMin != null) {
    prayerNow = new Date(now);
    prayerNow.setHours(Math.floor(window._forceTimeMin / 60), window._forceTimeMin % 60, 0, 0);
    if (!ptSectorsRebuilt) { window._prayerTimingsReady = true; buildPrayerSectors(); ptSectorsRebuilt = true; }
  } else {
    prayerNow = (typeof _getDevNow === 'function' && _devActive) ? _getDevNow() : now;
  }
  updatePrayerWindows(prayerNow);

  // Update dev time slider readout if live
  if (_devActive && !_devTimeOverride) {
    const sl = document.getElementById('_devTimeSlider');
    const lb = document.getElementById('_devTimeLabel');
    if (sl) { const v = now.getHours()*60+now.getMinutes(); sl.value = v; if (lb) lb.textContent = _fmtMin(v); }
  }

  // Probes + reactive podium removed

  // ── Prayer-reactive accent spotlights (Chris lookdev, Mar 4) ──────────────
  // Smooth lerp of color + intensity toward active prayer, or fade to zero.
  // In forced-time renders (timelapse), snap to avoid loop seam pops from history-dependent lerps.
  const _prLerp = (window._forceTimeMin != null) ? 1.0 : PRAYER_LIGHT_LERP;
  if (_activePrayer && !_compassMode) {
    // Active prayer: lerp toward prayer color and target intensity.
    // Wash uses primary color desaturated 35% toward warm neutral — atmospheric, not neon.
    // Rim uses secondary (lighter) color desaturated 15% — edge catch stays richer.
    const _prWash = new THREE.Color(_activePrayer.color); // v6: pure color, no grey desaturation
    _prayerWashColor.lerp(_prWash, _prLerp);
    const _prRim = new THREE.Color(_activePrayer.color2); // v6: pure color2, no grey desaturation
    _prayerRimColor.lerp(_prRim, _prLerp);
    _prayerWashIntensity += (PRAYER_WASH_MAX - _prayerWashIntensity) * _prLerp;
    _prayerRimIntensity += (PRAYER_RIM_MAX - _prayerRimIntensity) * _prLerp;
    // v8: slash — uses primary color for obvious podium edge-catch
    const _prSlash = new THREE.Color(_activePrayer.color);
    _prayerSlashColor.lerp(_prSlash, _prLerp);
    _prayerSlashIntensity += (PRAYER_SLASH_MAX - _prayerSlashIntensity) * _prLerp;
  } else {
    // No active prayer or compass mode: fade to zero
    _prayerWashColor.lerp(new THREE.Color(0x111122), _prLerp);
    _prayerRimColor.lerp(new THREE.Color(0x111122), _prLerp);
    _prayerSlashColor.lerp(new THREE.Color(0x111122), _prLerp);
    _prayerWashIntensity += (0 - _prayerWashIntensity) * _prLerp;
    _prayerRimIntensity += (0 - _prayerRimIntensity) * _prLerp;
    _prayerSlashIntensity += (0 - _prayerSlashIntensity) * _prLerp;
  }
  if (!_compassMode) {
    prayerWash.color.copy(_prayerWashColor);
    prayerWash.intensity = _prayerWashIntensity;
    prayerRim.color.copy(_prayerRimColor);
    prayerRim.intensity = _prayerRimIntensity;
    prayerSlash.color.copy(_prayerSlashColor);
    prayerSlash.intensity = _prayerSlashIntensity;
  }

  // ── Prayer PointLight glow at podium base (Approach B, Chris v7) ──────────
  if (_activePrayer && !_compassMode) {
    const _prGlow = new THREE.Color(_activePrayer.color);
    _prayerGlowColor.lerp(_prGlow, _prLerp);
    _prayerGlowIntensity += (PRAYER_GLOW_MAX - _prayerGlowIntensity) * _prLerp;
  } else {
    _prayerGlowColor.lerp(new THREE.Color(0x111122), _prLerp);
    _prayerGlowIntensity += (0 - _prayerGlowIntensity) * _prLerp;
  }
  prayerGlow.color.copy(_prayerGlowColor);
  prayerGlow.intensity = _prayerGlowIntensity;
  // v7: expose debug state for render pipeline
  window._prayerDebug = {
    active: !!_activePrayer,
    color: _activePrayer ? _activePrayer.color : null,
    washI: _prayerWashIntensity.toFixed(1),
    rimI: _prayerRimIntensity.toFixed(1),
    slashI: _prayerSlashIntensity.toFixed(1),
    glowI: _prayerGlowIntensity.toFixed(1),
    washHex: '#' + _prayerWashColor.getHexString(),
    slashHex: '#' + _prayerSlashColor.getHexString(),
    glowHex: '#' + _prayerGlowColor.getHexString(),
  };


  // FBO pass — prayer accent lights temporarily disabled so their color
  // doesn't bleed into the glass refraction texture. The FBO captures the scene
  // behind the cube; colored lights there make the glass refract colored content.
  cubeMesh.visible = false;
  prayerWash.visible = false;
  prayerRim.visible = false;
  prayerSlash.visible = false; // v8: hide slash during FBO
  prayerGlow.visible = false; // v7: hide PointLight during FBO too
  renderer.setRenderTarget(fboRT);
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);
  cubeMesh.visible = true;
  prayerWash.visible = true;
  prayerRim.visible = true;
  prayerSlash.visible = true;
  prayerGlow.visible = true;
  cubeMat.uniforms.uScene.value = fboRT.texture;

  // Update LTC rect light uniforms — matrixWorld is current after FBO render pass
  _updateRectLightUniform(_plinthRect);

  renderer.render(scene, camera);

  // Expose projected cube corners from the live renderer every frame.
  // Splash reads this as ground truth, so we avoid duplicated camera math drift.
  scene.updateMatrixWorld(true);
  var _cv=[], _hf=0.6;
  for(var _xi=-1;_xi<=1;_xi+=2)for(var _yi=-1;_yi<=1;_yi+=2)for(var _zi=-1;_zi<=1;_zi+=2){
    var _v=new THREE.Vector3(_xi*_hf,_yi*_hf,_zi*_hf).applyMatrix4(cubeMesh.matrixWorld).project(camera);
    _cv.push({x:(_v.x*0.5+0.5)*W, y:(-_v.y*0.5+0.5)*H, ly:_yi});
  }
  window._cubeScreenVerts = _cv;
  var _top=_cv.filter(function(v){return v.ly>0;}).sort(function(a,b){return a.y-b.y;});
  var _bot=_cv.filter(function(v){return v.ly<0;}).sort(function(a,b){return a.y-b.y;});
  if(_top.length===4&&_bot.length===4){
    window._cubeScreenNamed={
      tBack:[_top[0].x,_top[0].y], tLeft:[_top[1].x,_top[1].y], tRight:[_top[2].x,_top[2].y], tFront:[_top[3].x,_top[3].y],
      bBack:[_bot[0].x,_bot[0].y], bLeft:[_bot[1].x,_bot[1].y], bRight:[_bot[2].x,_bot[2].y], bFront:[_bot[3].x,_bot[3].y]
    };
  }

  // Expose projected hand beams for splash continuity (same live positions as scene)
  var _rayCols=['#9900ff','#1133ff','#ffffff'];
  window._clockRayScreen = clockRays.map(function(ray, idx){
    var b = ray.beam || (ray.mesh && ray.mesh.children && ray.mesh.children[0]);
    if(!b) return null;
    var p0 = b.localToWorld(new THREE.Vector3(0,0,0)).project(camera);
    var p1 = b.localToWorld(new THREE.Vector3(0,ray.len||1,0)).project(camera);
    return {
      from:[(p0.x*0.5+0.5)*W, (-p0.y*0.5+0.5)*H],
      to:[(p1.x*0.5+0.5)*W, (-p1.y*0.5+0.5)*H],
      color:_rayCols[idx]||'#ffffff'
    };
  }).filter(Boolean);
  window._clockRayScreenAt = performance.now();

  // Mark scene as ready — splash handles its own timing
  if (!window._sceneReady && window._texturesReady) {
    window._sceneReady = true;
    window._sceneReadyAt = performance.now();

  }

  // ── Grainy gradient overlay (SVG feTurbulence + soft-light) ─────────────────
  // Disabled by default for now (can be re-enabled via window._grainEnabled = true).
  if (window._grainEnabled === undefined) window._grainEnabled = false;
  if (!window._grainEnabled) {
    if (window._grainOverlay) window._grainOverlay.style.display = 'none';
  } else {
    // Adaptive opacity: dark prayers get full grain, bright prayers fade it.
    var _grainPrayerOpacity = {
      'Qiyam': 0.70, 'Fajr': 0.55, 'Sunrise': 0.20, 'Dhuha': 0.15,
      'Dhuhr': 0.25, 'Asr': 0.30, 'Maghrib': 0.55, 'Isha': 0.65
    };
    var _grainBaseOpacity = 0.45; // between prayers
    if (window._grainOverlay) {
      window._grainOverlay.style.display = '';
      var _gpName = _activePrayer && prayerSectors.length > 0
        ? (prayerSectors.find(function(s){ return s.def.color === _activePrayer.color; }) || {}).def
        : null;
      var _gpTarget = _gpName ? (_grainPrayerOpacity[_gpName.name] || _grainBaseOpacity) : _grainBaseOpacity;
      var _gpCur = parseFloat(window._grainOverlay.style.opacity) || 0.70;
      var _gpNext = _gpCur + (_gpTarget - _gpCur) * 0.03; // smooth lerp
      window._grainOverlay.style.opacity = _gpNext.toFixed(3);
    }
    if (!window._grainOverlay) {
      var _grainSvg = document.createElementNS('http://www.w3.org/2000/svg','svg');
      _grainSvg.setAttribute('width','0');
      _grainSvg.setAttribute('height','0');
      _grainSvg.style.position = 'absolute';
      _grainSvg.innerHTML = '<filter id="grainFilter"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>';
      document.body.appendChild(_grainSvg);
      var _grainEl = document.createElement('div');
      _grainEl.id = 'grainOverlay';
      _grainEl.style.cssText = 'position:fixed;inset:0;z-index:1;pointer-events:none;filter:url(#grainFilter);opacity:0.70;mix-blend-mode:soft-light;background:white;';
      document.body.appendChild(_grainEl);
      window._grainOverlay = _grainEl;
    }
  }

  // Sample top-left pixel and sync theme-color meta tag (~once per minute)
  if (++_themeFrameCount >= 3600) {
    _themeFrameCount = 0;
    const gl = renderer.getContext();
    gl.readPixels(0, gl.drawingBufferHeight - 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, _themeBuf);
    const hex = '#' + ((1<<24) + (_themeBuf[0]<<16) + (_themeBuf[1]<<8) + _themeBuf[2]).toString(16).slice(1);
    if (_themeMeta) _themeMeta.setAttribute('content', hex);
  }
})();

// Signal site that clock is ready
document.body.classList.add('clock-ready');

// ─── DEV PANEL ────────────────────────────────────────────────────────────────
// Production mode — no dev panel, no version display on agiftoftime.app
var _isProduction = (location.hostname === 'agiftoftime.app');

// Activate with ?dev in URL or press D key (disabled in production)

// ── Core state (referenced by animation loop + updatePrayerWindows) ───────────
var _devActive      = false;
var _devTimeOverride = null;   // null = real time, else { h, m }
var _devShowBoundaries = false;
var _devBoundaryBeams  = [];
var _devBoundaryPerPrayer = {}; // keyed by prayer name, true = show
var _devCustomSectors  = [];   // kept empty; updatePrayerWindows references it
var _devSnapIntensity  = false; // snap disc intensities instantly on next frame

// ── Speed / simulation ────────────────────────────────────────────────────────
var _devSpeed        = 1;      // active multiplier: 1, 2, 5, 10, 50
var _devSimMinutes   = 0;      // floating-point minutes for simulation
var _devSpeedInterval = null;
var _devLastSpeedMs  = null;

// ── Prayer window controls ────────────────────────────────────────────────────
var _devWindowCount   = 1;     // 1, 2, or 3 — default 1 (only active prayer)
window._devWindowCount = 1;    // exposed for monkey-patch
var _devWindowOverrides = {};  // { prayerName: { intensity: null|number, spread: null|number } }
window._devWindowOverrides = _devWindowOverrides;

// v7: expose for GPU Chrome render pipeline (module scope → window)
window._devJumpToTime = null; // set after function definition below
window._prayerDebug = null;   // set in render loop

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function _fmtMin(m) {
  var h = Math.floor(m / 60) % 24, mm = m % 60;
  var ampm = h >= 12 ? 'PM' : 'AM';
  var h12  = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return h12 + ':' + (mm < 10 ? '0' : '') + mm + ' ' + ampm;
}

function _devJumpToTime(min) {
  min = ((Math.floor(min) % 1440) + 1440) % 1440;
  _devSimMinutes   = min;
  _devTimeOverride = { h: Math.floor(min / 60), m: min % 60 };
  _devSnapIntensity = true;
  var sl = document.getElementById('_devTimeSlider');
  var lb = document.getElementById('_devTimeLabel');
  var lc = document.getElementById('_devTimeLive');
  if (sl) sl.value = min;
  if (lb) lb.textContent = _fmtMin(min);
  if (lc) lc.checked = false;
}
window._devJumpToTime = _devJumpToTime; // v7: expose for render pipeline

function _devStopSpeed() {
  if (_devSpeedInterval) { clearInterval(_devSpeedInterval); _devSpeedInterval = null; }
}

function _devStartSpeed() {
  _devStopSpeed();
  if (_devSpeed <= 1) return;
  _devLastSpeedMs = Date.now();
  _devSpeedInterval = setInterval(function() {
    var now = Date.now();
    var deltaMs = now - (_devLastSpeedMs || now);
    _devLastSpeedMs = now;
    _devSimMinutes = (_devSimMinutes + (deltaMs / 60000) * _devSpeed) % 1440;
    var intMin = Math.floor(_devSimMinutes);
    _devTimeOverride = { h: Math.floor(intMin / 60), m: intMin % 60 };
    var sl = document.getElementById('_devTimeSlider');
    var lb = document.getElementById('_devTimeLabel');
    if (sl) sl.value = intMin;
    if (lb) lb.textContent = _fmtMin(intMin);
  }, 50);
}

// ─────────────────────────────────────────────────────────────────────────────
// Patch disc shaders: inject uFalloff uniform so per-window spread works
// ─────────────────────────────────────────────────────────────────────────────
// All disc shader uniforms (uFalloff, uWidth, uEdgeFade) are baked into the
// initial ShaderMaterial — no runtime patching needed.

// ─────────────────────────────────────────────────────────────────────────────
// Monkey-patch updatePrayerWindows: window count limiting + per-window overrides
// ─────────────────────────────────────────────────────────────────────────────
(function() {
  var _orig = updatePrayerWindows;
  updatePrayerWindows = function(now) {
    _orig(now);
    if (!_devActive) return;

    // ── Window count limiting ────────────────────────────────────────────────
    var wc = window._devWindowCount != null ? window._devWindowCount : 3;
    if (wc < 3) _thirdDisc.visible = false;
    if (wc < 2) _nextDisc.visible  = false;

    // ── Per-window overrides (intensity + spread) ────────────────────────────
    var ov = window._devWindowOverrides;
    if (!ov || !prayerSectors.length) return;

    var nowMin = now.getHours() * 60 + now.getMinutes();
    var aIdx = -1, nIdx = -1, tIdx = -1;
    var bestDist = 99999, secondBest = 99999;
    prayerSectors.forEach(function(ps, i) {
      var wraps    = ps.startMin > ps.endMin;
      var isActive = wraps
        ? (nowMin >= ps.startMin || nowMin < ps.endMin)
        : (nowMin >= ps.startMin && nowMin < ps.endMin);
      if (isActive) { aIdx = i; return; }
      var dist = (ps.startMin - nowMin + 1440) % 1440;
      if (dist < bestDist)          { secondBest = bestDist; tIdx = nIdx; bestDist = dist; nIdx = i; }
      else if (dist < secondBest)   { secondBest = dist; tIdx = i; }
    });

    function applyOv(mat, disc, idx) {
      // Always reset overrideable uniforms so clearing takes effect next frame
      if (mat.uniforms.uFalloff)   mat.uniforms.uFalloff.value   = 2.2;
      if (mat.uniforms.uWidth)     mat.uniforms.uWidth.value     = 1.0;
      if (mat.uniforms.uEdgeFade)  mat.uniforms.uEdgeFade.value  = 12.0;
      if (idx < 0 || !disc.visible) return;
      var ps = prayerSectors[idx];
      if (!ps || !ps.def) return;
      var o = ov[ps.def.name];
      if (!o) return;
      if (o.intensity != null) mat.uniforms.uIntensity.value = o.intensity;
      if (o.spread    != null && mat.uniforms.uFalloff)  mat.uniforms.uFalloff.value  = o.spread;
      if (o.width     != null && mat.uniforms.uWidth)    mat.uniforms.uWidth.value    = o.width;
      if (o.edgeFade  != null && mat.uniforms.uEdgeFade) mat.uniforms.uEdgeFade.value = o.edgeFade;
    }

    applyOv(_prayerDiscMat, _prayerDisc,  aIdx);
    applyOv(_nextDiscMat,   _nextDisc,    nIdx);
    applyOv(_thirdDiscMat,  _thirdDisc,   tIdx);
  };
})();

// ─────────────────────────────────────────────────────────────────────────────
// Panel builder
// ─────────────────────────────────────────────────────────────────────────────
function _devBuildPanel() {
  if (document.getElementById('_devPanel')) return;
  // Disc shaders already have all uniforms baked in — no patching needed

  var timeNow = new Date();
  var initMin = timeNow.getHours() * 60 + timeNow.getMinutes();
  _devSimMinutes = initMin;

  var panel = document.createElement('div');
  panel.id = '_devPanel';
  panel.style.cssText = [
    'position:fixed;top:8px;left:8px;z-index:99999',
    'background:rgba(0,0,0,0.92)',
    'color:#ccc;font:10px/1.5 monospace',
    'padding:10px;border-radius:8px',
    'max-height:92vh;overflow-y:auto',
    'width:240px',
    'backdrop-filter:blur(8px)',
    'border:1px solid rgba(255,255,255,0.12)'
  ].join(';');

  // Inject style for number inputs
  if (!document.getElementById('_devNumStyle')) {
    var st = document.createElement('style');
    st.id = '_devNumStyle';
    st.textContent = '._dNum{width:48px;background:#1a1a2a;color:#fff;border:1px solid #444;border-radius:3px;font:10px monospace;padding:1px 3px;text-align:right;-moz-appearance:textfield;}._dNum:focus{border-color:#66f;outline:none;}._dNum::-webkit-inner-spin-button,._dNum::-webkit-outer-spin-button{opacity:1;}';
    document.head.appendChild(st);
  }

  function sec(label) {
    return '<div style="color:#fff;font-size:9px;letter-spacing:0.8px;font-weight:700;'
         + 'margin:10px 0 5px;opacity:0.55;text-transform:uppercase">' + label + '</div>';
  }
  function btnBase(active) {
    return 'font:10px monospace;border:1px solid #555;border-radius:3px;padding:2px 6px;cursor:pointer;'
         + 'background:' + (active ? '#3a3a66' : '#2a2a2a') + ';color:' + (active ? '#aaf' : '#aaa');
  }
  function hr() {
    return '<div style="border-top:1px solid rgba(255,255,255,0.08);margin:8px 0"></div>';
  }

  var speedBtns = [1, 2, 5, 10, 50].map(function(v) {
    return '<button data-speed="' + v + '" style="flex:1;' + btnBase(v === 1) + '">' + v + 'x</button>';
  }).join('');

  var wcBtns = [1, 2, 3].map(function(v) {
    return '<button data-wc="' + v + '" style="' + btnBase(v === _devWindowCount) + '">' + v + '</button>';
  }).join('');

  panel.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
      '<span style="color:#fff;font-size:12px;font-weight:700">🕐 Dev Panel</span>' +
      '<button id="_devMinimize" style="background:none;border:none;color:#888;font:bold 14px monospace;cursor:pointer;padding:0 4px">−</button>' +
    '</div>' +
    '<div id="_devBody">' +

    sec('Time Control') +
    '<div style="display:flex;align-items:center;gap:5px;margin-bottom:4px">' +
      '<input type="range" id="_devTimeSlider" min="0" max="1439" value="' + initMin + '" style="flex:1;min-width:0">' +
      '<span id="_devTimeLabel" style="color:#fff;white-space:nowrap;font-size:11px;min-width:58px;text-align:right">' + _fmtMin(initMin) + '</span>' +
    '</div>' +
    '<div id="_devSpeedBtns" style="display:flex;gap:3px;margin-bottom:5px">' + speedBtns + '</div>' +
    '<div style="display:flex;align-items:center;gap:8px">' +
      '<label style="display:flex;align-items:center;gap:4px;cursor:pointer">' +
        '<input type="checkbox" id="_devTimeLive" checked>' +
        '<span style="color:#aaa">Live</span>' +
      '</label>' +
      '<button id="_devTimeReset" style="' + btnBase(false) + '">Reset</button>' +
    '</div>' +

    hr() +
    sec('Prayer Windows') +
    '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">' +
      '<span style="color:#888">Windows:</span>' +
      '<div id="_devWcBtns" style="display:flex;gap:3px">' + wcBtns + '</div>' +
    '</div>' +
    '<div id="_devWindowList"></div>' +

    hr() +
    sec('Clock Hands') +
    (function() {
      var hands = [
        { name: 'Hour', color: '#9900ff', defLen: 4.80, defW: 0.30, defOp: 1.45 },
        { name: 'Minute', color: '#1133ff', defLen: 7.77, defW: 0.30, defOp: 1.50 },
        { name: 'Second', color: '#ffffff', defLen: 12.56, defW: 0.30, defOp: 1.20 }
      ];
      return hands.map(function(h, i) {
        var ray = clockRays[i];
        var curOp = ray ? ray.mesh.children[0].material.uniforms.op.value : h.defOp;
        return '<div style="margin-bottom:5px">'
          + '<div style="display:flex;align-items:center;gap:5px;margin-bottom:2px">'
          +   '<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:' + h.color + '"></span>'
          +   '<span style="color:#ccc;font-weight:600">' + h.name + '</span>'
          + '</div>'
          + '<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px">'
          +   '<span style="color:#888;width:32px;flex-shrink:0;font-size:9px">Len</span>'
          +   '<input type="range" class="_dHandLen" data-hi="' + i + '" min="100" max="1500" value="' + Math.round(h.defLen * 100) + '" style="flex:1;min-width:0">'
          +   '<span class="_dHandLenV" data-hi="' + i + '" style="color:#fff;width:28px;text-align:right;font-size:9px">' + h.defLen.toFixed(1) + '</span>'
          + '</div>'
          + '<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px">'
          +   '<span style="color:#888;width:32px;flex-shrink:0;font-size:9px">Wid</span>'
          +   '<input type="range" class="_dHandW" data-hi="' + i + '" min="10" max="200" value="' + Math.round(h.defW * 100) + '" style="flex:1;min-width:0">'
          +   '<span class="_dHandWV" data-hi="' + i + '" style="color:#fff;width:28px;text-align:right;font-size:9px">' + h.defW.toFixed(2) + '</span>'
          + '</div>'
          + '<div style="display:flex;align-items:center;gap:4px">'
          +   '<span style="color:#888;width:32px;flex-shrink:0;font-size:9px">Int</span>'
          +   '<input type="range" class="_dHandOp" data-hi="' + i + '" min="0" max="300" value="' + Math.round(curOp * 100) + '" style="flex:1;min-width:0">'
          +   '<span class="_dHandOpV" data-hi="' + i + '" style="color:#fff;width:28px;text-align:right;font-size:9px">' + curOp.toFixed(2) + '</span>'
          + '</div>'
          + '</div>';
      }).join('');
    })() +

    hr() +
    sec('Global Controls') +
    '<div style="margin-bottom:3px">' +
      '<div style="display:flex;align-items:center;gap:5px">' +
        '<span style="color:#888;width:54px;flex-shrink:0">Intensity</span>' +
        '<input type="range" id="_devOpActive" min="0" max="300" value="' + Math.round(OP_ACTIVE * 100) + '" style="flex:1;min-width:0">' +
        '<span id="_devOpActiveV" style="color:#fff;width:24px;text-align:right">' + OP_ACTIVE.toFixed(1) + '</span>' +
      '</div>' +
    '</div>' +
    '<div style="margin-bottom:6px">' +
      '<div style="display:flex;align-items:center;gap:5px">' +
        '<span style="color:#888;width:54px;flex-shrink:0">Step</span>' +
        '<input type="range" id="_devOpStep" min="0" max="100" value="' + Math.round(OP_STEP * 100) + '" style="flex:1;min-width:0">' +
        '<span id="_devOpStepV" style="color:#fff;width:24px;text-align:right">' + OP_STEP.toFixed(2) + '</span>' +
      '</div>' +
    '</div>' +
    '<div style="margin-bottom:6px">' +
      '<div style="display:flex;align-items:center;gap:5px">' +
        '<span style="color:#888;width:54px;flex-shrink:0">Hole</span>' +
        '<input type="range" id="_devHoleSize" min="0" max="300" value="50" style="flex:1;min-width:0">' +
        '<span id="_devHoleSizeV" style="color:#fff;width:24px;text-align:right">0.50</span>' +
      '</div>' +
    '</div>' +
    '<div style="margin-bottom:8px">' +
      '<label style="display:flex;align-items:center;gap:5px;cursor:pointer">' +
        '<input type="checkbox" id="_devBoundaries"' + (_devShowBoundaries ? ' checked' : '') + '>' +
        '<span style="color:#aaa">Boundary lines</span>' +
      '</label>' +
    '</div>' +
    '<button id="_devResetAll" style="' + btnBase(false) + ';width:100%">↺ Reset All</button>' +

    sec('Tahajjud — Last Third') +
    '<div style="margin-bottom:8px">' +
      '<label style="display:flex;align-items:center;gap:5px;cursor:pointer">' +
        '<input type="checkbox" id="_devTahajjudForce">' +
        '<span style="color:#aaa">Force Tahajjud mode</span>' +
      '</label>' +
    '</div>' +
    '<div style="display:flex;justify-content:space-between;font-size:10px;color:#777;margin-bottom:4px">' +
      '<span>Blend: <span id="_devTahajjudBlend" style="color:#fff">0.00</span></span>' +
      '<span>Starts: <span id="_devTahajjudStart" style="color:#fff">--:--</span></span>' +
      '<span id="_devTahajjudStatus" style="color:#555">inactive</span>' +
    '</div>' +

    sec('Scene Lights') +
    '<div id="_devLights" style="display:flex;flex-direction:column;gap:5px"></div>' +

    sec('Film Grain') +
    '<div style="display:flex;flex-direction:column;gap:6px">' +
      '<label style="display:flex;align-items:center;gap:5px;cursor:pointer">' +
        '<input type="checkbox" id="_devGrainToggle" checked>' +
        '<span style="color:#aaa">Enable grain</span>' +
      '</label>' +
      '<div style="display:flex;gap:4px;align-items:center">' +
        '<label style="color:#888;font-size:9px;white-space:nowrap">Intensity</label>' +
        '<input type="range" id="_devGrainStrength" min="0" max="200" value="100" style="flex:1">' +
        '<span id="_devGrainStrengthV" style="color:#fff;font-size:10px;width:28px;text-align:right">1.00</span>' +
      '</div>' +
    '</div>' +

    sec('Export') +
    '<div style="display:flex;flex-direction:column;gap:6px">' +
      '<div style="display:flex;gap:4px;align-items:center">' +
        '<label style="color:#888;font-size:9px;white-space:nowrap">Size</label>' +
        '<select id="_devExportSize" style="flex:1;background:#1a1a2a;border:1px solid #333;color:#ccc;padding:2px 4px;border-radius:4px;font:10px monospace">' +
          '<option value="1080x1080">1080×1080 (IG Square)</option>' +
          '<option value="1080x1920">1080×1920 (Stories/Reels)</option>' +
          '<option value="1920x1080">1920×1080 (HD)</option>' +
          '<option value="2160x3840">2160×3840 (Twitter/X Preferred)</option>' +
          '<option value="2160x2160">2160×2160 (4K Square)</option>' +
          '<option value="3840x2160">3840×2160 (4K UHD)</option>' +
          '<option value="current" selected>Current viewport</option>' +
        '</select>' +
      '</div>' +
      '<div style="display:flex;gap:4px;align-items:center">' +
        '<label style="color:#888;font-size:9px;white-space:nowrap">DPR</label>' +
        '<select id="_devExportDpr" style="flex:1;background:#1a1a2a;border:1px solid #333;color:#ccc;padding:2px 4px;border-radius:4px;font:10px monospace">' +
          '<option value="1">1x</option>' +
          '<option value="2" selected>2x</option>' +
          '<option value="3">3x</option>' +
        '</select>' +
      '</div>' +
      '<label style="display:flex;align-items:center;gap:5px;cursor:pointer">' +
        '<input type="checkbox" id="_devExportNoChrome" checked>' +
        '<span style="color:#aaa">Hide UI chrome</span>' +
      '</label>' +
      '<button id="_devExportPNG" style="' + btnBase(false) + ';width:100%">📸 Export PNG</button>' +
      '<button id="_devExportSeq" style="' + btnBase(false) + ';width:100%">🎞 Export All Prayers</button>' +
      '<button id="_devExportWebM" style="' + btnBase(false) + ';width:100%">🎬 Record 10s WebM</button>' +
    '</div>' +

    '</div>'; // end _devBody

  document.body.appendChild(panel);

  // ── Minimize ────────────────────────────────────────────────────────────────
  document.getElementById('_devMinimize').addEventListener('click', function() {
    var body = document.getElementById('_devBody');
    if (body.style.display === 'none') { body.style.display = ''; this.textContent = '−'; }
    else                               { body.style.display = 'none'; this.textContent = '+'; }
  });

  // ── Time slider ─────────────────────────────────────────────────────────────
  var slider  = document.getElementById('_devTimeSlider');
  var label   = document.getElementById('_devTimeLabel');
  var liveChk = document.getElementById('_devTimeLive');

  slider.addEventListener('input', function() {
    liveChk.checked = false;
    var min = parseInt(slider.value);
    _devSimMinutes   = min;
    label.textContent = _fmtMin(min);
    _devTimeOverride = { h: Math.floor(min / 60), m: min % 60 };
    if (_devSpeed > 1) _devStartSpeed();
  });

  liveChk.addEventListener('change', function() {
    if (liveChk.checked) {
      _devStopSpeed();
      _devTimeOverride = null;
      _devSpeed = 1;
      _devUpdateSpeedBtns();
    }
  });

  document.getElementById('_devTimeReset').addEventListener('click', function() {
    _devStopSpeed();
    _devSpeed = 1;
    _devTimeOverride = null;
    liveChk.checked = true;
    var now = new Date();
    var v = now.getHours() * 60 + now.getMinutes();
    slider.value = v;
    label.textContent = _fmtMin(v);
    _devSimMinutes = v;
    _devUpdateSpeedBtns();
  });

  // ── Speed buttons ───────────────────────────────────────────────────────────
  function _devUpdateSpeedBtns() {
    document.querySelectorAll('#_devSpeedBtns button').forEach(function(btn) {
      var v = parseInt(btn.dataset.speed);
      var active = (v === _devSpeed);
      btn.style.background = active ? '#3a3a66' : '#2a2a2a';
      btn.style.color       = active ? '#aaf'    : '#aaa';
    });
  }

  document.getElementById('_devSpeedBtns').addEventListener('click', function(e) {
    var btn = e.target.closest('[data-speed]');
    if (!btn) return;
    _devSpeed = parseInt(btn.dataset.speed);
    _devUpdateSpeedBtns();
    _devStopSpeed();
    if (_devSpeed === 1) {
      if (liveChk.checked) _devTimeOverride = null;
    } else {
      liveChk.checked = false;
      if (!_devTimeOverride) {
        var now = new Date();
        _devSimMinutes   = now.getHours() * 60 + now.getMinutes();
        _devTimeOverride = { h: Math.floor(_devSimMinutes / 60), m: Math.floor(_devSimMinutes) % 60 };
      }
      _devStartSpeed();
    }
  });

  // ── Window count buttons ────────────────────────────────────────────────────
  function _devUpdateWcBtns() {
    document.querySelectorAll('#_devWcBtns button').forEach(function(btn) {
      var v = parseInt(btn.dataset.wc);
      var active = (v === _devWindowCount);
      btn.style.background = active ? '#3a3a66' : '#2a2a2a';
      btn.style.color       = active ? '#aaf'    : '#aaa';
    });
  }

  document.getElementById('_devWcBtns').addEventListener('click', function(e) {
    var btn = e.target.closest('[data-wc]');
    if (!btn) return;
    _devWindowCount = parseInt(btn.dataset.wc);
    window._devWindowCount = _devWindowCount;
    _devUpdateWcBtns();
  });

  // ── Clock hand sliders ───────────────────────────────────────────────────────
  var _handDefs = [
    { len: 4.80, w: 0.30, op: 1.45 },
    { len: 7.77, w: 0.30, op: 1.50 },
    { len: 12.56, w: 0.30, op: 1.20 }
  ];

  function _devRebuildHandGeo(i, newW, newLen) {
    var ray = clockRays[i];
    if (!ray) return;
    var child = ray.mesh.children[0];
    child.geometry.dispose();
    var g = new THREE.PlaneGeometry(newW, newLen, 1, 16);
    g.translate(0, newLen / 2, 0);
    child.geometry = g;
  }

  document.querySelectorAll('._dHandLen').forEach(function(inp) {
    inp.addEventListener('input', function() {
      var i = parseInt(inp.dataset.hi);
      var val = parseFloat(inp.value) / 100;
      var wInp = document.querySelector('._dHandW[data-hi="' + i + '"]');
      var curW = wInp ? parseFloat(wInp.value) / 100 : _handDefs[i].w;
      _devRebuildHandGeo(i, curW, val);
      var vSpan = document.querySelector('._dHandLenV[data-hi="' + i + '"]');
      if (vSpan) vSpan.textContent = val.toFixed(2);
    });
  });

  document.querySelectorAll('._dHandW').forEach(function(inp) {
    inp.addEventListener('input', function() {
      var i = parseInt(inp.dataset.hi);
      var val = parseFloat(inp.value) / 100;
      var lInp = document.querySelector('._dHandLen[data-hi="' + i + '"]');
      var curLen = lInp ? parseFloat(lInp.value) / 100 : _handDefs[i].len;
      _devRebuildHandGeo(i, val, curLen);
      var vSpan = document.querySelector('._dHandWV[data-hi="' + i + '"]');
      if (vSpan) vSpan.textContent = val.toFixed(2);
    });
  });

  document.querySelectorAll('._dHandOp').forEach(function(inp) {
    inp.addEventListener('input', function() {
      var i = parseInt(inp.dataset.hi);
      var val = parseFloat(inp.value) / 100;
      var ray = clockRays[i];
      if (ray) ray.mesh.children[0].material.uniforms.op.value = val;
      var vSpan = document.querySelector('._dHandOpV[data-hi="' + i + '"]');
      if (vSpan) vSpan.textContent = val.toFixed(2);
    });
  });

  // ── Global intensity sliders ────────────────────────────────────────────────
  document.getElementById('_devOpActive').addEventListener('input', function(e) {
    window._OP_ACTIVE_OVERRIDE = parseFloat(e.target.value) / 100;
    document.getElementById('_devOpActiveV').textContent = window._OP_ACTIVE_OVERRIDE.toFixed(1);
  });

  document.getElementById('_devOpStep').addEventListener('input', function(e) {
    window._OP_STEP_OVERRIDE = parseFloat(e.target.value) / 100;
    document.getElementById('_devOpStepV').textContent = window._OP_STEP_OVERRIDE.toFixed(2);
  });

  // ── Hole size (center cutout under cube) ─────────────────────────────────────
  document.getElementById('_devHoleSize').addEventListener('input', function(e) {
    var val = parseFloat(e.target.value) / 100;
    [_prayerDiscMat, _nextDiscMat, _thirdDiscMat].forEach(function(m) {
      m.uniforms.uHoleSize.value = val;
    });
    document.getElementById('_devHoleSizeV').textContent = val.toFixed(2);
  });

  // ── Boundaries toggle ───────────────────────────────────────────────────────
  document.getElementById('_devBoundaries').addEventListener('change', function(e) {
    _devShowBoundaries = e.target.checked;
    _devUpdateBoundaries();
  });

  // ── Tahajjud force toggle ─────────────────────────────────────────────────
  document.getElementById('_devTahajjudForce').addEventListener('change', function(e) {
    _tahajjudForced = e.target.checked;
    _tahajjudLastCheck = 0; // force re-check immediately
  });

  // ── Tahajjud readout update (every 500ms) ───────────────────────────────────
  setInterval(function() {
    var blendEl = document.getElementById('_devTahajjudBlend');
    var startEl = document.getElementById('_devTahajjudStart');
    var statusEl = document.getElementById('_devTahajjudStatus');
    if (blendEl) blendEl.textContent = (window._tahajjudBlend || 0).toFixed(2);
    if (startEl) {
      var sm = _tahajjudStartMin;
      var hh = Math.floor(sm / 60) % 24, mm = sm % 60;
      startEl.textContent = (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm;
    }
    if (statusEl) {
      statusEl.textContent = window._tahajjudActive ? 'ACTIVE' : 'inactive';
      statusEl.style.color = window._tahajjudActive ? '#88ff88' : '#555';
    }
  }, 500);

  // ── Reset All ───────────────────────────────────────────────────────────────
  document.getElementById('_devResetAll').addEventListener('click', function() {
    _devStopSpeed();
    _devSpeed = 1;
    _devUpdateSpeedBtns();
    _devTimeOverride = null;
    liveChk.checked  = true;
    var now = new Date();
    var v   = now.getHours() * 60 + now.getMinutes();
    slider.value = v;
    label.textContent = _fmtMin(v);
    _devSimMinutes = v;

    window._OP_ACTIVE_OVERRIDE = null;
    window._OP_STEP_OVERRIDE   = null;
    document.getElementById('_devOpActive').value = Math.round(OP_ACTIVE * 100);
    document.getElementById('_devOpActiveV').textContent = OP_ACTIVE.toFixed(1);
    document.getElementById('_devOpStep').value = Math.round(OP_STEP * 100);
    document.getElementById('_devOpStepV').textContent = OP_STEP.toFixed(2);

    _devWindowOverrides        = {};
    window._devWindowOverrides = _devWindowOverrides;
    _devWindowCount            = 3;
    window._devWindowCount     = 3;
    _devUpdateWcBtns();

    [_prayerDiscMat, _nextDiscMat, _thirdDiscMat].forEach(function(mat) {
      if (mat.uniforms.uFalloff)  mat.uniforms.uFalloff.value  = 2.2;
      if (mat.uniforms.uWidth)    mat.uniforms.uWidth.value    = 1.0;
      if (mat.uniforms.uEdgeFade) mat.uniforms.uEdgeFade.value = 12.0;
      if (mat.uniforms.uHoleSize) mat.uniforms.uHoleSize.value = 0.5;
    });

    // Reset clock hands
    _handDefs.forEach(function(def, i) {
      _devRebuildHandGeo(i, def.w, def.len);
      var ray = clockRays[i];
      if (ray) ray.mesh.children[0].material.uniforms.op.value = def.op;
      var lInp = document.querySelector('._dHandLen[data-hi="' + i + '"]');
      var wInp = document.querySelector('._dHandW[data-hi="' + i + '"]');
      var oInp = document.querySelector('._dHandOp[data-hi="' + i + '"]');
      if (lInp) lInp.value = Math.round(def.len * 100);
      if (wInp) wInp.value = Math.round(def.w * 100);
      if (oInp) oInp.value = Math.round(def.op * 100);
      var lV = document.querySelector('._dHandLenV[data-hi="' + i + '"]');
      var wV = document.querySelector('._dHandWV[data-hi="' + i + '"]');
      var oV = document.querySelector('._dHandOpV[data-hi="' + i + '"]');
      if (lV) lV.textContent = def.len.toFixed(1);
      if (wV) wV.textContent = def.w.toFixed(2);
      if (oV) oV.textContent = def.op.toFixed(2);
    });

    _devBoundaryPerPrayer = {};
    _devUpdateBoundaries();
    _devRefreshWindowList();
  });

  _devRefreshWindowList();

  // ── Convert hand value spans to editable number inputs ────────────────────
  function _devWireHandNumInput(cls, sliderCls, divisor) {
    document.querySelectorAll(cls).forEach(function(span) {
      var i = span.dataset.hi;
      var inp = document.createElement('input');
      inp.type = 'number';
      inp.className = '_dNum';
      inp.step = divisor >= 10 ? '0.01' : '0.1';
      inp.value = span.textContent;
      inp.dataset.hi = i;
      span.replaceWith(inp);
      inp.addEventListener('change', function() {
        var val = parseFloat(inp.value);
        if (isNaN(val)) return;
        var sl = document.querySelector(sliderCls + '[data-hi="' + i + '"]');
        if (sl) { sl.value = Math.round(val * divisor); sl.dispatchEvent(new Event('input')); }
      });
      var sl = document.querySelector(sliderCls + '[data-hi="' + i + '"]');
      if (sl) {
        sl.addEventListener('input', function() {
          inp.value = (parseFloat(sl.value) / divisor).toFixed(divisor >= 10 ? 2 : 1);
        });
      }
    });
  }
  _devWireHandNumInput('._dHandLenV', '._dHandLen', 100);
  _devWireHandNumInput('._dHandWV', '._dHandW', 100);
  _devWireHandNumInput('._dHandOpV', '._dHandOp', 100);

  // Convert global OP value spans to editable
  ['_devOpActiveV', '_devOpStepV'].forEach(function(id) {
    var span = document.getElementById(id);
    if (!span) return;
    var inp = document.createElement('input');
    inp.type = 'number'; inp.className = '_dNum'; inp.id = id;
    inp.step = '0.1'; inp.value = span.textContent;
    span.replaceWith(inp);
  });

  // ── Film grain controls ──────────────────────────────────────────────────────
  document.getElementById('_devGrainToggle').addEventListener('change', function(e) {
    if (window._grainOverlay) {
      window._grainOverlay.style.display = e.target.checked ? '' : 'none';
    }
  });
  document.getElementById('_devGrainStrength').addEventListener('input', function() {
    var v = parseFloat(this.value) / 100;
    document.getElementById('_devGrainStrengthV').textContent = v.toFixed(2);
    if (window._grainOverlay) window._grainOverlay.style.opacity = v * 0.70;
  });

  // ── Scene Lights sliders ──────────────────────────────────────────────────
  (function() {
    var lightsDev = document.getElementById('_devLights');
    if (!lightsDev) return;
    var lights = [
      { name: 'back', ref: back, maxI: 80 },
      { name: 'cubeBack', ref: cubeBack, maxI: 30 },
      { name: 'violetRim', ref: violetRim, maxI: 20 },
      { name: 'rim', ref: rim, maxI: 20 },
      { name: 'cubeSun', ref: cubeSun, maxI: 100 },
      { name: 'prayerWash', ref: prayerWash, maxI: 20 },
      { name: 'prayerRim', ref: prayerRim, maxI: 20 },
      { name: 'prayerSlash', ref: prayerSlash, maxI: 60 },
      { name: 'plinthRect', ref: _plinthRect, maxI: 30 },
      { name: 'plinthSpot', ref: _plinthSpot, maxI: 60 },
      { name: 'podiumFrontWash', ref: podiumFrontWash, maxI: 40 },
      { name: 'prayerGlow', ref: prayerGlow, maxI: 10 }
    ];
    var html = '';
    lights.forEach(function(l, idx) {
      var c = '#' + l.ref.color.getHexString();
      var iv = Math.round((l.ref.intensity / l.maxI) * 1000);
      html += '<div style="display:flex;gap:4px;align-items:center">' +
        '<input type="color" class="_dlCol" data-li="' + idx + '" value="' + c + '" style="width:20px;height:18px;padding:0;border:none;cursor:pointer">' +
        '<span style="color:#888;font-size:9px;white-space:nowrap;min-width:65px">' + l.name + '</span>' +
        '<input type="range" class="_dlInt" data-li="' + idx + '" min="0" max="1000" value="' + iv + '" style="flex:1;min-width:0">' +
        '<span class="_dlIntV" data-li="' + idx + '" style="color:#fff;font-size:10px;width:32px;text-align:right">' + l.ref.intensity.toFixed(1) + '</span>' +
      '</div>';
    });
    lightsDev.innerHTML = html;
    lightsDev.addEventListener('input', function(e) {
      var li = parseInt(e.target.getAttribute('data-li'));
      if (isNaN(li)) return;
      var l = lights[li];
      if (e.target.classList.contains('_dlInt')) {
        var v = parseFloat(e.target.value) / 1000 * l.maxI;
        l.ref.intensity = v;
        lightsDev.querySelector('._dlIntV[data-li="' + li + '"]').textContent = v.toFixed(1);
      } else if (e.target.classList.contains('_dlCol')) {
        l.ref.color.set(e.target.value);
      }
    });
    // Sync sliders every 2s (prayer lerps change values)
    setInterval(function() {
      lights.forEach(function(l, idx) {
        var intSlider = lightsDev.querySelector('._dlInt[data-li="' + idx + '"]');
        var intLabel = lightsDev.querySelector('._dlIntV[data-li="' + idx + '"]');
        var colPicker = lightsDev.querySelector('._dlCol[data-li="' + idx + '"]');
        if (intSlider && document.activeElement !== intSlider) {
          intSlider.value = Math.round((l.ref.intensity / l.maxI) * 1000);
          intLabel.textContent = l.ref.intensity.toFixed(1);
        }
        if (colPicker && document.activeElement !== colPicker) {
          colPicker.value = '#' + l.ref.color.getHexString();
        }
      });
    }, 2000);
  })();

  // ── Dev panel button wiring (reads from UI dropdowns) ──────────────────────
  function _devExportGetSize() {
    var sel = document.getElementById('_devExportSize');
    if (!sel || sel.value === 'current') return { w: W, h: H };
    var parts = sel.value.split('x');
    return { w: parseInt(parts[0]), h: parseInt(parts[1]) };
  }

  document.getElementById('_devExportPNG').addEventListener('click', function() {
    var size = _devExportGetSize();
    var expDpr = parseInt(document.getElementById('_devExportDpr').value) || 2;
    var hide = document.getElementById('_devExportNoChrome').checked;
    var ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    window._exportFrame({
      width: size.w, height: size.h, dpr: expDpr, hideChrome: hide,
      filename: 'agot-' + size.w + 'x' + size.h + '-' + ts + '.png'
    });
  });

  document.getElementById('_devExportSeq').addEventListener('click', function() {
    if (!prayerSectors.length) { alert('No prayer data loaded yet'); return; }
    var btn = this;
    btn.disabled = true; btn.textContent = '⏳ Exporting...';
    var size = _devExportGetSize();
    var expDpr = parseInt(document.getElementById('_devExportDpr').value) || 2;
    var hide = document.getElementById('_devExportNoChrome').checked;
    window._exportAllPrayers({
      width: size.w, height: size.h, dpr: expDpr, hideChrome: hide
    }).then(function() {
      btn.disabled = false; btn.textContent = '🎞 Export All Prayers';
    });
  });

  document.getElementById('_devExportWebM').addEventListener('click', function() {
    var btn = this;
    if (btn._recording) { btn._recorder.stop(); return; }
    var canvas = renderer.domElement;
    var stream = canvas.captureStream(30);
    var recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 8000000 });
    var chunks = [];
    recorder.ondataavailable = function(e) { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = function() {
      btn._recording = false;
      btn.textContent = '🎬 Record 10s WebM';
      btn.style.background = '';
      var blob = new Blob(chunks, { type: 'video/webm' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'agot-recording-' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) + '.webm';
      a.click();
      URL.revokeObjectURL(url);
    };
    recorder.start();
    btn._recording = true;
    btn._recorder = recorder;
    btn.textContent = '⏹ Stop Recording';
    btn.style.background = 'rgba(200,50,50,0.4)';
    setTimeout(function() { if (btn._recording) recorder.stop(); }, 10000);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Prayer window list — collapsible per-prayer rows
// ─────────────────────────────────────────────────────────────────────────────
function _devRefreshWindowList() {
  var el = document.getElementById('_devWindowList');
  if (!el) return;
  var T = window._prayerTimings || PT_FALLBACK;

  var rows = PRAYER_WINDOWS_DEF.map(function(d) {
    var startMin = ptParseMin(T[d.startKey] || '0:00');
    var endMin   = ptParseMin(T[d.endKey]   || '0:00');
    var midMin   = d.startKey === 'Midnight'
      ? (startMin + Math.floor(((endMin - startMin + 1440) % 1440) / 2)) % 1440
      : startMin + 5;
    var ov       = _devWindowOverrides[d.name] || {};
    var colorHex = '#' + d.color.toString(16).padStart(6, '0');
    var intSet   = ov.intensity  != null;
    var spSet    = ov.spread     != null;
    var wdSet    = ov.width      != null;
    var efSet    = ov.edgeFade   != null;
    var intVal   = intSet ? ov.intensity  : OP_ACTIVE;
    var spVal    = spSet  ? ov.spread     : 2.2;
    var wdVal    = wdSet  ? ov.width      : 1.0;
    var efVal    = efSet  ? ov.edgeFade   : 12.0;

    var jumpBtnS = function(dkey, val, col, lbl) {
      return '<button class="_dJmp" data-jump="' + val + '" style="'
        + 'background:#2a2a2a;color:' + col + ';border:1px solid #555;border-radius:3px;'
        + 'font:9px monospace;padding:1px 5px;cursor:pointer">' + lbl + '</button>';
    };

    return '<details style="margin-bottom:2px">'
      + '<summary style="display:flex;align-items:center;gap:5px;cursor:pointer;'
      +   'list-style:none;padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.05)'
      +   ';user-select:none">'
      +   '<span style="display:inline-block;width:9px;height:9px;border-radius:50%;'
      +     'background:' + colorHex + ';flex-shrink:0"></span>'
      +   '<span style="flex:1;color:#ccc">' + d.name + '</span>'
      +   jumpBtnS('start', startMin,              '#8f8', 'start')
      +   jumpBtnS('mid',   midMin,                '#ff8', 'mid')
      +   jumpBtnS('end',   Math.max(endMin-2, 0), '#f88', 'end')
      + '</summary>'
      + '<div style="padding:5px 0 4px 14px" data-prayer="' + d.name + '">'
      +   '<div style="display:flex;align-items:center;gap:4px;margin-bottom:3px">'
      +     '<span style="color:#888;width:56px;flex-shrink:0">Intensity</span>'
      +     '<input type="range" class="_dOvInt" data-prayer="' + d.name + '"'
      +       ' min="0" max="300" value="' + Math.round(intVal * 100) + '" step="1" style="flex:1;min-width:0">'
      +     '<span class="_dOvIntV" data-prayer="' + d.name + '"'
      +       ' style="color:' + (intSet ? '#fff' : '#555') + ';width:32px;text-align:right;font-size:9px">'
      +       (intSet ? intVal.toFixed(2) : 'global') + '</span>'
      +     '<button class="_dOvIntR" data-prayer="' + d.name + '"'
      +       ' title="Reset to global" style="background:none;border:none;color:#555;cursor:pointer;font:11px monospace;padding:0 2px">↺</button>'
      +   '</div>'
      +   '<div style="display:flex;align-items:center;gap:4px">'
      +     '<span style="color:#888;width:56px;flex-shrink:0">Spread</span>'
      +     '<input type="range" class="_dOvSp" data-prayer="' + d.name + '"'
      +       ' min="5" max="500" value="' + Math.round(spVal * 100) + '" step="1" style="flex:1;min-width:0">'
      +     '<span class="_dOvSpV" data-prayer="' + d.name + '"'
      +       ' style="color:' + (spSet ? '#fff' : '#555') + ';width:32px;text-align:right;font-size:9px">'
      +       (spSet ? spVal.toFixed(2) : '2.2') + '</span>'
      +     '<button class="_dOvSpR" data-prayer="' + d.name + '"'
      +       ' title="Reset spread" style="background:none;border:none;color:#555;cursor:pointer;font:11px monospace;padding:0 2px">↺</button>'
      +   '</div>'
      +   '<div style="display:flex;align-items:center;gap:4px;margin-top:3px">'
      +     '<span style="color:#888;width:56px;flex-shrink:0">Width</span>'
      +     '<input type="range" class="_dOvWd" data-prayer="' + d.name + '"'
      +       ' min="5" max="200" value="' + Math.round(wdVal * 100) + '" step="1" style="flex:1;min-width:0">'
      +     '<span class="_dOvWdV" data-prayer="' + d.name + '"'
      +       ' style="color:' + (wdSet ? '#fff' : '#555') + ';width:32px;text-align:right;font-size:9px">'
      +       (wdSet ? wdVal.toFixed(2) : '1.0') + '</span>'
      +     '<button class="_dOvWdR" data-prayer="' + d.name + '"'
      +       ' title="Reset width" style="background:none;border:none;color:#555;cursor:pointer;font:11px monospace;padding:0 2px">↺</button>'
      +   '</div>'
      +   '<div style="display:flex;align-items:center;gap:4px;margin-top:3px">'
      +     '<span style="color:#888;width:56px;flex-shrink:0">Edge fade</span>'
      +     '<input type="range" class="_dOvEf" data-prayer="' + d.name + '"'
      +       ' min="2" max="30" value="' + Math.round(efVal) + '" step="1" style="flex:1;min-width:0">'
      +     '<span class="_dOvEfV" data-prayer="' + d.name + '"'
      +       ' style="color:' + (efSet ? '#fff' : '#555') + ';width:32px;text-align:right;font-size:9px">'
      +       (efSet ? efVal.toFixed(0) : '12') + '</span>'
      +     '<button class="_dOvEfR" data-prayer="' + d.name + '"'
      +       ' title="Reset edge fade" style="background:none;border:none;color:#555;cursor:pointer;font:11px monospace;padding:0 2px">↺</button>'
      +   '</div>'
      +   '<div style="display:flex;align-items:center;gap:4px;margin-top:4px">'
      +     '<label style="display:flex;align-items:center;gap:4px;cursor:pointer">'
      +       '<input type="checkbox" class="_dOvBnd" data-prayer="' + d.name + '"'
      +         (_devBoundaryPerPrayer[d.name] ? ' checked' : '') + '>'
      +       '<span style="color:#888;font-size:9px">Boundary lines</span>'
      +     '</label>'
      +   '</div>'
      + '</div>'
      + '</details>';
  });

  el.innerHTML = rows.join('');

  // ── Jump buttons (stop propagation so <details> doesn't toggle) ────────────
  el.querySelectorAll('._dJmp').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      _devJumpToTime(parseInt(btn.dataset.jump));
    });
  });

  // ── Intensity override ──────────────────────────────────────────────────────
  el.querySelectorAll('._dOvInt').forEach(function(inp) {
    inp.addEventListener('input', function() {
      var pname = inp.dataset.prayer;
      var val   = parseFloat(inp.value) / 100;
      if (!_devWindowOverrides[pname]) _devWindowOverrides[pname] = {};
      _devWindowOverrides[pname].intensity = val;
      window._devWindowOverrides = _devWindowOverrides;
      var vSpan = el.querySelector('._dOvIntV[data-prayer="' + pname + '"]');
      if (vSpan) { vSpan.textContent = val.toFixed(2); vSpan.style.color = '#fff'; }
    });
  });

  el.querySelectorAll('._dOvIntR').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var pname = btn.dataset.prayer;
      if (_devWindowOverrides[pname]) _devWindowOverrides[pname].intensity = null;
      window._devWindowOverrides = _devWindowOverrides;
      var inp   = el.querySelector('._dOvInt[data-prayer="' + pname + '"]');
      var vSpan = el.querySelector('._dOvIntV[data-prayer="' + pname + '"]');
      if (inp)   inp.value = Math.round(OP_ACTIVE * 100);
      if (vSpan) { vSpan.textContent = 'global'; vSpan.style.color = '#555'; }
    });
  });

  // ── Spread override ─────────────────────────────────────────────────────────
  el.querySelectorAll('._dOvSp').forEach(function(inp) {
    inp.addEventListener('input', function() {
      var pname = inp.dataset.prayer;
      var val   = parseFloat(inp.value) / 100;
      if (!_devWindowOverrides[pname]) _devWindowOverrides[pname] = {};
      _devWindowOverrides[pname].spread = val;
      window._devWindowOverrides = _devWindowOverrides;
      var vSpan = el.querySelector('._dOvSpV[data-prayer="' + pname + '"]');
      if (vSpan) { vSpan.textContent = val.toFixed(2); vSpan.style.color = '#fff'; }
    });
  });

  el.querySelectorAll('._dOvSpR').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var pname = btn.dataset.prayer;
      if (_devWindowOverrides[pname]) _devWindowOverrides[pname].spread = null;
      window._devWindowOverrides = _devWindowOverrides;
      var inp   = el.querySelector('._dOvSp[data-prayer="' + pname + '"]');
      var vSpan = el.querySelector('._dOvSpV[data-prayer="' + pname + '"]');
      if (inp)   inp.value = 220; // 2.2 * 100
      if (vSpan) { vSpan.textContent = '2.2'; vSpan.style.color = '#555'; }
    });
  });

  // ── Width override ──────────────────────────────────────────────────────────
  el.querySelectorAll('._dOvWd').forEach(function(inp) {
    inp.addEventListener('input', function() {
      var pname = inp.dataset.prayer;
      var val   = parseFloat(inp.value) / 100;
      if (!_devWindowOverrides[pname]) _devWindowOverrides[pname] = {};
      _devWindowOverrides[pname].width = val;
      window._devWindowOverrides = _devWindowOverrides;
      var vSpan = el.querySelector('._dOvWdV[data-prayer="' + pname + '"]');
      if (vSpan) { vSpan.textContent = val.toFixed(2); vSpan.style.color = '#fff'; }
    });
  });

  el.querySelectorAll('._dOvWdR').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var pname = btn.dataset.prayer;
      if (_devWindowOverrides[pname]) _devWindowOverrides[pname].width = null;
      window._devWindowOverrides = _devWindowOverrides;
      var inp   = el.querySelector('._dOvWd[data-prayer="' + pname + '"]');
      var vSpan = el.querySelector('._dOvWdV[data-prayer="' + pname + '"]');
      if (inp)   inp.value = 100; // 1.0 * 100
      if (vSpan) { vSpan.textContent = '1.0'; vSpan.style.color = '#555'; }
    });
  });

  // ── Edge Fade override ──────────────────────────────────────────────────────
  el.querySelectorAll('._dOvEf').forEach(function(inp) {
    inp.addEventListener('input', function() {
      var pname = inp.dataset.prayer;
      var val   = parseFloat(inp.value);
      if (!_devWindowOverrides[pname]) _devWindowOverrides[pname] = {};
      _devWindowOverrides[pname].edgeFade = val;
      window._devWindowOverrides = _devWindowOverrides;
      var vSpan = el.querySelector('._dOvEfV[data-prayer="' + pname + '"]');
      if (vSpan) { vSpan.textContent = val.toFixed(0); vSpan.style.color = '#fff'; }
    });
  });

  el.querySelectorAll('._dOvEfR').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var pname = btn.dataset.prayer;
      if (_devWindowOverrides[pname]) _devWindowOverrides[pname].edgeFade = null;
      window._devWindowOverrides = _devWindowOverrides;
      var inp   = el.querySelector('._dOvEf[data-prayer="' + pname + '"]');
      var vSpan = el.querySelector('._dOvEfV[data-prayer="' + pname + '"]');
      if (inp)   inp.value = 12;
      if (vSpan) { vSpan.textContent = '12'; vSpan.style.color = '#555'; }
    });
  });

  // ── Per-prayer boundary checkbox ────────────────────────────────────────────
  el.querySelectorAll('._dOvBnd').forEach(function(chk) {
    chk.addEventListener('change', function() {
      var pname = chk.dataset.prayer;
      _devBoundaryPerPrayer[pname] = chk.checked;
      _devUpdateBoundaries();
    });
  });

  // ── Convert per-prayer value spans to editable number inputs ──────────────
  var prayerNumPairs = [
    { spanCls: '_dOvIntV', sliderCls: '_dOvInt', div: 100, step: '0.01' },
    { spanCls: '_dOvSpV',  sliderCls: '_dOvSp',  div: 100, step: '0.01' },
    { spanCls: '_dOvWdV',  sliderCls: '_dOvWd',  div: 100, step: '0.01' },
    { spanCls: '_dOvEfV',  sliderCls: '_dOvEf',  div: 1,  step: '1' }
  ];
  prayerNumPairs.forEach(function(pair) {
    el.querySelectorAll('.' + pair.spanCls).forEach(function(span) {
      var pname = span.dataset.prayer;
      var inp = document.createElement('input');
      inp.type = 'number'; inp.className = '_dNum ' + pair.spanCls;
      inp.dataset.prayer = pname;
      inp.step = pair.step; inp.value = span.textContent === 'global' ? '' : span.textContent;
      inp.placeholder = span.textContent;
      inp.style.color = span.style.color;
      span.replaceWith(inp);
      inp.addEventListener('change', function() {
        var val = parseFloat(inp.value);
        if (isNaN(val)) return;
        var sl = el.querySelector('.' + pair.sliderCls + '[data-prayer="' + pname + '"]');
        if (sl) { sl.value = Math.round(val * pair.div); sl.dispatchEvent(new Event('input')); }
      });
      var sl = el.querySelector('.' + pair.sliderCls + '[data-prayer="' + pname + '"]');
      if (sl) {
        sl.addEventListener('input', function() {
          inp.value = (parseFloat(sl.value) / pair.div).toFixed(pair.div >= 10 ? 1 : 0);
          inp.style.color = '#fff';
        });
      }
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Boundary debug lines (thin beams at start/end of each prayer sector)
// ─────────────────────────────────────────────────────────────────────────────
function _devUpdateBoundaries() {
  _devBoundaryBeams.forEach(function(b) { prismGroup.remove(b); });
  _devBoundaryBeams.length = 0;
  if (!_devActive) return;

  var allSectors = prayerSectors.concat(_devCustomSectors || []);
  var anyPerPrayer = Object.keys(_devBoundaryPerPrayer).some(function(k) { return _devBoundaryPerPrayer[k]; });

  allSectors.forEach(function(ps) {
    // If any per-prayer checkbox is on, only show those. Otherwise respect global toggle.
    var pName = ps.def ? ps.def.name : '';
    if (anyPerPrayer) {
      if (!_devBoundaryPerPrayer[pName]) return;
    } else {
      if (!_devShowBoundaries) return;
    }
    [ps.startAng, ps.endAng].forEach(function(ang) {
      var geo = new THREE.PlaneGeometry(0.02, SECTOR_RADIUS, 1, 1);
      geo.translate(0, SECTOR_RADIUS / 2, 0);
      var mat = new THREE.MeshBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 0.4,
        side: THREE.DoubleSide, depthWrite: false
      });
      var m    = new THREE.Mesh(geo, mat);
      var grp  = new THREE.Group();
      grp.add(m);
      grp.position.y    = 0.04;
      grp.rotation.order = 'YXZ';
      grp.rotation.y    = ang;
      grp.rotation.x    = Math.PI / 2;
      prismGroup.add(grp);
      _devBoundaryBeams.push(grp);
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// _getDevNow — called every animation frame
// ─────────────────────────────────────────────────────────────────────────────
function _getDevNow() {
  if (_devTimeOverride) {
    var d = new Date();
    // Use fractional _devSimMinutes for smooth second-hand motion during speed playback
    var totalSec = _devSimMinutes * 60;
    var hrs = Math.floor(totalSec / 3600) % 24;
    var mins = Math.floor((totalSec % 3600) / 60);
    var secs = Math.floor(totalSec % 60);
    var ms = Math.floor((totalSec % 1) * 1000);
    d.setHours(hrs, mins, secs, ms);
    return d;
  }
  return (typeof window._cityNow === 'function') ? window._cityNow() : new Date();
}

// ─────────────────────────────────────────────────────────────────────────────
// Toggle dev mode
// ─────────────────────────────────────────────────────────────────────────────
function _devToggle() {
  _devActive = !_devActive;
  var p = document.getElementById('_devPanel');
  if (_devActive) {
    _devBuildPanel();
    document.getElementById('_devPanel').style.display = '';
    _devUpdateBoundaries();
    renderer.domElement.style.zIndex = '0';
  } else {
    if (p) p.style.display = 'none';
    _devBoundaryBeams.forEach(function(b) { prismGroup.remove(b); });
    _devBoundaryBeams.length = 0;
    renderer.domElement.style.zIndex = '';
    _devTimeOverride = null;
    _devStopSpeed();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Activation — ?dev URL param or D key
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// EXPORT API — global, works without dev panel open
// _exportFrame(opts)        → Promise<Blob>  (single PNG)
// _exportAllPrayers(opts)   → Promise<[{name,blob}]>
// _recordWebM(opts)         → Promise<Blob>  (WebM video)
// ─────────────────────────────────────────────────────────────────────────────
window._exportFrame = function(opts) {
  opts = opts || {};
  var expW   = opts.width  || W;
  var expH   = opts.height || H;
  var expDpr = opts.dpr    || 2;
  var hide   = opts.hideChrome !== false;

  return new Promise(function(resolve) {
    var prayerSet = false;
    if (typeof opts.prayer === 'number' && typeof _swipeShowPreview === 'function') {
      _swipeShowPreview(opts.prayer);
      prayerSet = true;
    }

    function doCapture() {
      var chromeEls = [];
      if (hide) {
        document.querySelectorAll(
          '.fs-header,.mode-pill,.compass-chrome,#fsTapHint,.mode-label,._devPanel,#_devPanel,.clock-onboard'
        ).forEach(function(el) {
          if (el.style.display !== 'none' && getComputedStyle(el).opacity !== '0') {
            chromeEls.push({ el: el, prev: el.style.visibility });
            el.style.visibility = 'hidden';
          }
        });
        document.body.classList.add('chrome-hidden');
      }

      var origW = W, origH = H, origDpr = dpr;
      var canvas = renderer.domElement;
      var origCW = canvas.style.width, origCH = canvas.style.height;

      // Resize renderer + FBO to export resolution
      W = expW; H = expH; dpr = expDpr;
      renderer.setPixelRatio(expDpr);
      renderer.setSize(expW, expH, false);
      canvas.style.width  = expW + 'px';
      canvas.style.height = expH + 'px';
      camera.aspect = expW / expH;
      camera.updateProjectionMatrix();
      fboRT.setSize(expW * expDpr, expH * expDpr);

      // Let the REAL render loop run 3 frames at export resolution
      // (includes FBO two-pass, prayer window updates, lighting — everything)
      var _framesLeft = 3;
      function _waitFrames() {
        if (--_framesLeft > 0) { requestAnimationFrame(_waitFrames); return; }
        // Capture after real render loop has run
          // Capture after real render loop has run
        canvas.toBlob(function(blob) {
          // Restore original size
          W = origW; H = origH; dpr = origDpr;
          renderer.setPixelRatio(origDpr);
          renderer.setSize(origW, origH, false);
          canvas.style.width  = origCW;
          canvas.style.height = origCH;
          camera.aspect = origW / origH;
          camera.updateProjectionMatrix();
          fboRT.setSize(origW * origDpr, origH * origDpr);

          chromeEls.forEach(function(c) { c.el.style.visibility = c.prev; });
          if (hide) document.body.classList.remove('chrome-hidden');

          if (opts.download !== false && opts.filename) {
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url; a.download = opts.filename; a.click();
            URL.revokeObjectURL(url);
          }
          resolve(blob);
        }, 'image/png');
      }
      requestAnimationFrame(_waitFrames);
    }

    if (prayerSet) setTimeout(doCapture, 800);
    else doCapture();
  });
};

window._exportAllPrayers = function(opts) {
  opts = opts || {};
  var results = [];
  var idx = 0;
  return new Promise(function(resolve) {
    function next() {
      if (idx >= prayerSectors.length) {
        if (typeof _swipeRevert === 'function') _swipeRevert();
        resolve(results);
        return;
      }
      var name = prayerSectors[idx].def ? prayerSectors[idx].def.name : 'prayer-' + idx;
      window._exportFrame(Object.assign({}, opts, {
        prayer: idx,
        filename: opts.download !== false ? ('agot-' + name + '-' + (opts.width||W) + 'x' + (opts.height||H) + '.png') : null
      })).then(function(blob) {
        results.push({ name: name, idx: idx, blob: blob });
        idx++;
        setTimeout(next, 300);
      });
    }
    next();
  });
};

window._recordWebM = function(opts) {
  opts = opts || {};
  var canvas = renderer.domElement;
  var dur = opts.duration || 10000;
  var stream = canvas.captureStream(opts.fps || 30);
  var recorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp9',
    videoBitsPerSecond: opts.bitrate || 8000000
  });
  var chunks = [];
  return new Promise(function(resolve) {
    recorder.ondataavailable = function(e) { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = function() {
      var blob = new Blob(chunks, { type: 'video/webm' });
      if (opts.filename) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = opts.filename; a.click();
        URL.revokeObjectURL(url);
      }
      resolve(blob);
    };
    recorder.start();
    setTimeout(function() { recorder.stop(); }, dur);
  });
};

if (location.search.includes('dev') && !_isProduction) {
  _devActive = true;
  setTimeout(_devBuildPanel, 100);
  setTimeout(_devUpdateBoundaries, 200);
}
document.addEventListener('keydown', function(e) {
  if ((e.key === 'D' || e.key === 'd') && !_isProduction) _devToggle();
  // G key — quick grain A/B toggle (desktop)
  if (e.key === 'G' || e.key === 'g') {
    if (window._grainOverlay) {
      var vis = window._grainOverlay.style.display !== 'none';
      window._grainOverlay.style.display = vis ? 'none' : '';
      var chk = document.getElementById('_devGrainToggle');
      if (chk) chk.checked = !vis;
    }
  }
});

// Two-finger double-tap — grain A/B toggle (mobile)
var _grainTwoTapLast = 0;
document.addEventListener('touchstart', function(e) {
  if (e.touches.length === 2 && window._grainOverlay) {
    var now = Date.now();
    if (now - _grainTwoTapLast < 400) {
      var vis = window._grainOverlay.style.display !== 'none';
      window._grainOverlay.style.display = vis ? 'none' : '';
      var chk = document.getElementById('_devGrainToggle');
      if (chk) chk.checked = !vis;
      _grainTwoTapLast = 0;
    } else {
      _grainTwoTapLast = now;
    }
  }
}, { passive: true
});

// ─────────────────────────────────────────────────────────────────────────────
// PRAYER SWIPE — swipe left/right to preview prayer times
// ─────────────────────────────────────────────────────────────────────────────
var _swipeStartX = 0, _swipeStartY = 0, _swipeSwiping = false;
var _swipePreviewIdx = -1;   // -1 = live mode, 0-7 = prayer index
var _swipeRevertTimer = null;
Object.defineProperty(window, '_swipePreviewIdx', {
  get: function() { return _swipePreviewIdx; },
  set: function(v) { _swipePreviewIdx = v; }
});
Object.defineProperty(window, '_swipeRevertTimer', {
  get: function() { return _swipeRevertTimer; },
  set: function(v) { _swipeRevertTimer = v; }
});
var _swipeLabelEl = null;
var _swipeFadeTimer = null;
var _prayerDotsEl = null;
var _currentPrayerLabelEl = null;
var _currentPrayerLabelTimer = null;

// ── Current Prayer Label + 7 Dots ──
// Shows the active prayer name + dot indicators at rest (not swiping).
// During swipe, _swipeShowPreview takes over the label; dots update to match.
function _ensurePrayerDotsEl() {
  if (_prayerDotsEl) return;
  _prayerDotsEl = document.createElement('div');
  _prayerDotsEl.id = '_prayerDots';
  _prayerDotsEl.style.cssText = 'position:fixed;bottom:calc(env(safe-area-inset-bottom,8px) + clamp(20px,4vmin,32px) + 82px);left:50%;transform:translateX(-50%);z-index:951;display:flex;gap:6px;align-items:center;justify-content:center;pointer-events:none;transition:opacity .4s ease;opacity:0';
  document.body.appendChild(_prayerDotsEl);
}

function _ensureCurrentPrayerLabel() {
  if (_currentPrayerLabelEl) return;
  _currentPrayerLabelEl = document.createElement('div');
  _currentPrayerLabelEl.id = '_currentPrayerLabel';
  _currentPrayerLabelEl.style.cssText = 'position:fixed;bottom:calc(env(safe-area-inset-bottom,8px) + clamp(20px,4vmin,32px) + 96px);left:50%;transform:translateX(-50%);z-index:951;text-align:center;pointer-events:none;transition:opacity .4s ease;opacity:0;font-family:var(--font)';
  document.body.appendChild(_currentPrayerLabelEl);
}

function _updatePrayerDots(activeIdx) {
  _ensurePrayerDotsEl();
  if (!prayerSectors.length) return;
  var n = prayerSectors.length;
  var curIdx = _swipeGetCurrentIdx();
  var html = '';
  for (var step = 0; step < n; step++) {
    var i = (curIdx + step) % n; // rotate: current prayer is first dot
    var isActive = (i === activeIdx);
    var c = new THREE.Color(prayerSectors[i].def.color);
    var hex = '#' + c.getHexString();
    var size = isActive ? '7px' : '5px';
    var opacity = isActive ? '1' : '0.35';
    var bg = isActive ? hex : 'rgba(232,228,220,.5)';
    html += '<span style="width:' + size + ';height:' + size + ';border-radius:50%;background:' + bg + ';opacity:' + opacity + ';display:inline-block;transition:all .3s ease"></span>';
  }
  _prayerDotsEl.innerHTML = html;
}

function _showCurrentPrayerLabel() {
  if (!prayerSectors.length) return;
  // Don't show during swipe preview
  if (_swipePreviewIdx >= 0) return;
  var idx = _swipeGetCurrentIdx();
  var ps = prayerSectors[idx];
  if (!ps) return;
  var def = ps.def;
  var c = new THREE.Color(def.color);
  var hex = '#' + c.getHexString();

  var _cpH = Math.floor(ps.startMin / 60), _cpMn = ps.startMin % 60;
  var _cpTimeStr = (_cpH < 10 ? '0' : '') + _cpH + ':' + (_cpMn < 10 ? '0' : '') + _cpMn;
  var _cpInfo = def.isForbidden ? 'Avoid prayer'
    : def.name === 'Last Third' ? 'Best time for Tahajjud'
    : (def.name === 'Dhuha' || def.name === 'Qiyam') ? 'Sunnah Mu\'akkadah'
    : (def.name === 'Fajr' || def.name === 'Dhuhr' || def.name === 'Asr' || def.name === 'Maghrib' || def.name === 'Isha') ? 'Obligatory Prayer' : '';
  var _cpInfoColor = def.isForbidden ? '#888' : 'rgba(232,228,220,.45)';
  var _cpInfoDiv = _cpInfo ? '<div style="font-size:clamp(.5rem,.9vw,.6rem);font-weight:300;letter-spacing:.08em;color:' + _cpInfoColor + ';margin-top:3px">' + _cpInfo + '</div>' : '';

  // Contextual content pill — same as swipe preview
  var _cpHint = null;
  var _cpLastTen = window._isRamadan && (window._islamicNight >= 21);
  if ((def.name === 'Qiyam' || def.name === 'Last Third') && _cpLastTen) {
    _cpHint = { label: 'Tonight\'s dua', action: 'qiyam' };
  } else if (def.name === 'Maghrib' && _cpLastTen) {
    _cpHint = { label: 'Hadith of the day', action: 'maghrib' };
  } else {
    var _cpCtx = (typeof window._getIslamicContext === 'function') ? window._getIslamicContext() : [];
    if (_cpCtx.length > 0) _cpHint = { label: _cpCtx[0].label || 'View content', action: 'context' };
  }
  var _cpPillDiv = '';
  if (_cpHint) {
    _cpPillDiv = '<div id="_swipeContentPill" onclick="window._openSwipeContent&&window._openSwipeContent()" style="' +
      'display:inline-flex;align-items:center;gap:5px;margin-top:8px;padding:5px 14px;pointer-events:auto;' +
      'border-radius:20px;background:rgba(232,228,220,.08);backdrop-filter:blur(8px);' +
      'cursor:pointer;transition:transform .35s cubic-bezier(.23,1,.32,1),opacity .3s ease;' +
      'animation:_pillIn .4s cubic-bezier(.23,1,.32,1) both">' +
      '<span style="font-size:.65rem;color:' + hex + '">✦</span>' +
      '<span style="font-size:clamp(.55rem,1vw,.65rem);font-weight:300;letter-spacing:.06em;color:rgba(232,228,220,.6)">' + _cpHint.label + '</span>' +
      '</div>';
  }
  var _cpPillSlot = '<div style="height:34px;display:flex;align-items:center;justify-content:center">' + _cpPillDiv + '</div>';

  _ensureCurrentPrayerLabel();
  _currentPrayerLabelEl.innerHTML =
    '<div style="font-size:clamp(.6rem,1.2vw,.75rem);font-weight:400;letter-spacing:.15em;text-transform:uppercase;color:' + hex + ';opacity:.7;margin-bottom:2px">' + def.name + '</div>' +
    '<div style="font-size:clamp(1rem,2.5vw,1.3rem);font-weight:300;color:rgba(232,228,220,.85);letter-spacing:.04em;font-variant-numeric:tabular-nums">' + _cpTimeStr + '</div>' +
    _cpInfoDiv + _cpPillSlot;
  _currentPrayerLabelEl.style.opacity = '1';
  _currentPrayerLabelEl.style.display = 'block';

  _updatePrayerDots(idx);
  _prayerDotsEl.style.opacity = '1';
  _prayerDotsEl.style.display = 'flex';

  // Fade out after 4s (matches chrome timing)
  clearTimeout(_currentPrayerLabelTimer);
  _currentPrayerLabelTimer = setTimeout(function() {
    if (_currentPrayerLabelEl) _currentPrayerLabelEl.style.opacity = '0';
    if (_prayerDotsEl) _prayerDotsEl.style.opacity = '0';
  }, 4000);
}

// Hook into chrome show — when chrome appears, show current prayer label too
var _origShowChrome = window._showChrome;
if (typeof _origShowChrome === 'function') {
  window._showChrome = function() {
    _origShowChrome();
    if (!_compassMode && _swipePreviewIdx < 0) _showCurrentPrayerLabel();
  };
}

function _swipeGetCurrentIdx() {
  // Find which prayer is currently active (live)
  var T = window._prayerTimings;
  if (!T) return 0;
  var now = (typeof window._cityNow === 'function') ? window._cityNow() : new Date();
  var nowMin = now.getHours() * 60 + now.getMinutes();
  for (var i = 0; i < prayerSectors.length; i++) {
    var s = prayerSectors[i].startMin, e = prayerSectors[i].endMin;
    if (e < s) { // wraps midnight
      if (nowMin >= s || nowMin < e) return i;
    } else {
      if (nowMin >= s && nowMin < e) return i;
    }
  }
  return 0;
}

window._swipeShowPreview = _swipeShowPreview;
function _swipeShowPreview(idx) {
  if (!prayerSectors.length) return;
  var _sectorCount = prayerSectors.length || 8;
  idx = ((idx % _sectorCount) + _sectorCount) % _sectorCount;
  var _prevPreviewIdx = _swipePreviewIdx;
  _swipePreviewIdx = idx;

  // Dismiss overlays when swiping away from the prayer that opened them
  if (idx !== _prevPreviewIdx && window._lastSwipeOverlayPrayer) {
    if (typeof window._hideQiyamDua === 'function') window._hideQiyamDua();
    if (typeof window._hideMaghribHadith === 'function') window._hideMaghribHadith();
  }

  // Compute Hijri night for this preview prayer
  // If preview prayer starts at or after Maghrib (and we're currently before Maghrib),
  // the Islamic night is hijriDay + 1
  var _curIdx = _swipeGetCurrentIdx();
  var _maghribIdx = -1;
  for (var mi = 0; mi < _sectorCount; mi++) {
    if (prayerSectors[mi].def.name === 'Maghrib') { _maghribIdx = mi; break; }
  }
  // Count how many steps forward from current to preview
  var _stepsForward = ((idx - _curIdx) % _sectorCount + _sectorCount) % _sectorCount;
  var _stepsToMaghrib = _maghribIdx >= 0 ? ((_maghribIdx - _curIdx) % _sectorCount + _sectorCount) % _sectorCount : 999;
  var _mSec = window._maghribSec || 0;
  var _nw = (typeof window._cityNow === 'function') ? window._cityNow() : new Date();
  var _nowSec = _nw.getHours() * 3600 + _nw.getMinutes() * 60 + _nw.getSeconds();
  // If currently before Maghrib AND preview is at or past Maghrib boundary → next night
  if (_nowSec < _mSec && _stepsForward >= _stepsToMaghrib && _stepsToMaghrib > 0) {
    window._swipeNightNum = (window._hijriDay || 0) + 1;
  } else {
    window._swipeNightNum = window._islamicNight || 0;
  }

  // Update header Hijri display for swipe preview — lock so live timer can't overwrite
  window._swipeHijriLock = true;
  var _hijriEl = document.getElementById('hijriTop');
  if (_hijriEl && window._isRamadan && window._swipeNightNum > 0) {
    var _sn = window._swipeNightNum;
    var _ord = _sn===1?'st':_sn===2?'nd':_sn===3?'rd':_sn%10===1&&_sn!==11?'st':_sn%10===2&&_sn!==12?'nd':_sn%10===3&&_sn!==13?'rd':'th';
    // Determine if preview prayer is a "night" prayer (Maghrib→Fajr) or "day" prayer (Sunrise→Asr)
    var _previewName = prayerSectors[idx].def.name;
    var _isNightPrayer = (_previewName==='Maghrib'||_previewName==='Isha'||_previewName==='Qiyam'||_previewName==='Last Third'||_previewName==='Fajr');
    if (_isNightPrayer) {
      _hijriEl.innerHTML = '<span style="color:#e0e0e0">' + _sn + _ord + ' Night of Ramadan  ·  رمضان</span>';
    } else {
      // Day prayer in the rolled-forward sequence — show the Hijri day number
      var _dayForPreview = (_sn > (window._hijriDay||0)) ? _sn : (window._hijriDay||0);
      _hijriEl.innerHTML = '<span style="color:#e0e0e0">' + _dayForPreview + ' Ramadan 1447 AH  ·  رمضان</span>';
    }
  }

  // Show chrome during prayer preview
  document.body.classList.remove('chrome-hidden');
  if (typeof window._resetChromeTimer === 'function') window._resetChromeTimer();
  var ps = prayerSectors[idx];
  var def = ps.def;
  var T = window._prayerTimings;
  // Determine if this preview prayer needs tomorrow's times
  // Today's prayers: everything up to and including Isha
  // Tomorrow's prayers: Qiyam, Fajr, Sunrise, Dhuha, Dhuhr, Asr that wrap past midnight
  var _ishaIdx = -1;
  for (var ii = 0; ii < _sectorCount; ii++) {
    if (prayerSectors[ii].def.name === 'Isha') { _ishaIdx = ii; break; }
  }
  var _stepsToIsha = _ishaIdx >= 0 ? ((_ishaIdx - _curIdx) % _sectorCount + _sectorCount) % _sectorCount : 999;
  // Prayer is "tomorrow" if it's beyond Isha in the forward sequence AND we're currently before Maghrib
  var _isTomorrow = (_nowSec < _mSec && _stepsForward > _stepsToIsha && _stepsToIsha >= 0);
  var _tT = window._tomorrowPrayerTimings;
  if (_isTomorrow && _tT) {
    var _tKey = def.startKey; // Use the same key as today's sector def
    if (_tT[_tKey]) {
      var _tp = _tT[_tKey].split(':').map(Number);
      var _tStartMin = (_tp[0]||0)*60 + (_tp[1]||0) + (def.startOffset||0);
      var _swH = Math.floor(_tStartMin / 60), _swMn = _tStartMin % 60;
      var timeStr = (_swH < 10 ? '0' : '') + _swH + ':' + (_swMn < 10 ? '0' : '') + _swMn;
    } else {
      var _swH = Math.floor(ps.startMin / 60), _swMn = ps.startMin % 60;
      var timeStr = (_swH < 10 ? '0' : '') + _swH + ':' + (_swMn < 10 ? '0' : '') + _swMn;
    }
  } else {
    var _swH = Math.floor(ps.startMin / 60), _swMn = ps.startMin % 60;
    var timeStr = (_swH < 10 ? '0' : '') + _swH + ':' + (_swMn < 10 ? '0' : '') + _swMn;
  }

  // Create/update the preview label above nav pill
  if (!_swipeLabelEl) {
    _swipeLabelEl = document.createElement('div');
    _swipeLabelEl.id = '_swipeLabel';
    _swipeLabelEl.style.cssText = 'position:fixed;bottom:calc(env(safe-area-inset-bottom,8px) + clamp(20px,4vmin,32px) + 96px);left:50%;transform:translateX(-50%);z-index:951;text-align:center;pointer-events:none;transition:opacity .3s ease;font-family:var(--font)';
    document.body.appendChild(_swipeLabelEl);
  }
  var c = new THREE.Color(def.color);
  var hex = '#' + c.getHexString();
  var _infoText = def.isForbidden ? 'Avoid prayer'
    : def.name === 'Last Third' ? 'Best time for Tahajjud'
    : (def.name === 'Dhuha' || def.name === 'Qiyam') ? 'Sunnah Mu\'akkadah'
    : (def.name === 'Fajr' || def.name === 'Dhuhr' || def.name === 'Asr' || def.name === 'Maghrib' || def.name === 'Isha') ? 'Obligatory Prayer' : '';
  var _infoColor = def.isForbidden ? '#888' : 'rgba(232,228,220,.45)';
  var _infoDiv = _infoText ? '<div style="font-size:clamp(.5rem,.9vw,.6rem);font-weight:300;letter-spacing:.08em;color:' + _infoColor + ';margin-top:3px">' + _infoText + '</div>' : '';

  // Contextual content pill — compute inline based on prayer + state
  var _hint = null;
  var _lastTen = window._isRamadan && (window._islamicNight >= 21 || (window._swipeNightNum && window._swipeNightNum >= 21));
  if ((def.name === 'Qiyam' || def.name === 'Last Third') && _lastTen) {
    _hint = { label: 'Tonight\'s dua', action: 'qiyam' };
  } else if (def.name === 'Maghrib' && _lastTen) {
    _hint = { label: 'Hadith of the day', action: 'maghrib' };
  } else {
    var _ctx = (typeof window._getIslamicContext === 'function') ? window._getIslamicContext() : [];
    if (_ctx.length > 0) _hint = { label: _ctx[0].label || 'View content', action: 'context' };
  }
  window._swipeContentHint = _hint;
  var _pillDiv = '';
  if (_hint) {
    _pillDiv = '<div id="_swipeContentPill" onclick="window._openSwipeContent&&window._openSwipeContent()" style="' +
      'display:inline-flex;align-items:center;gap:5px;margin-top:8px;padding:5px 14px;pointer-events:auto;' +
      'border-radius:20px;background:rgba(232,228,220,.08);backdrop-filter:blur(8px);' +
      'cursor:pointer;transition:transform .35s cubic-bezier(.23,1,.32,1),opacity .3s ease;' +
      'animation:_pillIn .4s cubic-bezier(.23,1,.32,1) both">' +
      '<span style="font-size:.65rem;color:' + hex + '">✦</span>' +
      '<span style="font-size:clamp(.55rem,1vw,.65rem);font-weight:300;letter-spacing:.06em;color:rgba(232,228,220,.6)">' + _hint.label + '</span>' +
      '</div>';
  }

  // Fixed-height pill slot (34px) — always reserved so label doesn't jump
  var _pillSlot = '<div style="height:34px;display:flex;align-items:center;justify-content:center">' + _pillDiv + '</div>';

  _swipeLabelEl.innerHTML =
    '<div style="font-size:clamp(.6rem,1.2vw,.75rem);font-weight:400;letter-spacing:.15em;text-transform:uppercase;color:' + hex + ';opacity:.7;margin-bottom:2px">' + def.name + '</div>' +
    '<div style="font-size:clamp(1rem,2.5vw,1.3rem);font-weight:300;color:rgba(232,228,220,.85);letter-spacing:.04em;font-variant-numeric:tabular-nums">' + timeStr + '</div>' +
    _infoDiv + _pillSlot;
  _swipeLabelEl.style.display = 'block';
  _swipeLabelEl.style.opacity = '1';

  // Hide current-prayer label during swipe (swipe label takes over)
  if (_currentPrayerLabelEl) { _currentPrayerLabelEl.style.opacity = '0'; }
  clearTimeout(_currentPrayerLabelTimer);
  // Hide qadr button during swipe to avoid overlap
  var _qadrBtn = document.getElementById('qadrFloatBtn');
  if (_qadrBtn) _qadrBtn.style.opacity = '0';

  // Update dots to match swipe position
  _updatePrayerDots(idx);
  if (_prayerDotsEl) { _prayerDotsEl.style.opacity = '1'; _prayerDotsEl.style.display = 'flex'; }

  // Fill the nav pill circle with prayer color
  // Update glow bar to prayer color during swipe
  var _pillSlider = document.getElementById('modePillSlider');
  if (_pillSlider) {
    _pillSlider.style.setProperty('--pill-glow-bar', hex);
    _pillSlider.style.setProperty('--pill-glow-bar-shadow', hex + '73');
    _pillSlider.style.setProperty('--pill-glow-bar-soft', hex + '26');
    _pillSlider.style.setProperty('--pill-glow', hex + '1f');
  }

  // Color ONLY the selected prayer — others stay default (no dimming)
  document.querySelectorAll('#fsPrayerTimes span[data-prayer]').forEach(function(sp) {
    if (sp.dataset.prayer === def.name) {
      sp.style.color = hex;
    } else {
      sp.style.color = '';
    }
    sp.style.opacity = '';
  });

  // Animate clock time to this prayer's start
  if (_swipeTimeOverride === null) _swipeTimeOverride = ps.startMin; // first swipe: no lerp needed
  _swipeTimeTarget = ps.startMin;

  // Auto-revert after 8 seconds
  clearTimeout(_swipeRevertTimer);
  _swipeRevertTimer = setTimeout(_swipeRevert, 4000);
}

var _swipeTimeOverride = null; // minutes from midnight (current), or null for live
var _swipeTimeTarget  = null; // where we're lerping TO
// Expose for export tooling
Object.defineProperty(window, '_swipeTimeOverride', {
  get: function() { return _swipeTimeOverride; },
  set: function(v) { _swipeTimeOverride = v; }
});
Object.defineProperty(window, '_swipeTimeTarget', {
  get: function() { return _swipeTimeTarget; },
  set: function(v) { _swipeTimeTarget = v; }
});
var _swipeTawafPhase = 0;     // 0-1, decays to 0 — drives CCW sweep on revert
var _swipeCamAngle = 0;       // current orbit angle offset (radians)
var _swipeCamTarget = 0;      // target orbit angle
var _swipeCamVel = 0;         // angular velocity for spring physics

window._swipeRevert = _swipeRevert;
function _swipeRevert(instant) {
  _swipePreviewIdx = -1;
  _swipeTimeOverride = null;
  _swipeTimeTarget = null;
  window._swipeNightNum = 0;
  window._swipeHijriLock = false;
  // Restore header Hijri to live value
  if (typeof window._restoreHijriHeader === 'function') window._restoreHijriHeader();
  clearTimeout(_swipeRevertTimer);
  _swipeCamTarget = 0; // release camera — will orbit back in sync with tawaf
  if (!instant) _swipeTawafPhase = 1.0; // CCW sweep only on natural revert, not mode switch
  // Kill swipe label immediately
  if (_swipeLabelEl) {
    _swipeLabelEl.style.display = 'none';
    _swipeLabelEl.style.opacity = '0';
  }
  // Restore current prayer label + dots + qadr button
  _showCurrentPrayerLabel();
  var _qadrBtn = document.getElementById('qadrFloatBtn');
  if (_qadrBtn) _qadrBtn.style.opacity = '';
  // Remove pill fill + tint
  // Glow bar reverts to current prayer color via _displayPrayerTimes re-render
  // Reset prayer bar highlights immediately
  document.querySelectorAll('#fsPrayerTimes span[data-prayer]').forEach(function(sp) {
    sp.style.opacity = '';
    sp.style.color = '';
  });
  // Re-render prayer bar to restore default formatting
  if (window._prayerTimings && typeof window._displayPrayerTimes === 'function') {
    window._displayPrayerTimes(window._prayerTimings, window._lastHijri || null);
  }
  // Restart chrome auto-hide timer after swipe settles
  if (typeof window._resetChromeTimer === 'function') window._resetChromeTimer();
}

// Touch handlers — bound to document, filtered to clock mode only
var _swipeDragOriginX = 0;     // finger X at drag start (never resets during gesture)
var _swipeDragBaseIdx = -1;    // prayer index at drag start
var _swipeLastTriggeredIdx = -1; // last prayer we triggered (prevent re-fire)
var _swipeDragging = false;    // true = finger is down and dragging horizontally

document.addEventListener('touchstart', function(e) {
  if (_compassMode || document.body.classList.contains('mode-info')) return;
  if (_devActive) return;
  if (e.target.closest('button,a,input,select,textarea,.mode-pill,.loc-picker,.fs-dial-picker,.clock-onboard,#_swipeContentPill')) return;
  var touch = e.touches[0];
  _swipeStartX = touch.clientX;
  _swipeStartY = touch.clientY;
  _swipeDragging = false;
  _swipeSwiping = false;
  // Edge pulse removed from swipe — only fires on page load
}, { passive: true });

document.addEventListener('touchmove', function(e) {
  if (_compassMode || document.body.classList.contains('mode-info')) return;
  if (_devActive) return;
  if (_swipeStartX === 0 && _swipeStartY === 0) return;
  var touch = e.touches[0];
  var dx = touch.clientX - _swipeStartX;
  var dy = touch.clientY - _swipeStartY;

  // Detect horizontal drag intent
  if (!_swipeDragging && Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy) * 1.5) {
    _swipeDragging = true;
    _swipeSwiping = true;
    _swipeDragOriginX = touch.clientX;
    _swipeDragBaseIdx = _swipePreviewIdx >= 0 ? _swipePreviewIdx : _swipeGetCurrentIdx();
    _swipeLastTriggeredIdx = _swipeDragBaseIdx;
  }

  if (_swipeDragging) {
    var totalDx = touch.clientX - _swipeDragOriginX;
    var screenW = window.innerWidth || 430;

    // Map finger drag directly to camera orbit (±20° = ±0.3491 rad)
    var rawAngle = (totalDx / screenW) * 0.70; // full screen drag ≈ 40°
    _swipeCamTarget = 0; // camera orbit disabled — prayer swipe only
    // Rubber-band at edges: finger keeps pulling, orbit resists with spring feel
    if (Math.abs(rawAngle) > 0.3491) {
      var excess = rawAngle - _swipeCamTarget;
      _swipeCamTarget += excess * 0.20; // 20% of excess bleeds through
    }
    // Finger-follows with elastic spring toward target
    var _dragSpring = (_swipeCamTarget - _swipeCamAngle) * 0.35;
    _swipeCamVel = (_swipeCamVel + _dragSpring) * 0.55; // underdamped = slight wiggle on pull
    _swipeCamAngle += _swipeCamVel;

    // One drag = one prayer step (left = forward, right = backward)
    var prayerDir = totalDx < -30 ? 1 : totalDx > 30 ? -1 : 0;
    var _scnt = prayerSectors.length || 8;
    var targetIdx = ((_swipeDragBaseIdx + prayerDir) % _scnt + _scnt) % _scnt;
    if (targetIdx !== _swipeLastTriggeredIdx) {
      _swipeLastTriggeredIdx = targetIdx;
      _swipeShowPreview(targetIdx);
    }
  }
}, { passive: true });

document.addEventListener('touchend', function() {
  if (_swipeDragging) {
    // Release: spring back to 0 — no velocity kick, pure measured drift
    _swipeCamTarget = 0;
    _swipeCamVel = 0;
    // Guard chrome toggle from firing on swipe release
    window._chromeSwipeGuard = true;
    setTimeout(function() { window._chromeSwipeGuard = false; }, 300);
  }
  _swipeDragging = false;
  _swipeSwiping = false;
  _swipeStartX = 0;
  _swipeStartY = 0;
}, { passive: true });

// Arrow keys for desktop
document.addEventListener('keydown', function(e) {
  if (_compassMode || document.body.classList.contains('mode-info')) return;
  if (_devActive) return;
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.preventDefault();
    var baseIdx = _swipePreviewIdx >= 0 ? _swipePreviewIdx : _swipeGetCurrentIdx();
    if (e.key === 'ArrowLeft') return; // forward only — no backward
    _swipeShowPreview(baseIdx + 1);
  }
});

// Mouse drag for desktop prayer swipe
(function() {
  var _mouseStartX = 0, _mouseStartY = 0, _mouseDragging = false, _mouseSwiping = false;
  var _mouseDragOriginX = 0, _mouseDragBaseIdx = -1, _mouseLastIdx = -1;

  document.addEventListener('mousedown', function(e) {
    if (_compassMode || document.body.classList.contains('mode-info')) return;
    if (_devActive) return;
    if (e.button !== 0) return;
    if (e.target.closest('button,a,input,select,textarea,.mode-pill,.loc-picker,.fs-dial-picker,.clock-onboard,#_swipeContentPill')) return;
    _mouseStartX = e.clientX;
    _mouseStartY = e.clientY;
    _mouseDragging = false;
    _mouseSwiping = false;
  });

  document.addEventListener('mousemove', function(e) {
    if (_mouseStartX === 0 && _mouseStartY === 0) return;
    if (_compassMode || document.body.classList.contains('mode-info')) return;
    var dx = e.clientX - _mouseStartX;
    var dy = e.clientY - _mouseStartY;

    if (!_mouseDragging && Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      _mouseDragging = true;
      _mouseSwiping = true;
      _mouseDragOriginX = e.clientX;
      _mouseDragBaseIdx = _swipePreviewIdx >= 0 ? _swipePreviewIdx : _swipeGetCurrentIdx();
      _mouseLastIdx = _mouseDragBaseIdx;
    }

    if (_mouseDragging) {
      var totalDx = e.clientX - _mouseDragOriginX;
      var prayerDir = totalDx > 30 ? -1 : totalDx < -30 ? 1 : 0;
      var _scnt = prayerSectors.length || 8;
      var targetIdx = ((_mouseDragBaseIdx + prayerDir) % _scnt + _scnt) % _scnt;
      if (targetIdx !== _mouseLastIdx) {
        _mouseLastIdx = targetIdx;
        _swipeShowPreview(targetIdx);
      }
    }
  });

  document.addEventListener('mouseup', function() {
    if (_mouseDragging) {
      _swipeCamTarget = 0;
      _swipeCamVel = 0;
      // Guard chrome toggle from firing on mouse drag release
      window._chromeSwipeGuard = true;
      setTimeout(function() { window._chromeSwipeGuard = false; }, 300);
    }
    _mouseDragging = false;
    _mouseSwiping = false;
    _mouseStartX = 0;
    _mouseStartY = 0;
  });

// ── Look Preview Mode (?looks) ──────────────────────────────────────────────
// Swipe up/down to cycle through looks. Name displayed on screen.
// For Tawfeeq to preview on mobile and pick favorites for prayer mapping.
if (/[?&]looks/.test(location.search)) {
  window._lookPreviewActive = true;
  var _lookKeys = Object.keys(_plinthLooks);
  var _lookIdx = 0;
  var _lookTouchY = 0;

  // Kill all overlays and chrome — clean preview surface
  setTimeout(function() {
    // Dismiss any overlays
    if (typeof _hideQiyamDua === 'function') _hideQiyamDua();
    if (typeof _hideMaghribHadith === 'function') _hideMaghribHadith();
    document.querySelectorAll('#splash, #qiyamDua, #maghribHadith').forEach(function(el) { el.style.display = 'none'; });
    // Hide all chrome except look label
    document.querySelectorAll('.global-header, #modePill, .sticky-cta, #qadrFloatBtn, .compass-onboard, .clock-onboard').forEach(function(el) { el.style.display = 'none'; });
  }, 3000);

  // Create label overlay
  var _lookLabel = document.createElement('div');
  _lookLabel.style.cssText = 'position:fixed;top:env(safe-area-inset-top,12px);left:50%;transform:translateX(-50%);z-index:10000;font-family:var(--font);font-size:1.1rem;font-weight:300;letter-spacing:.08em;color:rgba(232,228,220,.85);text-transform:uppercase;pointer-events:none;transition:opacity .3s ease;text-align:center;padding:10px 20px;background:rgba(13,13,18,.7);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-radius:100px;white-space:nowrap';
  document.body.appendChild(_lookLabel);

  var _lookCounter = document.createElement('div');
  _lookCounter.style.cssText = 'position:fixed;top:calc(env(safe-area-inset-top,12px) + 44px);left:50%;transform:translateX(-50%);z-index:10000;font-family:var(--font);font-size:.7rem;font-weight:300;letter-spacing:.1em;color:rgba(232,228,220,.4);pointer-events:none;text-align:center';
  document.body.appendChild(_lookCounter);

  // Swipe hint
  var _lookHint = document.createElement('div');
  _lookHint.style.cssText = 'position:fixed;bottom:calc(env(safe-area-inset-bottom,8px) + 30px);left:50%;transform:translateX(-50%);z-index:10000;font-family:var(--font);font-size:.7rem;font-weight:300;letter-spacing:.08em;color:rgba(232,228,220,.3);pointer-events:none;text-align:center';
  _lookHint.textContent = '↑ swipe up/down to change looks ↓';
  document.body.appendChild(_lookHint);

  function _applyLookPreview(idx) {
    var key = _lookKeys[idx];
    var look = _plinthLooks[key];
    if (!look) return;

    _plinthRect.color.setHex(look.rc);
    _plinthRect.intensity = look.ri;
    _plinthRect.position.set(look.rp[0], look.rp[1], look.rp[2]);
    _plinthRect.lookAt(look.rt[0], look.rt[1], look.rt[2]);

    _plinthSpot.color.setHex(look.sc);
    _plinthSpot.intensity = look.si;
    _plinthSpot.position.set(look.sp[0], look.sp[1], look.sp[2]);
    _plinthSpot.target.position.set(look.st[0], look.st[1], look.st[2]);
    _plinthSpot.target.updateMatrixWorld();

    back.color.setHex(look.bc);
    back.intensity = look.bi;
    _backLerpColor.setHex(look.bc);
    _backLerpIntensity = look.bi;

    cubeBack.color.setHex(look.cc);
    cubeBack.intensity = look.ci;
    _cubeBackLerpColor.setHex(look.cc);
    _cubeBackLerpIntensity = look.ci;

    cubeSun.intensity = look.ui;
    _cubeSunLerpIntensity = look.ui;

    _plinthRectColor.setHex(look.rc);
    _plinthRectIntensity = look.ri;
    _plinthSpotColor.setHex(look.sc);
    _plinthSpotIntensity = look.si;

    var prayerNames = [];
    for (var p in _prayerLookMap) {
      if (_prayerLookMap[p] === key) prayerNames.push(p);
    }
    _lookLabel.textContent = key;
    _lookCounter.textContent = (idx + 1) + ' / ' + _lookKeys.length + (prayerNames.length ? '  ·  ' + prayerNames.join(', ') : '');
  }

  // Apply first look after scene settles
  setTimeout(function() { _applyLookPreview(0); }, 4000);

  // Touch swipe — use touchmove to track, touchend to commit
  // Use two simple tap zones instead of swipe — more reliable on mobile
  // Top third of screen = previous look, bottom third = next look
  // Middle third = no action (avoids accidental triggers)
  var _lookTapEl = document.createElement('div');
  _lookTapEl.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column';
  _lookTapEl.innerHTML = '<div data-look="prev" style="flex:1;cursor:pointer"></div><div style="flex:1"></div><div data-look="next" style="flex:1;cursor:pointer"></div>';
  document.body.appendChild(_lookTapEl);

  _lookTapEl.addEventListener('click', function(e) {
    var dir = e.target.getAttribute('data-look');
    if (dir === 'next') {
      _lookIdx = (_lookIdx + 1) % _lookKeys.length;
      _applyLookPreview(_lookIdx);
    } else if (dir === 'prev') {
      _lookIdx = (_lookIdx - 1 + _lookKeys.length) % _lookKeys.length;
      _applyLookPreview(_lookIdx);
    }
    if (_lookHint && dir) { _lookHint.style.opacity = '0'; setTimeout(function() { if(_lookHint) { _lookHint.remove(); _lookHint = null; } }, 500); }
  });

  // Also keep swipe as backup
  var _lookTY = 0;
  document.addEventListener('touchstart', function(e) {
    _lookTY = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchend', function(e) {
    var dy = e.changedTouches[0].clientY - _lookTY;
    if (Math.abs(dy) < 60) return;
    if (dy < 0) {
      _lookIdx = (_lookIdx + 1) % _lookKeys.length;
    } else {
      _lookIdx = (_lookIdx - 1 + _lookKeys.length) % _lookKeys.length;
    }
    _applyLookPreview(_lookIdx);
  }, { passive: true });

  // Update hint text
  _lookHint.textContent = 'tap top / bottom to change looks';
}

})();
