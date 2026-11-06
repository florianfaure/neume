// Lecture et écriture des fichiers de référence icons/<set>.json.
// Format : { "nom": { "offset": [ox, oy], "rows": ["..##..", …] } }, une ligne de cases par ligne
// de fichier, pour que les diffs de PR se lisent comme des dessins.

import { readFileSync, writeFileSync, existsSync } from "node:fs";

export const SETS = { grand: 12, petit: 8 };
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
export function unhex(h, n) {
  const w = n / 4;
  return Array.from({ length: n }, (_, y) =>
    parseInt(h.slice(y * w, y * w + w), 16).toString(2).padStart(n, "0").replace(/0/g, ".").replace(/1/g, "#"));
}
export function digest({ offset, rows }) {
  let h = 0x811c9dc5;
  for (const c of `${offset[0]}${offset[1]}${hex(rows)}`) { h ^= c.charCodeAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36);
}
