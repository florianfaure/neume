import type { Metadata } from "next";
import { Docs } from "./docs";

// La page Docs de neume.dev : spec docs/specs/2026-11-13-page-docs-design.md.

export const metadata: Metadata = {
  title: "Docs — Neume",
  description: "Install Neume, use it in React or as plain SVG, and learn how its sizes work.",
  alternates: { canonical: "/docs" },
};

export default function DocsPage() {
  return <Docs />;
}
