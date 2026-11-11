"use client";

import { useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { cn } from "@/lib/cn";

/**
 * Le focus donné par le code à l'appui : sans défilement, et SANS CONTOUR. `focusVisible: false` dit au
 * navigateur que ce focus vient d'un pointeur ; sans lui, Chrome allume `:focus-visible` sur un focus
 * donné par le code dès que la dernière interaction de la page était une touche. Une constante et non
 * un littéral : le type `FocusOptions` de TypeScript ne connaît pas encore l'option.
 */
const POINTER_FOCUS = { preventScroll: true, focusVisible: false };

/**
 * Le focus redonné à la première touche après un appui : AVEC CONTOUR. Chrome n'allume pas
 * `:focus-visible` quand on presse une touche sur un élément focalisé au pointeur ; la poignée se
 * redonne donc le focus en le disant venu du clavier.
 */
const KEYBOARD_FOCUS = { preventScroll: true, focusVisible: true };

interface SliderProps {
  /**
   * Le nom accessible du curseur, posé en `aria-label` sur la poignée. REQUIS : la poignée ne porte que
   * son chiffre, qui ne dit pas ce qu'il mesure (loi 7).
   */
  label: string;
  /**
   * Les valeurs, en ordre croissant : un cran par valeur, et rien entre deux crans. Pour Neume, 12 à 64
   * par pas de 4, quatorze crans. Une seule liste, et non `min` / `max` / `step` : les crans sont des
   * données de l'appelant, pas une arithmétique du composant.
   */
  steps: readonly number[];
  /**
   * La valeur, tenue par l'appelant. À passer avec `onValueChange`, sans quoi la poignée ne bougerait
   * plus. Le modèle est celui de `Tab` et de `SearchField` : `value` l'emporte sur `defaultValue`, et
   * les passer ensemble est une erreur d'appel (loi 11). Une valeur hors des crans se lit sur le plus
   * proche.
   */
  value?: number;
  /**
   * Appelé à chaque cran franchi — au clic sur la piste, à chaque saut pendant le glisser, à chaque
   * touche —, pas seulement au lâcher : la grille de Neume suit en direct.
   */
  onValueChange?: (value: number) => void;
  /** La valeur de départ, en mode non contrôlé : le curseur tient alors son état lui-même. */
  defaultValue?: number;
  /**
   * Le texte que l'assistance lit pour une valeur (`aria-valuetext`) : « 24 pixels » pour Neume. Absent,
   * le lecteur d'écran lit le nombre seul.
   */
  formatValueText?: (value: number) => string;
}

/**
 * Slider — le curseur du système, premier contrôle à VALEURS DISCRÈTES. Spec :
 * `docs/specs/2026-11-06-curseur-et-elevation-design.md` § 3. Il naît pour la pièce centrale du site de
 * Neume, où le visiteur fait glisser la taille de 12 à 64 px et la grille d'icônes suit, et pour
 * Consort : le portfolio n'a pas d'appelant pour lui, au précédent de `SearchField`.
 *
 * L'ANATOMIE, CELLE DU PROTOTYPE VALIDÉ (« la pastille ») — écartés au cadrage : le trait fin à poignée
 * ronde, et le trait de 2 px à poignée carrée.
 *
 * - LA PISTE : une pastille de 40 px de haut, à la largeur du parent (loi 8), au gris de la pastille de
 *   `SearchField` sous des tokens à elle (`--color-slider-track`, `-hover`), un cran plus sombre au
 *   survol.
 * - LES CRANS : un point de 2 × 2 px par valeur, l'épaisseur d'emphase des traits (`--border-thick`),
 *   comme les barres de `TableOfContents` — l'échelle d'espacement n'a pas de pas à 2 px. Centrés dans
 *   la hauteur, chacun à l'abscisse que prend le centre de la poignée sur son cran. Décoratifs.
 * - LA POIGNÉE : une pastille de 48 × 32 px, à 4 px des bords de la piste, sur la couleur de la page.
 *   Elle porte LA VALEUR, sans unité — « 24 », pas « 24 px » —, en chiffres tabulaires, Geist à 14 sur
 *   20, texte primaire, graisse moyenne (celle du prototype).
 *
 * LA GÉOMÉTRIE EST EN POURCENTAGES, SANS MESURE AU RENDU. Deux boîtes imbriquées : la piste moins 4 px
 * (`inset-1`), puis moins la demi-poignée de chaque côté (`inset-x-6`, 24 px). Dans la seconde, le cran
 * `i` est à `i / (n − 1)` de la largeur, et la poignée y est centrée par `-translate-x-1/2` : le rendu
 * serveur la pose déjà juste, et rien ne bouge à l'hydratation. La piste n'est mesurée qu'au pointeur,
 * pour savoir quel cran est sous lui.
 *
 * LE GESTE, « LE SAUT DE CRAN EN CRAN » — écarté au cadrage : glisser librement puis se caler au lâcher.
 * Un appui sur la piste envoie la poignée au cran le plus proche ; glisser la fait sauter de cran en
 * cran sous le pointeur, capturé (`setPointerCapture`) pour suivre hors de la piste. Chaque saut glisse
 * en `--duration-base` sur `--ease-spring-pop`, le ressort du système. La valeur change à chaque cran
 * franchi. `touch-none` rend le glisser au doigt au curseur plutôt qu'au défilement.
 *
 * L'ÉTAT PRESSÉ, DÉCISION DE FLORIAN : « juste mets l'ombre derrière au clic, le relève pas vers le
 * haut ». Tant que la poignée est tenue — par un appui sur elle ou sur la piste —, elle prend
 * `--shadow-elevation-md` derrière elle, SUR PLACE : ni déplacement ni changement de taille. L'ombre
 * arrive en `--duration-base` sur `--ease-out` et repart de même. ET LES CRANS FONCENT pendant le geste,
 * du gris des crans au texte tertiaire, en `--duration-fast` sur `--ease-out`. Écartés : s'enfoncer
 * d'un pixel, s'étirer, se teinter, se rétracter, se pincer, et l'ombre avec un soulèvement de 2 px.
 * L'état est porté par `data-dragging` sur la piste, tenu par le geste et non par `:active` : un appui
 * sur la piste tient la poignée sans être sur elle, et la capture garde le geste hors de la piste.
 *
 * LE CLAVIER, LE MODÈLE « SLIDER » DES PRATIQUES ARIA : flèches droite et haut, un cran de plus ; gauche
 * et bas, un de moins ; Page haut et Page bas, trois crans ; Origine et Fin, le premier et le dernier.
 *
 * LE CONTOUR DE FOCUS, AU CLAVIER SEULEMENT — et la loi 4 suffit, SANS EXCEPTION : aucun `outline` n'est
 * retiré, le contour est celui du plancher de `globals.css`, `:focus-visible` et son arrivée sur le
 * ressort. Ce qui est réglé est le MOMENT où le navigateur allume `:focus-visible`, par l'option
 * standard `focusVisible` de `focus()`. Deux cas, relevés dans Chrome le jour du build :
 *
 * - L'APPUI. Il retient le défaut du navigateur (`preventDefault` sur `pointerdown` : ni focus déplacé
 *   par lui, ni texte sélectionné), et c'est le code qui donne le focus à la poignée. Un focus donné
 *   par le code allume `:focus-visible` dès que la dernière interaction de la page était une touche :
 *   il est donc donné avec `focusVisible: false` — au pointeur, pas de contour. Une poignée déjà
 *   focalisée au clavier est d'abord défocalisée, sans quoi le focus redonné ne ferait rien et le
 *   contour resterait.
 * - LA TOUCHE APRÈS UN APPUI. Chrome n'allume pas `:focus-visible` quand on presse une touche sur un
 *   élément focalisé au pointeur : la première touche reconnue redonne le focus à la poignée avec
 *   `focusVisible: true`, et le contour s'accroche. Tab, lui, l'allume nativement.
 *
 * LA CIBLE : 40 px de haut ne font pas les 44 de la loi 5. Un calque de `--size-touch-target`, centré
 * sur la hauteur de la piste et à sa largeur, déborde de 2 px au-dessus et au-dessous et prend le
 * pointeur, comme la croix de `SearchField`. Il est peint sous la poignée.
 *
 * LE CURSEUR : la main du site sur toute la piste, poignée comprise — `cursor-[var(--cursor-pointer)]`,
 * comme `ScratchCard` pose sa pièce. La liste des cliquables de `globals.css` ne connaît que des
 * éléments natifs, et la piste n'en est pas un.
 *
 * L'ACCESSIBILITÉ. La poignée est l'élément `role="slider"`, focusable, avec `aria-valuemin`,
 * `aria-valuemax`, `aria-valuenow` et `aria-valuetext` quand `formatValueText` est donné. Pas
 * d'`<input type="range">` : sa poignée est un pseudo-élément, qui ne sait pas porter la valeur en
 * texte, et ses crans seraient une arithmétique (`min`, `max`, `step`) là où l'appelant donne une liste.
 *
 * LA POIGNÉE EST LA PASTILLE DU CONTRÔLE SEGMENTÉ : elle consomme `--color-segmented-surface-selected`,
 * le même objet — une pastille choisie sur une piste. En sombre elle valait la couleur de la page
 * (`neutral-1000`) sur la piste (`neutral-950`), 1.06:1, et ne se voyait pas. Florian, le 2026-11-06 :
 * « on n'arrive pas trop à voir la pastille » ; sur un prototype de cinq pistes il a choisi la
 * pastille deux crans plus claire, `neutral-800` : 1.47:1 sur la piste, chiffre en texte primaire
 * 11.95:1, et la piste au survol (`neutral-900`) reste plus sombre qu'elle. En clair, rien ne change
 * (blanc sur 100, la valeur de `--color-surface` d'alors). L'ombre medium ne bouge pas.
 *
 * SOUS `prefers-reduced-motion`, `globals.css` ramène les durées à 1 ms : le saut et l'ombre sont
 * instantanés.
 *
 * LES ÉTATS (loi 4). `hover` : la piste un cran plus sombre. `active` : l'ombre medium et les crans
 * foncés. `focus-visible` : le contour, au clavier. `disabled` : aucun usage, il ne s'applique pas.
 *
 * COMPOSANT CLIENT (`runtime: "client"`) : le pointeur, le clavier, la mesure de la piste.
 *
 * Histoire : `docs/history/slider.md`.
 */
export function Slider({
  label,
  steps,
  value,
  onValueChange,
  defaultValue,
  formatValueText,
}: SliderProps) {
  const travel = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLDivElement>(null);
  const [own, setOwn] = useState(defaultValue ?? steps[0]);
  const [dragging, setDragging] = useState(false);

  /* Contrôlé dès que l'appelant passe `value` : la valeur est alors la sienne, et `own` ne sert plus. */
  const controlled = value !== undefined;
  const current = controlled ? value : own;
  const last = steps.length - 1;

  /* Le cran de la valeur : le plus proche, pour qu'une valeur hors des crans se lise quand même. */
  const index = steps.reduce(
    (best, step, i) => (Math.abs(step - current) < Math.abs(steps[best] - current) ? i : best),
    0,
  );

  /* La valeur montrée et annoncée est celle du cran, donc celle de la position. */
  const shown = steps[index];

  /* L'abscisse d'un cran, en part de la course de la poignée. */
  const at = (i: number) => `${last > 0 ? (i / last) * 100 : 50}%`;

  const commit = (i: number) => {
    const next = steps[Math.min(last, Math.max(0, i))];
    if (next === current) return;
    if (!controlled) setOwn(next);
    onValueChange?.(next);
  };

  /* Le cran sous le pointeur : la course est mesurée à l'instant, jamais gardée. */
  const stepAt = (clientX: number) => {
    const box = travel.current?.getBoundingClientRect();
    if (!box || box.width === 0) return index;
    return Math.round(((clientX - box.left) / box.width) * last);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    /* Le navigateur ne déplace pas le focus ni ne sélectionne de texte : c'est le code qui donne le
     * focus à la poignée, ci-dessous, en disant qu'il vient d'un pointeur. */
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    commit(stepAt(event.clientX));
    /* Déjà focalisée au clavier, la poignée garderait son contour : un focus redonné ne fait rien. On
     * le retire d'abord, comme un appui sur un bouton déjà focalisé éteint le sien. */
    if (document.activeElement === thumb.current) thumb.current?.blur();
    thumb.current?.focus(POINTER_FOCUS);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragging) commit(stepAt(event.clientX));
  };

  const release = () => setDragging(false);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const move: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowUp: index + 1,
      ArrowLeft: index - 1,
      ArrowDown: index - 1,
      PageUp: index + 3,
      PageDown: index - 3,
      Home: 0,
      End: last,
    };
    if (!(event.key in move)) return;
    event.preventDefault();
    const handle = event.currentTarget;
    if (!handle.matches(":focus-visible")) {
      handle.blur();
      handle.focus(KEYBOARD_FOCUS);
    }
    commit(move[event.key]);
  };

  return (
    <div
      data-dragging={dragging ? "" : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      className={cn(
        "group relative h-10 touch-none rounded-full bg-slider-track select-none",
        "cursor-[var(--cursor-pointer)]",
        "transition-colors duration-[var(--duration-fast)] ease-out hover:bg-slider-track-hover",
        /* La cible de 44 px (loi 5) : un calque centré sur la hauteur, peint sous la poignée. */
        "before:absolute before:inset-x-0 before:top-1/2 before:h-[var(--size-touch-target)] before:-translate-y-1/2 before:content-['']",
      )}
    >
      <div className="absolute inset-1">
        <div ref={travel} className="absolute inset-x-6 inset-y-0">
          {steps.map((step, i) => (
            <span
              key={step}
              aria-hidden="true"
              style={{ left: at(i) }}
              className={cn(
                "absolute top-1/2 size-[var(--border-thick)] -translate-1/2 bg-slider-tick",
                "transition-colors duration-[var(--duration-fast)] ease-out group-data-[dragging]:bg-text-tertiary",
              )}
            />
          ))}
          <div
            ref={thumb}
            role="slider"
            tabIndex={0}
            aria-label={label}
            aria-valuemin={steps[0]}
            aria-valuemax={steps[last]}
            aria-valuenow={shown}
            aria-valuetext={formatValueText?.(shown)}
            onKeyDown={onKeyDown}
            style={{ left: at(index) }}
            className={cn(
              "absolute inset-y-0 flex w-12 -translate-x-1/2 items-center justify-center rounded-full bg-segmented-surface-selected",
              "font-body text-body-sm font-medium text-text-primary tabular-nums",
              "[transition:left_var(--duration-base)_var(--ease-spring-pop),box-shadow_var(--duration-base)_var(--ease-out)]",
              "group-data-[dragging]:shadow-elevation-md",
              "focus-visible:outline-[length:var(--border-thick)] focus-visible:outline-focus-ring",
            )}
          >
            {shown}
          </div>
        </div>
      </div>
    </div>
  );
}
