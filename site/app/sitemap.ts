import type { MetadataRoute } from "next";
import { SITE_URL } from "./_shell/seo";
import { RELEASES } from "./changelog/releases";

// Export statique : le fichier est écrit au build (`out/sitemap.xml`).
export const dynamic = "force-static";

/**
 * Les trois pages du site, aux adresses de leurs canoniques (sans barre finale, comme le Worker les
 * sert). L'accueil et le changelog changent avec chaque version : leur date est celle de la dernière
 * sortie (`releases.ts`). La doc n'a pas de date tenue : elle n'en déclare pas.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastRelease = new Date(`${RELEASES[0].date}T12:00:00Z`);
  return [
    { url: SITE_URL, lastModified: lastRelease },
    { url: `${SITE_URL}/docs` },
    { url: `${SITE_URL}/changelog`, lastModified: lastRelease },
  ];
}
