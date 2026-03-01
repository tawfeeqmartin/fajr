#!/bin/bash
# PRE-PUSH VALIDATION — runs before every git push
# Catches: stale cache busters, version mismatches, untested changes
set -e

REPO="/home/tawfeeq/ramadan-clock-site"
cd "$REPO"

# 1. Extract version from index.html cache bust
HTML_VER=$(grep -oP "glass-cube-clock\.js\?v=\K\d+" index.html)
echo "✓ index.html cache bust: v${HTML_VER}"

# 2. Check if glass-cube-clock.js has uncommitted changes
if git diff --name-only | grep -q "glass-cube-clock.js"; then
  echo "⚠️  WARNING: glass-cube-clock.js has uncommitted changes!"
  exit 1
fi

# 3. Check if last commit touched glass-cube-clock.js but index.html version wasn't bumped
LAST_JS_COMMIT=$(git log -1 --format="%H" -- glass-cube-clock.js)
LAST_HTML_COMMIT=$(git log -1 --format="%H" -- index.html)
if [ "$LAST_JS_COMMIT" != "$LAST_HTML_COMMIT" ]; then
  # JS changed more recently than HTML — might need cache bump
  JS_DATE=$(git log -1 --format="%ct" -- glass-cube-clock.js)
  HTML_DATE=$(git log -1 --format="%ct" -- index.html)
  if [ "$JS_DATE" -gt "$HTML_DATE" ]; then
    echo "⚠️  WARNING: glass-cube-clock.js was modified AFTER index.html"
    echo "   Cache bust might be stale! Current: v${HTML_VER}"
    echo "   Bump the version in index.html before pushing."
    exit 1
  fi
fi

# 4. Check for recent test render (within last 10 minutes)
RECENT_RENDER=$(find /tmp /home/openclaw-agent/.openclaw/workspace/references -name "*.png" -mmin -10 2>/dev/null | head -1)
if [ -z "$RECENT_RENDER" ]; then
  echo "⚠️  WARNING: No test render found in last 10 minutes!"
  echo "   Run ./test-render.sh or GPU Chrome before pushing."
fi

echo ""
echo "✅ Pre-push checks passed (v${HTML_VER})"
