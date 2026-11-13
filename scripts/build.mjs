// node scripts/build.mjs — écrit les deux paquets (packages/svg, packages/react) et le zip du site depuis icons/*.json.
import { rmSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { generate, GENERATED } from "./generate.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
let files;
try {
  files = generate();
} catch (e) {
  console.error(`✗ ${e.message}`);
  process.exit(1);
}
for (const g of GENERATED) rmSync(root + g, { recursive: true, force: true });
for (const [p, content] of files) {
  mkdirSync(dirname(root + p), { recursive: true });
  writeFileSync(root + p, content);
}
console.log(`✓ ${files.size} fichiers générés (packages/svg, packages/react, site/public/neume-svg-24.zip).`);
