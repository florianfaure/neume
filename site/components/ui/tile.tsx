import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface TileProps {
  /**
   * Le libellé de la tuile, affiché sous l'icône ET nom accessible du bouton — pour Neume, le nom de l'icône. REQUIS : la tuile ne porte que
   * l'icône, décorative, et un bouton sans nom n'en a pas (loi 7). Pour Neume, le nom du fichier SVG —
   * `arrow-up` —, pas celui du composant React.
   */
  label: string;
  /**
   * L'icône, passée par l'appelant et posée telle quelle, centrée au-dessus du nom : la tuile ne connaît
   * ni Neume ni la taille. Elle est décorative — la tuile la cache aux lecteurs d'écran.
   */
  children: ReactNode;
  /**
   * Le clic, l'affaire de l'appelant : sur le site de Neume il ouvre la fiche de l'icône dans un
   * `Dialog` contrôlé que la page tient. Pas de `aria-haspopup` : aucun déclencheur de `Dialog` du
   * système n'en pose, et la tuile n'en ajoute pas.
   */
  onClick?: () => void;
}

/**
 * Tile — la tuile d'icône du système : un bouton carré qui montre une icône et son nom, et ouvre
 * sa fiche au clic. Spec : `docs/specs/2026-11-06-tuile-icone-design.md` § 2. Elle naît pour la grille
 * du site de Neume, troisième composant de ce site après `SearchField` et `Slider`, et pour Consort :
 * le portfolio n'a pas d'appelant pour elle.
 *
 * L'ANATOMIE, CELLE DU PROTOTYPE VALIDÉ, VARIANTE A — écartés au cadrage : B (grise au repos), C
 * (grise, le nom au survol seulement), D (nue, le nom au survol seulement). Une tuile carrée : la
 * largeur est celle de la cellule de grille de l'appelant (loi 8), la hauteur lui est égale
 * (`aspect-square`). Marges de 8 px. L'icône est centrée dans l'espace que le nom laisse ; le nom est
 * dessous, à l'échelle `caption`, texte tertiaire, sur une ligne, coupé d'une ellipse s'il déborde.
 * Le rayon est `--radius-2xl`, 16 px — celui du prototype, et le cran de la rampe qui n'avait plus de
 * consommateur depuis le 2026-08-28 (loi 10).
 *
 * NUE AU REPOS : ni fond ni filet. Seul le survol la révèle, ce qui la distingue des autres surfaces
 * du système.
 *
 * LES ÉTATS (loi 4). `hover` : le fond prend le gris des pistes, `--color-icon-tile-surface-hover`, et
 * le nom passe au texte primaire — le tertiaire ne tiendrait pas 4.5:1 sur ce fond. `active` : un cran
 * plus sombre, `--color-icon-tile-surface-active`. `focus-visible` : le contour du système, que le
 * navigateur allume au clavier et pas au clic sur un `<button>` — aucune exception à la loi 4.
 * `disabled` : aucun usage, il ne s'applique pas. Le fond et le nom changent en `--duration-fast` sur
 * `--ease-out`.
 *
 * L'ACCESSIBILITÉ. Le nom accessible est le texte affiché. L'icône est dans un `<span aria-hidden>`.
 * Le nom est coupé d'une ellipse à l'œil seulement : le texte entier reste dans le DOM, lu en entier.
 *
 * SERVEUR : la tuile n'a pas d'état à elle. `onClick` est une fonction : l'appelant qui le passe est un
 * composant client, comme la page de Neume qui tient le `Dialog`.
 *
 * ANONYMISÉ POUR CONSORT, le 2026-11-11 (décision de Florian, spec
 * `docs/specs/2026-11-11-anonymisation-design.md` § 2) : `IconTile` devient `Tile`, et `name` devient
 * `label` : la tuile montre un contenu libre (`children`) et son libellé, pas forcément une icône.
 * Aucun pixel ne bouge. Les deux tokens de fond gardent leur nom, `--color-icon-tile-surface-*`, pour
 * ne rien renommer d'une couche de tokens dans ce lot.
 *
 * Histoire : `docs/history/tile.md`.
 */
export function Tile({ label, children, onClick }: TileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex aspect-square w-full flex-col items-center rounded-2xl p-2",
        "transition-[background-color] duration-[var(--duration-fast)] ease-out",
        "hover:bg-icon-tile-surface-hover active:bg-icon-tile-surface-active",
      )}
    >
      <span
        aria-hidden="true"
        className="flex min-h-0 w-full flex-1 items-center justify-center text-text-primary"
      >
        {children}
      </span>
      <span
        className={cn(
          "block max-w-full truncate font-body text-caption text-text-tertiary",
          "transition-colors duration-[var(--duration-fast)] ease-out group-hover:text-text-primary",
        )}
      >
        {label}
      </span>
    </button>
  );
}
