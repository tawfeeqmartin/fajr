// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * fajr autoresearch — ratchet configuration
 *
 * Controls the autoresearch loop behavior: acceptance thresholds,
 * regression guards, and iteration limits.
 */

export const config = {
  // Minimum WMAE improvement required to accept a change (minutes)
  // A change that reduces WMAE by less than this is too marginal to commit
  minImprovement: 0.01,

  // Per-prayer regression guard — if any single prayer gets this much worse
  // (in minutes), reject the change even if overall WMAE improves
  maxPrayerRegression: 1.0,

  // Prayers and their weights in WMAE calculation
  // Must match eval/eval.js — this is for agent reference only
  weights: {
    fajr:    1.5,  // highest: most affected by twilight angle debate
    shuruq:  1.0,
    dhuhr:   1.0,
    asr:     1.0,
    maghrib: 1.0,
    isha:    1.5,  // highest: symmetric with fajr
  },

  // Maximum number of autoresearch iterations per session
  maxIterations: 10,

  // How many wiki pages to read before proposing a change
  // (prevents shallow changes that ignore available knowledge)
  minWikiPagesRead: 2,

  // Scholarly classification required for auto-commit
  // 'green'  — 🟢 Established corrections can be auto-committed
  // 'yellow' — 🟡 Limited precedent changes require a note in the log
  // 'red'    — 🔴 Novel changes are logged but NOT committed without human review
  autoCommitClassification: 'yellow',

  // Log file directory (relative to repo root)
  logDir: 'autoresearch/logs',

  // Eval command
  evalCommand: 'node eval/eval.js',

  // Primary target file — all accuracy improvements go here
  primaryTarget: 'src/engine.js',

  // Secondary targets — may be modified if primary change requires it
  secondaryTargets: ['src/methods.js', 'src/elevation.js'],

  // Code review pipeline configuration
  review: {
    // Layer 1: run lint checks after every successful ratchet commit
    lintAfterEveryCommit: true,

    // Layer 2: run AI batch review after each full autoresearch run
    batchReviewAfterRun: true,

    // Layer 3: scholarly oversight levels that require human approval before merging
    // 'yellow' = 🟡 Limited precedent, 'red' = 🔴 Novel
    requireHumanApprovalFor: ['yellow', 'red'],

    // 🟢 Established corrections may be auto-merged without human review
    autoMergeGreen: true,
  },
}
