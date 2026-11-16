import type { MetadataRoute } from "next";
import { SITE_URL } from "./_shell/seo";

// Export statique : le fichier est écrit au build (`out/robots.txt`).
export const dynamic = "force-static";

/**
 * Tout le site se lit, sauf `/api/` (la demande d'icône, le seul chemin où le Worker exécute du code).
 * Les previews `*.workers.dev` servent ce même fichier : c'est leur en-tête `X-Robots-Tag: noindex`
 * (`public/_headers`) qui les tient hors des résultats.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/api/" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
