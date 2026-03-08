# Validation Procedure (Generalized)

Use this for **every UI/interaction change**, not just splash/countdown.

## 0) First principles (before coding)
- Define the invariant(s): what must always be true.
- Define failure signatures: what "broken" looks like.
- Define acceptance criteria in measurable terms.

## 1) Test levels (always run in this order)
1. **Static checks**
   - syntax/import/runtime errors
2. **Behavior checks**
   - scripted interaction sequence with assertions
3. **Transition checks**
   - multi-step state timeline (no regressions/jumps)
4. **Visual checks**
   - screenshot checkpoints for key states
5. **Edge checks**
   - resize/orientation/rerender/rebind/city-change/time-shift

## 2) Robust validation loop template
For each bug/fix:
1. Reproduce baseline bug in script
2. Add one assertion that fails before fix
3. Implement fix
4. Re-run same assertion until stable
5. Add regression assertion so it can’t come back

## 3) Invariants catalog (common classes)
- **Interaction invariant:** one user action => one state change
- **State invariant:** no illegal state transitions
- **Timeline invariant:** once advanced to phase N, cannot regress to N-1 unless explicitly designed
- **Mapping invariant:** overlay coordinates derive from one source of truth
- **Rerender invariant:** handlers survive DOM updates
- **Mode invariant:** mode-specific UI does not leak into other modes

## 4) Script design rules
- Use deterministic waits (check condition loops with timeout) over arbitrary sleeps when possible
- Emit structured logs for each step: `{step, state, assertion}`
- Fail fast with explicit assertion message
- Save screenshots at failure checkpoints
- Keep each test isolated and idempotent

## 5) Quality gate (required before shipping)
- GPU render pass
- No console errors from changed code paths
- Validation suite passes
- At least one regression test added for the new bug class

## 6) Post-fix compounding
- Add bug to `scripts/validation-cases.json`
- Add at least one reusable invariant/assertion helper
- Update this doc if a new failure pattern appears

## 7) Standard command set
- Full generalized suite:
  - `node scripts/validate-regression.mjs --all`
- Single case:
  - `node scripts/validate-regression.mjs --case <id>`
- Existing targeted suite:
  - `node scripts/validate-splash-countdown.mjs`
