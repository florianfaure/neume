"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

interface NavBarProps {
  /**
   * Le contenu du lien d'accueil : un logo, posé par l'appelant. Requis. La barre ne connaît aucune
   * marque : elle pose le lien, pas ce qu'il montre.
   */
  brand: ReactNode;
  /** Le nom accessible du lien d'accueil (« Neume »). Requis : un logo seul n'a pas de nom. */
  brandLabel: string;
  /** Où mène le lien d'accueil. */
  brandHref?: string;
  /** Le nom accessible du `<nav>` (« Main »). Requis : une page peut porter plusieurs repères de navigation. */
  label: string;
  /** Les liens de navigation : des `NavItem`. Au-dessus de `md` dans la barre, dessous dans le panneau du menu. */
  children: ReactNode;
  /** Le contenu libre à droite — un `Button` ghost, un `ThemeSelector`. Même sort que `children` sous `md`. */
  actions?: ReactNode;
  /**
   * `static` (défaut) : la barre reste à sa place, dans le flux. `auto-hide` : collante en haut, elle
   * glisse hors de l'écran quand on descend et revient quand on remonte ; voir la docstring.
   */
  behavior?: "static" | "auto-hide";
  /** Le nom accessible du bouton qui ouvre le panneau mobile. */
  menuLabel?: string;
  /** Le nom accessible du même bouton, panneau ouvert. */
  closeLabel?: string;
}

/**
 * NavBar — l'en-tête de site : le lien d'accueil à gauche, les liens de navigation, les actions à
 * droite. Créée le 2026-11-11 (lot 2 du site de Neume, spec `docs/specs/2026-11-11-lot-2-navigation-design.md`
 * § 2.2), `create`, sans benchmark Mobbin (en pause) ; le prototype validé est `protos/lot2`, cadre de
 * droite — celui avec le filet. COPIÉE SUR `Announcement` pour le défilement (le même seuil de 4 px, le
 * même `requestAnimationFrame`), sur `Dialog` pour le clavier du panneau (Échap, focus qui part et revient).
 *
 * UN `<header>` ET UN `<nav>` NOMMÉ. Le `<header>` porte la barre ; le `<nav aria-label={label}>` ne porte
 * que les `NavItem`, et les actions sont à côté de lui, pas dedans : un `ThemeSelector` n'est pas un lien
 * de navigation. Le nom est requis, sans défaut — une page peut porter deux repères, un anonyme ne se
 * distingue d'aucun autre (la raison de `label` sur `Tab`).
 *
 * UN SEUL JEU DE NŒUDS POUR LES DEUX MISES EN PAGE. Les `children` et les `actions` ne sont rendus
 * qu'UNE fois. Au-dessus de `md`, leur enveloppe est en `display: contents` et ils se rangent dans la
 * barre ; dessous, l'enveloppe devient le PANNEAU, posé sous la barre. Dupliquer les liens (une rangée
 * de barre, une rangée de panneau) aurait doublé chaque lien pour l'assistance, ou demandé un second
 * repère de navigation ; ici le CSS fait seul la différence, et un lien a un seul nœud.
 *
 * LE FOND : AUCUN EN HAUT DE PAGE, LA PAGE ET UN FILET QUAND ELLE REVIENT, JAMAIS D'OMBRE — décisions de
 * Florian du 2026-11-11, sur deux versions du prototype (le filet de droite contre une ombre de gauche :
 * « l'ombre est bizarre »). En `auto-hide`, dès que la page a défilé de plus de 4 px la barre prend
 * `--color-surface` — sans quoi ses liens se poseraient sur le contenu qui passe dessous — et un filet de
 * `--border-thin` en `--color-border-subtle`, décoratif ; en haut, elle est transparente, filet compris
 * (transparent aussi, pour que la hauteur ne bouge pas d'un pixel). `static` reste transparente.
 *
 * LE DÉFILEMENT, EN `auto-hide`. Collante (`sticky`, en haut). Elle part (`-translate-y-full`, en
 * `--duration-base` et `--ease-out`) quand on descend de plus de 4 px au-delà de sa propre hauteur,
 * revient dès qu'on remonte de plus de 4 px, et reste en place tant qu'on est dans sa hauteur du haut.
 * Elle ne part JAMAIS panneau ouvert, et elle revient quand le focus y entre — un lien caché mais
 * tabulable serait un focus sur du vide. Sous `prefers-reduced-motion`, `globals.css` ramène les durées
 * à 1 ms : elle saute au lieu de glisser. Elle n'enveloppe que son propre mouvement : aucune largeur,
 * aucune gouttière de page n'est imposée en dehors du padding horizontal de `--layout-gutter` (voir
 * `responsive`) — la colonne est celle de la coque, qui y pose la barre.
 *
 * LA COORDINATION AVEC `Announcement` : UNE PROPRIÉTÉ SUR `<html>`. Le mécanisme le plus simple qui tienne
 * la loi 1, copié sur la façon dont `SegmentedTrack` pose ses `--segmented-*` : en `auto-hide`, la barre
 * écrit `--nav-bar-offset` sur `document.documentElement` — sa hauteur mesurée (`offsetHeight`) tant
 * qu'elle est visible, `0px` quand elle est partie — et l'efface à son démontage. `Announcement` en
 * `sticky` pose sa copie fixe à `calc(var(--space-4) + var(--nav-bar-offset))` : sous la barre quand elle
 * est là, en haut quand elle est partie, et la transition de `top` suit le mouvement de la barre. Le
 * défaut `0px` est déclaré une fois, dans `semantic.css`, et c'est lui qui rend la pastille indifférente à
 * une page sans barre. Aucun contexte React, aucune ref partagée, aucune prop de plus à `Announcement`.
 *
 * LE PANNEAU MOBILE (sous `md`, le seul seuil du système). Un `Button` ghost en icône, `menu`, qui devient
 * `close` — `aria-expanded`, et la bulle du `Button` icône pour nom. Il déroule sous la barre un panneau
 * de la couleur de la page : les liens puis, séparées par un filet, les actions. La découpe qui descend
 * est le geste du prototype (`clip-nav-panel-closed` → `-open`, deux `@utility` de `globals.css`). FERMÉ,
 * il est `invisible` : il sort de l'ordre de tabulation et de l'arbre d'accessibilité sans `inert`, que
 * le CSS ne sait pas poser à un seul régime de largeur. Il se ferme au choix d'un lien, à Échap — le
 * focus revient alors au bouton —, à la croix, et quand la fenêtre repasse au-dessus de `md`.
 * À L'OUVERTURE LE FOCUS VA AU PREMIER LIEN DU PANNEAU et non au panneau : un conteneur focalisé au
 * script reçoit l'anneau de `:focus-visible` en entier — le défaut que Florian a fait retirer des
 * panneaux de `Tab` — et la loi 4 interdit de le faire taire. Le premier lien est le premier arrêt de
 * tabulation que le panneau aurait donné de toute façon.
 *
 * COMPOSANT CLIENT (`runtime: "client"`) : état propre (ouvert, défilé, caché), effets (le défilement, la
 * touche Échap, la requête de largeur), refs (le focus du bouton et du panneau), et l'écriture d'une
 * propriété sur `<html>`.
 *
 * Histoire : `docs/history/nav-bar.md`.
 */
export function NavBar({
  brand,
  brandLabel,
  brandHref = "/",
  label,
  children,
  actions,
  behavior = "static",
  menuLabel = "Menu",
  closeLabel = "Close",
}: NavBarProps) {
  const header = useRef<HTMLElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [over, setOver] = useState(false);
  const [hidden, setHidden] = useState(false);

  const autoHide = behavior === "auto-hide";
  /* Jamais cachée panneau ouvert : le panneau est posé sous la barre, et une barre partie le laisserait sans ancre. */
  const away = autoHide && hidden && !open;
  const filled = (autoHide && over) || open;
  const ruled = autoHide && over && !open;

  useEffect(() => {
    if (!autoHide) return;

    let last = window.scrollY;
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const height = header.current?.offsetHeight ?? 0;

      setOver(y > 4);
      if (y <= height) {
        setHidden(false);
        last = y;
      } else if (y > last + 4) {
        setHidden(true);
        last = y;
      } else if (y < last - 4) {
        setHidden(false);
        last = y;
      }
    };

    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, [autoHide]);

  /* LA PROPRIÉTÉ QUE LIT `Announcement` (voir la docstring) : la hauteur de la barre tant qu'elle est
   * visible, `0px` sinon. Une position mesurée, comme les `--segmented-*` de `SegmentedTrack`. */
  useEffect(() => {
    if (!autoHide) return;
    const root = document.documentElement;
    const height = header.current?.offsetHeight ?? 0;
    root.style.setProperty("--nav-bar-offset", away ? "0px" : `${height}px`);
  }, [autoHide, away]);

  useEffect(() => {
    if (!autoHide) return;
    const root = document.documentElement;
    return () => {
      root.style.removeProperty("--nav-bar-offset");
    };
  }, [autoHide]);

  /* Le panneau n'existe que sous `md` : la fenêtre qui repasse au-dessus le ferme. 768 px réplique
   * `--breakpoint-md`, comme les seuils de `globals.css` : si le breakpoint change, celui-ci avec lui. */
  useEffect(() => {
    if (!open) return;
    const query = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (query.matches) setOpen(false);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [open]);

  /* À l'ouverture, le focus va au premier lien du panneau (voir la docstring) ; à la fermeture, il n'est
   * rendu au bouton que par Échap et par la croix, jamais par le choix d'un lien, qui navigue. */
  useEffect(() => {
    if (!open) return;
    /* Une image plus tard : au premier instant de la transition, `visibility` vaut encore sa valeur de
     * départ, `hidden`, et un élément caché ne reçoit pas le focus. */
    const frame = requestAnimationFrame(() => {
      panel.current?.querySelector<HTMLElement>("a, button")?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const focusMenuButton = () => menu.current?.querySelector("button")?.focus();

  const close = () => {
    setOpen(false);
    focusMenuButton();
  };

  /* Échap, le choix d'un lien et le focus qui entre sont des écouteurs posés dans un effet, et non des
   * props `onKeyDown`, `onClick` et `onFocus` sur le `<header>` et le panneau : ce sont des conteneurs, pas des
   * contrôles, et `jsx-a11y` refuse à raison un gestionnaire sur un élément non interactif. */
  useEffect(() => {
    const bar = header.current;
    const sheet = panel.current;
    if (!bar || !sheet) return;

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        event.stopPropagation();
        close();
      }
    };
    const onPanelClick = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest("a")) setOpen(false);
    };
    const onFocusIn = () => {
      if (autoHide) setHidden(false);
    };

    bar.addEventListener("keydown", onKeyDown);
    sheet.addEventListener("click", onPanelClick);
    bar.addEventListener("focusin", onFocusIn);
    return () => {
      bar.removeEventListener("keydown", onKeyDown);
      sheet.removeEventListener("click", onPanelClick);
      bar.removeEventListener("focusin", onFocusIn);
    };
  });

  return (
    <header
      ref={header}
      className={cn(
        "z-[var(--z-sticky)] h-16 w-full border-b-[length:var(--border-thin)]",
        autoHide ? "sticky top-0" : "relative",
        autoHide &&
          "transition-[translate,background-color,border-color] duration-[var(--duration-base)] ease-out",
        away && "-translate-y-full",
        filled ? "bg-surface" : "bg-transparent",
        ruled ? "border-border-subtle" : "border-transparent",
      )}
    >
      <div className="flex h-full items-center gap-4 px-[var(--layout-gutter)]">
        <a
          href={brandHref}
          aria-label={brandLabel}
          className={cn(
            "inline-flex h-[var(--size-touch-target)] items-center rounded-md",
            "transition-[scale] duration-[var(--duration-fast)] ease-out",
            "active:scale-[var(--scale-press)]",
            "focus-visible:outline-[length:var(--border-thick)] focus-visible:outline-focus-ring",
          )}
        >
          {brand}
        </a>

        <div ref={menu} className="ml-auto flex items-center md:hidden">
          <Button
            variant="ghost"
            content="icon"
            icon={open ? "close" : "menu"}
            label={open ? closeLabel : menuLabel}
            expanded={open}
            onClick={() => (open ? close() : setOpen(true))}
          />
        </div>

        <div
          ref={panel}
          className={cn(
            "flex flex-col md:contents",
            "max-md:absolute max-md:inset-x-0 max-md:top-full max-md:gap-2 max-md:bg-surface max-md:p-4",
            "max-md:border-b-[length:var(--border-thin)] max-md:border-border-subtle",
            "max-md:transition-[clip-path,visibility] max-md:duration-[var(--duration-base)] max-md:ease-out",
            open
              ? "max-md:visible max-md:clip-nav-panel-open"
              : "max-md:invisible max-md:clip-nav-panel-closed",
          )}
        >
          <nav aria-label={label} className="flex flex-col md:flex-row">
            {children}
          </nav>
          {actions ? (
            <div
              className={cn(
                "flex items-center gap-2 md:ml-auto",
                "max-md:mt-2 max-md:border-t-[length:var(--border-thin)] max-md:border-border-subtle max-md:pt-4",
              )}
            >
              {actions}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
