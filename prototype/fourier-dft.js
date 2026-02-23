// fourier-dft.js — Pure DFT math: compute coefficients and evaluate epicycles
// No Three.js dependency — pure {x,y} math

const TWO_PI = Math.PI * 2;

/**
 * Compute Discrete Fourier Transform on complex-valued points.
 * Input:  [{x, y}, ...] — N points treated as complex numbers (x + iy)
 * Output: [{freq, amp, phase, re, im}, ...] sorted by amplitude descending
 *
 * O(N^2) — fine as one-time init.
 */
export function computeDFT(points) {
    const N = points.length;
    const coefficients = new Array(N);

    for (let k = 0; k < N; k++) {
        let re = 0, im = 0;
        for (let n = 0; n < N; n++) {
            const angle = (TWO_PI * k * n) / N;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            re += points[n].x * cos + points[n].y * sin;
            im += points[n].y * cos - points[n].x * sin;
        }
        re /= N;
        im /= N;

        const amp = Math.sqrt(re * re + im * im);
        const phase = Math.atan2(im, re);
        // Map frequency: 0,1,2,...,N/2, -(N/2-1),...,-1
        const freq = k <= N / 2 ? k : k - N;

        coefficients[k] = { freq, amp, phase, re, im };
    }

    // Sort by amplitude descending — largest circles first
    coefficients.sort((a, b) => b.amp - a.amp);
    return coefficients;
}

/**
 * Evaluate the Fourier series at parameter t ∈ [0, TWO_PI].
 * Returns the final pen position {x, y}.
 *
 * @param {Array} coefficients — sorted by amplitude desc
 * @param {number} t — parameter (0 to TWO_PI for one full cycle)
 * @param {number} maxTerms — how many coefficients to use
 */
export function evaluateEpicycles(coefficients, t, maxTerms) {
    const n = Math.min(maxTerms, coefficients.length);
    let x = 0, y = 0;

    for (let i = 0; i < n; i++) {
        const c = coefficients[i];
        const angle = c.freq * t + c.phase;
        x += c.amp * Math.cos(angle);
        y += c.amp * Math.sin(angle);
    }

    return { x, y };
}

/**
 * Return the chain of epicycle circle centers for visualization.
 * Each entry: {cx, cy, radius, angle} — the center of circle i,
 * plus its radius and current angle.
 *
 * @param {Array} coefficients
 * @param {number} t
 * @param {number} maxTerms
 * @returns {Array<{cx, cy, radius, angle}>}
 */
export function getEpicycleChain(coefficients, t, maxTerms) {
    const n = Math.min(maxTerms, coefficients.length);
    const chain = new Array(n);
    let x = 0, y = 0;

    for (let i = 0; i < n; i++) {
        const c = coefficients[i];
        const angle = c.freq * t + c.phase;
        const prevX = x, prevY = y;
        x += c.amp * Math.cos(angle);
        y += c.amp * Math.sin(angle);
        chain[i] = { cx: prevX, cy: prevY, radius: c.amp, angle, tipX: x, tipY: y };
    }

    return chain;
}
