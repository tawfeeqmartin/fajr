# Public Launch Confidence Bar

Last refreshed: 2026-05-15

This page is the maintainer-facing answer to: "is fajr ready to share publicly,
and what still blocks a confident announcement?"

It is not a semver milestone. The package is already published as v1.9.3; this
bar is about public confidence, downstream integration, and release discipline.

## Current Verdict

fajr is ready for targeted tester sharing, including Morocco users who can
compare against their local Habous/Mawaqit city timetable. It is also ready for
a careful public-beta announcement that invites verification and caveat-aware
use.

It is not yet a "please adopt this everywhere without local review" stable
recommendation. That stronger claim needs a short post-announcement soak period
and no unresolved downstream regressions.

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
| Architecture framing | README now separates shipped Layer 1 / Layer 4 / settings surfaces from Layer 2/3/5 research tracks. | Met |
| Morocco evidence boundary | `docs/morocco-evidence.md` defines what can be claimed now and keeps #92/#103 as post-launch calibration tracks. | Met |
| Open-issue triage | Remaining issues have current status comments or roadmap scope; #114 was closed as superseded by #132. | Met |

## Public-Launch Blockers

There are no known blockers for a careful public-beta announcement.

| Blocker | Why it matters | Tracking |
|---|---|---|
| None | Remaining open issues are advisory, corpus-quality, roadmap, or credibility follow-up tracks. | SCOREBOARD open issue list |

## Non-Blockers

These should not delay a targeted tester release or the next patch, unless a
new critical regression appears.

| Item | Reason |
|---|---|
| Native ports | Swift/Kotlin/C#/Rust are useful distribution work, not a prerequisite for validating the JS library. |
| UMD/IIFE bundle | npm ESM and esm.sh already cover the validated public/tester path. A single-file bundle remains useful for standalone-script and JavaScriptCore consumers, but should ship as a package-shape PR with maintainer review, not as a launch-path surprise. |
| GitHub Packages dual-publish | npm remains the source of truth for the public JS package. |
| Research leads such as London, Egypt, and Diyanet Asr | They are known accuracy opportunities, not regressions in the current shipped contract. |
| Morocco multi-season fixture promotion | #92/#103 remain important calibration work, but the evidence boundary is now documented and the current public API matches the official uniform city/region timetable stance. |
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
| Public announcement | Targeted tester share plus docs coherence, architecture framing, distribution decision, and issue-triage complete. | Broad public-beta social post / README announcement. |
| Stable adoption recommendation | Public announcement plus at least one soak period and no unresolved downstream regressions. | Recommend other apps adopt by default. |

For now, fajr is in public announcement / public beta, not stable adoption
recommendation.

## Next Actions

1. Share v1.9.3 with Morocco testers using the criteria above and ask for
   city/date/prayer reports against local Habous or mosque tables.
2. Keep #46, #43, and #44 on the distribution roadmap without blocking the
   public-beta path.
3. Continue #92/#103 monthly Habous capture and curated fixture promotion, but
   do not tune Morocco again unless fresh evidence exceeds the documented
   envelope.
