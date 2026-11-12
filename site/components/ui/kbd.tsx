"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import {
  isMacPlatform,
  keyCaps,
  matchesShortcut,
  parseShortcut,
  useIsMac,
  usesCommandKey,
  type ParsedShortcut,
  type ShortcutKeys,
} from "@/lib/shortcut";

interface KbdProps {
  /**
   * Le raccourci, affiché et écouté : des modificateurs — `mod`, `ctrl`, `alt`, `shift` — puis une
   * touche, liés par `+` : `"/"`, `"mod+k"`, `"shift+?"`, `"escape"`, `"mod+shift+p"`. `mod` est ⌘ sur
   * Mac, Ctrl ailleurs. Le raccourci s'affiche en une seule capsule. L'écoute exige EXACTEMENT les
   * modificateurs écrits. GABARIT LITTÉRAL TYPESCRIPT ET NON UNION FERMÉE : exception assumée à la
   * loi 11, écrite dans la docstring et dans `lib/shortcut.ts`.
   */
  keys: ShortcutKeys;
  /**
   * L'action du raccourci, appelée APRÈS le geste : la touche s'assombrit, puis l'action part. Requise :
   * une touche affichée sans action serait un raccourci qui ment, et la règle de Florian veut que le
   * geste vienne avec chaque raccourci — donc que chaque raccourci passe par ici.
   */
  onTrigger: () => void;
}

/**
 * LES TOUCHES MONTÉES, DANS L'ORDRE DE MONTAGE. Une seule écoute `keydown` sur le document pour toutes,
 * posée par la première et retirée par la dernière. Quand une touche est pressée, c'est la DERNIÈRE
 * MONTÉE de ce nom qui la prend, et elle seule : un même raccourci ne déclenche jamais deux actions.
 * La dernière et non la première parce qu'une couche ouverte par-dessus la page — un dialogue qui
 * porterait son propre champ — monte après elle et doit prendre la main. Sur la vitrine, c'est ce qui
 * donne le `/` au champ de `SearchField` plutôt qu'à la touche seule posée au-dessus.
 */
interface Entry {
  shortcut: ParsedShortcut;
  fire: () => void;
}

const mounted: Entry[] = [];

/** Les symboles de modificateur de Mac : en `font-body` (Geist), qui les dessine sur la ligne des lettres. */
const MODIFIER_SYMBOLS = ["⌘", "⇧", "⌥"];

/** Vrai si la frappe vise un champ éditable : une touche sans modificateur y est un caractère, pas un raccourci. */
function isEditable(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || target.closest("input, textarea, select") !== null;
}

function onKeyDown(event: KeyboardEvent) {
  if (event.defaultPrevented || event.repeat || event.isComposing) return;

  const editable = isEditable(event.target);
  const mac = isMacPlatform();
  for (let i = mounted.length - 1; i >= 0; i--) {
    const { shortcut } = mounted[i];
    /* Dans un champ, seul un raccourci à Cmd ou Ctrl passe (docstring, « L'ÉCOUTE »). */
    if (editable && !usesCommandKey(shortcut)) continue;
    if (!matchesShortcut(event, shortcut, mac)) continue;
    event.preventDefault();
    mounted[i].fire();
    return;
  }
}

/**
 * `--duration-fast` lu sur le document, en millisecondes : le temps du geste avant l'action. Sous
 * `prefers-reduced-motion`, `globals.css` le ramène à 1 ms, et l'action part aussitôt. Lu en secondes
 * comme en millisecondes, comme le fait `Tooltip` : le minifieur peut réécrire l'unité.
 */
function pressDelay() {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue("--duration-fast")
    .trim();
  const amount = Number.parseFloat(value);
  if (Number.isNaN(amount)) return 0;
  return value.endsWith("ms") ? amount : amount * 1000;
}

/**
 * Kbd — la touche de raccourci, et le raccourci lui-même. Spec :
 * `docs/specs/2026-11-06-champ-de-recherche-design.md` § 2.
 *
 * LA RÈGLE DE FLORIAN : « je veux qu'on l'utilise toujours quand on ajoute un raccourci ». Elle ne tient
 * que si le geste vit dans UN composant : tout raccourci affiché passe par `Kbd`, et la touche qui
 * s'assombrit vient avec. Un raccourci écrit à la main ailleurs serait un sosie (ordre 3 de `CLAUDE.md`).
 * C'est pourquoi `Kbd` PORTE L'ÉCOUTE : le geste et le raccourci ne peuvent pas se séparer.
 *
 * L'ANATOMIE (refine du 2026-11-11, spec `docs/specs/2026-11-11-touche-kbd-design.md` § 2, décision de
 * Florian) : UNE CAPSULE PAR RACCOURCI. Un `<kbd>` extérieur porte la forme — 24 px de haut, 24 de large au
 * moins, qui grandit avec son contenu, un filet de `--border-thin` sur les quatre côtés
 * (`--color-kbd-border`), la face `--color-kbd-surface`, un rayon de 4 px, le texte en `text-caption`
 * (12 sur 16) au tertiaire. Chaque touche du raccourci est un `<kbd>` imbriqué — la forme HTML d'une
 * combinaison —, SANS FORME PROPRE et sans écart ajouté : l'approche de la fonte suffit. `self-start`,
 * comme `Button` : dans une colonne flex, l'étirement par défaut lui donnerait toute la largeur reçue, et
 * elle cesserait d'épouser son contenu (loi 8). Rayon de 4 px : le prototype posait 6, que le système n'a
 * pas, et 4 est le cran de la puce de code, sa voisine de forme.
 *
 * LES CARACTÈRES SONT CENTRÉS dans la hauteur de la capsule (chaque touche est une grille
 * `place-items-center` de la hauteur de la capsule). LES SYMBOLES DE MODIFICATEUR ⌘ ⇧ ⌥ SONT EN
 * `font-body` (Geist), qui les dessine sur la même ligne que les lettres, quand Geist Mono les rend
 * décalés ou les laisse à une fonte de repli ; les lettres, les chiffres et les mots (« Esc ») restent en
 * `font-code`, permis par la loi 3 sur un `<kbd>`.
 *
 * LE GESTE : la touche pressée au clavier S'ASSOMBRIT ET NE BOUGE PAS. Sa face passe à
 * `--color-kbd-surface-pressed`, son filet à `--color-kbd-border-pressed` et son texte du tertiaire au
 * primaire, en `--duration-fast` sur `--ease-out` — les couleurs seules (`background-color`,
 * `border-color`, `color`) ; puis l'action part, `--duration-fast` plus tard. Le visiteur voit la touche
 * foncer, puis le champ prendre la main. Rien à neutraliser sous `prefers-reduced-motion` : sans
 * translation, il ne reste que des couleurs, et `globals.css` ramène déjà la durée à 1 ms.
 *
 * HISTOIRE, avant le 2026-11-11 : la touche était une puce par caractère, avec un rebord de 2 px en bas
 * (`--border-kbd-ledge`), et elle DESCENDAIT d'1 px à l'appui (`--shift-kbd-press`) pendant que son rebord
 * passait à 1 px. Florian a vu trois défauts — plusieurs carrés pour un raccourci, la descente, des
 * caractères mal centrés — et choisi la piste A, plate à filet de 1 px. Les deux tokens sont supprimés.
 *
 * L'ÉCOUTE (choix de l'agent de cadrage, spec § 2, étendue le 2026-11-11) : `keydown` sur le document. Elle
 * exige EXACTEMENT les modificateurs que `keys` écrit — Cmd, Ctrl et Alt tenus ou non, jamais « en plus » :
 * `"k"` ne répond plus à Cmd + K, et `"mod+k"` ne répond pas à `k` seule. Avant le 2026-11-11 elle
 * refusait tout modificateur, parce que `"/"` était le seul raccourci et que Cmd + `/` est celui d'un autre ;
 * l'exactitude garde cette protection et la généralise. Maj suit la règle de `lib/shortcut.ts` : exact
 * pour une lettre, un chiffre ou une touche nommée, ignoré pour une ponctuation — sur un clavier AZERTY
 * de Mac, `/` se tape Maj + `:`. Elle IGNORE aussi la frappe quand une composition est en cours ou que la
 * touche se répète. Elle appelle `preventDefault`, sans quoi Firefox ouvrirait sa recherche rapide sur
 * `/`. Une seule touche montée prend chaque frappe, la dernière (voir `mounted`).
 *
 * DANS UN CHAMP ÉDITABLE — `input`, `textarea`, `select`, `contenteditable` —, UN RACCOURCI SANS Cmd NI
 * Ctrl EST UN CARACTÈRE, pas un raccourci : `/` ne doit pas voler la frappe de qui écrit une adresse, et
 * ce refus est gardé tel quel. UN RACCOURCI QUI PORTE `mod` OU `ctrl` MARCHE AUSSI DEPUIS UN CHAMP :
 * c'est l'usage standard (Cmd + K ouvre la palette de commandes depuis le champ de recherche même, ce
 * qu'attendent Slack, GitHub, Linear), et ces combinaisons ne tapent aucun caractère. Choix de l'agent de
 * build, le 2026-11-11, à rejuger sur `/design-system`. Alt et Maj seuls ne passent pas : sur Mac ils
 * écrivent des caractères (Option + K donne « ˚ »).
 *
 * `mod` DÉPEND DE LA PLATEFORME, et se lit côté client (`useIsMac`) : le HTML statique dessine « Ctrl »,
 * l'hydratation redessine « ⌘ » sur Mac. Un raccourci sans `mod` ne bouge pas à l'hydratation.
 *
 * UNE CAPSULE, UNE TOUCHE PAR `<kbd>` IMBRIQUÉ : `"mod+k"` rend une capsule qui contient deux `<kbd>` — ⌘
 * puis K —, et `"/"` une capsule qui n'en contient qu'un, de 24 px. La capsule porte `aria-hidden`, le
 * masque tactile et l'état d'enfoncement : toutes les touches foncent ensemble, comme la main les presse
 * ensemble.
 *
 * LE TYPE EST UN GABARIT LITTÉRAL TYPESCRIPT (`ShortcutKeys`, `lib/shortcut.ts`) ET NON UNE UNION FERMÉE :
 * EXCEPTION ASSUMÉE À LA LOI 11. Les combinaisons se comptent par milliers, et le champ `options` du
 * manifeste ne peut pas les énumérer ; le gabarit refuse à la compilation ce qui n'est pas un
 * raccourci (`"cmd+k"`, `"k+mod"`).
 *
 * UNE TOUCHE CACHÉE ÉCOUTE TOUJOURS, ET N'ATTEND PAS. L'appelant peut la masquer — `SearchField` la
 * cache quand le champ est rempli ou a le focus, et elle l'est sur un écran tactile —, le raccourci
 * reste vrai : `/` mène au champ même quand la croix a pris la place de la touche. Sans boîte à
 * montrer, il n'y a pas de geste à voir : l'action part tout de suite.
 *
 * MASQUÉE SUR UN ÉCRAN TACTILE SANS CLAVIER (`(hover: none) and (pointer: coarse)`) : la touche n'y
 * voudrait rien dire. Le raccourci, lui, ne coûte rien et reste écouté — une tablette avec un clavier
 * branché s'en sert.
 *
 * DÉCORATIVE POUR LES LECTEURS D'ÉCRAN (`aria-hidden`) : le raccourci est annoncé par le composant qui
 * l'emploie, en `aria-keyshortcuts` sur le contrôle visé. La lire en plus, au milieu d'un champ, la
 * ferait entendre deux fois.
 *
 * NON INTERACTIVE AU SENS DE LA LOI 4 : elle ne prend ni le focus, ni le pointeur, ni le toucher —
 * elle n'a donc ni survol, ni pressé au pointeur, ni anneau. Elle a deux états, le repos et
 * l'enfoncement, que seul son raccourci produit.
 *
 * COMPOSANT CLIENT (`runtime: "client"`) : l'écoute du document, une minuterie, un état. `onTrigger`
 * est une fonction : un appelant serveur ne peut pas la fabriquer, c'est lui qui doit être client
 * (loi 11) — sur la vitrine, `ShowcaseKbd`.
 *
 * ANONYMISÉ POUR CONSORT, le 2026-11-11 (décision de Florian, spec
 * `docs/specs/2026-11-11-anonymisation-design.md` § 2) : « c'est un composant pour les raccourcis ». `keys`
 * n'était que `"/"` ; il accepte tout raccourci. Le geste — la touche qui s'assombrit, puis l'action qui part —
 * reste le même pour tous.
 *
 * Histoire : `docs/history/kbd.md`.
 */
export function Kbd({ keys, onTrigger }: KbdProps) {
  const node = useRef<HTMLElement>(null);
  const isMac = useIsMac();
  const trigger = useRef(onTrigger);
  const [pressed, setPressed] = useState(false);

  /* L'action du dernier rendu, lue au moment du geste : l'entrée du registre n'a pas à être refaite
   * à chaque nouvelle fonction de l'appelant. */
  useEffect(() => {
    trigger.current = onTrigger;
  });

  useEffect(() => {
    let timer = 0;

    const entry: Entry = {
      shortcut: parseShortcut(keys),
      fire: () => {
        window.clearTimeout(timer);
        const shown = (node.current?.getClientRects().length ?? 0) > 0;
        if (!shown) {
          trigger.current();
          return;
        }
        setPressed(true);
        timer = window.setTimeout(() => {
          setPressed(false);
          trigger.current();
        }, pressDelay());
      },
    };

    mounted.push(entry);
    if (mounted.length === 1) document.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(timer);
      mounted.splice(mounted.indexOf(entry), 1);
      if (mounted.length === 0) document.removeEventListener("keydown", onKeyDown);
    };
  }, [keys]);

  const caps = keyCaps(keys, isMac);
  // Des mots qui se suivent (« Ctrl Shift P », hors Mac) se colleraient en « CtrlShiftP » : un
  // demi-pas les sépare. Les symboles (⌘ ⇧ ⌥) restent accolés, comme sur un clavier Mac.
  const spaced = caps.length > 1 && caps.some((cap) => cap.length > 1);

  return (
    <kbd
      ref={node}
      aria-hidden="true"
      data-pressed={pressed ? "" : undefined}
      className={cn(
        "inline-flex h-6 min-w-6 shrink-0 items-center justify-center self-start rounded-md px-1",
        spaced && "gap-1",
        "border-[length:var(--border-thin)] border-kbd-border bg-kbd-surface",
        "text-caption text-text-tertiary",
        "transition-[background-color,border-color,color] duration-[var(--duration-fast)] ease-out",
        "data-[pressed]:border-kbd-border-pressed data-[pressed]:bg-kbd-surface-pressed data-[pressed]:text-text-primary",
        "[@media(hover:none)_and_(pointer:coarse)]:hidden",
      )}
    >
      {caps.map((cap, index) => (
        <kbd
          key={index}
          className={cn(
            "grid h-full place-items-center",
            MODIFIER_SYMBOLS.includes(cap) ? "font-body" : "font-code",
          )}
        >
          {cap}
        </kbd>
      ))}
    </kbd>
  );
}
