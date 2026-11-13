"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
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
  /** Les liens de navigation : des `NavItem`. Au-dessus de `md` dans la barre, dessous dans le volet du menu. */
  children: ReactNode;
  /** Le contenu libre à droite — un `Button` ghost, un `ThemeSelector`. Même sort que `children` sous `md`. */
  actions?: ReactNode;
  /**
   * `static` (défaut) : la barre reste à sa place, dans le flux. `auto-hide` : collante en haut, elle
   * glisse hors de l'écran quand on descend et revient quand on remonte ; voir la docstring.
   */
  behavior?: "static" | "auto-hide";
  /** Le nom accessible du bouton qui ouvre le volet mobile, et celui du volet. */
  menuLabel?: string;
  /** Le nom accessible de la croix qui ferme le volet. */
  closeLabel?: string;
  /**
   * `window` (défaut) : la rangée va d'un bord de la fenêtre à l'autre, à la gouttière près. `content` : elle
   * s'aligne sur la largeur du contenu de la page — centrée, au plus `--size-nav-bar-content-width` (1440 px) —,
   * pour une page dont le contenu est plus étroit que la fenêtre. Le fond et le filet de la barre, eux,
   * restent d'un bord à l'autre.
   */
  align?: "window" | "content";
}

/**
 * L'HYSTÉRÉSIS du masquage, en pixels : la barre ne change d'état qu'une fois la page défilée de cette
 * distance DEPUIS LE DERNIER EXTRÊME dans le sens courant. Un geste, pas une valeur de design — comme les 4 px
 * qu'elle remplace, elle vit ici ; 24 px est celui de la barre du catalogue du site de Neume.
 */
const HYSTERESIS = 24;

/**
 * NavBar — l'en-tête de site : le lien d'accueil à gauche, les liens de navigation, les actions à
 * droite. Créée le 2026-11-11 (lot 2 du site de Neume, spec `docs/specs/2026-11-11-lot-2-navigation-design.md`
 * § 2.2), `create`, sans benchmark Mobbin (en pause) ; le prototype validé est `protos/lot2`, cadre de
 * droite — celui avec le filet. COPIÉE SUR `Announcement` pour le défilement (le même `requestAnimationFrame`, un seuil de
 * 4 px alors — voir l'hystérésis plus bas). Le volet mobile COMPOSE `Dialog` depuis le 2026-11-13 (voir plus bas).
 *
 * UN `<header>` ET UN `<nav>` NOMMÉ. Le `<header>` porte la barre ; le `<nav aria-label={label}>` ne porte
 * que les `NavItem`, et les actions sont à côté de lui, pas dedans : un `ThemeSelector` n'est pas un lien
 * de navigation. Le nom est requis, sans défaut — une page peut porter deux repères, un anonyme ne se
 * distingue d'aucun autre (la raison de `label` sur `Tab`).
 *
 * UN SEUL EXEMPLAIRE MONTÉ. Les `children` et les `actions` ne sont montés qu'à UN endroit à la fois : dans la
 * rangée de la barre tant que le volet est fermé — au-dessus de `md` ils s'y rangent, dessous la rangée les cache —,
 * et dans le volet de son ouverture jusqu'à `onClosed`, pour que la sortie animée garde son contenu. Ils sont donc
 * remontés à chaque ouverture et à chaque fermeture. Le volet est un `<dialog>` dans le top layer : les liens ne
 * peuvent plus y entrer par `display: contents`, comme ils entraient dans l'ancien panneau.
 *
 * LE DOUBLE RENDU A ÉTÉ ÉCARTÉ, et c'est `ThemeSelector` qui l'a écarté. Rendre les deux copies en permanence — la
 * rangée de barre, et le volet dans son `<dialog>` fermé — ne doublait rien pour l'assistance : un `<dialog>` fermé
 * est en `display: none`, hors de l'arbre d'accessibilité, et volet ouvert la rangée est cachée sous `md` et inerte
 * derrière `showModal()`. Mais `ThemeSelector` écrit `name="theme"` en dur (il se dit « à exemplaire unique »), et
 * les radios se groupent par document, par nom et par formulaire, pas par endroit d'affichage : le top layer n'y
 * change rien. Testé au navigateur le 2026-11-13, deux groupes `name="theme"`, l'un dans la barre, l'autre dans un
 * `<dialog>` : dès l'analyse du HTML, les deux « light » cochés, le dernier gagne et les deux radios de la barre sont
 * décochées ; un clic sur « dark » dans le dialogue la laisse vide, avant comme après sa fermeture. Le recalage de
 * `ThemeSelector`, qui coche la bonne radio au montage de chaque copie, ferait la même chose — la copie du volet
 * passe en dernier. Sur neume.dev, dont la barre porte un `ThemeSelector`, le sélecteur au-dessus de `md` n'aurait
 * eu ni pastille ni glyphe plein sur aucune page. Décision de Florian du 2026-11-13 : un seul exemplaire monté, et
 * `ThemeSelector` ne bouge pas — remonté, il se recale sur `html[data-theme]`.
 *
 * LE FOND : AUCUN EN HAUT DE PAGE, LA PAGE ET UN FILET QUAND ELLE REVIENT, JAMAIS D'OMBRE — décisions de
 * Florian du 2026-11-11, sur deux versions du prototype (le filet de droite contre une ombre de gauche :
 * « l'ombre est bizarre »). En `auto-hide`, dès que la page a défilé de plus de 4 px la barre prend
 * `--color-surface` — sans quoi ses liens se poseraient sur le contenu qui passe dessous — et un filet de
 * `--border-thin` en `--color-border-subtle`, décoratif ; en haut, elle est transparente, filet compris
 * (transparent aussi, pour que la hauteur ne bouge pas d'un pixel). `static` reste transparente.
 *
 * LE DÉFILEMENT, EN `auto-hide`. Collante (`sticky`, en haut). Elle part (`-translate-y-full`, en
 * `--duration-base` et `--ease-out`) quand on descend de plus de 24 px au-delà de sa propre hauteur,
 * revient dès qu'on remonte de plus de 24 px, et reste en place tant qu'on est dans sa hauteur du haut.
 * L'HYSTÉRÉSIS EST DU 2026-11-12 (`refine`, retour de Florian sur neume.dev) : le seuil était de 4 px, mesuré
 * depuis la dernière BASCULE, et la barre clignotait sur un défilement saccadé — un recul de quelques pixels la
 * rendait, la reprise la cachait. Il est de 24 px (`HYSTERESIS`, la valeur de la barre du catalogue du site) et
 * se mesure depuis le DERNIER EXTRÊME du sens courant : le point le plus bas atteint quand elle est partie, le
 * plus haut quand elle est là. Un va-et-vient de moins de 24 px ne la fait plus bouger. Le fond et le filet de
 * « la page a défilé » gardent leur seuil de 4 px : ce sont un état, pas un mouvement de la barre.
 * Elle ne part JAMAIS volet ouvert, et elle revient quand le focus y entre — un lien caché mais
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
 * LE VOLET MOBILE (sous `md`, le seul seuil du système), DU 2026-11-13 (`refine`, spec
 * `docs/specs/2026-11-13-menu-lateral-design.md`). Le panneau qui se déroulait sous la barre « se lisait comme
 * une partie de la page » ; Florian a voulu une rupture nette, et choisi sur un prototype tapable à 375 px l'option
 * B, « volet + flou », et l'animation 1, « comme Dialog » — le glissé sec, « trop rapide, ça pop », écarté. Un
 * `Button` ghost en icône, `menu`, porte `aria-expanded` et la bulle du `Button` icône pour nom ; il ouvre un
 * `Dialog` en `placement="right"` et `veil="blur"`, nommé `menuLabel` : un volet pleine hauteur collé au bord
 * droit, la page floutée et pâlie derrière, une bande de 64 px à gauche. La mécanique est celle de `Dialog`, et
 * aucune ligne ne la recopie : le piège de focus, l'inertie de la page, Échap, le geste retour, la fermeture au
 * voile (un appui sur la bande), le verrou de défilement de la racine, l'entrée couchée et la sortie, le focus rendu
 * au bouton menu. Le focus scripté vers le premier lien et l'écouteur d'Échap de la barre sont partis avec le
 * panneau.
 *
 *   LE VOLET, DE HAUT EN BAS : une rangée de tête de 64 px, la hauteur de la barre — le signe de la marque à
 *   gauche, rendu en DÉCOR (`aria-hidden`, pas un lien : le lien d'accueil est celui de la barre), et la croix à
 *   droite, un `Button` ghost en icône `close` nommé `closeLabel`, exactement à la place du bouton menu ; puis les
 *   liens en colonne, un filet (`--border-thin` en `--color-border-subtle`), et les actions en colonne, alignées à
 *   gauche, gouttière `--layout-gutter`. Le signe étant un décor, `showModal()` donne le focus à la croix. Le
 *   `<nav>` du volet porte le même nom que celui de la barre : un seul des deux est monté à la fois.
 *
 *   IL SE FERME au choix d'un lien (un écouteur de clic posé dans un effet, `jsx-a11y` refusant un gestionnaire sur
 *   un conteneur), à la croix, à Échap, au geste retour, à un appui sur la bande, et quand la fenêtre repasse
 *   au-dessus de `md`. La barre ne prend plus la page ni ne perd son filet volet ouvert : elle ne porte plus rien
 *   sous elle.
 *
 * LA RANGÉE PEUT S'ALIGNER SUR LE CONTENU (`align`, 2026-11-12, `extend`, retour de Florian : sur neume.dev le
 * contenu est centré à 1440 px au plus et la barre restait collée aux bords de la fenêtre). `window` (défaut) :
 * la rangée prend la fenêtre, comme avant. `content` : elle est centrée et plafonnée à
 * `--size-nav-bar-content-width` (1440 px), la gouttière restant la sienne. Une variante fermée et un token,
 * pas une largeur libre (loi 8, loi 11). Seule la rangée est plafonnée : le `<header>` — son fond et son filet
 * — va toujours d'un bord à l'autre, sans quoi le contenu qui défile apparaîtrait de part et d'autre de la
 * barre. Le volet mobile (sous `md`) ne connaît pas ce plafond : il a sa largeur, celle de `Dialog`.
 *
 * COMPOSANT CLIENT (`runtime: "client"`) : état propre (ouvert, monté dans le volet, défilé, caché), effets (le
 * défilement, la requête de largeur, le clic d'un lien du volet, le focus qui entre), refs, un `Dialog` contrôlé,
 * et l'écriture d'une propriété sur `<html>`.
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
  align = "window",
}: NavBarProps) {
  const header = useRef<HTMLElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  /* Où sont montés les liens et les actions : dans la rangée de la barre, ou dans le volet — de son ouverture
   * jusqu'à `onClosed` (voir « UN SEUL EXEMPLAIRE MONTÉ »). */
  const [inSheet, setInSheet] = useState(false);
  const [over, setOver] = useState(false);
  const [hidden, setHidden] = useState(false);
  /* Le miroir de `hidden`, lu par l'écouteur de défilement sans qu'il se réarme à chaque changement. */
  const hiddenNow = useRef(false);
  const setAway = useCallback((value: boolean) => {
    hiddenNow.current = value;
    setHidden(value);
  }, []);

  const autoHide = behavior === "auto-hide";
  /* Jamais cachée volet ouvert : la croix du volet est posée à la place de son bouton menu. */
  const away = autoHide && hidden && !open;
  const filled = autoHide && over;

  useEffect(() => {
    if (!autoHide) return;

    /* Le dernier extrême du défilement dans le sens courant : le point le plus bas atteint quand la barre est
     * partie, le plus haut quand elle est là. Elle ne bascule qu'à `HYSTERESIS` px de lui, et ce n'est pas la
     * dernière bascule qui compte : un défilement saccadé, qui recule de quelques pixels, ne la fait plus
     * clignoter. */
    let extreme = window.scrollY;
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const height = header.current?.offsetHeight ?? 0;

      setOver(y > 4);
      if (y <= height) {
        setAway(false);
        extreme = y;
      } else if (hiddenNow.current) {
        if (y > extreme) extreme = y;
        else if (y < extreme - HYSTERESIS) {
          setAway(false);
          extreme = y;
        }
      } else if (y < extreme) {
        extreme = y;
      } else if (y > extreme + HYSTERESIS) {
        setAway(true);
        extreme = y;
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
  }, [autoHide, setAway]);

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

  /* Le volet n'existe que sous `md` : la fenêtre qui repasse au-dessus le ferme. 768 px réplique
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

  /* Le choix d'un lien du volet le ferme, et le focus qui entre dans la barre la fait revenir : des écouteurs
   * posés dans un effet, et non des props `onClick` et `onFocus` sur le volet et le `<header>` — ce sont des
   * conteneurs, pas des contrôles, et `jsx-a11y` refuse à raison un gestionnaire sur un élément non interactif. */
  useEffect(() => {
    const bar = header.current;
    const body = sheet.current;
    if (!bar || !body) return;

    const onSheetClick = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest("a")) setOpen(false);
    };
    const onFocusIn = () => {
      if (autoHide) setAway(false);
    };

    body.addEventListener("click", onSheetClick);
    bar.addEventListener("focusin", onFocusIn);
    return () => {
      body.removeEventListener("click", onSheetClick);
      bar.removeEventListener("focusin", onFocusIn);
    };
  }, [autoHide, setAway]);

  const openSheet = () => {
    setInSheet(true);
    setOpen(true);
  };

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
        filled ? "border-border-subtle" : "border-transparent",
      )}
    >
      <div
        className={cn(
          "flex h-full items-center gap-4 px-[var(--layout-gutter)]",
          align === "content" && "mx-auto max-w-[var(--size-nav-bar-content-width)]",
        )}
      >
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

        <div className="ml-auto flex items-center md:hidden">
          <Button
            variant="ghost"
            content="icon"
            icon="menu"
            label={menuLabel}
            expanded={open}
            onClick={openSheet}
          />
        </div>

        {/* Volet fermé, les liens et les actions sont ici : rangés dans la barre au-dessus de `md`, cachés dessous. */}
        {inSheet ? null : (
          <div className="hidden md:contents">
            <nav aria-label={label} className="flex flex-row">
              {children}
            </nav>
            {actions ? <div className="ml-auto flex items-center gap-2">{actions}</div> : null}
          </div>
        )}
      </div>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        onClosed={() => setInSheet(false)}
        placement="right"
        veil="blur"
        label={menuLabel}
      >
        <div ref={sheet} className="flex flex-col">
          <div className="flex h-16 shrink-0 items-center justify-between px-[var(--layout-gutter)]">
            <span
              aria-hidden="true"
              className="inline-flex h-[var(--size-touch-target)] items-center"
            >
              {brand}
            </span>
            <div className="flex items-center">
              <Button
                variant="ghost"
                content="icon"
                icon="close"
                label={closeLabel}
                onClick={() => setOpen(false)}
              />
            </div>
          </div>
          {/* Volet ouvert, les liens et les actions sont ici, et plus dans la barre. */}
          {inSheet ? (
            <div className="flex flex-col gap-4 px-[var(--layout-gutter)] pt-2 pb-8">
              <nav aria-label={label} className="flex flex-col">
                {children}
              </nav>
              {actions ? (
                <div className="flex flex-col items-start gap-2 border-t-[length:var(--border-thin)] border-border-subtle pt-4">
                  {actions}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </Dialog>
    </header>
  );
}
