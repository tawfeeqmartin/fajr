# Clock Swap Guide

## Current Production Clock
- **File:** `clock.js?v=375` (Canvas 2D, 2540 lines, 115KB)
- **Entry point:** `index.html` loads it at line 1769: `_cs.src='clock.js?v=375'`
- **Features:** 11 dial designs, spatial adhan, Quran playback, GPS prayer times, tawaf animation

## New Prototype Clock (Tawaf GL)
- **Files:** `prototype/tawaf-gl.js` + `prototype/tawaf-gl.html` (Three.js WebGL, 2141 lines, 100KB)
- **Features:** WebGL tawaf drawing, Fourier epicycle Kaaba, Turrell atmosphere, layered prayer transitions
- **Dependencies:** Three.js 0.170.0 + lil-gui 0.19.2 (via esm.sh CDN)

## To Restore Old Clock
The old clock is still `clock.js` in the repo root — it was never modified or removed.
Simply revert `index.html` to point back to `clock.js?v=375` if the new clock needs to be rolled back.

```bash
# The old clock.js is untouched in the repo root
# index.html still loads it — nothing to restore unless integration changes index.html
git checkout -- index.html  # if index.html was modified during integration
```

## Backups
- `prototype/tawaf-gl.js.bak` — original prototype before any performance work
- `prototype/tawaf-gl.html.bak` — original HTML before any changes

## Integration Notes
When integrating tawaf-gl into the main site:
1. Bundle Three.js (replace esm.sh CDN imports)
2. Strip lil-gui dev panel
3. Strip `preserveDrawingBuffer: true` (or keep if right-click save needed)
4. Strip `window._PRESETS`, `window._rebuild`, console.log debug lines
5. Wire up real prayer times API (currently uses hardcoded demo times)
6. Merge tawaf-gl.html styles into index.html
