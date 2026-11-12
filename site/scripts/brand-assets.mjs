// Les images de marque de neume.dev, tirées du vecteur du signe (components/brand.tsx) et des icônes du
// paquet. Geste ponctuel, hors de `npm run check` : on relance quand le signe ou la composition change.
//
//   cd site && node scripts/brand-assets.mjs
//
// Écrit dans app/, où Next les branche tout seul dans le <head> (fichiers statiques, compatibles avec
// l'export) :
//   icon.svg                 le favicon : le signe seul, noir, blanc quand le système est sombre
//   favicon.ico              le repli des navigateurs sans favicon SVG : 16 et 32 px, sur un carré blanc
//   apple-icon.png           180 px, fond blanc (iOS arrondit lui-même les coins)
//   opengraph-image.png      1200 × 630 : le titre du hero sur le mur d'icônes, comme l'accueil
//   opengraph-image.alt.txt  son texte alternatif
//
// Le signe reste un vecteur à toutes les tailles, jamais une version pixel. L'image de partage est
// composée en HTML par Chrome headless, avec les vraies polices du site, puis encodée par sharp.

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { svg } from "@neume-icons/svg";
import sharp from "sharp";

const SITE = path.resolve(import.meta.dirname, "..");
const APP = path.join(SITE, "app");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const INK = "#0c0d0f";
const TERTIARY = "#6b6d71";

// Le tracé du signe, lu dans le composant pour qu'il n'en existe qu'une version. Sa boîte utile va de 12 à 84.
const brand = readFileSync(path.join(SITE, "components/brand.tsx"), "utf8");
const LOGO = brand.match(/<path d="([^"]+)"/)[1];

/** Le signe, `size` px de côté, centré dans un carré de `box` px, sur `bg` (aucun fond si absent). */
function markSvg({ box, size, bg, radius = 0 }) {
  const s = size / 72;
  const o = (box - size) / 2;
  const back = bg
    ? `<rect width="${box}" height="${box}" rx="${radius}" fill="${bg}"/>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${box}" height="${box}" viewBox="0 0 ${box} ${box}">${back}<path transform="translate(${o} ${o}) scale(${s}) translate(-12 -12)" fill="${INK}" d="${LOGO}"/></svg>`;
}

// 1. Le favicon SVG.
writeFileSync(
  path.join(APP, "icon.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="8 8 80 80"><style>path{fill:${INK}}@media (prefers-color-scheme:dark){path{fill:#fff}}</style><path d="${LOGO}"/></svg>\n`,
);

// 2. Le repli .ico : deux PNG emballés tels quels (le format ICO l'accepte depuis Windows Vista).
const png = (input) =>
  sharp(Buffer.from(input)).png({ compressionLevel: 9 }).toBuffer();
const sizes = [16, 32];
const pngs = await Promise.all(
  sizes.map((n) =>
    png(
      markSvg({
        box: n,
        size: Math.round(n * 0.75),
        bg: "#fff",
        radius: n * 0.1875,
      }),
    ),
  ),
);
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((n, i) => {
  const e = 6 + 16 * i;
  header.writeUInt8(n, e);
  header.writeUInt8(n, e + 1);
  header.writeUInt16LE(1, e + 4);
  header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(pngs[i].length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += pngs[i].length;
});
writeFileSync(path.join(APP, "favicon.ico"), Buffer.concat([header, ...pngs]));

// 3. L'icône Apple.
writeFileSync(
  path.join(APP, "apple-icon.png"),
  await png(markSvg({ box: 180, size: 108, bg: "#fff" })),
);

// 4. L'image de partage. Le mur reprend celui du hero (même pool, même gris, même opacité, même masque
// radial), à 36 px par icône — un multiple de 12, donc net — dans des cellules de 80 px.
const themes = readFileSync(path.join(SITE, "data/themes.ts"), "utf8");
const pool = [...themes.matchAll(/\["([^"]+)", "([^"]+)"\]/g)]
  .filter(([, title]) => title !== "Cursors" && title !== "Brands")
  .flatMap(([, , names]) => names.split(" "));
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const COLS = 15;
const ROWS = 8;
// Les quatre cellules du coin haut gauche restent vides : c'est la place du signe.
const UNDER_MARK = new Set([0, 1, COLS, COLS + 1]);
const cells = Array.from({ length: COLS * ROWS }, (_, i) =>
  UNDER_MARK.has(i)
    ? "<span></span>"
    : `<span>${svg(pool[Math.floor(rand() * pool.length)], 36)}</span>`,
);

const fonts = pathToFileURL(path.join(SITE, "public/fonts")).href;
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Pixelify; src: url(${fonts}/pixelify-sans.woff2) format("woff2"); font-weight: 400 700; }
* { margin: 0; box-sizing: border-box; }
html, body { width: 1200px; height: 630px; overflow: hidden; background: #fff; }
.wall { position: absolute; inset: -5px 0; display: grid; grid-template-columns: repeat(${COLS}, 80px);
  grid-auto-rows: 80px; color: ${TERTIARY};
  mask-image: radial-gradient(60% 70%, transparent 30%, #000 75%); }
.wall span { display: flex; align-items: center; justify-content: center; opacity: 0.32; }
.wall svg { display: block; }
h1 { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; text-align: center;
  font: 400 96px/104px Pixelify; letter-spacing: -1.92px; color: ${INK}; }
.mark { position: absolute; left: 56px; top: 51px; }
</style></head><body>
<div class="wall">${cells.join("")}</div>
<h1>Pixel icons for<br>real interfaces</h1>
<div class="mark">${markSvg({ box: 48, size: 48 })}</div>
</body></html>`;

const tmp = mkdtempSync(path.join(tmpdir(), "neume-og-"));
try {
  const page = path.join(tmp, "og.html");
  const shot = path.join(tmp, "og.png");
  writeFileSync(page, html);
  execFileSync(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      "--window-size=1200,630",
      "--virtual-time-budget=2000",
      `--screenshot=${shot}`,
      pathToFileURL(page).href,
    ],
    { stdio: "ignore" },
  );
  await sharp(shot)
    .resize(1200, 630)
    .png({ compressionLevel: 9, palette: true })
    .toFile(path.join(APP, "opengraph-image.png"));
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
writeFileSync(
  path.join(APP, "opengraph-image.alt.txt"),
  "Neume: pixel icons for real interfaces.",
);

console.log(
  "brand-assets : icon.svg, favicon.ico, apple-icon.png, opengraph-image.png écrits dans app/.",
);
