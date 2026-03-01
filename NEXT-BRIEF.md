# NEXT BRIEF — Chris lookdev handoff (v58)

## What the scene looks like now
- Mashrabiya lattice gobo from far LEFT (-6, 16, 3) — light source off-screen bottom-left
- Islamic geometric star-and-cross pattern replaces procedural arch
- HYBRID approach: stamps carry primary lattice shape + gobo at intensity 8 for real light
- Gobo has mashrabiya texture on .map — casts geometric lattice light/shadow onto floor and cube
- Floor stamps aligned at ~36° (-PI*0.2) diagonal, position (-3.5, y, 0)
- Two-layer stamp system: bloom 10×34, base 8.5×30 — aspect ~1:3.5 matches panel
- Outline stamp removed — mashrabiya lattice has its own intricate edges
- Texture loaded from references/mashrabiya-pattern.jpg via THREE.TextureLoader
- White openings = light passes through, black lattice = blocked (additive blend)
- Cube top face tamed by shader scrim (55% attenuation)
- Three spectral clock hands (H/M/S) on floor, prayer window sectors active
- Dark scene (0x0d0d12), AgX tonemapping @ 0.95 exposure, deep dramatic mood
- Base stamp: warm white-gold (0xffe0a0) at 0.35 opacity — lattice reads clearly
- Bloom stamp: orange corona (0xff7020) at 0.10 opacity — atmospheric halo
- Warm foreground fog at 0.09 opacity prevents dead lower frame
- Ambient crushed: hemisphere 0.18, ambient 0.07, ghostFill 0.5 — deep darkness outside lattice

## What changed in v58
1. **Mashrabiya texture replaces procedural arch** — both _makeArchTexture and
   _makeArchOutlineTexture removed. Now loads references/mashrabiya-pattern.jpg
   via THREE.TextureLoader. Tall narrow panel with repeating star-and-cross motifs.
2. **Outline stamp removed** — the geometric lattice pattern carries its own
   intricate edges. No separate outline layer needed.
3. **Base stamp retuned** — color shifted to warm white-gold (0xffe0a0) from
   orange (0xffaa40). Opacity 0.30→0.35. Reads as light filtering through
   a sacred geometric screen, not tinted amber.
4. **Stamp planes resized** — base 12.1×28→8.5×30, bloom 15.4×34→10×34.
   Aspect ratio ~1:3.5 matches the tall narrow mashrabiya panel proportions.
5. **Gobo boosted** — intensity 6→8. Mashrabiya lattice benefits from more
   physical light to project geometric pattern onto floor and cube.
6. **Gobo uses same mashrabiya texture** — separate texture instance for
   SpotLight.map. Real light casts through geometric lattice openings.
7. **Bloom corona adjusted** — 0.08→0.10. Slightly wider atmospheric halo
   compensates for the finer geometric detail.

## What needs attention next
- **Lattice readability**: the star-and-cross motifs are fine geometric detail.
  At 430×932 viewport the pattern may blur — if so, try increasing stamp size
  or reducing exposure to let contrast carry the pattern.
- **Gobo intensity**: at 8, the geometric light/shadow should read on the cube
  and floor. If too bright (gobo dominates stamps), drop to 6. If the physical
  light through the lattice is barely visible, try 10.
- **Stamp color temperature**: base at 0xffe0a0 (warm white-gold) should read
  as filtered sunlight. If too cold/clinical, try 0xffcc70. If too warm, 0xfff0c0.
- **Texture filtering**: LinearMipmapLinear should handle the fine lattice detail.
  If moiré artifacts appear at distance, try anisotropic filtering or adjust
  texture repeat.
- **Panel aspect ratio**: 8.5×30 (~1:3.5) matches the reference image. If the
  pattern looks stretched or squished, adjust the plane width.
- **Bloom opacity**: 0.10 for the corona may be too strong with the fine pattern.
  If it makes the lattice look fuzzy, drop to 0.06. If the edges feel too hard, 0.12.
- **Floor coverage**: the mashrabiya panel is narrower than the old arch. The
  illuminated zone on the floor may feel smaller — if so, widen the base stamp
  or add a very dim wide fill layer.

## Client notes to carry forward
- Client wants mashrabiya/jali lattice replacing the procedural arch
- Pattern source: references/mashrabiya-pattern.jpg — black lattice, white openings
- Light projection should feel like real mashrabiya filtering sacred light
- Same diagonal orientation as before — projecting from off-screen bottom-left
- Client: 'lower exposure outside arch for drama' — preserved from v57
- Client: 'hybrid stamps + gobo for real light' — preserved, gobo now uses lattice
- index.html is off limits
