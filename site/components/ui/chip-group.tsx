"use client";

import { useId } from "react";
import { SegmentedTrack } from "@/components/ui/segmented-track";
import { cn } from "@/lib/cn";

interface ChipGroupItem {
  /** La valeur du choix, unique dans le groupe. */
  value: string;
  /** Le mot de la chip. */
  label: string;
  /** Un compteur facultatif, en chiffres tabulaires. */
  count?: number;
}

interface ChipGroupBaseProps {
  /** Le nom du groupe, lu par l'assistance (`aria-label` de la piste). Requis. */
  label: string;
  /** Les chips, dans l'ordre de la rangée. Au moins une. */
  items: ChipGroupItem[];
  /**
   * La surface du groupe. `"none"` (défaut) : les chips sur la page, une pastille grise qui glisse
   * derrière la choisie. `"track"` : sur une piste grise, une pastille blanche. Relayé à
   * `SegmentedTrack`.
   */
  surface?: "track" | "none";
  /** Appelé au choix d'une chip, avec sa valeur. Contrôlé ou non. */
  onValueChange?: (value: string) => void;
}

/** Contrôlé (`value`) ou non (`defaultValue`, défaut : la première chip), jamais les deux. */
type ChipGroupProps = ChipGroupBaseProps &
  ({ value: string; defaultValue?: never } | { value?: never; defaultValue?: string });

/**
 * ChipGroup — un groupe de chips À CHOIX UNIQUE, dans `SegmentedTrack`. Créé le 2026-11-11 (lot 1 du
 * site de Neume, spec `docs/specs/2026-11-11-lot-1-petits-controles-design.md` § 2.5), `create` : les
 * filtres de thème de Neume, par exemple. Le choix cumulable est `Chip`, seule.
 *
 * COPIÉ SUR `ThemeSelector` : de VRAIES RADIOS natives, `sr-only`, dans des `<label>` enfants
 * directs de la piste, qui lit `:checked` ; la pastille glisse de l'une à l'autre en prenant sa
 * taille, comme celle de `Tab`. La rangée se nomme par `aria-label`. La choisie est PORTÉE PAR LA
 * PASTILLE ET PAR LA GRAISSE : son mot passe au primaire et en `font-medium`, comme l'onglet choisi de
 * `Tab` (`:checked` natif ; 3.75:1 d'écart avec le tertiaire, l'exception de `ThemeSelector`). Comme
 * dans `Tab`, la graisse élargit le mot de quelques pixels : la pastille mesure l'option choisie, donc
 * elle s'ajuste, et les voisines se décalent — le défaut que `Tab` a accepté, sans réserve de largeur.
 * Retours de validation de Florian du 2026-11-11 : le survol est celui de `Tab` — le mot passe au
 * primaire, AUCUN fond, ni au survol ni au clic — ; le clic garde l'enfoncement de 3 %. Les deux
 * tokens de survol de piste sont sortis (loi 10). La forme de chaque chip est celle de `Chip` — pilule de
 * 36 px, calque vertical de 44 —, dupliquée ici faute de pouvoir composer un `<button>` autour
 * d'une radio.
 *
 * Défaut `surface="none"`, à l'inverse de `ToggleGroup` : une rangée de filtres se pose sur la page.
 *
 * Histoire : `docs/history/chip-group.md`.
 */
export function ChipGroup({
  label,
  items,
  surface = "none",
  value,
  defaultValue,
  onValueChange,
}: ChipGroupProps) {
  const name = useId();
  const initial = defaultValue ?? items[0]?.value;

  return (
    // Un bloc autour de la piste : elle est `inline-flex` et épouse ses options ; posée seule dans
    // une colonne flex, elle s'étirerait sur toute la largeur (même parade que le `<fieldset>` de
    // ThemeSelector, loi 8).
    <div>
      <SegmentedTrack role="radiogroup" aria-label={label} surface={surface}>
        {items.map((item) => (
          <label
            key={item.value}
            className={cn(
              "relative inline-flex h-[var(--size-button-height)] items-center gap-1 rounded-full px-3",
              "font-pixel text-body-sm font-normal has-[:checked]:font-medium",
              "after:absolute after:inset-x-0 after:inset-y-[var(--size-button-target-inset)] after:content-['']",
              "text-text-tertiary hover:text-text-primary has-[:checked]:text-text-primary",
              "transition-[color,background-color,scale] duration-[var(--duration-fast)] ease-out",
              "active:scale-[var(--scale-press)]",
              "has-[:focus-visible]:outline-solid has-[:focus-visible]:outline-offset-[var(--focus-ring-offset)]",
              "has-[:focus-visible]:outline-[length:var(--border-thick)] has-[:focus-visible]:outline-focus-ring",
              "has-[:focus-visible]:[animation:focus-ring-arrive_var(--duration-fast)_var(--ease-spring-pop)]",
            )}
          >
            <input
              type="radio"
              name={name}
              value={item.value}
              checked={value === undefined ? undefined : value === item.value}
              defaultChecked={value === undefined ? item.value === initial : undefined}
              onChange={() => onValueChange?.(item.value)}
              className="sr-only"
            />
            <span>{item.label}</span>
            {item.count !== undefined ? (
              <span className="text-caption tabular-nums">{item.count}</span>
            ) : null}
          </label>
        ))}
      </SegmentedTrack>
    </div>
  );
}
