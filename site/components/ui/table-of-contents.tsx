"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";

interface TableOfContentsProps {
  /**
   * Le nom accessible de la navigation, sans titre visible. Défaut « Contents » : un petit texte
   * système, au défaut anglais remplaçable (anonymisation pour Consort, décision de Florian du 2026-11-11, spec `docs/specs/2026-11-11-anonymisation-design.md` § 2).
   */
  label?: string;
  /**
   * Une entrée par section, dans l'ordre de la page. `id` est l'identifiant de l'élément cible —
   * la `<section>` entière, pas son titre —, `label` est le texte de l'entrée, en pratique le titre
   * de la section. Le composant ne fabrique aucun identifiant de section : c'est le contenu qui les
   * pose, et il ne connaît ni la page qui le porte ni les case studies (spec
   * `2026-10-04-articles-design` § 6.4 et § 6.5). `summary`, facultatif, est une phrase sur la
   * section : dans le panneau des barres seulement, la ligne la montre dans une bulle à droite après
   * une seconde de survol ou de focus (docstring, « la ligne », point 4). Sans résumé, pas de bulle.
   */
  items: { id: string; label: string; summary?: string }[];
  /**
   * Le rendu du sommaire, sur le même observateur. `bars` : la colonne de barres et son panneau au
   * survol, pour le rail des pages projet. `pill` : une pastille « 3/11 · Research » qui ouvre la
   * liste dans une couche `popover`, pour la lecture sous `xl` (spec
   * `2026-10-20-lot-c-lecture-design` § 4).
   */
  variant?: "bars" | "pill";
}

/**
 * La tolérance d'arrondi de la règle « franchie », en pixels. CE N'EST PAS UNE VALEUR DE DESIGN,
 * DONC CE N'EST PAS UN TOKEN. Un saut pose le haut de
 * la section à sa marge de défilement du haut du conteneur, au demi-pixel près selon la densité de
 * l'écran ; sans ce pixel, la section qu'on vient de viser pourrait ne pas être marquée.
 */
const ROUNDING = 1;

/**
 * Le retard de la barre qui s'allonge, en millisecondes : UNE IMAGE, à 60 Hz (1000 / 60, arrondi).
 * CE N'EST PAS UN TOKEN, sur la doctrine de `COPIED_RESET_MS` dans `CopyEmailButton` : aucune règle
 * CSS ne le lit, il ne nomme aucune intention partagée, il n'a qu'un consommateur, le relais des
 * barres (docstring). C'est une constante du composant, posée en `style` sur la barre courante — au
 * rail comme dans le panneau, où chaque ligne porte la sienne depuis le 2026-10-30.
 */
const RELAY_MS = 17;

/** La marge de défilement haute de la cible, lue sur elle : c'est l'appelant qui la pose. */
function scrollMargin(target: HTMLElement): number {
  return parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
}

/** Le premier ancêtre qui défile verticalement, ou `null` si c'est le document. */
function scrollParent(node: HTMLElement): HTMLElement | null {
  for (let up = node.parentElement; up !== null; up = up.parentElement) {
    const overflow = getComputedStyle(up).overflowY;
    if (overflow === "auto" || overflow === "scroll") return up;
  }
  return null;
}

/**
 * La place de la liste de la pastille, AU-DESSUS D'ELLE ET CENTRÉE SUR ELLE, lue sur la pastille au
 * moment d'ouvrir — la liste est dans la couche supérieure, hors du flux : rien ne l'ancre sans ça.
 * Les nombres sont des MESURES (le bord haut et le centre de la pastille, la largeur de la liste),
 * l'exception « données mesurées » de la loi 1 que `Tooltip` et `SegmentedTrack` tiennent déjà ; ce
 * qui est un choix de design passe par un token. Le bas de la liste est au bord haut de la pastille,
 * et l'écart de 8 px est le `mb-2` de la liste. Horizontalement, la liste est retenue à une gouttière
 * des bords de la fenêtre (`clamp`) ; verticalement, sa hauteur est plafonnée à ce qui reste au-dessus
 * de la pastille, moins deux gouttières — l'écart de 8 px et une gouttière en haut y tiennent, la
 * gouttière valant au moins 16 px —, et elle défile au-delà : onze lignes de 44 px ne tiennent pas
 * dans un téléphone tenu en largeur.
 */
function place(pill: HTMLElement, list: HTMLElement) {
  const box = pill.getBoundingClientRect();
  const width = list.offsetWidth;
  const left = box.left + box.width / 2 - width / 2;
  list.style.left = `clamp(var(--layout-gutter), ${left}px, calc(100% - var(--layout-gutter) - ${width}px))`;
  list.style.bottom = `calc(100% - ${box.top}px)`;
  list.style.maxHeight = `calc(${box.top}px - 2 * var(--layout-gutter))`;
}

/**
 * TableOfContents — le sommaire d'un contenu long : une liste de liens, un par section, et la
 * section en cours de lecture marquée. Cadré avec Florian ; il vit dans le rail fixé des pages
 * projet, où c'est le document qui défile. Specs : `docs/specs/2026-10-04-articles-design.md` § 6,
 * `docs/specs/2026-10-12-pages-projet-design.md` § 7 et
 * `docs/specs/2026-10-12-transition-sommaire-partage-design.md` § 3.
 *
 * LE RENDU EST EN BARRES. À la demande de Florian, il est devenu une colonne de petites barres
 * horizontales — une par section, 2 px de haut, 8 px d'écart —, courtes et grises au repos (12 px,
 * tertiaire), une plus longue et noire pour la section en cours (24 px, primaire) ; au survol, les
 * titres s'affichent dans un panneau flottant, par-dessus les barres. Les valeurs de la barre (2,
 * 12, 24 px) sont des mesures de dessin proposées par la spec, à juger à l'œil. La largeur et la
 * couleur des barres changent en `--duration-base`, sur `--ease-in-out` : c'est un morphing, pas un
 * retour d'état (`DESIGN.md`, section « Mouvement »).
 *
 * LE CHANGEMENT DE SECTION SE LIT COMME UN RELAIS (spec `2026-10-20-lot-b-signature-design` § 3.3) :
 * la barre qui rétrécit part tout de suite, celle qui s'allonge UNE IMAGE plus tard. La mécanique
 * est la plus simple qui tienne : un `transition-delay` de `RELAY_MS` posé en `style` sur la seule
 * barre courante, aucun sur les autres. Une transition prend le retard de son état d'ARRIVÉE, donc
 * la barre qui devient courante attend une image et celle qui cesse de l'être part sans attendre —
 * sans état React de plus ni double `requestAnimationFrame`. Écartés : un retard en classe, qui
 * serait un littéral (loi 1), et un token, que la spec exclut pour une image. Sous
 * `prefers-reduced-motion`, le filet de `globals.css` ramène tout retard à 0 avec `!important`, qui
 * l'emporte sur un `style` : les deux barres changent ensemble, en 1 ms.
 *
 * UNE SEULE LISTE DE LIENS, ET C'EST LE PANNEAU (spec § 3.3). Les barres sont un dessin, masqué à
 * l'assistance (`aria-hidden`), posé sous le panneau ; les vrais liens — les mêmes `<a>`, avec le
 * même `aria-current` et le même `jump` qu'avant — sont dans le panneau. AU REPOS, LE PANNEAU EST
 * TRANSPARENT ET NON RETIRÉ : `opacity-0` et `pointer-events-none`, jamais `display: none` ni
 * `hidden`, parce qu'un nœud retiré de l'arbre sortirait aussi de l'ordre de tabulation et de
 * l'arbre d'accessibilité. Conséquences voulues : le lecteur d'écran lit la même liste qu'avant ;
 * Tab arrive sur le premier lien, ce qui ouvre le panneau (`:focus-within`) ; un clic à l'endroit
 * des barres tombe sur le panneau, que le survol vient d'ouvrir. Le panneau s'ouvre au survol du
 * sommaire ou dès qu'un de ses liens a le focus, et se referme quand ni l'un ni l'autre ne tient.
 * C'est du CSS pur (`group-hover`, `group-focus-within`), sans état React.
 *
 * LE PANNEAU ENTRE COMME `Tooltip` : fondu et mise à l'échelle de `--scale-overlay-enter` à 1, sur
 * `--duration-base` et `--ease-spring-pop` ; il sort en fondu seul, sur `--duration-fast`. L'origine
 * de l'échelle est son coin haut gauche, celui des barres : il naît d'elles. Sa surface est
 * `--color-surface` (spec § 3.2) et son ombre `--shadow-elevation-lg`, la couche flottante du système.
 * EN DARK, L'OMBRE NE FAIT RIEN sur une surface qui vaut la page — la raison pour laquelle le
 * tooltip a sa propre surface, plus claire d'un cran — : le panneau se confond avec le fond au lieu
 * de s'en détacher. Il reste lisible (texte primaire et tertiaire sur `--color-surface`, deux
 * paires déjà vérifiées dans les deux polarités) et il cache bien les barres dessous, mais la
 * forme n'apparaît pas ; si l'œil de Florian la réclame, le geste est un token de surface à lui,
 * à la manière du tooltip. Le panneau a une largeur maximale fixe, `--size-toc-panel-max-width` (256 px),
 * justifiée au champ `responsive` du manifeste.
 *
 * IL POSE TROIS PRÉCÉDENTS (§ 6.6), ET LE SUIVANT LES HÉRITE.
 *
 * 1. PREMIER COMPOSANT QUI OBSERVE LE DÉFILEMENT. Un écouteur de `scroll`, cadencé par
 *    `requestAnimationFrame` — un calcul par image au plus, quel que soit le débit d'événements —,
 *    et passif, donc il ne retient jamais le défilement. PAS UN `IntersectionObserver`, que le spec
 *    nommait d'abord : la règle est « la DERNIÈRE section dont le haut a franchi le haut du
 *    conteneur, ou la dernière tout court en bas de défilement — et, tant qu'aucune n'a franchi le
 *    haut, la PREMIÈRE », et elle se lit directement sur les positions. Un observateur ne signale que des entrées et des sorties de seuil ; il faudrait
 *    tenir à côté l'état de chaque section et refaire le même calcul, plus le cas du bas qu'aucun
 *    seuil n'exprime.
 *
 *    DEUX SOURCES DE DÉFILEMENT, ET LE COMPOSANT CHOISIT SEUL. Si un ancêtre défile verticalement —
 *    la boîte de démonstration de `/design-system` —, c'est lui le conteneur : l'écouteur est posé
 *    dessus et les mesures se lisent sur lui. Sinon, c'est le document qui défile, comme sur une page
 *    projet : l'écouteur est posé sur `window`, les mesures se lisent sur `<html>`, et le haut du
 *    conteneur est celui de la fenêtre, à zéro. Le reste du calcul est le même.
 *
 *    UN `ResizeObserver` SUR LE CONTENEUR EN PLUS, ET IL N'EST PAS UN LUXE : c'est lui qui fait le
 *    premier calcul — il se déclenche à l'observation, donc le sommaire est correct dès le montage,
 *    sans attendre un premier défilement — et qui suit les changements de taille : une image qui se
 *    charge et allonge la page, une fenêtre qui change de largeur et fait passer des titres à la
 *    ligne. Un conteneur de taille nulle n'a toujours rien de courant.
 *
 *    LE SEUIL EST LA MARGE DE DÉFILEMENT DE LA SECTION, LUE SUR ELLE. Une section est « franchie »
 *    quand son haut est à sa `scroll-margin-top` du haut du conteneur ou au-dessus — exactement là
 *    où un saut la dépose. La valeur n'est donc écrite qu'à un endroit, chez l'appelant, et un clic
 *    marque l'entrée cliquée dès que sa section peut monter jusque-là — près de la fin, le saut
 *    s'arrête en bas et c'est la dernière qui l'est. Le cas du bas n'est retenu que si le conteneur
 *    défile réellement : un contenu plus court que sa boîte n'a pas de « bas de défilement ».
 *
 *    LA PREMIÈRE EST COURANTE D'EMBLÉE — retouche de Florian : « activer la première […] pas
 *    forcément que le premier titre du sommaire soit tout en haut pour que ça s'active. »
 *    Désormais, avant d'en avoir franchi une, la courante est la première du sommaire. SEUL LE CAS
 *    « RIEN DE FRANCHI » CHANGE : le bas de défilement garde la dernière, la règle de la dernière
 *    franchie ne bouge pas. Un conteneur de taille nulle, lui, n'a toujours rien de courant
 *    (`null`), faute de mise en page où le dire.
 *
 * 2. PREMIER `<nav>` DU SYSTÈME, nommé « Contents » et sans titre visible — la position et la
 *    forme suffisent, et un mot de plus mangerait une ligne (§ 6.1). Il contient un `<ol>`
 *    et non un `<ul>` : l'ordre des sections est celui du texte. La section courante est exposée
 *    par `aria-current="location"`, la valeur qu'ARIA réserve à la position dans un ensemble — HTML
 *    n'a aucun équivalent natif, donc l'attribut est légitime au sens de la loi 7.
 *
 * 3. PREMIER À INTERCEPTER UN LIEN INTERNE POUR NE PAS ÉCRIRE DANS L'URL. Les `href` sont `#<id>`,
 *    pour que l'entrée reste un vrai lien — focus, nom accessible, clic milieu sans dégât —, mais le
 *    clic gauche sans modificateur est ANNULÉ, TOUJOURS, cible trouvée ou non. LE HASH APPARTIENT À
 *    `Tab` : un `#section` dans la barre d'adresse effacerait le slug de l'onglet, et `hashchange`
 *    est son écouteur. Sur une page projet, il n'y a pas d'onglet, mais la garde reste : le retour
 *    vers la home ne doit pas traverser une pile d'entrées d'historique, une par entrée cliquée.
 *
 *    LE SAUT FAIT DÉFILER LE CONTENEUR, ET LUI SEUL, et c'est un écart au § 6.3 du spec qui citait
 *    `scrollIntoView`. Celui-ci fait défiler TOUS les ancêtres défilants jusqu'à la cible, document
 *    compris : sur `/design-system`, la page entière sautait pour aligner la boîte de démonstration
 *    en haut de la fenêtre. Un `scrollTo` sur le conteneur trouvé fait le même saut, à la même
 *    marge, sans rien toucher d'autre. Quand aucun conteneur ne défile, c'est le document qui est
 *    la cible, et `scrollIntoView` n'a plus d'autre ancêtre à entraîner : il respecte la
 *    `scroll-margin-top` de la section. Doux par défaut, instantané sous `prefers-reduced-motion`
 *    (loi 7) — la requête est lue au clic : la règle `scroll-behavior` de `globals.css` ne peut rien
 *    contre un `behavior` passé en JavaScript.
 *
 *    LE FOCUS VA AU TITRE DE LA SECTION, sans défilement de plus, pour qu'un utilisateur clavier
 *    reprenne la lecture là où il a sauté. Ce titre porte `tabIndex={-1}` — une cible de focus
 *    programmatique au sens de la loi 7 —, et c'est à l'appelant de le poser.
 *
 * CE QUE L'APPELANT DOIT FOURNIR, et que le composant ne vérifie pas : des sections aux `id` des
 * entrées, une `scroll-margin-top` sur chacune (64 px, le `py-16` du contenu) et un titre `h2` ou
 * `h3` focusable en `tabIndex={-1}` dans chacune. Un ancêtre défilant est facultatif : sans lui,
 * c'est le document qui est lu et qui défile.
 *
 * LE COMPOSANT NE SE CACHE PAS LUI-MÊME À UN SEUIL, et c'est une décision. Les barres n'existent qu'à
 * partir de `xl` et la pastille qu'en dessous, mais ces visibilités et leur place sont des décisions
 * du parent : ce fichier remplit la largeur qu'on lui donne et ne pose ni breakpoint ni position (lois
 * 8 et 11). Il ne pose pas non plus l'épinglage : c'est l'enveloppe de l'appelant qui fixe ou colle
 * le sommaire — `ReadingRail` pour les barres, `ReadingPill` pour la pastille. Ce que la pastille
 * décide seule est de SE MONTRER selon la lecture, ci-dessous.
 *
 * LA VARIANTE `pill` — LE SOMMAIRE SOUS `xl`, spec `2026-10-20-lot-c-lecture-design` § 4 (LEC-04 du
 * catalogue, décision de Florian : « Back et pastille en bas avec ombre, et pastille ouvre la liste
 * des sections »). LE MÊME OBSERVATEUR, UN AUTRE RENDU : la section courante, l'interception du hash
 * et le saut sont ceux des barres, au caractère près ; la variante ne change que ce qui est dessiné.
 *
 * 1. ELLE COMPOSE `Button`, secondaire, à libellé : jamais un sosie (ordre 3 de `CLAUDE.md`). Le
 *    libellé est « 3/11 · Research » — la place de la section courante sur le total, un point
 *    médian, son titre, un texte qui existe déjà. Il est aussi le NOM ACCESSIBLE du bouton. Le texte
 *    change D'UN COUP quand on franchit une section : aucune transition ne le porte. La pastille ne
 *    se déplace pas ; elle hug son libellé, donc sa largeur suit le titre — centrée par l'appelant,
 *    elle s'élargit des deux côtés à la fois. `Button` ne tronque pas : le titre le plus long des
 *    trois case studies fait dix-sept signes, et la pastille tient dans 320 px. ELLE EST DÉTACHÉE DU
 *    TEXTE PAR `--shadow-elevation-md`, posée sur le `<nav>` — qui a exactement la boîte du bouton, en
 *    `rounded-full` comme lui — et non sur `Button`, qui ne reçoit rien : l'ombre est de la variante,
 *    et elle s'efface avec la pastille. L'appelant qui la fixe n'en pose aucune. Cette ombre est
 *    `--shadow-chrome`, et non `--shadow-overlay`, depuis le 2026-10-20 : celle d'`overlay` était
 *    « trop forte et portée vers le bas » (Florian) ; `chrome` est du flou seul, sans décalage, à
 *    10 % — la même pour la liste ouverte, point 2. Depuis le 2026-11-06, l'échelle d'élévation la
 *    renomme `--shadow-elevation-md`, valeur inchangée.
 *
 * 2. UN APPUI OUVRE LA LISTE DANS UNE COUCHE `popover` NATIVE — LA PREMIÈRE DU SYSTÈME —, ouverte
 *    par `showPopover()` depuis le `onClick` de `Button`, qui ne porte aucun attribut de plus. Le
 *    `popover` est un ATTRIBUT de l'`<ol>`, pas un élément : la liste est celle des barres, mêmes
 *    `<a href="#id">`, même `aria-current`, même saut. Échap et un appui dehors referment, en natif
 *    (« light dismiss »), et le navigateur rend le focus à l'élément qui l'avait. Un appui sur une
 *    entrée referme la liste AVANT le saut, pour que le focus rendu à la pastille soit repris par le
 *    titre de la section. Dans l'ordre du DOM, la liste suit immédiatement la pastille : au clavier,
 *    Tab va de la pastille à la première entrée.
 *
 *    UN APPUI SUR LA PASTILLE OUVERTE LA REFERME, ET C'EST UNE LIGNE DE PLUS. Le « light dismiss »
 *    ferme la liste au relâché d'un appui hors d'elle — la pastille en est hors —, puis le `click`
 *    arrive et la rouvrirait. L'appui est donc noté sur la pastille (`pointerdown`, liste ouverte),
 *    et le `click` qui suit ne rouvre rien ; une touche le remet à zéro, puisque Entrée et Espace
 *    n'ont pas d'appui. L'attribut `popovertarget` le ferait seul, et `Button` ne le porte pas.
 *
 *    L'HABILLAGE EST CELUI D'UNE COUCHE DU SYSTÈME : fond `--color-surface`, `--shadow-elevation-md`, et le
 *    filet `--color-share-border`, transparent en clair et visible en sombre, comme la popin de
 *    `ShareButton` — l'ombre ne détache rien d'une page presque noire. Rayon de la famille, celui du
 *    panneau des barres. LIGNES DE 44 PX (`--size-touch-target`) : au doigt, la cible est la ligne
 *    entière, quand celle des barres se lit sur le mot. Même texte que le panneau des barres :
 *    tertiaire, primaire au survol et au pressé, la courante en primaire et semi-gras. Largeur
 *    plafonnée par `--size-toc-panel-max-width`, celle du panneau : un titre long passe à la ligne,
 *    jamais tronqué. La place est mesurée (`place`) : au-dessus de la pastille, centrée sur elle.
 *    L'ENTRÉE EST CELLE DU PANNEAU DES BARRES, née de la pastille (origine en bas) : ressort et
 *    échelle de `--scale-overlay-enter` à 1, sortie en fondu court ; `display` et `overlay`
 *    transitionnés en discret, pour que la sortie se joue dans la couche supérieure.
 *
 * 3. ELLE N'APPARAÎT QU'UNE FOIS LA PREMIÈRE SECTION FRANCHIE, et s'efface quand le pied de page
 *    entre dans la fenêtre : le haut de page — visuel et titre — et le pied en sont libres. La
 *    « première franchie » est lue dans le même calcul que la section courante, sans règle de plus.
 *    Le pied de page est le `<footer>` enfant de `<body>`, le pied du DOCUMENT et non celui d'une
 *    citation, observé par un `IntersectionObserver` : une entrée et une sortie de fenêtre, c'est
 *    exactement ce qu'un observateur signale. Quand il n'y en a pas — dans une boîte défilante, sur la
 *    vitrine —, c'est la FIN DE LA DERNIÈRE SECTION qui tient sa place, lue dans le même calcul : le
 *    composant ne connaît pas l'`<article>`, il connaît la dernière section qu'il indexe.
 *
 *    L'ÉTAT EST `data-state` (`shown` ou `hidden`), et la pastille s'efface en OPACITÉ, en
 *    `--duration-fast`. Masquée, elle ne prend plus le pointeur — elle laisse passer l'appui vers le
 *    texte dessous —, mais ELLE RESTE DANS L'ORDRE DE TABULATION ET DANS L'ARBRE D'ACCESSIBILITÉ : le
 *    sommaire est un repère de navigation, en haut de page comme ailleurs, et un lecteur d'écran n'a
 *    pas de « fenêtre ». Un focus qui y arrive la montre (`focus-within`), pour que l'anneau ne soit
 *    jamais posé sur un objet invisible. Liste ouverte, elle reste montrée. Montrée, elle reprend le
 *    pointeur même dans une enveloppe qui le laisse passer. Rien ne la déplace : seule l'opacité
 *    change. Sous `prefers-reduced-motion`, la durée tombe à 1 ms : là ou pas là.
 *
 * 4. CE QUE `Button` NE PORTE PAS, ET QUI MANQUE : `aria-expanded`. Ses props sont énumérées, sans
 *    `aria-*` (sa docstring) ; la pastille n'annonce donc pas à un lecteur d'écran que la liste est
 *    ouverte — elle s'ouvre juste après le bouton dans le DOM, et Tab y entre. C'est un `extend` de
 *    `Button`, hors de ce lot, signalé à Florian ; aucun `<button>` n'est écrit ici à sa place.
 *
 * LA LIGNE, DANS LES DEUX RENDUS — 2026-10-30, la refonte du sommaire (spec
 * `docs/specs/2026-10-30-refonte-sommaire-design.md`), à partir d'une capture du sommaire de
 * chapitres de l'app Claude. Florian : « la barre à gauche du wording et au hover ça se grise en bg
 * […] Et donc rendre le sommaire un peu plus petit en hauteur. »
 *
 * 1. DANS LE PANNEAU, CHAQUE ENTRÉE PORTE SA BARRE À GAUCHE DE SON TITRE, celle du rail — mêmes
 *    dimensions, mêmes tokens, même morphing, même relais —, dans une case de 24 px, la largeur de
 *    la barre courante, pour que les titres s'alignent ; puis `space-3`, puis le titre. La barre est
 *    un dessin (`aria-hidden`) : le nom accessible du lien reste son titre. LA LIGNE MESURE 28 PX —
 *    l'interligne de 20 px du texte et deux `space-1` —, SANS ÉCART entre deux lignes, et le panneau
 *    passe à un remplissage de `space-2` : onze sections tiennent en 324 px, contre 368. Le lien est
 *    un bloc (`flex`), et c'est ce qui retire la jambe de 24 px que l'interligne du `body` ajoutait
 *    à un `<li>` au contenu en ligne. La case de la barre a la hauteur d'une ligne de texte, en haut
 *    de la ligne : un titre qui passe à la ligne garde sa barre en face de sa première ligne.
 *
 * 2. LA COLONNE DE BARRES DU PANNEAU TOMBE SUR CELLE DU RAIL. Le remplissage du panneau (8 px) et
 *    celui de la ligne (8 px, l'air du fond) posent la case de la barre à 16 px du bord du panneau ;
 *    le panneau est donc posé à `-left-4`, et ses barres s'ouvrent exactement sur la colonne du rail.
 *    PAS EN HAUTEUR : un pas de 28 px contre un pas de 10, aucune ligne ne tombe sur sa barre, et le
 *    panneau reste à `top-0`. Il déborde donc de 16 px à gauche de ses barres, et l'appelant lui
 *    laisse cette marge — la gouttière du rail, la boîte de la vitrine. L'origine de son échelle
 *    reste son coin haut gauche (spec § 2).
 *
 * 3. LE SURVOL ET LE PRESSÉ POSENT UN FOND sur la ligne entière, `--color-surface-subtle` — celui du
 *    survol des cartes —, arrondi (`rounded-md`), en plus du passage du titre au primaire. Il
 *    apparaît et disparaît SUR PLACE, en `--duration-fast` : chaque ligne porte le sien, et RIEN NE
 *    GLISSE d'une ligne à l'autre — le « repère glissant » du sommaire est un geste déjà refusé. LA
 *    COURANTE N'EN PREND JAMAIS : un fond ne porte pas un état persistant, elle garde la graisse et la
 *    barre longue. C'est l'exception de `Button` de la loi 7 — changement de fond sous un contenu qui
 *    tient son seuil —, à ses trois conditions : le titre, tertiaire ou primaire, tient 4.5:1 sur ce
 *    fond dans les deux polarités (paires déjà dans `scripts/contrast-pairs.json`) ; la ligne reste
 *    identifiable sans lui, par son titre ; et les états qu'il signale sont transitoires. La liste de
 *    la pastille prend le même fond au survol et à l'appui, sur ses lignes de 44 px ; ni barre, ni
 *    résumé. Le gris est à l'œil de Florian : s'il est trop pâle, en sombre surtout, on monte d'un
 *    cran (angle mort n° 11 de `.claude/rules/loi-07-accessibilite.md`).
 *
 * 4. LE RÉSUMÉ. Une entrée peut porter `summary`, une phrase sur sa section. Dans le panneau
 *    seulement, la ligne est alors enveloppée par `Tooltip`, qui décrit (`descriptionId`), attend
 *    (`delay="long"`, 1 s) et se pose à droite (`side="right"`) : la bulle apparaît au bout de la
 *    ligne, centrée sur sa hauteur, après une seconde de survol ou de focus. Le lien porte
 *    `aria-describedby` vers elle, un identifiant tiré de `useId` et de l'`id` de l'entrée : un
 *    lecteur d'écran entend la phrase au focus, sans attendre. La bulle descend du `<nav>` : la
 *    survoler garde le panneau ouvert. Toutes les lignes ayant la largeur du panneau, LA BULLE
 *    TOUCHE SON BORD DROIT — ses 8 px de remplissage tombent sur les 8 px du panneau. La pastille
 *    n'en porte pas : au doigt, il n'y a pas de survol.
 *
 * LES ÉTATS, ET POURQUOI LA COULEUR SUFFIT — SAUF POUR LA COURANTE. Ce paragraphe décrit les liens DU
 * PANNEAU ; les barres au repos portent la même règle (tertiaire, primaire pour la courante), sur un
 * dessin. Repos en tertiaire ; survol, pressé et section courante en primaire.
 *
 * LA COURANTE PREND EN PLUS LA GRAISSE `font-semibold`, 600, cran nommé de la loi 3 —
 * retouche de Florian : « l'item actif […] pas assez démarquant par rapport au hover qui devient
 * noir. Augmenter un peu la graisse […] dans les textes, en rollover. » Le survol d'une entrée
 * grise la fait passer au primaire, donc la même couleur que la courante : seule la graisse les
 * distingue encore dans le panneau, et elle est un signal non chromatique (loi 7). Les barres ne
 * changent pas. LA GRAISSE ÉLARGIT LE MOT : le panneau est `w-max`, et si la courante est l'entrée
 * la plus longue, son bord droit bouge de quelques pixels quand la courante change panneau ouvert.
 * C'est son bord droit seul — il est ancré à gauche, sur les barres — et personne ne lit les titres
 * en défilant.
 *
 * L'ÉCART DE COULEUR : l'écart tertiaire → primaire vaut 3.75:1 en light et 3.15:1 en dark : le gris SEUL
 * franchit les 3:1 de la loi 7 dans les deux polarités, exactement le geste de `TextLink` et de
 * `StandaloneLink` pris dans l'autre sens, sans aucune exception invoquée — la paire est dans
 * `scripts/contrast-pairs.json`. Le survol d'une entrée déjà courante ne change rien, et c'est
 * assumé (§ 6.2) : deux façons de pointer la même entrée. Le pressé est ÉCRIT sur `active:` et non
 * laissé au survol, pour qu'il existe aussi au doigt, où `:active` vient sans `:hover`. La
 * transition est celle de `BrandLink`, en `--duration-fast` comme tous les retours de couleur et de
 * trait du système ; elle porte aussi, depuis le 2026-10-30, le fond de la ligne (« la ligne »,
 * point 3) : l'état d'une entrée non courante ne passe plus par la couleur seule.
 *
 * LA CIBLE EST LA LIGNE. Les 44 px de la loi 5 visent les contrôles icône seule ; une entrée est un
 * lien textuel. Dans le panneau, le lien est la ligne entière — la largeur du panneau sur 28 px de
 * haut —, au-dessus des 24 × 24 px de WCAG 2.2 SC 2.5.8 sans recourir à son exception d'espacement.
 * Dans la liste de la pastille, la ligne fait 44 px, pour le doigt.
 *
 * COMPOSANT CLIENT, et la directive est justifiée au sens strict de la loi 11 : état propre (la
 * section courante), effet, mesure du DOM et API navigateur (`matchMedia`, `ResizeObserver`, `window`,
 * et pour la pastille `IntersectionObserver` et l'API `popover`).
 *
 * ANONYMISÉ POUR CONSORT, le 2026-11-11 (décision de Florian, spec
 * `docs/specs/2026-11-11-anonymisation-design.md` § 2) : `label` (« Contents » par défaut) remplace
 * le nom accessible de la navigation, écrit en dur ; aucun pixel ne bouge.
 *
 * Histoire : `docs/history/table-of-contents.md`.
 */
export function TableOfContents({
  items,
  variant = "bars",
  label: navLabel = "Contents",
}: TableOfContentsProps) {
  /* La racine des identifiants des bulles de résumé, que les liens désignent (« la ligne », point 4). */
  const uid = useId();
  const nav = useRef<HTMLElement | null>(null);
  const list = useRef<HTMLOListElement | null>(null);
  const [current, setCurrent] = useState<string | null>(null);
  /* La pastille seule les lit : une section franchie, la fin atteinte, la liste ouverte. */
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [open, setOpen] = useState(false);
  /* L'appui qui a refermé la liste ouverte, pour que son `click` ne la rouvre pas (docstring). */
  const dismissed = useRef(false);

  /* Les identifiants en une chaîne, comme les slugs de `Tab` : un appelant qui écrit
   * son tableau en littéral ne doit pas relancer l'effet à chaque rendu. Un `id` ne contient jamais
   * d'espace, donc le séparateur est sûr. */
  const ids = items.map((item) => item.id).join(" ");

  useEffect(() => {
    const node = nav.current;
    if (node === null) return;
    /* LE CONTENEUR DÉFILANT, OU LE DOCUMENT. Sur une page, aucun ancêtre ne défile : les mesures se
     * lisent alors sur `<html>`, dont le haut est celui de la fenêtre, et le défilement s'écoute sur
     * `window`. La boîte défilante reste le cas de `/design-system`. */
    const container = scrollParent(node);
    const root = container ?? document.documentElement;
    const source: HTMLElement | Window = container ?? window;

    const targets = ids
      .split(" ")
      .map((id) => document.getElementById(id))
      .filter((target): target is HTMLElement => target !== null);

    /* LA FIN, POUR LA PASTILLE SEULE : le pied du document, guetté par un observateur, ou à défaut
     * la fin de la dernière section, lue dans le calcul ci-dessous (docstring, variante, point 3). */
    const footer =
      variant === "pill" && container === null ? document.querySelector("body > footer") : null;
    const watchEnd = variant === "pill" && footer === null;

    let frame = 0;

    const update = () => {
      frame = 0;

      /* Un conteneur non mis en page n'a rien de courant (docstring). */
      if (root.clientHeight === 0) {
        setCurrent(null);
        setStarted(false);
        return;
      }

      const last = targets[targets.length - 1];
      const top = container === null ? 0 : root.getBoundingClientRect().top + root.clientTop;
      if (watchEnd)
        setEnded(
          last !== undefined &&
            last.getBoundingClientRect().bottom - top <= root.clientHeight + ROUNDING,
        );

      const scrolls = root.scrollHeight > root.clientHeight;
      if (
        last !== undefined &&
        scrolls &&
        root.scrollTop + root.clientHeight >= root.scrollHeight - ROUNDING
      ) {
        setCurrent(last.id);
        setStarted(true);
        return;
      }

      /* Avant d'en avoir franchi une, la courante est la première (docstring) — et la pastille
       * attend que l'une soit franchie pour se montrer. */
      let crossed: string | null = targets[0]?.id ?? null;
      let any = false;
      for (const target of targets) {
        const offset = target.getBoundingClientRect().top - top;
        if (offset <= scrollMargin(target) + ROUNDING) {
          crossed = target.id;
          any = true;
        }
      }
      setCurrent(crossed);
      setStarted(any);
    };

    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };

    /* L'observateur de taille fait aussi le PREMIER calcul : il se déclenche à l'observation. */
    const resize = new ResizeObserver(schedule);
    resize.observe(root);
    source.addEventListener("scroll", schedule, { passive: true });

    let end: IntersectionObserver | null = null;
    if (footer !== null) {
      end = new IntersectionObserver(([entry]) => setEnded(entry?.isIntersecting ?? false));
      end.observe(footer);
    }

    return () => {
      resize.disconnect();
      end?.disconnect();
      source.removeEventListener("scroll", schedule);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, [ids, variant]);

  /* LA LISTE DE LA PASTILLE : son état ouvert, lu sur l'événement natif `toggle` — Échap et l'appui
   * dehors la ferment sans passer par ce fichier —, et l'appui qui la referme (docstring). */
  useEffect(() => {
    const node = nav.current;
    const layer = list.current;
    if (variant !== "pill" || node === null || layer === null) return;

    const listen = new AbortController();
    const { signal } = listen;
    node.addEventListener(
      "pointerdown",
      (event) => {
        dismissed.current = !layer.contains(event.target as Node) && layer.matches(":popover-open");
      },
      { signal },
    );
    node.addEventListener(
      "keydown",
      () => {
        dismissed.current = false;
      },
      { signal },
    );
    layer.addEventListener(
      "toggle",
      (event) => setOpen((event as ToggleEvent).newState === "open"),
      { signal },
    );
    return () => listen.abort();
  }, [variant]);

  /* Liste ouverte, sa place suit la pastille : sur une page elle est fixée et ne bouge pas, sur la
   * vitrine elle défile avec la boîte. Une mesure par image au plus, comme le calcul de section. */
  useEffect(() => {
    const node = nav.current;
    const layer = list.current;
    if (!open || node === null || layer === null) return;

    let frame = 0;
    const schedule = () => {
      if (frame === 0)
        frame = requestAnimationFrame(() => {
          frame = 0;
          place(node, layer);
        });
    };
    window.addEventListener("scroll", schedule, { capture: true, passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule, { capture: true });
      window.removeEventListener("resize", schedule);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, [open]);

  const toggle = () => {
    const node = nav.current;
    const layer = list.current;
    if (node === null || layer === null) return;
    if (dismissed.current) {
      dismissed.current = false;
      return;
    }
    if (layer.matches(":popover-open")) {
      layer.hidePopover();
      return;
    }
    /* Ouverte d'abord, placée ensuite : sa largeur n'existe qu'une fois mise en page. Les deux dans
     * la même tâche, donc avant la première image — elle n'apparaît jamais ailleurs. */
    layer.showPopover();
    place(node, layer);
  };

  const jump = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    /* Les clics qui ouvrent ailleurs passent intacts : un autre bouton que le gauche, ou un
     * modificateur (⌘, Ctrl, Maj, Alt). Le reste est annulé AVANT de chercher la cible : une entrée
     * orpheline ne doit pas davantage écrire le hash qu'une autre (docstring, point 3). */
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();

    /* La liste de la pastille se ferme AVANT le saut : le focus que le navigateur rend alors à la
     * pastille est repris par le titre de la section, plus bas. */
    if (list.current?.matches(":popover-open")) list.current.hidePopover();

    const target = document.getElementById(id);
    if (target === null) return;

    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";
    const root = nav.current === null ? null : scrollParent(nav.current);

    if (root === null) {
      target.scrollIntoView({ behavior, block: "start" });
    } else {
      const offset =
        target.getBoundingClientRect().top - root.getBoundingClientRect().top - root.clientTop;
      root.scrollTo({ top: root.scrollTop + offset - scrollMargin(target), behavior });
    }

    target.querySelector<HTMLElement>("h2, h3")?.focus({ preventScroll: true });
  };

  /* UNE BARRE : la même au rail et dans le panneau — 12 px tertiaire, 24 px primaire pour la courante,
   * qui part une image plus tard (le relais, docstring). LEUR ÉPAISSEUR EST `--border-thick`, PAS
   * `h-0.5` : l'échelle d'espacement du système n'a pas de pas à 2 px, et Tailwind ne génère alors
   * aucune règle — les barres mesuraient 0 px, sans erreur. Une barre est un trait : elle prend
   * l'épaisseur d'emphase des traits. */
  const bar = (id: string) => (
    <span
      key={id}
      style={current === id ? { transitionDelay: `${RELAY_MS}ms` } : undefined}
      className={cn(
        "block h-[var(--border-thick)] rounded-full",
        "transition-[width,background-color] duration-[var(--duration-base)] ease-in-out",
        current === id ? "w-6 bg-text-primary" : "w-3 bg-text-tertiary",
      )}
    />
  );

  /* LES LIENS SONT LES MÊMES DANS LES DEUX RENDUS : même `href`, même `aria-current`, même saut, même
   * texte, même fond au survol et au pressé, jamais sur la courante. Le panneau ajoute la barre à
   * gauche du titre et la ligne de 28 px ; la pastille, la ligne de 44 px. Seul le panneau montre
   * le résumé (docstring, « la ligne »). */
  const links = items.map((item) => {
    const isCurrent = current === item.id;
    const summary = variant === "bars" ? item.summary : undefined;
    const summaryId = summary === undefined ? undefined : `${uid}${item.id}-summary`;

    const link = (
      <a
        href={`#${item.id}`}
        aria-current={isCurrent ? "location" : undefined}
        aria-describedby={summaryId}
        onClick={(event) => jump(event, item.id)}
        className={cn(
          "flex rounded-md px-2",
          variant === "pill"
            ? "min-h-[var(--size-touch-target)] items-center"
            : "items-start gap-3 py-1",
          "font-body text-body-sm",
          "transition-colors duration-[var(--duration-fast)] ease-out",
          "hover:text-text-primary active:text-text-primary",
          "focus-visible:outline-[length:var(--border-thick)] focus-visible:outline-focus-ring",
          isCurrent
            ? "font-semibold text-text-primary"
            : "text-text-tertiary hover:bg-surface-subtle active:bg-surface-subtle",
        )}
      >
        {variant === "pill" ? (
          item.label
        ) : (
          <>
            {/* La case de la barre : 24 px, la hauteur d'une ligne de texte, un dessin. */}
            <span aria-hidden="true" className="flex h-5 w-6 shrink-0 items-center">
              {bar(item.id)}
            </span>
            <span>{item.label}</span>
          </>
        )}
      </a>
    );

    return (
      <li key={item.id}>
        {summaryId === undefined || summary === undefined ? (
          link
        ) : (
          <Tooltip label={summary} descriptionId={summaryId} delay="long" side="right">
            {link}
          </Tooltip>
        )}
      </li>
    );
  });

  if (variant === "pill") {
    const index = Math.max(
      0,
      items.findIndex((item) => item.id === current),
    );
    const label = `${index + 1}/${items.length} · ${items[index]?.label ?? ""}`;

    return (
      <nav
        ref={nav}
        aria-label={navLabel}
        data-state={open || (started && !ended) ? "shown" : "hidden"}
        className={cn(
          /* L'ombre détache la pastille du texte qu'elle survole ; posée sur le `nav`, qui a
           * exactement la boîte de `Button`, elle s'efface avec lui (docstring, variante, point 1). */
          "pointer-events-auto flex w-fit rounded-full shadow-elevation-md",
          "transition-opacity duration-[var(--duration-fast)] ease-out",
          /* Masquée : transparente et traversée par le pointeur, SAUF si le focus y est (docstring). */
          "data-[state=hidden]:not-focus-within:pointer-events-none data-[state=hidden]:not-focus-within:opacity-0",
        )}
      >
        <Button label={label} variant="secondary" expanded={open} onClick={toggle} />

        {/* La liste : une couche `popover` native, dans la couche supérieure une fois ouverte, à la
         * place que `place` lui donne. Les styles d'agent utilisateur d'un `popover` sont annulés —
         * marge et position automatiques, bord épais, remplissage. `hidden` en base et `open:flex`
         * par-dessus : une classe de disposition sans condition l'afficherait fermée. */}
        <ol
          ref={list}
          popover="auto"
          className={cn(
            "inset-auto m-0 mb-2 hidden w-max max-w-[var(--size-toc-panel-max-width)] origin-bottom flex-col overflow-y-auto overscroll-contain rounded-lg p-2 open:flex",
            "border-[length:var(--border-thin)] border-share-border bg-surface shadow-elevation-md",
            "scale-[var(--scale-overlay-enter)] opacity-0",
            "transition-[opacity,scale,display,overlay] transition-discrete duration-[var(--duration-fast)] ease-out",
            "open:scale-100 open:opacity-100 open:duration-[var(--duration-base)] open:ease-spring-pop",
            "starting:open:scale-[var(--scale-overlay-enter)] starting:open:opacity-0",
          )}
        >
          {links}
        </ol>
      </nav>
    );
  }

  return (
    <nav ref={nav} aria-label="Contents" className="group/toc relative w-fit">
      {/* Les barres : un dessin, invisible à l'assistance. Leur colonne est la cible du survol.
       * Chaque barre est celle de `bar`, plus haut. */}
      <div aria-hidden="true" className="flex flex-col gap-2 py-2 pr-6">
        {items.map((item) => bar(item.id))}
      </div>

      {/* Le panneau : les VRAIS liens, transparents au repos mais toujours dans l'arbre et dans
       * l'ordre de tabulation (docstring, « une seule liste de liens »). Il s'ouvre au survol du
       * sommaire et au focus d'un de ses liens, sur le geste d'entrée de `Tooltip` : ressort à
       * l'ouverture, fondu court à la fermeture. `-left-4` pose sa colonne de barres sur celle du
       * rail : son remplissage et celui de la ligne font 16 px (« la ligne », point 2). */}
      <ol
        className={cn(
          "absolute top-0 -left-4 flex w-max max-w-[var(--size-toc-panel-max-width)] origin-top-left flex-col rounded-lg p-2",
          "bg-surface shadow-elevation-lg",
          "pointer-events-none scale-[var(--scale-overlay-enter)] opacity-0",
          "transition-[opacity,scale] duration-[var(--duration-fast)] ease-out",
          "group-hover/toc:pointer-events-auto group-hover/toc:scale-100 group-hover/toc:opacity-100",
          "group-hover/toc:duration-[var(--duration-base)] group-hover/toc:ease-spring-pop",
          "group-focus-within/toc:pointer-events-auto group-focus-within/toc:scale-100 group-focus-within/toc:opacity-100",
          "group-focus-within/toc:duration-[var(--duration-base)] group-focus-within/toc:ease-spring-pop",
        )}
      >
        {links}
      </ol>
    </nav>
  );
}
