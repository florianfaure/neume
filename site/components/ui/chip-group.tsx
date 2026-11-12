"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { SegmentedTrack } from "@/components/ui/segmented-track";
import { cn } from "@/lib/cn";

interface ChipGroupItem {
  /** La valeur du choix, unique dans le groupe. */
  value: string;
  /** Le mot de la chip. */
  label: string;
  /** Un compteur facultatif, en chiffres tabulaires. */
  count?: number;
  /**
   * Éteinte de force : fanée, ni choisissable ni atteinte au clavier. Pour griser un thème vide au lieu de
   * le retirer de la rangée. Une chip désactivée ne peut pas être la chip de départ.
   */
  disabled?: boolean;
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
  /** Le nom accessible, et la bulle, de la flèche qui fait défiler vers la gauche. Défaut « Scroll left ». */
  scrollStartLabel?: string;
  /** Le nom accessible, et la bulle, de la flèche qui fait défiler vers la droite. Défaut « Scroll right ». */
  scrollEndLabel?: string;
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
 * LA RANGÉE DÉFILE QUAND ELLE DÉBORDE (2026-11-12, `extend`, retour de Florian sur neume.dev : les filtres de
 * thème ne tiennent pas dans la colonne). Elle ne passe jamais à la ligne — chaque chip est sur une ligne
 * (`Chip`) — et ne casse pas la mise en page : la piste est dans un défileur horizontal, barre masquée. Ce
 * qui reste caché d'un côté s'efface par un FONDU SUR LE BORD (un masque de `--size-chip-group-fade`, 48 px,
 * à gauche, à droite ou des deux, selon ce qui reste à voir), et une FLÈCHE — un `Button` ghost icône,
 * `chevron-left` ou `chevron-right`, bulle « Scroll left » / « Scroll right » en props — se pose sur le fondu,
 * UNIQUEMENT de ce côté-là : elle n'apparaît que s'il reste à défiler, et fait défiler d'environ 80 % de la
 * largeur visible. Tout tient : ni fondu ni flèche, et la rangée est celle d'avant. La flèche qui disparaît
 * en tenant le focus le rend à la chip choisie, pour que le focus ne tombe pas sur la page. Un `ResizeObserver`
 * et l'écoute du défilement tiennent l'état ; sous `prefers-reduced-motion` le défilement est immédiat. Le
 * défileur laisse 8 px de marge autour de la rangée (compensés par des marges négatives) pour que l'anneau
 * de focus et la cible de 44 px ne soient pas rognés par son `overflow`.
 *
 * UNE CHIP PEUT ÊTRE DÉSACTIVÉE (`disabled` sur un item, même jour) : sa radio l'est — non choisissable, sautée
 * au clavier par le navigateur —, son libellé fane (`--opacity-disabled`) et ne réagit plus au survol ni au
 * clic. Le GROUPE entier n'a toujours pas d'état désactivé : c'est la chip qui se grise, pas la rangée.
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
  scrollStartLabel = "Scroll left",
  scrollEndLabel = "Scroll right",
}: ChipGroupProps) {
  const name = useId();
  const initial = defaultValue ?? items.find((item) => !item.disabled)?.value;
  const scroller = useRef<HTMLDivElement>(null);
  const startArrow = useRef<HTMLDivElement>(null);
  const endArrow = useRef<HTMLDivElement>(null);
  /* Ce qui reste à défiler de chaque côté : lu sur le défileur, jamais deviné. */
  const [more, setMore] = useState({ start: false, end: false });

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;

    const update = () => {
      const start = el.scrollLeft > 1;
      const end = el.scrollLeft < el.scrollWidth - el.clientWidth - 1;
      setMore((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
      /* Une flèche qui disparaît sous le focus le rend à la chip choisie. */
      const active = document.activeElement;
      if (
        active &&
        ((!start && startArrow.current?.contains(active)) ||
          (!end && endArrow.current?.contains(active)))
      ) {
        el.querySelector<HTMLElement>("input:checked")?.focus();
      }
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    const resize = new ResizeObserver(update);
    resize.observe(el);
    if (el.firstElementChild) resize.observe(el.firstElementChild);
    return () => {
      el.removeEventListener("scroll", update);
      resize.disconnect();
    };
  }, [items.length]);

  const scrollBy = (direction: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: calm ? "auto" : "smooth" });
  };

  const fade =
    more.start && more.end
      ? "chip-group-fade-both"
      : more.start
        ? "chip-group-fade-left"
        : more.end
          ? "chip-group-fade-right"
          : undefined;

  return (
    // Un bloc autour de la piste : elle est `inline-flex` et épouse ses options ; posée seule dans
    // une colonne flex, elle s'étirerait sur toute la largeur (même parade que le `<fieldset>` de
    // ThemeSelector, loi 8). `relative` : les deux flèches y sont posées sur les bords.
    <div className="relative">
      <div
        ref={startArrow}
        className={cn("absolute inset-y-0 left-0 z-[var(--z-raised)] flex items-center", !more.start && "invisible")}
      >
        <Button
          variant="ghost"
          content="icon"
          icon="chevron-left"
          label={scrollStartLabel}
          onClick={() => scrollBy(-1)}
        />
      </div>
      <div
        ref={scroller}
        className={cn(
          "-mx-2 -my-2 overflow-x-auto px-2 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          fade,
        )}
      >
        <SegmentedTrack role="radiogroup" aria-label={label} surface={surface}>
          {items.map((item) => (
            <label
              key={item.value}
              className={cn(
                "relative inline-flex h-[var(--size-button-height)] shrink-0 items-center gap-1 rounded-full px-3",
                "font-pixel text-body-sm font-normal whitespace-nowrap has-[:checked]:font-medium",
                "after:absolute after:inset-x-0 after:inset-y-[var(--size-button-target-inset)] after:content-['']",
                "text-text-tertiary has-[:checked]:text-text-primary",
                "not-has-[:disabled]:hover:text-text-primary",
                "transition-[color,background-color,scale] duration-[var(--duration-fast)] ease-out",
                "not-has-[:disabled]:active:scale-[var(--scale-press)]",
                "has-[:disabled]:opacity-[var(--opacity-disabled)]",
                "has-[:focus-visible]:outline-solid has-[:focus-visible]:outline-offset-[var(--focus-ring-offset)]",
                "has-[:focus-visible]:outline-[length:var(--border-thick)] has-[:focus-visible]:outline-focus-ring",
                "has-[:focus-visible]:[animation:focus-ring-arrive_var(--duration-fast)_var(--ease-spring-pop)]",
              )}
            >
              <input
                type="radio"
                name={name}
                value={item.value}
                disabled={item.disabled}
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
      <div
        ref={endArrow}
        className={cn("absolute inset-y-0 right-0 z-[var(--z-raised)] flex items-center", !more.end && "invisible")}
      >
        <Button
          variant="ghost"
          content="icon"
          icon="chevron-right"
          label={scrollEndLabel}
          onClick={() => scrollBy(1)}
        />
      </div>
    </div>
  );
}
