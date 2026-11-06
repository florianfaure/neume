// @neume-icons/svg — le cœur : la règle de calage, le tracé, et les icônes embarquées.
// Pour ne tirer aucune donnée (le paquet React, par exemple), importer `@neume-icons/svg/render`.

import { svg as render, decode } from "./render.js";
import { grand, petit, names } from "./data.js";

export { SIZES, snap, pick, path } from "./render.js";
export { names };

let sets;

/** Le SVG complet de l'icône `name` à `size` px (12–64 par pas de 4, sinon erreur). */
export function svg(name, size, attrs) {
  sets ??= {
    grand: Object.fromEntries(Object.entries(grand).map(([n, c]) => [n, decode(c)])),
    petit: Object.fromEntries(Object.entries(petit).map(([n, c]) => [n, decode(c)])),
  };
  return render(name, size, sets, attrs);
}
