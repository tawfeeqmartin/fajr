# Three.js Tawaf Implementation Plan

## New Files (existing files untouched)
- `prototype/tawaf-gl.html` — New HTML entry point with Three.js importmap
- `prototype/tawaf-gl.js` — New Three.js generative engine

## Architecture

### Rendering Strategy: Pre-computed Geometry + drawRange Reveal

1. **On artwork generation**, compute ALL orbital positions for the full prayer period upfront
2. Store positions in `THREE.BufferGeometry` with pre-allocated Float32Arrays
3. Each frame, set `geometry.drawRange.count` based on prayer progress — GPU reveals lines incrementally
4. **AdditiveBlending** on all trace materials — the key to luminous, even renders

### Scene Structure (OrthographicCamera — flat 2D view)

```
Scene
├── traceGroup (persistent orbital traces)
│   ├── Line (midpoint rosette per pair) — AdditiveBlending
│   └── LineSegments (connecting lines per pair) — AdditiveBlending
├── liveGroup (cleared/rebuilt every frame)
│   ├── Points (tawaf orbiter dots)
│   ├── Line segments (comet tails)
│   ├── Line (clock hand lines from center)
│   └── Points (clock hand dots — sec/min/hr)
└── (no lights needed — unlit materials)
```

### Post-processing
- `EffectComposer` → `RenderPass` → `UnrealBloomPass`
- Night mode: bloom strength ~0.4, radius ~0.5, threshold ~0.2 (luminous glow on dots)
- Day mode: bloom strength 0, or very subtle ~0.05

### Day/Night Mode
- **Night**: Black background (#020204) + AdditiveBlending → luminous lines naturally
- **Day**: White background (#f5f2ed) + switch materials to NormalBlending with low opacity + darkened colors (same approach as current canvas version, since additive on white = invisible)

### What Ports Over Directly from tawaf.js
- Islamic calendar functions (getHijriDate, getRamadanDay, getMoonPhase, etc.)
- Prayer period detection (getCurrentPrayerPeriod, getDemoPrayerTimes)
- Location/Qibla computation (computeQibla, initGeolocation, initCompass)
- Seed system (hashSeed, seededRandom)
- generateArtwork() — ratio bank, pair generation, depth system
- Virtual time system (getVirtualTime, speedMultiplier)
- UI update logic (updateUI, button handlers)

### What Changes
- Canvas 2D drawing → Three.js geometry + materials
- Two-canvas compositing → single WebGL renderer with scene layers
- Manual glow gradients → UnrealBloomPass bloom
- Alpha compositing → AdditiveBlending (night) / NormalBlending (day)
- drawTraces() incremental → drawRange on pre-computed geometry
- Right-click save → renderer.domElement.toDataURL() with preserveDrawingBuffer

### Key Improvements for "Beautiful Even Renders"
1. **Much higher revolution count**: 300-800 (vs current 50-140) — GPU handles this easily
2. **Additive blending**: Lines accumulate brightness, no muddy opacity buildup
3. **Uniform thin lines**: All traces render at consistent 1px width
4. **Bloom post-processing**: Natural luminous glow without manual gradient hacks
5. **Pre-computed full geometry**: No per-frame overhead for trace drawing

### Implementation Steps

1. Create `tawaf-gl.html` — copy overlay UI from index.html, add Three.js importmap, reference tawaf-gl.js
2. Create `tawaf-gl.js`:
   a. Import Three.js + postprocessing
   b. Port all Islamic calendar / seed / location code unchanged
   c. Build Three.js scene: OrthographicCamera, WebGLRenderer, EffectComposer
   d. Port generateArtwork() — increase totalRevolutions to 300-800
   e. Implement buildTraceGeometry() — pre-compute all positions into BufferGeometry
   f. Implement updateLiveElements() — orbiter dots, clock hands, comet tails
   g. Implement day/night mode switching (blend mode + colors + bloom)
   h. Wire up UI controls (Next Seed, 120×, Night/Day, Clear)
   i. Right-click save via preserveDrawingBuffer + toBlob
3. Add dev server config for the new file (or just access via same port)
