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
  /** Ce que la version montre en image : la même icône avant / après, un échantillon du set, ou des icônes à côté de leur version solide. */
  figure?: "before-after" | "sample" | "solid";
};

export const RELEASES: Release[] = [
  {
    version: "1.0.0",
    date: "2026-11-14",
    title: "A solid version of every icon",
    summary:
      "Every icon now has a solid version, drawn square by square on the same 12 × 12 grid. It carries the icon’s name followed by -solid: star-solid, <StarSolid />, star-solid.svg.",
    changes: [
      "248 solid icons, one for each icon, in both packages and in the zip of SVG files.",
      "@neume-icons/svg: svg(\"star-solid\", 24), the files dist/24/star-solid.svg, and the solid table under @neume-icons/svg/data.",
      "@neume-icons/react: a component for each, the PascalCase name followed by Solid: StarSolid, ArrowUpSolid.",
      "Breaking: star-filled, sun-filled and moon-filled are removed. Use star-solid, sun-solid and moon-solid.",
    ],
    figure: "solid",
  },
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
