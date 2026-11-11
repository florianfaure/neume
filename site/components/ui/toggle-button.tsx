"use client";

import { useState } from "react";
import type { IconName } from "@/components/ui/icon";
import { Icon } from "@/components/ui/icon";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";

interface ToggleButtonBaseProps {
  /**
   * Le nom du bouton, son NOM ACCESSIBLE et le texte de sa bulle — les trois à la fois. Requis : le
   * bouton n'a que son glyphe, et un contrôle sans nom n'existe pas (loi 7). Il ne change pas avec
   * l'état : c'est `aria-pressed` qui dit allumé ou éteint, pas le mot.
   */
  label: string;
  /** Le glyphe, éteint — et allumé si `pressedIcon` n'est pas fourni. */
  icon: IconName;
  /**
   * Un second glyphe pour l'état allumé : œil et œil barré, étoile et étoile pleine. Facultatif.
   * Fourni, il est le second indice non chromatique de l'état (loi 7), en plus du gris.
   */
  pressedIcon?: IconName;
  /** Réservé : éteint de force, fané, ni focusable ni cliquable. */
  disabled?: boolean;
  /** Appelé à chaque bascule, avec la valeur d'ARRIVÉE. Contrôlé ou non. */
  onPressedChange?: (pressed: boolean) => void;
}

/**
 * Contrôlé (`pressed`) ou non (`defaultPressed`) — jamais les deux (loi 11 : c'est une erreur d'appel,
 * le typage la refuse ici). Sans l'un ni l'autre, le bouton naît éteint et tient son état lui-même.
 */
type ToggleButtonProps = ToggleButtonBaseProps &
  ({ pressed: boolean; defaultPressed?: never } | { pressed?: never; defaultPressed?: boolean });

/**
 * ToggleButton — un bouton icône qui garde un état allumé ou éteint. Créé le 2026-11-11 (lot 1 du
 * site de Neume, spec `docs/specs/2026-11-11-lot-1-petits-controles-design.md` § 2.2), `create`,
 * sans benchmark Mobbin (en pause depuis le 2026-11-07).
 *
 * COPIÉ SUR `Button` EN ICÔNE SEULE, c'est la règle de la méthode : le même carré de 36 px
 * (`--size-button-height`), la même cible de 44 par un calque de 4 px (`--size-button-target-inset`),
 * la même bulle — `Tooltip`, son `label` — et le même enfoncement au clic. Ce n'est PAS un `Button`
 * à variante : un bouton garde un état, pas une apparence, et `aria-pressed` change le contrat
 * d'accessibilité (loi 11, critère 1) ; c'est pourquoi `Button` n'a pas de variante `toggle`.
 *
 * DÉCISIONS DE FLORIAN DU 2026-11-11 : l'état allumé est un GRIS DISCRET, jamais le noir (« un peu
 * fat »). RETOURS DE VALIDATION DU MÊME JOUR (spec § 4) : le survol suit `Tab`, le glyphe passe du
 * tertiaire au primaire et RIEN D'AUTRE — aucun fond au survol, ni au clic, que le bouton soit allumé
 * ou éteint ; le clic garde l'enfoncement de 3 %. Le seul fond est celui de l'état allumé, UN SEUL
 * token, `--color-toggle-surface-pressed` : un fond allumé qui changerait au survol n'ajoutait rien
 * que Florian demande, et son plus simple est un gris unique. Les quatre autres crans sont sortis
 * (loi 10), avec les deux de piste.
 *
 * L'ÉTAT ALLUMÉ NE TIENT PAS AU SEUL GRIS (loi 7). Le glyphe passe du tertiaire au primaire — 3.75:1
 * d'écart en clair, 3.15:1 en sombre — et l'état est exposé par `aria-pressed`, l'attribut que
 * l'assistance lit : c'est l'exception de `ThemeSelector`, aux mêmes deux conditions. Une icône ne
 * peut pas passer en gras, c'est pourquoi le fond reste ici, contrairement à `Chip`. `pressedIcon`
 * ajoute un second signal quand l'appelant a deux glyphes. La paire du fond portant le glyphe est dans
 * `scripts/contrast-pairs.json`.
 *
 * CLIENT : il porte l'état de la forme non contrôlée. Contrôlé, il ne le garde pas : la valeur
 * affichée est `pressed`, et un clic ne fait qu'appeler `onPressedChange`.
 *
 * Histoire : `docs/history/toggle-button.md`.
 */
export function ToggleButton({
  label,
  icon,
  pressedIcon,
  disabled,
  pressed,
  defaultPressed = false,
  onPressedChange,
}: ToggleButtonProps) {
  const [inner, setInner] = useState(defaultPressed);
  const on = pressed ?? inner;

  const toggle = () => {
    const next = !on;
    if (pressed === undefined) setInner(next);
    onPressedChange?.(next);
  };

  // Désactivé, pas de bulle (Florian, 2026-11-11) : la bulle est un état de survol, et un bouton
  // désactivé n'en a plus. Le nom accessible reste porté par le libellé `sr-only`.
  const control = (
    <button
      type="button"
      aria-pressed={on}
      disabled={disabled}
      onClick={toggle}
      className={cn(
        "relative inline-flex size-[var(--size-button-height)] items-center justify-center self-start rounded-full",
        "after:absolute after:inset-y-[var(--size-button-target-inset)] after:content-['']",
        "after:left-[var(--size-button-target-inset)] after:w-[var(--size-touch-target)]",
        "transition-[color,background-color,border-color,outline-color,text-decoration-color,fill,stroke,scale] duration-[var(--duration-fast)] ease-out",
        "not-disabled:active:scale-[var(--scale-press)]",
        on
          ? "bg-toggle-surface-pressed text-text-primary"
          : "text-text-tertiary not-disabled:hover:text-text-primary",
        "focus-visible:outline-[length:var(--border-thick)] focus-visible:outline-focus-ring",
        "disabled:opacity-[var(--opacity-disabled)]",
      )}
    >
      <span className="sr-only">{label}</span>
      <Icon name={on && pressedIcon ? pressedIcon : icon} />
    </button>
  );

  return disabled ? control : <Tooltip label={label}>{control}</Tooltip>;
}
