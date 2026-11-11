import type { Compact } from "./render.js";

/** Icônes 12 × 12, `[ox, oy, hex]`. */
export const grand: Record<string, Compact>;
/** Icônes 8 × 8, `[ox, oy, hex]`. */
export const petit: Record<string, Compact>;
/** Les noms d'icônes (grand), dans l'ordre de Figma. */
export const names: readonly string[];
