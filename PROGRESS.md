# Progress Log

## 2026-04-27

- Iteration 1: localized hardcoded UI text in `Search`, `PostList`, `LanguageSwitcher`, and the home weekly banner for all 5 locales.
- Added locale-aware day-group labeling via `getDayLabel()` so the homepage no longer leaks Korean labels on non-Korean routes.
- Recorded current build blocker: Windows Node against WSL-installed `node_modules` fails at `esbuild` platform resolution during `next build`.
- Iteration 2: replaced the default Next.js template `README.md` with project-specific setup, workflow, and environment notes.
- Iteration 3: upgraded `/tools` from a static card list into a searchable catalog with featured tools, category filters, and localized page copy.
- Iteration 3: added 15 new CFD calculators spanning compressible flow, dimensionless numbers, wall modeling, heat transfer, multiphase scaling, and numerical stability.
- Iteration 3: refactored tool detail routing to use a calculator registry and added related-tool recommendations plus richer sidebar context.
- Iteration 4: synced `/tools` search and category filters to URL query params so filtered catalog states are shareable and reproducible.
- Iteration 4: added structured data (`CollectionPage`, `ItemList`, `WebApplication`, `BreadcrumbList`) to tools index/detail pages for better search visibility.
- Iteration 5: improved tool detail navigation with previous/next movement inside the same category and a full in-category calculator list in the sidebar.
- Iteration 6: added `recently viewed tools` history so returning visitors can jump back into the calculators they used most recently.
- Iteration 7: localized remaining hardcoded header/footer text so terminal status, tagline, and footer navigation better match each active locale.
- Iteration 8: added in-page tools category jump navigation plus per-section back-to-top anchors so the expanded calculator catalog is faster to scan and traverse.
