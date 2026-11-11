export interface Icon {
  offset: [number, number];
  rows: string[];
}
/** Une icône compacte : [ox, oy, lignes de cases en hex]. */
export type Compact = [ox: number, oy: number, hex: string];
export interface Sets {
  grand: Record<string, Icon>;
  petit?: Record<string, Icon>;
}

/** 12, 16, … 64. */
export const SIZES: readonly number[];
/** Taille valide inférieure : multiple de 4, bornée à 12–64. */
export function snap(size: number): number;
/** La version affichée pour une taille valide : quel set, combien de pixels par case. */
export function pick(size: number, hasPetit: boolean): { set: "grand" | "petit"; k: number };
export function unhex(hex: string, n: number): string[];
export function decode(compact: Compact): Icon;
/** Le tracé SVG (`d`) d'une icône à `k` px par case, posée dans une boîte de `size` px. */
export function path(icon: Icon, k: number, size: number): string;
/** Le SVG complet d'une icône, à partir de sets décodés. */
export function svg(name: string, size: number, sets: Sets, attrs?: string): string;
