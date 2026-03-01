#!/bin/bash
# BRETT-REVIEW.SH — Local LLM code reviewer using Ollama (Qwen 3.5 35B)
# Zero Claude tokens. Runs entirely on local RTX A6000 GPUs.
# Brett reviews code. Devon writes it. They complement each other.
# Usage: ./brett-review.sh [brief_file] [target_file_or_diff]
set -e

REPO="/home/tawfeeq/ramadan-clock-site"
CREW_DIR="$REPO/.crew"
BRIEF="${1:-$CREW_DIR/BRIEF.md}"
TARGET="${2:-}"
MODEL="qwen3.5:35b-a3b"

cd "$REPO"

# Get code to review — from target file, git diff, or both
if [ -n "$TARGET" ] && [ -f "$TARGET" ]; then
  CODE_TO_REVIEW=$(cat "$TARGET")
  SOURCE_LABEL="File: $TARGET"
else
  # Fall back to git diff
  CODE_TO_REVIEW=$(git diff HEAD~1 2>/dev/null || git diff 2>/dev/null || echo "No diff found")
  SOURCE_LABEL="Git diff HEAD~1"
fi

if [ -z "$CODE_TO_REVIEW" ] || [ "$CODE_TO_REVIEW" = "No diff found" ]; then
  echo "Nothing to review."
  echo "PASS — Nothing to review." > "$CREW_DIR/REVIEW.md"
  exit 0
fi

# Truncate if too long
CHAR_COUNT=${#CODE_TO_REVIEW}
if [ "$CHAR_COUNT" -gt 12000 ]; then
  CODE_TO_REVIEW="${CODE_TO_REVIEW:0:12000}"
  CODE_TO_REVIEW="${CODE_TO_REVIEW}\n\n[TRUNCATED — ${CHAR_COUNT} total chars, showing first 12000]"
fi

SPEC=$(cat "$BRIEF" 2>/dev/null || echo "No brief found")

PROMPT="You are Brett, a strict senior code reviewer and QA engineer.

Languages & expertise: JavaScript, TypeScript, Python, Bash, HTML, CSS, GLSL, SQL, JSON, YAML, Markdown, Three.js, WebGL, Node.js, React, bpy (Blender Python).

SPEC (what was requested):
${SPEC}

CODE TO REVIEW (${SOURCE_LABEL}):
${CODE_TO_REVIEW}

Review this code against the spec. Check for:
1. Does it fully implement every requirement in the brief?
2. Syntax errors, undefined variables, missing imports
3. Logic bugs — off-by-one, wrong conditionals, race conditions
4. Security issues — XSS, injection, exposed secrets
5. Performance issues — unnecessary re-renders, memory leaks, blocking calls
6. Style issues — inconsistent naming, dead code, missing error handling
7. For HTML/CSS: broken layout, missing responsive behaviour, accessibility
8. For GLSL/Three.js: shader precision, missing uniforms, WebGL state leaks
9. For Python/bpy: exception handling, resource cleanup, API misuse
10. For Bash: unquoted variables, missing set -e, broken pipes

Write your review as:
Line 1: PASS or FAIL
Then: bullet-point findings with file/line references where possible.
Be precise and harsh — a PASS means production-ready."

echo "⚙️ Brett reviewing (${MODEL})..."
echo "Brief: $BRIEF"
[ -n "$TARGET" ] && echo "Target: $TARGET"
echo ""

RESPONSE=$(curl -s http://localhost:11434/api/generate \
  -d "$(jq -n \
    --arg model "$MODEL" \
    --arg prompt "$PROMPT" \
    '{model: $model, prompt: $prompt, stream: false, options: {num_predict: 600, temperature: 0.2}}' \
  )" \
  --max-time 180 2>&1)

REVIEW=$(echo "$RESPONSE" | jq -r '.response // "ERROR: No response from model"')
DURATION=$(echo "$RESPONSE" | jq -r '(.total_duration // 0) / 1000000000 | . * 10 | floor / 10')
TOKENS=$(echo "$RESPONSE" | jq -r '.eval_count // 0')

echo "Brett's Review (${DURATION}s, ${TOKENS} tokens, local ${MODEL}):"
echo "═══════════════════════════════════════════"
echo "$REVIEW"
echo "═══════════════════════════════════════════"

# Write to REVIEW.md
cat > "$CREW_DIR/REVIEW.md" << EOF
${REVIEW}

---
_Reviewed by Brett (${MODEL} local) in ${DURATION}s, ${TOKENS} tokens_
_Source: ${SOURCE_LABEL}_
EOF

# Check pass/fail
if echo "$REVIEW" | head -1 | grep -qi "PASS"; then
  echo ""
  echo "✅ Brett says PASS"
  exit 0
else
  echo ""
  echo "❌ Brett says FAIL — fix Devon's code and re-run"
  exit 1
fi
