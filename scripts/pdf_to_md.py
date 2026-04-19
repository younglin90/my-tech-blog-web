#!/usr/bin/env python3
"""
scripts/pdf_to_md.py

source-docs/ 안의 PDF 파일을 텍스트로 추출해
source-docs/extracted/ 에 .md 로 저장하고
source-docs/index.yaml 을 자동 업데이트합니다.

extract_docs.py 와 동일한 방식 (id/path/day_hint/tags) 을 사용해
같은 인덱스에 PDF 항목을 추가합니다.

사용법:
    py scripts/pdf_to_md.py                  # 새 PDF만 처리
    py scripts/pdf_to_md.py --force          # 전체 재추출
    py scripts/pdf_to_md.py --dry-run        # 목록만 출력
    py scripts/pdf_to_md.py --max-pages 50   # 페이지 제한 (대용량 PDF 잘라서)
    py scripts/pdf_to_md.py --max-size 30    # MB 제한 (이상은 스킵)

의존성:
    pip install pdfplumber pyyaml
"""

import argparse
import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).parent.parent
SOURCE_DIR = ROOT / "source-docs"
EXTRACT_DIR = SOURCE_DIR / "extracted"
INDEX_FILE = SOURCE_DIR / "index.yaml"

SKIP_DIRS = {"extracted", "notes"}
SKIP_KEYWORDS = {"이력서", "영어공부", "정보처리기사", "전자계산기", "정처기"}

# extract_docs.py 와 동일
DAY_KEYWORDS = {
    "monday":    ["FVM", "FEM", "수치해석", "CFD기법", "유한체적", "유한요소", "SIMPLE", "압력속도"],
    "tuesday":   ["논문", "paper", "review", "PINN", "난류", "turbulence", "LBM", "볼츠만"],
    "wednesday": ["시각화", "visualization", "reynolds", "레이놀즈", "천이"],
    "thursday":  ["유체역학", "경계층", "이론", "나비에", "스토크스", "navier", "stokes", "기화", "충돌모델"],
    "friday":    ["알고리즘", "구현", "implementation", "TDMA", "python", "코드"],
    "saturday":  ["해석해", "검증", "쿠에트", "포아즈이유", "couette", "poiseuille", "classical"],
    "sunday":    ["현상", "와류", "카르만", "불안정", "cavitation", "공동", "충격파"],
}


def detect_day_hint(path: Path, text: str) -> str:
    combined = (path.stem + " " + path.parent.name + " " + text[:500]).lower()
    scores = {day: 0 for day in DAY_KEYWORDS}
    for day, keywords in DAY_KEYWORDS.items():
        for kw in keywords:
            if kw.lower() in combined:
                scores[day] += 1
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "any"


def slugify(text: str) -> str:
    text = re.sub(r"[^\w가-힣\s-]", "", text)
    text = re.sub(r"\s+", "-", text.strip())
    return text[:60].rstrip("-")


def extract_pdf(path: Path, max_pages: int | None) -> tuple[str, int]:
    """PDF → 텍스트. (text, page_count) 반환. 빈 페이지는 건너뜀."""
    import pdfplumber
    lines = []
    page_count = 0
    with pdfplumber.open(path) as pdf:
        total = len(pdf.pages)
        limit = min(total, max_pages) if max_pages else total
        for i, page in enumerate(pdf.pages[:limit], 1):
            try:
                t = page.extract_text() or ""
            except Exception as e:
                t = ""
                print(f"    ⚠️  page {i} 추출 오류: {e}")
            t = t.strip()
            if not t:
                continue
            lines.append(f"## 페이지 {i}")
            lines.append(t)
            lines.append("")
            page_count += 1
        if max_pages and total > limit:
            lines.append(f"\n> ⚠️  전체 {total} 페이지 중 {limit} 페이지만 추출됨 (--max-pages 제한)")
    return "\n".join(lines), page_count


def load_index() -> dict:
    if INDEX_FILE.exists():
        with open(INDEX_FILE, encoding="utf-8") as f:
            return yaml.safe_load(f) or {"documents": []}
    return {"documents": []}


def save_index(data: dict):
    header = (
        "# source-docs/index.yaml\n"
        "# 자동 포스트 생성에 사용할 소스 문서 목록\n"
        "# day_hint: monday | tuesday | wednesday | thursday | friday | saturday | sunday | any\n"
        "# last_used: 마지막 사용 날짜 (YYYY-MM-DD), 문서 순환에 사용\n\n"
    )
    footer = (
        "\n# 새 문서 추가 방법은 README/CLAUDE.md 참조\n"
    )
    body = yaml.dump(
        data, allow_unicode=True, default_flow_style=False,
        sort_keys=False, indent=2
    )
    with open(INDEX_FILE, "w", encoding="utf-8") as f:
        f.write(header + body + footer)


def should_skip(path: Path) -> bool:
    name = path.name
    if any(kw in name for kw in SKIP_KEYWORDS):
        return True
    if "_Conflict" in name or name.startswith("~$") or "복사본" in name:
        return True
    return False


def process_pdf(path: Path, existing_ids: set, dry_run: bool, force: bool,
                max_pages: int | None, max_size_mb: float | None) -> dict | None:
    if path.suffix.lower() != ".pdf":
        return None
    if should_skip(path):
        print(f"  ⏭️  건너뜀 (필터): {path.name}")
        return None

    size_mb = path.stat().st_size / (1024 * 1024)
    if max_size_mb and size_mb > max_size_mb:
        print(f"  ⏭️  건너뜀 ({size_mb:.0f}MB > {max_size_mb}MB): {path.name}")
        return None

    rel = path.relative_to(SOURCE_DIR)
    out_path = EXTRACT_DIR / rel.with_suffix(".md")
    doc_id = slugify(str(rel.with_suffix("")).replace("\\", "-").replace("/", "-").replace(" ", "-"))

    if doc_id in existing_ids and not force:
        return None

    print(f"  📄 추출 중: {rel} ({size_mb:.1f}MB)")

    if dry_run:
        return {"id": doc_id, "path": str(rel)}

    try:
        text, page_count = extract_pdf(path, max_pages)
    except Exception as e:
        print(f"  ❌ 오류: {e}")
        return None

    if not text or len(text.strip()) < 100:
        print(f"  ⚠️  내용 없음 또는 너무 짧음 (이미지 PDF?), 건너뜀")
        return None

    out_path.parent.mkdir(parents=True, exist_ok=True)
    title = path.stem
    md_content = (
        f"# {title}\n\n"
        f"> 원본: `{rel}` ({size_mb:.1f}MB, {page_count} 페이지 추출)\n\n"
        f"{text.strip()}\n"
    )
    out_path.write_text(md_content, encoding="utf-8")

    day_hint = detect_day_hint(path, text)
    tags = [path.parent.name.strip("[] ")] if path.parent != SOURCE_DIR else []
    tags = [t for t in tags if t and t not in {"공부", "notes", "extracted"}]

    return {
        "id": doc_id,
        "title": title,
        "path": f"extracted/{rel.with_suffix('.md')}".replace("\\", "/"),
        "type": "markdown",
        "day_hint": day_hint,
        "tags": tags or ["CFD"],
        "last_used": None,
    }


def main():
    parser = argparse.ArgumentParser(description="source-docs PDF → MD 추출기")
    parser.add_argument("--force", action="store_true", help="이미 추출된 PDF도 재추출")
    parser.add_argument("--dry-run", action="store_true", help="실제 저장 없이 목록만 출력")
    parser.add_argument("--max-pages", type=int, default=None,
                        help="PDF당 최대 페이지 수 (대용량 textbook 자르기용)")
    parser.add_argument("--max-size", type=float, default=None,
                        help="MB 단위 파일 크기 제한 (이상은 스킵)")
    args = parser.parse_args()

    EXTRACT_DIR.mkdir(exist_ok=True)

    index_data = load_index()
    existing_ids = {doc["id"] for doc in index_data.get("documents", [])}

    new_entries = []
    stats = {"ok": 0, "skipped": 0, "error": 0}

    print(f"\n🔍 source-docs/ PDF 스캔 중...\n")

    pdfs = []
    for path in sorted(SOURCE_DIR.rglob("*.pdf")):
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        pdfs.append(path)

    print(f"   대상: {len(pdfs)}개 PDF\n")

    for i, path in enumerate(pdfs, 1):
        print(f"[{i}/{len(pdfs)}]", end=" ")
        try:
            result = process_pdf(path, existing_ids, args.dry_run, args.force,
                                 args.max_pages, args.max_size)
        except KeyboardInterrupt:
            print("\n⏹️  중단됨")
            break
        if result:
            new_entries.append(result)
            stats["ok"] += 1
        else:
            stats["skipped"] += 1

    if not args.dry_run and new_entries:
        index_data["documents"].extend(new_entries)
        save_index(index_data)
        print(f"\n✅ index.yaml 업데이트 완료 (+{len(new_entries)}개 항목)")

    print(f"\n📊 결과: 성공 {stats['ok']}개  건너뜀 {stats['skipped']}개")


if __name__ == "__main__":
    main()
