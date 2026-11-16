import { Docs } from "./docs";
import { docsJsonLd, jsonLdText, pageMetadata } from "../_shell/seo";

// La page Docs de neume.dev : spec docs/specs/2026-11-13-page-docs-design.md.

const title = "Docs: pixel icons in React or as plain SVG — Neume";
const description =
  "Install the Neume pixel icons from npm, use them as React components or plain SVG files, and learn how sizes, solid icons, colour and accessibility work.";

export const metadata = pageMetadata({ title, description, path: "/docs" });

export default function DocsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdText(docsJsonLd({ title, description })) }}
      />
      <Docs />
    </>
  );
}
