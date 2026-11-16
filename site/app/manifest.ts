import type { MetadataRoute } from "next";
import { SITE_NAME } from "./_shell/seo";

// Export statique : le fichier est écrit au build (`out/manifest.webmanifest`).
export const dynamic = "force-static";

/** Le nom du site et ses icônes (celles de `scripts/brand-assets.mjs`) pour qui l'épingle ou l'installe. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — pixel icons for real interfaces`,
    short_name: SITE_NAME,
    description: "A pixel icon set drawn square by square, shipped as SVG and React.",
    start_url: "/",
    display: "browser",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
