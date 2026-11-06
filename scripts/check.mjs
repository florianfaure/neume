// node scripts/check.mjs — le vérificateur. Rouge : rien ne sort.
import { SETS, read } from "../src/io.js";
import { SIZES, pick, path } from "../src/render.js";

const errors = [];
const warn = [];
const sets = {};
for (const [set, n] of Object.entries(SETS)) {
  sets[set] = read(set);
  for (const [name, icon] of Object.entries(sets[set])) {
    const at = `${set} / ${name}`;
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) errors.push(`${at} : nom hors kebab-case`);
    const { offset, rows } = icon;
    if (!Array.isArray(offset) || offset.length !== 2 || offset.some((v) => v !== 0 && v !== 1)) errors.push(`${at} : offset doit valoir [0|1, 0|1]`);
    if (!Array.isArray(rows) || rows.length !== n || rows.some((r) => !new RegExp(`^[.#]{${n}}$`).test(r))) { errors.push(`${at} : ${n} lignes de ${n} cases « . » ou « # »`); continue; }
    if (!rows.some((r) => r.includes("#"))) errors.push(`${at} : icône vide`);
    // Décalée d'une demi-case, la dernière colonne (ou ligne) sortirait du cadre.
    if (offset[0] && rows.some((r) => r[n - 1] === "#")) errors.push(`${at} : décalée à droite, la dernière colonne doit rester vide`);
    if (offset[1] && rows[n - 1].includes("#")) errors.push(`${at} : décalée vers le bas, la dernière ligne doit rester vide`);
    // Toute taille doit produire un tracé entier, dans la boîte.
    for (const size of SIZES) {
      const p = pick(size, Boolean(sets.petit?.[name]));
      if (p.set !== set) continue;
      const d = path(icon, p.k, size);
      if (/\./.test(d)) errors.push(`${at} : demi-pixel à ${size} px`);
    }
  }
}
for (const name of Object.keys(sets.petit)) if (!sets.grand[name]) warn.push(`petit / ${name} : pas de version 12 × 12`);

// Auto-test de la table de calage.
const expect = { 12: "grand1", 16: "petit2", 20: "petit2", 24: "grand2", 32: "grand2", 36: "grand3", 44: "grand3", 48: "grand4", 56: "grand4", 60: "grand5", 64: "grand5" };
for (const [s, e] of Object.entries(expect)) { const p = pick(+s, true); if (p.set + p.k !== e) errors.push(`calage : ${s} px donne ${p.set} ×${p.k}, attendu ${e}`); }
if (pick(16, false).set !== "grand") errors.push("calage : 16 px sans petit doit retomber sur le grand ×1");

for (const w of warn) console.log(`· ${w}`);
if (errors.length) { for (const e of errors) console.error(`✗ ${e}`); console.error(`\n${errors.length} erreur(s).`); process.exit(1); }
console.log(`✓ ${Object.keys(sets.grand).length} icônes 12 × 12, ${Object.keys(sets.petit).length} icônes 8 × 8 — tout est net de 12 à 64.`);
