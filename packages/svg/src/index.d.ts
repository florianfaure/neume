export { SIZES, snap, pick, path } from "./render.js";
export type { Icon, Compact } from "./render.js";

/** Les noms d'icônes, dans l'ordre de Figma. */
export const names: readonly string[];
/** Le SVG complet de l'icône `name` à `size` px (12–64 par pas de 4, sinon erreur). */
export function svg(name: string, size: number, attrs?: string): string;
