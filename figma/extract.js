// Neume — extraction des icônes depuis Figma, à exécuter tel quel dans le contexte du plugin
// (figma_execute via le Desktop Bridge). Aucun jeton : on lit le fichier ouvert.
//
// Pages lues : « 24px » (grand, 12 × 12 cases) et « 16px » (petit, 8 × 8 cases). Une case = 2 × 2 px.
// Chaque cadre est rastérisé au pixel (test du centre de chaque pixel), puis réduit en cases :
// tous les blocs doivent tomber sur la même parité (ox, oy ∈ {0, 1}) et être pleins ou vides.
// Sortie compacte : { grand: [[nom, ox, oy, hex]], petit: [...], issues: [...] }, hex = lignes de
// cases, 3 caractères par ligne en 12 × 12, 2 en 8 × 8. `scripts/ingest.mjs` la transforme en
// fichiers lisibles dans icons/.

const SETS = [
  { key: "grand", page: "24px", px: 24, cells: 12 },
  { key: "petit", page: "16px", px: 16, cells: 8 },
];

function polys(d) {
  // vectorPaths de Figma : commandes absolues M L H V Z (C/Q signalées comme courbes).
  const out = [];
  let cur = null, x = 0, y = 0, curved = false;
  const t = d.match(/[MLHVCQZ]|-?\d*\.?\d+(?:e-?\d+)?/gi);
  for (let i = 0; i < t.length; ) {
    const c = t[i++];
    const n = () => parseFloat(t[i++]);
    if (c === "M") { cur = []; out.push(cur); x = n(); y = n(); cur.push([x, y]); }
    else if (c === "L") { x = n(); y = n(); cur.push([x, y]); }
    else if (c === "H") { x = n(); cur.push([x, y]); }
    else if (c === "V") { y = n(); cur.push([x, y]); }
    else if (c === "C") { curved = true; i += 4; x = n(); y = n(); cur.push([x, y]); }
    else if (c === "Q") { curved = true; i += 2; x = n(); y = n(); cur.push([x, y]); }
    else if (c === "Z" || c === "z") { /* fermeture implicite */ }
  }
  return { out, curved };
}

function inside(polysList, px, py, evenodd) {
  let w = 0;
  for (const p of polysList) for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i], [xj, yj] = p[j];
    if ((yi > py) !== (yj > py)) {
      const xc = xi + ((py - yi) * (xj - xi)) / (yj - yi);
      if (px < xc) w += yj > yi ? 1 : -1;
    }
  }
  return evenodd ? w % 2 !== 0 : w !== 0;
}

const isBlack = (fills) =>
  fills !== figma.mixed && fills.filter((f) => f.visible !== false).every((f) =>
    f.type === "SOLID" && f.color.r === 0 && f.color.g === 0 && f.color.b === 0 && (f.opacity ?? 1) === 1);

await figma.loadAllPagesAsync();
const result = { issues: [] };
for (const s of SETS) {
  const page = figma.root.children.find((p) => p.name === s.page);
  if (!page) { result.issues.push(`page « ${s.page} » absente`); continue; }
  const frames = page.children.filter((n) => n.type === "FRAME")
    .sort((a, b) => (a.y - b.y) || (a.x - b.x));
  const list = [];
  for (const f of frames) {
    const bad = (m) => result.issues.push(`${s.page} / ${f.name} : ${m}`);
    if (f.width !== s.px || f.height !== s.px) { bad(`cadre ${f.width} × ${f.height}`); continue; }
    const fx = f.absoluteTransform[0][2], fy = f.absoluteTransform[1][2];
    const leaves = f.findAll((n) => n.visible && !("children" in n));
    if (f.findAll((n) => n.type === "BOOLEAN_OPERATION").length) bad("opération booléenne : aplatis-la");
    const shapes = [];
    for (const n of leaves) {
      const m = n.absoluteTransform;
      if (Math.abs(m[0][0] - 1) > 1e-6 || Math.abs(m[1][1] - 1) > 1e-6 || m[0][1] || m[1][0]) { bad(`${n.name} pivoté ou mis à l'échelle`); continue; }
      if (n.strokes && n.strokes.some((st) => st.visible !== false) && n.strokeWeight > 0) bad(`${n.name} a un contour : utilise des formes pleines`);
      if (!("fills" in n) || !isBlack(n.fills)) { bad(`${n.name} n'est pas en noir plein`); continue; }
      if ((n.opacity ?? 1) !== 1) bad(`${n.name} a une opacité`);
      const ox = m[0][2] - fx, oy = m[1][2] - fy;
      if (n.type === "RECTANGLE") {
        if (n.cornerRadius) bad(`${n.name} a un arrondi`);
        shapes.push({ rect: [ox, oy, n.width, n.height] });
      } else if (n.type === "VECTOR") {
        for (const vp of n.vectorPaths) {
          const { out, curved } = polys(vp.data);
          if (curved) bad(`${n.name} contient une courbe`);
          shapes.push({ polys: out.map((p) => p.map(([x, y]) => [x + ox, y + oy])), evenodd: vp.windingRule === "EVENODD" });
        }
      } else bad(`${n.name} : type ${n.type} non lu`);
    }
    // Raster au pixel
    const px = [];
    for (let y = 0; y < s.px; y++) { const row = []; for (let x = 0; x < s.px; x++) {
      const cx = x + 0.5, cy = y + 0.5;
      row.push(shapes.some((sh) => sh.rect
        ? cx > sh.rect[0] && cx < sh.rect[0] + sh.rect[2] && cy > sh.rect[1] && cy < sh.rect[1] + sh.rect[3]
        : inside(sh.polys, cx, cy, sh.evenodd)) ? 1 : 0);
    } px.push(row); }
    // Parité : premier pixel plein trouvé en colonne et en ligne
    let minX = s.px, minY = s.px;
    px.forEach((r, y) => r.forEach((v, x) => { if (v) { minX = Math.min(minX, x); minY = Math.min(minY, y); } }));
    if (minX === s.px) { bad("cadre vide"); continue; }
    const ox = minX % 2, oy = minY % 2;
    const at = (x, y) => (x >= 0 && y >= 0 && x < s.px && y < s.px ? px[y][x] : 0);
    const cells = [];
    let broken = false;
    for (let cy = 0; cy < s.cells; cy++) { const row = []; for (let cx = 0; cx < s.cells; cx++) {
      const x = cx * 2 + ox, y = cy * 2 + oy;
      const sum = at(x, y) + at(x + 1, y) + at(x, y + 1) + at(x + 1, y + 1);
      if (sum !== 0 && sum !== 4) broken = true;
      row.push(sum === 4 ? 1 : 0);
    } cells.push(row); }
    // Aucun pixel plein hors des cases (bord de la parité impaire)
    const covered = cells.reduce((a, r) => a + r.reduce((b, v) => b + v, 0), 0) * 4;
    const total = px.reduce((a, r) => a + r.reduce((b, v) => b + v, 0), 0);
    if (broken || covered !== total) { bad("blocs hors grille ou parités mélangées"); continue; }
    const w = s.cells / 4;
    list.push([f.name, ox, oy, cells.map((r) => parseInt(r.join(""), 2).toString(16).padStart(w, "0")).join("")]);
  }
  result[s.key] = list;
}
return result;
