// Neume — le cœur du rendu, partagé par la planche, le paquet et le site.
//
// Une icône est dessinée sur une grille de cases (12 × 12 pour le grand set, 8 × 8 pour le petit),
// dans Figma à 2 px par case. `offset` vaut [ox, oy] : 1 quand le dessin est décalé d'une
// demi-case vers la droite (ox) ou vers le bas (oy) — c'est ce qui centre une tige d'une case.
//
// Règle de calage : toute taille par pas de 4 de 12 à 64 est acceptée ; on affiche la plus grande
// version nette qui tient, centrée. Une case mesure toujours un nombre entier de pixels.

export const SIZES = Array.from({ length: 14 }, (_, i) => 12 + i * 4);

/** La version affichée pour une taille : quel set, et combien de pixels par case. */
export function pick(size, hasPetit) {
  if (!SIZES.includes(size)) throw new Error(`taille ${size} : un multiple de 4 entre 12 et 64`);
  if (size >= 16 && size <= 20 && hasPetit) return { set: "petit", k: 2 };
  if (size < 24) return { set: "grand", k: 1 };
  return { set: "grand", k: Math.floor(size / 12) };
}

/** Le tracé SVG d'une icône à `k` px par case, posé dans une boîte de `size` px. */
export function path(icon, k, size) {
  const n = icon.rows.length;
  const base = (size - n * k) / 2;
  // Demi-case exacte quand k est pair ; sinon l'entier inférieur, il reste 0,5 px.
  const dx = base + icon.offset[0] * Math.floor(k / 2);
  const dy = base + icon.offset[1] * Math.floor(k / 2);
  let d = "";
  icon.rows.forEach((row, y) => {
    for (const m of row.matchAll(/#+/g)) {
      const w = m[0].length * k;
      d += `M${dx + m.index * k} ${dy + y * k}h${w}v${k}h-${w}z`;
    }
  });
  return d;
}

/** Le SVG complet d'une icône à une taille donnée. `sets` = { grand, petit }. */
export function svg(name, size, sets, attrs = "") {
  const hasPetit = Boolean(sets.petit?.[name]);
  const { set, k } = pick(size, hasPetit);
  const icon = sets[set][name];
  if (!icon) throw new Error(`icône inconnue : ${name}`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true"${attrs}><path d="${path(icon, k, size)}"/></svg>`;
}
