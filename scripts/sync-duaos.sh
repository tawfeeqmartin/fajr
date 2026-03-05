#!/bin/bash
# Syncs latest du'a data from muhibwqr/duaOS on GitHub
# Run weekly via cron: 0 3 * * 0 /home/tawfeeq/ramadan-clock-site/scripts/sync-duaos.sh >> /tmp/duaos-sync.log 2>&1

set -euo pipefail

REPO_DIR="/home/tawfeeq/ramadan-clock-site"
DUAS_JSON="$REPO_DIR/duas.json"
HADITHS_URL="https://raw.githubusercontent.com/muhibwqr/duaOS/main/scripts/hadiths.json"
QURAN_URL="https://raw.githubusercontent.com/muhibwqr/duaOS/main/scripts/quran-duas.json"
TMP_HADITHS="/tmp/duaos-hadiths.json"
TMP_QURAN="/tmp/duaos-quran.json"
TMP_MERGED="/tmp/duaos-merged.json"

echo "$(date '+%Y-%m-%d %H:%M:%S') — duaOS sync starting"

# 1. Fetch latest data
echo "  Fetching hadiths.json..."
if ! curl -fsSL "$HADITHS_URL" -o "$TMP_HADITHS"; then
  echo "  ERROR: Failed to fetch hadiths.json"
  exit 1
fi

echo "  Fetching quran-duas.json..."
if ! curl -fsSL "$QURAN_URL" -o "$TMP_QURAN"; then
  echo "  ERROR: Failed to fetch quran-duas.json"
  exit 1
fi

HADITH_COUNT=$(python3 -c "import json; print(len(json.load(open('$TMP_HADITHS'))))")
QURAN_COUNT=$(python3 -c "import json; print(len(json.load(open('$TMP_QURAN'))))")
echo "  Fetched: $HADITH_COUNT hadiths, $QURAN_COUNT quran duas"

# 2. Merge + transform to match duas.json schema
python3 -c "
import json, sys

hadiths = json.load(open('$TMP_HADITHS'))
quran = json.load(open('$TMP_QURAN'))

merged = []

# Hadiths already have the right schema: content, reference, edition, tags, context
for h in hadiths:
    entry = {
        'content': h.get('content', ''),
        'reference': h.get('reference', ''),
        'edition': h.get('edition', ''),
        'tags': h.get('tags', []),
        'context': h.get('context', '')
    }
    merged.append(entry)

# Quran duas need reference reformatted: '2:201' -> 'Surah 2:201' with surah name
for q in quran:
    ref_raw = q.get('reference', '')
    surah = q.get('surah', '')
    # Format reference as 'Surah Name Verse' e.g. 'Al-Baqarah 2:201'
    reference = (surah + ' ' + ref_raw) if surah else ref_raw

    entry = {
        'content': q.get('english', q.get('content', '')),
        'reference': reference,
        'tags': q.get('tags', []),
        'context': q.get('context', '')
    }
    # Preserve arabic, english, surah fields for quran duas
    if q.get('arabic'):
        entry['arabic'] = q['arabic']
    if q.get('english'):
        entry['english'] = q['english']
    if q.get('surah'):
        entry['surah'] = q['surah']

    merged.append(entry)

with open('$TMP_MERGED', 'w') as f:
    json.dump(merged, f, ensure_ascii=False, indent=0)

print(f'  Merged: {len(merged)} total duas')
"

if [ $? -ne 0 ]; then
  echo "  ERROR: Merge/transform failed"
  exit 1
fi

# 3. Compare with current duas.json
if diff -q "$TMP_MERGED" "$DUAS_JSON" >/dev/null 2>&1; then
  echo "  No changes detected — duas.json is up to date"
  echo "$(date '+%Y-%m-%d %H:%M:%S') — duaOS sync complete (no changes)"
  exit 0
fi

# 4. Changed — overwrite and commit
echo "  Changes detected — updating duas.json"
cp "$TMP_MERGED" "$DUAS_JSON"

cd "$REPO_DIR"
git add duas.json
git commit --no-verify -m "chore: sync duaOS data"

echo "$(date '+%Y-%m-%d %H:%M:%S') — duaOS sync complete (updated + committed)"
