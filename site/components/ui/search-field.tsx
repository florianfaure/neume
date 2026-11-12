"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Icon } from "@/components/ui/icon";
import { Kbd } from "@/components/ui/kbd";
import { ariaKeyShortcuts, useIsMac, type ShortcutKeys } from "@/lib/shortcut";
import { cn } from "@/lib/cn";

interface SearchFieldProps {
  /**
   * Le nom accessible du champ, rendu en `<label>` invisible (`sr-only`). REQUIS : le libellé d'un
   * champ n'est jamais seulement son texte d'attente, qui disparaît à la première frappe (loi 7).
   */
  label: string;
  /** Le texte d'attente, au gris tertiaire, champ vide. Facultatif. */
  placeholder?: string;
  /**
   * Le texte du champ, tenu par l'appelant. À passer avec `onValueChange`, sans quoi le champ ne
   * bougerait plus. Le modèle est celui de `Tab` : `value` l'emporte sur `defaultValue`, et les
   * passer ensemble est une erreur d'appel (loi 11).
   */
  value?: string;
  /**
   * Appelé à chaque frappe, à l'effacement par la croix et par Échap. LE FILTRAGE EST L'AFFAIRE DE
   * L'APPELANT : pas de bouton, pas de soumission.
   */
  onValueChange?: (value: string) => void;
  /** Le texte de départ, en mode non contrôlé : le champ tient alors son état lui-même. */
  defaultValue?: string;
  /**
   * Le raccourci qui met le focus dans le champ, affiché par `Kbd` au bout du champ vide : les mêmes
   * touches que `Kbd` (`"/"`, `"mod+k"`…), gabarit littéral et non union fermée — l'exception à la loi 11
   * est écrite à `Kbd`. Absent : ni touche, ni raccourci.
   */
  shortcut?: ShortcutKeys;
  /**
   * Le nom accessible de la croix qui efface le champ. Défaut « Clear search » : un petit texte système,
   * au défaut anglais remplaçable (anonymisation pour Consort, décision de Florian du 2026-11-11, spec
   * `docs/specs/2026-11-11-anonymisation-design.md` § 2).
   */
  clearLabel?: string;
}

/**
 * SearchField — le champ de recherche du système, premier champ de saisie. Spec :
 * `docs/specs/2026-11-06-champ-de-recherche-design.md` § 3 et § 4. Il naît pour le site de Neume, qui
 * filtre son catalogue d'icônes, et pour Consort : le portfolio n'a pas d'appelant pour lui, au
 * précédent d'`ArticleMeta`, né sans appelant.
 *
 * L'ANATOMIE, CELLE DU PROTOTYPE VALIDÉ, de gauche à droite dans une pastille de 40 px — la hauteur de
 * la piste de `SegmentedTrack` —, marges de 8 px : la loupe `search` de Neume à 24 px, au tertiaire ;
 * 8 px ; le `<input type="search">` en Geist à 14 sur 20, texte primaire, texte d'attente tertiaire —
 * SECONDAIRE AU SURVOL, où le tertiaire ne tient pas 4.5:1 sur la pastille foncée (décision de
 * Florian, 2026-11-06 : le champ garde le cran de survol validé, c'est le texte qui fonce) ;
 * au bout, SOIT la touche `Kbd` (champ vide et sans focus), SOIT la croix (champ rempli). Jamais les
 * deux ; vide et focalisé, aucune. La hauteur n'est écrite nulle part : 8 + 24 + 8, la loupe et la
 * grille. LA LARGEUR EST CELLE DU PARENT (loi 8). Florian a écarté au cadrage les coins de 8 px, sur
 * gris ou à contour d'1 px : la pastille est sur le gris de la piste de `Tab`, sans bordure, sous des
 * tokens à elle (`--color-search-field-surface`, `-hover`).
 *
 * LA PASTILLE EST EN DEUX MORCEAUX, ET C'EST LE HTML QUI L'IMPOSE. Un `<label>` enveloppe la loupe, le
 * nom invisible, le champ et la touche : un clic sur la loupe ou dans la marge met le focus dans le
 * champ, nativement, sans gestionnaire. La croix est un `<button>`, et un bouton ne peut pas vivre
 * dans le `<label>` d'un autre contrôle : elle est sa sœur, dans la `<div>` qui peint la pastille. Le
 * prix, assumé : `globals.css` pose la main sur tout `label:has(input)`, donc sur la loupe et les
 * marges ; le champ lui-même garde le curseur de texte du navigateur.
 *
 * LES ÉTATS (loi 4). `hover` : la pastille un cran plus sombre. `active` : IDENTIQUE AU REPOS, sur la
 * parole de Florian — « le click et l'active n'est pas forcément différent du default ». `disabled` :
 * aucun usage, il ne s'applique pas. Rempli : la croix prend la place de la touche — un état de
 * contenu, démontré par une seconde instance sur la vitrine.
 *
 * LE CONTOUR DE FOCUS, AU CLAVIER SEULEMENT — l'exception datée du 2026-11-06 de la loi 4, la seule de
 * son espèce (`.claude/rules/loi-04-etats.md`). Un navigateur allume `:focus-visible` au clic sur un
 * champ texte ; Florian veut que le clic laisse le champ tel qu'au repos. La modalité est celle de la
 * DERNIÈRE INTERACTION avec la page, relevée en phase de capture sur le document : un `pointerdown`
 * dit « pointeur », un `keydown` dit « clavier ». À l'arrivée du focus, le champ la lit et pose
 * `data-keyboard-focus` sur la pastille ; il le retire au départ. Tab, Maj+Tab et le `/` de `Kbd`
 * allument donc le contour ; un clic dans le champ ne l'allume pas ; un clic sur la croix, qui rend le
 * focus au champ, non plus ; Entrée sur la croix, si. Le contour est peint sur la PASTILLE, pas sur le
 * champ, qui retire son propre `outline` : c'est le seul retrait d'`outline` du dépôt sans anneau
 * de focus sur sa ligne, et `npm run check` ne le laisse passer qu'à trois conditions (balise
 * `<input>`, `type="search"`, anneau peint sur la pastille sous `data-[keyboard-focus]:` dans ce
 * fichier).
 * SEUL LE MOMENT CHANGE : couleur, épaisseur, décalage et arrivée sur le ressort sont ceux du plancher
 * de `globals.css`, écrits comme `ThemeSelector` les écrit sur son `<label>`.
 *
 * LA CROIX, UN VRAI PETIT BOUTON. Un rond de 24 px, le `close` de Neume à 16 px, au secondaire ; au
 * survol, le fond de la page et le texte primaire, pour se détacher du gris du champ survolé — au
 * lieu du gris un cran plus sombre que Florian a écarté ; à l'appui, un cran plus sombre
 * (`--color-surface-subtle`, le cran du prototype). SA CIBLE FAIT 44 × 44 PAR UN CALQUE centré sur le
 * rond, `--size-touch-target` (loi 5) : il déborde de 2 px au-dessus, au-dessous et à droite de la
 * pastille, et de 2 px sur le champ à gauche — aucun calque voisin. Le rond visible reste à 24 px.
 * Son nom accessible est « Clear search », en anglais comme le site.
 *
 * ELLE ARRIVE au premier caractère avec le geste du `check` de `Button` : de `--scale-glyph-enter` à 1
 * sur `--ease-spring-pop`, en `--duration-base`, posé sur une enveloppe à elle parce que la croix a sa
 * propre transition de couleur. Aucun token de mouvement neuf. ELLE NE JOUE QU'APRÈS UNE FRAPPE : un
 * `starting:` joue au montage du nœud, et un champ qui arrive rempli — la seconde instance de la
 * vitrine — la ferait surgir au chargement, la condition que `Button` écrit pour son `check`. Le
 * geste est donc armé au premier passage du vide au rempli, et rejoue à chaque retour de la croix.
 * Sous `prefers-reduced-motion`, `globals.css` ramène l'échelle de départ à 1 : la croix est là.
 *
 * LE COMPORTEMENT. `onValueChange` à chaque frappe ; ÉCHAP efface le champ s'il est rempli — et
 * retient la touche, pour qu'une couche modale autour ne se ferme pas avec —, sinon le quitte ; la
 * croix efface et REND LE FOCUS au champ ; le raccourci passe par `Kbd`, qui met le focus dans le
 * champ, et `aria-keyshortcuts="/"` le dit au lecteur d'écran. La touche reste montée quand le champ
 * est rempli, cachée par son enveloppe : `/` y mène encore, sans geste à voir.
 *
 * COMPOSANT CLIENT (`runtime: "client"`) : l'état rempli, l'écoute de la modalité, le focus rendu.
 *
 * ANONYMISÉ POUR CONSORT, le 2026-11-11 (décision de Florian, spec
 * `docs/specs/2026-11-11-anonymisation-design.md` § 2) : le nom de la croix devient `clearLabel` (« Clear
 * search » par défaut), et `shortcut` prend les touches de `Kbd` au lieu de `"/"` seule — `"mod+k"`
 * s'annonce « Meta+K » ou « Control+K » en `aria-keyshortcuts`, selon la plateforme.
 *
 * Histoire : `docs/history/search-field.md`.
 */
export function SearchField({
  label,
  placeholder,
  value,
  onValueChange,
  defaultValue = "",
  shortcut,
  clearLabel = "Clear search",
}: SearchFieldProps) {
  const id = useId();
  const isMac = useIsMac();
  const field = useRef<HTMLInputElement>(null);
  const byPointer = useRef(false);
  const [own, setOwn] = useState(defaultValue);
  const [focused, setFocused] = useState(false);
  const [keyboardFocus, setKeyboardFocus] = useState(false);
  const [popClear, setPopClear] = useState(false);

  /* Contrôlé dès que l'appelant passe `value` : le texte est alors le sien, et `own` ne sert plus. */
  const controlled = value !== undefined;
  const current = controlled ? value : own;
  const filled = current !== "";

  /* La modalité de la dernière interaction, en capture : elle est relevée avant que le focus ne
   * bouge, et avant l'écoute de `Kbd`, qui appelle le focus dans la foulée de son `keydown`. */
  useEffect(() => {
    const onPointer = () => {
      byPointer.current = true;
    };
    const onKey = () => {
      byPointer.current = false;
    };
    document.addEventListener("pointerdown", onPointer, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, []);

  const change = (next: string) => {
    if (next !== "" && current === "") setPopClear(true);
    if (!controlled) setOwn(next);
    onValueChange?.(next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Escape") return;
    if (filled) {
      event.preventDefault();
      change("");
    } else {
      field.current?.blur();
    }
  };

  const clear = () => {
    change("");
    field.current?.focus();
  };

  return (
    <div
      data-keyboard-focus={keyboardFocus ? "" : undefined}
      className={cn(
        "group flex items-center rounded-full bg-search-field-surface",
        "transition-[background-color] duration-[var(--duration-fast)] ease-out",
        "hover:bg-search-field-surface-hover",
        "data-[keyboard-focus]:outline-solid data-[keyboard-focus]:outline-[length:var(--border-thick)]",
        "data-[keyboard-focus]:outline-offset-[var(--focus-ring-offset)] data-[keyboard-focus]:outline-focus-ring",
        "data-[keyboard-focus]:[animation:focus-ring-arrive_var(--duration-fast)_var(--ease-spring-pop)]",
        filled && "pr-2",
      )}
    >
      <label htmlFor={id} className="flex min-w-0 flex-1 items-center gap-2 p-2">
        <span className="flex shrink-0 text-text-tertiary">
          <Icon name="search" />
        </span>
        <span className="sr-only">{label}</span>
        <input
          ref={field}
          id={id}
          type="search"
          value={current}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          aria-keyshortcuts={shortcut ? ariaKeyShortcuts(shortcut, isMac) : undefined}
          onChange={(event) => change(event.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => {
            setFocused(true);
            setKeyboardFocus(!byPointer.current);
          }}
          onBlur={() => {
            setFocused(false);
            setKeyboardFocus(false);
          }}
          className={cn(
            "min-w-0 flex-1 appearance-none bg-transparent outline-none",
            "font-body text-body-sm text-text-primary placeholder:text-text-tertiary group-hover:placeholder:text-text-secondary",
            "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none",
          )}
        />
        {shortcut ? (
          <span className={cn("flex shrink-0", (filled || focused) && "hidden")}>
            <Kbd keys={shortcut} onTrigger={() => field.current?.focus()} />
          </span>
        ) : null}
      </label>
      {filled ? (
        <span
          className={cn(
            "inline-flex shrink-0 transition-[scale] duration-[var(--duration-base)] ease-spring-pop",
            popClear && "starting:scale-[var(--scale-glyph-enter)]",
          )}
        >
          <button
            type="button"
            aria-label={clearLabel}
            onClick={clear}
            className={cn(
              "relative inline-flex size-6 items-center justify-center rounded-full text-text-secondary",
              "after:absolute after:top-1/2 after:left-1/2 after:size-[var(--size-touch-target)] after:-translate-1/2 after:content-['']",
              "transition-colors duration-[var(--duration-fast)] ease-out",
              "hover:bg-surface hover:text-text-primary active:bg-surface-subtle active:text-text-primary",
              "focus-visible:outline-[length:var(--border-thick)] focus-visible:outline-focus-ring",
            )}
          >
            <Icon name="close" size={16} />
          </button>
        </span>
      ) : null}
    </div>
  );
}
