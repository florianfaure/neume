# @neume-icons/svg

Neume is a pixel icon set: 251 icons on a 12 × 12 grid.
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

One 12 × 12 drawing serves every size, scaled by exactly `size / 12`. The stroke keeps the same
proportion to the icon at every size.

| Requested | Pixels per cell | Rendering |
|---|---|---|
| 12, 24, 36, 48, 60 | 1, 2, 3, 4, 5 | crisp: whole pixels per cell |
| 16, 20, 28, 32, 40, 44, 52, 56, 64 | 1.33 to 5.33 | smoothed: edges fall between pixels |

## License

MIT
