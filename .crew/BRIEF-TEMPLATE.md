# BRIEF — [Title]

## Goal
_One sentence: what this change achieves._

## Spec
_Exact requirements. Each one is a pass/fail checkbox._
- [ ] Requirement 1
- [ ] Requirement 2
- [ ] Requirement 3

## Constraints
- File: `glass-cube-clock.js` only (never index.html)
- Must survive 3x DPR iPhone rendering
- No console errors
- No geometry edge artifacts visible at camera angle
- Must not break existing features (prayer windows, compass, beams)

## Context
_Key technical context the builder needs._
- Camera: pos(0.2, 9.7, 15.0) FOV35° lookAt(0, -0.8, 1.0)
- Cube: Y=0.60, rotated PI/4
- Floor: CircleGeometry(40, 64) at Y=0
- Viewport: 430×932 (iPhone), 3x DPR on device

## Anti-Patterns (Don't Do This)
- Don't blur textures to fix geometry edges
- Don't assume 1x DPR render = device appearance
- Don't widen gobo cones (floodlight ≠ beam)

## Success Criteria
_How Brett (reviewer) judges pass/fail._
