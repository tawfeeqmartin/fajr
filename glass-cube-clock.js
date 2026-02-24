// glass-cube-clock.js — Dichroic Glass Prism Clock
// Seven Heavens Studio — integrated into agiftoftime.app
// Three.js FBO dichroic shader, per-channel IOR, real-time H:M:S hands

import * as THREE from 'three';


// ─── CONTAINER DETECTION ──────────────────────────────────────────────────────
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

function getSize() {
  if (_isFullscreen) {
    return { w: window.innerWidth, h: window.innerHeight };
  }
  if (CONTAINED) {
    return { w: CONTAINER.clientWidth || 400, h: CONTAINER.clientHeight || 400 };
  }
  return { w: window.innerWidth, h: window.innerHeight };
}

let { w: W, h: H } = getSize();
let dpr = calcDpr(W, H);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.toneMapping = THREE.AgXToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(dpr);
renderer.setSize(W, H);

if (CONTAINED) {
  CONTAINER.appendChild(renderer.domElement);
} else {
  document.body.appendChild(renderer.domElement);
}

// FBO render target
const fboRT = new THREE.WebGLRenderTarget(W * dpr, H * dpr, {
  minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat,
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
// Cube edges and right angles look geometrically correct (no wide-angle warp).
// Distance compensates for tighter angle so framing stays similar.
const CAM_LANDING    = { pos: [0, 5.5, 9.0],  fov: 35, look: [0, 0.5, 0] };
const CAM_FULLSCREEN = { pos: [0, 10.5, 16.0], fov: 35, look: [0, 0.5, 0] };

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
  renderer.setSize(W, H);
  camera.aspect = W / H;
  camera.updateProjectionMatrix();
  fboRT.setSize(W * dpr, H * dpr);
  cubeMat.uniforms.uRes.value.set(W * dpr, H * dpr);
  cubeMat.uniforms.uAspect.value = W / H;
}
window.addEventListener('resize', onResize);

// ─── FLOOR ────────────────────────────────────────────────────────────────────
const ground = new THREE.Mesh(
  new THREE.CircleGeometry(80, 128),
  new THREE.MeshStandardMaterial({ color: 0x18182a, roughness: 0.88, metalness: 0 })
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
const back = new THREE.SpotLight(0xd8e8ff, 38);
back.position.set(3.0, 3.0, -5.5);
back.target.position.set(0, 0.5, 0);
back.angle = 0.70; back.penumbra = 0.85; back.decay = 1.1;
scene.add(back, back.target);

// GOBO KEY — upper-front-left, broad wash (not a tight spot).
// Shapes the floor with a gentle gradient pool, defines front/top cube faces.
// Wide angle + soft penumbra = falloff is gradual, not a hard disco-spot.
const gobo = new THREE.SpotLight(0xffffff, 32);
gobo.position.set(-3.5, 6.5, 3.2);
gobo.target.position.set(0.3, 0, 0.5);
gobo.angle = 0.42;       // wider cone — broad wash over cube + floor
gobo.penumbra = 0.45;    // soft falloff, blends into ambient naturally
gobo.decay = 1.4;
gobo.castShadow = true;
gobo.shadow.mapSize.set(2048, 2048);
gobo.shadow.bias = -0.001;
scene.add(gobo, gobo.target);

// COOL RIM — catches back edges of cube, separates silhouette from bg
const rim = new THREE.SpotLight(0x8899ff, 9);
rim.position.set(-1.5, 5.5, -3.5);
rim.target.position.set(0, 0.6, 0);
rim.angle = 0.45; rim.penumbra = 0.85;
scene.add(rim, rim.target);

// CUBE SUN — bright point directly behind the cube.
// The FBO shader samples the scene behind the glass — without a bright source
// there, the refracted RGB is dark and no rainbow is visible. This gives it
// bright content to bend, producing visible chromatic dispersion.
const cubeSun = new THREE.PointLight(0xe8f2ff, 120, 14);
cubeSun.position.set(0, 1.0, -2.0);
scene.add(cubeSun);

scene.add(new THREE.AmbientLight(0xffffff, 0.08));

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
  void main() {
    vLocalPos = position;
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

  varying vec3 vViewNormal;
  varying vec3 vViewDir;
  varying vec3 vLocalPos;

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
  },
  vertexShader: dichroicVert,
  fragmentShader: dichroicFrag,
  side: THREE.FrontSide,
});

const cubeMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), cubeMat);
cubeMesh.position.y = CUBE_Y;
cubeMesh.castShadow = true;
prismGroup.add(cubeMesh);
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
floorRay(-101, 0x9900ff, 0xff00ff, 0.72, 3.48, 0.88);   // HOUR   (violet)
floorRay(-114, 0x1133ff, 0x00aaff, 0.72, 5.64, 0.92);   // MINUTE (blue)
floorRay( 216, 0x44ff88, 0x00cc44, 0.40, 9.12, 0.62);   // SECOND (green)

// ─── FLOOR CAUSTICS ───────────────────────────────────────────────────────────
[
  {c:0x6600ff,i:5.5,d:3.2,x:-1.6,y:0.06,z:-0.4},
  {c:0x0033ff,i:5.0,d:2.8,x:-1.1,y:0.06,z:-0.7},
  {c:0x00aaff,i:3.5,d:2.4,x: 0.6,y:0.06,z:-1.0},
  {c:0x00ff66,i:2.0,d:1.8,x: 0.8,y:0.06,z: 0.3},
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

// ─── PRAYER WINDOW SECTORS ────────────────────────────────────────────────────
// Seven glowing fan/pie-slice sectors on the floor, one per Islamic prayer window.
// They indicate the active prayer period and which windows are upcoming.

const PRAYER_WINDOWS_DEF = [
  { name: 'Tahajjud', startKey: 'Midnight', endKey: 'Fajr',    color: 0x7700ee, isFajr: false },
  { name: 'Fajr',    startKey: 'Fajr',     endKey: 'Sunrise',  color: 0x3311cc, isFajr: true  },
  { name: 'Dhuha',   startKey: 'Sunrise',  endKey: 'Dhuhr',    color: 0xffcc00, isFajr: false },
  { name: 'Dhuhr',   startKey: 'Dhuhr',    endKey: 'Asr',      color: 0x00bb44, isFajr: false },
  { name: 'Asr',     startKey: 'Asr',      endKey: 'Maghrib',  color: 0xff8800, isFajr: false },
  { name: 'Maghrib', startKey: 'Maghrib',  endKey: 'Isha',     color: 0xff2200, isFajr: false },
  { name: 'Isha',    startKey: 'Isha',     endKey: 'Midnight', color: 0x0055ff, isFajr: false },
];

const PT_FALLBACK = {
  Fajr: '05:30', Sunrise: '07:00', Dhuhr: '12:15',
  Asr: '15:30', Maghrib: '18:00', Isha: '19:30', Midnight: '23:45',
};

function ptParseMin(str) {
  const p = str.split(' ')[0].split(':').map(Number);
  return p[0] * 60 + p[1];
}

// Map minutes-since-midnight on the 12h clock to a shape angle.
// The 12h clock wraps every 720 min; formula matches the clock-hand convention.
function ptTimeToAngle(totalMinutes) {
  return -((totalMinutes % 720) / 720) * TAU;
}

// Build a flat pie-slice Shape in the XY plane (before rotation to floor).
function makeSectorGeom(radius, thetaStart, thetaLength, segments) {
  segments = segments || 72;
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  for (let i = 0; i <= segments; i++) {
    const th = thetaStart + (thetaLength * i) / segments;
    shape.lineTo(Math.cos(th) * radius, Math.sin(th) * radius);
  }
  shape.lineTo(0, 0);
  return new THREE.ShapeGeometry(shape);
}

// Vertex shader: pass normalised radial distance to fragment for gradient.
const PT_VERT = [
  'uniform float uRadius;',
  'varying float vR;',
  'void main(){',
  '  vR = length(position.xy) / uRadius;',
  '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
  '}',
].join('\n');

// Fragment shader: radial soft glow (fade in from centre, fade out at tip).
const PT_FRAG = [
  'uniform vec3  uColor;',
  'uniform float uOp;',
  'varying float vR;',
  'void main(){',
  '  float fade = smoothstep(0.0, 0.14, vR) * smoothstep(1.0, 0.52, vR);',
  '  gl_FragColor = vec4(uColor, fade * uOp);',
  '}',
].join('\n');

const SECTOR_RADIUS    = 9.12;  // matches second-hand length
const SECTOR_FADE_SEC  = 180.0; // fade window from 1.0→0 over 3 minutes
// A window is "upcoming" if its next start is within this many minutes.
// ~10 h horizon: shows tonight's Tahajjud + tomorrow's Fajr from Isha,
// but not mid-morning windows that are clearly tomorrow.
const SECTOR_HORIZON_MIN = 600;

let prayerSectors = []; // [{ grp, mat, def, startMin, endMin }]
let ptSectorsRebuilt = false;

function buildPrayerSectors() {
  prayerSectors.forEach(function(ps) { prismGroup.remove(ps.grp); });
  prayerSectors = [];

  const T = window._prayerTimings || PT_FALLBACK;

  PRAYER_WINDOWS_DEF.forEach(function(def) {
    const startMin = ptParseMin(T[def.startKey]);
    const endMin   = ptParseMin(T[def.endKey]);
    const startAng = ptTimeToAngle(startMin);
    const endAng   = ptTimeToAngle(endMin);

    // Angular span must sweep clockwise (negative direction).
    let thetaLen = endAng - startAng;
    if (thetaLen > 0) thetaLen -= TAU; // wrap for cross-midnight windows (e.g. Tahajjud)

    const geo = makeSectorGeom(SECTOR_RADIUS, startAng, thetaLen);

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uColor:  { value: new THREE.Color(def.color) },
        uOp:     { value: def.isFajr ? 0.25 : 0.5 },
        uRadius: { value: SECTOR_RADIUS },
      },
      vertexShader:   PT_VERT,
      fragmentShader: PT_FRAG,
      transparent: true,
      blending:    THREE.AdditiveBlending,
      depthWrite:  false,
      side:        THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geo, mat);
    const grp  = new THREE.Group();
    grp.add(mesh);
    grp.rotation.order = 'YXZ';
    grp.rotation.x     = Math.PI / 2;  // tilt XY plane flat onto floor (matches hand convention)
    grp.position.y     = 0.006;        // just below clock hands (0.008)
    prismGroup.add(grp);

    prayerSectors.push({ grp, mat, def, startMin, endMin });
  });
}

buildPrayerSectors(); // initial build with fallback times

function updatePrayerWindows(now) {
  // Rebuild once when real prayer data arrives
  if (window._prayerTimingsReady && !ptSectorsRebuilt) {
    buildPrayerSectors();
    ptSectorsRebuilt = true;
  }
  if (!prayerSectors.length) return;

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  prayerSectors.forEach(function(ps) {
    const { mat, def, startMin, endMin } = ps;
    const wraps = startMin > endMin; // cross-midnight window (Tahajjud)

    // ── Active? ──────────────────────────────────────────────────────────────
    let isActive;
    if (wraps) {
      isActive = (nowMin >= startMin) || (nowMin < endMin);
    } else {
      isActive = (nowMin >= startMin) && (nowMin < endMin);
    }

    // ── Seconds since window ended (for fade-out calculation) ────────────────
    let secSinceEnd = null;
    if (!isActive) {
      const endSecAbs = endMin * 60;
      let elapsed = nowSec - endSecAbs;
      if (elapsed < 0) elapsed += 86400; // wrap midnight
      // Only treat as "just ended" within the fade window + a small buffer
      if (elapsed < SECTOR_FADE_SEC + 120) {
        secSinceEnd = elapsed;
      }
    }

    // ── Minutes until next start (perpetual-cycle upcoming detection) ─────────
    // (startMin - nowMin + 1440) % 1440 = minutes until this window starts again
    const minUntilStart = (startMin - nowMin + 1440) % 1440;

    // ── Compute target opacity ────────────────────────────────────────────────
    let targetOp;
    if (isActive) {
      targetOp = 1.0;
    } else if (secSinceEnd !== null) {
      // Fading from 1.0 → 0 over SECTOR_FADE_SEC seconds
      targetOp = Math.max(0.0, 1.0 - secSinceEnd / SECTOR_FADE_SEC);
    } else if (def.isFajr) {
      // Fajr is always a dim horizon marker when not active or fading.
      // It marks approaching dawn without competing with Tahajjud/Isha.
      targetOp = 0.25;
    } else if (minUntilStart <= SECTOR_HORIZON_MIN) {
      // Window starts within the upcoming-horizon → glow at half brightness
      targetOp = 0.5;
    } else {
      // Past, more than 3 min ago, and not yet "upcoming" — hidden
      targetOp = 0.0;
    }

    // Smooth lerp toward target (0.03 ≈ ~1s transition at 60fps)
    mat.uniforms.uOp.value = THREE.MathUtils.lerp(mat.uniforms.uOp.value, targetOp, 0.03);
  });
}

// ─── ANIMATE ──────────────────────────────────────────────────────────────────
const clock = new THREE.Clock();

prismGroup.rotation.y = Math.PI / 4;

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

  clockRays[0].mesh.rotation.y = clockRays[0].initY - (h / 12) * TAU;   // hour
  clockRays[1].mesh.rotation.y = clockRays[1].initY - (m / 60) * TAU;   // minute
  clockRays[2].mesh.rotation.y = clockRays[2].initY - (s / 60) * TAU;   // second

  // Update prayer window sector opacities
  updatePrayerWindows(now);

  // FBO pass
  cubeMesh.visible = false;
  renderer.setRenderTarget(fboRT);
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);
  cubeMesh.visible = true;
  cubeMat.uniforms.uScene.value = fboRT.texture;

  renderer.render(scene, camera);
})();

// Signal site that clock is ready
document.body.classList.add('clock-ready');
