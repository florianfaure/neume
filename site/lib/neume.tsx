import * as Icons from "@neume-icons/react";
import type { Icon as NeumeIconComponent } from "@neume-icons/react";
import { svg as renderSvg } from "@neume-icons/svg";
import { grand } from "@neume-icons/svg/data";
import { decode } from "@neume-icons/svg/render";
import type { Icon as Drawing } from "@neume-icons/svg/render";

// Ce que la page sait de Neume : retrouver une icône par son nom (`arrow-up` → `ArrowUp`), son dessin,
// et le SVG ou le JSX qu'on copie. Le composant `Icon` des copies ne porte que les glyphes du système :
// l'accueil, lui, montre toutes les icônes du paquet.

const COMPONENTS = Icons as unknown as Record<string, NeumeIconComponent>;

export const pascal = (name: string) =>
  name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");

/** Une icône de Neume, par son nom, à une taille valide (12 à 64 par pas de 4). Décorative. */
export function NeumeIcon({ name, size = 24 }: { name: string; size?: number }) {
  const Component = COMPONENTS[pascal(name)];
  return Component ? <Component size={size} /> : null;
}

/** Le grand dessin (12 × 12) d'une icône : ses lignes et son décalage. */
export const drawingOf = (name: string): Drawing => decode(grand[name]);

/** Le SVG qu'on copie : celui du paquet, sans l'`aria-hidden` qui n'a de sens que dans une page. */
export const svgOf = (name: string, size: number) =>
  renderSvg(name, size).replace(' aria-hidden="true"', "");

export const jsxOf = (name: string, size: number) => `<${pascal(name)} size={${size}} />`;

export const importOf = (name: string) => `import { ${pascal(name)} } from "@neume-icons/react";`;
