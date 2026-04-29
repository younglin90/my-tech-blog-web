"""
Tests for generate_post.py.
Validates frontmatter parsing, document selection, and MDX output format.
"""
import sys
import os
from pathlib import Path
import pytest

# Add scripts/ to path
sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
import generate_post as gp


# ── Frontmatter validation ────────────────────────────────────────────────────

VALID_MDX = """\
---
title: "FVM 기초"
date: 2026-03-24
description: "유한체적법 핵심 개념 설명"
tags: ["CFD", "FVM"]
draft: true
---

# 내용
"""

MISSING_DESCRIPTION_MDX = """\
---
title: "FVM 기초"
date: 2026-03-24
draft: true
---

# 내용
"""

NO_FRONTMATTER_MDX = "# 내용\n본문만 있음"


def test_validate_frontmatter_valid():
    fm = gp.validate_frontmatter(VALID_MDX)
    assert fm["title"] == "FVM 기초"
    assert fm["draft"] is True


def test_validate_frontmatter_missing_field():
    with pytest.raises(ValueError, match="description"):
        gp.validate_frontmatter(MISSING_DESCRIPTION_MDX)


def test_validate_frontmatter_no_frontmatter():
    with pytest.raises(ValueError, match="No frontmatter"):
        gp.validate_frontmatter(NO_FRONTMATTER_MDX)


# ── Document selection ────────────────────────────────────────────────────────

SAMPLE_DOCS = [
    {"id": "doc-monday", "day_hint": "monday", "last_used": None, "path": "notes/a.md"},
    {"id": "doc-any", "day_hint": "any", "last_used": None, "path": "notes/b.md"},
    {"id": "doc-monday-used", "day_hint": "monday", "last_used": "2026-03-20", "path": "notes/c.md"},
]


def test_select_document_prefers_day_hint():
    doc = gp.select_document(SAMPLE_DOCS, "monday")
    assert doc["id"] == "doc-monday"  # Never used, day-specific


def test_select_document_falls_back_to_any():
    doc = gp.select_document(SAMPLE_DOCS, "friday")
    assert doc["id"] == "doc-any"


def test_select_document_returns_none_when_empty():
    doc = gp.select_document([], "monday")
    assert doc is None


def test_select_document_prefers_never_used():
    docs = [
        {"id": "used", "day_hint": "monday", "last_used": "2026-03-01", "path": "a.md"},
        {"id": "never", "day_hint": "monday", "last_used": None, "path": "b.md"},
    ]
    doc = gp.select_document(docs, "monday")
    assert doc["id"] == "never"


# ── Day override ──────────────────────────────────────────────────────────────

def test_get_weekday_override_monday():
    assert gp.get_weekday("monday") == 0


def test_get_weekday_override_friday():
    assert gp.get_weekday("friday") == 4


def test_get_weekday_invalid_override():
    with pytest.raises(ValueError):
        gp.get_weekday("funday")


def test_get_weekday_override_sunday():
    assert gp.get_weekday("sunday") == 6


# ── Prompt loading ────────────────────────────────────────────────────────────

def test_all_prompts_exist():
    prompts_dir = Path(__file__).parent.parent / "scripts" / "prompts"
    expected = [
        "cfd_technique.txt",
        "fluid_mechanics.txt",
        "paper_review.txt",
        "_multilingual.txt",
        "_viz_components.txt",
    ]
    for fname in expected:
        assert (prompts_dir / fname).exists(), f"Missing prompt: {fname}"


def test_prompts_contain_placeholders():
    prompts_dir = Path(__file__).parent.parent / "scripts" / "prompts"
    for fname in ["cfd_technique.txt", "fluid_mechanics.txt", "paper_review.txt"]:
        content = (prompts_dir / fname).read_text(encoding="utf-8")
        assert "{SOURCE_CONTENT}" in content, f"{fname} missing {{SOURCE_CONTENT}}"
        assert "{DATE}" in content, f"{fname} missing {{DATE}}"


# ── MDX output filename ───────────────────────────────────────────────────────

def test_write_mdx_filename_format(tmp_path, monkeypatch):
    monkeypatch.setattr(gp, "POSTS_DIR", tmp_path)
    out = gp.write_mdx(VALID_MDX, "2026-03-24")
    assert out.name.startswith("2026-03-24-")
    assert out.suffix == ".mdx"
    assert out.exists()
