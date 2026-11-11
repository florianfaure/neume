"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/cn";
import { newTabAttributes, newTabNotice } from "@/lib/new-tab";

interface AnnouncementProps {
  /** Le mot du `Tag` posé devant la phrase : « New ». Requis. */
  tag: string;
  /** La phrase de l'annonce, qui est aussi le nom accessible du lien, à la suite du mot du `Tag`. Requise. */
  label: string;
  /** Où mène l'annonce. Requis : une annonce est un lien. */
  href: string;
  /** Ouvre le lien dans un nouvel onglet, avec la mention `sr-only` de `lib/new-tab.tsx`. */
  newTab?: boolean;
  /**
   * `static` (défaut) : l'annonce reste à sa place. `sticky` : une fois sortie de l'écran, elle disparaît
   * quand on défile vers le bas et revient, fixée en haut et au centre de l'écran, dès qu'on remonte ;
   * revenue à sa place d'origine, la copie fixe disparaît. Elle monte, floue, et se pose nette, comme `Reveal`.
   */
  behavior?: "static" | "sticky";
}

/**
 * Announcement — la pastille de nouveauté : un `Tag` devant (« New »), une phrase, un lien. Créée le
 * 2026-11-11 (lot 1 du site de Neume, spec `docs/specs/2026-11-11-lot-1-petits-controles-design.md`
 * § 2.6), `create`, sans benchmark Mobbin. COPIÉE SUR `Tag` ET `Button` EN LIEN : le `Tag` est celui
 * du système, tel quel, et garde ses coins pixel ; la pastille autour, elle, est en RAYON PLEIN
 * (`--radius-full`) — cadrage de Florian du 2026-11-11, après la première version aux coins du
 * `Tag`. Le rayon plein permet à l'ombre de redevenir une `box-shadow` de l'échelle d'élévation,
 * `shadow-elevation-md`, au lieu du filtre que le `clip-path` du `Tag` imposait.
 *
 * Fond `--color-announcement-surface` (la page en clair), un cran plus loin au survol, un de plus au clic ;
 * le mot en secondaire (paires dans `scripts/contrast-pairs.json`, au moins 4.5:1 sur les trois fonds
 * dans les deux polarités). RETOUR DE VALIDATION DU 2026-11-11 (spec § 4.5) : en sombre la pastille se
 * voyait trop peu — l'ombre ne fait rien sur un fond presque noir —, sa surface monte donc de deux
 * crans, `neutral-900` (1.15:1 sur la page, le même décollement que la bulle de `Tooltip`), et son
 * survol et son clic à `neutral-800` : `neutral-700` laissait le mot secondaire à 3.72:1, sous le seuil,
 * donc survol et clic y sont le même fond. Le clair ne bouge pas. Le `Tag`, lui, garde `neutral-950` :
 * un creux d'environ 1.07:1 dans la pastille, aussi faible que son 1.06:1 d'avant sur la page.
 * Une FLÈCHE `arrow-right` glisse à droite au survol et au focus — celle de NEUME, à 24 px, depuis le
 * même retour (§ 4.3) : sa boîte passe de 0 à 24 px (`--size-icon`) en fondu — `arrow-right` n'existe
 * pas à 16 — et la pastille s'élargit d'autant.
 *
 * L'APPARITION PREND LE GESTE DE `REVEAL`, depuis le 2026-11-11 (spec
 * `docs/specs/2026-11-11-lot-3-retours-formulaires-design.md` § 3, `refine`) : elle monte de 16 px, floue, et se
 * pose nette, en `--duration-reveal` (700 ms) sur `--ease-out`, avec `--lift-reveal` et `--blur-reveal`. Au
 * chargement, par `starting:` — un fait de CSS, rejoué une fois à l'arrivée du nœud, sans JavaScript — ; et, en
 * `sticky`, quand la copie fixe revient en haut de l'écran. ELLE DISPARAÎT PAREIL, vers le bas, en
 * `--duration-base` (200 ms), la sortie courte d'une couche flottante, comme `Toaster`. Au repos, `translate` et
 * `filter` sont à `none` (loi 6, condition de `Reveal`) : les classes de départ ne s'appliquent qu'à l'état
 * fermé. L'ancienne OUVERTURE DEPUIS LE CENTRE — une découpe `clip-path` qui s'ouvrait du centre, deux `@utility`
 * de `globals.css` — est RETIRÉE avec ses deux `@utility`.
 *
 * LE SENS DE LA SORTIE EN `sticky` : vers le bas, le trajet de l'entrée à l'envers, comme `Toaster` — la copie
 * fixe est en haut de l'écran, et une montée de 16 px la ferait sortir par le haut, ce qui ne ressemble plus à
 * un retour. C'est une décision d'agent, au pointeur à confirmer par Florian sur le site de Neume : la forme
 * `sticky` ne se juge pas sur la vitrine, qui montre `static`.
 *
 * `sticky` EST LE SEUL CAS QUI PORTE DE L'ÉTAT : une seconde copie, fixée en haut et au centre
 * (`--z-sticky`), apparaît ou disparaît avec le même geste selon le sens du défilement — vers le
 * haut, ouverte, dès que l'annonce d'origine est sortie de l'écran ; vers le bas ou à sa place
 * d'origine, fermée et `inert`. Ouverte, elle double le lien de l'annonce d'origine pour
 * l'assistance : les deux mènent au même endroit, et l'ordre du DOM les met loin l'une de l'autre.
 * Un seuil de 4 px de défilement filtre le tremblement. Le jugement du `sticky` se fait sur le site de
 * Neume, pas sur la vitrine, qui montre la forme `static`.
 *
 * SOUS LA BARRE DE NAVIGATION (lot 2, 2026-11-11, spec `docs/specs/2026-11-11-lot-2-navigation-design.md`
 * § 2.2) : la copie fixe se pose à `calc(var(--space-4) + var(--nav-bar-offset))`. `--nav-bar-offset`, `0px`
 * par défaut dans `semantic.css`, est écrite sur `<html>` par `NavBar` en `auto-hide` — sa hauteur tant
 * qu'elle est visible, `0px` quand elle est partie. La pastille se rouvre donc juste sous la barre, et
 * remonte en haut quand la barre s'en va ; `top` transitionne en `--duration-base`, comme la barre.
 * Sans barre, le décalage est nul et le composant est ce qu'il était. `Changement : refine`.
 *
 * Sous `prefers-reduced-motion`, `globals.css` ramène les durées du système à 1 ms et la montée et le flou à
 * zéro : rien ne s'anime, la pastille apparaît et disparaît d'un coup, la flèche aussi.
 *
 * Histoire : `docs/history/announcement.md`.
 */
export function Announcement({ tag, label, href, newTab, behavior = "static" }: AnnouncementProps) {
  const anchor = useRef<HTMLSpanElement>(null);
  const [floating, setFloating] = useState(false);
  const sticky = behavior === "sticky";

  useEffect(() => {
    if (!sticky) return;

    let last = window.scrollY;
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const node = anchor.current;
      if (!node) return;

      if (node.getBoundingClientRect().bottom >= 0) {
        setFloating(false);
        last = y;
      } else if (y < last - 4) {
        setFloating(true);
        last = y;
      } else if (y > last + 4) {
        setFloating(false);
        last = y;
      }
    };

    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, [sticky]);

  const pill = (open: boolean, static_: boolean) => (
    <span
      data-state={open ? "open" : "closed"}
      className={cn(
        "inline-flex transition-[opacity,translate,filter] ease-out",
        open
          ? "duration-[var(--duration-reveal)]"
          : [
              "duration-[var(--duration-base)]",
              "opacity-0 translate-y-[var(--lift-reveal)] blur-[var(--blur-reveal)]",
            ],
        static_ &&
          "starting:opacity-0 starting:translate-y-[var(--lift-reveal)] starting:blur-[var(--blur-reveal)]",
      )}
    >
      <a
        href={href}
        {...newTabAttributes(newTab)}
        className={cn(
          "group inline-flex items-center gap-2 rounded-full p-1 pr-3",
          "bg-announcement-surface shadow-elevation-md",
          "font-body text-body-sm text-text-secondary",
          "hover:bg-announcement-surface-hover active:bg-announcement-surface-active",
          "transition-[background-color] duration-[var(--duration-fast)] ease-out",
          "focus-visible:outline-[length:var(--border-thick)] focus-visible:outline-focus-ring",
        )}
      >
        <Tag>{tag}</Tag>
        <span className="inline-flex items-center">
          <span>{label}</span>
          {newTabNotice(newTab)}
          <span
            aria-hidden="true"
            className={cn(
              "ml-0 inline-flex w-0 -translate-x-1 items-center justify-center overflow-hidden text-text-primary opacity-0",
              "transition-[width,margin,opacity,translate] duration-[var(--duration-base)] ease-out",
              "group-hover:ml-1 group-hover:w-[var(--size-icon)] group-hover:translate-x-0 group-hover:opacity-100",
              "group-focus-visible:ml-1 group-focus-visible:w-[var(--size-icon)] group-focus-visible:translate-x-0 group-focus-visible:opacity-100",
            )}
          >
            <Icon name="arrow-right" />
          </span>
        </span>
      </a>
    </span>
  );

  return (
    <>
      <span ref={anchor} className="inline-flex self-start">
        {pill(true, true)}
      </span>
      {sticky ? (
        <div
          inert={!floating}
          className={cn(
            "pointer-events-none fixed inset-x-0 z-[var(--z-sticky)] flex justify-center",
            "top-[calc(var(--space-4)+var(--nav-bar-offset))]",
            "transition-[top] duration-[var(--duration-base)] ease-out",
          )}
        >
          <span className={floating ? "pointer-events-auto" : undefined}>
            {pill(floating, false)}
          </span>
        </div>
      ) : null}
    </>
  );
}
