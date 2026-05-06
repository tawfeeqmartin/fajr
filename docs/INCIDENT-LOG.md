<!-- INCIDENT-LOG.md — hand-maintained log of bugs, over-corrections, and rollbacks -->
<!-- Append new entries at the top (newest first). -->
<!-- Format: date | severity | triggered-by | root-cause | resolution | prevention -->

# fajr Incident Log

Post-mortems for every bug, over-correction, or rollback that touched fajr — whether
discovered internally, by autoresearch agents, or by downstream consumers (agot, etc.).

The goal: pattern-match recurring failure classes so the same root cause doesn't surface
three times before a systemic fix lands.

*Last refreshed: 2026-05-05*

---

## 2026-05-05 — Morocco Ramadan DST false alarm (closed fajr#104)

**Severity:** advisory (investigation cost; no user impact)
**Triggered by:** fajr-claude investigating whether Morocco's Ramadan DST reversal
(clocks go back 1 hour during Ramadan) was silently corrupting the Rabat Wayback
fixture timestamps.
**Root cause:** The Rabat Wayback fixture was a snapshot taken during Ramadan when
Morocco had reverted to UTC+0. Node's `Intl` / timezone handling correctly models
`Africa/Casablanca` across the Ramadan DST boundary — the fixture captured real-world
UTC+0 times, not a corruption. The confusion arose from comparing the snapshot against
a post-Ramadan calculator output that assumed UTC+1 year-round.
**Resolution:** fajr#104 closed; investigation showed Node tz handles the Morocco
Ramadan DST reversal correctly. Rabat fixture is a valid UTC+0 Ramadan snapshot.
**Prevention:** When a DST-boundary discrepancy is suspected, always check which
UTC offset was active at the fixture's capture date, not just the country's "normal"
offset. Add a `timezone_offset_at_capture` field to future fixture metadata for
DST-ambiguous jurisdictions (Morocco, Iran).

---

## 2026-05-05 — Layer 4 12° polarity bug (caught in smoke test; deferred to v1.8.1)

**Severity:** advisory (caught before merge; no user impact)
**Triggered by:** smoke test of a design doc describing a FAJR_BEFORE_DAWN_12DEG
correction constant.
**Root cause:** The design doc had inverted polarity for the correction: negative
values were described as "earlier" but the engine's sign convention treats negative
offsets as later (calc − ground truth > 0 means calc is early). The inversion would
have caused the correction to widen Fajr error rather than narrow it.
**Resolution:** Caught during the smoke-test phase before any PR was opened.
Deferred to v1.8.1; design doc updated with the correct sign convention diagram.
**Prevention:** Every new correction constant should carry an explicit sign-convention
comment: `// positive = calc is later than ground truth; negative = calc is earlier`.
The eval's `perPrayerSigned` output already shows this — reference it in the design
doc when writing correction constants.

---

## 2026-05-05 — Türkiye yearly fetcher city-ID mismatch (fajr#102)

**Severity:** medium (wrong fixture data would corrupt the Diyanet calibration
anchor; caught before fixtures were promoted to train)
**Triggered by:** a haiku-model agent running `scripts/fetch-diyanet.js` with
city-ID mapping from a spot-check of Istanbul only. 8 of 12 cities had wrong
Diyanet city IDs — the API returns city-scoped data via integer IDs, not name
strings, and the haiku agent inferred IDs from a partial Istanbul query without
verifying the other 11 cities.
**Root cause:** Single-city spot-check is insufficient when IDs are opaque integers
assigned by a third-party API. Istanbul's ID happened to be 1 (easy to guess); others
were non-sequential.
**Resolution:** fajr#102 opened; fetcher rewritten with ID-discovery pass first
(enumerate all cities, build name→ID map, then fetch). Fixtures held in test-only
staging until the mapping is verified.
**Prevention:** Any fetcher that uses opaque numeric IDs from a third-party API
must include a name→ID mapping discovery step with ≥3-city spot-check validation
(compare fetched data against an independent source for at least 3 cities before
promoting to train fixtures). See `autoresearch/logs/` fetch-validation protocol.

---

## 2026-05-05 — Habous row-mapping false alarm (over-correction loop, fajr#100)

**Severity:** advisory (~6 hours of agent confusion + 2 issue reverts; no user impact)
**Triggered by:** agot-claude scraping `habous.gov.ma` monthly prayer table without
row-to-date verification. The scraper picked row 2 of the monthly table, assuming
row 2 = day 2 of the current month. Row 2 was actually 14 days earlier in the
Hijri-to-Gregorian mapping used by Habous' PHP layout.
**Root cause:** Habous publishes prayer times keyed to Hijri date, displayed in a
Gregorian-month table. Row N does not reliably equal Gregorian day N because the
Hijri month may start mid-Gregorian-month. The scraper assumed a 1:1 row-to-day
mapping without verifying.
**Resolution:** fajr#100 closed; `feedback_verify_published_reference.md` added to
agot's memory; fajr-verify routine spec updated to require explicit Hijri+Gregorian
row matching. Soft-fail triggered if Hijri date in row doesn't match expected date.
**Prevention:** Scrapers targeting Hijri-keyed tables must extract the date column
and verify it matches the target Gregorian date before accepting the row's prayer
times. A Hijri↔Gregorian mismatch by even one day = wrong times for the whole month.

---

## 2026-05-03 — v1.7.6 browser-load regression (fajr#55, fixed in v1.7.7)

**Severity:** critical (fajr completely unusable in browsers via esm.sh / CDN
imports; affected all browser-based consumers from v1.7.5 tag until v1.7.7 patch)
**Triggered by:** `src/hijri-umm-al-qura.js` using `createRequire()` to load the
UAQ tabular JSON, a Node-only API with no browser equivalent.
**Root cause:** The UAQ module was authored assuming a Node.js runtime. When the
ESM bundle was loaded in a browser (via esm.sh or direct `<script type="module">`),
the `createRequire` call threw at parse time, preventing any fajr function from loading.
**Resolution:** Switched to `import attributes` JSON syntax
(`import data from './data.json' with { type: 'json' }`) in v1.7.7; this is natively
supported in modern browsers and Node 22+.
**Prevention:** Browser-load smoke test added to release CI checklist (#49 QA roster).
Before any release tag: run `node scripts/validate-browser-compat.js` (or equivalent
esm.sh fetch + eval) to confirm the bundle loads in a simulated browser context.
Every new module that loads JSON must use `import attributes`, not `createRequire`.
