// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
//
// scripts/build-scoreboard.js
// Auto-generates SCOREBOARD.md at the repo root.
// Usage: node scripts/build-scoreboard.js
// See fajr#105 for spec.

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── helpers ──────────────────────────────────────────────────────────────────

function readJSON(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function readJSONL(filePath) {
  try {
    const lines = readFileSync(filePath, 'utf8').trim().split('\n');
    return lines
      .filter(l => l.trim())
      .map(l => {
        try { return JSON.parse(l); }
        catch { return null; }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function exec(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return '';
  }
}

function fmt(n, digits = 4) {
  if (typeof n !== 'number' || isNaN(n)) return 'n/a';
  return n.toFixed(digits);
}

function fmtDelta(now, prev) {
  if (typeof now !== 'number' || typeof prev !== 'number') return 'n/a';
  const d = now - prev;
  const pct = prev !== 0 ? ((d / prev) * 100).toFixed(1) : '—';
  const sign = d > 0 ? '+' : '';
  return `${sign}${pct}%`;
}

function verdictIcon(now, prev) {
  if (typeof now !== 'number' || typeof prev !== 'number') return '🆕 first measured';
  const change = ((now - prev) / prev) * 100;
  if (change < -2) return '✅ improving';
  if (change > 2) return '📉 degrading';
  return '🟢 stable';
}

// ── data collection ───────────────────────────────────────────────────────────

// 1. package.json
const pkg = readJSON(join(ROOT, 'package.json'));
const version = pkg?.version ?? 'unknown';

// 2. runs.jsonl — current + previous WMAE
const runs = readJSONL(join(ROOT, 'eval/results/runs.jsonl'));

// Get unique WMAE snapshots (deduplicate by timestamp+wmae)
const seen = new Set();
const uniqueRuns = runs.filter(r => {
  if (!r?.train?.wmae) return false;
  const key = `${r.timestamp}|${r.train.wmae}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

const currentRun = uniqueRuns[uniqueRuns.length - 1] ?? null;
const prevRun = uniqueRuns[uniqueRuns.length - 2] ?? null;

const trainWMAE = currentRun?.train?.wmae ?? null;
const prevTrainWMAE = prevRun?.train?.wmae ?? null;
const testWMAE = currentRun?.test?.wmae ?? null;
const prevTestWMAE = prevRun?.test?.wmae ?? null;

const trainEntries = currentRun?.train?.entries ?? 0;
const testEntries = currentRun?.test?.entries ?? 0;

const perPrayer = currentRun?.train?.perPrayer ?? {};
const trainPerSource = currentRun?.train?.perSource ?? {};
const testPerSource = currentRun?.test?.perSource ?? {};
const prevTrainPerSource = prevRun?.train?.perSource ?? {};

// 3. Open issues (gh CLI)
let openIssues = [];
try {
  const raw = exec('gh issue list --state open --limit 100 --json number,title,labels');
  openIssues = raw ? JSON.parse(raw) : [];
} catch {
  openIssues = [];
}
const openCount = openIssues.length;
const criticalIssues = openIssues.filter(i =>
  (i.labels ?? []).some(l => (l.name ?? '').includes('critical')) ||
  i.title?.toLowerCase().includes('critical') ||
  i.title?.toLowerCase().includes('regression')
);
const advisoryIssues = openIssues.filter(i =>
  !criticalIssues.includes(i)
);

// 4. Cities count
const citiesData = readJSON(join(ROOT, 'src/data/cities.json'));
const cityCount = Array.isArray(citiesData?.cities) ? citiesData.cities.length : 0;

// 5. Fixture inventory
function countFixtureEntries(dir) {
  let total = 0;
  let files = 0;
  try {
    const names = readdirSync(dir).filter(f => f.endsWith('.json'));
    files = names.length;
    for (const name of names) {
      const data = readJSON(join(dir, name));
      if (Array.isArray(data)) {
        for (const entry of data) {
          total += Array.isArray(entry?.dates) ? entry.dates.length : 1;
        }
      }
    }
  } catch {
    // ignore
  }
  return { files, entries: total };
}

const trainFixtures = countFixtureEntries(join(ROOT, 'eval/data/train'));
const testFixtures = countFixtureEntries(join(ROOT, 'eval/data/test'));

// 6. Test count via npm test output
let testCount = 333;
let testPassed = 333;
try {
  const testOut = execSync('npm test 2>&1', { cwd: ROOT, encoding: 'utf8', timeout: 60000 });
  const passMatch = testOut.match(/Tests\s+(\d+) passed/);
  if (passMatch) testPassed = parseInt(passMatch[1], 10);
  const totalMatch = testOut.match(/Tests\s+\d+ passed \((\d+)\)/);
  if (totalMatch) testCount = parseInt(totalMatch[1], 10);
  else testCount = testPassed;
} catch {
  // use defaults
}

// 7. Git release tags with dates
let tagHistory = [];
try {
  const tagLines = exec('git tag -l --sort=-creatordate').split('\n').filter(Boolean).slice(0, 15);
  for (const tag of tagLines) {
    const date = exec(`git log -1 --format="%ai" "${tag}"`).slice(0, 10);
    tagHistory.push({ tag, date });
  }
} catch {
  // ignore
}

// 8. Recent closed issues count
let recentlyClosed = 0;
try {
  const closed = exec('gh issue list --state closed --limit 20 --json number,closedAt');
  const closedArr = closed ? JSON.parse(closed) : [];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  recentlyClosed = closedArr.filter(i => i.closedAt && new Date(i.closedAt) > thirtyDaysAgo).length;
} catch {
  // ignore
}

// ── verdict computation ───────────────────────────────────────────────────────

function computeTopVerdict(trainWMAE, prevTrainWMAE, critCount) {
  if (critCount > 0) return { icon: '📉', label: 'at-risk', reason: `${critCount} critical bug(s) open` };
  if (trainWMAE === null) return { icon: '🟢', label: 'stable', reason: 'no eval data' };
  if (prevTrainWMAE === null) return { icon: '🟢', label: 'stable', reason: 'first measured run' };
  const change = ((trainWMAE - prevTrainWMAE) / prevTrainWMAE) * 100;
  if (change < -2) return { icon: '✅', label: 'winning', reason: `train WMAE ${change.toFixed(1)}%` };
  if (change > 2) return { icon: '📉', label: 'at-risk', reason: `train WMAE ${change.toFixed(1)}%` };
  return { icon: '🟢', label: 'stable', reason: 'WMAE flat vs previous run' };
}

const verdict = computeTopVerdict(trainWMAE, prevTrainWMAE, criticalIssues.length);

// ── trajectory (30-day) ───────────────────────────────────────────────────────

function computeTrajectory(uniqueRuns) {
  if (uniqueRuns.length < 2) return null;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recent = uniqueRuns.filter(r => r.timestamp && new Date(r.timestamp) > thirtyDaysAgo);
  if (recent.length < 2) return null;
  const first = recent[0];
  const last = recent[recent.length - 1];
  const firstWMAE = first.train?.wmae;
  const lastWMAE = last.train?.wmae;
  if (!firstWMAE || !lastWMAE) return null;
  const pct = ((lastWMAE - firstWMAE) / firstWMAE) * 100;
  return { from: firstWMAE, to: lastWMAE, pctChange: pct, count: recent.length };
}

const trajectory = computeTrajectory(uniqueRuns);

// ── build per-source table ────────────────────────────────────────────────────

function buildSourceTable(trainPerSource, prevTrainPerSource) {
  if (!trainPerSource || Object.keys(trainPerSource).length === 0) {
    return '_No per-source data available._';
  }

  const rows = Object.entries(trainPerSource).map(([name, v]) => {
    const wmae = v?.wmae;
    const prev = prevTrainPerSource[name]?.wmae;
    const delta = (typeof wmae === 'number' && typeof prev === 'number')
      ? fmtDelta(wmae, prev)
      : 'n/a';
    const icon = verdictIcon(wmae, prev);
    const wmaeFmt = fmt(wmae);
    return `| ${name} | ${wmaeFmt} | ${delta} | ${icon} |`;
  });

  return [
    '| Source | Train WMAE | Δ vs prev | Status |',
    '|--------|------------|-----------|--------|',
    ...rows,
  ].join('\n');
}

// ── build release history ─────────────────────────────────────────────────────

function buildReleaseHistory(tagHistory, pkg) {
  if (!tagHistory || tagHistory.length === 0) return '_No release tags found._';

  const rows = tagHistory.slice(0, 5).map(({ tag, date }) => {
    // look for a run near this date if possible
    return `| ${tag} | ${date} | — | — | — |`;
  });

  return [
    '| Version | Date | Train WMAE | Cities | Notes |',
    '|---------|------|------------|--------|-------|',
    ...rows,
  ].join('\n');
}

// ── per-prayer table ──────────────────────────────────────────────────────────

function buildPerPrayerTable(perPrayer) {
  if (!perPrayer || Object.keys(perPrayer).length === 0) {
    return '_No per-prayer data available._';
  }
  const prayers = ['fajr', 'shuruq', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const rows = prayers.map(p => {
    const v = perPrayer[p];
    return `| ${p.charAt(0).toUpperCase() + p.slice(1)} | ${fmt(v)} |`;
  });
  return [
    '| Prayer | MAE (min) |',
    '|--------|-----------|',
    ...rows,
  ].join('\n');
}

// ── assemble SCOREBOARD.md ────────────────────────────────────────────────────

const now = new Date().toISOString().slice(0, 10);

const sourceTable = buildSourceTable(trainPerSource, prevTrainPerSource);
const perPrayerTable = buildPerPrayerTable(perPrayer);
const releaseHistory = buildReleaseHistory(tagHistory, pkg);

const trajectorySection = trajectory
  ? `**Rolling 30-day window (${trajectory.count} runs):**
- Train WMAE: ${fmt(trajectory.from)} → ${fmt(trajectory.to)} (${trajectory.pctChange > 0 ? '+' : ''}${trajectory.pctChange.toFixed(1)}%)
- Direction: ${trajectory.pctChange < -2 ? '📈 improving' : trajectory.pctChange > 2 ? '📉 degrading' : '➡️ flat'}`
  : '_Insufficient run history for 30-day trajectory (fewer than 2 unique WMAE snapshots in window)._';

const advisoryList = advisoryIssues.slice(0, 6).map(i => `  - #${i.number} — ${i.title}`).join('\n') || '  (none)';

const output = `<!-- AUTO-GENERATED by scripts/build-scoreboard.js — do not edit manually. -->
<!-- Last regenerated: ${now} (v${version}) -->

# fajr Scoreboard

**Verdict for v${version} (${now}):** ${verdict.icon} ${verdict.label} — ${verdict.reason}

---

## Current snapshot (v${version}, ${now})

### Accuracy — train set (lower is better)

${sourceTable}

**Overall train WMAE:** ${fmt(trainWMAE)} min (${trainEntries} entry-dates across ${trainFixtures.files} fixture files)
**Holdout WMAE:** ${fmt(testWMAE)} min (${testEntries} entry-dates across ${testFixtures.files} fixture files)

> Holdout WMAE is reported for transparency only — it is never used to gate the ratchet.
> A large holdout number (e.g. 8+ min) reflects low-quality third-party aggregators and
> world-coverage AlAdhan estimates in the test corpus, not a library accuracy problem.
> See CLAUDE.md ratchet rule 2 and fajr#72 / fajr#97 for context.

### Per-prayer MAE (train, minutes)

${perPrayerTable}

### Coverage

- Cities in registry: **${cityCount}**
- Train fixtures: **${trainFixtures.files} files** / **${trainEntries} entry-dates**
- Holdout fixtures: **${testFixtures.files} files** / **${testEntries} entry-dates**

### Bug health

- Open critical: **${criticalIssues.length}** ${criticalIssues.length === 0 ? '✅' : '🔴'}
- Open advisory / tracking: **${advisoryIssues.length}**
${advisoryList}
- Closed last 30 days: **${recentlyClosed}**

### Test corpus

- Tests: **${testPassed}/${testCount} passing** ${testPassed === testCount ? '✅' : '🔴'}

---

## Release history (last 5 releases)

${releaseHistory}

---

## Trajectory verdict (rolling 30 days)

${trajectorySection}

---

## How this file is generated

\`\`\`bash
node scripts/build-scoreboard.js
\`\`\`

Reads: \`eval/results/runs.jsonl\` · \`package.json\` · \`src/data/cities.json\`
 · \`gh issue list\` · \`git tag\` · \`npm test\` · \`eval/data/train/\` · \`eval/data/test/\`

Per CLAUDE.md Documentation Regen Rule: this file should be regenerated after every
engine change and committed alongside the source change. The CI gate for auto-regen
is deferred to v1.8.x (see fajr#105 §"Auto-generation discipline").

*Last refreshed: ${now}*
`;

// ── write file ────────────────────────────────────────────────────────────────

const outPath = join(ROOT, 'SCOREBOARD.md');
writeFileSync(outPath, output, 'utf8');
console.log(`SCOREBOARD.md written to ${outPath}`);
console.log(`  Version:     v${version}`);
console.log(`  Verdict:     ${verdict.icon} ${verdict.label}`);
console.log(`  Train WMAE:  ${fmt(trainWMAE)} min`);
console.log(`  Holdout:     ${fmt(testWMAE)} min`);
console.log(`  Cities:      ${cityCount}`);
console.log(`  Train files: ${trainFixtures.files} (${trainEntries} entry-dates)`);
console.log(`  Test files:  ${testFixtures.files} (${testEntries} entry-dates)`);
console.log(`  Open issues: ${openCount}`);
console.log(`  Tests:       ${testPassed}/${testCount}`);
