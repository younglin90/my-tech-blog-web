#!/bin/bash
# source-docs/{topic}/*.pdf → source-docs/extracted/{topic}/*.md
# 폴더당 한 번씩 호출 → marker 모델 재사용 (훨씬 빠름)
set -uo pipefail

PDF_TO_MD="$HOME/.claude/skills/cfd-paper-search/pdf_to_md.py"
SRC="source-docs"
BACKEND="${1:-marker}"

echo "Backend: $BACKEND"
echo ""

total_topics=0
total_pdfs=0
for topic_dir in "$SRC"/*/; do
  topic=$(basename "$topic_dir")
  [ "$topic" = "extracted" ] && continue

  # 해당 topic의 PDFs
  shopt -s nullglob
  pdfs=("$topic_dir"*.pdf)
  shopt -u nullglob
  [ ${#pdfs[@]} -eq 0 ] && continue

  total_topics=$((total_topics+1))
  total_pdfs=$((total_pdfs+${#pdfs[@]}))

  echo "━━━ [$topic] ${#pdfs[@]}개 PDF ━━━"
  outdir="$SRC/extracted/$topic"
  mkdir -p "$outdir"

  python3.12 "$PDF_TO_MD" "${pdfs[@]}" \
    --outdir "$outdir" \
    --backend "$BACKEND" \
    --image-dir "$outdir/images" 2>&1 | grep -E "Backend|Converting|Done|ERROR"

  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "전체: $total_topics topic, $total_pdfs PDF"
