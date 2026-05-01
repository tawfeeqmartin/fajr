// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Shared visual style for fajr's SVG chart generators.
 *
 * One palette + one set of typographic conventions across:
 *   - scripts/build-readme-charts.js   (WMAE trend, per-source, per-region, bias)
 *   - scripts/build-hilal-map.js       (per-month world map)
 *   - scripts/build-hilal-year-animation.js (12-month animated map)
 *
 * Light/cream theme — chosen to match GitHub's white README rendering so
 * the embedded SVGs sit on the page rather than floating as dark rectangles.
 * Series colours are consistent across charts: green for train / visible,
 * purple for holdout / test, amber for borderline, red for unsafe / disagree.
 */

export const STYLE = {
  // Page-level + plot panels
  bg:           '#fafaf7',    // page background (warm cream, matches GitHub light)
  panel:        '#f1efe8',    // chart plot area (slightly darker cream)
  panelAlt:     '#e8e6df',    // alternating row / hover
  fg:           '#1a1a1a',    // primary text (near-black)
  fgDim:        '#5a5a5a',    // secondary text / labels
  fgFaint:      '#8a8a8a',    // axis tick labels, deemphasised
  grid:         '#dcdcd0',    // chart grid lines (dashed)
  axis:         '#a8a89a',    // chart axis lines (solid)
  zero:         '#888',       // zero / reference lines

  // Series — train vs holdout. Slightly darker than typical "vivid" greens
  // so they read with strong contrast on the cream background.
  train:        '#1f7a4d',    // train data, "visible" cells
  trainBg:      '#dff1e7',
  test:         '#7a4d9c',    // holdout data, "test" cells
  testBg:       '#ece1f3',

  // Status / classification
  visible:      '#1f7a4d',    // matches train
  borderline:   '#c8881a',    // warmer amber for white bg
  notVisible:   '#9aa0a8',    // muted neutral grey
  unsafe:       '#c83030',    // ihtiyat-unsafe drift, ikhtilaf disagreement
  warn:         '#c83030',    // alias

  // City anchors / overlays
  city:         '#1a1a1a',    // dark dot on cream
  cityHalo:     '#fafaf7',    // halo behind city dot/text for legibility
  sighted:      '#1f7a4d',
  notSighted:   '#c83030',

  // Typography
  fontFamily:   '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  fontSize:     11,
  titleSize:    17,
  subtitleSize: 11,
  axisSize:     10,
  tickSize:     9,
}

// Common SVG header — every chart starts with a viewbox, background fill,
// and font defaults. Returns the opening tag + background rect.
export function svgOpen(width, height) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" font-family="${STYLE.fontFamily}" font-size="${STYLE.fontSize}">`
       + `<rect width="${width}" height="${height}" fill="${STYLE.bg}" />`
}

export function svgClose() { return '</svg>' }

// Centred title at the top of a chart.
export function title(width, y, text, opts = {}) {
  return `<text x="${width/2}" y="${y}" text-anchor="middle" fill="${STYLE.fg}" font-size="${opts.size ?? STYLE.titleSize}" font-weight="${opts.weight ?? 600}">${escapeXml(text)}</text>`
}

export function subtitle(width, y, text) {
  return `<text x="${width/2}" y="${y}" text-anchor="middle" fill="${STYLE.fg}" font-size="${STYLE.subtitleSize}" opacity="0.8">${escapeXml(text)}</text>`
}

export function escapeXml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]))
}

// Linear scale: domain [d0,d1] → range [r0,r1]
export function scale(d0, d1, r0, r1) {
  if (d1 === d0) return () => (r0 + r1) / 2
  return d => r0 + (d - d0) * (r1 - r0) / (d1 - d0)
}

export function niceCeil(v) {
  if (v <= 0) return 1
  const p = Math.pow(10, Math.floor(Math.log10(v)))
  const m = v / p
  if (m <= 1)   return 1   * p
  if (m <= 2)   return 2   * p
  if (m <= 2.5) return 2.5 * p
  if (m <= 5)   return 5   * p
  return 10 * p
}
