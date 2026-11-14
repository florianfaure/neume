import type { ReactNode } from "react";

/**
 * Les sections de la page Docs, dans l'ordre : l'`id` est l'ancre (et la cible du sommaire), le
 * `label` le titre. Le README renvoie à ces ancres (`https://neume.dev/docs#<id>`) : en changer une,
 * c'est casser un lien.
 */
export const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "install", label: "Install" },
  { id: "react", label: "React" },
  { id: "svg", label: "Plain SVG" },
  { id: "solid", label: "Solid icons" },
  { id: "sizes", label: "Sizes" },
  { id: "centring", label: "Centring" },
  { id: "colour-and-accessibility", label: "Colour and accessibility" },
  { id: "versions", label: "Versions" },
  { id: "requests", label: "Requests" },
  { id: "about", label: "About Neume" },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];

/**
 * Une section : son titre en Pixelify, comme les sections de l'accueil, et de l'air entre les blocs.
 * L'`id` et le `h2` focusable (`tabIndex={-1}`) sont ce que `TableOfContents` attend de son appelant ;
 * `scroll-mt-24` fait arriver l'ancre sous la barre.
 */
export function Section({ id, children }: { id: SectionId; children: ReactNode }) {
  const label = SECTIONS.find((s) => s.id === id)!.label;
  return (
    <section
      id={id}
      className="flex max-w-[var(--site-docs-copy-width)] scroll-mt-24 flex-col gap-6"
    >
      <h2 tabIndex={-1} className="font-pixel text-h2 font-normal text-text-primary">
        {label}
      </h2>
      {children}
    </section>
  );
}

/** Un sous-titre de section, à l'échelle des groupes du catalogue de l'accueil. */
export function H3({ children }: { children: ReactNode }) {
  return (
    <h3 className="mt-6 font-pixel text-body-lg font-normal text-text-primary">{children}</h3>
  );
}

export function P({ children }: { children: ReactNode }) {
  return (
    <p className="max-w-[var(--site-docs-copy-width)] text-body text-text-secondary">{children}</p>
  );
}

export function Ul({ children }: { children: ReactNode }) {
  return (
    <ul className="flex max-w-[var(--site-docs-copy-width)] list-disc flex-col gap-2 pl-5 text-body text-text-secondary marker:text-text-tertiary">
      {children}
    </ul>
  );
}
