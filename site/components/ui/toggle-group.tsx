"use client";

import { useId } from "react";
import type { IconName } from "@/components/ui/icon";
import { Icon } from "@/components/ui/icon";
import { SegmentedTrack } from "@/components/ui/segmented-track";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";

interface ToggleGroupItem {
  /** La valeur du choix, unique dans le groupe. */
  value: string;
  /** Le nom de l'option : son nom accessible et sa bulle. */
  label: string;
  icon: IconName;
}

interface ToggleGroupBaseProps {
  /** Le nom du groupe, lu par l'assistance (`aria-label` de la piste). Requis. */
  label: string;
  /** Les options, dans l'ordre de la rangée. Au moins une. */
  items: ToggleGroupItem[];
  /**
   * La surface du groupe. `"track"` (défaut) : une piste grise et une pastille blanche. `"none"` :
   * pas de piste, une pastille grise. Relayé à `SegmentedTrack`.
   */
  surface?: "track" | "none";
  /** Appelé au choix d'une option, avec sa valeur. Contrôlé ou non. */
  onValueChange?: (value: string) => void;
}

/** Contrôlé (`value`) ou non (`defaultValue`, défaut : la première option), jamais les deux. */
type ToggleGroupProps = ToggleGroupBaseProps &
  ({ value: string; defaultValue?: never } | { value?: never; defaultValue?: string });

/**
 * ToggleGroup — un groupe de boutons icône À CHOIX UNIQUE, dans `SegmentedTrack`. Créé le 2026-11-11
 * (lot 1 du site de Neume, spec `docs/specs/2026-11-11-lot-1-petits-controles-design.md` § 2.5),
 * `create`. Le choix cumulable est `ToggleButton`, seul.
 *
 * COPIÉ SUR `ThemeSelector`, dont il suit le modèle : de VRAIES RADIOS natives, `sr-only`, dans des
 * `<label>` enfants directs de la piste. Le navigateur tient la sélection, le clavier (les flèches
 * dans le groupe, Tab pour y entrer) et le nom de groupe ; la piste lit `:checked`, et la pastille
 * glisse d'une option à l'autre — au clic, jamais au premier placement. Le choisi est PORTÉ PAR LA
 * PASTILLE : seul son glyphe passe au primaire (3.75:1 d'écart avec le tertiaire des autres, l'exception
 * de `ThemeSelector`, `:checked` étant natif). Retours de validation de Florian du 2026-11-11 : le
 * survol est celui de `Tab` — le glyphe passe au primaire, AUCUN fond, ni au survol ni au clic —, le
 * clic garde l'enfoncement de 3 % ; les deux tokens de survol de piste sont sortis (loi 10). Un glyphe ne
 * passe pas en gras : la pastille est ici le seul porteur du choix, avec le primaire.
 *
 * LA CIBLE : l'option fait 44 de large sur 36 de haut, et son calque de pointage ne s'étend que
 * verticalement, de 4 px. Un calque horizontal, comme celui de `ThemeSelector`, ne tient que pour
 * deux options ancrées aux bords : à N options voisines de 4 px, il se recouvrirait (loi 5).
 *
 * LA BULLE de chaque option est celle de `Tooltip`, comme `ToggleButton`. Elle est l'enfant direct
 * de la piste : c'est son `inline-flex` que la pastille mesure, à la taille de l'option.
 *
 * Histoire : `docs/history/toggle-group.md`.
 */
export function ToggleGroup({
  label,
  items,
  surface = "track",
  value,
  defaultValue,
  onValueChange,
}: ToggleGroupProps) {
  const name = useId();
  const initial = defaultValue ?? items[0]?.value;

  return (
    // Un bloc autour de la piste : elle est `inline-flex` et épouse ses options ; posée seule dans
    // une colonne flex, elle s'étirerait sur toute la largeur (même parade que le `<fieldset>` de
    // ThemeSelector, loi 8).
    <div>
      <SegmentedTrack role="radiogroup" aria-label={label} surface={surface}>
        {items.map((item) => (
          <Tooltip key={item.value} label={item.label}>
            <label
              className={cn(
                "relative grid h-[var(--size-button-height)] w-[var(--size-touch-target)] place-items-center rounded-full",
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
              <span className="sr-only">{item.label}</span>
              <Icon name={item.icon} />
            </label>
          </Tooltip>
        ))}
      </SegmentedTrack>
    </div>
  );
}
