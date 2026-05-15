# QA Process

Last refreshed: 2026-05-15

This page documents the maintainer-side checks that should run before a fajr
release is tagged or published. It complements the PR review layers in
`AGENTS.md` and the downstream app handoff guidance in
[`docs/downstream-apps.md`](downstream-apps.md).

## Release Preflight

Run this from the repository root before creating a release tag:

```bash
npm run preflight:release
```

The npm publish workflow also runs the same command before publishing a `v*`
tag to npm. A release should not ship if this command fails.

The preflight currently checks:

- `git diff --check HEAD --` for whitespace and conflict-marker style diff
  errors.
- `npm test` for the Vitest suite covering public API behavior, prayer-time
  contracts, city registry behavior, geometry source-map invariants, Hijri,
  hilal, qibla, and documentation-facing metadata.
- `npm run validate:registry` for the full deterministic city
  reverse-geolocation validator.
- `node scripts/build-city-registry.js --check` to prove the checked-in runtime
  city registry still matches its generator inputs.
- `npm pack --dry-run` to show the package shape npm would publish.

## What Preflight Does Not Replace

Accuracy changes still require the autoresearch ratchet:

```bash
node eval/eval.js
npm run compare
```

Any accepted accuracy change must also include an `autoresearch/logs/` entry
with before/after train and holdout WMAE, per-region deltas, signed-bias
deltas, verdict, and scholarly classification. The preflight command is a
release sanity gate; it is not an eval ratchet and should not be used as proof
that a calculation change is better.

Downstream app validation is also separate. Before bumping fajr inside
agiftoftime, the downstream agent should run its own app-level tests and UI
provenance checks as described in
[`docs/downstream-apps.md`](downstream-apps.md) and
[`examples/agiftoftime/INTEGRATION.md`](../examples/agiftoftime/INTEGRATION.md).

## Release Handoff

For every npm release that changes provenance, location routing, defaults,
Hijri output, hilal output, or return-shape semantics:

1. Run `npm run preflight:release`.
2. Tag and publish only after the preflight passes.
3. Open an agiftoftime issue with the package version, release link, exact
   coordinates or dates to test, expected metadata changes, and whether app
   code changes are expected.
4. Keep the fajr issue open until downstream compatibility validation has
   passed or the downstream agent has explicitly deferred it.

This makes release quality inspectable by maintainers, review agents, and the
reference downstream app.
