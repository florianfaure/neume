import type { ReactNode } from "react";
import type { IconName } from "@/components/ui/icon";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

interface EmptyStateProps {
  /** Ce qui est vide, dit en peu de mots : « No icons match “unicorn” ». Requis. */
  title: string;
  /** Une ou deux phrases qui disent quoi faire, au tertiaire. Facultative. */
  description?: string;
  /**
   * Le glyphe, au tertiaire, à 24 px : tout nom de Neume. Défaut `inbox`. Décoratif.
   */
  icon?: IconName;
  /**
   * Les actions, sous le texte : un ou deux `Button`, posés par l'appelant. L'état vide ne les connaît pas, il
   * les range sur une ligne, centrées, à 8 px l'une de l'autre. Facultatives.
   */
  actions?: ReactNode;
  /** `full` (défaut) : une page, une grille vide, large marge. `compact` : un panneau, une liste, marge réduite. */
  size?: "full" | "compact";
}

/**
 * EmptyState — l'état vide GLOBAL du système : un glyphe en tertiaire, un titre, une description, des actions.
 * Pour le site de Neume (la grille sans résultat, les notifications), Consort et le portfolio. Spec :
 * `docs/specs/2026-11-11-lot-3-retours-formulaires-design.md` § 2.6, `create`, sans benchmark Mobbin. Une simple
 * composition : il ne fait que ranger ce qu'on lui donne. Il ne dessine ni cadre ni fond — le prototype montrait un
 * filet d'un pixel, qui appartient à l'endroit où l'état vide est posé, pas à lui.
 *
 * L'ANATOMIE, CELLE DU PROTOTYPE. Une colonne centrée : le glyphe, 8 px, le titre en Geist, graisse semi-grasse,
 * au primaire, 8 px, la description au tertiaire — sa largeur est plafonnée à `--size-empty-state-description-width`
 * (320 px), pour que deux phrases ne s'étirent pas sur toute la colonne —, 16 px, les actions. LA LARGEUR EST CELLE
 * DU PARENT (loi 8), le texte est centré.
 *
 * LES DEUX FORMES, `size`. `full` : 48 px de marge en haut et en bas, le titre à `text-body-lg` — une page entière
 * ou une grille vide. `compact` : 24 px de marge, le titre à `text-body`, les actions à 8 px — un panneau, un
 * menu. Même anatomie, deux échelles.
 *
 * LE GLYPHE EST À 24 PX, dans les deux formes. Le cadrage parlait d'une icône de 24 ou de 48 px ; depuis le
 * 2026-11-11, `Icon` rend tout nom de Neume à 12, 16, 24 ou 48, et le 48 de la forme `full` du prototype n'est plus
 * qu'un `size` à passer — le jour où Florian le demande, c'est un `refine` de ce composant, pas un glyphe neuf.
 *
 * SANS ÉTAT : ni survol, ni focus, ni état désactivé — il n'est pas interactif, ses `Button` le sont par eux-mêmes.
 * COMPOSANT SERVEUR.
 *
 * Histoire : `docs/history/empty-state.md`.
 */
export function EmptyState({
  title,
  description,
  icon = "inbox",
  actions,
  size = "full",
}: EmptyStateProps) {
  const full = size === "full";

  return (
    <div
      className={cn("flex flex-col items-center gap-2 px-6 text-center", full ? "py-12" : "py-6")}
    >
      <span className="flex text-text-tertiary">
        <Icon name={icon} />
      </span>
      <p
        className={cn(
          "font-body font-semibold text-text-primary",
          full ? "text-body-lg" : "text-body",
        )}
      >
        {title}
      </p>
      {description ? (
        <p className="max-w-[var(--size-empty-state-description-width)] font-body text-body-sm text-text-tertiary">
          {description}
        </p>
      ) : null}
      {actions ? (
        <div
          className={cn("flex flex-wrap items-center justify-center gap-2", full ? "pt-4" : "pt-2")}
        >
          {actions}
        </div>
      ) : null}
    </div>
  );
}
