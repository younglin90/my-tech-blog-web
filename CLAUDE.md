# CFD.Lab — Project Guide (Claude Code)

A CFD (computational fluid dynamics) researcher's tech blog. Each day Claude Code
reads one source doc, writes a 5-locale MDX post, commits, and pushes to `main` —
Cloudflare Pages auto-deploys. The old GitHub Actions + Anthropic API pipeline is
abandoned (credit cost); Claude Code writes posts directly.

**Daily-post triggers:** "오늘 포스트 만들어줘" / "월요일 포스트 만들어줘" / "/daily-post".
When triggered you MUST read `.claude/rules/daily-post.md` first and follow it step
by step. Scheduled task `cfd-daily-post` runs it Mon–Fri at 10:05.

## Stack
Next.js 16 (App Router) · Contentlayer2 · React 19 · Tailwind CSS 4 · KaTeX
(rehype-katex) · rehype-pretty-code. Deploy: Cloudflare Pages (`main` push → build).
Fonts: Fraunces (display) / Geist (body) / JetBrains Mono (code); dark default.
UI decisions: read `DESIGN.md` (design source of truth) first.

## Communication
Reply to the maintainer in Korean (their working language). Keep it concise and
evidence-based — short sentences, and show diffs / test output rather than
asserting success. Post content itself follows the per-locale rules in `.claude/rules/`.

## Project Map
| Path | Role |
|------|------|
| `src/app/[locale]/` | Localized routes — ko/en/ja/zh/es |
| `src/app/{admin,preview,read}/` | Admin-only, noindex |
| `src/content/posts/{ko,en,ja,zh,es}/` | MDX posts — one folder per locale, shared slug |
| `src/components/MDX.tsx` | MDX renderer + component registry (heading anchors) |
| `src/components/viz/` | Pre-built viz (5): VelocityField, StreamLine, NumericalScheme, PressureContour, BoundaryCondition |
| `src/components/{NumericalDungeon,MachArchitect}.tsx` | Standalone viz; registered in `src/lib/viz-registry.tsx` |
| `src/components/post-viz/{slug}/` | Per-post custom viz, authored fresh per post |
| `src/components/{admin,calculators}/` | Admin panel + interactive calculators |
| `src/i18n/{locale}.json` | UI string dictionaries (5 locales) |
| `src/lib/` | dynamic-posts.ts, viz-registry.tsx, generated post-index.json / rag-index.json |
| `source-docs/{cfd-technique,fluid-mechanics,paper-review}/` | Post source material (Mon-Wed-Fri / Tue-Thu / Sat-Sun) |
| `source-docs/index.yaml` | `last_used` rotation ledger — auto-updated, do not hand-edit |
| `scripts/` | Build + automation pipeline (see Commands) |
| `scripts/prompts/*.txt` | Per-weekday post-generation prompts |
| `functions/_middleware.ts` | Cloudflare locale redirect (cookie > Accept-Language > geo) |
| `contentlayer.config.ts` | MDX schema (title/date/description/draft/tags) |

## Commands & Capabilities
You CAN run these — do not assume a capability is missing:
| Command | Does |
|---------|------|
| `npm run dev` | copy-katex → scan-viz → build-post-index → next dev |
| `npm run build` | full pipeline: scans + build-rag-index + build-summaries + build-post-index + next build + generate-rss + verify-static-routes |
| `npm run validate-post` | validate a generated MDX post (`scripts/validate-post.mjs`) |
| `npm run lighthouse` | Lighthouse audit (`scripts/lighthouse.mjs`) |
| `python -m pytest tests/ -v` | test suite (`tests/test_generate.py`) |
| `node scripts/translate-existing-posts.mjs` | bulk-translate ko posts (Anthropic API, needs `ANTHROPIC_API_KEY`) |

Generated indexes — do NOT hand-edit (rebuilt by the build pipeline):
`src/lib/post-index.json`, `src/lib/rag-index.json` (RAG search), `public/*-index.json`.
Other `scripts/` automation: audit-posts, check-links, readiness-score,
scan-{viz,math,glossary}, tools-visual-score, verify-static-routes, install-hooks.

## Lessons Learned / Pitfalls
- Line endings: repo normalizes to LF (`.gitattributes`). Never commit CRLF — it breaks the build.
- KaTeX block math: `$$` must be on its own line; content on the same line breaks remark-math parsing.
- Every post needs ≥1 interactive viz. A zero-viz draft is a failure → rewrite.
- Every auto post = 5 locales (ko/en/ja/zh/es), same slug, `draft: false`. A missing locale triggers the ko-fallback banner.
- `source-docs/index.yaml` and `src/lib/*-index.json` are machine-managed — let the routine / build write them.
- Admin password: SHA-256 hash in `.env.local` (`NEXT_PUBLIC_ADMIN_PASSWORD_HASH`); mirror it in Cloudflare env vars.
- `scripts/generate_post.py` (API pipeline) is unused — kept for reference only.

## Rules (read the matching file before that kind of work)
- `.claude/rules/daily-post.md` — daily post routine, source selection, writing rules (글 규칙). Scope: posts / source-docs / prompts.
- `.claude/rules/i18n.md` — 5-locale workflow, translation, routing, fallback. Scope: posts / i18n.
- `.claude/rules/design-system.md` — design tokens + viz component catalog (+ `DESIGN.md`).
- `.claude/rules/frontend-aesthetics.md` — anti-"AI slop" creative UI guidance for NEW frontend surfaces (post-viz, standalone pages); `DESIGN.md` still wins for existing site chrome.
- `.claude/rules/execution-model.md` — Advisor/Worker delegation model; read before any multi-step task.
- `.claude/rules/working-style.md` — act immediately, no over-engineering, no permission-seeking (always applies).

Change history archive: `.claude/history.md`.

## Execution Model
The main session acts as Advisor and delegates implementation to Workers.
Full rules: `.claude/rules/execution-model.md`.
