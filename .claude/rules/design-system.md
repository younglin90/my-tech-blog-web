---
description: Design tokens + interactive viz component catalog
paths:
  - "src/**"
  - "DESIGN.md"
---

## Design system reference

### Design tokens

- Display font: **Fraunces** (variable serif)
- Body font: **Geist**
- Code font: **JetBrains Mono**
- Dark background `#08111f` / accent `#22d3ee`
- Light background `#fafaf9` / accent `#0e7490`
- Default theme: dark

`DESIGN.md` is the source of truth — read it before any UI decision.

### Viz component catalog

The old `CLAUDE.md` was inconsistent: one line said there were "5" viz
components while another block listed 7. The verified reality is that
the count of "5" refers only to the pre-built components living in
`src/components/viz/`. The full set of registered viz components is
larger. Here is the accurate breakdown.

**Pre-built MDX viz in `src/components/viz/` (5)** — usable directly in MDX:

- `<VelocityField reynolds={100} animated={true} gridSize={20} />`
- `<StreamLine particles={50} speed={1.0} obstacle="cylinder" />`
- `<NumericalScheme scheme="upwind" order={1} />`
- `<PressureContour levels={10} colormap="viridis" />`
- `<BoundaryCondition type="inlet" interactive={true} />`

**Standalone viz in `src/components/`** — registered via
`src/lib/viz-registry.tsx`:

- `<NumericalDungeon />`
- `<MachArchitect />`

**Per-post custom viz** — authored under
`src/components/post-viz/{slug}/` and registered in
`src/lib/viz-registry.tsx`. This is the preferred path for new posts;
see `.claude/rules/daily-post.md`.
