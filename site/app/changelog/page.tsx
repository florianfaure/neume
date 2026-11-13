import type { Metadata } from "next";
import { Changelog } from "./changelog";

const title = "Changelog — Neume";
const description = "Every release of Neume, the pixel icon set: what changed, and when.";

// Comme /docs : redéfinir `openGraph` et `twitter` remplace ceux du layout en entier, image comprise.
const image = {
  url: "/opengraph-image.png",
  width: 1200,
  height: 630,
  type: "image/png",
  alt: "Neume: pixel icons for real interfaces.",
};

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/changelog" },
  openGraph: { type: "website", siteName: "Neume", url: "/changelog", title, description, images: [image] },
  twitter: { card: "summary_large_image", title, description, images: [image] },
};

export default function ChangelogPage() {
  return <Changelog />;
}
