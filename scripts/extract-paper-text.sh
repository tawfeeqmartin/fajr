#!/usr/bin/env bash
# بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
# Bismillah ir-Rahman ir-Rahim
#
# Extract searchable text from a paper PDF, with OCR fallback for image-only
# scans and Arabic-font-mapping cases that pdftotext mangles.
#
# Usage:
#   scripts/extract-paper-text.sh <input.pdf> [<output.txt>]
#
# Strategy:
#   1. Try `pdftotext -enc UTF-8 -layout` first (fast, perfect when font
#      mappings are clean — e.g. English papers, well-prepared Arabic PDFs).
#   2. Score the output: count ASCII letter density per 100 chars. If below
#      a threshold (suggesting either an image-only PDF or font-mapping
#      corruption), fall back to OCR via `ocrmypdf` with both English and
#      Arabic language packs.
#   3. The OCR fallback writes a sidecar text file alongside the OCR'd PDF,
#      which is what we extract.
#
# Requires: poppler-utils (pdftotext), tesseract (with -lang tesseract-lang
# for ara), ocrmypdf. Install via Homebrew:
#   brew install poppler tesseract tesseract-lang ocrmypdf

set -euo pipefail

if [ $# -lt 1 ]; then
    echo "Usage: $0 <input.pdf> [<output.txt>]" >&2
    exit 1
fi

input="$1"
output="${2:-${input%.pdf}.txt}"

if [ ! -f "$input" ]; then
    echo "Input PDF not found: $input" >&2
    exit 1
fi

# Step 1 — attempt direct text extraction.
pdftotext -enc UTF-8 -layout "$input" "$output" 2>/dev/null || true

# Step 2 — score quality. We can't use overall ASCII density because most
# papers in this archive are mixed-language: clean English abstract + Arabic
# body. Density would be dragged down by the Arabic even when extraction
# is fine. Instead, count English-looking words (sequences of 4+ ASCII
# letters). Real papers always have some English in references / equations
# / DOIs. If that count is high, extraction is at least partially usable.
total=$(wc -c < "$output" | tr -d ' ')
english_words=$(grep -oE '[A-Za-z]{4,}' "$output" 2>/dev/null | wc -l | tr -d ' ')

echo "[extract-paper-text] direct extraction: ${total} chars, ${english_words} English-looking words"

# Threshold: 30 English words means the extraction yielded *something*
# usable — either pure English or mixed-language with English abstract /
# references / equations. Below 30 suggests image-only PDF or completely
# corrupted font mapping where even English doesn't come through.
if [ "$english_words" -ge 30 ] && [ "$total" -gt 100 ]; then
    echo "[extract-paper-text] direct extraction kept (above threshold)"
    exit 0
fi

echo "[extract-paper-text] direct extraction below threshold — running OCR fallback"

# Step 3 — OCR fallback. ocrmypdf adds a text layer to a copy of the PDF;
# we then pdftotext that layered copy. eng+ara handles mixed-language papers,
# which is the common case (English abstract + Arabic body).
tmp_pdf=$(mktemp -t ocr.XXXXXX).pdf
ocrmypdf --quiet --skip-text --language eng+ara "$input" "$tmp_pdf" 2>&1 \
    || { echo "[extract-paper-text] ocrmypdf failed" >&2; rm -f "$tmp_pdf"; exit 1; }

pdftotext -enc UTF-8 -layout "$tmp_pdf" "$output"
rm -f "$tmp_pdf"

total_ocr=$(wc -c < "$output" | tr -d ' ')
echo "[extract-paper-text] OCR extraction: ${total_ocr} chars"
