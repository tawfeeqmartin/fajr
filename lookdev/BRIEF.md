# Lookdev Brief: Plinth Lighting Looks

## Context
We're exploring cinematic exhibition lighting for the AGOT prayer clock plinth. The cube sits on a tall dark concrete pedestal. Current lighting: gobo spotlight from above, back/rim spots, tawaf orbit spot, colored prayer window floor discs.

## What we're adding
- Concrete texture on plinth (Tawfeeq's reference: dark smooth cement wall)
- Uplighting/accent lighting to reveal the plinth surface and add cinematic depth

## Look 01 (approved direction)
Single RectAreaLight (6×3), cool white `0xddddf8`, intensity 12, positioned bottom-left `(-2,-8,4)`, aimed diagonal `(1,0,1.32)`. Gives museum gallery pedestal feel.

## Research: Cinematic Exhibition Lighting Techniques
1. **Concealed pedestal uplights** — hidden at base, project up, emphasize sculpture form
2. **Cross-lighting** — two sources at opposing angles reveal 3D form and texture
3. **Spill light** — soft edge bleed creates atmosphere around the object
4. **Warm/cool contrast** — warm key + cool fill creates depth and dimension
5. **Grazing light** — light at extreme angle to surface reveals texture (concrete grain)
6. **Silhouette rim** — backlight creates edge separation from background
7. **Colored accent** — subtle color in fill creates mood (blue=night, amber=warmth)
8. **Diffuse room light + accent spots** — calm overall + high-contrast on object

## Constraints
- Must work with existing lighting rig (gobo, back, rim, tawaf orbit)
- Must not overpower the cube or prayer window colors
- Plinth is `BoxGeometry(2.64, 20, 2.64)`, top face at y≈-0.03
- Scene bg: `#0d0d12`, fog density 0.048
- Camera: pos(0.2, 9.7, 15.0) FOV35° lookAt(0, -0.8, 1.0)
- RectAreaLight requires `RectAreaLightUniformsLib.init()`
- Texture files in `lookdev/` dir (look01-color.jpg, look01-normal.jpg, look01-rough.jpg)

## Deliverable
3 distinct looks each. Render screenshot + parameters documented in LOOKS.md.
