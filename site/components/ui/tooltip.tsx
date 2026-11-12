"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { PointerEvent, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface TooltipProps {
  /**
   * Le texte de la bulle. SANS `descriptionId`, il DUPLIQUE le nom accessible de ce qu'il décrit —
   * c'est ce qui lui permet d'être masqué à l'assistance (voir la docstring du composant), et ce qui
   * fait qu'aucune prop de plus n'est nécessaire pour l'employer sur un bouton icône seule : on lui
   * passe le même mot que son `label`. AVEC `descriptionId`, c'est une phrase qui DÉCRIT le
   * contrôle : ce que son nom ne dit pas.
   */
  label: string;
  /**
   * Ouvre la bulle sans survol ni focus, en plus des deux déclencheurs propres du composant.
   * Écrite pour la confirmation de `CopyEmailButton`, que le tactile ne voyait pas.
   *
   * ELLE N'OUVRE QUE, ELLE NE FERME JAMAIS : à `false` elle rend la main aux deux déclencheurs,
   * elle ne les débranche pas. C'est ce qui lui interdit de s'appeler `open` — docstring plus bas.
   */
  forceVisible?: boolean;
  /**
   * La bulle DÉCRIT au lieu de nommer : elle porte cet `id`, et l'appelant le pose en
   * `aria-describedby` sur son propre contrôle — rien n'est injecté dans l'enfant (loi 11). Son texte
   * passe alors à la ligne sous `--size-tooltip-max-width` : une description est une phrase. Absent,
   * la bulle redouble le nom du contrôle, d'un mot, sans retour à la ligne.
   */
  descriptionId?: string;
  /**
   * L'attente avant l'ouverture. `none` : la bulle s'ouvre dès le survol ou le focus. `long` : elle
   * attend `--duration-tooltip-delay` (1 s), et ne s'ouvre que si le pointeur ou le focus est
   * toujours là. La fermeture reste immédiate dans les deux cas.
   */
  delay?: "none" | "long";
  /**
   * Le côté du contrôle où la bulle se pose. `top` : au-dessus, centrée sur sa largeur. `right` : à
   * droite, centrée sur sa hauteur, et l'enveloppe prend la largeur de sa ligne.
   */
  side?: "top" | "right";
  /**
   * Ce que la bulle décrit — un contrôle, presque toujours un `Button` en forme icône seule. La
   * bulle se déclenche sur le survol et le focus de ce contenu, jamais sur elle-même.
   */
  children: ReactNode;
}

/** Un mot de la bulle, et son numéro : la `key` qui remonte son nœud à chaque échange. */
interface Word {
  text: string;
  id: number;
}

/**
 * L'attente de `delay="long"`, lue par le script au moment d'armer la minuterie. La forme `var()`
 * n'est pas une coquetterie : c'est sous elle que l'audit ascendant de la loi 10 voit le token, comme
 * pour la fermeture de `Dialog` (docstring, « la bulle qui décrit », point 3).
 */
const WAIT = "var(--duration-tooltip-delay)";

/**
 * Tooltip — une bulle claire posée au-dessus ou à droite d'un contrôle, au survol et au focus.
 * Cadré avec Florian, sans maquette. Specs : `docs/specs/2026-08-10-tooltip-design.md`, et
 * `docs/specs/2026-10-30-refonte-sommaire-design.md` § 4 pour la bulle qui décrit.
 *
 * IL ENVELOPPE, IL N'INJECTE RIEN. `<Tooltip label="…"><Button … /></Tooltip>`. C'est la seule forme
 * possible sous la loi 11 : il faut que les gestionnaires soient sur un ANCÊTRE du contrôle — un
 * `focusin` ne descend pas vers un frère, et un `Escape` frappé pointeur immobile n'atteint que le
 * document. Injecter des props dans l'enfant demanderait de le CLONER, ce que la loi 11 interdit
 * nommément, et l'API de `Button` est de toute façon fermée. Conséquence assumée : le mot s'écrit
 * DEUX FOIS à l'appel, une fois comme `label` du bouton et une fois comme `label` de la bulle.
 *
 * LA BULLE EST MASQUÉE À L'ASSISTANCE (`aria-hidden`), et ce n'est pas un oubli de câblage. Son
 * texte est exactement le nom accessible du contrôle qu'elle décrit — le `label` que `Button` rend
 * en `sr-only` sur sa forme icône seule. Un `role="tooltip"` plus un `aria-describedby` feraient
 * lire le même mot deux fois, une fois comme nom et une fois comme description. C'est la doctrine
 * d'`Icon` transposée : le sens appartient au CONTRÔLE, la bulle n'en est que la version visible.
 * Elle est donc un pur redoublement visuel, et personne ne perd d'information.
 *
 * LES TROIS OBLIGATIONS DE WCAG 2.2 SC 1.4.13 SONT TENUES, et chacune coûte une ligne précise :
 *
 *   1. RÉVOCABLE. `Escape` ferme la bulle sans déplacer le pointeur ni le focus. L'écouteur est sur
 *      le DOCUMENT et non sur l'enveloppe : la bulle peut être ouverte au survol alors que le focus
 *      est ailleurs, et un `keydown` local ne la verrait jamais. Il n'est posé que pendant qu'elle
 *      est ouverte ou qu'elle attend de l'être, et retiré au démontage. Après révocation, la bulle
 *      ne revient qu'au prochain
 *      survol — `pointerenter` ne se redéclenche pas sous un pointeur immobile, ce qui est
 *      exactement le comportement attendu.
 *   2. SURVOLABLE. OUVERTE, la bulle reçoit le pointeur (`pointer-events-auto`), et son enveloppe
 *      positionnée porte un `pb-2` transparent au lieu d'un `mb-2` : sa boîte TOUCHE donc le bord
 *      haut du contrôle. Le pointeur peut monter du contrôle vers le texte sans jamais sortir de
 *      l'arbre de l'enveloppe, donc sans déclencher `pointerleave`. Avec une marge, les 8 px de vide
 *      auraient fermé la bulle au passage ; sans événements de pointeur, le pointeur aurait traversé
 *      vers ce qui est derrière. FERMÉE, c'est l'inverse : la bulle reste montée (voir plus bas),
 *      donc elle porte
 *      `pointer-events-none` dès la fermeture et `display: none` une fois sa sortie jouée. Sans ça,
 *      sa zone transparente au-dessus du contrôle capterait le survol et la rouvrirait. Vérifié au
 *      pointeur : survoler l'emprise de la bulle fermée n'ouvre rien. (À 2 px au-dessus du bouton,
 *      c'est la zone de cible élargie de `Button` qui répond, pas la bulle.)
 *   3. PERSISTANTE. Aucune minuterie ne la ferme : elle reste jusqu'au départ du pointeur, à la
 *      perte du focus ou à `Escape`. L'attente de `delay="long"` retarde l'OUVERTURE, jamais la
 *      fermeture.
 *
 * LA BULLE ENTRE SUR UN RESSORT ET SORT EN FONDU — décision de Florian, au cadrage des
 * micro-animations (`docs/specs/2026-10-07-micro-animations-design.md` § 4). ELLE ROUVRE UNE
 * DÉCISION, et l'ancienne reste citée ici pour qu'aucune session ne la « restaure » en la prenant
 * pour la règle en vigueur : la bulle apparaissait « IMMÉDIATEMENT ET
 * SANS TRANSITION », parti pris partagé avec `CursorPill`, au motif que « dans un système pixel, un
 * fondu adoucit ce que la grille rend franc ». Florian l'a rouverte lui-même : « que le tooltip
 * apparaisse en mode sympa ».
 *
 * L'ENTRÉE : fondu, montée de `--lift-tooltip-enter` (4 px) vers sa place, échelle de
 * `--scale-overlay-enter` (0.96) à 1, sur `--duration-base` et `--ease-spring-pop` — un ressort
 * court qui dépasse d'environ 4 % puis se pose. L'origine de l'échelle est le BAS, AU CENTRE : la
 * bulle naît du contrôle qu'elle décrit. LA SORTIE : fondu seul, sur `--duration-fast` et
 * `ease-out`, SANS échelle ni descente — plus rapide que l'entrée, comme demandé au cadrage. Sous
 * `prefers-reduced-motion`, les deux amplitudes reviennent à l'identité et les durées à 1 ms
 * (`globals.css`) : la couche est là ou elle n'est pas.
 *
 * LA BULLE RESTE MONTÉE, ET C'EST LE PRÉCÉDENT QUE CE COMPOSANT POSE : PREMIÈRE COUCHE FLOTTANTE DU
 * SYSTÈME MONTÉE EN PERMANENCE POUR ANIMER SA SORTIE — et une sortie ne s'anime pas sur un nœud
 * qui quitte le DOM. Elle bascule donc par `data-state="open" | "closed"` : `display`
 * dans la liste des propriétés transitionnées avec `transition-discrete`, qui retarde le
 * `display: none` jusqu'à la fin du fondu, et les valeurs de départ de l'entrée en `starting:`. Une
 * ouverture coupée par une fermeture, ou l'inverse, repart de la valeur en cours : rien ne reste à
 * mi-chemin. Le centrage (`-translate-x-1/2`) et la montée (`translate-y-…`) passent par la même
 * propriété `translate`, mais Tailwind v4 les compose par deux variables : le `-50%` horizontal
 * survit au style de départ, relevé dans le DOM.
 *
 * ET CE COMPOSANT DÉCLARE LE PREMIER RESSORT PARTAGÉ DU SYSTÈME, `--ease-spring-pop`. Les quatre
 * ressorts de `ScratchCard` sont à lui seul ; celui-ci est le ressort des micro-interactions du
 * site, et tout geste d'entrée court à venir le reprend au lieu d'écrire le sien.
 *
 * UN CHANGEMENT DE LIBELLÉ PENDANT QUE LA BULLE EST OUVERTE FAIT GLISSER LES MOTS. Un seul appelant
 * le provoque aujourd'hui : `CopyEmailButton`, « Copy email » → « Copied! » et retour. L'ancien mot
 * monte et s'efface, le nouveau arrive par en dessous, et la largeur de la pastille passe de l'une
 * à l'autre dans le même temps, sur `--duration-base`. Les mots glissent sur `ease-out` ; la
 * largeur, qui est un morphing, sur `--ease-in-out` (`DESIGN.md`, section « Mouvement »). La
 * hauteur ne bouge pas, la pastille découpe les deux mots (`overflow-hidden`). UN SEUL MOT SORTANT À LA FOIS : un second changement
 * pendant un glissement fait sortir le mot affiché à cet instant et coupe le premier glissement au
 * lieu de l'empiler. Le mot sortant est hors flux et centré sur la pastille ; il est `aria-hidden`
 * comme toute la bulle, rien ne change pour l'assistance. BULLE FERMÉE, LE MOT N'EST PAS ÉCHANGÉ :
 * la sortie s'efface sur le mot qu'elle montrait — sans ça, la bulle de `CopyEmailButton`, qui se
 * ferme au moment même où « Copied! » redevient « Copy email », changerait de mot pendant son
 * fondu. L'échange se fait à la réouverture, direct, et la bulle naît à la taille de son mot.
 *
 * LA LARGEUR EST MESURÉE EN JAVASCRIPT, PAS INTERPOLÉE PAR CSS. `interpolate-size: allow-keywords`
 * n'existe ni dans Safari ni dans Firefox au 2026-10-07, et une transition ne va pas d'`auto` à
 * `auto`. À chaque échange, l'effet de layout lit la largeur de départ (le mot sortant plus le
 * remplissage, ou la largeur en cours si un glissement était déjà parti), la largeur d'arrivée
 * (naturelle, le mot sortant étant hors flux), et l'écrit en `style` sur le nœud — une donnée
 * mesurée au rendu, l'exception « données de contenu » de la loi 1, comme la mesure de
 * `SegmentedTrack` et les coordonnées de `CursorPill`. À la fin de la transition, le `style` est
 * retiré et la pastille suit de nouveau son mot. Les deux mots portent des `key` préfixées par
 * rôle (`out-`, `in-`) : React réconcilie par `key` sur toute la liste des enfants, et un mot
 * sortant de même numéro que l'ancien mot affiché REPRENAIT son nœud au lieu d'en monter un neuf —
 * sans style de départ, il partait de `none` et perdait son centrage.
 *
 * `pointerType === "mouse"` FILTRE LE TACTILE. Sans ce test, un appui sur le bouton ouvrirait la
 * bulle par-dessus le contenu, puis la laisserait ouverte jusqu'à un `pointerleave` qui ne vient
 * pas toujours. Un appui n'a pas de position de survol — même décision que `CursorPill`, et même
 * conséquence : aucun survol n'ouvre la bulle sur tactile. Ce qui reste est le nom accessible du
 * contrôle et ce qu'un appelant force par `forceVisible`.
 *
 * `forceVisible` OUVRE LA BULLE SANS SURVOL NI FOCUS, et fait de ce composant le PREMIER DU SYSTÈME
 * DONT UN APPELANT OUVRE L'ÉTAT. Ajoutée pour `CopyEmailButton` : le filtre ci-dessus prive le
 * tactile de la confirmation « Copied! », et le focus ne la rattrape pas — Safari iOS ne focuse pas
 * un bouton à l'appui, là où Chrome Android le fait, si bien que la bulle apparaissait sur une
 * plateforme et pas sur l'autre. Trois clauses la bornent, et elles sont ce qui l'empêche de
 * devenir une porte sur l'état interne des composants.
 *
 * ELLE S'AJOUTE, ELLE NE REMPLACE PAS. La bulle est ouverte si le composant l'a déclenchée OU si
 * l'appelant la force. **C'EST CE QUI LUI INTERDIT DE S'APPELER `open`**, alors que la loi 11 nomme
 * `onOpenChange` dans ses trois règles de nommage et que le schéma cite `open` parmi les attributs
 * natifs qui l'emportent : un `open` promet le contrat contrôlé — la prop dit l'état, TOUT l'état,
 * et le composant n'en tient plus —, et ce contrat est INAPPLICABLE ici. Les gestionnaires vivent
 * sur l'enveloppe que ce fichier rend lui-même ; un appelant ne voit pas son `pointerenter`, donc
 * il ne peut pas tenir cet état à sa place, et il ne le pourrait qu'en recevant l'enveloppe — soit
 * en devenant `Tooltip`. Un `open` qui n'obéirait qu'à moitié serait exactement l'API menteuse que
 * la loi 11 ferme. Le nom dit donc ce qu'elle fait, et il reprend le mot des deux états du
 * manifeste.
 *
 * `Escape` NE RÉVOQUE PAS LA BULLE FORCÉE, et son écouteur reste posé sur le seul état interne. Le
 * SC 1.4.13 gouverne le contenu déclenché AU SURVOL OU AU FOCUS ; une confirmation déclenchée par
 * une ACTIVATION n'en relève pas, et elle s'éteint d'elle-même avec la minuterie de l'appelant. La
 * rendre révocable demanderait de remonter un rappel jusqu'à cet appelant pour un contenu que WCAG
 * n'oblige pas à révoquer — écarté au cadrage. Les trois obligations tenues plus haut
 * valent inchangées pour la bulle de survol, qui est la seule que ce critère vise.
 *
 * ELLE N'AJOUTE AUCUNE CONSÉQUENCE ARIA, là où la loi 11 en exige une de tout état fonctionnel. La
 * raison est celle qui masque déjà la bulle à l'assistance : son texte EST le nom accessible du
 * contrôle, donc l'ouvrir n'annonce rien de neuf, et un `aria-*` de plus ferait lire deux fois le
 * même mot. Ce qui porte l'annonce est la région `aria-live` de `CopyEmailButton`, écrite pour ça.
 *
 * `self-start` SUR L'ENVELOPPE, pour la raison qui l'a mis sur `Button` : posée dans une colonne
 * flex, elle serait étirée sur toute la largeur reçue et cesserait de hug le contrôle (loi 8).
 * L'enveloppe reprend donc la contrainte que le contrôle portait seul.
 *
 * LA BULLE NE SE DÉTACHE DE LA PAGE QUE PAR SON OMBRE, et c'est ce qui fait de ce composant le
 * PREMIER CONSOMMATEUR de l'ombre des couches flottantes. Le
 * spec fondateur réserve l'ombre aux couches flottantes et sépare tout le reste par un trait de
 * 1 px : un tooltip est la couche flottante que cette réserve attendait. Si l'ombre à 12 % ne
 * suffit pas à l'œil de Florian, le correctif est un trait de `--color-border-subtle`, pas une
 * ombre plus lourde.
 *
 * LA BULLE A LA SILHOUETTE DE LA PILL DU CURSEUR — 2026-10-28, décision de Florian : « Le tooltip qui
 * se met au-dessus des icon buttons ne suit pas le même design que la pill qui se met sur le curseur
 * au rollover des images ou des cards projets : aligner le tooltip sur le design pixel de la pill. »
 * `Tooltip` SEUL ce jour-là : `Tag` était resté arrondi (« ok, tooltip seul »), puis Florian l'a
 * pixelisé à son tour le 2026-11-09 — voir la docstring de `Tag`. ELLE ROUVRE LA DÉCISION DU LOT J DU MÊME JOUR (spec `docs/specs/2026-10-28-lot-j-petits-restes-design.md`
 * § 2, PIX-05), qui laissait `Tooltip` et `Tag` arrondis au motif qu'en pixeliser trois d'un coup
 * ferait basculer le registre éditorial. Elle est rouverte par Florian lui-même, à sa demande
 * explicite, et la raison nouvelle est la sienne : le tooltip des boutons d'icône et la pill du
 * curseur sont le même geste, un mot en Pixelify au-dessus d'une cible, et deux silhouettes pour un
 * même geste se voient.
 *
 * LA PASTILLE perd `rounded-full` pour `--clip-cursor-pill` : trois marches de 2 px à chaque coin, un
 * `clip-path: polygon()` dont les points de droite et de bas sont en `calc(100% - n px)`, donc qui suit
 * la largeur pendant qu'elle glisse sur un changement de mot — `overflow-hidden` continue de découper
 * les mots, le polygone découpe la pastille par-dessus. Le fond reste `--color-tooltip-surface` : la
 * bulle garde ses tokens de couleur, c'est la silhouette et le mode d'ombre qu'elle prend.
 *
 * L'OMBRE QUITTE LA PASTILLE POUR LE NŒUD POSITIONNÉ AU-DESSUS, en `filter: drop-shadow`
 * (`--drop-shadow-elevation-md`) : `clip-path` coupe `box-shadow`, et un filtre posé sur le parent est
 * appliqué avant le découpage de l'élément qui le porte, donc l'ombre est dessinée autour des marches
 * — la raison des deux nœuds, qui est celle de `CursorPill`. Un `filter` fait de ce nœud le bloc
 * conteneur de ses descendants `fixed` et un contexte d'empilement : il n'en a aucun descendant
 * `fixed`, et la bulle, depuis le 2026-11-12, est dans le top layer, où aucun `z-index` ne joue (voir plus bas). Le ressort
 * d'entrée, le fondu de sortie, le glissement de largeur et le changement de mot ne bougent pas.
 *
 * UN ÉCART CONNU, ACCEPTÉ PAR FLORIAN POUR L'INSTANT : `CursorPill` arrondit sa position au pixel
 * entier, alors que la bulle reste centrée par `-translate-x-1/2`. Sur un écran 1× une marche peut donc
 * tomber sur un demi-pixel quand la largeur de la pastille est impaire. La mesure en JavaScript, comme
 * la pill, est un second temps éventuel ; elle n'est pas faite ici.
 *
 * AUCUNE BASCULE DE POSITION. La bulle est toujours du côté que `side` désigne : au-dessus et
 * centrée, ou à droite et centrée sur la hauteur. Basculer quand la fenêtre manque de place
 * demanderait de mesurer le DOM et de recalculer au défilement — écarté au cadrage, et la contrainte
 * est écrite au champ `responsive` du manifeste : un contrôle collé au bord haut de la fenêtre verra
 * sa bulle du dessus rognée, une ligne collée au bord droit sa bulle de droite.
 *
 * LA BULLE QUI DÉCRIT, ATTEND ET SE POSE À DROITE — 2026-10-30, pour les résumés du sommaire
 * (spec `docs/specs/2026-10-30-refonte-sommaire-design.md` § 4). Florian : « un petit résumé en
 * tooltip si on reste un peu plus longtemps ». Le résumé n'est rien de ce que la bulle était : une
 * phrase, nouvelle pour l'assistance, posée à droite, qui attend. Trois props à défaut ; SANS ELLES,
 * LA BULLE EST CELLE D'AVANT AU CARACTÈRE PRÈS — mêmes classes, mêmes attributs, aucun `id` —, et
 * ses appelants n'ont pas changé d'un attribut.
 *
 * 1. DÉCRIRE (`descriptionId`). La bulle porte l'`id` reçu, et l'appelant le pose en
 *    `aria-describedby` sur son propre contrôle : rien n'est injecté dans l'enfant, qu'il faudrait
 *    cloner (loi 11). ELLE RESTE `aria-hidden`, et c'est ce qui l'expose UNE fois : un nœud masqué
 *    que `aria-describedby` désigne directement entre dans le calcul de la description — fermé et en
 *    `display: none` compris —, et masqué, il n'est jamais lu une seconde fois comme texte de la
 *    page. Un lecteur d'écran entend donc la phrase au focus du contrôle, sans attendre la seconde
 *    que l'œil attend. Pas de `role="tooltip"` : posé sur un nœud masqué, il n'annoncerait rien.
 *
 * 2. UNE PHRASE. Qui décrit, la bulle passe à la ligne sous `--size-tooltip-max-width` au lieu de
 *    ne jamais y passer, et son nœud positionné prend la largeur de son texte (`w-max`) : sans lui,
 *    un nœud absolu n'a pour largeur disponible que ce qui reste de l'enveloppe après son bord
 *    gauche — rien à droite, la moitié au-dessus — et casserait la phrase à chaque mot. Le plafond
 *    est sur la pastille, et la contribution d'un élément plafonné à la largeur de son parent l'est
 *    aussi : le nœud ne déborde pas d'un pixel transparent. Rien d'autre ne change — silhouette
 *    crantée, surface, ombre, police. Si une phrase en Pixelify se lit mal, la sortie est une
 *    variante de police pour ce mode, pas une seconde bulle (spec § 4).
 *
 * 3. ATTENDRE (`delay`). À `long`, le survol ou le focus arme une minuterie de
 *    `--duration-tooltip-delay` (1 s), et la bulle ne s'ouvre qu'à son terme. Le départ du pointeur,
 *    la perte du focus et `Escape` l'annulent — l'écouteur d'`Escape` est posé dès l'attente —, et
 *    la fermeture reste immédiate. Une attente armée ne se réarme pas : le clic qui donne le focus à
 *    un contrôle déjà survolé ne la fait pas repartir de zéro. L'ATTENTE N'EST PAS UN MOUVEMENT, et
 *    `prefers-reduced-motion` ne doit pas la retirer : c'est pour ça qu'elle est une MINUTERIE et non
 *    un retard de transition. Le filet `!important` de `globals.css` ramène tout retard CSS à 0 sous
 *    la requête, et une bulle qui s'ouvrirait alors au premier frôlement serait l'inverse de ce que
 *    la requête demande. Le token n'est pas dans le bloc de la requête ; l'entrée de la bulle, elle,
 *    y tombe à 1 ms comme avant. Il est lu par `getComputedStyle`, sous sa forme `var()` (`WAIT`),
 *    EN SECONDES COMME EN MILLISECONDES : le minifieur du build réécrit `1000ms` en `1s`, relevé
 *    dans l'export du 2026-10-30, et un `parseFloat` seul y lirait une milliseconde.
 *
 * 4. À DROITE (`side`). La bulle se pose à droite du contrôle, centrée sur sa hauteur, à 8 px — un
 *    `pl-2` transparent et non une marge, pour la raison du `pb-2` de l'obligation 2 : le pointeur
 *    passe du contrôle au texte sans quitter l'enveloppe. SON ENTRÉE NAÎT DU BORD GAUCHE : l'origine
 *    de l'échelle est à gauche, au centre, et la bulle part de `--shift-tooltip-enter` (4 px) plus
 *    près du contrôle — la montée de la bulle du dessus, tournée d'un quart. L'ENVELOPPE PREND SA
 *    LIGNE : au-dessus, elle hug le contrôle (`self-start`) pour centrer la bulle sur lui ; à droite,
 *    la bulle se centre sur la hauteur, et ce qu'on décrit à droite est une ligne de liste.
 *    L'enveloppe y est un bloc qui remplit la largeur qu'on lui donne (loi 8) : la bulle se pose au
 *    bout de la ligne, au même endroit pour toutes les lignes d'une liste, au lieu de suivre la
 *    longueur de chaque titre — et un bloc ne pose pas la jambe d'interligne qu'une enveloppe en ligne
 *    ajouterait à son parent.
 *
 * AU FOCUS, SEULEMENT SI LE FOCUS EST VISIBLE (2026-11-12, `refine`, retour de Florian) : à l'ouverture d'une
 * `Dialog`, la couche donne le focus à son premier contrôle, et la bulle « Previous icon » d'`IconSheet` était déjà
 * ouverte sans que personne ait rien survolé ni tabulé. La bulle ne s'ouvre plus au `focus` que si la cible est
 * `:focus-visible` — le navigateur le dit vrai au clavier, faux pour un focus posé par script après un clic ou un
 * geste du pointeur. Le survol, `forceVisible` et le délai ne changent pas ; le focus clavier garde sa bulle.
 *
 * LA BULLE EST DANS LE TOP LAYER (2026-11-12, `refine`, retour de Florian : « les bulles des boutons icône sont
 * coupées dans une `Dialog` »). LA CAUSE : la bulle était un `absolute` DANS le flux du contrôle, donc rognée
 * par tout ancêtre qui coupe — le panneau d'une `Dialog` et son contenu en `overflow-hidden` (`IconSheet`,
 * `CommandPalette`, `ShareButton`, `Exhibit`) — et un `z-index` ne passe jamais au-dessus d'un `<dialog>` modal,
 * qui vit dans le top layer. LE CORRECTIF EST À LA SOURCE : la bulle est un `popover="manual"`, montré par
 * `showPopover()` à chaque ouverture — donc le DERNIER entré dans le top layer, au-dessus du `<dialog>` — et sorti
 * de tout `overflow` et de tout bloc conteneur. Elle reste montée, et son `data-state` pilote toujours l'entrée
 * et la sortie ; `showPopover()` ne fait qu'en faire un élément du top layer, et le `display` reste celui de nos
 * classes. Un `popover` est `position: fixed` : la position n'est donc plus celle du flux, elle est MESURÉE sur
 * l'enveloppe du contrôle à l'ouverture, au défilement (de n'importe quel ancêtre) et au redimensionnement — le
 * bord bas de la bulle touche le bord haut du contrôle (`top`), ou son bord gauche touche le bord droit (`right`),
 * pour que le `pb-2` / `pl-2` transparent de l'obligation 2 tienne. Une position mesurée, comme `SegmentedTrack` et
 * `CursorPill` : le choix à l'ancrage CSS (`anchor-name`) a été écarté, son support n'étant pas assez large aujourd'hui
 * (la même raison que pour `SegmentedTrack`). Le reste ne bouge pas : délai, côtés, silhouette crantée, ombre,
 * ressort, `aria-hidden` et `aria-describedby`, `Escape`, tactile et mouvement réduit. Ce qui reste est la
 * limite de la fenêtre : la bulle ne bascule toujours pas de côté (« AUCUNE BASCULE DE POSITION »).
 *
 * Histoire : `docs/history/tooltip.md`.
 */
export function Tooltip({
  label,
  forceVisible = false,
  descriptionId,
  delay = "none",
  side = "top",
  children,
}: TooltipProps) {
  const [triggered, setTriggered] = useState(false);
  /* L'attente de `delay="long"` : armée, elle pose l'écouteur d'`Escape` comme la bulle ouverte. */
  const [waiting, setWaiting] = useState(false);
  const timer = useRef(0);
  const visible = triggered || forceVisible;
  const describing = descriptionId !== undefined;

  /* Le mot affiché, le mot qui sort pendant un glissement, et l'ouverture du rendu précédent.
   * Les trois s'ajustent PENDANT le rendu (motif React « ajuster l'état quand une prop change »),
   * pas dans un effet : un effet peindrait une image avec l'ancien mot sous la nouvelle largeur. */
  const [shown, setShown] = useState<Word>({ text: label, id: 0 });
  const [leaving, setLeaving] = useState<Word | null>(null);
  const [wasVisible, setWasVisible] = useState(visible);

  if (visible !== wasVisible) {
    setWasVisible(visible);
    /* À l'ouverture, un mot sortant resté d'une fermeture en plein glissement est oublié. */
    if (visible && leaving !== null) setLeaving(null);
  }

  /* Bulle fermée : le mot n'est PAS échangé, la sortie s'efface sur le mot qu'elle montrait.
   * À l'ouverture : échange direct, la bulle naît à la taille de son mot. Ouverte et déjà
   * ouverte : le mot affiché devient le mot sortant — UN SEUL à la fois, un second changement
   * coupe le premier glissement au lieu de l'empiler. */
  if (visible && label !== shown.text) {
    setLeaving(wasVisible ? shown : null);
    setShown({ text: label, id: shown.id + 1 });
  }

  const wrap = useRef<HTMLSpanElement>(null);
  const bubble = useRef<HTMLSpanElement>(null);

  /* La bulle est `fixed` dans le top layer : sa place est mesurée sur l'enveloppe du contrôle (voir la docstring).
   * Une POSITION mesurée, écrite en `style` — l'exception « données de contenu » de la loi 1. */
  const place = useCallback(() => {
    const node = bubble.current;
    const box = wrap.current?.getBoundingClientRect();
    if (!node || !box) return;
    if (side === "top") {
      node.style.left = `${box.left + box.width / 2}px`;
      node.style.bottom = `${document.documentElement.clientHeight - box.top}px`;
    } else {
      node.style.left = `${box.right}px`;
      node.style.top = `${box.top + box.height / 2}px`;
    }
  }, [side]);

  /* À chaque ouverture : la bulle (re)entre dans le top layer — la dernière entrée est la plus haute, donc
   * au-dessus d'un `<dialog>` modal déjà ouvert — et se place ; ouverte, elle suit le défilement et la fenêtre. */
  useLayoutEffect(() => {
    const node = bubble.current;
    if (!visible || !node) return;
    if (node.matches(":popover-open")) node.hidePopover();
    node.showPopover();
    place();
    window.addEventListener("scroll", place, { capture: true, passive: true });
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, { capture: true });
      window.removeEventListener("resize", place);
    };
  }, [visible, place]);

  const pill = useRef<HTMLSpanElement>(null);
  const outgoing = useRef<HTMLSpanElement>(null);

  /* La largeur, à chaque échange de mot. Elle est MESURÉE et écrite en `style` sur le nœud — une
   * donnée mesurée au rendu, l'exception « données de contenu » de la loi 1, comme la mesure de
   * `SegmentedTrack`. Départ : la largeur en cours si un glissement est déjà parti (le `style`
   * porte alors une largeur), sinon le mot sortant plus le remplissage. Arrivée : la largeur
   * naturelle, lue `style` retiré, le mot sortant étant hors flux. */
  useLayoutEffect(() => {
    const node = pill.current;
    const word = outgoing.current;
    if (!node) return;

    if (!word) {
      node.style.width = "";
      return;
    }

    const box = getComputedStyle(node);
    const from = node.style.width
      ? parseFloat(box.width)
      : word.offsetWidth + parseFloat(box.paddingLeft) + parseFloat(box.paddingRight);

    node.style.width = "";
    const to = node.offsetWidth;
    if (Math.abs(from - to) < 0.5) return;

    node.style.width = `${from}px`;
    void node.offsetWidth;
    node.style.width = `${to}px`;
  }, [shown.id]);

  useEffect(() => {
    if (!triggered && !waiting) return;

    /* `Escape` révoque la bulle ouverte, et l'attente avec elle (obligation 1). */
    const dismiss = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      window.clearTimeout(timer.current);
      timer.current = 0;
      setWaiting(false);
      setTriggered(false);
    };

    document.addEventListener("keydown", dismiss);
    return () => document.removeEventListener("keydown", dismiss);
  }, [triggered, waiting]);

  /* Démontée pendant l'attente, la bulle n'a plus rien à ouvrir. */
  useEffect(() => {
    const pending = timer;
    return () => window.clearTimeout(pending.current);
  }, []);

  /* Ouvrir : tout de suite, ou au terme de l'attente. Une attente armée ou une bulle ouverte ne se
   * réarment pas (docstring, « la bulle qui décrit », point 3). */
  const show = () => {
    if (delay === "none") {
      setTriggered(true);
      return;
    }
    if (triggered || timer.current !== 0) return;
    /* En secondes comme en millisecondes : le minifieur du build réécrit `1000ms` en `1s`, et un
     * `parseFloat` seul y lirait une milliseconde (docstring, point 3). */
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(WAIT.slice(4, -1))
      .trim();
    const ms = (parseFloat(value) || 0) * (value.endsWith("ms") ? 1 : 1000);
    setWaiting(true);
    timer.current = window.setTimeout(() => {
      timer.current = 0;
      setWaiting(false);
      setTriggered(true);
    }, ms);
  };

  /* Fermer : tout de suite, attente comprise. */
  const hide = () => {
    window.clearTimeout(timer.current);
    timer.current = 0;
    setWaiting(false);
    setTriggered(false);
  };

  const open = (event: PointerEvent<HTMLSpanElement>) => {
    if (event.pointerType === "mouse") show();
  };

  return (
    <span
      ref={wrap}
      className={side === "top" ? "relative inline-flex self-start" : "relative block"}
      onPointerEnter={open}
      onPointerLeave={hide}
      onFocus={(event) => {
        /* Un focus POSÉ PAR SCRIPT — la couche qui s'ouvre et donne le focus à son premier contrôle, après un clic — n'ouvre
         * pas la bulle : seul un focus visible au clavier le fait (2026-11-12). */
        if (event.target instanceof Element && event.target.matches(":focus-visible")) show();
      }}
      onBlur={hide}
    >
      {children}

      {/* La bulle reste MONTÉE et bascule par `data-state` : une sortie ne s'anime pas sur un nœud
       * qui quitte le DOM. `display` transitionné en discret, valeurs de
       * départ en `starting:`. Le centrage (`-translate-x-1/2`) et la montée (`translate-y-…`)
       * composent sur la même propriété `translate`, par les variables de Tailwind v4. */}
      <span
        ref={bubble}
        popover="manual"
        id={descriptionId}
        aria-hidden="true"
        data-state={visible ? "open" : "closed"}
        className={cn(
          /* Au-dessus, centrée sur la largeur ; à droite, centrée sur la hauteur. Le remplissage
           * transparent tourne avec elle : `pb-2` au-dessus, `pl-2` à droite (obligation 2). */
          /* `fixed` dans le top layer : la place (`left` et `bottom` ou `top`) est mesurée (`place`). Les `m-0`,
           * `p-0`, `border-0`, `overflow-visible` et `bg-transparent` défont la feuille de style d'un popover. */
          "fixed m-0 inset-auto border-0 bg-transparent p-0 overflow-visible",
          side === "top"
            ? "-translate-x-1/2 origin-bottom pb-2"
            : "-translate-y-1/2 origin-left pl-2",
          /* Qui décrit : la largeur de sa phrase, plafonnée sur la pastille (point 2). */
          describing && "w-max",
          /* L'ombre est portée ICI, par un filtre : le nœud découpé en dessous ne peut pas la
           * porter, `clip-path` couperait une `box-shadow`. */
          "[filter:var(--drop-shadow-elevation-md)]",
          /* Fermée : inerte au pointeur tout de suite, hors du rendu une fois la sortie jouée.
           * Ouverte : survolable, `pb-2` compris (obligation 2). */
          "pointer-events-none hidden data-[state=open]:pointer-events-auto data-[state=open]:block",
          /* Sortie : fondu seul, sur la durée et la courbe de sortie, sans échelle ni descente. */
          "opacity-0 transition-[opacity,translate,scale,display] transition-discrete",
          "duration-[var(--duration-fast)] ease-out",
          /* Entrée : à sa place, à sa taille, sur le ressort. */
          "data-[state=open]:opacity-100 data-[state=open]:duration-[var(--duration-base)]",
          "data-[state=open]:ease-spring-pop",
          "starting:data-[state=open]:opacity-0",
          side === "top"
            ? "starting:data-[state=open]:translate-y-[var(--lift-tooltip-enter)]"
            : "starting:data-[state=open]:-translate-x-[var(--shift-tooltip-enter)]",
          "starting:data-[state=open]:scale-[var(--scale-overlay-enter)]",
        )}
      >
        {/* La pastille. `flex justify-center` centre un mot plus large qu'elle pendant que sa
         * largeur glisse — il déborde des deux côtés, et `overflow-hidden` le découpe. */}
        <span
          ref={pill}
          className={cn(
            "relative flex justify-center overflow-hidden bg-tooltip-surface px-3 py-1",
            "[clip-path:var(--clip-cursor-pill)]",
            "font-pixel text-body-sm font-normal",
            /* Un mot ne passe jamais à la ligne ; une phrase, sous son plafond (point 2). */
            describing ? "max-w-[var(--size-tooltip-max-width)]" : "whitespace-nowrap",
            "text-text-primary",
            "transition-[width] duration-[var(--duration-base)] ease-in-out",
          )}
          onTransitionEnd={(event) => {
            /* Fin du glissement : la pastille suit de nouveau son mot. */
            if (event.target === event.currentTarget && event.propertyName === "width") {
              event.currentTarget.style.width = "";
            }
          }}
        >
          {/* Les `key` sont PRÉFIXÉES par rôle, et ce n'est pas décoratif : React réconcilie les
           * enfants par `key` sur toute la liste, si bien qu'un mot sortant de clé `3` reprenait le
           * nœud du mot affiché de clé `3` au lieu d'en monter un neuf. Un nœud repris n'a pas de
           * style de départ : il partait de `none` et perdait son centrage pendant la montée. */}
          {leaving ? (
            <span
              key={`out-${leaving.id}`}
              ref={outgoing}
              className={cn(
                "absolute top-0 left-1/2 -translate-x-1/2 py-1",
                "-translate-y-full opacity-0",
                "transition-[translate,opacity] duration-[var(--duration-base)] ease-out",
                "starting:translate-y-0 starting:opacity-100",
              )}
              onTransitionEnd={() => setLeaving(null)}
            >
              {leaving.text}
            </span>
          ) : null}
          <span
            key={`in-${shown.id}`}
            className={cn(
              leaving && "transition-[translate,opacity] duration-[var(--duration-base)] ease-out",
              leaving && "starting:translate-y-full starting:opacity-0",
            )}
          >
            {shown.text}
          </span>
        </span>
      </span>
    </span>
  );
}
