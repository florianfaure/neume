"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { FocusEvent } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  dismissToast,
  getServerToasts,
  getToasts,
  removeToast,
  subscribeToasts,
  type ToastItem,
} from "@/lib/toast";
import { cn } from "@/lib/cn";

interface ToasterBaseProps {
  /**
   * Le nom accessible de la région qui annonce les notifications. Défaut « Notifications » : un petit
   * texte système, au défaut anglais remplaçable (anonymisation pour Consort, spec
   * `docs/specs/2026-11-11-anonymisation-design.md` § 2).
   */
  label?: string;
  /** Le nom accessible de la croix, et le mot de sa bulle. Défaut « Close ». */
  closeLabel?: string;
}

/**
 * Où la région se pose. `window` (défaut, l'existant) : fixée en bas à droite de la fenêtre, et elle affiche les
 * notifications sans `scope` — ou celles de la `scope` qu'on lui donne. `container` : posée dans le conteneur
 * positionné le plus proche, en bas, sur sa largeur — la `scope` est alors REQUISE : un `Toaster` de conteneur qui
 * affichait aussi les notifications globales les dédoublerait avec celui de la fenêtre. Le parent est `relative`
 * (et `overflow-hidden` s'il doit rogner) ; le composant ne pose aucune largeur (loi 8).
 */
type ToasterProps = ToasterBaseProps &
  ({ placement?: "window"; scope?: string } | { placement: "container"; scope: string });

/** Chaque ton, son glyphe de 24 px et la couleur de retour de l'icône. Écrits en toutes lettres : Tailwind lit le source. */
const TONES = {
  neutral: { icon: "info", color: "text-text-secondary" },
  positive: { icon: "check-circle", color: "text-text-positive" },
  negative: { icon: "alert-circle", color: "text-text-negative" },
} as const;

/** Le token de la durée, sous sa forme `var()` : c'est ce qui le fait compter comme consommé (loi 10), comme `WAIT` de `Tooltip`. */
const VISIBLE = "var(--duration-toast-visible)";

/** Le délai de secours de la sortie : si aucune transition ne tourne (onglet masqué), la notification part quand même. */
const EXIT_FALLBACK_MS = 1000;

/**
 * Combien de temps une notification reste, lu dans le token : `--duration-toast-visible`. Une durée de
 * MINUTERIE, comme l'attente de `Tooltip` — le filet de mouvement réduit de `globals.css` n'y touche pas. Lu
 * EN SECONDES COMME EN MILLISECONDES : le minifieur du build réécrit `4000ms` en `4s`.
 */
function visibleMs() {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(VISIBLE.slice(4, -1))
    .trim();
  return (parseFloat(value) || 4000) * (value.endsWith("ms") ? 1 : 1000);
}

function Notice({ item, closeLabel }: { item: ToastItem; closeLabel: string }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const tone = TONES[item.tone ?? "neutral"];
  const paused = hovered || focused;

  /* La fermeture seule : la minuterie part à l'arrivée et à chaque reprise, et le survol ou le focus la
   * suspendent — elle repart alors de zéro, à la sortie du pointeur. */
  useEffect(() => {
    if (item.closing || paused) return;
    const timer = window.setTimeout(() => dismissToast(item.id), visibleMs());
    return () => window.clearTimeout(timer);
  }, [item.closing, item.id, paused]);

  /* Une fois la sortie lancée, la notification est retirée quand sa transition d'opacité finit — ou au
   * bout du délai de secours, si aucune ne tourne. */
  useEffect(() => {
    if (!item.closing) return;
    const timer = window.setTimeout(() => removeToast(item.id), EXIT_FALLBACK_MS);
    return () => window.clearTimeout(timer);
  }, [item.closing, item.id]);

  const leaveFocus = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
  };

  return (
    <div
      data-closing={item.closing ? "" : undefined}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={leaveFocus}
      onTransitionEnd={(event) => {
        if (
          item.closing &&
          event.target === event.currentTarget &&
          event.propertyName === "opacity"
        )
          removeToast(item.id);
      }}
      className={cn(
        "pointer-events-auto flex gap-3 rounded-2xl bg-toast-surface p-3 shadow-elevation-md",
        /* Sans description, l'icône, le titre et les boutons se centrent en hauteur ; avec, ils se calent en
         * haut, sur la première ligne. Décision de Florian du 2026-11-12. */
        item.description ? "items-start" : "items-center",
        "transition-[opacity,translate,filter] duration-[var(--duration-reveal)] ease-out",
        "starting:opacity-0 starting:translate-y-[var(--lift-reveal)] starting:blur-[var(--blur-reveal)]",
        "data-[closing]:opacity-0 data-[closing]:translate-y-[var(--lift-reveal)] data-[closing]:blur-[var(--blur-reveal)]",
        "data-[closing]:duration-[var(--duration-base)]",
      )}
    >
      <span className={cn("flex shrink-0", tone.color)}>
        <Icon name={tone.icon} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="font-body text-body-sm font-medium text-text-primary">{item.title}</p>
        {item.description ? (
          <p className="font-body text-body-sm text-text-secondary">{item.description}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {item.action ? (
          <Button
            label={item.action.label}
            variant="ghost"
            onClick={() => {
              item.action?.onClick();
              dismissToast(item.id);
            }}
          />
        ) : null}
        <Button
          label={closeLabel}
          variant="ghost"
          content="icon"
          icon="close"
          onClick={() => dismissToast(item.id)}
        />
      </div>
    </div>
  );
}

/**
 * Toaster — la région des notifications passagères, posée UNE FOIS dans la page ; `toast()` (`lib/toast.ts`)
 * en déclenche une de n'importe où. Spec : `docs/specs/2026-11-11-lot-3-retours-formulaires-design.md` § 2.3,
 * `create`, sans benchmark Mobbin. Le composant que le cadrage appelle « Toast » : l'API est un composant posé
 * une fois plus une fonction, et le choix est motivé dans `lib/toast.ts`.
 *
 * L'ANATOMIE, CELLE DU PROTOTYPE. Une région fixée en BAS À DROITE — 24 px des bords à partir de `md`, 16 px
 * sous `md`, où elle prend la largeur de la fenêtre moins les gouttières —, large de `--size-toast-width`
 * (360 px), au-dessus de tout (`--z-overlay`). Chaque notification : une pastille en rayon `2xl` sur
 * `--color-toast-surface` — la page en clair, deux crans plus claire en sombre, où l'ombre ne se voit pas, comme
 * `Announcement` —, sous l'ombre MOYENNE de l'échelle d'élévation. De gauche à droite : l'icône de 24 px
 * (`info`, `check-circle`, `alert-circle`, de Neume), le titre en Geist 14 / 20 medium et la description au
 * secondaire, puis une action facultative — un `Button` ghost — et la croix, un `Button` ghost icône `close`
 * dont la bulle dit « Close ». Les notifications s'empilent, la plus récente en bas, à 8 px.
 *
 * LES TONS. `neutral` (défaut), `positive`, `negative` : l'icône prend la couleur de retour — jamais seule,
 * le titre dit la même chose (loi 7). Il n'y a pas de ton d'avertissement ; la couleur se pose sur l'icône
 * seule, le texte reste au primaire. Les paires icône / surface sont dans `scripts/contrast-pairs.json`.
 *
 * LE GESTE, CELUI DE `REVEAL` : elle monte de 16 px, floue, et se pose nette en 700 ms
 * (`--duration-reveal`, `--lift-reveal`, `--blur-reveal`, `--ease-out`), par `starting:` — un fait de CSS, joué à
 * l'arrivée du nœud. LA SORTIE EST LE MÊME GESTE À L'ENVERS, VERS LE BAS : elle redescend de 16 px, se
 * floute et s'efface, mais en `--duration-base` (200 ms), la sortie courte d'une couche flottante, et non
 * en 700 ms — une notification qu'on ferme ne doit pas s'attarder. Elle est retirée à la fin de la
 * transition d'opacité, ou au bout d'une seconde si aucune ne tourne. Sous `prefers-reduced-motion`,
 * `globals.css` ramène les durées à 1 ms et la montée et le flou à zéro : elle apparaît et part d'un coup.
 *
 * ELLE SE FERME SEULE AU BOUT DE 4 SECONDES (`--duration-toast-visible`, lu par `getComputedStyle` comme
 * l'attente de `Tooltip`, et non par un `transition-delay`, que le filet de mouvement réduit mettrait à
 * zéro). LE SURVOL ET LE FOCUS LA SUSPENDENT : elle reste tant que le pointeur est dessus ou que le focus est
 * dedans, et la minuterie repart de zéro à leur départ.
 *
 * L'ACCESSIBILITÉ. La région est un `role="region"` nommé et `aria-live="polite"` : une notification
 * qui arrive est annoncée sans interrompre. Elle ne prend jamais le focus. Les contrôles sont des `Button`
 * du système, atteints au clavier dans l'ordre du DOM ; la région laisse passer les clics (`pointer-events-none`),
 * seules les notifications les reçoivent.
 *
 * UN `Toaster` PEUT JOUER DANS UN CONTENEUR (`placement="container"` et `scope`, 2026-11-12, `extend`, pour la carte
 * « Feedback » du site de Neume, où les toasts doivent s'enchaîner dans la carte). L'API retenue est la plus
 * petite : le même `toast()`, une option `scope`, et un `Toaster` qui en porte le nom. Sans `scope`, rien ne
 * change — un `<Toaster />` et un `toast({ title })` font exactement ce qu'ils faisaient. Dans le conteneur, la
 * région est `absolute`, à 16 px des bords gauche, droit et bas du conteneur positionné le plus proche, et elle
 * prend sa largeur (`--size-toast-width` ne s'y applique pas) ; elle n'a pas de `z-index`, un élément positionné
 * se peignant déjà par-dessus le contenu qui ne l'est pas. Les notifications sont les mêmes — geste, minuterie,
 * survol, croix. Une séquence que la page joue elle-même est de la décoration : l'appelant choisit, il n'y a pas
 * de mode muet — la région reste `aria-live`.
 *
 * DÉSACTIVÉ ne s'applique pas : une notification n'est pas un contrôle qu'on peut désactiver. COMPOSANT
 * CLIENT (`runtime: "client"`) : l'abonnement au store, l'état de survol, les minuteries.
 *
 * Histoire : `docs/history/toaster.md`.
 */
export function Toaster({
  label = "Notifications",
  closeLabel = "Close",
  placement = "window",
  scope,
}: ToasterProps) {
  const all = useSyncExternalStore(subscribeToasts, getToasts, getServerToasts);
  /* Les siennes seulement : sans portée, celles sans portée ; sinon celles de son nom. */
  const items = useMemo(() => all.filter((item) => item.scope === scope), [all, scope]);

  return (
    <div
      role="region"
      aria-label={label}
      aria-live="polite"
      className={cn(
        "pointer-events-none flex flex-col gap-2",
        placement === "container"
          ? "absolute inset-x-4 bottom-4"
          : [
              "fixed inset-x-4 bottom-4 z-[var(--z-overlay)]",
              "md:inset-x-auto md:right-6 md:bottom-6 md:w-[var(--size-toast-width)]",
            ],
      )}
    >
      {items.map((item) => (
        <Notice key={item.id} item={item} closeLabel={closeLabel} />
      ))}
    </div>
  );
}
