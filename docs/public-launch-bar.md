# Public Launch Confidence Bar

Last refreshed: 2026-05-15

This page is the maintainer-facing answer to: "is fajr ready to share publicly,
and what still blocks a confident announcement?"

It is not a semver milestone. The package is already published as v1.9.3; this
bar is about public confidence, downstream integration, and release discipline.

## Current Verdict

fajr is ready for targeted tester sharing, including Morocco users who can
compare against their local Habous/Mawaqit city timetable. It is not yet ready
for a broad "please adopt this everywhere" announcement.

The reason is not a known critical calculation bug. The reason is that the
project still needs one more coherence pass: public docs, release framing,
distribution shape, and open tracking issues should tell the same story.

## Passing Signals

| Area | Current signal | Status |
|---|---|---:|
| Published package | `@tawfeeqmartin/fajr@1.9.3` published to npm and tagged on GitHub. | Met |
| Core tests | `npm test` reports 333/333 passing in the v1.9.3 scoreboard. | Met |
| Registry QA | Release preflight runs city-registry validation and generated-registry checks. | Met |
| Accuracy ratchet | Train WMAE remains 0.9757 min on 215 institutional/calc rows. | Met |
| Critical issues | SCOREBOARD reports 0 open critical issues. | Met |
| Morocco default | v1.9.3 follows the official uniform city/region timetable stance: country default elevation is `0`, `elevationSource` is `country-uniform-timetable`, and automatic observer-elevation correction is off unless explicit. | Met |
| Downstream app | agiftoftime PR #53 merged; app is bumped to fajr v1.9.3 and issue #52 is closed after downstream compatibility validation. | Met |

## Public-Launch Blockers

These are the items that should close before a broad social announcement.

| Blocker | Why it matters | Tracking |
|---|---|---|
| Documentation coherence pass | A new user should not see stale release numbers, outdated architecture claims, or contradictory calibration framing. Public-facing docs should be checked whenever v1.x ships a behavior/provenance release. | This page plus the next docs cleanup PR |
| Architecture framing | Layer 1 and Layer 4 are shipped. Layers 2, 3, and 5 are still design/research tracks. Public docs should not imply the whole 5-layer architecture is already shipped. | #101; README Architecture Status |
| Morocco fixture promotion decision | Morocco is strong enough for tester sharing, but the public accuracy claim should say exactly which Habous/Mawaqit evidence is train, holdout, monthly, or yearly. | #92, #103 |
| Distribution path | npm ESM and esm.sh are working. A UMD/IIFE bundle is still useful for standalone-script/native-webview consumers and should be either shipped or explicitly deferred. | #46 |
| Open-issue triage | Advisory issues can stay open, but each should have a current owner/next action or a clear deferral note. | SCOREBOARD open issue list |

## Non-Blockers

These should not delay a targeted tester release or the next patch, unless a
new critical regression appears.

| Item | Reason |
|---|---|
| Native ports | Swift/Kotlin/C#/Rust are useful distribution work, not a prerequisite for validating the JS library. |
| GitHub Packages dual-publish | npm remains the source of truth for the public JS package. |
| Research leads such as London, Egypt, and Diyanet Asr | They are known accuracy opportunities, not regressions in the current shipped contract. |
| Knowledgebase cleanup pages | Important for contributor sanity, but not a runtime risk unless they contradict shipped behavior. |
| Full global bbox audit | Geometry-backed QA is valuable; it becomes a blocker only when it finds a high-risk misroute affecting real users. |

## Morocco Sharing Criteria

Before replying publicly to a Morocco tester thread, verify the exact release
artifact and the exact scenario:

1. Use published `@tawfeeqmartin/fajr@1.9.3` or newer, not a local checkout.
2. Test the reported city, date, and prayer against Habous current-month data.
3. Confirm `location.country === 'Morocco'`.
4. Confirm `location.elevationSource === 'country-uniform-timetable'`.
5. Confirm `corrections.elevation === false` unless the caller explicitly
   passed elevation.
6. State clearly that fajr follows Morocco's official city/region timetable
   stance by default; if a user's mosque follows a different nearby city,
   the mapped city/region should be checked.

The right public ask is: "Can you compare this against your local Habous city
or mosque table and report the city/date/prayer if it differs?" That invites
local validation without overclaiming universal precision.

## Release Decision Rule

Use these states consistently:

| State | Meaning | Allowed action |
|---|---|---|
| Targeted tester share | No critical bugs; downstream app validated; known caveats disclosed. | Share with specific users who can compare local timetables. |
| Public announcement | Targeted tester share plus docs coherence, architecture framing, and distribution decision complete. | Broad social post / README announcement. |
| Stable adoption recommendation | Public announcement plus at least one soak period and no unresolved downstream regressions. | Recommend other apps adopt by default. |

For now, fajr is in targeted tester share.

## Next Actions

1. Run a docs coherence PR: README, CALIBRATION, `docs/data-sources.md`,
   `docs/positions.md`, and `examples/agiftoftime/INTEGRATION.md` should align
   with v1.9.3 and the current public-beta stance.
2. Resolve #101 by demoting unshipped architecture layers to v2/research
   language while keeping shipped Layer 1 and Layer 4 prominent.
3. Decide #46: ship UMD/IIFE now or explicitly defer it from the public launch.
4. Convert #92/#103 into either a promoted Morocco fixture tier or a documented
   post-launch calibration project with exact evidence boundaries.
