# Chris — Cinematic Plinth Looks (AGOT)

## Look 02 — **Turrell Void Gradient**
**Vibe:** Minimal light-architecture. The plinth feels like it’s emerging from a colored atmospheric field, with a cool-to-warm perceptual gradient and almost no obvious source.

### RectAreaLight setup
**Light A (cool sky wash)**
- `color`: `0x9eb8ff`
- `intensity`: `10.5`
- `width`: `7.2`
- `height`: `4.0`
- `position`: `(-3.2, -6.6, 5.6)`
- `lookAt`: `(0.2, -1.2, 1.0)`

**Light B (warm latent floor bounce)**
- `color`: `0xffb46e`
- `intensity`: `4.8`
- `width`: `4.8`
- `height`: `2.2`
- `position`: `(2.6, -8.8, 2.7)`
- `lookAt`: `(-0.4, -2.4, 1.2)`

### Optional concrete tweak
- `roughness`: `0.72` (slightly lower than baseline to catch the gradient softly)
- `normalScale`: `(0.52, 0.52)` (keeps texture elegant, not crunchy)

---

## Look 03 — **Eliasson Crossfire**
**Vibe:** Bold exhibition contrast. Strong cross-lighting sculpts the concrete with visible directional texture and dramatic warm/cool tension.

### RectAreaLight setup
**Light A (warm grazing key from camera-left)**
- `color`: `0xffa35c`
- `intensity`: `13.8`
- `width`: `5.4`
- `height`: `2.4`
- `position`: `(-3.9, -8.4, 3.5)`
- `lookAt`: `(0.8, -1.1, 1.4)`

**Light B (icy rim-fill from rear-right)**
- `color`: `0x8fd7ff`
- `intensity`: `8.2`
- `width`: `3.6`
- `height`: `5.2`
- `position`: `(3.8, -6.2, -1.7)`
- `lookAt`: `(-0.3, -2.0, 1.0)`

### Optional concrete tweak
- `roughness`: `0.84` (more matte to hold shape under harder key)
- `normalScale`: `(0.78, 0.78)` (stronger grain reveal under grazing incidence)

---

## Look 04 — **Ando Chapel Monolith**
**Vibe:** Quiet, architectural, reverent. A single disciplined cool-white plane of light carves the plinth like poured concrete in a sacred gallery.

### RectAreaLight setup
**Light A (single monastic side plane)**
- `color`: `0xd7e2ff`
- `intensity`: `11.6`
- `width`: `2.8`
- `height`: `8.4`
- `position`: `(-2.7, -5.8, 0.8)`
- `lookAt`: `(0.15, -1.6, 1.0)`

### Optional concrete tweak
- `roughness`: `0.90` (calm, dry concrete response)
- `normalScale`: `(0.44, 0.44)` (subtle texture, avoids visual noise)
