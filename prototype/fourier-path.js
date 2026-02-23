// fourier-path.js — Extract Bismillah calligraphy path, stitch sub-paths, warp to circle
// Uses opentype.js to parse an Arabic font

const TWO_PI = Math.PI * 2;

// Bismillah in Arabic
const BISMILLAH = '\u0628\u0650\u0633\u0652\u0645\u0650 \u0627\u0644\u0644\u0651\u0647\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u064E\u0670\u0646\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0650\u064A\u0645\u0650';

/**
 * Load Amiri font via opentype.js and extract the Bismillah glyph path.
 * Returns: array of sub-paths, each an array of {x, y} points.
 */
export async function loadBismillahPath(opentype, fontUrl, fontSize) {
    fontSize = fontSize || 72;

    const font = await new Promise((resolve, reject) => {
        opentype.load(fontUrl, (err, f) => {
            if (err) reject(err);
            else resolve(f);
        });
    });

    // Get the full text path — opentype handles Arabic shaping
    const path = font.getPath(BISMILLAH, 0, 0, fontSize);
    const cmds = path.commands;

    // Split into sub-paths on M (moveTo) boundaries
    const subPaths = [];
    let current = null;

    for (const cmd of cmds) {
        if (cmd.type === 'M') {
            current = [{ type: 'M', x: cmd.x, y: cmd.y }];
            subPaths.push(current);
        } else if (current) {
            current.push(cmd);
        }
    }

    return { subPaths, font, path };
}

/**
 * Sample a sub-path (array of SVG commands) into equidistant points.
 * Handles L (line), Q (quadratic Bezier), C (cubic Bezier).
 */
function sampleSubPath(commands, samplesPerUnit) {
    samplesPerUnit = samplesPerUnit || 0.5;
    const rawPoints = [];
    let cx = 0, cy = 0;

    for (const cmd of commands) {
        if (cmd.type === 'M') {
            cx = cmd.x; cy = cmd.y;
            rawPoints.push({ x: cx, y: cy });
        } else if (cmd.type === 'L') {
            cx = cmd.x; cy = cmd.y;
            rawPoints.push({ x: cx, y: cy });
        } else if (cmd.type === 'Q') {
            // Quadratic Bezier: from (cx,cy) via (cmd.x1,cmd.y1) to (cmd.x,cmd.y)
            const x0 = cx, y0 = cy;
            const x1 = cmd.x1, y1 = cmd.y1;
            const x2 = cmd.x, y2 = cmd.y;
            const dist = Math.hypot(x1 - x0, y1 - y0) + Math.hypot(x2 - x1, y2 - y1);
            const steps = Math.max(Math.ceil(dist * samplesPerUnit), 3);
            for (let i = 1; i <= steps; i++) {
                const t = i / steps;
                const mt = 1 - t;
                rawPoints.push({
                    x: mt * mt * x0 + 2 * mt * t * x1 + t * t * x2,
                    y: mt * mt * y0 + 2 * mt * t * y1 + t * t * y2,
                });
            }
            cx = x2; cy = y2;
        } else if (cmd.type === 'C') {
            // Cubic Bezier
            const x0 = cx, y0 = cy;
            const x1 = cmd.x1, y1 = cmd.y1;
            const x2 = cmd.x2, y2 = cmd.y2;
            const x3 = cmd.x, y3 = cmd.y;
            const dist = Math.hypot(x1 - x0, y1 - y0) + Math.hypot(x2 - x1, y2 - y1) + Math.hypot(x3 - x2, y3 - y2);
            const steps = Math.max(Math.ceil(dist * samplesPerUnit), 4);
            for (let i = 1; i <= steps; i++) {
                const t = i / steps;
                const mt = 1 - t;
                rawPoints.push({
                    x: mt*mt*mt*x0 + 3*mt*mt*t*x1 + 3*mt*t*t*x2 + t*t*t*x3,
                    y: mt*mt*mt*y0 + 3*mt*mt*t*y1 + 3*mt*t*t*y2 + t*t*t*y3,
                });
            }
            cx = x3; cy = y3;
        } else if (cmd.type === 'Z') {
            // Close — optionally connect back to first point
            if (rawPoints.length > 0) {
                const first = rawPoints[0];
                if (Math.hypot(cx - first.x, cy - first.y) > 0.5) {
                    rawPoints.push({ x: first.x, y: first.y });
                }
                cx = first.x; cy = first.y;
            }
        }
    }

    return rawPoints;
}

/**
 * Greedy nearest-neighbor stitching: merge disconnected sub-paths into
 * one continuous loop. Bridge segments use minimal sample points.
 */
export function stitchSubPaths(subPaths, samplesPerUnit) {
    // Sample each sub-path
    const sampled = subPaths
        .map(sp => sampleSubPath(sp, samplesPerUnit))
        .filter(pts => pts.length >= 2);

    if (sampled.length === 0) return [];
    if (sampled.length === 1) return sampled[0];

    // Greedy nearest-neighbor: start with the first sub-path
    const used = new Set();
    const result = [];

    // Start with sub-path 0
    used.add(0);
    result.push(...sampled[0]);

    while (used.size < sampled.length) {
        const tail = result[result.length - 1];
        let bestIdx = -1;
        let bestDist = Infinity;
        let bestReverse = false;

        for (let i = 0; i < sampled.length; i++) {
            if (used.has(i)) continue;
            const pts = sampled[i];
            const headDist = Math.hypot(pts[0].x - tail.x, pts[0].y - tail.y);
            const tailDist = Math.hypot(pts[pts.length - 1].x - tail.x, pts[pts.length - 1].y - tail.y);

            if (headDist < bestDist) {
                bestDist = headDist;
                bestIdx = i;
                bestReverse = false;
            }
            if (tailDist < bestDist) {
                bestDist = tailDist;
                bestIdx = i;
                bestReverse = true;
            }
        }

        used.add(bestIdx);
        const nextPts = bestReverse ? [...sampled[bestIdx]].reverse() : sampled[bestIdx];

        // Add bridge point (the start of next sub-path connects to current tail)
        result.push(...nextPts);
    }

    return result;
}

/**
 * Resample a polyline into N equidistant points.
 */
export function samplePath(points, N) {
    if (points.length < 2) return points;

    // Compute cumulative arc length
    const lengths = [0];
    for (let i = 1; i < points.length; i++) {
        const dx = points[i].x - points[i - 1].x;
        const dy = points[i].y - points[i - 1].y;
        lengths.push(lengths[i - 1] + Math.sqrt(dx * dx + dy * dy));
    }
    const totalLen = lengths[lengths.length - 1];
    if (totalLen === 0) return points.slice(0, N);

    const result = new Array(N);
    let seg = 0;

    for (let i = 0; i < N; i++) {
        const targetLen = (i / N) * totalLen;

        // Advance to the right segment
        while (seg < lengths.length - 2 && lengths[seg + 1] < targetLen) seg++;

        const segLen = lengths[seg + 1] - lengths[seg];
        const t = segLen > 0 ? (targetLen - lengths[seg]) / segLen : 0;

        result[i] = {
            x: points[seg].x + t * (points[seg + 1].x - points[seg].x),
            y: points[seg].y + t * (points[seg + 1].y - points[seg].y),
        };
    }

    return result;
}

/**
 * Warp linear text points onto a circular arc.
 * Maps x → angle around circle, y → radial offset from clockRadius.
 *
 * @param {Array<{x,y}>} points — linear text points
 * @param {number} clockRadius — base radius in world units
 * @param {number} yScale — scale factor for y (radial thickness)
 * @returns {Array<{x,y}>} — warped points in world space
 */
export function warpToCircle(points, clockRadius, yScale) {
    if (points.length === 0) return [];

    // Find bounding box
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    for (const p of points) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
    }
    const totalWidth = maxX - minX;
    const totalHeight = maxY - minY;
    if (totalWidth === 0) return points;

    yScale = yScale || (clockRadius * 0.15);

    const result = new Array(points.length);
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        // Map x to angle: full circle, going clockwise (negative direction)
        // Arabic reads right-to-left, so we reverse the direction
        const theta = -((p.x - minX) / totalWidth) * TWO_PI + Math.PI / 2;

        // Map y to radial offset: center the text on the clock radius
        const yNorm = totalHeight > 0 ? (p.y - (minY + maxY) / 2) / totalHeight : 0;
        const r = clockRadius + yNorm * yScale;

        result[i] = {
            x: Math.cos(theta) * r,
            y: Math.sin(theta) * r,
        };
    }

    return result;
}
