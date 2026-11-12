// Neume — le cœur du rendu, partagé par la planche, le paquet et le site.
//
// Une icône est dessinée sur une grille de 12 × 12 cases, dans Figma à 2 px par case. `offset` vaut [ox, oy] : 1 quand le dessin est décalé d'une
// demi-case vers la droite (ox) ou vers le bas (oy) — c'est ce qui centre une tige d'une case.
//
// Règle de calage : toute taille par pas de 4 de 12 à 64 est acceptée, et le même dessin 12 × 12
// sert partout, agrandi au facteur exact k = taille / 12. Net (un nombre entier de pixels par case)
// à 12, 24, 36, 48 et 60 ; lissé entre les deux, le rapport du trait restant toujours le même.
// Le set petit (8 × 8) reste dans les données mais le rendu ne l'utilise plus.

export const SIZES = Array.from({ length: 14 }, (_, i) => 12 + i * 4);

/** Ramène un nombre quelconque à la taille valide inférieure : multiple de 4, borné à 12–64. */
export function snap(size) {
  return Math.min(SIZES[SIZES.length - 1], Math.max(SIZES[0], Math.floor(size / 4) * 4));
}

/** La version affichée pour une taille : toujours le grand dessin, à k = size / 12 px par case. `hasPetit` est ignoré (compatibilité). */
export function pick(size, hasPetit) {
  if (!SIZES.includes(size)) throw new Error(`taille ${size} : un multiple de 4 entre 12 et 64`);
  return { set: "grand", k: size / 12 };
}

/** Un nombre arrondi à 3 décimales, sans zéros inutiles. */
const num = (v) => String(Math.round(v * 1000) / 1000);

/** Hex → lignes de cases, n cases par ligne (n/4 caractères hex par ligne). Inverse de `hex()` de src/io.js. */
export function unhex(h, n) {
  const w = n / 4;
  return Array.from({ length: n }, (_, y) =>
    parseInt(h.slice(y * w, y * w + w), 16).toString(2).padStart(n, "0").replace(/0/g, ".").replace(/1/g, "#"));
}

/** Une icône compacte [ox, oy, hex] → { offset, rows }. La grille se déduit de la longueur du hex (36 → 12, 16 → 8). */
export function decode([ox, oy, hex]) {
  const n = Math.round(2 * Math.sqrt(hex.length));
  if (n % 4 !== 0 || (n * n) / 4 !== hex.length) throw new Error(`hex de ${hex.length} caractères : pas une grille carrée`);
  return { offset: [ox, oy], rows: unhex(hex, n) };
}

/** Le tracé SVG d'une icône à `k` px par case, posé dans une boîte de `size` px. */
export function path(icon, k, size) {
  const n = icon.rows.length;
  const base = (size - n * k) / 2;
  // Demi-case : l'entier inférieur quand k est entier (net, il reste 0,5 px si k est impair), exacte sinon.
  const half = Number.isInteger(k) ? Math.floor(k / 2) : k / 2;
  const dx = base + icon.offset[0] * half;
  const dy = base + icon.offset[1] * half;
  let d = "";
  icon.rows.forEach((row, y) => {
    for (const m of row.matchAll(/#+/g)) {
      const w = num(m[0].length * k);
      d += `M${num(dx + m.index * k)} ${num(dy + y * k)}h${w}v${num(k)}h-${w}z`;
    }
  });
  return d;
}

/** Le SVG complet d'une icône à une taille donnée. `sets` = { grand, petit }. */
export function svg(name, size, sets, attrs = "") {
  const { set, k } = pick(size);
  const icon = sets[set][name];
  const crisp = Number.isInteger(k) ? "crispEdges" : "geometricPrecision";
  if (!icon) throw new Error(`icône inconnue : ${name}`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="currentColor" shape-rendering="${crisp}" aria-hidden="true"${attrs}><path d="${path(icon, k, size)}"/></svg>`;
}
