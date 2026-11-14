// Neume — la génération des paquets, en mémoire : { chemin relatif à la racine → contenu }.
// `build.mjs` l'écrit sur le disque, `check.mjs` la compare au disque. Rien ici n'écrit.
//
// Sources : icons/*.json (vérité : grand, solid, petit), packages/svg/src/render.js (règle de calage, jamais copiée),
// packages/react/src/create-icon.js (copié tel quel dans dist/). Tout le reste est produit.

import { readFileSync } from "node:fs";
import { read, hex, unhex } from "../src/io.js";
import { SIZES, svg, path } from "../packages/svg/src/render.js";
import { zipStore } from "./zip.mjs";

const ROOT = new URL("../", import.meta.url);
const text = (p) => readFileSync(new URL(p, ROOT), "utf8");

/** Les emplacements entièrement générés : build les vide avant d'écrire, check les compare en entier. */
export const GENERATED = ["packages/svg/dist", "packages/react/dist", "packages/svg/src/data.js", ".github/assets/preview.svg", "site/public/neume-svg-24.zip"];

const HEADER = "// Généré par scripts/build.mjs depuis icons/*.json — ne pas modifier à la main.\n";
const RESERVED = new Set(["Icon", "IconProps", "createIcon"]);

export const pascal = (name) => name.split("-").map((p) => p[0].toUpperCase() + p.slice(1)).join("");

/** Le nom publié de la version solide d'une icône : `star` → `star-solid` (et `<StarSolid />`). */
export const solidName = (name) => `${name}-solid`;

export function generate() {
  const sets = { grand: read("grand"), solid: read("solid"), petit: read("petit") };
  const names = Object.keys(sets.grand);
  const errors = [];

  for (const n of Object.keys(sets.petit)) if (!sets.grand[n]) errors.push(`petit / ${n} : pas de version 12 × 12`);
  // Chaque icône a sa version solide, sous le même nom, et rien d'autre.
  for (const n of names) if (!sets.solid[n]) errors.push(`${n} : pas de version solide (page « 24px solid »)`);
  for (const n of Object.keys(sets.solid)) if (!sets.grand[n]) errors.push(`solid / ${n} : pas d'icône de base du même nom`);
  for (const n of names) if (n.endsWith("-solid")) errors.push(`${n} : « -solid » est réservé aux versions solides`);

  // Le même espace de noms publie les deux styles : `star`, puis `star-solid`, icône par icône.
  const published = names.flatMap((n) => [n, solidName(n)]);
  const drawings = Object.fromEntries(names.flatMap((n) => [[n, sets.grand[n]], [solidName(n), sets.solid[n]]]));

  // Noms de composants : PascalCase du kebab-case, sans collision ni identifiant invalide.
  const components = new Map();
  for (const n of published) {
    const C = pascal(n);
    if (!/^[A-Z][A-Za-z0-9]*$/.test(C) || RESERVED.has(C)) errors.push(`${n} : « ${C} » n'est pas un nom de composant valide`);
    else if (components.has(C)) errors.push(`${n} et ${components.get(C)} donnent le même composant « ${C} »`);
    else components.set(C, n);
  }

  // Format compact [ox, oy, hex], avec contre-épreuve : le hex doit redonner les lignes d'origine.
  const compact = {};
  for (const [set, n] of [["grand", 12], ["solid", 12], ["petit", 8]]) {
    compact[set] = {};
    for (const [name, { offset, rows }] of Object.entries(sets[set])) {
      const h = hex(rows);
      if (unhex(h, n).join() !== rows.join()) errors.push(`${set} / ${name} : le hex ne redonne pas les lignes`);
      compact[set][name] = [offset[0], offset[1], h];
    }
  }
  if (errors.length) throw new Error(errors.join("\n"));

  const files = new Map();
  const put = (p, content) => files.set(p, content);

  // --- @neume-icons/svg ---
  const table = (set) => `{\n${Object.entries(compact[set]).map(([n, c]) => `  ${JSON.stringify(n)}: ${JSON.stringify(c).replace(/,/g, ", ")},`).join("\n")}\n}`;
  put("packages/svg/src/data.js",
    `${HEADER}\n/** Icônes 12 × 12 : [ox, oy, lignes de cases en hex]. */\nexport const grand = ${table("grand")};\n\n` +
    `/** Leurs versions solides, 12 × 12, sous le même nom (publiées en \`<nom>-solid\`). */\nexport const solid = ${table("solid")};\n\n` +
    `/** Icônes 8 × 8. */\nexport const petit = ${table("petit")};\n\n/** Les noms, dans l'ordre de Figma. */\nexport const names = Object.keys(grand);\n`);

  // Les SVG prêts à l'emploi : 12, 16 et 24, tous tirés du dessin 12 × 12, base et solide.
  for (const size of [12, 16, 24]) {
    if (!SIZES.includes(size)) throw new Error(`taille ${size} absente de SIZES`);
    for (const n of published) put(`packages/svg/dist/${size}/${n}.svg`, svg(n, size, { grand: drawings }) + "\n");
  }
  // Le zip du bouton « Download all » de neume.dev/docs : les fichiers à 24 px, base et solide, à plat.
  put("site/public/neume-svg-24.zip", zipStore(published.map((n) => [`${n}.svg`, files.get(`packages/svg/dist/24/${n}.svg`)])));

  // --- @neume-icons/react ---
  put("packages/react/dist/create-icon.js", text("packages/react/src/create-icon.js"));
  put("packages/react/dist/create-icon.d.ts", text("packages/react/src/create-icon.d.ts"));
  const tuple = (c) => JSON.stringify(c).replace(/,/g, ", ");
  const compactOf = (n) => (n.endsWith("-solid") ? compact.solid[n.slice(0, -"-solid".length)] : compact.grand[n]);
  for (const [C, n] of components) {
    put(`packages/react/dist/icons/${C}.js`,
      `${HEADER}import { createIcon } from "../create-icon.js";\n\n` +
      `export const ${C} = /*#__PURE__*/ createIcon(${JSON.stringify(C)}, ${tuple(compactOf(n))});\n`);
    put(`packages/react/dist/icons/${C}.d.ts`,
      `${HEADER}import type { Icon } from "../create-icon.js";\n\nexport declare const ${C}: Icon;\n`);
  }
  const list = [...components.keys()];
  put("packages/react/dist/index.js", HEADER + list.map((C) => `export { ${C} } from "./icons/${C}.js";`).join("\n") + "\n");
  put("packages/react/dist/index.d.ts",
    HEADER + `export type { Icon, IconProps } from "./create-icon.js";\n` + list.map((C) => `export { ${C} } from "./icons/${C}.js";`).join("\n") + "\n");

  // L'aperçu du README : toutes les icônes 12 × 12 à 24 px, dans l'ordre de Figma, clair et sombre.
  const COLS = 16, PITCH = 40, PAD = 8;
  const rowsCount = Math.ceil(names.length / COLS);
  const cells = names.map((n, i) =>
    `<path transform="translate(${(i % COLS) * PITCH + PAD} ${Math.floor(i / COLS) * PITCH + PAD})" d="${path(sets.grand[n], 2, 24)}"/>`);
  put(".github/assets/preview.svg",
    `<svg xmlns="http://www.w3.org/2000/svg" width="${COLS * PITCH}" height="${rowsCount * PITCH}" viewBox="0 0 ${COLS * PITCH} ${rowsCount * PITCH}" shape-rendering="crispEdges">\n` +
    `<style>path{fill:#111}@media (prefers-color-scheme:dark){path{fill:#eee}}</style>\n${cells.join("\n")}\n</svg>\n`);

  return files;
}
