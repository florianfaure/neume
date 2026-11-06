// node scripts/ingest.mjs <extraction.json>
// Transforme la sortie de figma/extract.js en fichiers de référence icons/grand.json et icons/petit.json.
// L'ordre est celui de Figma. Une icône refusée par l'extraction garde sa version précédente si elle
// en a une ; une icône disparue de Figma est retirée, et c'est dit.

import { readFileSync } from "node:fs";
import { SETS, read, write } from "../src/io.js";

const src = JSON.parse(readFileSync(process.argv[2], "utf8"));
const refused = new Set(src.issues.map((m) => m.split(" : ")[0].split(" / ")[1]));

for (const [set, n] of Object.entries(SETS)) {
  const before = read(set);
  const next = {};
  const w = n / 4;
  for (const [name, ox, oy, hex] of src[set]) {
    const rows = [];
    for (let y = 0; y < n; y++) {
      const v = parseInt(hex.slice(y * w, y * w + w), 16);
      rows.push(v.toString(2).padStart(n, "0").replace(/0/g, ".").replace(/1/g, "#"));
    }
    next[name] = { offset: [ox, oy], rows };
  }
  for (const name of Object.keys(before)) if (!next[name] && refused.has(name)) next[name] = before[name];
  const added = Object.keys(next).filter((k) => !before[k]);
  const changed = Object.keys(next).filter((k) => before[k] && JSON.stringify(before[k]) !== JSON.stringify(next[k]));
  const removed = Object.keys(before).filter((k) => !next[k]);
  write(set, next);
  console.log(`${set} : ${Object.keys(next).length} icônes — ${added.length} ajoutées, ${changed.length} modifiées, ${removed.length} retirées`);
  if (removed.length) console.log(`  retirées : ${removed.join(", ")}`);
}
if (src.issues.length) {
  console.log(`\nRefusées par l'extraction (${src.issues.length}) :`);
  for (const m of src.issues) console.log(`  ${m}`);
}
