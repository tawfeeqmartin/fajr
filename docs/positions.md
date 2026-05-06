# fajr Position Registry

Last refreshed: 2026-05-06

This is the compact product-doctrine layer for fajr. It answers the question:
when a user gives coordinates, what prayer-time position does fajr apply, and
why?

The deeper evidence remains in [CALIBRATION.md](../CALIBRATION.md),
[docs/data-sources.md](data-sources.md), and `knowledge/wiki/`. This page is
the bridge from that evidence to a clear default that apps can explain.

## Decision Ladder

fajr resolves local defaults in this order:

| Layer | Question | Role in fajr |
|---|---|---|
| Fiqh definition | What is the prayer boundary? | Fixed rule. Astronomy serves this definition. |
| Astronomical model | How is that boundary converted into clock time? | Solar position, twilight angle, horizon geometry, timezone. |
| Local authority | What does the relevant ministry, council, or mosque network publish? | Strongest evidence for the default in that place. |
| Empirical validation | Does fajr match that authority across cities, seasons, and edge cases? | Controls confidence and future calibration work. |
| Product default | What should an app show without confusing the user? | Simple method plus provenance, caveats, and override path. |

The rule of thumb:

> fajr defaults to the strongest locally authoritative, empirically validated
> position available, while surfacing disagreements and allowing override.

## Confidence Grades

| Grade | Meaning | Typical evidence |
|---|---|---|
| A | Strong local position | Official/institutional source plus multi-city or seasonal validation. |
| B | Supported local position | Official method or trusted local source, but sparse seasonal validation. |
| C | Provisional position | Plausible method with limited local validation or unresolved source mapping. |
| D | Fallback | Broad regional convention or calc-vs-calc agreement only. |

Confidence is not a fiqh ranking. It is a product-data ranking: how confident
fajr can be that the returned clock time matches local published practice.

## Current Positions

| Region | Default fajr position | Confidence | Main authority / evidence | What apps should say |
|---|---|---:|---|---|
| Morocco | Canonical Morocco official-timetable calibration; single Morocco stance, no `MoroccoHabous` / `MoroccoMawaqit` aliases. | A | Ministry of Habous current-month tables, Habous live checks, Mawaqit Morocco yearly corpus, PR #96 / issue #103. | "Morocco official timetable calibration. Verify the mapped city if your local mosque follows a different Habous region." |
| Turkiye | Diyanet country default with Diyanet provenance; Asr-convention metadata may be Hanafi while the applied formula remains method-implied until source-specific 2x validation lands. | B | Diyanet train fixture is strong for three cities; verified ezanvakti IDs now cover every bundled Turkish registry city, but no yearly fixture is promoted yet. | "Diyanet-based default. Asr convention is surfaced separately from the applied formula." |
| Malaysia | JAKIM-aligned default with Path A calibration where validated. | B | JAKIM via waktusolat train fixtures; institutional elevation precedent supports horizon-dip correction. | "JAKIM-aligned default. Local zone overrides should win when known." |
| Singapore | MUIS / Singapore method. | A | MUIS annual data.gov.sg fixture has sub-minute agreement. | "MUIS Singapore official calendar alignment." |
| Indonesia | KEMENAG-aligned regional default. | B | KEMENAG provincial holdout is broad, but myQuran wrapper divergence and row-source quality remain tracked in #97. | "KEMENAG-aligned default; verify local kabupaten when precision matters." |
| Saudi Arabia | Umm al-Qura calculation method with fajr's elevation provenance exposed. | B | Umm al-Qura method is established; Saudi institutional practice publishes uniform city times, while elevation correction has separate scholarly/institutional precedent elsewhere. | "Umm al-Qura default. Use `elevation: 0` if you want uniform city timetable practice." |
| Pakistan / Afghanistan / Bangladesh / much of South Asia | Karachi method with Hanafi Asr-convention metadata. | B | Karachi method is established; current fixtures do not yet justify blanket calculation mutation to 2x Asr in every source. | "Karachi/South-Asia default; local Asr convention is surfaced and should be user-overridable." |
| India | Karachi country default, with city/community overrides where documented. | C | Local practice is heterogeneous; Kerala and Shia city overrides are clearer than a single country default. | "India is mixed. Confirm local mosque or choose override when available." |
| UK | MoonsightingCommittee / local city overrides where present. | C | London Mawaqit residual remains an open Path A candidate (#70). | "UK defaults are practical but locally variable; show method and allow override." |
| France | France/UOIF-style high-latitude accommodation where dispatched. | B | Mawaqit France yearly corpus improves support; regional practice is still mosque-specific. | "France default follows common local convention; confirm mosque if it differs." |
| UAE | UAE/Dubai method plus elevation disclosure for high-rise contexts. | B | IACAD/Burj Khalifa precedent supports floor/elevation distinction; full automated source ingestion remains future work. | "UAE default; high-rise elevation may matter for Shuruq and Maghrib." |
| Egypt | Egyptian method. | C | Formal method is established, but Cairo/Alexandria residuals remain open in #69 pending stronger local/institutional corpus. | "Egyptian method default; current validation gap is known." |
| Iran / Shia Iraqi city overrides | Tehran/Jafari-style method where city/community override is documented. | B | Tehran Institute method and Sistani-aligned Iraqi city overrides are documented; broader fixture depth still needs work. | "Local Shia institutional method where known; country defaults may not represent every community." |
| High latitudes | Established high-latitude adjustment rules plus validity warnings. | C | Fiqh necessity is clear, but local practice differs sharply by city/council. | "High-latitude rule applied; consult local mosque/council and show warnings." |
| Unknown / ocean / no country match | Fallback method. | D | No local authority resolved. | "Fallback calculation only; ask user to choose a method or confirm location." |

## Product Guidance

For end-user UI, do not expose every source row. Show:

- resolved city/country
- method/default name
- confidence grade when useful
- `location.asrConvention` and `applied.asrSchool` separately
- elevation stance and correction amount when non-zero
- `notes[]`, `validityWarnings[]`, and `disclaimer`
- a clear override path for method, Asr convention, and elevation

For contributor work, do not add a new position simply because a paper or API
exists. A stronger position needs at least one of:

- official timetable data
- multiple local mosque-published references
- seasonal validation against the source
- a documented institutional ruling or method specification
- a clear issue explaining unresolved disagreement

## Backing Docs

- [Known disagreements](known-disagreements.md)
- [CALIBRATION.md](../CALIBRATION.md)
- [Data sources](data-sources.md)
- [Elevation correction](../knowledge/wiki/corrections/elevation.md)
- [A Gift of Time integration guide](../examples/agiftoftime/INTEGRATION.md)
