<p align="center">
  <img src=".github/assets/logo.svg" width="48" height="48" alt="">
</p>

<h1 align="center">Neume</h1>

<p align="center">
  A pixel icon set, from 12 to 64 px, with one drawing for every size.<br>
  <a href="https://neume.dev">neume.dev</a> ·
  <a href="https://neume.dev/docs">Docs</a> ·
  <a href="https://www.npmjs.com/package/@neume-icons/react">npm</a> ·
  <a href="LICENSE">MIT</a>
</p>

<p align="center">
  <img src=".github/assets/preview.svg" alt="The 251 Neume icons, at 24 px.">
</p>

Neume is 251 icons, each drawn cell by cell on a grid of 12 × 12 squares. The same drawing serves every
size: at 12, 24, 36, 48 and 60 px every square lands on whole pixels and the edges stay sharp. In between,
the icon scales smoothly and keeps its proportions. The full documentation lives at
[neume.dev/docs](https://neume.dev/docs).

## Install

```sh
npm install @neume-icons/react   # React components
npm install @neume-icons/svg     # the core, for any framework or none
```

Or download every icon as an SVG file at 24 px: [neume-svg-24.zip](https://neume.dev/neume-svg-24.zip).
[More on installing →](https://neume.dev/docs#install)

## React

```jsx
import { ArrowUp, Search } from "@neume-icons/react";

<ArrowUp />                         // 24 px, decorative
<Search size={16} title="Search" /> // with an accessible name
<ArrowUp className="text-neutral-500" />  // colour from currentColor
```

Component names are the PascalCase of the icon name (`arrow-up` → `ArrowUp`). Each icon is its own module,
so your bundle keeps only the icons you import. React 18 or later, ESM only, types included.
[Props and details →](https://neume.dev/docs#react)

## Plain SVG

```js
import { svg, names, SIZES } from "@neume-icons/svg";

svg("arrow-up", 32); // '<svg … width="32" height="32" …>…</svg>'
names;               // every icon name, in design order
```

`svg(name, size)` accepts 12 to 64 in steps of 4 and throws on anything else. Ready-made files ship too, at
12, 16 and 24 px: `@neume-icons/svg/dist/24/arrow-up.svg`.
[Files and building your own wrapper →](https://neume.dev/docs#svg)

## Sizes and centring

| Size | Pixels per square | Rendering |
|---|---|---|
| 12, 24, 36, 48, 60 | 1, 2, 3, 4, 5 | crisp: whole pixels per square |
| 16, 20, 28, 32, 40, 44, 52, 56, 64 | 1.33 to 5.33 | smoothed: edges fall between pixels |

The React components round any other number down to the nearest size (30 → 28, 70 → 64), with a warning
in development. Icons with a central stem are drawn half a square off the grid, so the stem sits on the
centre of the box: exactly at every size except 12, 36 and 60 px, where it lands half a pixel off to stay
sharp. [Sizes →](https://neume.dev/docs#sizes) · [Centring →](https://neume.dev/docs#centring)

## Versions

Both packages are always released together, at the same version. A new icon is a minor version, a
corrected drawing a patch, and an icon removed or renamed a major version.
[More →](https://neume.dev/docs#versions)

## Requests and issues

Missing an icon, or one reads badly at a given size? [Open an issue](https://github.com/florianfaure/neume/issues/new)
with the name you would expect, what it should mean, and where you would use it.

## The name

Neumes are the signs of plainchant notation. By the 13th century they were written as small square notes:
compact marks on a staff, telling the singer what to do. [About Neume →](https://neume.dev/docs#about)

## Development

An npm workspaces monorepo. Icons are drawn in Figma and imported into `icons/*.json`, the source of truth;
everything else is generated from it.

```sh
npm run build   # generate packages/svg, packages/react and the site's zip from icons/*.json
npm run check   # every icon at every size, generated files up to date, React smoke test
npm run sheet   # a local control sheet, every icon at every size
```

- `packages/svg`: `@neume-icons/svg`, with the sizing rule (`src/render.js`, its only copy), the icon data
  and ready-made SVG files.
- `packages/react`: `@neume-icons/react`, one component per icon, built on the core.
- `site`: [neume.dev](https://neume.dev), a static Next.js export.
- `icons/*.json` is never edited by hand: an icon is fixed in Figma, then synced.

## License

[MIT](LICENSE) © 2026 Florian Faure. Drawn by [Florian Faure](https://florianfaure.com).
