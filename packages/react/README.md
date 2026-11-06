# @neume-icons/react

Neume is a pixel icon set: 171 icons on a 12 × 12 grid, 65 of them also on an 8 × 8 grid for dense UIs.
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
```

Component names are the PascalCase of the icon name: `arrow-up` becomes `ArrowUp`. A single icon can also be
imported directly: `@neume-icons/react/icons/ArrowUp`.

| Prop | Default | |
|---|---|---|
| `size` | `24` | Any number, snapped **down** to a multiple of 4 between 12 and 64 (30 → 28, 70 → 64, 5 → 12). In development a console warning tells you when the value was not exact. |
| `title` | — | Accessible name. Present: `role="img"`, `<title>`, `aria-labelledby`. Absent: `aria-hidden="true"`, `focusable="false"`. |
| other props | | `className`, `style`, `ref` and any SVG attribute are passed to the `<svg>`. |

Requires React 18 or later. ESM only.

## How sizes work

A cell must always be a whole number of pixels, or the icon blurs. The largest crisp version that fits
the requested size is shown, centred:

| Requested | Shown |
|---|---|
| 12 | 12 × 12, 1 px per cell |
| 16–20 | 8 × 8, 2 px per cell (12 × 12 at 1 px when there is no 8 × 8) |
| 24–32 | 12 × 12, 2 px per cell |
| 36–44 | 12 × 12, 3 px per cell |
| 48–56 | 12 × 12, 4 px per cell |
| 60–64 | 12 × 12, 5 px per cell |

## License

MIT
