// node scripts/sheet.mjs — la planche de contrôle : chaque icône à chaque taille, de 12 à 64.
// Une page autonome (sheet/index.html) : les données et le code de rendu de packages/svg/src/render.js y sont
// recopiés tels quels, pour qu'elle s'ouvre sans serveur et montre exactement ce que le paquet rendra.

import { readFileSync, writeFileSync } from "node:fs";
import { read } from "../src/io.js";

const render = readFileSync(new URL("../packages/svg/src/render.js", import.meta.url), "utf8").replace(/^export /gm, "");
const data = JSON.stringify({ grand: read("grand"), petit: read("petit") });

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Neume — planche</title>
<style>
  :root { --bg: #fff; --fg: #000; --muted: #8a8a8a; --box: #f1f1f1; --line: #e6e6e6; }
  :root[data-theme="dark"] { --bg: #0b0b0b; --fg: #fff; --muted: #777; --box: #1c1c1c; --line: #222; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--fg); font: 13px/1.4 ui-monospace, "Geist Mono", Menlo, monospace; }
  header { border-bottom: 1px solid var(--line); padding: 16px 24px; display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
  h1 { font-size: 13px; margin: 0; font-weight: 600; }
  .count { color: var(--muted); }
  input[type=search] { font: inherit; padding: 6px 8px; border: 1px solid var(--line); background: var(--bg); color: var(--fg); width: 200px; }
  label { color: var(--muted); display: flex; gap: 6px; align-items: center; cursor: pointer; }
  main { padding: 8px 24px 64px; overflow-x: auto; }
  table { border-collapse: collapse; }
  th { font-weight: 400; color: var(--muted); text-align: center; padding: 12px 6px; position: sticky; top: 0; background: var(--bg); z-index: 1; }
  th:first-child, td:first-child { text-align: left; padding-right: 24px; white-space: nowrap; }
  td { padding: 6px; text-align: center; vertical-align: middle; border-top: 1px solid var(--line); }
  .cell { display: inline-block; line-height: 0; }
  .boxes .cell { background: var(--box); }
  .tag { color: var(--muted); font-size: 11px; display: block; margin-top: 4px; }
  .tag[hidden] { display: none; }
  .none { color: var(--muted); }
  h2 { font-size: 13px; font-weight: 600; margin: 32px 0 0; }
</style>
</head>
<body class="boxes">
<header>
  <h1>Neume</h1><span class="count" id="count"></span>
  <input type="search" id="q" placeholder="Filtrer" aria-label="Filtrer les icônes">
  <label><input type="checkbox" id="boxes" checked> Boîte</label>
  <label><input type="checkbox" id="tags"> Version affichée</label>
  <label><input type="checkbox" id="dark"> Sombre</label>
</header>
<main><table id="t"></table></main>
<script>
${render}
const DATA = ${data};
const names = [...new Set([...Object.keys(DATA.grand), ...Object.keys(DATA.petit)])];
const t = document.getElementById("t");
document.getElementById("count").textContent = Object.keys(DATA.grand).length + " en 12 × 12 · " + Object.keys(DATA.petit).length + " en 8 × 8";
let head = "<thead><tr><th>icône</th>" + SIZES.map((s) => "<th>" + s + "</th>").join("") + "</tr></thead><tbody>";
for (const name of names) {
  head += '<tr data-name="' + name + '"><td>' + name + "</td>";
  for (const s of SIZES) {
    const p = pick(s, Boolean(DATA.petit[name]));
    const icon = DATA[p.set][name];
    if (!icon) { head += '<td class="none">—</td>'; continue; }
    head += '<td><span class="cell" style="width:' + s + "px;height:" + s + 'px">' +
      '<svg width="' + s + '" height="' + s + '" viewBox="0 0 ' + s + " " + s + '" fill="currentColor" shape-rendering="crispEdges"><path d="' + path(icon, p.k, s) + '"/></svg></span>' +
      '<span class="tag" hidden>' + (p.set === "petit" ? "8" : "12") + "×" + p.k + "</span></td>";
  }
  head += "</tr>";
}
t.innerHTML = head + "</tbody>";
document.getElementById("q").addEventListener("input", (e) => {
  const q = e.target.value.trim().toLowerCase();
  for (const tr of t.tBodies[0].rows) tr.hidden = q && !tr.dataset.name.includes(q);
});
document.getElementById("boxes").addEventListener("change", (e) => document.body.classList.toggle("boxes", e.target.checked));
document.getElementById("tags").addEventListener("change", (e) => document.querySelectorAll(".tag").forEach((el) => (el.hidden = !e.target.checked)));
document.getElementById("dark").addEventListener("change", (e) => (document.documentElement.dataset.theme = e.target.checked ? "dark" : ""));
</script>
</body>
</html>
`;
writeFileSync(new URL("../sheet/index.html", import.meta.url), html);
console.log("sheet/index.html écrite.");
