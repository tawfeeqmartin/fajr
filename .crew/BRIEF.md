# BRIEF: Rewrite bob-watch.py — transcript-first architecture

## File to rewrite
`/home/openclaw-agent/.openclaw/workspace/tools/bob-watch.py`

## New architecture (replace everything after the imports/constants)

### Flow per segment:
1. Parse VTT → group into ~30s segments (keep existing parse_vtt + group_segments)
2. **Filter**: skip segments with no action keywords. Keywords: select, add, extrude, apply, shade, material, mesh, modifier, subdivide, scale, rotate, move, grab, loop, bevel, inset, mirror, solidify, render, camera, light, node, weight, armature, bone, parent, join, separate, origin, cursor, snap, unwrap, uv, texture, image, color, roughness, metallic, emission, principled
3. For each action segment:
   a. **Text → bpy**: send segment transcript text to Qwen 3.5 text model → generate bpy code
   b. **Execute** in Blender via MCP (existing blender_exec function)
   c. **ONE viewport screenshot** via get_viewport_screenshot
   d. **Vision verify**: send screenshot + transcript text to qwen2.5vl:7b — does viewport match what transcript described? Reply MATCH_OK or MISMATCH: <reason>
   e. If MISMATCH: one fix attempt (generate_fix_code → execute). No retries after that.
   f. Log skill, log replay, move on.
4. Every 10 successful actions → render milestone

### Key constants to keep:
- SKILLS_FILE, REPLAY_SCRIPT, MILESTONE_LOG, VIEWPORT_RENDER paths
- MODEL_TEXT = "qwen3.5:35b-a3b"
- MODEL_VISION = "qwen2.5vl:7b"
- Blender MCP on localhost:9877
- All existing helper functions: blender(), blender_exec(), ollama_text(), ollama_vision(), log_skill(), log_replay(), render_milestone(), ensure_blender(), download_video(), parse_vtt(), group_segments()

### What to REMOVE:
- extract_frames() — no more frame scanning
- vision_describe() — no more frame-by-frame vision input
- vision_relevance_check() — gone
- sample_frames() — gone
- cleanup_frames() — gone
- The entire frame-scanning loop in main()

### New functions to ADD:
```python
ACTION_KEYWORDS = ['select','add','extrude','apply','shade','material','mesh',
  'modifier','subdivide','scale','rotate','move','grab','loop','bevel','inset',
  'mirror','solidify','render','camera','light','node','weight','armature','bone',
  'parent','join','separate','origin','cursor','snap','unwrap','uv','texture',
  'image','color','roughness','metallic','emission','principled','object','edit']

def is_action_segment(text: str) -> bool:
    t = text.lower()
    return any(kw in t for kw in ACTION_KEYWORDS)

def vision_verify(viewport_path: str, caption_text: str) -> tuple[bool, str]:
    """Single post-execution vision check. Returns (ok, response)."""
    prompt = (
        f"Blender viewport screenshot. The tutorial just said: \"{caption_text}\"\n"
        "Does the viewport show the result of that action?\n"
        "Reply MATCH_OK if yes, or MISMATCH: <reason> if not."
    )
    resp = ollama_vision(prompt, [viewport_path])
    ok = resp.strip().upper().startswith("MATCH_OK")
    return ok, resp
```

### New main() loop:
```python
for i, seg in enumerate(action_segments):
    # a. generate code from transcript
    code = generate_bpy_code("", seg["text"], prev_code)
    if not code: continue
    
    # b. execute
    result = blender_exec(code)
    
    # c. screenshot
    vp = capture_viewport()
    
    # d. verify
    if vp:
        ok, resp = vision_verify(vp, seg["text"])
        if not ok:
            fix = generate_fix_code(resp, code)
            if fix: blender_exec(fix)
    
    # e. log
    log_skill(...); log_replay(code, seg["text"])
    successful_actions += 1
    prev_code = code
    if successful_actions % 10 == 0: render_milestone(seg["text"])
```

## Output
Output the COMPLETE rewritten bob-watch.py. Keep all imports and helper functions intact. Only replace the architecture as described.
