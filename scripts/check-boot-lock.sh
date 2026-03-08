#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "[check-boot-lock] verify boot lock is released only by splash completion"

matches=$(grep -RIn "classList.remove('booting')\|classList.remove(\"booting\")" index.html glass-cube-clock.js || true)
count=$(printf "%s\n" "$matches" | sed '/^$/d' | wc -l)

if [[ "$count" -ne 1 ]]; then
  echo "FAIL: expected exactly one boot-lock removal; found $count"
  printf "%s\n" "$matches"
  exit 1
fi

echo "$matches"

if grep -n "setTimeout" glass-cube-clock.js | grep -qi "booting"; then
  echo "FAIL: timer-based boot-lock release still present in renderer"
  exit 1
fi

echo "PASS: no timer-based boot-lock release in renderer"

startup_count=$(grep -c "apple-touch-startup-image" index.html)
if [[ "$startup_count" -lt 12 ]]; then
  echo "FAIL: expected iOS startup image matrix, found only $startup_count links"
  exit 1
fi

echo "PASS: iOS startup image links present ($startup_count)"
