import * as Icons from "@neume-icons/react";
import type { Icon as NeumeIconComponent } from "@neume-icons/react";
import { svg as renderSvg } from "@neume-icons/svg";
import { grand, solid } from "@neume-icons/svg/data";
import { decode } from "@neume-icons/svg/render";
import type { Icon as Drawing } from "@neume-icons/svg/render";

// Ce que la page sait de Neume : retrouver une icône par son nom (`arrow-up` → `ArrowUp`), son dessin,
// et le SVG ou le JSX qu'on copie, dans l'un des deux styles. Le composant `Icon` des copies ne porte que
// les glyphes du système : l'accueil, lui, montre toutes les icônes du paquet.

const COMPONENTS = Icons as unknown as Record<string, NeumeIconComponent>;

/** Le style d'une icône : son dessin de base, ou sa version pleine, publiée sous `<nom>-solid`. */
export type Style = "base" | "solid";

/** Le nom publié d'une icône dans un style : `star` → `star-solid`. */
export const publishedName = (name: string, style: Style = "base") =>
  style === "solid" ? `${name}-solid` : name;

export const pascal = (name: string) =>
  name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");

/** Une icône de Neume, par son nom, à une taille valide (12 à 64 par pas de 4). Décorative. */
export function NeumeIcon({ name, size = 24, style = "base" }: { name: string; size?: number; style?: Style }) {
  const Component = COMPONENTS[pascal(publishedName(name, style))];
  return Component ? <Component size={size} /> : null;
}

/** Le dessin 12 × 12 d'une icône, dans un style : ses lignes et son décalage. */
export const drawingOf = (name: string, style: Style = "base"): Drawing =>
  decode((style === "solid" ? solid : grand)[name]);

/** Le SVG qu'on copie : celui du paquet, sans l'`aria-hidden` qui n'a de sens que dans une page. */
export const svgOf = (name: string, size: number, style: Style = "base") =>
  renderSvg(publishedName(name, style), size).replace(' aria-hidden="true"', "");

export const jsxOf = (name: string, size: number, style: Style = "base") =>
  `<${pascal(publishedName(name, style))} size={${size}} />`;

export const importOf = (name: string, style: Style = "base") =>
  `import { ${pascal(publishedName(name, style))} } from "@neume-icons/react";`;
