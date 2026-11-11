"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import type { IconName } from "@/components/ui/icon";
import { Icon } from "@/components/ui/icon";
import { Kbd } from "@/components/ui/kbd";
import { List } from "@/components/ui/list";
import { ListRow } from "@/components/ui/list-row";
import { cn } from "@/lib/cn";

/** Une ligne de la palette : un libellé, et OÙ elle mène (`href`) OU ce qu'elle fait (`onSelect`). */
export type CommandPaletteItem = {
  /** Le libellé, aussi le nom accessible de l'option et la base du filtre. */
  label: string;
  /** Le glyphe avant le libellé, à la taille de son dessin. Décoratif. */
  icon?: IconName;
  /** Une méta à droite, au tertiaire : « Page », « ⌘C ». */
  meta?: string;
  /** Des mots de plus pour le filtre, qui ne s'affichent pas. */
  keywords?: string[];
} & (
  | {
      /** Où mène la ligne : choisie, la page y va. */
      href: string;
      /** Ouvre le lien dans un nouvel onglet. */
      newTab?: boolean;
      onSelect?: never;
    }
  | {
      href?: never;
      newTab?: never;
      /** L'action de la ligne : choisie, elle part, puis la palette se ferme. */
      onSelect: () => void;
    }
);

/** Un groupe nommé de lignes : « Icons », « Pages », « Actions ». Un groupe sans résultat disparaît. */
export type CommandPaletteGroup = {
  label: string;
  items: CommandPaletteItem[];
};

interface CommandPaletteProps {
  /** Ouverte ou fermée, toujours tenue par l'appelant, comme `Dialog`. */
  open: boolean;
  /** La demande de changement : Échap, le voile, ⌘K / Ctrl+K, et le choix d'une ligne, qui ferme la palette. */
  onOpenChange: (open: boolean) => void;
  /** Les résultats, en groupes nommés. La palette les filtre par la requête. */
  groups: CommandPaletteGroup[];
  /**
   * ⌘K (Mac) / Ctrl+K ouvre et ferme la palette. Vrai par défaut. Le déclencheur VISIBLE est à la page : un
   * `Button`, un `SearchField`. Une page qui pose le raccourci elle-même, avec `Kbd`, passe `false`.
   */
  hotkey?: boolean;
  /** Le texte d'attente du champ. Défaut « Search… ». */
  placeholder?: string;
  /** Le nom accessible de la palette, du champ et de la liste. Défaut « Command palette ». */
  label?: string;
  /**
   * La requête, tenue par l'appelant : pour qu'un `SearchField` de la page ouvre la palette avec ce qu'on y a déjà
   * tapé. À passer avec `onQueryChange`. Absente, la palette la tient et repart de vide à chaque ouverture.
   */
  query?: string;
  /** Appelée à chaque frappe dans le champ de la palette. */
  onQueryChange?: (query: string) => void;
  /** Le titre de l'état sans résultat. Défaut « No results ». */
  emptyTitle?: string;
  /** La phrase de l'état sans résultat. Défaut « Try a different search. » */
  emptyDescription?: string;
  /** Les mots du pied, à côté des touches : défauts « navigate », « select », « close ». */
  hints?: { navigate?: string; select?: string; close?: string };
}

/** La palette ne filtre que sur le libellé et les mots-clés : sous-chaîne, sans casse. */
function matches(item: CommandPaletteItem, query: string) {
  if (!query) return true;
  return [item.label, ...(item.keywords ?? [])].some((text) => text.toLowerCase().includes(query));
}

/** Va où mène la ligne, ou fait l'action qu'elle porte. */
function run(item: CommandPaletteItem) {
  if (item.onSelect) {
    item.onSelect();
  } else if (item.newTab) {
    window.open(item.href, "_blank", "noopener");
  } else {
    window.location.assign(item.href);
  }
}

interface BodyProps {
  groups: CommandPaletteGroup[];
  query: string;
  onQueryChange: (query: string) => void;
  close: () => void;
  placeholder: string;
  label: string;
  emptyTitle: string;
  emptyDescription: string;
  hints: { navigate: string; select: string; close: string };
}

/**
 * Le contenu de la palette, monté À L'OUVERTURE et démonté après la sortie : son état — la ligne active — repart
 * de zéro à chaque ouverture, et les `Kbd` du pied, qui écoutent le document, ne prennent aucune touche de la
 * page tant que la palette est fermée. Code interne du fichier : l'appelant n'y a pas accès.
 */
function PaletteBody({
  groups,
  query,
  onQueryChange,
  close,
  placeholder,
  label,
  emptyTitle,
  emptyDescription,
  hints,
}: BodyProps) {
  const listId = useId();
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  /* Le contour ne s'allume que sur Tab : le focus posé par script à l'ouverture, quel que soit le déclencheur, ne compte pas. */
  const [tabbed, setTabbed] = useState(false);

  const needle = query.trim().toLowerCase();
  const visible = groups
    .map((group) => ({ ...group, items: group.items.filter((item) => matches(item, needle)) }))
    .filter((group) => group.items.length > 0);

  /* La liste à plat, dans l'ordre d'affichage : l'index actif la parcourt, l'`id` désigne l'option. */
  let counter = 0;
  const rows = visible.map((group) =>
    group.items.map((item) => ({ item, id: `${listId}-option-${counter++}` })),
  );
  const flat = rows.flat();
  const count = flat.length;
  const index = Math.min(active, count - 1);
  const current = count > 0 ? flat[index] : undefined;

  const choose = (id: string) => {
    const row = flat.find((entry) => entry.id === id);
    if (!row) return;
    run(row.item);
    close();
  };
  /* Le choix du dernier rendu, lu par l'écouteur natif du clic. */
  const latest = useRef(choose);
  useEffect(() => {
    latest.current = choose;
  });

  const move = (step: number) => {
    if (count > 0) setActive((index + step + count) % count);
  };

  /* La ligne active reste à l'écran. La première ramène tout en haut : son en-tête de groupe y est. */
  useEffect(() => {
    const box = scroller.current;
    if (!box || !current) return;
    if (index === 0) {
      box.scrollTop = 0;
      return;
    }
    const row = Array.from(box.querySelectorAll<HTMLElement>('[role="option"]')).find(
      (el) => el.id === current.id,
    );
    row?.scrollIntoView({ block: "nearest" });
  }, [current, index]);

  /* Le clic sur une option, délégué : l'appui sur une option n'ôte pas le focus au champ, qui garde le clavier. */
  useEffect(() => {
    const box = scroller.current;
    if (!box) return;
    const optionOf = (target: EventTarget | null) =>
      target instanceof Element ? target.closest<HTMLElement>('[role="option"]') : null;
    const onPointerDown = (event: PointerEvent) => {
      if (optionOf(event.target)) event.preventDefault();
    };
    const onClick = (event: MouseEvent) => {
      const option = optionOf(event.target);
      if (option) latest.current(option.id);
    };
    box.addEventListener("pointerdown", onPointerDown);
    box.addEventListener("click", onClick);
    return () => {
      box.removeEventListener("pointerdown", onPointerDown);
      box.removeEventListener("click", onClick);
    };
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    setTabbed(event.key === "Tab");
    if (event.key === "ArrowDown") {
      event.preventDefault();
      move(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      move(-1);
    } else if (event.key === "Enter" && current) {
      event.preventDefault();
      choose(current.id);
    }
  };

  return (
    <div className="flex min-h-0 flex-col">
      <div
        data-keyboard-focus={tabbed ? "" : undefined}
        className={cn(
          "flex items-center gap-3 border-b-[length:var(--border-thin)] border-border-subtle p-4",
          "data-[keyboard-focus]:outline-solid data-[keyboard-focus]:outline-[length:var(--border-thick)]",
          "data-[keyboard-focus]:outline-offset-[calc(var(--border-thick)*-1)] data-[keyboard-focus]:outline-focus-ring",
        )}
      >
        <span className="flex shrink-0 text-text-tertiary">
          <Icon name="search" />
        </span>
        <input
          type="text"
          role="combobox"
          aria-label={label}
          aria-expanded={count > 0}
          aria-controls={count > 0 ? listId : undefined}
          aria-activedescendant={current?.id}
          aria-autocomplete="list"
          value={query}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => {
            onQueryChange(event.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => setTabbed(false)}
          className="min-w-0 flex-1 appearance-none rounded-md bg-transparent font-body text-body text-text-primary outline-none placeholder:text-text-tertiary"
        />
        <Kbd keys="escape" onTrigger={close} />
      </div>

      <div
        ref={scroller}
        className="max-h-[var(--size-command-palette-results-height)] min-h-0 overflow-y-auto overscroll-contain p-2"
      >
        {count > 0 ? (
          <List
            mode="listbox"
            id={listId}
            label={label}
            activeId={current?.id}
            onActiveChange={(id) => setActive(flat.findIndex((entry) => entry.id === id))}
          >
            {visible.map((group, g) => (
              <li key={group.label} role="presentation">
                <span
                  id={`${listId}-group-${g}`}
                  aria-hidden="true"
                  className="block px-2 pt-3 pb-1 font-body text-caption font-medium text-text-tertiary"
                >
                  {group.label}
                </span>
                <ul
                  role="group"
                  aria-labelledby={`${listId}-group-${g}`}
                  className="flex flex-col gap-1"
                >
                  {rows[g].map(({ item, id }) => (
                    <ListRow
                      key={id}
                      option
                      id={id}
                      selected={id === current?.id}
                      label={item.label}
                      icon={item.icon}
                      meta={item.meta}
                    />
                  ))}
                </ul>
              </li>
            ))}
          </List>
        ) : (
          <EmptyState
            size="compact"
            icon="search"
            title={emptyTitle}
            description={emptyDescription}
          />
        )}
      </div>

      <div className="flex items-center gap-4 border-t-[length:var(--border-thin)] border-border-subtle px-4 py-3 font-body text-caption text-text-tertiary [@media(hover:none)_and_(pointer:coarse)]:hidden">
        <span className="flex items-center gap-2">
          <Kbd keys="up" onTrigger={() => move(-1)} />
          <Kbd keys="down" onTrigger={() => move(1)} />
          {hints.navigate}
        </span>
        <span className="flex items-center gap-2">
          <Kbd keys="enter" onTrigger={() => current && choose(current.id)} />
          {hints.select}
        </span>
        <span className="flex items-center gap-2">
          <Kbd keys="escape" onTrigger={close} />
          {hints.close}
        </span>
      </div>
    </div>
  );
}

/**
 * CommandPalette — la palette de commandes : une couche en haut de l'écran, sur un voile, avec un champ de
 * recherche, des résultats en groupes et les raccourcis en pied. ⌘K / Ctrl+K l'ouvre. Pour le site de Neume,
 * Consort et le portfolio. Spec : `docs/specs/2026-11-11-lot-4-composites-design.md` § 2.1, `create`, sans benchmark
 * Mobbin (en pause) ; cadrée avec Florian sur le prototype « Nickel » (trois versions, en localhost).
 *
 * LES DÉCISIONS DE FLORIAN (spec § 1). La palette « Nickel » telle que prototypée : un voile, le champ en haut, des
 * groupes de résultats, un fond gris qui glisse au clavier et à la souris, les raccourcis en `Kbd` en pied, un
 * `EmptyState` compact sans résultat. SON DÉCLENCHEUR N'EST PAS DANS LE COMPOSANT : le faux champ du premier
 * prototype est retiré (« il n'est pas bon ») ; la page ouvre la palette par un `Button` du système (« Search »,
 * loupe), OU par le `SearchField` (« ça peut être une barre de recherche aussi »), OU par ⌘K. L'icône GitHub mini
 * de la ligne « Open on GitHub » est à dessiner par Florian : `GAPS.md`.
 *
 * COMPOSÉE, PAS RÉÉCRITE (ordre 3 de `CLAUDE.md`) : `Dialog` pour la couche, `List` et `ListRow` pour le fond qui
 * glisse et les lignes, `Kbd` pour tout raccourci affiché, `EmptyState` pour l'absence de résultat, `Icon`. Trois
 * composants gagnent une option pour la porter (`extend`, et ils repassent `draft`) : `Dialog` —
 * `placement="top"`, `width="md"`, `surface="flush"` —, `List` — `mode="listbox"`, la ligne active pilotée de
 * l'extérieur — et `ListRow` — la forme `option`, un `<li role="option">` sans contrôle imbriqué.
 *
 * L'ACCESSIBILITÉ (loi 7) : LE MOTIF COMBOBOX + LISTBOX. Le champ est un `<input role="combobox">` qui garde le
 * focus ; la liste est un `<ul role="listbox">` d'options `<li role="option">` en groupes (`role="group"`, nommés
 * par leur en-tête) ; la ligne active est désignée par `aria-activedescendant` sur le champ et `aria-selected` sur
 * l'option ; ↑ ↓ la déplacent (en boucle), Entrée choisit, Échap ferme. Le nom accessible est `label`, sur la couche,
 * le champ et la liste. `Dialog` rend le focus au déclencheur à la fermeture — l'élément qui l'avait — et piège le
 * focus dedans, le document derrière est inerte. Le champ suit l'EXCEPTION DE LA LOI 4 « le contour au clavier seulement,
 * sur un champ de saisie texte », comme `SearchField` : le contour (anneau du système) est peint sur l'en-tête, EN
 * DEDANS (décalage négatif, pour que le panneau ne le rogne pas), quand le focus arrive au clavier, et jamais à
 * l'ouverture à la souris ni à celle de ⌘K — la ligne active, au fond gris, dit où l'on est. Il ne s'allume que sur UNE FRAPPE DE TAB
 * dans le champ (`tabbed`) : `lib/use-keyboard-focus.ts` ne convient pas ici, le champ étant monté à l'ouverture, après
 * l'appui du pointeur que le hook devait voir, et il prenait le focus posé par script pour une arrivée au clavier.
 *
 * LES LIGNES. Chaque ligne est une `CommandPaletteItem` : un libellé, un glyphe, une méta à droite, des mots-clés
 * pour le filtre, et OÙ elle mène (`href`) OU ce qu'elle fait (`onSelect`). Le filtre est le plus simple qui serve :
 * sous-chaîne, sans casse, sur le libellé et les mots-clés ; un groupe vide disparaît. Choisie, une ligne `href`
 * navigue (`window.location.assign`, ou `window.open` en nouvel onglet), une ligne `onSelect` agit ; puis la
 * palette se ferme. Les glyphes sont ceux de `Icon`, rendus à la taille de leur dessin : la démo emploie les minis de 16 px de Neume (`-sm`) ; seul le glyphe GitHub
 * mini manque, une icône provisoire le remplace (`GAPS.md`).
 *
 * LA REQUÊTE est interne et repart de vide à chaque ouverture ; `query` + `onQueryChange` la rendent contrôlée, pour
 * qu'un `SearchField` de la page ouvre la palette avec ce qu'on y a déjà tapé. La loi 11 nomme `value` +
 * `onValueChange` l'état contrôlé d'un composant ; ici c'est une requête et non la valeur de la palette, d'où
 * `query` — choix de l'agent de build, à juger.
 *
 * LA LIGNE ACTIVE est tenue ici et pilote `List` : le fond gris glisse d'une ligne à l'autre au clavier, et suit
 * le pointeur quand il BOUGE (une liste qui défile sous un pointeur immobile ne lui reprend pas la main). Elle
 * repart de la première ligne à chaque frappe.
 *
 * LE GESTE D'ENTRÉE ET DE SORTIE EST CELUI DE `Reveal` ET DU `Toast`, par `Dialog` : la couche monte de 16 px, floue,
 * et se pose nette en 700 ms ; elle sort à l'envers en 200 ms ; instantané sous `prefers-reduced-motion`. Le fond
 * gris glisse en `--duration-base` et saute sous mouvement réduit.
 *
 * ⌘K / CTRL+K (`hotkey`, vrai par défaut) est écouté ICI, sur le document, et non par `Kbd` : la règle de Florian
 * veut que tout raccourci AFFICHÉ passe par `Kbd`, et la palette n'affiche pas le sien — le déclencheur visible est à
 * la page. Choix de l'agent de build, à rejuger : une page qui affiche ⌘K avec `Kbd` passe `hotkey={false}` et
 * appelle l'ouverture, sans quoi les deux écoutes se doubleraient. L'écoute ignore une frappe déjà traitée
 * (`defaultPrevented`) et exige Cmd ou Ctrl seul, sans Maj ni Alt.
 *
 * LES ÉTATS : la palette est une couche, ses contrôles ont les leurs. Le champ a le contour au clavier seulement ; une ligne a
 * le fond de `List` (survol de la souris, ligne active du clavier) et le libellé au primaire ; `disabled` ne
 * s'applique pas. La largeur est celle de `Dialog` `md` (560 px au plus, la fenêtre moins les gouttières), sa
 * position à 15 vh du haut.
 *
 * COMPOSANT CLIENT (`runtime: "client"`) : l'état, des écouteurs, l'écoute du document. `onOpenChange` et `onSelect`
 * sont des fonctions : sur `/design-system`, c'est un îlot (`ShowcaseCommandPalette`) qui l'instancie.
 *
 * CE QUE LA MACHINE NE VOIT PAS : le fond qui glisse au clavier et à la souris, le défilement qui garde la ligne
 * active à l'écran, le focus rendu au déclencheur, le geste d'entrée, la lecture au lecteur d'écran, ⌘K selon la
 * plateforme. Ils se jugent sur `/design-system`.
 *
 * Histoire : `docs/history/command-palette.md`.
 */
export function CommandPalette({
  open,
  onOpenChange,
  groups,
  hotkey = true,
  placeholder = "Search…",
  label = "Command palette",
  query,
  onQueryChange,
  emptyTitle = "No results",
  emptyDescription = "Try a different search.",
  hints,
}: CommandPaletteProps) {
  /* Monté de l'ouverture à la fin de la sortie : la bascule se règle PENDANT le rendu, avant le `Dialog`. */
  const [mounted, setMounted] = useState(false);
  if (open && !mounted) setMounted(true);

  const [own, setOwn] = useState("");
  const controlled = query !== undefined;
  const text = controlled ? query : own;

  const state = useRef({ open, onOpenChange });
  useEffect(() => {
    state.current = { open, onOpenChange };
  });

  useEffect(() => {
    if (!hotkey) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat) return;
      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return;
      if (event.key.toLowerCase() !== "k") return;
      event.preventDefault();
      state.current.onOpenChange(!state.current.open);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [hotkey]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      onClosed={() => {
        setMounted(false);
        setOwn("");
      }}
      surface="flush"
      width="md"
      placement="top"
      label={label}
    >
      {mounted || open ? (
        <PaletteBody
          groups={groups}
          query={text}
          onQueryChange={(next) => {
            if (!controlled) setOwn(next);
            onQueryChange?.(next);
          }}
          close={() => onOpenChange(false)}
          placeholder={placeholder}
          label={label}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
          hints={{
            navigate: hints?.navigate ?? "navigate",
            select: hints?.select ?? "select",
            close: hints?.close ?? "close",
          }}
        />
      ) : null}
    </Dialog>
  );
}
