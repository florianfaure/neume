import type { Metadata } from "next";
import { Docs } from "./docs";

// La page Docs de neume.dev : spec docs/specs/2026-11-13-page-docs-design.md.

const title = "Docs — Neume";
const description = "Install Neume, use it in React or as plain SVG, and learn how its sizes work.";

// L'image de partage du site (`app/opengraph-image.png`, 1200 × 630). Redéfinir `openGraph` et `twitter`
// remplace ceux du layout en entier, image comprise : elle est donc redite ici, avec son texte alternatif
// (`app/opengraph-image.alt.txt`).
const image = {
  url: "/opengraph-image.png",
  width: 1200,
  height: 630,
  type: "image/png",
  alt: "Neume: pixel icons for real interfaces.",
};

// Les champs de partage sont redits ici : sans eux, /docs hériterait de l'`og:url` et des titres de
// l'accueil (layout), et un lien partagé ouvrirait la carte de l'accueil.
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/docs" },
  openGraph: { type: "website", siteName: "Neume", url: "/docs", title, description, images: [image] },
  twitter: { card: "summary_large_image", title, description, images: [image] },
};

export default function DocsPage() {
  return <Docs />;
}
