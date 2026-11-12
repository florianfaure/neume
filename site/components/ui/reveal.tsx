"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface RevealProps {
  /**
   * Le bloc qui entre, rendu tel quel — composant serveur ou client. `Reveal` ne lui pose rien :
   * ni marge, ni largeur, ni classe. Il ne s'insère pas entre un `<ul>` et ses `<li>` : il
   * enveloppe la liste entière (spec § 3).
   */
  children: ReactNode;
  /**
   * QUAND LE BLOC ENTRE. `"scroll"`, le défaut : à son passage dans l'écran, par les observateurs
   * partagés, une fois le JavaScript arrivé. `"load"` : au PREMIER PAINT, en CSS seul, sans attendre
   * l'hydratation — pour les blocs au-dessus de la flottaison de la home, et pour eux seuls (spec
   * `2026-10-28-lot-k-arrivee-design` § 5). Même trajet, même durée, même courbe, même cascade ;
   * voir « LE PREMIER ÉCRAN » dans la docstring.
   */
  timing?: "scroll" | "load";
}

/** Une boîte nulle : le bloc est sous un `hidden` — le panneau d'un onglet fermé. */
function isHidden(element: Element) {
  return element.getClientRects().length === 0;
}

/**
 * LA FILE DE LA PROCHAINE IMAGE, AU NIVEAU DU MODULE : les blocs mis de côté pour une cascade et pas
 * encore marqués. Elle sert deux fois. C'est l'anti-doublon : un bloc peut être signalé par les DEUX
 * observateurs avant le `requestAnimationFrame` qui le révèle, et sans elle il compterait deux fois
 * dans la cascade — il décalerait d'un pas tous les blocs qui le suivent. Et c'est ce qui fait la
 * cascade : voir `handleEntries`.
 */
const queue = new Set<HTMLElement>();

/** Vrai tant qu'un `requestAnimationFrame` de vidage est en attente : il n'y en a jamais deux. */
let flushScheduled = false;

/**
 * Le vidage de la file, une fois par image. Les blocs sont triés dans l'ordre du DOM, ceux dont la
 * boîte est devenue nulle sont sautés — leur onglet s'est refermé entre le callback et l'image, et
 * les marquer révélés en silence les ferait apparaître sans entrée à la réouverture —, et les
 * autres sont numérotés 0, 1, 2… avant d'être marqués.
 */
function flushQueue() {
  flushScheduled = false;
  const entering = [...queue].sort((a, b) =>
    a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
  );
  queue.clear();

  let index = 0;
  for (const element of entering) {
    if (isHidden(element)) continue;
    element.style.setProperty("--reveal-index", String(index));
    element.dataset.revealed = "";
    index += 1;
  }
}

/**
 * LE CORPS COMMUN DES DEUX OBSERVATEURS D'INTERSECTION — l'entrée, et la cascade. `isEntering`
 * dit ce qu'« entrer » veut dire pour l'observateur qui appelle ; le reste est le même pour les
 * deux.
 *
 * - Un bloc qui ENTRE et n'est ni révélé ni déjà dans la file y est ajouté.
 * - Un bloc qui SORT, par le défilement ou parce que son panneau se ferme, n'est pas touché ici.
 *   Par le défilement, il reste révélé : l'entrée joue une fois (§ 4.2). Par la fermeture de son
 *   panneau, il est remis à l'état de départ — mais par `resetIfHidden`, le troisième
 *   observateur, et non par celui-ci : voir `sharedObservers`.
 *
 * LA CASCADE EST TOUT CE QUI ENTRE DANS LA MÊME IMAGE, QUEL QUE SOIT LE CALLBACK OU L'OBSERVATEUR
 * QUI L'APPORTE (corrigé, spec § 4.3). Elle avait d'abord été numérotée par appel du
 * callback, en supposant que les blocs qui entrent ensemble arrivent dans le MÊME appel. Faux au
 * chargement : l'hydratation de React 19 découpe le travail en tâches, le sous-arbre de `Tab`
 * s'hydrate dans une tâche ultérieure, les `observe()` tombent donc dans deux tâches et
 * l'observateur livre deux callbacks. Mesuré : deux lots à 1 ms d'écart, et la première carte à
 * l'index 0, en même temps que le `<header>`, au lieu de suivre la rangée d'onglets. Les blocs
 * vont donc dans la file du module, et UN SEUL `requestAnimationFrame` la vide — planifié par le
 * premier callback de l'image, et pas par les suivants.
 *
 * LE `requestAnimationFrame` A DEUX RAISONS. Il garantit au navigateur une image dans l'état de
 * départ avant l'état d'arrivée — sans elle, un bloc qui sort d'un `display: none` n'a pas de
 * style « avant » et apparaîtrait sans transition. Et il re-vérifie `isHidden` (voir `flushQueue`).
 */
function handleEntries(
  entries: IntersectionObserverEntry[],
  isEntering: (entry: IntersectionObserverEntry) => boolean,
) {
  for (const entry of entries) {
    const element = entry.target as HTMLElement;
    if (isEntering(entry) && element.dataset.revealed === undefined) queue.add(element);
  }

  if (queue.size === 0 || flushScheduled) return;
  flushScheduled = true;
  requestAnimationFrame(flushQueue);
}

/**
 * LA REMISE À ZÉRO — le seul endroit du composant qui retire `data-revealed`. Un bloc dont la boîte
 * est devenue nulle est sous un `hidden` : son panneau s'est fermé, et l'entrée doit rejouer à la
 * réouverture (spec § 4.4). Sous `display: none` aucune transition ne joue, donc la remise à zéro
 * est instantanée. Un bloc qui a encore une boîte n'est jamais touché : sorti de l'écran par le
 * défilement, il reste révélé (§ 4.2).
 *
 * Elle retire aussi le bloc de la file : s'il attendait son `requestAnimationFrame`, celui-ci le
 * sautera de toute façon, sa boîte étant nulle.
 */
function resetIfHidden(entries: ResizeObserverEntry[]) {
  for (const entry of entries) {
    const element = entry.target as HTMLElement;
    if (!isHidden(element)) continue;
    queue.delete(element);
    delete element.dataset.revealed;
  }
}

/**
 * TROIS OBSERVATEURS POUR TOUTES LES INSTANCES, créés au premier montage et jamais détruits : la
 * cascade dépend du partage des deux premiers (voir `handleEntries`).
 *
 * LE PREMIER EST LE DÉCLENCHEUR NORMAL. Il fait entrer un bloc quand son haut passe 10 % au-dessus
 * du bas de l'écran — assez tôt pour qu'il ne surgisse pas sous le doigt, assez tard pour que son
 * entrée se voie. Il lit `isIntersecting`, contre une racine rognée de 10 % en bas.
 *
 * LE SECOND OBSERVATEUR FERME UN DÉFAUT DU PREMIER
 * (spec § 4.2). Un bloc dont le haut est à moins de 10 % de hauteur d'écran
 * de la FIN DU DOCUMENT ne passe jamais la ligne des 90 % : la page ne défile pas assez pour l'y
 * amener, l'observateur ne se déclenche pas, et le bloc reste à l'opacité 0 pour de bon — le délai
 * de secours du script n'y peut rien, `Reveal` s'étant annoncé. Mesuré sur la vitrine, fenêtre de
 * 732 px de haut : le haut du paragraphe à 71,9 px de la fin du document, contre 73,2 requis. Le
 * § 4.5 de la spec — rien n'est jamais caché par erreur — l'interdit.
 *
 * LA MONTÉE DE DÉPART COMPTE DANS LA MESURE. Un observateur voit la boîte TRANSFORMÉE : en attente,
 * le bloc est 16 px plus bas que sa place de repos, et c'est cette boîte-là qui doit passer la
 * ligne. Les 71,9 px de la vitrine en sont la preuve — 87,9 au repos, 16 de moins en attente.
 *
 * SEUL UN BLOC COURT COLLÉ À LA FIN DU DOCUMENT EST CONCERNÉ. Un bloc plus haut que 10 % de l'écran
 * — montée de départ comprise — passe toujours la ligne : quand son bas atteint le bas de l'écran,
 * son haut est déjà au-dessus. Un bloc plus court, une fois en fin de défilement, est ENTIÈREMENT
 * visible. D'où le second observateur : racine pleine, `threshold: 1`, et il fait entrer un bloc
 * entièrement visible.
 *
 * IL LIT `intersectionRatio`, PAS `isIntersecting`, qui y est vrai dès une intersection partielle
 * et ferait entrer tout bloc au premier pixel. `0.99` et non `1` : un ratio calculé sur des boîtes
 * en sous-pixels peut s'arrêter juste sous 1. Une mesure, pas une valeur de design.
 *
 * CE QU'IL COÛTE, ET C'EST ASSUMÉ : un bloc de moins de 10 % de hauteur d'écran, où qu'il soit,
 * entre désormais dès qu'il est entier dans l'écran, donc un peu avant la ligne des 90 %. C'est
 * l'œil qui le juge.
 *
 * LE TROISIÈME EST UN `ResizeObserver`, ET IL NE RÉVÈLE RIEN : il ne fait que la remise à zéro
 * (`resetIfHidden`). Il ferme un défaut (spec § 4.4).
 * La remise à zéro était d'abord confiée aux deux observateurs d'intersection, qui la
 * faisaient quand ils signalaient un bloc sortant à boîte nulle. Or un observateur d'intersection
 * ne signale qu'un CHANGEMENT d'intersection : un bloc déjà révélé et HORS DE L'ÉCRAN quand son
 * panneau passe en `hidden` avait une intersection nulle avant comme après, rien n'était émis, et
 * il gardait `data-revealed`. Constaté : défiler `Work` jusqu'en bas, remonter, ouvrir `Sides` —
 * deux à quatre cartes restaient révélées dans le panneau masqué, et réapparaissaient sans entrée
 * à la réouverture.
 *
 * UN `ResizeObserver` VOIT CE QUE L'AUTRE NE VOIT PAS : le passage sous `display: none` ramène la
 * boîte à zéro, ce qui est un changement de taille, à l'écran ou pas. Il voit donc AUSSI chaque cas
 * que les observateurs d'intersection voyaient, et c'est pourquoi la remise à zéro leur a été
 * RETIRÉE plutôt que doublée : une seule règle, à un seul endroit.
 */
const crossesEnterLine = (entry: IntersectionObserverEntry) => entry.isIntersecting;
const isFullyVisible = (entry: IntersectionObserverEntry) => entry.intersectionRatio >= 0.99;

let observers: [IntersectionObserver, IntersectionObserver, ResizeObserver] | null = null;

function sharedObservers() {
  observers ??= [
    new IntersectionObserver((entries) => handleEntries(entries, crossesEnterLine), {
      rootMargin: "0px 0px -10% 0px",
    }),
    new IntersectionObserver((entries) => handleEntries(entries, isFullyVisible), {
      threshold: 1,
    }),
    new ResizeObserver(resetIfHidden),
  ];
  return observers;
}

/**
 * L'ENTRÉE AU CHARGEMENT, en `timing="load"` : l'animation `reveal-in` de `globals.css` (départ
 * écrit, arrivée non écrite, donc `none`), en `--duration-reveal` sur `--ease-out`, retardée de
 * `min(rang × --duration-reveal-stagger, --duration-reveal-stagger-max)` — la formule de la
 * transition, au même `--reveal-index`. `backwards` et non `both` : pendant le retard le bloc est
 * à son départ, et l'animation finie ne laisse rien derrière elle — un `forwards` garderait un
 * `translate` et un `filter` calculés, donc un bloc conteneur pour les pills `fixed`. Sous les
 * mêmes trois filets que l'état de départ du défilement : `html[data-reveal]`, `motion-safe`,
 * `@media screen`.
 */
const LOAD_ENTRY =
  "motion-safe:[@media_screen]:[html[data-reveal]_&]:[animation:reveal-in_var(--duration-reveal)_var(--ease-out)_min(calc(var(--reveal-index,0)*var(--duration-reveal-stagger)),var(--duration-reveal-stagger-max))_backwards]";

/**
 * Reveal — l'entrée d'un bloc au défilement, ou au chargement (`timing`) : un fondu, une montée de
 * 16 px, un flou de 4 px qui se dissipe, en 700 ms, une fois. Spec : `docs/specs/2026-10-07-apparition-au-defilement-design.md`.
 *
 * PREMIER COMPOSANT QUI ANIME L'ENTRÉE D'UN AUTRE. Il enveloppe, il ne restyle pas : le bloc qu'il
 * reçoit est rendu tel quel, et aucun composant n'apprend qu'il est animé.
 *
 * L'ARRIVÉE EST `none`, ET C'EST UNE CONDITION. `CursorPill`, le logo de `TextLink` et la pill de
 * `NoteRow` sont en `position: fixed`, positionnés en coordonnées viewport ; un ancêtre qui porte
 * un `translate`, un `transform`, un `filter` ou un `will-change` sur l'un d'eux devient leur bloc
 * conteneur et les décale. L'état de départ est donc écrit en classes CONDITIONNELLES — elles
 * cessent de s'appliquer à l'arrivée, et `translate` comme `filter` retombent à leur valeur
 * initiale, `none` —, et non en une valeur d'arrivée `translate-y-0 blur-none`, qui laisserait
 * l'ancêtre conteneur au repos. Pendant les 700 ms d'entrée, la pill est décalée : angle mort
 * n° 29 de `.claude/rules/loi-06-pixel-art.md`. Pour la même raison, AUCUN `will-change`.
 *
 * L'ÉTAT DE DÉPART N'EXISTE QUE SOUS QUATRE CONDITIONS À LA FOIS, et chacune est un filet (§ 4.5) :
 * `html[data-reveal]` — posé par le script du `<head>`, donc absent sans JS, et retiré au bout de
 * 3 s si aucun `Reveal` ne s'est annoncé ; `motion-safe` — sous mouvement réduit, le bloc est là
 * d'emblée ; `@media screen` — une page imprimée montre tout ; et l'absence de `data-revealed`.
 *
 * L'ANNONCE. Au premier montage, `Reveal` pose `data-reveal-ready` sur `<html>` : c'est ce que le
 * délai de secours du script lit pour savoir que le JS est arrivé.
 *
 * `data-reveal-block` N'A PAS DE STYLE. C'est une marque, pour retrouver toutes les enveloppes
 * d'une page au navigateur (`document.querySelectorAll("[data-reveal-block]")`).
 *
 * LE PREMIER ÉCRAN — `timing="load"`, lot K du 2026-10-28, spec `2026-10-28-lot-k-arrivee-design`
 * § 5 (HOME-03, PERF-05). Mesuré sur un téléphone en 3G, CPU bridé ×4 : la home restait un fond
 * vide 1,9 s après le premier paint, le temps que 180 Ko de JavaScript arrivent et que le premier
 * effet tourne. Les blocs au-dessus de la flottaison n'attendent donc plus rien : ils ne portent PAS
 * l'état de départ du défilement — la règle qui met un bloc à l'opacité 0 sous `html[data-reveal]`
 * n'est écrite que pour `"scroll"` —, et ils jouent leur entrée en ANIMATION CSS dès qu'ils sont
 * peints (`LOAD_ENTRY`). Le geste est le même, à la propriété près ; seul le déclencheur change.
 *
 * LEUR RANG DE CASCADE EST POSÉ PAR LE SCRIPT DU `<head>`. Le rang d'un bloc est sa place dans
 * l'ordre du document, et ni le CSS ni le rendu ne la connaissent : aucun sélecteur ne compte des
 * cousins, et un compteur au rendu divergerait entre le serveur et le client. Le script, lui, voit
 * le document se construire : à chaque image tant que le parseur avance, il numérote dans l'ordre
 * les blocs `[data-reveal-timing=load]` pas encore numérotés, en écrivant `--reveal-index` dans
 * leur `style` — avant leur premier paint, `requestAnimationFrame` passant avant la peinture. C'est
 * le `--reveal-index` du défilement : la cascade est la même formule, plafonnée pareil. Sans
 * JavaScript, le bloc n'entre pas — l'animation vit sous `html[data-reveal]`, que seul le script
 * pose. D'où `suppressHydrationWarning` en `"load"`, et en `"load"` seulement : React trouverait un
 * `style` que son rendu n'a pas, et c'est le seul écart qu'il y a à taire.
 *
 * APRÈS L'HYDRATATION, IL REJOINT LES OBSERVATEURS. Visible, il est marqué `data-revealed` sans
 * rien changer à l'écran, pour que la file ne le recompte pas. Masqué — son panneau d'onglet est
 * fermé, ou il le devient —, `resetIfHidden` le remet à zéro comme les autres ; à la réouverture,
 * l'animation repart d'elle-même (un `display: none` qui tombe la relance) et `flushQueue` lui
 * donne son rang dans la cascade de l'image, comme à n'importe quel bloc.
 *
 * Histoire : `docs/history/reveal.md`.
 */
export function Reveal({ children, timing = "scroll" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const load = timing === "load";

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    document.documentElement.dataset.revealReady = "";
    if (load && !isHidden(element)) element.dataset.revealed = "";
    const all = sharedObservers();
    for (const observer of all) observer.observe(element);
    return () => {
      for (const observer of all) observer.unobserve(element);
    };
  }, [load]);

  return (
    <div
      ref={ref}
      data-reveal-block=""
      data-reveal-timing={load ? "load" : undefined}
      suppressHydrationWarning={load}
      className={cn(
        load
          ? LOAD_ENTRY
          : [
              "transition-[opacity,translate,filter] duration-[var(--duration-reveal)] ease-out",
              "delay-[min(calc(var(--reveal-index,0)*var(--duration-reveal-stagger)),var(--duration-reveal-stagger-max))]",
              "motion-safe:[@media_screen]:[html[data-reveal]_&:not([data-revealed])]:opacity-0",
              "motion-safe:[@media_screen]:[html[data-reveal]_&:not([data-revealed])]:translate-y-[var(--lift-reveal)]",
              "motion-safe:[@media_screen]:[html[data-reveal]_&:not([data-revealed])]:blur-[var(--blur-reveal)]",
            ],
      )}
    >
      {children}
    </div>
  );
}
