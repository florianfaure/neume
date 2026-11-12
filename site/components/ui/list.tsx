"use client";

import { useCallback, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type ListProps = {
  /** Les lignes : des `ListRow`, rendues telles quelles. `List` ne leur pose ni marge ni classe. */
  children: ReactNode;
  /** Le nom accessible de la liste, quand elle en a besoin : un menu, une palette. Facultatif. */
  label?: string;
} & (
  | {
      /** `list` (défaut) : le fond suit le pointeur et le focus clavier. */
      mode?: "list";
      /**
       * La lecture automatique, facultative (défaut : éteinte) : le fond gris avance seul de ligne en ligne, au
       * pas de `--duration-list-autoplay`, et revient en haut en boucle. Le pointeur dans la liste et le focus
       * clavier la suspendent ; rien ne bouge sous `prefers-reduced-motion`. Mode `list` seulement.
       */
      autoplay?: boolean;
      id?: never;
      activeId?: never;
      onActiveChange?: never;
    }
  | {
      /**
       * `listbox` : une liste d'options (`ListRow option`) dont la ligne active est pilotée de l'extérieur — le
       * motif combobox + listbox, où le focus reste dans un champ. Le fond ne suit plus le focus.
       */
      mode: "listbox";
      autoplay?: never;
      /** L'`id` de la liste : le `aria-controls` du champ qui la pilote. Requis. */
      id: string;
      /** L'`id` de la ligne active : le fond se pose dessus. Absent : pas de fond. */
      activeId?: string;
      /** Le pointeur a bougé sur une autre ligne : demande de la rendre active. Le survol sans mouvement ne compte pas. */
      onActiveChange?: (id: string) => void;
    }
);

/** Un token de durée lu sur le document, en millisecondes — secondes comprises : le minifieur réécrit `1200ms` en `1.2s`. */
function tokenMs(name: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const amount = Number.parseFloat(value);
  if (Number.isNaN(amount)) return 0;
  return value.endsWith("ms") ? amount : amount * 1000;
}

/** Le token du pas de la lecture, sous sa forme `var()` : c'est ce qui le fait compter comme consommé (loi 10), comme `VISIBLE` de `Toaster`. */
const AUTOPLAY = "var(--duration-list-autoplay)";

/** `--duration-base` : le temps que le fond s'efface avant de reparaître ailleurs. */
function fadeDuration() {
  return tokenMs("--duration-base");
}

/**
 * List — le conteneur de `ListRow` : une liste verticale dont le FOND GRIS DE SURVOL GLISSE d'une ligne à
 * l'autre en suivant le pointeur, et s'efface en quittant la liste. Au clavier, le focus porte le même fond.
 * Spec : `docs/specs/2026-11-11-lot-3-retours-formulaires-design.md` § 2.4, `create`, sans benchmark Mobbin.
 * Le fond qui glisse est celui de `SegmentedTrack` — sa pastille — pris pour un survol : même durée
 * (`--duration-base`), même courbe (`--ease-in-out`), sans effet élastique.
 *
 * L'ANATOMIE. Un `<div>` `relative` qui contient le fond — un `<span aria-hidden>`, premier enfant, en
 * `absolute`, sur toute la largeur, hors de l'arbre d'accessibilité — et un `<ul>`. Le fond est un frère du `<ul>`
 * et non son enfant : HTML n'admet que des `<li>` dans une liste. Les lignes sont `relative` et suivent le fond dans
 * le DOM, donc se peignent par-dessus sans `z-index`. Les lignes sont à 4 px l'une de l'autre. LA LARGEUR EST CELLE
 * DU PARENT (loi 8).
 *
 * LA POSITION EST MESURÉE, comme celle de la pastille : `offsetTop` et `offsetHeight` de la ligne visée, écrits
 * en `--list-y` et `--list-h` sur le fond, qui les lit. La ligne est le `<li>` le plus proche de la cible. Une
 * ligne qui porte `data-disabled` n'est pas visée, et le fond la quitte. LE PREMIER PLACEMENT NE GLISSE PAS : quand
 * le fond était éteint, il se pose sur la ligne et ne fait qu'apparaître (`data-state="jump"`, sans transition de
 * position) ; il ne glisse que d'une ligne à une autre (`data-state="on"`). Tenu par le DOM, comme `data-state` de
 * `SegmentedTrack`, et non par React, qui le réécrirait.
 *
 * POINTEUR ET CLAVIER. Le survol se lit à `pointerover` — hors du toucher, où il n'y a pas de survol —, le départ
 * du pointeur éteint le fond, ou le rend à la ligne qui porte le focus clavier. Le focus clavier se lit à
 * `focusin` : le fond ne le suit que si le focus est `:focus-visible` — un clic sur un bouton ne l'allume pas —
 * et s'éteint à `focusout` quand le focus quitte la liste. L'anneau de focus du système reste peint sur la ligne,
 * jamais retiré (loi 4).
 *
 * MOUVEMENT RÉDUIT. `globals.css` ramène `--duration-base` à 1 ms : le fond saute d'une ligne à l'autre au lieu
 * de glisser, le composant n'a pas la requête à connaître.
 *
 * LE MODE `listbox` (`extend`, 2026-11-11, pour `CommandPalette`). `<ul role="listbox">` dont la ligne ACTIVE vient
 * de l'appelant (`activeId`) : le focus reste dans le champ du combobox, le fond se pose sur l'option qu'il désigne,
 * au clavier comme à la souris. Le pointeur ne la déplace que s'il BOUGE (`pointermove`, qui demande
 * `onActiveChange(id)`) : une liste qui défile sous un pointeur immobile, au clavier, ne lui reprend pas la main. Les
 * options sont les `<li role="option">` ; les en-têtes de groupe sont l'affaire de l'appelant. Le fond se replace
 * à chaque rendu et à chaque changement de taille — une liste dans un dialogue fermé est mesurée à 0, et se place
 * à l'ouverture. Le premier placement ne glisse pas, comme en mode `list`. D'UN GROUPE À L'AUTRE (`role="group"`, posé par l'appelant), le fond ne voyage pas : il s'efface en
 * `--duration-base` où il est, puis reparaît en fondu sur la ligne visée ; il ne glisse qu'entre deux lignes d'un même
 * groupe, pour ne jamais passer par-dessus un titre de groupe.
 *
 * LA LECTURE AUTOMATIQUE (`autoplay`, 2026-11-12, `extend`, pour les cartes « Navigation » et « Dense lists » du site
 * de Neume). Le fond gris avance SEUL, d'une ligne à la suivante, toutes les `--duration-list-autoplay`
 * (1200 ms, une attente lue par `getComputedStyle` et non un `transition-delay`, comme `--duration-toast-visible`),
 * saute les lignes désactivées et revient en haut après la dernière : c'est la même mécanique que le survol — il glisse
 * d'une ligne à l'autre, paraît sans glisser au premier placement. LE POINTEUR A LA PRIORITÉ : dès qu'il entre dans la
 * liste, la lecture se suspend et le fond le suit comme toujours ; en sortant, elle reprend de la dernière ligne qu'il a
 * visée, au pas plein. Elle est suspendue aussi au focus clavier (`:focus-visible` dans la liste) : celui qui tabule
 * ne voit pas le fond lui échapper. SOUS `prefers-reduced-motion`, RIEN NE JOUE : le fond reste éteint jusqu'au survol ou
 * au focus — comme sans la prop. Le fond est décoratif (`aria-hidden`) et ne déplace jamais le focus ; la lecture
 * s'arrête dès qu'on s'en approche, c'est le moyen de la suspendre (WCAG 2.2.2). Mode `list` seulement : le mode
 * `listbox` tient sa ligne active de l'appelant.
 *
 * SA SÉMANTIQUE EST CELLE D'UN `<ul>` (angle mort n° 20 de `.claude/rules/loi-07-accessibilite.md` : WebKit retire
 * le rôle de liste quand le style supprime ses puces, ici comme partout). COMPOSANT CLIENT (`runtime: "client"`) :
 * refs, écouteurs et mesure du DOM.
 *
 * Histoire : `docs/history/list.md`.
 */
export function List({ children, label, mode, autoplay, id, activeId, onActiveChange }: ListProps) {
  const box = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLSpanElement>(null);
  const listbox = mode === "listbox";
  /* Le dernier rendu, lu par les écouteurs natifs du mode `listbox`. */
  const latest = useRef({ activeId, onActiveChange });

  /* Le fond sur `row`, ou éteint si `row` est nul. Éteint, il ne porte plus de `data-state`. */
  const place = useCallback((row: HTMLElement | null) => {
    const fond = mark.current;
    if (!fond) return;
    if (!row) {
      delete fond.dataset.state;
      return;
    }
    const hidden = fond.dataset.state === undefined || fond.dataset.state === "off";
    fond.style.setProperty("--list-y", `${row.offsetTop}px`);
    fond.style.setProperty("--list-h", `${row.offsetHeight}px`);
    fond.dataset.state = hidden ? "jump" : "on";
  }, []);

  /* Le changement de groupe en mode `listbox` : la ligne visée et la minuterie de l'effacement en cours. */
  const fade = useRef({ timer: 0, target: "", group: null as Element | null });
  useEffect(() => {
    const state = fade.current;
    return () => window.clearTimeout(state.timer);
  }, []);

  /* Le mode `listbox` : le fond suit `activeId`. Sans dépendances — il se replace après chaque rendu, les
   * lignes ayant pu changer sous le même `id` —, et à chaque changement de taille de la liste. */
  useEffect(() => {
    latest.current = { activeId, onActiveChange };
    const root = box.current;
    if (!listbox || !root) return;

    const options = () => Array.from(root.querySelectorAll<HTMLElement>('[role="option"]'));
    const find = (id: string | undefined) => options().find((el) => el.id === id) ?? null;
    const sync = () => {
      const f = fade.current;
      const fond = mark.current;
      /* Une liste à 0 de haut (le dialogue est fermé) n'a rien à mesurer : le fond s'éteint. */
      const row = root.offsetHeight === 0 ? null : find(activeId);
      if (!row || !fond) {
        window.clearTimeout(f.timer);
        f.timer = 0;
        f.target = "";
        f.group = null;
        place(null);
        return;
      }
      const group = row.closest('[role="group"]');
      if (f.timer && f.target === row.id) return;
      const shown = fond.dataset.state === "on" || fond.dataset.state === "jump";
      window.clearTimeout(f.timer);
      f.timer = 0;
      /* D'un groupe à l'autre, le fond ne voyage pas : il s'efface où il est, puis reparaît en fondu sur la ligne
       * visée. Il ne glisse qu'entre deux lignes d'un même groupe. */
      if (shown && f.group !== group) {
        fond.dataset.state = "off";
        f.target = row.id;
        f.group = group;
        f.timer = window.setTimeout(() => {
          f.timer = 0;
          place(find(latest.current.activeId));
        }, fadeDuration());
        return;
      }
      f.group = group;
      place(row);
    };
    sync();

    const observer = new ResizeObserver(sync);
    observer.observe(root);

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const target = event.target instanceof Element ? event.target.closest("li") : null;
      if (!target || target.getAttribute("role") !== "option") return;
      if (target.id !== latest.current.activeId) latest.current.onActiveChange?.(target.id);
    };
    root.addEventListener("pointermove", onPointerMove);
    return () => {
      observer.disconnect();
      root.removeEventListener("pointermove", onPointerMove);
    };
  });

  useEffect(() => {
    const root = box.current;
    if (listbox || !root) return;

    const rowOf = (target: EventTarget | null) => {
      const row = target instanceof Element ? target.closest<HTMLElement>("li") : null;
      return row && root.contains(row) && !row.hasAttribute("data-disabled") ? row : null;
    };

    /* La ligne qui porte le focus clavier, ou `null` : un clic sur un bouton ne la compte pas. */
    const focusedRow = () => {
      const active = document.activeElement;
      return active instanceof HTMLElement &&
        root.contains(active) &&
        active.matches(":focus-visible")
        ? rowOf(active)
        : null;
    };

    const onPointerOver = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      place(rowOf(event.target));
    };
    const onPointerLeave = () => place(focusedRow());
    const onFocusIn = (event: FocusEvent) => {
      const row = focusedRow();
      if (row && row === rowOf(event.target)) place(row);
    };
    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget;
      if (next instanceof Node && root.contains(next)) return;
      place(null);
    };

    root.addEventListener("pointerover", onPointerOver);
    root.addEventListener("pointerleave", onPointerLeave);
    root.addEventListener("focusin", onFocusIn);
    root.addEventListener("focusout", onFocusOut);
    return () => {
      root.removeEventListener("pointerover", onPointerOver);
      root.removeEventListener("pointerleave", onPointerLeave);
      root.removeEventListener("focusin", onFocusIn);
      root.removeEventListener("focusout", onFocusOut);
    };
  }, [listbox, place]);

  /* La lecture automatique (voir la docstring). Un effet à part, déclaré APRÈS celui des écouteurs du survol : à la
   * sortie du pointeur et du focus, c'est son écouteur qui passe en dernier, et c'est lui qui rend le fond à la lecture. */
  useEffect(() => {
    const root = box.current;
    if (listbox || !autoplay || !root) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (calm.matches) return;

    const rows = () =>
      Array.from(root.querySelectorAll<HTMLElement>("li")).filter(
        (row) => !row.hasAttribute("data-disabled"),
      );
    const rowOf = (target: EventTarget | null) => {
      const row = target instanceof Element ? target.closest<HTMLElement>("li") : null;
      return row && root.contains(row) && !row.hasAttribute("data-disabled") ? row : null;
    };

    let index = -1;
    let pointerInside = false;
    let focusInside = false;
    let timer = 0;

    const paused = () => pointerInside || focusInside;
    const show = () => {
      const all = rows();
      if (all.length === 0) return;
      index = ((index % all.length) + all.length) % all.length;
      place(all[index]);
    };
    const tick = () => {
      if (paused()) return;
      index += 1;
      show();
    };
    const start = () => {
      window.clearInterval(timer);
      timer = window.setInterval(tick, tokenMs(AUTOPLAY.slice(4, -1)) || 1200);
    };

    const onPointerOver = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      pointerInside = true;
      const row = rowOf(event.target);
      if (row) index = rows().indexOf(row);
    };
    const onPointerLeave = () => {
      if (!pointerInside) return;
      pointerInside = false;
      if (focusInside) return;
      show();
      start();
    };
    const onFocusIn = () => {
      const active = document.activeElement;
      if (active instanceof HTMLElement && active.matches(":focus-visible")) {
        focusInside = true;
        const row = rowOf(active);
        if (row) index = rows().indexOf(row);
      }
    };
    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget;
      if (next instanceof Node && root.contains(next)) return;
      if (!focusInside) return;
      focusInside = false;
      if (pointerInside) return;
      show();
      start();
    };

    root.addEventListener("pointerover", onPointerOver);
    root.addEventListener("pointerleave", onPointerLeave);
    root.addEventListener("focusin", onFocusIn);
    root.addEventListener("focusout", onFocusOut);
    index = 0;
    show();
    start();
    return () => {
      window.clearInterval(timer);
      root.removeEventListener("pointerover", onPointerOver);
      root.removeEventListener("pointerleave", onPointerLeave);
      root.removeEventListener("focusin", onFocusIn);
      root.removeEventListener("focusout", onFocusOut);
      place(null);
    };
  }, [listbox, autoplay, place]);

  return (
    <div ref={box} className="relative">
      <span
        ref={mark}
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 rounded-lg bg-list-highlight opacity-0",
          "h-[var(--list-h)] [translate:0_var(--list-y)]",
          "transition-[translate,height,opacity] duration-[var(--duration-base)] ease-in-out",
          "data-[state=jump]:transition-[opacity] data-[state=off]:transition-[opacity]",
          "data-[state=on]:opacity-100 data-[state=jump]:opacity-100",
        )}
      />
      <ul
        id={id}
        role={listbox ? "listbox" : undefined}
        aria-label={label}
        className="flex flex-col gap-1"
      >
        {children}
      </ul>
    </div>
  );
}
