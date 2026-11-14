// Lecture et écriture des fichiers de référence icons/<set>.json.
// Format : { "nom": { "offset": [ox, oy], "rows": ["..##..", …] } }, une ligne de cases par ligne
// de fichier, pour que les diffs de PR se lisent comme des dessins.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { unhex } from "../packages/svg/src/render.js";

// unhex vit avec la règle de rendu (le paquet en a besoin) ; on la réexporte pour ingest.
export { unhex };

/** Les jeux : grand (le dessin 12 × 12), solid (sa version pleine, mêmes noms), petit (8 × 8, hors rendu). */
export const SETS = { grand: 12, solid: 12, petit: 8 };
export const file = (set) => new URL(`../icons/${set}.json`, import.meta.url);

export function read(set) {
  return existsSync(file(set)) ? JSON.parse(readFileSync(file(set), "utf8")) : {};
}

export function write(set, icons) {
  const body = Object.entries(icons).map(([name, { offset, rows }]) =>
    `  ${JSON.stringify(name)}: {\n    "offset": [${offset[0]}, ${offset[1]}],\n    "rows": [\n${rows.map((r) => `      "${r}"`).join(",\n")}\n    ]\n  }`);
  writeFileSync(file(set), `{\n${body.join(",\n")}\n}\n`);
}

/** Lignes de cases → hex (le format de figma/extract.js), et l'empreinte qui va avec. */
export function hex(rows) {
  const w = rows.length / 4;
  return rows.map((r) => parseInt(r.replace(/\./g, "0").replace(/#/g, "1"), 2).toString(16).padStart(w, "0")).join("");
}
export function digest({ offset, rows }) {
  let h = 0x811c9dc5;
  for (const c of `${offset[0]}${offset[1]}${hex(rows)}`) { h ^= c.charCodeAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36);
}
