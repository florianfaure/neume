// node scripts/check.mjs — le vérificateur. Rouge : rien ne sort.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { SETS, read } from "../src/io.js";
import { generate, GENERATED, solidName } from "./generate.mjs";
import { SIZES, pick, path, snap } from "../packages/svg/src/render.js";

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
    // Le rendu n'utilise que le grand set. Aux tailles où k est entier le tracé est net (aucun demi-pixel) ;
    // ailleurs il est lissé, et doit seulement rester dans la boîte.
    if (set !== "petit") for (const size of SIZES) {
      const { k } = pick(size);
      const d = path(icon, k, size);
      if (Number.isInteger(k)) { if (/\./.test(d)) errors.push(`${at} : demi-pixel à ${size} px`); }
      for (const [, x, y, w, h] of d.matchAll(/M([\d.]+) ([\d.]+)h([\d.]+)v([\d.]+)h/g)) {
        if (+x < -1e-9 || +y < -1e-9 || +x + +w > size + 1e-9 || +y + +h > size + 1e-9) { errors.push(`${at} : tracé hors de la boîte à ${size} px`); break; }
      }
    }
  }
}
for (const name of Object.keys(sets.petit)) if (!sets.grand[name]) warn.push(`petit / ${name} : pas de version 12 × 12`);
// Une version solide par icône, sous le même nom (generate le refuse aussi ; ici, avec le détail).
for (const name of Object.keys(sets.grand)) if (!sets.solid[name]) errors.push(`${name} : pas de version solide (page « 24px solid »)`);
for (const name of Object.keys(sets.solid)) if (!sets.grand[name]) errors.push(`solid / ${name} : pas d'icône de base du même nom`);

// Auto-test de la table de calage : le grand dessin partout, k = taille / 12.
const expect = { 12: 1, 16: 4 / 3, 24: 2, 36: 3, 48: 4, 60: 5, 64: 16 / 3 };
for (const [s, e] of Object.entries(expect)) { const p = pick(+s, true); if (p.set !== "grand" || Math.abs(p.k - e) > 1e-12) errors.push(`calage : ${s} px donne ${p.set} ×${p.k}, attendu grand ×${e}`); }
if (pick(16, false).set !== "grand" || pick(16, false).k !== 16 / 12) errors.push("calage : le second argument de pick doit être ignoré");
try { pick(30); errors.push("calage : 30 px doit être refusé"); } catch {}

// Calage des tailles quelconques : vers le bas, bornées à 12–64.
for (const [a, e] of [[30, 28], [70, 64], [5, 12], [12, 12], [64, 64], [65, 64], [11.9, 12]]) if (snap(a) !== e) errors.push(`snap : ${a} donne ${snap(a)}, attendu ${e}`);

// Les paquets générés doivent être à jour : `npm run build` ne doit rien changer.
let files;
try { files = generate(); } catch (e) { for (const m of e.message.split("\n")) console.error(`✗ ${m}`); process.exit(1); }
for (const [p, content] of files) {
  const f = new URL(`../${p}`, import.meta.url);
  if (!existsSync(f)) errors.push(`${p} : manquant — lancer npm run build`);
  else if (Buffer.isBuffer(content) ? !readFileSync(f).equals(content) : readFileSync(f, "utf8") !== content) errors.push(`${p} : périmé — lancer npm run build`);
}
const walk = (dir) => !existsSync(dir) ? [] : statSync(dir).isFile() ? [dir] : readdirSync(dir).flatMap((e) => walk(join(dir, e)));
const root = fileURLToPath(new URL("../", import.meta.url));
for (const g of GENERATED) for (const f of walk(join(root, g))) { const rel = relative(root, f); if (!files.has(rel)) errors.push(`${rel} : ne devrait plus exister — lancer npm run build`); }

// Le zip de la page Docs, lu comme le lirait un outil d'archive : chaque icône et sa version solide à 24 px, à plat, stockées telles quelles.
{
  const ZIP = "site/public/neume-svg-24.zip";
  const bad = (m) => errors.push(`${ZIP} : ${m} — lancer npm run build`);
  const f = new URL(`../${ZIP}`, import.meta.url);
  if (!existsSync(f)) bad("manquant");
  else {
    const z = readFileSync(f);
    const eocd = z.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
    if (z.readUInt32LE(0) !== 0x04034b50 || eocd < 0) bad("pas une archive zip");
    else {
      const expected = Object.keys(sets.grand).flatMap((n) => [`${n}.svg`, `${solidName(n)}.svg`]).sort();
      const total = z.readUInt16LE(eocd + 10);
      if (total !== expected.length) bad(`${total} entrées, attendu ${expected.length}`);
      const seen = [];
      let p = z.readUInt32LE(eocd + 16);
      for (let i = 0; i < total; i++) {
        if (z.readUInt32LE(p) !== 0x02014b50) { bad("répertoire central illisible"); break; }
        const method = z.readUInt16LE(p + 10), size = z.readUInt32LE(p + 24);
        const nameLen = z.readUInt16LE(p + 28), extraLen = z.readUInt16LE(p + 30), commentLen = z.readUInt16LE(p + 32);
        const local = z.readUInt32LE(p + 42);
        const name = z.toString("utf8", p + 46, p + 46 + nameLen);
        seen.push(name);
        if (method !== 0) bad(`${name} : compressé, attendu stocké`);
        const start = local + 30 + z.readUInt16LE(local + 26) + z.readUInt16LE(local + 28);
        const disk = new URL(`../packages/svg/dist/24/${name}`, import.meta.url);
        if (!existsSync(disk) || !z.subarray(start, start + size).equals(readFileSync(disk))) bad(`${name} : différent de packages/svg/dist/24`);
        p += 46 + nameLen + extraLen + commentLen;
      }
      if (seen.join() !== [...seen].sort().join() || [...seen].sort().join() !== expected.join()) bad("les noms ne sont pas ceux des icônes, triés");
    }
  }
}

for (const w of warn) console.log(`· ${w}`);
if (errors.length) { for (const e of errors) console.error(`✗ ${e}`); console.error(`\n${errors.length} erreur(s).`); process.exit(1); }
console.log(`✓ ${Object.keys(sets.grand).length} icônes 12 × 12 et leurs ${Object.keys(sets.solid).length} versions solides, ${Object.keys(sets.petit).length} icônes 8 × 8 (hors rendu) — net aux multiples de 12, lissé entre.`);
console.log(`✓ ${files.size} fichiers générés à jour.`);
