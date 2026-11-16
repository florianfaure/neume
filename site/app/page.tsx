import { Home } from "./_home/home";
import { ICON_COUNT, homeJsonLd, jsonLdText, pageMetadata } from "./_shell/seo";

export const metadata = pageMetadata({
  title: "Pixel icons for React and SVG, free and open source — Neume",
  description: `Free, open source pixel icon set: ${ICON_COUNT} pixel art icons on a 12 × 12 grid, each with a solid version. MIT licensed, for React or as plain SVG.`,
  path: "/",
});

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdText(homeJsonLd()) }} />
      <Home />
    </>
  );
}
