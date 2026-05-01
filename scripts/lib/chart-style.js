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
 * The unified theme is dark — the hilal world maps need a dark canvas for
 * the colour-coded cells to read cleanly, and harmonising the WMAE charts
 * to the same palette keeps the published artifacts visually coherent.
 *
 * Series colours are consistent across charts: green for train / visible,
 * purple for holdout / test, amber for borderline, red for unsafe / disagree.
 */

export const STYLE = {
  // Page-level + plot panels
  bg:           '#0f1923',    // page background
  panel:        '#1c2733',    // chart plot area
  panelAlt:     '#243140',    // alternating row / hover
  fg:           '#ecedf2',    // primary text
  fgDim:        '#9aa4b0',    // secondary text / labels
  fgFaint:      '#5a6a7a',    // axis tick labels, deemphasised
  grid:         '#2a3a4a',    // chart grid lines (dashed)
  axis:         '#3b4a59',    // chart axis lines (solid)
  zero:         '#5a6a7a',    // zero / reference lines

  // Series — train vs holdout
  train:        '#3ed16f',    // train data, "visible" cells
  trainBg:      '#1f3a2a',
  test:         '#9d7bff',    // holdout data, "test" cells
  testBg:       '#2c2244',

  // Status / classification
  visible:      '#3ed16f',    // matches train
  borderline:   '#d6a833',
  notVisible:   '#3b4a59',    // muted neutral
  unsafe:       '#ff5252',    // ihtiyat-unsafe drift, ikhtilaf disagreement
  warn:         '#ff5252',    // alias

  // City anchors / overlays
  city:         '#ffffff',
  cityHalo:     '#0f1923',    // halo behind city dot/text for legibility
  sighted:      '#3ed16f',
  notSighted:   '#ff5252',

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
