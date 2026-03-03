// glass-cube-clock.js — Dichroic Glass Prism Clock
// Seven Heavens Studio — integrated into agiftoftime.app
// Three.js FBO dichroic shader, per-channel IOR, real-time H:M:S hands

import * as THREE from 'three';


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

function getSize() {
  if (CONTAINED) {
    return { w: CONTAINER.clientWidth || 400, h: CONTAINER.clientHeight || 400 };
  }
  return { w: _stableW, h: _stableH };
}

let { w: W, h: H } = getSize();
let dpr = calcDpr(W, H);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.toneMapping = THREE.AgXToneMapping;
renderer.toneMappingExposure = 0.95; // v57: 1.25→0.95 — darken outside arch, dramatic contrast with bright interior
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(dpr);
renderer.setSize(W, H, false);

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
    _stableH = window.innerHeight;
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
const back = new THREE.SpotLight(0x4040a0, 10);
back.position.set(3.0, 3.0, -5.5);
back.target.position.set(0, 0.5, 0);
back.angle = 0.70; back.penumbra = 0.85; back.decay = 1.1;
scene.add(back, back.target);

// ── LIGHTING RIG: Quibla of Light (Chris lookdev, Feb 28) ──
// One dominant sacred shaft. Darkness as co-designer. Floor is the canvas.
// Inspired by: Nasir al-Mulk, Tadao Ando, Lubezki, Deakins.

// Procedural Islamic arch gobo texture
function _makeArchTexture() {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const sz = 1024 * dpr; // v12: 512→1024 — double resolution, arch edges survive projection + bilinear filtering; scaled by DPR so blur looks consistent across devices
  const c = document.createElement('canvas');
  c.width = sz; c.height = sz;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, sz, sz);
  const cx = sz / 2;
  const archW = sz * 0.202;  // v16: 0.238→0.202 — 15% narrower lancet slit
  const baseY = sz * 0.62;   // v9: legs clipped at 62% — bottom 38% of canvas is dark so arch feet never appear in frame
  const springY = sz * 0.42;
  const peakY = sz * 0.04;
  // v12: sharper lancet/ogee — walls stay vertical longer, tip converges tighter.
  // CP1 at wall-x with springY*0.55 (was 0.5) keeps sides straighter before the curve.
  // CP2 at archW*0.06 (was 0.12) pulls tip control points closer to center → sharper point.
  ctx.beginPath();
  ctx.moveTo(cx - archW, baseY);
  ctx.lineTo(cx - archW, springY);
  ctx.bezierCurveTo(cx - archW, springY * 0.55, cx - archW * 0.06, peakY + sz * 0.06, cx, peakY);
  ctx.bezierCurveTo(cx + archW * 0.06, peakY + sz * 0.06, cx + archW, springY * 0.55, cx + archW, springY);
  ctx.lineTo(cx + archW, baseY);
  ctx.closePath();
  // v67: extreme blur — no visible edges, pure diffused glow
  ctx.filter = `blur(${40 * dpr}px)`;
  ctx.fillStyle = '#e8e0d8';
  ctx.fill();
  ctx.filter = 'none';
  // second pass: re-blur the entire canvas for ultra-soft falloff
  const imgData = ctx.getImageData(0, 0, sz, sz);
  ctx.putImageData(imgData, 0, 0);
  ctx.filter = `blur(${24 * dpr}px)`;
  ctx.drawImage(c, 0, 0);
  ctx.filter = 'none';
  // v68: edge vignette — fade all 4 edges to black so PlaneGeometry boundary dissolves
  const edgeFade = 0.18; // fraction of canvas that fades out
  // left edge
  let g = ctx.createLinearGradient(0, 0, sz * edgeFade, 0);
  g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, sz * edgeFade, sz);
  // right edge
  g = ctx.createLinearGradient(sz, 0, sz * (1 - edgeFade), 0);
  g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(sz * (1 - edgeFade), 0, sz * edgeFade, sz);
  // top edge
  g = ctx.createLinearGradient(0, 0, 0, sz * edgeFade);
  g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, sz, sz * edgeFade);
  // bottom edge
  g = ctx.createLinearGradient(0, sz, 0, sz * (1 - edgeFade));
  g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, sz * (1 - edgeFade), sz, sz * edgeFade);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.center.set(0.5, 0.5);
  tex.rotation = 0; // v19: no texture rotation — plane mesh orientation handles diagonal
  return tex;
}

// v21: edge-only arch outline — stroke with no fill, reads as silhouette boundary
function _makeArchOutlineTexture() {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const sz = 1024 * dpr;
  const c = document.createElement('canvas');
  c.width = sz; c.height = sz;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, sz, sz);
  const cx = sz / 2;
  const archW = sz * 0.202;
  const baseY = sz * 0.62;
  const springY = sz * 0.42;
  const peakY = sz * 0.04;
  ctx.beginPath();
  ctx.moveTo(cx - archW, baseY);
  ctx.lineTo(cx - archW, springY);
  ctx.bezierCurveTo(cx - archW, springY * 0.55, cx - archW * 0.06, peakY + sz * 0.06, cx, peakY);
  ctx.bezierCurveTo(cx + archW * 0.06, peakY + sz * 0.06, cx + archW, springY * 0.55, cx + archW, springY);
  ctx.lineTo(cx + archW, baseY);
  ctx.closePath();
  // stroke only — no fill
  // v57: blur the outline — softens painted-edge read into diffused light boundary
  ctx.filter = `blur(${6 * dpr}px)`;
  ctx.lineWidth = 14 * dpr;  // v57: 6→14px — wider stroke + blur = soft atmospheric edge, not crisp paint; scaled by DPR
  ctx.strokeStyle = '#ffffff';
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.filter = 'none';
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.center.set(0.5, 0.5);
  tex.rotation = 0;
  return tex;
}

// SACRED SHAFT — v19: gobo as fill only, stamps carry the arch shape
const gobo = new THREE.SpotLight(0xffc870, 6); // v57: 0→6 — hybrid: low gobo for real light interaction, stamps carry shape
gobo.position.set(-6, 16, 3);
gobo.target.position.set(0, 0, -2);       // v19: aim at stamp center
gobo.angle = 0.50;    // v19: wide cone — just ambient directional warmth
gobo.penumbra = 0.85;  // v65: 0.6→0.85 — very soft edge, atmospheric fill
gobo.decay = 1.0;
gobo.castShadow = true;
gobo.shadow.mapSize.set(_isMobile ? 1024 : 2048, _isMobile ? 1024 : 2048);
gobo.shadow.bias = -0.001;
gobo.shadow.camera.near = 1;
gobo.shadow.camera.far = 25;
gobo.map = _makeArchTexture();
// v80: arch disabled — gobo off
// scene.add(gobo, gobo.target);

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
const coldCounter = new THREE.SpotLight(0x0a1855, 6);
coldCounter.position.set(5, 7, 1);
coldCounter.target.position.set(0, 0.6, 0);
coldCounter.angle = 0.30;
coldCounter.penumbra = 0.5;
coldCounter.decay = 1.4;
coldCounter.castShadow = false;
scene.add(coldCounter, coldCounter.target);

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
const ghostFill = new THREE.PointLight(0x0c0520, 0.5); // v57: 1.2→0.5 — less floor fill, darker surround
ghostFill.position.set(0, 3, 0);
ghostFill.decay = 2;
ghostFill.distance = 15;
scene.add(ghostFill);

// PRAYER AMBIENT — hemisphere for colored shadow fill
const prayerAmbient = new THREE.HemisphereLight(0x1a0830, 0x0a1520, 0.18); // v57: 0.4→0.18 — crush ambient so arch interior reads bright by contrast
scene.add(prayerAmbient);

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
const cubeSun = new THREE.PointLight(0xe8f2ff, 55, 14);
cubeSun.position.set(0, 0.2, -2.8);
scene.add(cubeSun);

scene.add(new THREE.AmbientLight(0xffffff, 0.07)); // v57: 0.16→0.07 — deeper darkness outside arch, shadow is absolute

// 12 o'clock spotlight — catches top edge during tawaf rotation
const tawafSpot = new THREE.SpotLight(0xffffff, 8); // v10: 12→8 — orbiting overhead was spiking cube top face during passes
tawafSpot.position.set(0, 3.5, -3);
tawafSpot.target.position.set(0, 0.5, 0);
tawafSpot.angle = 0.4; tawafSpot.penumbra = 0.9;
tawafSpot.distance = 4.5; // cap: reaches cube (~4.2u) but not arch floor zone (~5.7u from this position)
scene.add(tawafSpot, tawafSpot.target);

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
//
// v20: stamps are PRIMARY arch shape. Gobo is fill only.
// PlaneGeometry +Y = arch tip direction. rotation.x = -PI/2 lays flat on floor.
// rotation.z = -PI*0.2 — less steep diagonal, tip in frame, base off-screen left (+X, -Z on screen).
// Using map (not alphaMap) with transparent:true preserves edge stroke detail.
const _archStampTex = _makeArchTexture();

// BLOOM UNDERLAYER — wider, dimmer, atmospheric warmth corona
const archBloomMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(15.4, 34),  // v56: 14→15.4 (10% wider per client)
  new THREE.MeshBasicMaterial({
    map: _archStampTex,
    color: new THREE.Color(0xff7020),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    opacity: 0.12,  // v65: 0.08→0.12 — wider atmospheric bloom carries more of the shape
  })
);
archBloomMesh.rotation.set(-Math.PI / 2, 0, -Math.PI * 0.2); // v23: less steep diagonal — base exits left, tip stays in frame
archBloomMesh.position.set(-3.5, 0.019, 0); // v56: -3→-3.5, pull arch tip into frame
archBloomMesh.renderOrder = 1;
// scene.add(archBloomMesh); // v80: arch disabled

// BASE STAMP — primary arch silhouette, the hero shape
const archFloorMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(12.1, 28),  // v56: 11→12.1 (10% wider per client)
  new THREE.MeshBasicMaterial({
    map: _archStampTex,
    color: new THREE.Color(0xffaa40),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    opacity: 0.20,  // v65: 0.30→0.20 — softer fill, bloom carries more weight
  })
);
archFloorMesh.rotation.set(-Math.PI / 2, 0, -Math.PI * 0.2); // v23: less steep diagonal — base exits left, tip stays in frame
archFloorMesh.position.set(-3.5, 0.022, 0); // v56: -3→-3.5, pull arch tip into frame
archFloorMesh.renderOrder = 2;
// scene.add(archFloorMesh); // v80: arch disabled

// v65: outline stamp REMOVED — blur on fill texture carries the shape, no hard edges

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
// Position: midpoint between gobo (-6,16,3) and floor target (~-1.5,0,-0.5)
shaftMesh.position.set(-3.8, 8, 1.2);
// Rotate to align with beam angle — tilt back and diagonal
shaftMesh.rotation.set(-0.15, -Math.PI * 0.2, 0.08);
shaftMesh.renderOrder = 0;
// scene.add(shaftMesh); // v80: arch disabled

// ─── PRISM GROUP ──────────────────────────────────────────────────────────────
const prismGroup = new THREE.Group();
scene.add(prismGroup);
const CUBE_Y = 0.60;

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
    vViewDir = normalize(-mvPos.xyz);
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

  varying vec3 vViewNormal;
  varying vec3 vViewDir;
  varying vec3 vLocalPos;
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;

  vec3 thinFilm(float cosT, float t) {
    float p = 6.28318 * 5.0 * cosT + t * 0.25;
    return vec3(0.5+0.5*cos(p), 0.5+0.5*cos(p-2.094), 0.5+0.5*cos(p+2.094));
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    vec3 n  = normalize(vViewNormal);
    vec3 e  = normalize(vViewDir);

    float diagF = exp(-abs(vLocalPos.x + vLocalPos.y) * 7.0) * uDich;
    vec3  dn    = normalize(mix(n, normalize(vec3(1.0, 1.0, 0.0)), diagF));

    vec3 rR = refract(-e, dn, 1.0/uIorR);
    vec3 rG = refract(-e, dn, 1.0/uIorG);
    vec3 rB = refract(-e, dn, 1.0/uIorB);
    if(length(rR)<0.001) rR = -e;
    if(length(rG)<0.001) rG = -e;
    if(length(rB)<0.001) rB = -e;

    vec2 abXY = vec2(uAb / uAspect, uAb);
    float R = texture2D(uScene, clamp(uv + rR.xy * abXY, 0.001, 0.999)).r;
    float G = texture2D(uScene, clamp(uv + rG.xy * abXY, 0.001, 0.999)).g;
    float B = texture2D(uScene, clamp(uv + rB.xy * abXY, 0.001, 0.999)).b;
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
    float bottomAtten = 1.0 - 0.25 * smoothstep(-0.3, -0.95, Nw.y);
    vec3 col = refracted * vec3(0.94, 0.97, 1.06) * 1.7 * bottomAtten;

    // ── Dichroic iridescence: surface-only, tight diagonal band ──
    col = mix(col, col * irid * 1.4, diagF * 0.22);
    col += irid * diagF * fresnel * 0.12;

    // ── Fresnel edge: cool blue-white, sharp (glass = cold at edges) ──
    col += vec3(0.80, 0.92, 1.00) * fresnel * 0.35;

    // ── Side-face ambient: subtle fill so faces read as glass even without strong light ──
    float sideFacing = 1.0 - abs(Nw.y); // peaks on vertical faces
    col += vec3(0.20, 0.25, 0.40) * sideFacing * 0.12;

    // ── Sky/environment reflection: top face catches overhead light ──
    // Nw.y → 1 means surface faces up → reflects sky. Should be brightest face.
    float skyFacing = max(Nw.y, 0.0);
    col += pow(skyFacing, 1.8) * vec3(0.90, 0.94, 1.00) * 0.45;

    // ── Edge catch: crisp rim light at silhouette — "you could cut yourself" ──
    float NdotV = max(dot(Nw, Vw), 0.0);
    float edgeCatch = pow(1.0 - NdotV, 4.5);
    col += vec3(0.70, 0.85, 1.00) * edgeCatch * 1.80;

    // ── Specular: razor-sharp needle, only at grazing (no 0.4 ambient) ──
    vec3 Lw = normalize(uSpecLightPos - vWorldPos);
    vec3 Hw = normalize(Lw + Vw);
    float fresnelW = pow(1.0 - NdotV, 4.0);
    float spec = pow(max(dot(Nw, Hw), 0.0), 256.0);
    col += vec3(1.00, 0.97, 0.95) * uSpecIntensity * spec * fresnelW;

    // ── Internal glow (prayer-time animation only, off by default) ──
    float glowFresnel = pow(1.0 - cosT, 2.5);
    vec3 glowCol = mix(vec3(0.85, 0.92, 1.00), vec3(0.70, 0.85, 1.00), glowFresnel);
    col += glowCol * uInternalGlow * (0.2 + 0.8 * glowFresnel);

    // ── Top-face scrim: only extreme grazing (essentially removed) ──
    col *= 1.0 - 0.06 * smoothstep(0.88, 0.99, Nw.y);

    // ── Bottom-face glow: cool emission separates cube from dark podium ──
    float bottomFace = smoothstep(-0.5, -0.92, Nw.y);
    col += vec3(0.35, 0.45, 0.7) * bottomFace * 0.25;
    // ── Bottom-edge rim: catch light at cube base perimeter ──
    float bottomRim = smoothstep(-0.7, -0.98, Nw.y) * (1.0 - smoothstep(-0.98, -1.0, Nw.y));
    col += vec3(0.6, 0.7, 1.0) * bottomRim * 0.45;

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
    uAb:      { value: 0.05 },
    uDich:    { value: 0.70 },
    uFresnel: { value: 6.0 },
    uTime:    { value: 0 },
    uAspect:  { value: W / H },
    uSpecLightPos: { value: new THREE.Vector3(2.5, 4.0, 2.5) },
    uCamWorldPos:  { value: new THREE.Vector3() },
    uSpecIntensity: { value: 2.8 },
    uInternalGlow:  { value: 0.0 }, // crystal-fix: 0.24→0.0 — warm amber emission = jello/subsurface. Crystal is cold.
  },
  vertexShader: dichroicVert,
  fragmentShader: dichroicFrag,
  side: THREE.FrontSide,
});

const cubeGroup = new THREE.Group();
const cubeMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), cubeMat);
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
const podiumBase = { roughness: 0.4, metalness: 0.05, clearcoat: 0.4, clearcoatRoughness: 0.15, color: 0x14141f, fog: false };
const podiumMats = [
  new THREE.MeshPhysicalMaterial({ ...podiumBase, emissive: 0x606098, emissiveIntensity: 3.5 }), // +x right — KEY face
  new THREE.MeshPhysicalMaterial({ ...podiumBase, emissive: 0x141424, emissiveIntensity: 0.7 }), // -x left — edge hint
  new THREE.MeshPhysicalMaterial({ ...podiumBase, emissive: 0x0c0c18, emissiveIntensity: 0.5 }), // +y top — dichroic spill
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
scene.add(podiumMesh); // axis-aligned (0°) — sides visible while cube rotates 45°

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
    float sx=exp(-pow((vUv.x-0.5)*4.8,2.0));
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
  grp.add(new THREE.Mesh(g, mkMat(c1, c2, op)));
  grp.position.y = 0.008;
  grp.rotation.order = 'YXZ';
  grp.rotation.y = THREE.MathUtils.degToRad(az);
  grp.rotation.x = Math.PI / 2;
  prismGroup.add(grp);
  clockRays.push({ mesh: grp, initY: THREE.MathUtils.degToRad(az) });
}

// clockRays[0] = hour, clockRays[1] = minute, clockRays[2] = second
// initY = 135° (3π/4): compensates for prismGroup.rotation.y = π/4 so that
// at midnight/noon all hands point at visual 12 o'clock (-Z world direction).
floorRay(135, 0x9900ff, 0xff00ff, 0.30, 4.80, 1.45);   // HOUR   (violet)  φ base
floorRay(135, 0x1133ff, 0x00aaff, 0.30, 7.77, 1.50);   // MINUTE (blue)    4.80 × φ
floorRay(135, 0xffffff, 0xcccccc, 0.30, 12.56, 1.20);  // SECOND (white)   4.80 × φ²

// ─── FLOOR CAUSTICS ───────────────────────────────────────────────────────────
// v5: warm caustics (red/orange/yellow) pulled directly under cube base, short distance.
// Previously at z=0.9–1.5 they flooded the gobo arch projection zone — red fill
// in the dark frame destroyed the arch silhouette. Now contained to cube footprint only.
[
  {c:0x6600ff,i:1.8,d:2.5,x:-1.6,y:0.06,z:-0.4},
  {c:0x0033ff,i:1.4,d:2.2,x:-1.1,y:0.06,z:-0.7},
  {c:0x00aaff,i:2.8,d:2.0,x: 0.6,y:0.06,z:-1.0},
  {c:0xffffff,i:1.5,d:1.4,x: 0.2,y:0.06,z: 0.1},
  {c:0xffee00,i:2.2,d:1.2,x: 0.3,y:0.06,z:-0.2},
  {c:0xff8800,i:2.0,d:1.2,x:-0.2,y:0.06,z: 0.0},
  {c:0xff2200,i:1.8,d:1.0,x:-0.4,y:0.06,z:-0.3},
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

  // Dev mode: auto-enable compass in aligned state for lookdev
  if (_compassDevMode) {
    setTimeout(function() {
      _compassMode = true;
      _compassAligned = true;
      _compassLocked = true; // prevent _syncCompassFromAdhan from overwriting
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
    if(window._qiblaCausticLight){ window._qiblaCausticLight.intensity = 0.5; }
    // Hide prayer window discs
    _prayerDisc.visible = false; _nextDisc.visible = false; _thirdDisc.visible = false;
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
  { name: 'Tahajjud', startKey: 'Midnight', endKey: 'Fajr',    color: 0x8811ff, color2: 0xdd77ff, isFajr: false },
  { name: 'Fajr',    startKey: 'Fajr',     endKey: 'Sunrise',  color: 0x6633ee, color2: 0xbb88ff, isFajr: true  },
  { name: 'Dhuha',   startKey: 'Sunrise',  endKey: 'Dhuhr',    color: 0xff9900, color2: 0xffee44, isFajr: false },
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


let prayerSectors = [];
let _activePrayer = null; // { startAng, endAng, color, color2, intensity }
let ptSectorsRebuilt = false;

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

function buildPrayerSectors() {
  prayerSectors = [];
  const T = window._prayerTimings || PT_FALLBACK;
  PRAYER_WINDOWS_DEF.forEach(function(def) {
    const startMin = ptParseMin(T[def.startKey]);
    const endMin   = ptParseMin(T[def.endKey]);
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
      ? (nowMin >= startMin) || (nowMin < endMin)
      : (nowMin >= startMin) && (nowMin < endMin);
    if (isActive) { activeIdx = i; return; }
    const dist = (startMin - nowMin + 1440) % 1440;
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
  const _lerpRate = (_devSnapIntensity || window._forceTimeMin != null) ? 1.0 : 0.03;
  if (_devSnapIntensity) _devSnapIntensity = false;
  const u = _prayerDiscMat.uniforms;
  const activeTarget = activeIdx >= 0 ? _opA : 0.0;
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
  } else {
    _activePrayer = null;
  }
  if (u.uIntensity.value < 0.001 || _compassMode) _prayerDisc.visible = false;

  // ── Next upcoming prayer disc (dim — anticipation) ──
  const nu = _nextDiscMat.uniforms;
  const _maxWindows = window._devWindowCount != null ? window._devWindowCount : 1;
  const nextTarget = (nextIdx >= 0 && _maxWindows >= 2) ? (_devActive ? _opA : Math.max(_opA - _opS, 0.0)) : 0.0;
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
  const thirdTarget = (thirdIdx >= 0 && _maxWindows >= 3) ? (_devActive ? _opA : Math.max(_opA - _opS * 2, 0.0)) : 0.0;
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

(function loop() {
  requestAnimationFrame(loop);
  const t = clock.getElapsedTime();
  cubeMat.uniforms.uTime.value = t;
  fogLayerMat.uniforms.uTime.value = t;
  warmFogMat.uniforms.uTime.value = t;
  godRayMat.uniforms.uTime.value = t;
  _shaftMat.uniforms.time.value = t;

  // Sync hands to clock time (real, dev override, or swipe preview)
  var now;
  if (typeof _getDevNow === 'function' && _devActive) {
    now = _getDevNow();
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
    now = new Date();
    var _swH = Math.floor(_swipeTimeOverride / 60);
    var _swM = Math.floor(_swipeTimeOverride % 60);
    now.setHours(_swH, _swM, 0, 0); // freeze seconds at 0 during preview
  } else {
    now = new Date();
  }
  const h = (now.getHours() % 12) + now.getMinutes() / 60 + now.getSeconds() / 3600;
  const m = now.getMinutes() + now.getSeconds() / 60 + now.getMilliseconds() / 60000;
  const s = now.getSeconds() + now.getMilliseconds() / 1000;

  // ── Tahajjud — last third of the night ──
  var _tahajjudNow = Date.now();
  if (_tahajjudNow - _tahajjudLastCheck > 10000) {
    _tahajjudLastCheck = _tahajjudNow;
    _tahajjudActive = _tahajjudForced || _isLastThird(now);
  }
  var _tahajjudTarget = _tahajjudActive ? 1.0 : 0.0;
  _tahajjudBlend += (_tahajjudTarget - _tahajjudBlend) * 0.008; // ~8 second lerp
  if (Math.abs(_tahajjudBlend - _tahajjudTarget) < 0.001) _tahajjudBlend = _tahajjudTarget;

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
      var needleTarget = calibrated ? 0.95 : 0.25;
      var needleCur = clockRays[2].mesh.children[0].material.uniforms.op.value;
      clockRays[2].mesh.children[0].material.uniforms.op.value = needleCur + (needleTarget - needleCur) * 0.08;

      // Check alignment: 12 o'clock pointing at Qibla = qiblaRel near 0
      var alignDelta = Math.abs(((qiblaRel % TAU) + TAU) % TAU);
      if (alignDelta > Math.PI) alignDelta = TAU - alignDelta;
      _compassAligned = calibrated && alignDelta < 0.15; // ~8.5° tolerance, only when calibrated

      // Prismatic refraction: polar disc shaders
      var breathe = 0.88 + 0.12 * Math.sin(t * 1.0);
      // Update time uniform for caustic shimmer
      if(_qiblaFanDisc) _qiblaFanDisc.material.uniforms.time.value = t;
      if(_qiblaBloomDisc) _qiblaBloomDisc.material.uniforms.time.value = t;

      if (_compassAligned) {
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

    // Tawaf flourish — CCW sweep on swipe revert
    if (_swipeTawafPhase > 0.001) {
      // Ease-out curve for smooth deceleration
      var tawafOffset = _swipeTawafPhase * _swipeTawafPhase * TAU; // quadratic ease-out
      clockRays[0].mesh.rotation.y -= tawafOffset * 0.3;  // hour: subtle
      clockRays[1].mesh.rotation.y -= tawafOffset * 0.6;  // minute: medium
      clockRays[2].mesh.rotation.y -= tawafOffset;         // second: full sweep
      _swipeTawafPhase *= 0.955; // decay ~1.5 seconds at 60fps
      if (_swipeTawafPhase < 0.001) _swipeTawafPhase = 0;
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
  cubeMat.uniforms.uCamWorldPos.value.copy(camera.position);

  // Tawaf spot orbits at second-hand speed
  const tawafAngle = (s / 60) * TAU;
  tawafSpot.position.x = Math.sin(tawafAngle) * 3;
  tawafSpot.position.z = -Math.cos(tawafAngle) * 3;

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

  // FBO pass
  cubeMesh.visible = false;
  renderer.setRenderTarget(fboRT);
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);
  cubeMesh.visible = true;
  cubeMat.uniforms.uScene.value = fboRT.texture;

  renderer.render(scene, camera);

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
// Activate with ?dev in URL or press D key

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
  return new Date();
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
if (location.search.includes('dev')) {
  _devActive = true;
  setTimeout(_devBuildPanel, 100);
  setTimeout(_devUpdateBoundaries, 200);
}
document.addEventListener('keydown', function(e) {
  if (e.key === 'D' || e.key === 'd') _devToggle();
});

// ─────────────────────────────────────────────────────────────────────────────
// PRAYER SWIPE — swipe left/right to preview prayer times
// ─────────────────────────────────────────────────────────────────────────────
var _swipeStartX = 0, _swipeStartY = 0, _swipeSwiping = false;
var _swipePreviewIdx = -1;   // -1 = live mode, 0-6 = prayer index
var _swipeRevertTimer = null;
var _swipeLabelEl = null;
var _swipeFadeTimer = null;

function _swipeGetCurrentIdx() {
  // Find which prayer is currently active (live)
  var T = window._prayerTimings;
  if (!T) return 0;
  var now = new Date();
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

function _swipeShowPreview(idx) {
  if (!prayerSectors.length) return;
  idx = ((idx % 7) + 7) % 7; // wrap 0-6
  _swipePreviewIdx = idx;
  var ps = prayerSectors[idx];
  var def = ps.def;
  var T = window._prayerTimings;
  var timeStr = T ? (T[def.startKey] || '').split(' ')[0] : '';

  // Create/update the preview label above nav pill
  if (!_swipeLabelEl) {
    _swipeLabelEl = document.createElement('div');
    _swipeLabelEl.style.cssText = 'position:fixed;bottom:calc(env(safe-area-inset-bottom,8px) + clamp(20px,4vmin,32px) + 72px);left:50%;transform:translateX(-50%);z-index:951;text-align:center;pointer-events:none;transition:opacity .3s ease;font-family:var(--font)';
    document.body.appendChild(_swipeLabelEl);
  }
  var c = new THREE.Color(def.color);
  var hex = '#' + c.getHexString();
  _swipeLabelEl.innerHTML =
    '<div style="font-size:clamp(.6rem,1.2vw,.75rem);font-weight:400;letter-spacing:.15em;text-transform:uppercase;color:' + hex + ';opacity:.7;margin-bottom:2px">' + def.name + '</div>' +
    '<div style="font-size:clamp(1rem,2.5vw,1.3rem);font-weight:300;color:rgba(232,228,220,.85);letter-spacing:.04em;font-variant-numeric:tabular-nums">' + timeStr + '</div>';
  _swipeLabelEl.style.opacity = '1';

  // Fill the nav pill circle with prayer color
  var clockCircle = document.querySelector('.mode-pill-btn[data-mode="clock"] svg circle');
  if (clockCircle) {
    clockCircle.setAttribute('fill', hex);
    clockCircle.setAttribute('fill-opacity', '0.5');
    clockCircle.setAttribute('stroke', hex);
    clockCircle.style.filter = 'drop-shadow(0 0 10px ' + hex + ')';
  }

  // Highlight the matching prayer in the top bar — NO layout changes (sticky text)
  document.querySelectorAll('#fsPrayerTimes span[data-prayer]').forEach(function(sp) {
    if (sp.dataset.prayer === def.name || (def.name === 'Tahajjud' && sp.dataset.prayer === 'Qiyam')) {
      sp.style.color = hex;
      sp.style.opacity = '1';
    } else {
      sp.style.opacity = '0.3';
    }
  });

  // Animate clock time to this prayer's start
  if (_swipeTimeOverride === null) _swipeTimeOverride = ps.startMin; // first swipe: no lerp needed
  _swipeTimeTarget = ps.startMin;

  // Auto-revert after 8 seconds
  clearTimeout(_swipeRevertTimer);
  _swipeRevertTimer = setTimeout(_swipeRevert, 8000);
}

var _swipeTimeOverride = null; // minutes from midnight (current), or null for live
var _swipeTimeTarget  = null; // where we're lerping TO
var _swipeTawafPhase = 0;     // 0-1, decays to 0 — drives CCW sweep on revert

function _swipeRevert(instant) {
  _swipePreviewIdx = -1;
  _swipeTimeOverride = null;
  _swipeTimeTarget = null;
  clearTimeout(_swipeRevertTimer);
  if (!instant) _swipeTawafPhase = 1.0; // CCW sweep only on natural revert, not mode switch
  // Kill label immediately
  if (_swipeLabelEl) {
    _swipeLabelEl.style.transition = 'none';
    _swipeLabelEl.style.opacity = '0';
    // Re-enable transition after paint
    setTimeout(function() { if (_swipeLabelEl) _swipeLabelEl.style.transition = 'opacity .3s ease'; }, 50);
  }
  // Remove pill fill + tint
  var clockCircle = document.querySelector('.mode-pill-btn[data-mode="clock"] svg circle');
  if (clockCircle) {
    clockCircle.setAttribute('fill', 'none');
    clockCircle.removeAttribute('fill-opacity');
    clockCircle.setAttribute('stroke', 'currentColor');
    clockCircle.style.filter = '';
  }
  // Reset prayer bar highlights immediately
  document.querySelectorAll('#fsPrayerTimes span[data-prayer]').forEach(function(sp) {
    sp.style.opacity = '';
    sp.style.color = '';
  });
  // Re-render prayer bar to restore default formatting
  if (window._prayerTimings && typeof window._displayPrayerTimes === 'function') {
    window._displayPrayerTimes(window._prayerTimings, window._lastHijri || null);
  }
}

// Touch handlers — bound to document, filtered to clock mode only
document.addEventListener('touchstart', function(e) {
  if (_compassMode || document.body.classList.contains('mode-info')) return;
  if (_devActive) return;
  // Don't capture touches on interactive elements
  if (e.target.closest('button,a,input,select,textarea,.mode-pill,.loc-picker,.fs-dial-picker')) return;
  var touch = e.touches[0];
  _swipeStartX = touch.clientX;
  _swipeStartY = touch.clientY;
  _swipeSwiping = false;
}, { passive: true });

document.addEventListener('touchmove', function(e) {
  if (_compassMode || document.body.classList.contains('mode-info')) return;
  if (_devActive) return;
  if (_swipeStartX === 0 && _swipeStartY === 0) return;
  var touch = e.touches[0];
  var dx = touch.clientX - _swipeStartX;
  var dy = touch.clientY - _swipeStartY;
  // Only trigger on horizontal swipe (dx > dy) with minimum threshold
  if (!_swipeSwiping && Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
    _swipeSwiping = true;
    var baseIdx = _swipePreviewIdx >= 0 ? _swipePreviewIdx : _swipeGetCurrentIdx();
    var dir = dx > 0 ? 1 : -1; // swipe right = next prayer, swipe left = previous
    _swipeShowPreview(baseIdx + dir);
    _swipeStartX = touch.clientX; // reset for next swipe in same gesture
  }
}, { passive: true });

document.addEventListener('touchend', function() {
  _swipeSwiping = false;
  _swipeStartX = 0;
  _swipeStartY = 0;
}, { passive: true });

// Arrow keys for desktop testing
document.addEventListener('keydown', function(e) {
  if (_compassMode || document.body.classList.contains('mode-info')) return;
  if (_devActive) return;
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    var baseIdx = _swipePreviewIdx >= 0 ? _swipePreviewIdx : _swipeGetCurrentIdx();
    _swipeShowPreview(baseIdx + (e.key === 'ArrowRight' ? 1 : -1));
  }
});
