"use client";

import { useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type DialogProps = {
  /** Ouvert ou fermé, toujours tenu par l'appelant : à vrai la couche s'ouvre, à faux elle sort. */
  open: boolean;
  /**
   * La demande de changement : `false` sur Échap, le geste retour d'Android et un clic sur le voile,
   * et quand le navigateur a fermé le dialogue de lui-même. La croix est à l'appelant, qui demande la
   * fermeture en passant `open` à faux.
   */
  onOpenChange: (open: boolean) => void;
  /** Après la sortie animée et le `close()` réel : le focus et le reste de l'appelant s'y règlent. */
  onClosed?: () => void;
  /**
   * `panel` : le panneau de la popin, sur la surface de la page. `flush` : le même panneau SANS padding,
   * rognant ses coins — le contenu pose le sien : la palette de commandes. `none` : l'enveloppe nue.
   */
  surface?: "panel" | "flush" | "none";
  /** La largeur du panneau. `sm` : 400 px au plus. `mid` : 440 px au plus. `md` : 560 px au plus. `lg` : celle du contenu. Sans effet en `none`. */
  width?: "sm" | "mid" | "md" | "lg";
  /** Où se pose la couche. `center` : au milieu de la fenêtre. `top` : à `--size-dialog-top-offset` du haut, un peu au-dessus du milieu. */
  placement?: "center" | "top";
  /** Ce qui couvre la fenêtre au-dessus de la couche, hors de l'enveloppe qui entre : les confettis de la carte. */
  overlay?: ReactNode;
  children: ReactNode;
} & (
  | {
      /** Le nom accessible, écrit en clair quand rien dans la couche ne le porte. */
      label: string;
      labelledBy?: never;
    }
  | {
      /** L'`id` de ce qui nomme la couche — un titre, une phrase. */
      labelledBy: string;
      label?: never;
    }
);

/**
 * La durée de la sortie, lue sur le document au moment de fermer. Sous `prefers-reduced-motion`, la
 * couche ne l'attend pas : elle se ferme sur-le-champ.
 */
const CLOSING = "var(--duration-base)";

interface Hooks {
  /** Échap, le geste retour, le voile : la couche demande à l'appelant de la fermer. */
  dismiss: () => void;
  /** Fin de couche. `byBrowser` : le navigateur l'a fermée sans passer par `close`. */
  closed: (byBrowser: boolean) => void;
}

/**
 * Le cycle de vie du dialogue, monté par l'effet et rendu avec son nettoyage — le `mountDialog` de
 * `ShareButton` et d'`Exhibit`, lui-même réduit du moteur de `ScratchCard`, réunis ici le 2026-10-23.
 *
 * IL N'Y A QU'UN CHEMIN DE FERMETURE, gardé par un drapeau : la croix de l'appelant, Échap, le geste
 * retour et le voile aboutissent tous à `close`, par `open` passé à faux. Fermer pendant l'ouverture
 * repart de la valeur en cours de la transition, rien ne reste à mi-chemin ; une seconde demande
 * pendant la sortie n'en lance pas une autre ; rouvrir pendant la sortie la reprend où elle en est.
 * Le navigateur peut aussi fermer le dialogue de son propre chef (deux gestes retour sans activation,
 * sous Chrome) : `finish`, idempotent, remet alors tout à zéro et le dit à l'appelant.
 */
function mountDialog(dialog: HTMLDialogElement, envelope: HTMLDivElement, hooks: Hooks) {
  const html = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const listen = new AbortController();
  const { signal } = listen;

  let shown = false;
  let closing = false;
  let timer = 0;
  let locked = false;
  let previous = "";

  const unlock = () => {
    if (locked) html.style.overflow = previous;
    locked = false;
  };

  /* Fin de couche, appelée juste après `close()` ET sur l'événement natif : idempotente. */
  const finish = (byBrowser: boolean) => {
    window.clearTimeout(timer);
    closing = false;
    delete dialog.dataset.state;
    unlock();
    if (!shown) return;
    shown = false;
    hooks.closed(byBrowser);
  };

  const open = () => {
    if (closing) {
      window.clearTimeout(timer);
      closing = false;
      dialog.dataset.state = "open";
      return;
    }
    if (dialog.open) return;
    previous = html.style.overflow;
    html.style.overflow = "hidden";
    locked = true;
    /* `showModal()` donne le focus au premier contrôle du contenu, et rien ne le déplace : un focus
     * posé par script sur le panneau peindrait l'anneau du plancher de focus autour de lui. */
    dialog.showModal();
    shown = true;
    /* Une lecture de mise en page entre `showModal()` et l'état ouvert : c'est elle qui donne à la
     * transition ses valeurs de départ, fermées. */
    void dialog.offsetWidth;
    dialog.dataset.state = "open";
  };

  const close = () => {
    if (!dialog.open || closing) return;
    if (reduced.matches) {
      dialog.close();
      finish(false);
      return;
    }
    closing = true;
    dialog.dataset.state = "closing";
    const ms = parseFloat(getComputedStyle(html).getPropertyValue(CLOSING.slice(4, -1))) || 0;
    timer = window.setTimeout(() => {
      dialog.close();
      finish(false);
    }, ms);
  };

  /* Échap et le geste retour d'Android : la fermeture native est annulée, l'appelant décide. */
  dialog.addEventListener(
    "cancel",
    (event) => {
      event.preventDefault();
      hooks.dismiss();
    },
    { signal },
  );

  /* Le voile n'est pas un contrôle : son équivalent clavier est Échap. Est « dehors » tout ce qui
   * n'est pas dans l'enveloppe — le dialogue lui-même, qui remplit la fenêtre. L'appui ET le relâché
   * doivent tomber dehors, pour qu'un geste entamé dedans (une sélection, un grattage qui déborde) et
   * relâché sur le voile ne ferme pas la couche. */
  const outside = (target: EventTarget | null) =>
    !(target instanceof Node) || !envelope.contains(target);
  let downOutside = false;
  dialog.addEventListener("pointerdown", (event) => (downOutside = outside(event.target)), {
    signal,
  });
  dialog.addEventListener(
    "click",
    (event) => {
      if (downOutside && outside(event.target)) hooks.dismiss();
      downOutside = false;
    },
    { signal },
  );

  dialog.addEventListener("close", () => finish(!closing), { signal });

  return {
    open,
    close,
    destroy: () => {
      listen.abort();
      window.clearTimeout(timer);
      if (dialog.open) dialog.close();
      delete dialog.dataset.state;
      unlock();
    },
  };
}

/**
 * Dialog — la couche modale du système : un `<dialog>` ouvert par `showModal()`, un voile, et une
 * enveloppe qui entre au geste de `Reveal`, nue ou en panneau. Cadré avec Florian le 2026-10-23,
 * benchmark Mobbin compris ; spec `docs/specs/2026-10-23-lot-i-couche-modale-design.md`.
 *
 * TROIS COMPOSANTS ÉCRIVAIENT CHACUN LA LEUR, ET C'ÉTAIT LA MÊME : `ScratchCard` (2026-10-06),
 * `ShareButton` (2026-10-19) et `Exhibit` (2026-10-20). Ce composant est ce qui était identique dans les
 * trois copies, et rien de plus ; ce qui différait reste à l'appelant. Une correction se fait ici une
 * fois. Le nom est celui de l'élément qu'il rend, le vocabulaire du champ `elements` ; ce n'est pas la
 * `Popin` de 2026-08-14, retirée le 2026-10-12, dont le panneau un cran plus clair a été écarté.
 *
 * L'OUVERTURE EST CONTRÔLÉE, TOUJOURS : `open` + `onOpenChange`, la convention que la loi 11 (règle 3
 * des états contrôlés) nommait d'avance. `Dialog` ne rend aucun bouton. La croix appartient à
 * l'appelant, qui passe `open` à faux ; Échap, le geste retour d'Android et le voile DEMANDENT la
 * fermeture par `onOpenChange(false)`, et c'est encore l'appelant qui la décide. `onClosed` est
 * appelé une fois, après la sortie animée et le `close()` réel. Le navigateur peut fermer le dialogue
 * de lui-même : `onOpenChange(false)` puis `onClosed`, pour que l'état de l'appelant ne mente pas.
 *
 * LE CONTENU EST RENDU AVANT L'OUVERTURE : le dialogue fermé porte ses enfants, que l'appelant écrit
 * avant de passer `open` à vrai — le panneau est complet à son premier affichage, et son nom existe
 * quand le navigateur le lit. Un appelant qui veut une couche vide jusqu'à la première ouverture ne
 * passe ses enfants qu'à partir de là (`ShareButton`, `Exhibit`).
 *
 * UN `<dialog>` OUVERT PAR `showModal()` : le top layer, le piège de focus, l'inertie du document
 * derrière et Échap sont natifs. Ses styles d'agent utilisateur sont annulés, sa géométrie est la
 * fenêtre. `hidden` en base et `open:flex` par-dessus, JAMAIS un utilitaire de disposition sans
 * condition sur un `<dialog>`, sans quoi le dialogue fermé reste mis en page et avale les clics — la
 * leçon de l'ancienne `Popin`. Le verrou de défilement de la racine est posé à l'ouverture et rendu à
 * la fermeture comme au démontage. Les écouteurs sont natifs, posés par un effet : un gestionnaire de
 * clic sur un `<dialog>` fait rougir le lint d'accessibilité, et le voile n'est pas un contrôle.
 *
 * L'ENTRÉE ET LA SORTIE SONT ANIMÉES PAR UN ÉTAT, PAS PAR `transition-discrete` : `data-state="open"`
 * une image après `showModal()`, `closing` à la fermeture, et `close()` seulement à la fin de la
 * transition — le dialogue reste ouvert, donc centré, pendant toute la sortie (la voie
 * `transition-discrete` faisait partir la carte de `ScratchCard` en haut à gauche). L'ENVELOPPE ENTRE
 * AU GESTE DE `Reveal` : de l'opacité 0, d'un décalage de `--lift-reveal` vers le bas et d'un flou de
 * `--blur-reveal` à son repos, en `--duration-reveal` et `--ease-out`. L'ARRIVÉE EST `none` pour
 * `translate` et `filter`, pas une valeur identité : un ancêtre à `translateY(0)` resterait le bloc
 * conteneur de ses descendants fixes. La sortie fait le chemin inverse en `--duration-base`, la durée
 * que le cycle lit pour attendre avant `close()`. Le voile fond en `--duration-base` dans les deux
 * sens. Elle entre D'UN BLOC, sans cascade de son contenu. Sous `prefers-reduced-motion`, les durées
 * et les amplitudes sont ramenées à rien par `globals.css`, et la fermeture n'attend pas : la couche
 * est là, ou n'est pas.
 *
 * DEUX SURFACES (`surface`). `panel`, le défaut, est le panneau de la popin de `ShareButton`, repris par
 * la visionneuse d'`Exhibit` : la surface de la page, le rayon de la famille, `--shadow-elevation-lg`, un
 * padding de 16 px et le filet `--color-share-border`, transparent en clair et visible en sombre, où
 * ni le voile ni l'ombre ne détachent rien. Le dialogue garde alors une gouttière de chaque côté, en
 * haut et en bas aussi : le panneau ne touche jamais le bord, et s'il ne tient pas en hauteur il
 * défile plutôt que d'être rogné. `none` est l'enveloppe nue, sans gouttière, pour la carte de
 * `ScratchCard`, qui est son propre objet sur le voile.
 *
 * LES LARGEURS PORTENT UNE TAILLE ET NON UN USAGE : `sm` s'appelait `share` et `lg` `content`, deux noms
 * de leurs premiers appelants. Renommées le 2026-11-11 pour que `Dialog` serve n'importe qui
 * (anonymisation pour Consort, décision de Florian du 2026-11-11, spec
 * `docs/specs/2026-11-11-anonymisation-design.md` § 2), tous les appelants dans le même commit ; le
 * rendu ne bouge pas d'un pixel.
 *
 * LA LARGEUR DU PANNEAU EST UNE PROP FERMÉE (`width`), PAS UNE CLASSE QUI ENTRE (loi 11). `sm`, le
 * défaut, prend la largeur de la fenêtre moins les gouttières, et jamais plus de
 * `--size-share-panel-width` : la popin. `lg` enveloppe le contenu, et jamais plus que la fenêtre
 * moins les gouttières : la visionneuse, qui prend la largeur de son image plus le padding. Le panneau
 * ne pose AUCUN écart entre ses enfants : celui de la popin (16 px) et celui de la visionneuse (12 px)
 * différaient, ils restent à l'appelant, qui enveloppe son contenu.
 *
 * « DEDANS », C'EST L'ENVELOPPE ENTIÈRE, et c'est le seul choix qu'offre le composant : un clic
 * hors d'elle — sur le voile — ferme, l'appui et le relâché tombant dehors l'un et l'autre. Ce qui
 * couvre la fenêtre sans entrer avec l'enveloppe passe par `overlay`, rendu à côté d'elle : les
 * confettis de la carte, qu'un ancêtre transformé ou flouté ferait rétrécir à sa boîte pendant
 * l'entrée et la sortie.
 *
 * TROIS OPTIONS DE PLUS LE 2026-11-11 (`extend`, spec `docs/specs/2026-11-11-lot-4-composites-design.md` § 2.1),
 * pour que `CommandPalette` COMPOSE `Dialog` au lieu d'en écrire une copie : `surface="flush"` (le panneau sans
 * padding, qui rogne ses coins, pour un contenu qui pose le sien), `width="md"` (`--size-dialog-width-md`, 560 px
 * au plus) et `placement="top"` (le panneau à `--size-dialog-top-offset` du haut, 15 vh, au lieu du centre). Les
 * valeurs par défaut sont celles d'avant : rien ne bouge pour les appelants existants.
 *
 * `width="mid"` LE 2026-11-11 (`extend`, spec `docs/specs/2026-11-11-fiche-icone-design.md` § 2) : 440 px au plus
 * (`--size-dialog-width-mid`), la colonne de la fiche d'une icône, où ses trois actions tiennent sur une ligne
 * (393 px dans 408 utiles ; elles ne tiennent pas dans les 366 de `sm`). Même règle que les autres : la fenêtre
 * moins les gouttières en dessous. Les valeurs par défaut sont celles d'avant.
 *
 * LE FOCUS EST NATIF. `showModal()` le donne au premier contrôle du contenu — la croix, dans les deux
 * panneaux —, et aucune ligne ne le déplace : c'est la décision de Florian du 2026-08-14 pour
 * l'ancienne `Popin`, reprise par `ShareButton` (un `focus()` posé par script sur le panneau peignait
 * l'anneau du plancher de focus autour de lui). Le panneau n'a donc PAS de `tabindex`. À la fermeture
 * le navigateur rend le focus à l'élément qui l'avait ; un appelant dont ce déclencheur n'est plus
 * focalisable le règle dans `onClosed` (le ticket de la carte, le bouton d'un onglet fermé).
 *
 * LE NOM ACCESSIBLE est requis par le type : `label` (`aria-label`) ou `labelledBy`
 * (`aria-labelledby`), jamais les deux, jamais aucun.
 *
 * ÉTATS : la couche n'en a pas cinq, ce sont ses contrôles — ceux de l'appelant — qui les ont. Elle
 * en déclare trois au manifeste : `hidden`, `open` et `closing`.
 *
 * COMPOSANT CLIENT : un effet, des écouteurs, un minuteur, une mesure du DOM. Il n'est utilisable que
 * depuis un composant client, `onOpenChange` étant une fonction : sur `/design-system`, c'est un îlot
 * de vitrine qui l'ouvre.
 *
 * CE QUE LA MACHINE NE VOIT PAS : l'entrée en 700 ms et la sortie en 200 ms, le filet en sombre,
 * l'anneau de la croix quand la couche s'ouvre au clavier, le focus rendu au déclencheur, le
 * défilement de la page bloqué derrière, et la fermeture au voile qui ne se déclenche pas sur une
 * sélection relâchée dehors. Ils se jugent sur `/design-system`.
 *
 * Histoire : `docs/history/dialog.md`.
 */
export function Dialog({
  open,
  onOpenChange,
  onClosed,
  surface = "panel",
  width = "sm",
  placement = "center",
  overlay,
  label,
  labelledBy,
  children,
}: DialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const envelope = useRef<HTMLDivElement>(null);
  const lifecycle = useRef<ReturnType<typeof mountDialog> | null>(null);
  /* Les rappels du dernier rendu, lus par les écouteurs natifs, qui ne voient pas les props. */
  const latest = useRef({ onOpenChange, onClosed });

  useLayoutEffect(() => {
    latest.current = { onOpenChange, onClosed };
  });

  useLayoutEffect(() => {
    const node = dialog.current;
    const inner = envelope.current;
    if (!node || !inner) return;
    const mounted = mountDialog(node, inner, {
      dismiss: () => latest.current.onOpenChange(false),
      closed: (byBrowser) => {
        if (byBrowser) latest.current.onOpenChange(false);
        latest.current.onClosed?.();
      },
    });
    lifecycle.current = mounted;
    return () => {
      mounted.destroy();
      lifecycle.current = null;
    };
  }, []);

  /* Après le rendu qui a écrit le contenu, avant que le navigateur peigne : `showModal()` le trouve
   * complet. */
  useLayoutEffect(() => {
    if (open) lifecycle.current?.open();
    else lifecycle.current?.close();
  }, [open]);

  const framed = surface !== "none";
  const padded = surface === "panel";

  return (
    <dialog
      ref={dialog}
      aria-label={label}
      aria-labelledby={labelledBy}
      className={cn(
        "group fixed inset-0 m-0 h-full max-h-none w-full max-w-none overflow-hidden bg-transparent",
        framed ? "p-[var(--layout-gutter)]" : "p-0",
        placement === "top" && "pt-[var(--size-dialog-top-offset)]",
        /* `hidden` en base, `open:flex` par-dessus. */
        "hidden justify-center open:flex",
        placement === "top" ? "items-start" : "items-center",
        "backdrop:bg-scrim backdrop:opacity-0 data-[state=open]:backdrop:opacity-100",
        "backdrop:transition-opacity backdrop:duration-[var(--duration-base)] backdrop:ease-out",
      )}
    >
      <div
        ref={envelope}
        className={cn(
          "flex flex-col",
          /* Fermée : sous sa place, floue, transparente. Ouverte : à `none`, jamais à une valeur
           * identité. La sortie reprend le chemin en sens inverse, en `--duration-base`. */
          "translate-y-[var(--lift-reveal)] opacity-0 blur-[var(--blur-reveal)]",
          "transition-[opacity,translate,filter] duration-[var(--duration-reveal)] ease-out",
          "group-data-[state=open]:translate-none group-data-[state=open]:opacity-100 group-data-[state=open]:filter-none",
          "group-data-[state=closing]:duration-[var(--duration-base)]",
          framed && [
            "max-h-full",
            padded ? "overflow-y-auto overscroll-contain" : "overflow-hidden",
            "rounded-2xl border-[length:var(--border-thin)] border-share-border bg-surface text-text-primary shadow-elevation-lg",
            padded && "p-4",
            width === "sm" && "w-full max-w-[var(--size-share-panel-width)]",
            width === "mid" && "w-full max-w-[var(--size-dialog-width-mid)]",
            width === "md" && "w-full max-w-[var(--size-dialog-width-md)]",
            width === "lg" && "max-w-full",
          ],
        )}
      >
        {children}
      </div>
      {overlay}
    </dialog>
  );
}
