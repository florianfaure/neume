<p align="center">
  <img src=".github/assets/logo.svg" width="48" height="48" alt="">
</p>

<h1 align="center">Neume</h1>

<p align="center">
  A pixel icon set, from 12 to 64 px, with one drawing for every size.<br>
  <a href="https://neume.dev">neume.dev</a> ·
  <a href="https://www.npmjs.com/package/@neume-icons/react">npm</a> ·
  <a href="LICENSE">MIT</a>
</p>

<p align="center">
  <img src=".github/assets/preview.svg" alt="The 251 Neume icons, at 24 px.">
</p>

## Why Neume

- **Drawn on a pixel grid.** Every icon is drawn cell by cell on a 12 × 12 grid. At 12, 24, 36, 48 and 60 px a
  cell lands on whole pixels, so edges are crisp.
- **One-pixel strokes, centred.** An arrow keeps a stem one cell wide and still sits in the middle of its
  box (see [Centring](#centring)).
- **Any size from 12 to 64, in steps of 4.** One drawing, scaled by exactly size / 12. Between the crisp
  sizes the edges are smoothed, and the stroke keeps the same proportion to the icon.

## Install

```sh
npm install @neume-icons/react
```

```jsx
import { ArrowUp, Search } from "@neume-icons/react";

<ArrowUp />                              // 24 px, decorative (aria-hidden)
<Search size={16} title="Search" />      // role="img", with an accessible name
<ArrowUp className="text-neutral-500" /> // colour comes from currentColor
```

Each icon is its own module, so your bundle only keeps the icons you import. React 18 or later.

Not using React? `@neume-icons/svg` gives you the SVG of any icon at any size, and ready-made files:

```sh
npm install @neume-icons/svg
```

```js
import { svg } from "@neume-icons/svg";

svg("arrow-up", 32); // '<svg … width="32" height="32" …>'
// or the files: @neume-icons/svg/dist/{12,16,24}/arrow-up.svg
```

## Sizes

One 12 × 12 drawing serves every size, scaled by exactly `size / 12`. The stroke keeps the same
proportion to the icon at every size.

| Requested | Pixels per cell | Rendering |
|---|---|---|
| 12, 24, 36, 48, 60 | 1, 2, 3, 4, 5 | crisp: whole pixels per cell |
| 16, 20, 28, 32, 40, 44, 52, 56, 64 | 1.33 to 5.33 | smoothed: edges fall between pixels |

Any other number is snapped down to the nearest of these (30 → 28, 70 → 64), with a warning in
development.

## Centring

A box of 12, 24 or 48 px has its centre *between* two pixels, so a stem one pixel wide cannot sit exactly
on it. Neume icons with a central stem are drawn half a cell off the grid, and that half-cell is kept when
they are scaled: the stem is exactly centred whenever a cell is an even number of pixels (16, 20, 24, 28,
32, 48, 52, 56), and half a pixel off otherwise — the physical limit.

## The name

Neumes are the signs of plainchant notation. By the 13th century they were written as small square notes:
compact marks on a staff, telling the singer what to do.

## Requests and issues

Missing an icon, or one reads badly at a given size? [Open an issue](https://github.com/florianfaure/neume/issues)
with the name, what it should mean, and where you would use it.

## Development

An npm workspaces monorepo. Icons are drawn in Figma and imported into `icons/*.json`, the source of truth;
everything else is generated from it.

```sh
npm run build   # generate packages/svg and packages/react from icons/*.json
npm run check   # every icon at every size: inside the box, whole pixels at multiples of 12, generated files up to date
npm run sheet   # a local control sheet, every icon at every size
```

- `packages/svg` — `@neume-icons/svg`: the sizing rule (`src/render.js`, its only copy), the icon data and
  ready-made SVG files.
- `packages/react` — `@neume-icons/react`: one component per icon, built on the core.
- `icons/*.json` is never edited by hand: an icon is fixed in Figma, then synced.

## License

[MIT](LICENSE) © 2026 Florian Faure
