# Neume

A pixel icon set. Every icon is drawn twice at most — a 12 × 12 grid and, for dense UIs, an 8 × 8 one —
and renders crisp at any size from 12 to 64 px in steps of 4.

> Private until launch. Licence: MIT.

## How sizes work

A cell must always be a whole number of pixels, or the icon blurs. So the component shows the largest
crisp version that fits the requested size, centred:

| Requested | Shown |
|---|---|
| 12 | 12 × 12, 1 px per cell |
| 16–20 | 8 × 8, 2 px per cell (12 × 12 at 1 px when there is no 8 × 8) |
| 24–32 | 12 × 12, 2 px per cell |
| 36–44 | 12 × 12, 3 px per cell |
| 48–56 | 12 × 12, 4 px per cell |
| 60–64 | 12 × 12, 5 px per cell |

An icon with a one-cell central stem (arrow, plus, “i”) is drawn half a cell off the grid in Figma.
That half-cell is kept: it is exact at even scales, and leaves 0.5 px at odd ones — the physical limit.

## Repository

An npm workspaces monorepo.

- `icons/grand.json`, `icons/petit.json` — the source of truth, one row of cells per line.
- `figma/extract.js` — reads the Figma file through the Desktop Bridge plugin. No Figma token.
- `packages/svg` — `@neume-icons/svg`: the sizing rule and the SVG path (`src/render.js`, the only copy),
  the compact icon data, and prebuilt SVG files at 12, 16 and 24 px.
- `packages/react` — `@neume-icons/react`: one component per icon, built on the core.
- `scripts/build.mjs` generates everything that ships from `icons/*.json`; generated files are committed
  and `npm run check` fails when they are out of date.
- `npm run ingest <extract.json>` · `npm run build` · `npm run check` · `npm run sheet` (control sheet in `sheet/`).
