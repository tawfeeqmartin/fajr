#!/bin/bash
# CREW-CYCLE.SH — Orchestrates build/verify/review cycle
# Usage: ./crew-cycle.sh [brief_file] [max_outer_cycles]
set -e

REPO="/home/tawfeeq/ramadan-clock-site"
CREW_DIR="$REPO/.crew"
WORKSPACE="/home/openclaw-agent/.openclaw/workspace"
MAX_OUTER="${2:-3}"
MAX_INNER=3
BRIEF="${1:-$CREW_DIR/BRIEF.md}"

cd "$REPO"
mkdir -p "$CREW_DIR"

# Ensure dev server is running
if ! curl -s http://localhost:7748/ > /dev/null 2>&1; then
  echo "Starting dev server..."
  python3 -m http.server 7748 --bind 0.0.0.0 &>/dev/null &
  sleep 1
fi

# Validate brief exists
if [ ! -f "$BRIEF" ]; then
  echo "❌ No brief found at $BRIEF"
  echo "Write .crew/BRIEF.md first, then run this."
  exit 1
fi

echo "═══════════════════════════════════════════"
echo "  CREW CYCLE — Seven Heavens Studio"
echo "═══════════════════════════════════════════"
echo "Brief: $BRIEF"
echo "Max outer cycles: $MAX_OUTER"
echo "Max inner retries: $MAX_INNER"
echo ""

# Create feature branch
BRANCH="crew/$(date +%Y%m%d-%H%M%S)"
git checkout -b "$BRANCH" 2>/dev/null || git checkout "$BRANCH"
echo "✓ Working branch: $BRANCH"

for OUTER in $(seq 1 "$MAX_OUTER"); do
  echo ""
  echo "═══════════════════════════════════════════"
  echo "  OUTER CYCLE $OUTER / $MAX_OUTER"
  echo "═══════════════════════════════════════════"
  
  CYCLE_START=$(date +%s)
  
  # ── PHASE 1: BUILD (Chris) ──
  echo ""
  echo "🎨 Phase 1: Chris (Builder)..."
  CHRIS_BRIEF="You are Chris, lookdev specialist for agiftoftime.app.
Repo: $REPO
Main file: glass-cube-clock.js (Three.js ES module)

YOUR BRIEF:
$(cat "$BRIEF")

$([ -f "$CREW_DIR/FINDINGS.md" ] && echo "PREVIOUS REVIEW FINDINGS:" && cat "$CREW_DIR/FINDINGS.md" || echo "")

RULES:
- Edit glass-cube-clock.js ONLY (never index.html)
- git commit after changes (use --no-verify)
- Write $CREW_DIR/FINDINGS.md with: what you changed, what to watch for, any concerns
- Do NOT push to remote
- Do NOT modify index.html"

  claude --print --dangerously-skip-permissions \
    --tools "Edit,Bash" --model opus \
    "$CHRIS_BRIEF" > "$CREW_DIR/chris-output-${OUTER}.log" 2>&1 &
  CHRIS_PID=$!
  
  # ── PHASE 1b: REVIEWER PREP (Brett, parallel) ──
  echo "⚙️  Phase 1b: Brett (Reviewer) learning codebase..."
  BRETT_PREP="You are Brett, pipeline reviewer for agiftoftime.app.
Repo: $REPO
Read .crew/BRIEF.md to understand what Chris is building.
Read glass-cube-clock.js to understand the current codebase.
Note: key areas to review — texture generation functions, stamp mesh setup, lighting rig, render loop.
Wait for Chris to finish (check if $CREW_DIR/FINDINGS.md has been updated in last 2 min).
Then proceed to review."

  # Wait for Chris to finish
  wait $CHRIS_PID
  CHRIS_EXIT=$?
  echo "✓ Chris finished (exit: $CHRIS_EXIT)"
  
  # ── PHASE 2: VERIFY (Brett) ──
  echo ""
  echo "⚙️  Phase 2: Brett (Verify + Review)..."
  
  # Run render
  echo "  🎬 Rendering..."
  RENDER_PATH="$WORKSPACE/references/crew-cycle${OUTER}.png"
  GALLIUM_DRIVER=d3d12 MESA_D3D12_DEFAULT_ADAPTER_NAME=NVIDIA LD_LIBRARY_PATH=/usr/lib/wsl/lib:$LD_LIBRARY_PATH \
  node -e "
  const puppeteer = require('puppeteer-core');
  (async () => {
    const b = await puppeteer.launch({
      executablePath: '/usr/bin/google-chrome-stable',
      args: ['--no-sandbox','--disable-gpu-sandbox','--use-gl=angle','--use-angle=gl-egl','--ozone-platform=headless','--ignore-gpu-blocklist','--disable-dev-shm-usage','--in-process-gpu','--enable-webgl'],
      headless: true
    });
    const p = await b.newPage();
    await p.setViewport({width:430, height:932, deviceScaleFactor:1});
    let errs = [];
    p.on('console', m => { if(m.type()==='error') errs.push(m.text()); });
    await p.goto('http://localhost:7748/', {waitUntil:'domcontentloaded'});
    await new Promise(r => setTimeout(r, 14000));
    await p.screenshot({path:'${RENDER_PATH}'});
    if(errs.length) { console.log('CONSOLE_ERRORS'); errs.forEach(e => console.log(e)); process.exit(1); }
    console.log('RENDER_OK');
    await b.close();
  })();
  " 2>&1
  RENDER_EXIT=$?
  
  if [ $RENDER_EXIT -ne 0 ]; then
    echo "  ❌ Render failed or console errors!"
    echo "FAIL — Console errors detected during render." > "$CREW_DIR/REVIEW.md"
    continue
  fi
  echo "  ✓ Render clean"
  
  # Brett reviews the diff
  BRETT_REVIEW="You are Brett, pipeline reviewer for agiftoftime.app.
Repo: $REPO

SPEC (what was requested):
$(cat "$BRIEF")

CHRIS'S NOTES:
$([ -f "$CREW_DIR/FINDINGS.md" ] && cat "$CREW_DIR/FINDINGS.md" || echo "None")

YOUR JOB:
1. Run: cd $REPO && git diff main..HEAD
2. Check every change against the spec
3. Check for common bugs:
   - PlaneGeometry with hard rectangular edges (need edge vignette/falloff)
   - Texture blur that won't survive 3x DPR on iPhone
   - Missing cache bust in index.html
   - Hardcoded values that should be configurable
   - Geometry edges visible at camera angle
4. Write $CREW_DIR/REVIEW.md:
   Line 1: PASS or FAIL
   Then: specific findings with file:line references
   Format: 'architecture/major file.js:42 — Description of issue'
Be harsh. Tawfeeq is picky about visual quality. If you see ANY hard edge that might show on 3x DPR iPhone, FAIL it."

  claude --print --dangerously-skip-permissions \
    --tools "Read,Edit,Bash" --model sonnet \
    "$BRETT_REVIEW" > "$CREW_DIR/brett-output-${OUTER}.log" 2>&1
  
  echo "✓ Brett finished review"
  
  # Check result
  if [ -f "$CREW_DIR/REVIEW.md" ]; then
    RESULT=$(head -1 "$CREW_DIR/REVIEW.md")
    echo ""
    echo "📋 Review result: $RESULT"
    cat "$CREW_DIR/REVIEW.md"
    echo ""
    
    if echo "$RESULT" | grep -qi "PASS"; then
      CYCLE_END=$(date +%s)
      ELAPSED=$((CYCLE_END - CYCLE_START))
      echo "✅ Cycle $OUTER PASSED in ${ELAPSED}s"
      echo ""
      echo "📸 Render: $RENDER_PATH"
      echo "🔍 Chef: Review render, then show Tawfeeq."
      echo "🚀 To ship: git checkout main && git merge $BRANCH && bash ship.sh 'description'"
      
      # Log to cycle-log
      echo "$(date -Iseconds) | Cycle $OUTER | PASS | ${ELAPSED}s" >> "$CREW_DIR/cycle-log.md"
      exit 0
    else
      echo "🔄 Cycle $OUTER FAILED — findings will feed into next cycle"
      # Copy review findings for next cycle's builder
      cp "$CREW_DIR/REVIEW.md" "$CREW_DIR/FINDINGS.md"
      echo "$(date -Iseconds) | Cycle $OUTER | FAIL | $(head -3 "$CREW_DIR/REVIEW.md" | tail -2)" >> "$CREW_DIR/cycle-log.md"
    fi
  else
    echo "⚠️  Brett didn't write REVIEW.md — treating as FAIL"
    echo "$(date -Iseconds) | Cycle $OUTER | FAIL | No review produced" >> "$CREW_DIR/cycle-log.md"
  fi
done

echo ""
echo "❌ Max cycles ($MAX_OUTER) reached without PASS"
echo "Escalate to Tawfeeq with cycle-log.md"
