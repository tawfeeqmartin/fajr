# RESEARCH-FEED.md

Async research ledger (Karpathy-style: many parallel agent branches, one shared feed).

## How we use this
- `main` is stable product.
- `staging` is integration lane.
- Agents explore in parallel branches: `research/<topic>/<agent>-<yyyymmdd-hhmm>`.
- Each run posts a short note here (or via `scripts/research-note.sh`).
- Promising lines get merged/cherry-picked into `staging` for validation.
- Only validated work graduates to `main`.

## Entry template
- Time (PT):
- Agent:
- Topic:
- Branch:
- Commits:
- Result: pass/fail/partial
- Why it matters (1-2 lines):
- Next action:

---
- Time (PT): 2026-03-08 12:41:30 PDT
- Agent: devon
- Topic: ios-launch-white-flash
- Branch: staging
- Commits: c0621e4
- Result: partial
- Why it matters (1-2 lines): Added iOS startup image matrix + strict splash boot lock; should reduce white flash and early cube reveal
- Next action: Manual iPhone validation (Safari + A2HS, cold/warm) and iterate

