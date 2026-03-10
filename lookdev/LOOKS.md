# Plinth Lighting Looks

## Look 01 — "Gallery Diagonal" ✅ (Tawfeeq approved direction)
- **Texture**: Tawfeeq's concrete wall (dark cement, smooth)
- **Texture maps**: color + generated normal (strength 0.5) + generated roughness
- **Tiling**: RepeatWrapping 2×4
- **Light**: Single RectAreaLight
  - Color: `0xddddf8` (cool white, slight blue)
  - Intensity: 12
  - Size: 6×3 (wide rect)
  - Position: `(-2, -8, 4)` — bottom-left
  - LookAt: `(1, 0, 1.32)` — diagonal across plinth face
- **Effect**: Diagonal wash gradient, bottom-left to top-right, concrete grain visible in lit zone
- **Vibe**: Museum/gallery pedestal

## Look 02 — "Turrell Void Gradient" (Chris) ✅ Tawfeeq approved
- **Light A** (cool sky wash): `0x9eb8ff`, intensity 10.5, size 7.2×4.0, pos(-3.2,-6.6,5.6), lookAt(0.2,-1.2,1.0)
- **Light B** (warm floor bounce): `0xffb46e`, intensity 4.8, size 4.8×2.2, pos(2.6,-8.8,2.7), lookAt(-0.4,-2.4,1.2)
- **Concrete**: roughness 0.72, normalScale 0.52
- **Vibe**: Atmospheric color field, cool-to-warm gradient, no obvious source

## Look 03 — "Ando Chapel Monolith" (Chris) ✅ Tawfeeq approved
- **Light A** (single monastic side plane): `0xd7e2ff`, intensity 11.6, size 2.8×8.4, pos(-2.7,-5.8,0.8), lookAt(0.15,-1.6,1.0)
- **Concrete**: roughness 0.90, normalScale 0.44
- **Vibe**: Austere architectural single plane, Tadao Ando chapel

## Look 04 — "Mihrab Moonbeam" (Chris R2) ✅ Tawfeeq approved
- **Light A** (lunar slit key): `0xBFD4FF`, intensity 12.9, size 2.2×9.4, pos(-3.1,-5.4,1.6), lookAt(0.25,-1.5,1.1)
- **Light B** (warm earth bounce): `0xFFB978`, intensity 3.9, size 3.8×1.7, pos(2.0,-9.4,2.5), lookAt(-0.2,-2.6,1.0)
- **Concrete**: roughness 0.88, normalScale 0.58
- **Vibe**: Devotional night geometry, lunar shaft like light entering a mihrab at tahajjud

## Look 05 — "Processional Lanterns" (Chris R2) ✅ Tawfeeq approved
- **Light A** (teal guide): `0x7EDBFF`, intensity 9.1, size 1.9×8.8, pos(-3.8,-6.1,0.1), lookAt(0.35,-1.9,1.0)
- **Light B** (rose-amber guide): `0xFF9B86`, intensity 8.7, size 1.9×8.2, pos(3.9,-6.0,0.4), lookAt(-0.25,-2.0,1.2)
- **Concrete**: roughness 0.80, normalScale 0.72
- **Vibe**: Theatrical sacred procession, opposing vertical lantern planes

## Look 06 — "Deakins Ember Silence" (Chris R2) ✅ Tawfeeq approved
- **Light A** (warm intimate key): `0xFFC188`, intensity 11.3, size 4.6×2.3, pos(-3.5,-8.7,3.2), lookAt(0.65,-1.2,1.35)
- **Light B** (cold distant veil): `0x9AB8E8`, intensity 5.6, size 5.8×3.6, pos(2.8,-6.7,-2.4), lookAt(-0.15,-2.4,0.95)
- **Concrete**: roughness 0.86, normalScale 0.50
- **Vibe**: Cinematic prayer-before-dawn, warm human vs cold cosmic
