# @neume-icons/svg

Neume is a pixel icon set: 251 icons on a 12 × 12 grid, 228 of them also on an 8 × 8 grid for dense UIs.
This package is the framework-agnostic core. For React, use [`@neume-icons/react`](../react).

```sh
npm install @neume-icons/svg
```

## Usage

```js
import { svg, names, SIZES } from "@neume-icons/svg";

svg("arrow-up", 24); // '<svg xmlns=… fill="currentColor" shape-rendering="crispEdges">…</svg>'
names;               // every icon name, in design order
```

`svg(name, size)` accepts 12 to 64 in steps of 4 and throws on anything else.

Plain files are shipped too, drawn with `fill="currentColor"`:

```
@neume-icons/svg/dist/12/arrow-up.svg
@neume-icons/svg/dist/16/arrow-up.svg
@neume-icons/svg/dist/24/arrow-up.svg
```

Lower-level pieces: `pick`, `path`, `snap` (also under `@neume-icons/svg/render`, which pulls no icon data)
and the compact icon data under `@neume-icons/svg/data` (`[ox, oy, hex]` per icon).

## How sizes work

A cell must always be a whole number of pixels, or the icon blurs. The largest crisp version that fits
the requested size is shown, centred:

| Requested | Shown |
|---|---|
| 12 | 8 × 8, 1 px per cell (12 × 12 when there is no 8 × 8) |
| 16–20 | 8 × 8, 2 px per cell (12 × 12 at 1 px when there is no 8 × 8) |
| 24–32 | 12 × 12, 2 px per cell |
| 36–44 | 12 × 12, 3 px per cell |
| 48–56 | 12 × 12, 4 px per cell |
| 60–64 | 12 × 12, 5 px per cell |

## License

MIT
