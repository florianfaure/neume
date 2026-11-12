import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 réécrit un CLAUDE.md / AGENTS.md de boilerplate au lancement de `next dev` :
  // coupé, comme dans le portfolio.
  agentRules: false,

  // Site servi en statique par un Worker Cloudflare (assets = `out/`), comme le portfolio.
  // Pas de server action, de route handler dynamique, d'ISR ni de middleware.
  output: "export",
  images: { unoptimized: true },

  // `site` est un workspace du dépôt Neume : @neume-icons/react est un lien vers ../packages/react,
  // hors du dossier du site. Turbopack doit pouvoir lire jusqu'à la racine du dépôt.
  turbopack: { root: path.resolve(import.meta.dirname, "..") },
};

export default nextConfig;
