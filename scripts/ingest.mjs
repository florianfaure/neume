// Le sync en deux temps (voir .claude/skills/sync/SKILL.md).
//
//   node scripts/ingest.mjs <empreintes.json>
//     Compare les empreintes lues dans Figma (figma/extract.js, MODE = "digest") aux fichiers
//     icons/*.json, et imprime la liste ONLY à recopier pour la lecture complète.
//
//   node scripts/ingest.mjs <empreintes.json> <lecture.json>
//     Écrit icons/*.json : l'ordre est celui de Figma, les icônes changées viennent de la lecture
//     complète, les autres restent telles quelles. Une icône refusée garde sa version précédente ;
//     une icône disparue de Figma est retirée, et c'est dit.

import { readFileSync } from "node:fs";
import { SETS, read, write, digest, unhex } from "../src/io.js";

const [digestsFile, dataFile] = process.argv.slice(2);
const digests = JSON.parse(readFileSync(digestsFile, "utf8"));
const data = dataFile ? JSON.parse(readFileSync(dataFile, "utf8")) : null;

const only = [];
const report = [];
for (const [set, n] of Object.entries(SETS)) {
  const before = read(set);
  const next = {};
  const fresh = Object.fromEntries((data?.[set] ?? []).map(([name, ox, oy, h]) => [name, { offset: [ox, oy], rows: unhex(h, n) }]));
  const added = [], changed = [], kept = [];
  for (const [name, d] of digests[set]) {
    if (d === null) { if (before[name]) { next[name] = before[name]; kept.push(name); } continue; }
    if (before[name] && digest(before[name]) === d) { next[name] = before[name]; continue; }
    only.push(`${set}/${name}`);
    if (!data) continue;
    if (!fresh[name] || digest(fresh[name]) !== d) { console.error(`✗ ${set}/${name} : la lecture complète ne correspond pas à son empreinte — relis-la.`); process.exit(1); }
    next[name] = fresh[name];
    (before[name] ? changed : added).push(name);
  }
  const removed = Object.keys(before).filter((k) => !next[k]);
  if (data) {
    write(set, next);
    report.push(`${set} : ${Object.keys(next).length} icônes`);
    if (added.length) report.push(`  ajoutées : ${added.join(", ")}`);
    if (changed.length) report.push(`  modifiées : ${changed.join(", ")}`);
    if (removed.length) report.push(`  retirées : ${removed.join(", ")}`);
    if (kept.length) report.push(`  refusées, version précédente gardée : ${kept.join(", ")}`);
  }
}
if (digests.issues.length) report.push(`Refusées par la lecture (${digests.issues.length}) :`, ...digests.issues.map((m) => `  ${m}`));

if (!data) console.log(only.length ? `ONLY = ${JSON.stringify(only)}` : "Rien n'a changé dans Figma.");
console.log(report.join("\n"));
