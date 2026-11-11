// node scripts/smoke.mjs — chaque icône React à chaque taille, rendue côté serveur.
// Vérifie le tracé (entiers, dans la boîte), son égalité avec le cœur et avec icons/*.json, le calage
// des tailles non valides et l'accessibilité.
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as Icons from "@neume-icons/react";
import { svg, names, SIZES } from "@neume-icons/svg";
import { path, pick } from "@neume-icons/svg/render";
import { read } from "../src/io.js";
import { pascal } from "./generate.mjs";

const errors = [];
const fail = (m) => errors.push(m);
const D = /<path d="([^"]*)"/;
const grab = (html, re) => html.match(re)?.[1];

const json = { grand: read("grand"), petit: read("petit") };
const origWarn = console.warn;
console.warn = () => {}; // les tailles non valides du test préviennent en dev ; on les compte plus bas

let count = 0;
for (const name of names) {
  const Icon = Icons[pascal(name)];
  if (!Icon) { fail(`${name} : composant ${pascal(name)} absent de l'index`); continue; }
  for (const size of SIZES) {
    const at = `${name} @ ${size}`;
    const html = renderToStaticMarkup(createElement(Icon, { size }));
    const d = grab(html, D);
    count++;
    if (d === undefined) { fail(`${at} : pas de <path>`); continue; }
    if (!/^(M\d+ \d+h\d+v\d+h-\d+z)+$/.test(d)) { fail(`${at} : le tracé n'est pas fait que d'entiers`); continue; }
    for (const [, x, y, w, k] of d.matchAll(/M(\d+) (\d+)h(\d+)v(\d+)h/g)) {
      if (+x < 0 || +y < 0 || +x + +w > size || +y + +k > size) { fail(`${at} : rectangle hors de [0, ${size}]`); break; }
    }
    // Égalité avec le cœur (données compactes) et avec les lignes du JSON source (chemin indépendant).
    if (d !== grab(svg(name, size), D)) fail(`${at} : le rendu React diffère de svg() du cœur`);
    const p = pick(size, Boolean(json.petit[name]));
    if (d !== path(json[p.set][name], p.k, size)) fail(`${at} : le rendu diffère du tracé calculé depuis icons/${p.set}.json`);
    for (const a of ['width="' + size + '"', 'height="' + size + '"', 'viewBox="0 0 ' + size + " " + size + '"', 'fill="currentColor"', 'shape-rendering="crispEdges"'])
      if (!html.includes(a)) fail(`${at} : attribut ${a} manquant`);
  }
  // Les SVG livrés dans dist/ sont ceux du cœur.
  for (const size of [12, 16, 24]) {
    const file = readFileSync(new URL(`../packages/svg/dist/${size}/${name}.svg`, import.meta.url), "utf8");
    if (file !== svg(name, size) + "\n") fail(`${name} : dist/${size}/${name}.svg diffère de svg()`);
  }
}

// Tailles non valides : arrondies vers le bas, bornées à 12–64.
const Arrow = Icons.ArrowUp;
for (const [asked, shown] of [[30, 28], [70, 64], [5, 12], [24, 24], [65, 64], [11.9, 12], [27.5, 24]]) {
  const html = renderToStaticMarkup(createElement(Arrow, { size: asked }));
  if (!html.includes(`width="${shown}"`) || !html.includes(`viewBox="0 0 ${shown} ${shown}"`)) fail(`size ${asked} : attendu ${shown}`);
}
if (!renderToStaticMarkup(createElement(Arrow)).includes('width="24"')) fail("taille par défaut : attendu 24");

// Avertissement unique en développement.
const warnings = [];
console.warn = (m) => warnings.push(m);
for (const s of [31, 31, 31]) renderToStaticMarkup(createElement(Icons.Plus, { size: s }));
if (warnings.length !== 1) fail(`avertissement de taille : ${warnings.length} message(s) pour la même taille, attendu 1`);
console.warn = origWarn;

// Accessibilité : décorative sans title, nommée avec.
const deco = renderToStaticMarkup(createElement(Icons.X));
if (!deco.includes('aria-hidden="true"') || !deco.includes('focusable="false"') || deco.includes("<title") || deco.includes("role=")) fail("sans title : aria-hidden/focusable attendus, ni role ni <title>");
const named = renderToStaticMarkup(createElement(Icons.X, { title: "Close", className: "c", style: { color: "red" }, "data-x": "1" }));
const id = grab(named, /aria-labelledby="([^"]+)"/);
if (!named.includes('role="img"') || !id || !named.includes(`<title id="${id}">Close</title>`) || named.includes("aria-hidden")) fail("avec title : role=img, <title> et aria-labelledby attendus");
if (!named.includes('class="c"') || !named.includes("color:red") || !named.includes('data-x="1"')) fail("className, style et props SVG doivent passer");

if (errors.length) { for (const e of errors.slice(0, 40)) console.error(`✗ ${e}`); console.error(`\n${errors.length} erreur(s) au smoke test.`); process.exit(1); }
console.log(`✓ smoke : ${names.length} icônes × ${SIZES.length} tailles (${count} rendus React) — entiers, dans la boîte, identiques au cœur.`);
