# @neume-icons/react

Neume is a pixel icon set: 248 icons on a 12 × 12 grid, each with a solid version.
Each icon is a React component in its own module, so bundlers keep only the ones you import.

```sh
npm install @neume-icons/react
```

## Usage

```jsx
import { ArrowUp, X } from "@neume-icons/react";

<ArrowUp />                         // 24 px, decorative (aria-hidden)
<X size={16} title="Close" />       // role="img" with an accessible name
<ArrowUp className="text-red-500" /> // colour comes from currentColor
<StarSolid />                       // the solid version of Star
```

Component names are the PascalCase of the icon name: `arrow-up` becomes `ArrowUp`. Every icon has a solid
version, the same name followed by `Solid`: `StarSolid`, `ArrowUpSolid`. A single icon can also be
imported directly: `@neume-icons/react/icons/ArrowUp`.

| Prop | Default | |
|---|---|---|
| `size` | `24` | Any number, snapped **down** to a multiple of 4 between 12 and 64 (30 → 28, 70 → 64, 5 → 12). In development a console warning tells you when the value was not exact. |
| `title` | — | Accessible name. Present: `role="img"`, `<title>`, `aria-labelledby`. Absent: `aria-hidden="true"`, `focusable="false"`. |
| other props | | `className`, `style`, `ref` and any SVG attribute are passed to the `<svg>`. |

Requires React 18 or later. ESM only.

## How sizes work

One 12 × 12 drawing serves every size, scaled by exactly `size / 12`. The stroke keeps the same
proportion to the icon at every size.

| Requested | Pixels per cell | Rendering |
|---|---|---|
| 12, 24, 36, 48, 60 | 1, 2, 3, 4, 5 | crisp: whole pixels per cell |
| 16, 20, 28, 32, 40, 44, 52, 56, 64 | 1.33 to 5.33 | smoothed: edges fall between pixels |

## License

MIT
