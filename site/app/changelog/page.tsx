import { Changelog } from "./changelog";
import { changelogJsonLd, jsonLdText, pageMetadata } from "../_shell/seo";

export const metadata = pageMetadata({
  title: "Changelog: every release of the pixel icon set — Neume",
  description:
    "Every release of Neume, the free and open source pixel icon set: new icons, changed drawings and breaking changes, version by version.",
  path: "/changelog",
});

export default function ChangelogPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdText(changelogJsonLd()) }} />
      <Changelog />
    </>
  );
}
