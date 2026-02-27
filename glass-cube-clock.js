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
var _stableH = window.innerHeight; // capture initial height before Safari chrome hides
function getSize() {
  if (_isFullscreen) {
    return { w: window.innerWidth, h: window.innerHeight };
  }
  if (CONTAINED) {
    return { w: CONTAINER.clientWidth || 400, h: CONTAINER.clientHeight || 400 };
  }
  // Lock renderer to initial height so 3D scene doesn't rescale when Safari chrome hides
  return { w: window.innerWidth, h: _stableH || window.innerHeight };
}

let { w: W, h: H } = getSize();
let dpr = calcDpr(W, H);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.toneMapping = THREE.AgXToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(dpr);
renderer.setSize(W, H, false);

if (CONTAINED) {
  CONTAINER.appendChild(renderer.domElement);
} else {
  const c = renderer.domElement;
  c.style.cssText = 'position:fixed;inset:0;z-index:0;width:100%;height:100%;';
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
scene.fog = new THREE.FogExp2(0x0d0d12, 0.048);

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
window.addEventListener('resize', onResize);

// ─── FLOOR ────────────────────────────────────────────────────────────────────
const ground = new THREE.Mesh(
  new THREE.CircleGeometry(40, 64),
  new THREE.MeshStandardMaterial({ color: 0x18182a, roughness: 0.88, metalness: 0, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

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

// GOBO KEY — upper-front-left, broad wash (not a tight spot).
// Shapes the floor with a gentle gradient pool, defines front/top cube faces.
// Wide angle + soft penumbra = falloff is gradual, not a hard disco-spot.
const gobo = new THREE.SpotLight(0xff00ff, 72);
gobo.position.set(-3.5, 6.5, 3.2);
gobo.target.position.set(0.3, 0, 0.5);
gobo.angle = 0.42;       // wider cone — broad wash over cube + floor
gobo.penumbra = 0.45;    // soft falloff, blends into ambient naturally
gobo.decay = 1.4;
gobo.castShadow = true;
gobo.shadow.mapSize.set(_isMobile ? 512 : 1024, _isMobile ? 512 : 1024);
gobo.shadow.bias = -0.001;
scene.add(gobo, gobo.target);

// COOL RIM — catches back edges of cube, separates silhouette from bg
const rim = new THREE.SpotLight(0x8060c0, 11);
rim.position.set(-1.5, 5.5, -3.5);
rim.target.position.set(0, 0.6, 0);
rim.angle = 0.45; rim.penumbra = 0.85;
scene.add(rim, rim.target);

// CUBE SUN — bright point directly behind the cube.
// The FBO shader samples the scene behind the glass — without a bright source
// there, the refracted RGB is dark and no rainbow is visible. This gives it
// bright content to bend, producing visible chromatic dispersion.
const cubeSun = new THREE.PointLight(0xe8f2ff, 105, 14);
cubeSun.position.set(0, 1.0, -2.0);
scene.add(cubeSun);

scene.add(new THREE.AmbientLight(0xffffff, 0.58));

// 12 o'clock spotlight — catches top edge during tawaf rotation
const tawafSpot = new THREE.SpotLight(0xffffff, 12);
tawafSpot.position.set(0, 3.5, -3);
tawafSpot.target.position.set(0, 0.5, 0);
tawafSpot.angle = 0.4; tawafSpot.penumbra = 0.9;
scene.add(tawafSpot, tawafSpot.target);

// ─── GROUND FOG LAYER ─────────────────────────────────────────────────────────
const fogLayerMat = new THREE.ShaderMaterial({
  uniforms: {
    uTime:    { value: 0 },
    uOpacity: { value: 0.18 },
    uColor:   { value: new THREE.Color(0x4466cc) },
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

  varying vec3 vViewNormal;
  varying vec3 vViewDir;
  varying vec3 vLocalPos;
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;

  vec3 thinFilm(float cosT, float t) {
    float p = 6.28318 * 2.5 * cosT + t * 0.35;
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

    vec3 col = refracted;
    col = mix(col, col * irid * 1.6, diagF * 0.65);
    col += irid * diagF * fresnel * 0.75;
    col += fresnel * 0.55;

    // ── Animated specular edge highlight ──
    vec3 Nw = normalize(vWorldNormal);
    vec3 Vw = normalize(uCamWorldPos - vWorldPos);
    vec3 Lw = normalize(uSpecLightPos - vWorldPos);
    vec3 Hw = normalize(Lw + Vw);
    float fresnelW = pow(1.0 - max(dot(Nw, Vw), 0.0), 4.0);
    float spec = pow(max(dot(Nw, Hw), 0.0), 24.0);
    col += vec3(1.0, 0.95, 0.9) * uSpecIntensity * spec * (0.4 + 0.6 * fresnelW);

    gl_FragColor = vec4(col, 1.0);
  }
`;

const cubeMat = new THREE.ShaderMaterial({
  uniforms: {
    uScene:   { value: null },
    uRes:     { value: new THREE.Vector2(W * dpr, H * dpr) },
    uIorR:    { value: 1.14 },
    uIorG:    { value: 1.18 },
    uIorB:    { value: 1.23 },
    uAb:      { value: 0.10 },
    uDich:    { value: 0.70 },
    uFresnel: { value: 2.0 },
    uTime:    { value: 0 },
    uAspect:  { value: W / H },
    uSpecLightPos: { value: new THREE.Vector3(0, 3.5, -3) },
    uCamWorldPos:  { value: new THREE.Vector3() },
    uSpecIntensity: { value: 1.875 },
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
floorRay(135, 0x9900ff, 0xff00ff, 0.40, 3.48, 0.88);   // HOUR   (violet)
floorRay(135, 0x1133ff, 0x00aaff, 0.40, 5.64, 0.92);   // MINUTE (blue)
floorRay(135, 0xffffff, 0xcccccc, 0.40, 9.12, 0.62);   // SECOND (white)

// ─── FLOOR CAUSTICS ───────────────────────────────────────────────────────────
[
  {c:0x6600ff,i:5.5,d:3.2,x:-1.6,y:0.06,z:-0.4},
  {c:0x0033ff,i:5.0,d:2.8,x:-1.1,y:0.06,z:-0.7},
  {c:0x00aaff,i:3.5,d:2.4,x: 0.6,y:0.06,z:-1.0},
  {c:0xffffff,i:2.0,d:1.8,x: 0.8,y:0.06,z: 0.3},
  {c:0xffee00,i:4.5,d:2.2,x: 0.8,y:0.06,z: 0.9},
  {c:0xff8800,i:4.8,d:2.0,x: 0.4,y:0.06,z: 1.2},
  {c:0xff2200,i:5.2,d:2.4,x:-0.1,y:0.06,z: 1.5},
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
var _qiblaBeam = null;        // light beam toward 6 o'clock

// Create the Qibla beam (hidden by default) — bright white/gold, from cube center toward 6 o'clock
(function() {
  const len = 9.12;
  const g = new THREE.PlaneGeometry(0.8, len, 1, 16); g.translate(0, len/2, 0);
  const grp = new THREE.Group();
  grp.add(new THREE.Mesh(g, mkMat(0xffd700, 0xffffff, 0.0)));
  grp.position.y = 0.03;
  grp.rotation.order = 'YXZ';
  // Point toward 6 o'clock (opposite of 12 o'clock / initY 135°)
  grp.rotation.y = THREE.MathUtils.degToRad(135 - 180);
  grp.rotation.x = Math.PI / 2;
  grp.visible = false;
  prismGroup.add(grp);
  _qiblaBeam = grp;
})();

window._clockToggleCompass = function(on) {
  _compassMode = !!on;
  if (_compassMode) {
    // Hide hour + minute hands
    clockRays[0].mesh.children[0].material.uniforms.op.value = 0;
    clockRays[1].mesh.children[0].material.uniforms.op.value = 0;
    _compassAligned = false;
    _qiblaBeam.visible = false;
    _qiblaBeam.children[0].material.uniforms.op.value = 0;
  } else {
    // Restore clock hands
    clockRays[0].mesh.children[0].material.uniforms.op.value = 0.88;
    clockRays[1].mesh.children[0].material.uniforms.op.value = 0.92;
    clockRays[2].mesh.children[0].material.uniforms.op.value = 0.62;
    _qiblaBeam.visible = false;
    _compassAligned = false;
  }
};

// Called from index.html compass handler to feed heading + qibla
window._clockUpdateCompass = function(heading, qibla) {
  _compassHeading = heading;
  _compassQibla = qibla;
};

// ─── PRAYER WINDOW SECTORS ────────────────────────────────────────────────
// Seven glowing fan/pie-slice sectors on the floor, one per Islamic prayer window.
// Subtle atmospheric floor glow — cube remains the visual hero.
// Active: 0.18 max opacity, upcoming: 0.08, Fajr dim: 0.05.

const PRAYER_WINDOWS_DEF = [
  { name: 'Tahajjud', startKey: 'Midnight', endKey: 'Fajr',    color: 0x7700ee, color2: 0xcc66ff, isFajr: false },
  { name: 'Fajr',    startKey: 'Fajr',     endKey: 'Sunrise',  color: 0x3311cc, color2: 0x8866ee, isFajr: true  },
  { name: 'Dhuha',   startKey: 'Sunrise',  endKey: 'Dhuhr',    color: 0xff9900, color2: 0xffee44, isFajr: false },
  { name: 'Dhuhr',   startKey: 'Dhuhr',    endKey: 'Asr',      color: 0x00bb44, color2: 0x66ff99, isFajr: false },
  { name: 'Asr',     startKey: 'Asr',      endKey: 'Maghrib',  color: 0xff8800, color2: 0xffcc44, isFajr: false },
  { name: 'Maghrib', startKey: 'Maghrib',  endKey: 'Isha',     color: 0xff2200, color2: 0xff8866, isFajr: false },
  { name: 'Isha',    startKey: 'Isha',     endKey: 'Midnight', color: 0x0055ff, color2: 0x44aaff, isFajr: false },
];

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
const OP_ACTIVE = 1.3;


let prayerSectors = [];
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
  transparent: true, depthWrite: false, side: THREE.DoubleSide,
  uniforms: {
    uStartAngle: { value: 0.0 },
    uEndAngle:   { value: 0.0 },
    uColor1:     { value: new THREE.Color(0xff0000) },
    uColor2:     { value: new THREE.Color(0xffffff) },
    uIntensity:  { value: 0.0 },
    uOuterRadius:{ value: SECTOR_RADIUS },
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
    uniform float uIntensity, uOuterRadius;
    varying vec2  vPos;
    void main() {
      float r = length(vPos);
      float radial = exp(-r / uOuterRadius * 2.8);

      float angle = atan(vPos.x, -vPos.y);

      // Handle wrapping windows (e.g. Tahajjud crossing 12 o'clock)
      float span = uStartAngle - uEndAngle;
      if (span < 0.0) span += TAU;
      float mid = uStartAngle - span * 0.5;
      float hSpan = span * 0.5;

      // Signed angular distance with wrapping
      float d = angle - mid;
      d = d - TAU * floor((d + PI) / TAU);
      float normDist = abs(d) / max(hSpan, 0.001);
      // Flat-top — stays bright to 90% of window, sharper rolloff at edges
      float angular = exp(-pow(max(normDist - 0.97, 0.0) * 12.0, 2.0));

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
};
const _thirdDisc = new THREE.Mesh(_prayerDiscGeo, _thirdDiscMat);
_thirdDisc.rotation.x = -Math.PI / 2;
_thirdDisc.position.y = 0.012;
_thirdDisc.visible = false;
prismGroup.add(_thirdDisc);



const OP_STEP = 0.4; // intensity drop per consecutive prayer

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
  const _lerpRate = _devSnapIntensity ? 1.0 : 0.03;
  if (_devSnapIntensity) _devSnapIntensity = false;
  const u = _prayerDiscMat.uniforms;
  const activeTarget = activeIdx >= 0 ? _opA : 0.0;
  u.uIntensity.value = THREE.MathUtils.lerp(u.uIntensity.value, activeTarget, _lerpRate);

  if (activeIdx >= 0) {
    const ps = allSectors[activeIdx];
    u.uStartAngle.value = ps.startAng;
    u.uEndAngle.value = ps.endAng;
    u.uColor1.value.set(ps.def.color);
    u.uColor2.value.set(ps.def.color2);
    _prayerDisc.visible = true;
  }
  if (u.uIntensity.value < 0.001) _prayerDisc.visible = false;

  // ── Next upcoming prayer disc (dim — anticipation) ──
  const nu = _nextDiscMat.uniforms;
  const nextTarget = nextIdx >= 0 ? (_devActive ? _opA : Math.max(_opA - _opS, 0.0)) : 0.0;
  nu.uIntensity.value = THREE.MathUtils.lerp(nu.uIntensity.value, nextTarget, _lerpRate);

  if (nextIdx >= 0) {
    const ps = allSectors[nextIdx];
    nu.uStartAngle.value = ps.startAng;
    nu.uEndAngle.value = ps.endAng;
    nu.uColor1.value.set(ps.def.color);
    nu.uColor2.value.set(ps.def.color2);
    _nextDisc.visible = true;
  }
  if (nu.uIntensity.value < 0.001) _nextDisc.visible = false;

  // ── Third prayer disc (prayer after next) ──
  const tu = _thirdDiscMat.uniforms;
  const thirdTarget = thirdIdx >= 0 ? (_devActive ? _opA : Math.max(_opA - _opS * 2, 0.0)) : 0.0;
  tu.uIntensity.value = THREE.MathUtils.lerp(tu.uIntensity.value, thirdTarget, _lerpRate);

  if (thirdIdx >= 0) {
    const ps = allSectors[thirdIdx];
    tu.uStartAngle.value = ps.startAng;
    tu.uEndAngle.value = ps.endAng;
    tu.uColor1.value.set(ps.def.color);
    tu.uColor2.value.set(ps.def.color2);
    _thirdDisc.visible = true;
  }
  if (tu.uIntensity.value < 0.001) _thirdDisc.visible = false;
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

  // Sync hands to real clock time
  const now = new Date();
  const h = (now.getHours() % 12) + now.getMinutes() / 60 + now.getSeconds() / 3600;
  const m = now.getMinutes() + now.getSeconds() / 60 + now.getMilliseconds() / 60000;
  const s = now.getSeconds() + now.getMilliseconds() / 1000;

  if (_compassMode && _compassQibla !== null) {
    // Compass mode: second hand = needle pointing toward Qibla
    // qiblaRelative = angle from phone's north to Qibla (how far CW from 12 o'clock)
    var qiblaRel = _compassQibla - _compassHeading;
    // Map to clock: initY offset compensates for prismGroup rotation
    clockRays[2].mesh.rotation.y = clockRays[2].initY - qiblaRel;
    clockRays[2].mesh.children[0].material.uniforms.op.value = 0.95;

    // Check alignment: 12 o'clock pointing at Qibla = qiblaRel near 0
    var alignDelta = Math.abs(((qiblaRel % TAU) + TAU) % TAU);
    if (alignDelta > Math.PI) alignDelta = TAU - alignDelta;
    var wasAligned = _compassAligned;
    _compassAligned = alignDelta < 0.15; // ~8.5° tolerance

    // Qibla beam: show when aligned, pointing toward 6 o'clock (opposite of Qibla)
    if (_compassAligned) {
      _qiblaBeam.visible = true;
      var beamOp = _qiblaBeam.children[0].material.uniforms.op.value;
      _qiblaBeam.children[0].material.uniforms.op.value = Math.min(beamOp + 0.08, 1.0);
    } else {
      var beamOp2 = _qiblaBeam.children[0].material.uniforms.op.value;
      if (beamOp2 > 0.01) {
        _qiblaBeam.children[0].material.uniforms.op.value = beamOp2 * 0.92;
      } else {
        _qiblaBeam.visible = false;
      }
    }
  } else {
    // Normal clock mode
    clockRays[0].mesh.rotation.y = clockRays[0].initY - (h / 12) * TAU;   // hour
    clockRays[1].mesh.rotation.y = clockRays[1].initY - (m / 60) * TAU;   // minute
    clockRays[2].mesh.rotation.y = clockRays[2].initY - (s / 60) * TAU;   // second
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
  const prayerNow = (typeof _getDevNow === 'function' && _devActive) ? _getDevNow() : now;
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
var _devActive = false;
var _devTimeOverride = null; // null = real time, else { h, m }
var _devCustomWindows = []; // [{name, startH, startM, endH, endM, color}]
var _devShowBoundaries = true;
var _devBoundaryBeams = [];

function _devBuildPanel() {
  if (document.getElementById('_devPanel')) return;
  const panel = document.createElement('div');
  panel.id = '_devPanel';
  panel.style.cssText = 'position:fixed;top:8px;left:8px;z-index:99999;background:rgba(0,0,0,0.88);color:#ccc;font:10px/1.4 monospace;padding:10px;border-radius:8px;max-height:90vh;overflow-y:auto;width:220px;backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.1)';

  // Time override
  const timeNow = new Date();
  panel.innerHTML = `
    <div style="color:#fff;font-size:13px;margin-bottom:8px;font-weight:600;display:flex;justify-content:space-between;align-items:center">
      <span>🕐 Dev Panel</span>
      <button id="_devMinimize" style="background:none;border:none;color:#888;font:bold 14px monospace;cursor:pointer;padding:0 4px">−</button>
    </div>
    <div id="_devBody">
    <div style="margin-bottom:8px">
      <label style="color:#888">Time Override</label><br>
      <input type="range" id="_devTimeSlider" min="0" max="1439" value="${timeNow.getHours()*60+timeNow.getMinutes()}" style="width:200px">
      <span id="_devTimeLabel" style="color:#fff;margin-left:6px">${_fmtMin(timeNow.getHours()*60+timeNow.getMinutes())}</span>
      <br><label><input type="checkbox" id="_devTimeLive" checked> Live time</label>
    </div>
    <div style="margin-bottom:8px">
      <label><input type="checkbox" id="_devBoundaries" checked> Show boundaries</label>
    </div>
    <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:8px;margin-top:4px">
      <div style="color:#fff;font-size:12px;margin-bottom:6px">Active Prayer Windows</div>
      <div id="_devWindowList"></div>
    </div>
    <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:8px;margin-top:8px">
      <div style="color:#fff;font-size:12px;margin-bottom:6px">Custom Debug Windows</div>
      <div id="_devCustomList"></div>
      <button id="_devAddWindow" style="margin-top:4px;font:11px monospace;background:#333;color:#ccc;border:1px solid #555;border-radius:4px;padding:3px 10px;cursor:pointer">+ Add window</button>
    </div>
    <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:8px;margin-top:8px">
      <div style="color:#fff;font-size:12px;margin-bottom:6px">Intensity</div>
      <label style="color:#888">Active: </label><input type="range" id="_devOpActive" min="0" max="30" value="${OP_ACTIVE*10}" style="width:120px"><span id="_devOpActiveV" style="color:#fff;margin-left:4px">${OP_ACTIVE}</span><br>
      <label style="color:#888">Step: </label><input type="range" id="_devOpStep" min="0" max="10" value="${OP_STEP*10}" style="width:120px"><span id="_devOpStepV" style="color:#fff;margin-left:4px">${OP_STEP}</span>
    </div>
    <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:8px;margin-top:8px">
      <div style="color:#fff;font-size:12px;margin-bottom:6px">Layout</div>
      <label style="color:#888">Spacer: </label><input type="range" id="_devSpacer" min="20" max="100" value="100" style="width:120px"><span id="_devSpacerV" style="color:#fff;margin-left:4px">100vh</span>
    </div>
    </div>
  `;
  document.body.appendChild(panel);

  // Minimize toggle
  document.getElementById('_devMinimize').addEventListener('click', function() {
    var body = document.getElementById('_devBody');
    if (body.style.display === 'none') {
      body.style.display = '';
      this.textContent = '−';
    } else {
      body.style.display = 'none';
      this.textContent = '+';
    }
  });

  // Slider events
  const slider = document.getElementById('_devTimeSlider');
  const label = document.getElementById('_devTimeLabel');
  const liveChk = document.getElementById('_devTimeLive');
  slider.addEventListener('input', function() {
    liveChk.checked = false;
    const min = parseInt(slider.value);
    label.textContent = _fmtMin(min);
    _devTimeOverride = { h: Math.floor(min/60), m: min%60 };
  });
  liveChk.addEventListener('change', function() {
    if (liveChk.checked) _devTimeOverride = null;
  });

  // Boundaries toggle
  document.getElementById('_devBoundaries').addEventListener('change', function(e) {
    _devShowBoundaries = e.target.checked;
    _devUpdateBoundaries();
  });

  // Intensity sliders
  document.getElementById('_devOpActive').addEventListener('input', function(e) {
    window._OP_ACTIVE_OVERRIDE = parseFloat(e.target.value) / 10;
    document.getElementById('_devOpActiveV').textContent = window._OP_ACTIVE_OVERRIDE.toFixed(1);
  });
  document.getElementById('_devOpStep').addEventListener('input', function(e) {
    window._OP_STEP_OVERRIDE = parseFloat(e.target.value) / 10;
    document.getElementById('_devOpStepV').textContent = window._OP_STEP_OVERRIDE.toFixed(1);
  });
  document.getElementById('_devSpacer').addEventListener('input', function(e) {
    var v = e.target.value;
    document.documentElement.style.setProperty('--spacer-h', v + 'vh');
    document.getElementById('_devSpacerV').textContent = v + 'vh';
  });

  // Add custom window button
  document.getElementById('_devAddWindow').addEventListener('click', _devAddCustomWindow);

  _devRefreshWindowList();
}

function _fmtMin(m) {
  const h = Math.floor(m / 60), mm = m % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return h12 + ':' + (mm < 10 ? '0' : '') + mm + ' ' + ampm;
}

var _devSnapIntensity = false;
function _devJumpToTime(min) {
  const slider = document.getElementById('_devTimeSlider');
  const label = document.getElementById('_devTimeLabel');
  const liveChk = document.getElementById('_devTimeLive');
  if (slider) { slider.value = min; }
  if (label) { label.textContent = _fmtMin(min); }
  if (liveChk) { liveChk.checked = false; }
  _devTimeOverride = { h: Math.floor(min/60), m: min%60 };
  _devSnapIntensity = true; // snap discs instantly on next frame
}

function _devRefreshWindowList() {
  const el = document.getElementById('_devWindowList');
  if (!el) return;
  const T = window._prayerTimings || PT_FALLBACK;
  el.innerHTML = PRAYER_WINDOWS_DEF.map(function(d, i) {
    const startMin = ptParseMin(T[d.startKey] || '0:00');
    const endMin = ptParseMin(T[d.endKey] || '0:00');
    const midMin = d.startKey === 'Midnight' ? (startMin + Math.floor(((endMin - startMin + 1440) % 1440) / 2)) % 1440 : startMin + 5;
    return '<div style="padding:2px 0;color:#aaa;cursor:pointer;display:flex;align-items:center;gap:4px" data-min="' + midMin + '">' +
      '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#' + d.color.toString(16).padStart(6,'0') + '"></span>' +
      '<span style="flex:1">' + d.name + ': ' + (T[d.startKey]||'?') + ' → ' + (T[d.endKey]||'?') + '</span>' +
      '<button data-start="' + startMin + '" style="font:9px monospace;background:#333;color:#8f8;border:1px solid #555;border-radius:3px;padding:1px 5px;cursor:pointer">▶ Start</button>' +
      '<button data-mid="' + midMin + '" style="font:9px monospace;background:#333;color:#ff8;border:1px solid #555;border-radius:3px;padding:1px 5px;cursor:pointer">● Mid</button>' +
      '<button data-end="' + Math.max(endMin - 2, 0) + '" style="font:9px monospace;background:#333;color:#f88;border:1px solid #555;border-radius:3px;padding:1px 5px;cursor:pointer">■ End</button>' +
      '</div>';
  }).join('');
  el.querySelectorAll('[data-start]').forEach(function(btn) {
    btn.addEventListener('click', function(e) { e.stopPropagation(); _devJumpToTime(parseInt(btn.dataset.start)); });
  });
  el.querySelectorAll('[data-mid]').forEach(function(btn) {
    btn.addEventListener('click', function(e) { e.stopPropagation(); _devJumpToTime(parseInt(btn.dataset.mid)); });
  });
  el.querySelectorAll('[data-end]').forEach(function(btn) {
    btn.addEventListener('click', function(e) { e.stopPropagation(); _devJumpToTime(parseInt(btn.dataset.end)); });
  });
}

var _devCustomIdCounter = 0;
function _devAddCustomWindow() {
  const id = ++_devCustomIdCounter;
  const colors = ['#ff0000','#00ff00','#0088ff','#ff8800','#ff00ff','#00ffcc','#ffff00'];
  const color = colors[_devCustomWindows.length % colors.length];
  const win = { id, name: 'Debug ' + id, startH: 12, startM: 0, endH: 14, endM: 0, color: color };
  _devCustomWindows.push(win);
  _devRenderCustomList();
  _devApplyCustomWindows();
}

function _devRemoveCustomWindow(id) {
  _devCustomWindows = _devCustomWindows.filter(function(w) { return w.id !== id; });
  _devRenderCustomList();
  _devApplyCustomWindows();
}

function _devRenderCustomList() {
  const el = document.getElementById('_devCustomList');
  if (!el) return;
  el.innerHTML = _devCustomWindows.map(function(w) {
    return '<div style="padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.05)" data-id="' + w.id + '">' +
      '<input type="color" value="' + w.color + '" data-field="color" style="width:20px;height:16px;border:none;padding:0;vertical-align:middle;cursor:pointer"> ' +
      '<input type="text" value="' + w.name + '" data-field="name" style="width:50px;background:#222;color:#fff;border:1px solid #444;border-radius:2px;font:10px monospace;padding:1px 3px"> ' +
      '<input type="number" value="' + w.startH + '" data-field="startH" min="0" max="23" style="width:28px;background:#222;color:#fff;border:1px solid #444;border-radius:2px;font:10px monospace;padding:1px">:' +
      '<input type="number" value="' + w.startM + '" data-field="startM" min="0" max="59" style="width:28px;background:#222;color:#fff;border:1px solid #444;border-radius:2px;font:10px monospace;padding:1px"> → ' +
      '<input type="number" value="' + w.endH + '" data-field="endH" min="0" max="23" style="width:28px;background:#222;color:#fff;border:1px solid #444;border-radius:2px;font:10px monospace;padding:1px">:' +
      '<input type="number" value="' + w.endM + '" data-field="endM" min="0" max="59" style="width:28px;background:#222;color:#fff;border:1px solid #444;border-radius:2px;font:10px monospace;padding:1px"> ' +
      '<button data-remove="' + w.id + '" style="background:#600;color:#faa;border:1px solid #844;border-radius:2px;font:10px monospace;padding:0 5px;cursor:pointer">✕</button>' +
      '</div>';
  }).join('');

  // Wire events
  el.querySelectorAll('[data-remove]').forEach(function(btn) {
    btn.addEventListener('click', function() { _devRemoveCustomWindow(parseInt(btn.dataset.remove)); });
  });
  el.querySelectorAll('[data-field]').forEach(function(inp) {
    inp.addEventListener('change', function() {
      const row = inp.closest('[data-id]');
      const id = parseInt(row.dataset.id);
      const w = _devCustomWindows.find(function(x) { return x.id === id; });
      if (!w) return;
      const f = inp.dataset.field;
      if (f === 'color' || f === 'name') w[f] = inp.value;
      else w[f] = parseInt(inp.value) || 0;
      _devApplyCustomWindows();
    });
  });
}

// Boundary debug lines (thin beams at start/end of each visible window)
function _devUpdateBoundaries() {
  // Clear existing
  _devBoundaryBeams.forEach(function(b) { prismGroup.remove(b); });
  _devBoundaryBeams.length = 0;
  if (!_devShowBoundaries || !_devActive) return;

  const allSectors = prayerSectors.concat(_devCustomSectors || []);
  allSectors.forEach(function(ps) {
    [ps.startAng, ps.endAng].forEach(function(ang) {
      const geo = new THREE.PlaneGeometry(0.08, SECTOR_RADIUS, 1, 1);
      geo.translate(0, SECTOR_RADIUS / 2, 0);
      const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false });
      const m = new THREE.Mesh(geo, mat);
      const grp = new THREE.Group();
      grp.add(m);
      grp.position.y = 0.04;
      grp.rotation.order = 'YXZ';
      grp.rotation.y = ang;
      grp.rotation.x = Math.PI / 2;
      prismGroup.add(grp);
      _devBoundaryBeams.push(grp);
    });
  });
}

var _devCustomSectors = [];
function _devApplyCustomWindows() {
  _devCustomSectors = _devCustomWindows.map(function(w) {
    const startMin = w.startH * 60 + w.startM;
    const endMin = w.endH * 60 + w.endM;
    return {
      def: { name: w.name, color: parseInt(w.color.replace('#',''), 16), color2: parseInt(w.color.replace('#',''), 16) },
      startMin: startMin,
      endMin: endMin,
      startAng: ptTimeToAngle(startMin),
      endAng: ptTimeToAngle(endMin),
      isCustom: true
    };
  });
  _devUpdateBoundaries();
}

// Override getDevNow for time simulation
function _getDevNow() {
  if (_devTimeOverride) {
    const d = new Date();
    d.setHours(_devTimeOverride.h, _devTimeOverride.m, 0, 0);
    return d;
  }
  return new Date();
}

// Toggle dev mode
function _devToggle() {
  _devActive = !_devActive;
  const p = document.getElementById('_devPanel');
  if (_devActive) {
    _devBuildPanel();
    document.getElementById('_devPanel').style.display = '';
    _devUpdateBoundaries();
    // Keep canvas behind content — dev panel has its own z-index
    renderer.domElement.style.zIndex = '0';
  } else {
    if (p) p.style.display = 'none';
    _devBoundaryBeams.forEach(function(b) { prismGroup.remove(b); });
    _devBoundaryBeams.length = 0;
    renderer.domElement.style.zIndex = '';
    _devTimeOverride = null;
  }
}

// Activate with ?dev or D key
if (location.search.includes('dev')) { _devActive = true; setTimeout(_devBuildPanel, 100); setTimeout(_devUpdateBoundaries, 200); }
document.addEventListener('keydown', function(e) { if (e.key === 'D' || e.key === 'd') _devToggle(); });
