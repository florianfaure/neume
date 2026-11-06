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
