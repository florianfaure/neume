/**
 * Les versions de Neume, la plus récente d'abord. Les deux paquets sortent toujours ensemble, à la même
 * version : une entrée vaut pour `@neume-icons/svg` et `@neume-icons/react`. Dates de publication sur npm.
 * Une version sortie s'ajoute ici, dans le même lot que `npm run version`.
 */
export type Release = {
  version: string;
  /** ISO, jour de publication sur npm. */
  date: string;
  title: string;
  summary: string;
  changes: string[];
  /** Ce que la version montre en image : la même icône avant / après, ou un échantillon du set. */
  figure?: "before-after" | "sample";
};

export const RELEASES: Release[] = [
  {
    version: "0.2.0",
    date: "2026-11-12",
    title: "One drawing at every size",
    summary:
      "Every icon now uses its 12 × 12 drawing at every size, scaled by exactly size / 12. An icon fills the size you ask for, instead of the largest crisp version that fits inside it.",
    changes: [
      "Crisp at 12, 24, 36, 48 and 60 px, smoothed in between, with the stroke in the same proportion at every size.",
      "The 8 × 8 drawings are no longer used at 16 and 20 px: one drawing, one look, from 12 to 64 px.",
      "Stems stay centred at every size except 12, 36 and 60 px, where they sit half a pixel off to stay sharp.",
    ],
    figure: "before-after",
  },
  {
    version: "0.1.0",
    date: "2026-11-11",
    title: "First release",
    summary:
      "251 icons drawn cell by cell on a 12 × 12 grid, shipped as React components and as plain SVG.",
    changes: [
      "@neume-icons/react: one component per icon, with size and title props.",
      "@neume-icons/svg: svg(), names and ready-made files at 12, 16 and 24 px.",
      "Sizes from 12 to 64 px in steps of 4, each showing the largest crisp version that fits.",
      "228 icons also drawn on an 8 × 8 grid, for 16 and 20 px.",
    ],
    figure: "sample",
  },
];
