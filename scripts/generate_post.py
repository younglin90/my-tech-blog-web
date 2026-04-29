#!/usr/bin/env python3
"""
Daily blog post generator for my-tech-blog-web.
Reads source documents, calls Claude API, writes MDX to src/content/posts/.
"""

import os
import sys
import re
import subprocess
import tempfile
from datetime import date, datetime
from pathlib import Path
import yaml
import anthropic

try:
    from slugify import slugify
except ModuleNotFoundError:
    def slugify(value: str, max_length: int = 60) -> str:
        """Small dependency-free fallback for smoke tests and minimal CI images."""
        value = re.sub(r"[^a-zA-Z0-9]+", "-", value.lower()).strip("-")
        return (value[:max_length].strip("-") or "post")

REPO_ROOT = Path(__file__).parent.parent
SOURCE_DOCS = REPO_ROOT / "source-docs"
SOURCE_PAPERS = REPO_ROOT / "source-papers"
PROMPTS_DIR = Path(__file__).parent / "prompts"
POSTS_DIR = REPO_ROOT / "src" / "content" / "posts"
INDEX_YAML = SOURCE_DOCS / "index.yaml"

# Maps weekday (Monday=0) to prompt file stem and source type
DAY_CONFIG = {
    0: {"prompt": "cfd_technique", "day_hint": "cfd-technique"},
    1: {"prompt": "fluid_mechanics", "day_hint": "fluid-mechanics"},
    2: {"prompt": "cfd_technique", "day_hint": "cfd-technique"},
    3: {"prompt": "fluid_mechanics", "day_hint": "fluid-mechanics"},
    4: {"prompt": "cfd_technique", "day_hint": "cfd-technique"},
    5: {"prompt": "paper_review", "day_hint": "paper-review"},
    6: {"prompt": "paper_review", "day_hint": "paper-review"},
}

REQUIRED_FRONTMATTER = {"title", "date", "description", "draft"}


def get_weekday(override: str | None = None) -> int:
    """Return weekday index (0=Monday). Supports day name override."""
    if override:
        names = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        normalized = override.lower().strip()
        if normalized not in names:
            raise ValueError(f"Invalid day override: {override}. Must be one of {names}")
        return names.index(normalized)
    return datetime.now().weekday()


def load_index() -> list[dict]:
    """Load and return document index from index.yaml."""
    with open(INDEX_YAML, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return data.get("documents", [])


def select_document(docs: list[dict], day_hint: str) -> dict | None:
    """
    Select the best source document for the given day.
    Priority: day-specific hint > 'any' > least-recently-used.
    """
    candidates = [d for d in docs if d.get("day_hint") == day_hint]
    if not candidates:
        candidates = [d for d in docs if d.get("day_hint") == "any"]
    if not candidates:
        return None

    # Sort by last_used (None = never used = highest priority)
    def sort_key(d):
        last = d.get("last_used")
        if last is None:
            return date.min  # Never used — prefer first
        if isinstance(last, str):
            return datetime.strptime(last, "%Y-%m-%d").date()
        return last

    candidates.sort(key=sort_key)
    return candidates[0]


def read_markdown(path: Path) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def read_pdf(path: Path) -> str:
    """Extract text from PDF using pdfplumber."""
    import pdfplumber
    text_parts = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                text_parts.append(text)
    return "\n\n".join(text_parts)


def read_docx(path: Path) -> str:
    """Extract text from .docx using python-docx."""
    from docx import Document
    doc = Document(path)
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    return "\n\n".join(paragraphs)


def read_hwp_via_libreoffice(path: Path) -> str:
    """
    Convert HWP to text via LibreOffice.
    Raises RuntimeError if conversion fails.
    """
    with tempfile.TemporaryDirectory() as tmpdir:
        result = subprocess.run(
            ["libreoffice", "--headless", "--convert-to", "txt:Text", "--outdir", tmpdir, str(path)],
            capture_output=True,
            text=True,
            timeout=120,
        )
        if result.returncode != 0:
            raise RuntimeError(f"LibreOffice conversion failed: {result.stderr}")
        txt_files = list(Path(tmpdir).glob("*.txt"))
        if not txt_files:
            raise RuntimeError("LibreOffice produced no output file")
        return txt_files[0].read_text(encoding="utf-8", errors="replace")


def extract_content(doc: dict, day_hint: str) -> str:
    """
    Extract text content from a source document.
    For tuesday, also checks source-papers/ directory.
    Falls back to next available doc on parse failure.
    """
    # Tuesday: papers in separate repo
    if day_hint == "tuesday":
        paper_path = SOURCE_PAPERS / doc.get("path", "")
        if paper_path.exists() and paper_path.suffix == ".pdf":
            return read_pdf(paper_path)

    source_path = SOURCE_DOCS / doc.get("path", "")
    if not source_path.exists():
        raise FileNotFoundError(f"Source file not found: {source_path}")

    suffix = source_path.suffix.lower()
    if suffix == ".pdf":
        return read_pdf(source_path)
    elif suffix == ".docx":
        return read_docx(source_path)
    elif suffix in (".hwp", ".hwpx"):
        try:
            return read_hwp_via_libreoffice(source_path)
        except RuntimeError as e:
            print(f"[WARN] HWP parse failed: {e}", file=sys.stderr)
            raise
    elif suffix in (".md", ".txt"):
        return read_markdown(source_path)
    else:
        raise ValueError(f"Unsupported file type: {suffix}")


def load_prompt(day_index: int) -> str:
    prompt_name = DAY_CONFIG[day_index]["prompt"]
    prompt_path = PROMPTS_DIR / f"{prompt_name}.txt"
    return prompt_path.read_text(encoding="utf-8")


def call_claude(prompt_template: str, source_content: str, today: str) -> str:
    """Call Claude API with retry logic (max 2 attempts)."""
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    user_message = prompt_template.replace("{SOURCE_CONTENT}", source_content).replace("{DATE}", today)

    for attempt in range(1, 3):
        try:
            message = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=4096,
                messages=[{"role": "user", "content": user_message}],
            )
            return message.content[0].text
        except Exception as e:
            print(f"[WARN] Claude API attempt {attempt} failed: {e}", file=sys.stderr)
            if attempt == 2:
                raise
    return ""


def validate_frontmatter(mdx_content: str) -> dict:
    """
    Parse and validate MDX frontmatter.
    Raises ValueError if required fields are missing.
    """
    match = re.match(r"^---\n(.*?)\n---", mdx_content, re.DOTALL)
    if not match:
        raise ValueError("No frontmatter found in generated MDX")

    fm = yaml.safe_load(match.group(1))
    missing = REQUIRED_FRONTMATTER - set(fm.keys())
    if missing:
        raise ValueError(f"Frontmatter missing required fields: {missing}")

    return fm


def write_mdx(content: str, today_str: str) -> Path:
    """Write generated MDX to posts directory."""
    fm = validate_frontmatter(content)
    title_slug = slugify(fm["title"], max_length=60)
    filename = f"{today_str}-{title_slug}.mdx"
    out_path = POSTS_DIR / filename
    out_path.write_text(content, encoding="utf-8")
    return out_path


def update_last_used(doc: dict, today_str: str) -> None:
    """Update last_used date in index.yaml for the used document."""
    with open(INDEX_YAML, "r", encoding="utf-8") as f:
        raw = yaml.safe_load(f)

    for d in raw.get("documents", []):
        if d.get("id") == doc["id"]:
            d["last_used"] = today_str
            break

    with open(INDEX_YAML, "w", encoding="utf-8") as f:
        yaml.dump(raw, f, allow_unicode=True, sort_keys=False)


def export_github_env(title: str, post_date: str) -> None:
    """Write POST_TITLE and POST_DATE to GITHUB_ENV for downstream steps."""
    github_env = os.environ.get("GITHUB_ENV")
    if github_env:
        with open(github_env, "a", encoding="utf-8") as f:
            f.write(f"POST_TITLE={title}\n")
            f.write(f"POST_DATE={post_date}\n")


def main():
    day_override = os.environ.get("DAY_OVERRIDE") or (sys.argv[1] if len(sys.argv) > 1 else None)
    today = date.today()
    today_str = today.strftime("%Y-%m-%d")

    weekday = get_weekday(day_override)
    if weekday not in DAY_CONFIG:
        print(f"[INFO] Today is weekend (weekday={weekday}). Skipping.", file=sys.stderr)
        sys.exit(0)

    day_hint = DAY_CONFIG[weekday]["day_hint"]
    print(f"[INFO] Generating post for {day_hint} ({today_str})")

    docs = load_index()
    doc = select_document(docs, day_hint)
    if doc is None:
        print(f"[ERROR] No source document found for day_hint={day_hint}", file=sys.stderr)
        sys.exit(1)

    print(f"[INFO] Using document: {doc['id']} ({doc.get('path')})")

    try:
        source_content = extract_content(doc, day_hint)
    except Exception as e:
        print(f"[ERROR] Failed to extract content: {e}", file=sys.stderr)
        sys.exit(1)

    prompt = load_prompt(weekday)
    print("[INFO] Calling Claude API...")

    try:
        mdx_content = call_claude(prompt, source_content, today_str)
    except Exception as e:
        print(f"[ERROR] Claude API failed after retries: {e}", file=sys.stderr)
        sys.exit(1)

    try:
        out_path = write_mdx(mdx_content, today_str)
    except ValueError as e:
        print(f"[ERROR] MDX validation failed: {e}", file=sys.stderr)
        sys.exit(1)

    fm = validate_frontmatter(mdx_content)
    update_last_used(doc, today_str)
    export_github_env(fm["title"], today_str)

    print(f"[SUCCESS] Post written to: {out_path}")
    print(f"[INFO] Title: {fm['title']}")


if __name__ == "__main__":
    main()
