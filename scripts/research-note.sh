#!/usr/bin/env bash
set -euo pipefail

# Append a standardized async-research note to RESEARCH-FEED.md
# Usage:
#   scripts/research-note.sh \
#     --agent devon \
#     --topic "ios-launch-flash" \
#     --branch "research/ios-launch/devon-20260308-1230" \
#     --commits "abc1234, def5678" \
#     --result pass \
#     --why "Startup matrix removed white launch gap on iOS" \
#     --next "Validate on iPhone 14 + 15"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FEED="$ROOT/RESEARCH-FEED.md"

agent=""; topic=""; branch=""; commits=""; result=""; why=""; next=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --agent) agent="${2:-}"; shift 2 ;;
    --topic) topic="${2:-}"; shift 2 ;;
    --branch) branch="${2:-}"; shift 2 ;;
    --commits) commits="${2:-}"; shift 2 ;;
    --result) result="${2:-}"; shift 2 ;;
    --why) why="${2:-}"; shift 2 ;;
    --next) next="${2:-}"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

for v in agent topic branch result why next; do
  if [[ -z "${!v}" ]]; then
    echo "Missing required --$v" >&2
    exit 1
  fi
done

pt_time="$(TZ=America/Los_Angeles date '+%Y-%m-%d %H:%M:%S %Z')"
{
  echo "- Time (PT): $pt_time"
  echo "- Agent: $agent"
  echo "- Topic: $topic"
  echo "- Branch: $branch"
  [[ -n "$commits" ]] && echo "- Commits: $commits" || echo "- Commits: (none)"
  echo "- Result: $result"
  echo "- Why it matters (1-2 lines): $why"
  echo "- Next action: $next"
  echo
} >> "$FEED"

echo "Appended note to $FEED"