#!/usr/bin/env bash
# fajr autoresearch runner
#
# Launches the autoresearch agent for one session.
# The agent reads the engine + wiki, proposes a correction,
# evaluates it, and commits only if WMAE decreases.
#
# Usage:
#   bash autoresearch/run.sh
#   bash autoresearch/run.sh --dry-run    (eval only, no commit)

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "=== fajr autoresearch ==="
echo "Repo: $REPO_ROOT"
echo "Date: $(date -u '+%Y-%m-%d %H:%M UTC')"
echo ""

# Baseline eval before any changes
echo "--- Baseline WMAE ---"
node eval/eval.js
echo ""

if [[ "${1:-}" == "--dry-run" ]]; then
  echo "Dry run complete. No changes made."
  exit 0
fi

# Launch the agent using Claude Code
# The agent prompt is in autoresearch/prompt.md
# The agent config is in autoresearch/config.js
echo "--- Launching autoresearch agent ---"
echo "See autoresearch/prompt.md for the agent's instructions."
echo ""
echo "To run the agent manually:"
echo "  claude --print \"\$(cat autoresearch/prompt.md)\""
echo ""
echo "Or use the Claude Code CLI with this repo open."
