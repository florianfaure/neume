// node scripts/version.mjs <x.y.z>            → met les deux paquets à cette version (et la dépendance
//                                               de react vers svg), puis relance le build.
// node scripts/version.mjs --assert <x.y.z>   → échoue si les paquets ne sont pas à cette version
//                                               (utilisé par .github/workflows/release.yml).
// Les deux paquets sortent toujours ensemble, à la même version.

import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const files = ["svg", "react"].map((p) => new URL(`../packages/${p}/package.json`, import.meta.url));
const read = (f) => JSON.parse(readFileSync(f, "utf8"));
const args = process.argv.slice(2);
const assert = args[0] === "--assert";
const v = assert ? args[1] : args[0];
if (!/^\d+\.\d+\.\d+(-[0-9a-z.]+)?$/.test(v ?? "")) {
  console.error("Usage : node scripts/version.mjs [--assert] <x.y.z>");
  process.exit(1);
}

if (assert) {
  const pkgs = files.map(read);
  const dep = (p) => p.dependencies?.["@neume-icons/svg"];
  if (pkgs.some((p) => p.version !== v || (dep(p) && dep(p) !== `^${v}`))) {
    console.error(`✗ Le tag dit ${v}, les paquets disent : ${pkgs.map((p) => `${p.name}@${p.version}`).join(", ")}`);
    process.exit(1);
  }
  console.log(`✓ ${v}`);
} else {
  for (const f of files) {
    const p = read(f);
    p.version = v;
    if (p.dependencies?.["@neume-icons/svg"]) p.dependencies["@neume-icons/svg"] = `^${v}`;
    writeFileSync(f, JSON.stringify(p, null, 2) + "\n");
  }
  execSync("npm install --package-lock-only --silent && npm run -s build", { stdio: "inherit" });
  console.log(`Les deux paquets sont en ${v}. Commit, PR, fusion, puis une release GitHub « v${v} ».`);
}
