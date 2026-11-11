#!/usr/bin/env node
// Copie les fichiers du portfolio vers site/, à l'identique (octet pour octet).
//
//   node scripts/copy-from-portfolio.mjs [chemin-du-portfolio]          refait la copie
//   node scripts/copy-from-portfolio.mjs [chemin-du-portfolio] --check  échoue si une copie diffère
//
// Chemin par défaut : $PORTFOLIO_PATH, sinon /Users/florianfaure/portfolio. Le mode --check, sans
// portfolio présent sur la machine (CI), saute proprement avec un avertissement.
// Règle (site/COPIES.md) : on ne modifie jamais une copie ici, on corrige dans le portfolio puis on recopie.
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Le même chemin à la source et à l'arrivée, sauf indication contraire.
export const COPIES = [
  "styles/globals.css",
  "styles/tokens/primitives.css",
  "styles/tokens/semantic.css",
  "public/fonts/geist-latin.woff2",
  "public/fonts/geist-latin-ext.woff2",
  "public/fonts/geist-mono-latin.woff2",
  "public/fonts/pixelify-sans.woff2",
  "public/fonts/geist-OFL.txt",
  "public/fonts/geist-mono-OFL.txt",
  "public/fonts/pixelify-sans-OFL.txt",
  "lib/cn.ts",
  "lib/new-tab.tsx",
  "lib/shortcut.ts",
  "lib/toast.ts",
  "lib/use-copy-feedback.ts",
  "lib/use-keyboard-focus.ts",
  ...[
    "announcement", "button", "chip", "chip-group", "code-block", "command-palette", "copy-button",
    "dialog", "empty-state", "feature-card", "footer", "icon", "icon-sheet", "kbd", "list", "list-row",
    "nav-bar", "nav-item", "pixel-preview", "progress-bar", "reveal", "search-field", "segmented-track",
    "slider", "subscribe-form", "tab", "tag", "text-field", "theme-selector", "tile", "toaster",
    "toggle-button", "toggle-group", "tooltip",
  ].map((n) => `components/ui/${n}.tsx`),
];

const args = process.argv.slice(2);
const check = args.includes("--check");
const given = args.find((a) => !a.startsWith("--"));
const portfolio = resolve(given ?? process.env.PORTFOLIO_PATH ?? "/Users/florianfaure/portfolio");

if (!existsSync(portfolio)) {
  if (check) {
    console.warn(`copy-from-portfolio --check : portfolio introuvable (${portfolio}), contrôle sauté.`);
    process.exit(0);
  }
  console.error(`Portfolio introuvable : ${portfolio}`);
  process.exit(1);
}

let bad = 0;
for (const rel of COPIES) {
  const from = join(portfolio, rel);
  const to = join(SITE, rel);
  if (!existsSync(from)) {
    console.error(`SOURCE ABSENTE  ${rel}`);
    bad++;
    continue;
  }
  if (check) {
    if (!existsSync(to)) {
      console.error(`COPIE ABSENTE   ${rel}`);
      bad++;
    } else if (!readFileSync(from).equals(readFileSync(to))) {
      console.error(`DIFFÈRE         ${rel}`);
      bad++;
    }
  } else {
    mkdirSync(dirname(to), { recursive: true });
    copyFileSync(from, to);
  }
}

// Le dossier components/ui ne doit contenir que des copies déclarées.
if (check) {
  const dir = join(SITE, "components/ui");
  if (existsSync(dir)) {
    for (const f of readdirSync(dir)) {
      if (!COPIES.includes(`components/ui/${f}`)) {
        console.error(`NON DÉCLARÉ     components/ui/${f}`);
        bad++;
      }
    }
  }
}

if (check) {
  if (bad) {
    console.error(`\n${bad} écart(s). Corrige dans le portfolio puis relance sans --check.`);
    process.exit(1);
  }
  console.log(`copy-from-portfolio --check : ${COPIES.length} copies identiques à ${portfolio}.`);
} else if (bad) {
  process.exit(1);
} else {
  console.log(`${COPIES.length} fichiers copiés depuis ${portfolio}.`);
}
