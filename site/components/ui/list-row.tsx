import type { IconName } from "@/components/ui/icon";
import { Icon } from "@/components/ui/icon";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/cn";
import { newTabAttributes, newTabNotice } from "@/lib/new-tab";
import type { ShortcutKeys } from "@/lib/shortcut";

interface ListRowBaseProps {
  /** Le libellé de la ligne, qui est aussi son nom accessible. Requis. */
  label: string;
  /**
   * L'icône, avant le libellé : tout nom de Neume, rendu par `Icon` à 16 px — le mini, la taille de la ligne
   * dense (lot 4). Décorative. Facultative.
   */
  icon?: IconName;
}

/** À droite de la ligne : une méta, en texte, OU un raccourci, par `Kbd` — jamais les deux. */
type ListRowTrailingProps =
  | {
      /** Une méta à droite, au tertiaire : « 24 px », « New ». */
      meta?: string;
      shortcut?: never;
    }
  | {
      meta?: never;
      /**
       * Le raccourci de la ligne, affiché par `Kbd` — règle de Florian du 2026-11-06, tout raccourci affiché
       * passe par lui — et écouté : il appelle `onClick`. Réservé à la forme bouton.
       */
      shortcut: ShortcutKeys;
    };

type ListRowElementProps =
  | {
      option?: never;
      id?: never;
      selected?: never;
      /** Où mène la ligne. Présent : un lien. */
      href: string;
      /** Ouvre le lien dans un nouvel onglet, avec la mention `sr-only` de `lib/new-tab.tsx`. */
      newTab?: boolean;
      disabled?: never;
      onClick?: never;
      shortcut?: never;
    }
  | {
      /**
       * Une OPTION de `List mode="listbox"` : un `<li role="option">` sans lien ni bouton — le focus reste dans le
       * champ du combobox, qui choisit. `id` et `selected` l'accompagnent ; ni `href`, ni `onClick`, ni raccourci.
       */
      option: true;
      /** L'`id` de l'option, celui que le champ nomme en `aria-activedescendant`. Requis avec `option`. */
      id: string;
      /** L'option active : `aria-selected`, le libellé au primaire. Le fond est celui de `List`. */
      selected?: boolean;
      href?: never;
      newTab?: never;
      disabled?: never;
      onClick?: never;
      shortcut?: never;
    }
  | {
      option?: never;
      id?: never;
      selected?: never;
      href?: never;
      newTab?: never;
      /** Désactivée : estompée, sans survol ni fond de survol. Un lien n'a pas de forme désactivée. */
      disabled?: boolean;
      /** L'action de la ligne. Absent d'`href` : un bouton. */
      onClick?: () => void;
    };

type ListRowProps = ListRowBaseProps & ListRowTrailingProps & ListRowElementProps;

/**
 * ListRow — une ligne dense de `List` : une icône, un libellé, à droite une méta ou un raccourci. Elle sert
 * aux menus, aux palettes de commandes et aux réglages du site de Neume et de Consort. Spec :
 * `docs/specs/2026-11-11-lot-3-retours-formulaires-design.md` § 2.4, `create`, sans benchmark Mobbin. Elle se
 * pose DANS une `List`, qui porte le fond de survol : hors d'elle, une ligne n'a pas de fond.
 *
 * L'ANATOMIE, CELLE DU PROTOTYPE. Un `<li>` qui porte un lien ou un bouton, 36 px de haut
 * (`--size-list-row-height`), en Geist 14 / 20 au secondaire — au primaire au survol et au focus —, marges
 * de 8 px : l'icône, 8 px, le libellé, qui prend la place et se coupe d'une ellipse, puis la méta en
 * `caption` au tertiaire ou la touche `Kbd`. Le `<li>` est `relative` : il se peint au-dessus du fond que `List`
 * fait glisser derrière lui. LA LARGEUR EST CELLE DU PARENT (loi 8). LA CIBLE FAIT 36 PX, comme `Tab` : une ligne
 * de liste dense est un contrôle textuel sur toute la largeur, au-dessus des 24 px de WCAG 2.2 SC 2.5.8 ; le
 * calque de 44 px que la loi 5 demande aux contrôles icône seule n'a pas lieu d'être sur une rangée pleine
 * largeur, et à 4 px d'écart deux calques se recouvriraient.
 *
 * `href` → LIEN, SINON BOUTON : la balise suit le sens, comme `Button` — un lien navigue, un bouton agit
 * (loi 11). `disabled` n'existe que sur le bouton : HTML n'a pas de lien désactivé. DÉSACTIVÉE (règle du
 * lot 1) : estompée par `--opacity-disabled`, sans changement de texte au survol, et `List` n'y pose pas son
 * fond — le `<li>` porte `data-disabled`, que `List` lit.
 *
 * LES ÉTATS (loi 4). `hover` : le texte passe au primaire, et le fond gris de `List` vient sous la ligne.
 * `active` : identique au survol, le fond est celui de `List`. `focus-visible` : l'anneau du système ET le même
 * fond de `List`, qui suit le focus clavier. `disabled` : voir ci-dessus. Le texte tient 4.5:1 sur la page et sur
 * le fond de survol, dans les deux polarités.
 *
 * LE RACCOURCI. `shortcut` passe par `Kbd`, qui écoute la touche sur le document et appelle l'action de la
 * ligne — `onClick` — après son geste. Une ligne désactivée ne la déclenche pas. Une fonction ne franchit pas la
 * frontière du composant serveur : une page qui passe `onClick` ou `shortcut` est un composant client.
 *
 * LA FORME OPTION (`extend`, 2026-11-11, pour `CommandPalette`). `option` : un `<li role="option" id aria-selected>`
 * qui porte un `<div>` de la même mise en page, sans lien ni bouton — un `<a>` ou un `<button>` dans une option est
 * un contrôle imbriqué dans un widget, et le focus doit rester dans le champ du combobox. Le choix est celui de
 * l'appelant (clic natif délégué, Entrée dans le champ). `selected` pose `aria-selected` et le libellé au primaire,
 * comme le survol des autres formes ; le fond est celui de `List mode="listbox"`.
 *
 * COMPOSANT SERVEUR : la ligne n'a pas d'état à elle. `onClick` est transmis à l'élément natif.
 *
 * Histoire : `docs/history/list-row.md`.
 */
export function ListRow({
  label,
  icon,
  meta,
  shortcut,
  href,
  newTab,
  disabled,
  onClick,
  option,
  id,
  selected,
}: ListRowProps) {
  const classes = cn(
    "flex h-[var(--size-list-row-height)] w-full items-center gap-2 rounded-lg px-2 text-left",
    "font-body text-body-sm text-text-secondary",
    "transition-colors duration-[var(--duration-fast)] ease-out",
    "not-disabled:hover:text-text-primary focus-visible:text-text-primary",
    "focus-visible:outline-[length:var(--border-thick)] focus-visible:outline-focus-ring",
    "disabled:opacity-[var(--opacity-disabled)]",
  );

  const children = (
    <>
      {icon ? (
        <span className="flex shrink-0">
          <Icon name={icon} size={16} />
        </span>
      ) : null}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {newTabNotice(newTab)}
      {meta ? (
        <span className="shrink-0 font-body text-caption text-text-tertiary">{meta}</span>
      ) : null}
      {shortcut ? (
        <span className="flex shrink-0">
          <Kbd
            keys={shortcut}
            onTrigger={() => {
              if (!disabled) onClick?.();
            }}
          />
        </span>
      ) : null}
    </>
  );

  if (option) {
    return (
      <li id={id} role="option" aria-selected={selected ?? false} className="group relative">
        <div
          className={cn(
            "flex h-[var(--size-list-row-height)] w-full items-center gap-2 rounded-lg px-2 text-left",
            "font-body text-body-sm text-text-secondary group-aria-selected:text-text-primary",
            "transition-colors duration-[var(--duration-fast)] ease-out",
          )}
        >
          {children}
        </div>
      </li>
    );
  }

  return (
    <li data-disabled={disabled ? "" : undefined} className="relative">
      {href !== undefined ? (
        <a href={href} {...newTabAttributes(newTab)} className={classes}>
          {children}
        </a>
      ) : (
        <button type="button" disabled={disabled} onClick={onClick} className={classes}>
          {children}
        </button>
      )}
    </li>
  );
}
