"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

interface ChipBaseProps {
  /** Le mot de la chip, affiché et nom accessible du bouton. Requis. */
  label: string;
  /**
   * Un compteur facultatif, après le libellé, en chiffres tabulaires (`tabular-nums`) pour que
   * « 251 » et « 8 » ne fassent pas danser la rangée. Il fait partie du contenu du bouton : lu à la
   * suite du libellé, « Popular 12 ».
   */
  count?: number;
  /**
   * `plain` (défaut) : transparente au repos, posée sur la page. `outlined` : fond blanc légèrement
   * translucide et filet gris, filet primaire quand elle est allumée — pour une chip posée sur une
   * image, où une chip transparente se perdrait.
   */
  variant?: "plain" | "outlined";
  /** Éteinte de force : fanée, ni focusable ni cliquable. */
  disabled?: boolean;
  /** Appelé à chaque bascule, avec la valeur d'ARRIVÉE. Contrôlée ou non. */
  onPressedChange?: (pressed: boolean) => void;
}

/** Contrôlée (`pressed`) ou non (`defaultPressed`), jamais les deux : le typage refuse le couple. */
type ChipProps = ChipBaseProps &
  ({ pressed: boolean; defaultPressed?: never } | { pressed?: never; defaultPressed?: boolean });

/**
 * Chip — une étiquette cliquable qui filtre, en sélection CUMULABLE. Créée le 2026-11-11 (lot 1 du
 * site de Neume, spec `docs/specs/2026-11-11-lot-1-petits-controles-design.md` § 2.3), `create`,
 * sans benchmark Mobbin. Le choix UNIQUE est `ChipGroup`, qui range des radios dans `SegmentedTrack`.
 *
 * COPIÉE SUR `Button` pour la forme — la pilule de 36 px, la cible de 44 par un calque vertical de
 * 4 px (`--size-button-target-inset`), l'enfoncement au clic — ET SUR `Tab` POUR LE GESTE : retours de
 * validation de Florian du 2026-11-11 (spec § 4). Le survol fait passer le mot du tertiaire au
 * primaire, SANS AUCUN FOND, ni au survol ni au clic ; le clic garde `active:scale-[var(--scale-press)]`,
 * le geste de `Button` et de `Tab`. La choisie est le mot au primaire ET en `font-medium`, comme
 * l'onglet choisi de `Tab` ; `plain` n'a aucun fond choisi. Les cinq tokens `--color-toggle-surface-*`
 * qu'elle partageait avec `ToggleButton` sont sortis (loi 10) : `ToggleButton` n'en garde qu'un.
 *
 * L'ÉTAT CHOISI NE TIENT PAS AU SEUL GRIS (loi 7) : il n'y a même plus de gris. Le mot passe du
 * tertiaire au primaire (3.75:1 d'écart en clair, 3.15:1 en sombre, l'exception de `ThemeSelector`) ET
 * en gras, signal non chromatique comme celui de `Tab` ; `aria-pressed` l'expose, et la variante
 * `outlined` y ajoute son filet qui passe au primaire.
 *
 * LA GRAISSE CHANGE LA LARGEUR : une chip qui s'allume s'élargit de quelques pixels, et ses voisines
 * se décalent d'autant. C'est le défaut que `Tab` accepte pour son onglet (« LE DÉFAUT EST CONNU ET
 * ACCEPTÉ ») ; seule la pastille de `ChipGroup` suit la largeur, comme celle de `Tab`.
 *
 * Le filet est un VRAI `border` de 1 px, transparent sur `plain` : les deux variantes ont la même
 * boîte, et une chip qui s'allume ne bouge pas d'un pixel. Le libellé est en Pixelify Sans, comme
 * `Button`, `Tab` et `Tag` ; le compteur en `text-caption`.
 *
 * `outlined` lit `--color-chip-outlined-surface`, blanc à 85 %, au repos, choisie et au survol — il ne
 * change plus : elle est translucide, donc hors des
 * paires de contraste (angle mort n° 27 de `.claude/rules/loi-07-accessibilite.md`) : le mot au tertiaire
 * y est jugé comme sur la page, et l'image dessous est à l'œil de Florian.
 *
 * Histoire : `docs/history/chip.md`.
 */
export function Chip({
  label,
  count,
  variant = "plain",
  disabled,
  pressed,
  defaultPressed = false,
  onPressedChange,
}: ChipProps) {
  const [inner, setInner] = useState(defaultPressed);
  const on = pressed ?? inner;

  const toggle = () => {
    const next = !on;
    if (pressed === undefined) setInner(next);
    onPressedChange?.(next);
  };

  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={disabled}
      onClick={toggle}
      className={cn(
        "relative inline-flex h-[var(--size-button-height)] items-center gap-1 self-start rounded-full px-3",
        "border-[length:var(--border-thin)] font-pixel text-body-sm",
        "after:absolute after:inset-x-0 after:inset-y-[var(--size-button-target-inset)] after:content-['']",
        "transition-[color,background-color,border-color,outline-color,text-decoration-color,fill,stroke,scale] duration-[var(--duration-fast)] ease-out",
        "not-disabled:active:scale-[var(--scale-press)]",
        variant === "plain" && [
          "border-transparent",
          on
            ? "font-medium text-text-primary"
            : "font-normal text-text-tertiary not-disabled:hover:text-text-primary",
        ],
        variant === "outlined" && [
          "bg-chip-outlined-surface",
          on
            ? "border-text-primary font-medium text-text-primary"
            : "border-border-subtle font-normal text-text-tertiary not-disabled:hover:text-text-primary",
        ],
        "focus-visible:outline-[length:var(--border-thick)] focus-visible:outline-focus-ring",
        "disabled:opacity-[var(--opacity-disabled)]",
      )}
    >
      <span>{label}</span>
      {count !== undefined ? <span className="text-caption tabular-nums">{count}</span> : null}
    </button>
  );
}
