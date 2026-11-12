/**
 * Le STORE des notifications passagères, et la fonction qui en déclenche une : `toast()`. `Toaster`, posé une
 * seule fois dans la page, s'y abonne et les rend. Lot 3 du site de Neume, 2026-11-11 (spec
 * `docs/specs/2026-11-11-lot-3-retours-formulaires-design.md` § 2.3).
 *
 * POURQUOI UNE FONCTION ET UN `Toaster` PLUTÔT QU'UN COMPOSANT CONTRÔLÉ. Une notification se déclenche d'un
 * gestionnaire — un clic, la fin d'une copie, un envoi —, pas d'un rendu : `toast({ title })` s'appelle de
 * n'importe où, sans que la page tienne un `open` et un `onOpenChange` pour chaque message, et plusieurs
 * notifications s'empilent d'elles-mêmes. Un composant contrôlé aurait demandé à chaque page de tenir cet état
 * et de poser sa propre région `aria-live`. La contrepartie est un état au niveau du module : un seul
 * `Toaster` par page, et il n'y a rien à rendre côté serveur — la liste est vide tant que rien n'a été appelé.
 *
 * LA PORTÉE (2026-11-12, `extend`, pour la carte « Feedback » du site de Neume) : `toast({ …, scope })` adresse un
 * `Toaster` nommé, posé dans un conteneur, au lieu de celui de la fenêtre. Le store reste UN : chaque notification
 * porte sa portée, et chaque `Toaster` ne rend que les siennes — celles sans portée pour le global, celles de son
 * nom pour un `Toaster` de conteneur. Aucune API de plus : le même `toast()`, une option.
 *
 * Ce fichier n'est pas un composant : il ne rend rien et n'écrit aucune classe.
 */

/** Le ton de la notification : l'icône prend la couleur de retour, jamais seule — le titre dit la même chose. */
export type ToastTone = "neutral" | "positive" | "negative";

export interface ToastOptions {
  /** Ce qui s'est passé, en peu de mots. Requis : c'est ce que la région `aria-live` annonce. */
  title: string;
  /** Une phrase de plus, au secondaire. Facultative. */
  description?: string;
  /** `neutral` (défaut) : l'icône `info`. `positive` : `check-circle` en vert. `negative` : `alert-circle` en rouge. */
  tone?: ToastTone;
  /** Une action facultative, en bouton ghost : « Undo », « Retry ». Le clic l'appelle, puis ferme la notification. */
  action?: { label: string; onClick: () => void };
  /**
   * La portée de la notification (2026-11-12). Absente (défaut) : elle va au `Toaster` global, celui de la
   * fenêtre. Nommée : elle ne va qu'au `Toaster` posé dans un conteneur sous le même nom (`placement="container"`),
   * et ce `Toaster`-là n'affiche rien d'autre. Deux portées ne se voient jamais.
   */
  scope?: string;
}

export interface ToastItem extends ToastOptions {
  id: number;
  /** Vrai dès que la sortie est lancée : la notification redescend, puis est retirée. */
  closing: boolean;
}

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

/** Les mêmes tableaux à chaque lecture tant que rien ne change : `useSyncExternalStore` compare par identité. */
const EMPTY: ToastItem[] = [];

function emit(next: ToastItem[]) {
  items = next;
  for (const listener of listeners) listener();
}

/** Déclenche une notification et rend son identifiant. S'appelle de n'importe où, hors d'un rendu. */
export function toast(options: ToastOptions): number {
  const id = nextId;
  nextId += 1;
  emit([...items, { ...options, id, closing: false }]);
  return id;
}

/** Lance la sortie d'une notification — la croix, l'action, la minuterie. Elle est retirée une fois sortie. */
export function dismissToast(id: number) {
  if (!items.some((item) => item.id === id && !item.closing)) return;
  emit(items.map((item) => (item.id === id ? { ...item, closing: true } : item)));
}

/** Retire une notification déjà sortie. Réservé à `Toaster`. */
export function removeToast(id: number) {
  emit(items.filter((item) => item.id !== id));
}

/** L'abonnement de `Toaster` : `useSyncExternalStore`. */
export function subscribeToasts(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getToasts() {
  return items;
}

/** Côté serveur, il n'y a jamais de notification. */
export function getServerToasts() {
  return EMPTY;
}
