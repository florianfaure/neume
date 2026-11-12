"use client";

import { useEffect, useRef } from "react";

import type { IconName } from "@/components/ui/icon";
import { Icon } from "@/components/ui/icon";
import { SegmentedTrack } from "@/components/ui/segmented-track";
import { cn } from "@/lib/cn";

interface ThemeSelectorProps {
  /**
   * Les deux mots du sélecteur, lus par les lecteurs d'écran : le texte `sr-only` de chaque radio.
   * Défaut `{ light: "Light", dark: "Dark" }` : un petit texte système, au défaut anglais
   * remplaçable (anonymisation pour Consort, décision de Florian du 2026-11-11, spec `docs/specs/2026-11-11-anonymisation-design.md` § 2). Le portfolio garde ses mots sans les passer.
   */
  labels?: { light: string; dark: string };
  /**
   * Thème choisi au premier rendu.
   *
   * SEULE PROP, et c'est une décision, pas un oubli. Il n'existe ni `value`, ni
   * `onValueChange`, exactement comme sur `Tab` : rien ne pilote ni n'observe le thème de
   * l'extérieur aujourd'hui, et la loi 10 dit de ne pas légiférer au-delà du besoin.
   *
   * `onValueChange` avait été cadré, puis RETIRÉ au build : le relayer suppose d'écrire un
   * `onChange` sur la radio, et une fonction fabriquée dans un composant serveur ne franchit pas
   * la frontière RSC — « Event handlers cannot be passed to Client Component props ». Il n'y
   * avait que deux issues, et la loi 11 les départage sans hésiter : poser `"use client"` pour un
   * rappel que personne n'écoute, ou retirer le rappel. `onValueChange` naît avec le consommateur
   * qui le justifie.
   *
   * LA DIRECTIVE EST NÉE ; `onValueChange` NON, ET C'EST LA PHRASE CI-DESSUS QUI LE
   * DÉCIDE. Elle posait une condition — « avec le consommateur qui le justifie » — et ce
   * consommateur n'existe toujours pas : le composant n'a personne à prévenir, puisqu'il écrit
   * lui-même sur `document.documentElement`. Un rappel n'aurait toujours aucun auditeur, et la
   * loi 10 dit de ne pas légiférer au-delà du besoin. Le jour où une page doit OBSERVER le thème
   * — pour changer une image, par exemple —, la prop naîtra avec elle.
   *
   * CE QUE CETTE PROP DÉCIDE ENCORE, ET CE QU'ELLE NE DÉCIDE PLUS. Elle fixe ce que le SERVEUR
   * rend, donc la radio cochée entre le premier paint et l'hydratation — pas ce qui s'y voit
   * depuis le 2026-10-28, l'apparence suivant alors `html[data-theme]`. Elle ne décide plus du
   * thème : celui-là est arrêté avant elle par le script anti-flash de `app/layout.tsx`, qui lit
   * `localStorage` puis `prefers-color-scheme`. Voir « LE RECALAGE » et « AVANT L'HYDRATATION »
   * dans la docstring du composant.
   *
   * `manifest.schema.json` confirmait déjà la moitié du raisonnement pour `value` : il exige un
   * `default` sur toute prop à options non requise, qu'une prop contrôlée n'a pas par définition.
   */
  defaultValue?: ThemeValue;
}

/** Les deux thèmes. Exporté pour l'appelant qui tiendra l'état du thème. */
export type ThemeValue = "light" | "dark";

/**
 * Les deux options, dans l'ordre de la maquette. `target` ancre le calque de pointage au bord
 * INTÉRIEUR de la pastille — voir le point 1 du squelette de classes plus bas.
 *
 * DEUX GLYPHES PAR OPTION, et ce n'est pas un choix de style : c'est la seule
 * mécanique possible pour un composant non contrôlé. Voir « LE REMPLISSAGE » plus bas.
 */
const OPTIONS: {
  value: ThemeValue;
  icon: IconName;
  iconFilled: IconName;
  target: string;
  early: { label: string; hollow: string; filled: string };
}[] = [
  {
    value: "light",
    icon: "sun",
    iconFilled: "sun-filled",
    target: "before:right-0",
    early: {
      label: cn(
        "[html[data-theme=light]_fieldset:not([data-synced])_&]:text-text-primary",
        "[html[data-theme=dark]_fieldset:not([data-synced])_&]:text-text-tertiary",
      ),
      hollow: cn(
        "[html[data-theme=light]_fieldset:not([data-synced])_&]:hidden",
        "[html[data-theme=dark]_fieldset:not([data-synced])_&]:inline",
      ),
      filled: cn(
        "[html[data-theme=light]_fieldset:not([data-synced])_&]:block",
        "[html[data-theme=dark]_fieldset:not([data-synced])_&]:hidden",
      ),
    },
  },
  {
    value: "dark",
    icon: "moon",
    iconFilled: "moon-filled",
    target: "before:left-0",
    early: {
      label: cn(
        "[html[data-theme=dark]_fieldset:not([data-synced])_&]:text-text-primary",
        "[html[data-theme=light]_fieldset:not([data-synced])_&]:text-text-tertiary",
      ),
      hollow: cn(
        "[html[data-theme=dark]_fieldset:not([data-synced])_&]:hidden",
        "[html[data-theme=light]_fieldset:not([data-synced])_&]:inline",
      ),
      filled: cn(
        "[html[data-theme=dark]_fieldset:not([data-synced])_&]:block",
        "[html[data-theme=light]_fieldset:not([data-synced])_&]:hidden",
      ),
    },
  },
];

/**
 * La clé de `localStorage`, et elle a DEUX lecteurs : ce fichier, et le script anti-flash de
 * `app/layout.tsx`.
 *
 * Ils ne peuvent pas la partager. Le script est une CHAÎNE de caractères injectée dans le `<head>`
 * — il n'importe rien, par construction, puisqu'il doit s'exécuter avant tout module. La constante
 * est donc écrite deux fois, ce qui est le seul cas de duplication du repo qu'aucun outil ne peut
 * fermer.
 *
 * SI ELLE CHANGE, ELLE CHANGE AUX DEUX ENDROITS. Le symptôme d'un oubli est particulièrement
 * traître : rien ne casse, rien ne lève, le clic continue de repeindre la page — c'est seulement
 * au RECHARGEMENT que le choix cesse d'être relu, et le thème retombe silencieusement sur celui du
 * système.
 */
const STORAGE_KEY = "theme";

/**
 * Applique un thème et le mémorise.
 *
 * ELLE EST AU NIVEAU DU MODULE, PAS DANS LE COMPOSANT, et ce n'est pas un rangement : c'est
 * `react-hooks/immutability` — la règle du compilateur React — qui l'exige. Une fonction déclarée
 * dans le corps d'un composant n'a pas le droit de muter une valeur définie hors de lui, et
 * `document` en est une. Le remède que la règle SUGGÈRE (« consider using an effect ») reviendrait
 * à tenir le thème dans un `useState` et à le pousser depuis un effet, donc à faire de React
 * l'autorité sur un état que le navigateur tient déjà — exactement ce que la docstring du
 * composant refuse.
 *
 * Le vrai remède est celui-ci, et il est meilleur que le contournement : cette fonction ne ferme
 * sur aucune prop ni aucun état, donc elle n'avait rien à faire dans le composant. Elle est
 * fabriquée une fois pour le module au lieu d'une fois par rendu.
 *
 * L'ORDRE DES DEUX ÉCRITURES COMPTE. Le repaint est DEMANDÉ d'abord, `localStorage` ensuite :
 * repeindre est ce que l'utilisateur vient de demander, mémoriser n'est qu'un confort ;
 * le repaint passe par une View Transition, qui écrit l'attribut à son rythme — mais
 * elle est LANCÉE avant la mémorisation, donc un `localStorage` qui lève n'emporte toujours pas le
 * repaint avec lui et le clic ne fait jamais RIEN. Dans l'ordre inverse, il l'aurait emporté.
 *
 * LE FONDU, ET CE QU'IL NE COÛTE PAS. Quand le navigateur sait faire une View Transition et que le
 * visiteur n'a pas demandé moins de mouvement, l'écriture de l'attribut est enveloppée dans
 * `document.startViewTransition` : le navigateur capture l'ancienne page, la nouvelle s'écrit, et
 * les deux fondent. Sinon l'écriture se fait d'un coup, comme avant — c'est le repli, et il est
 * complet : le thème change, seul le fondu manque. La requête `prefers-reduced-motion` est lue au
 * CLIC et non laissée au filet de `globals.css` : ce filet ramènerait bien la durée à 1 ms, mais
 * ne demander aucune transition épargne aussi la capture d'écran qu'elle fait. La durée et la
 * courbe des pseudo-éléments sont dans `@layer base` de `globals.css`, pas ici.
 *
 * DEUX CLICS RAPPROCHÉS : un second `startViewTransition` saute le premier, dont le rappel
 * s'exécute quand même — l'attribut finit donc sur le dernier clic, et `localStorage`, écrit à
 * chaque appel, aussi.
 */
function choose(value: ThemeValue) {
  const paint = () => {
    document.documentElement.dataset.theme = value;
  };

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (typeof document.startViewTransition === "function" && !reduced) {
    /* `ready` est REJETÉE quand la transition est sautée — un second clic qui saute la première,
     * un onglet en arrière-plan — alors que le thème, lui, est appliqué quand même (le rappel
     * s'exécute toujours). Sans ce `catch`, chaque saut laisse une `InvalidStateError` non
     * rattrapée dans la console, pour un fondu manqué qui n'est pas une erreur. */
    document.startViewTransition(paint).ready.catch(() => {});
  } else {
    paint();
  }

  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* Safari en navigation privée et certaines politiques de cookies tiers LÈVENT ici — pas
     * « retournent null », lèvent. Le thème est appliqué quoi qu'il arrive ; seule sa mémorisation
     * est perdue, et c'est exactement la dégradation qu'on veut. Le script anti-flash de
     * `app/layout.tsx` tient le même raisonnement, avec le même `try`. */
  }
}

/**
 * ThemeSelector — le contrôle à deux options du thème du portfolio. D'après les maquettes Figma
 * `light/dark` (node `83:408`) et `theme selector` (node `89:748`), cadrées avec Florian.
 *
 * IL REPEINT LA PAGE.
 * Le remap existe : `semantic.css` porte un bloc `[data-theme="dark"]` qui
 * remappe les tokens de couleur et de curseur, et ce composant est ce qui pose l'attribut. Spec :
 * `docs/specs/2026-08-11-dark-mode-design.md`.
 *
 * LE CHANGEMENT DE THÈME FOND — spec `2026-10-07-micro-animations-design` § 7.
 * C'est la PREMIÈRE View Transition du site : l'écriture de `data-theme` est enveloppée dans
 * `document.startViewTransition`, et toute la page passe d'une polarité à l'autre en fondu
 * enchaîné, sur la durée et la courbe de base du système, posées dans `globals.css`. Sans l'API, le
 * changement reste instantané ; sous `prefers-reduced-motion`, aucune transition n'est demandée.
 * LE SCRIPT ANTI-FLASH DU `<head>` N'EST PAS TOUCHÉ : le premier affichage n'a rien à fondre. La
 * pastille de `SegmentedTrack` glisse pendant le fondu — elle vit dans la page, donc dans la
 * nouvelle image, qui est vivante. Voir `choose` pour la mécanique.
 *
 * IL ÉTAIT SERVEUR ET À ZÉRO JAVASCRIPT ; IL NE L'EST PLUS, ET C'ÉTAIT PRÉVU.
 * Rien d'autre ne pouvait poser `data-theme` — ni CSS, ni radio native, ni
 * composant serveur. Ce qui est PERDU est réel et il ne faut pas le minimiser : ce composant
 * était la preuve qu'un état de formulaire pouvait vivre sans bundle.
 *
 * CE QUI EST GARDÉ, ET CE N'EST PAS UN DÉTAIL : les radios restent NATIVES. Il n'y a toujours
 * aucun `useState`, l'état vit toujours dans le DOM, et le composant reste NON CONTRÔLÉ — le
 * gestionnaire n'écrit pas dans React, il écrit sur `documentElement` et dans `localStorage`.
 * On garde donc le groupe clavier natif (un seul arrêt de tabulation, les flèches changent
 * d'option) et surtout l'état exposé NATIVEMENT à l'assistance par `:checked`, sans un seul
 * `aria-*`. Ce dernier point n'est pas cosmétique : c'est la SECONDE CONDITION de l'exception de
 * la loi 7, et la perdre coûterait l'exception elle-même. La directive ajoute un
 * gestionnaire ; elle ne change pas le squelette.
 *
 * LE RECALAGE, et c'est la seule vraie subtilité du fichier. Le serveur ne sait pas ce
 * qu'affiche l'OS ni ce que l'utilisateur a mémorisé : il rend donc `defaultValue`, qui peut être
 * FAUX. Le script anti-flash de `app/layout.tsx` a déjà posé le bon `data-theme` sur `<html>`
 * avant le premier paint — la PAGE est donc juste — mais il ne pouvait pas cocher la bonne radio,
 * puisqu'aucune radio n'existait encore quand il a tourné. L'effet ci-dessous le fait, une fois,
 * à l'hydratation. La pastille n'y est pas encore : `SegmentedTrack` ne la montre qu'à sa première
 * mesure, faite APRÈS ce recalage, et la pose directement sous « Dark ». L'alternative était un
 * cookie lu par le serveur, donc la fin du rendu statique (spec § 13).
 *
 * AVANT L'HYDRATATION, LE GLYPHE PLEIN SUIT `html[data-theme]` (lot K du 2026-10-28, spec
 * `2026-10-28-lot-k-arrivee-design` § 5, FIL-02). Il était écrit ici, jusque-là, que la page
 * pouvait être sombre « pendant quelques millisecondes » avec le glyphe plein sur « Light ». La
 * mesure du premier écran a montré que ces millisecondes valaient deux secondes sur un téléphone
 * en 3G, et l'en-tête entre désormais au premier paint, avant le JavaScript : le mauvais glyphe se
 * serait vu. Le script du `<head>` a déjà posé le thème, et une radio ne se coche pas en CSS, mais
 * son APPARENCE si : chaque option porte, dans `OPTIONS`, ses classes `early` — la couleur du
 * label et le glyphe creux ou plein —, sous `html[data-theme=…] fieldset:not([data-synced])`. Elles
 * l'emportent par la spécificité sur `peer-checked:` et `has-[:checked]:`, qui disent encore ce
 * que le serveur a coché. L'effet de recalage pose `data-synced` sur le `<fieldset>` une fois les
 * radios justes : les classes `early` se retirent, et `:checked` redevient la seule autorité.
 *
 * POURQUOI LE CSS ET NON UN `checked` POSÉ PAR LE SCRIPT DU `<head>`. Le script tourne avant que
 * les radios existent ; les cocher depuis lui demanderait de guetter leur arrivée dans le
 * document, donc un second mécanisme qui écrit dans le DOM de React avant son hydratation. Le CSS
 * n'écrit rien : aucun écart possible, aucun avertissement. Ce qu'il
 * ne fait pas : l'état exposé à l'assistance reste celui du serveur jusqu'à l'effet, et presser
 * une option avant l'hydratation ne change aucun glyphe — rien n'est appelé avant elle de toute
 * façon. Sans JavaScript, `data-theme` est absent, les classes `early` ne s'appliquent pas, et
 * « Light » reste plein, comme la page.
 *
 * L'EFFET ÉCRIT DIRECTEMENT SUR LE DOM plutôt que de passer par un état React, et c'est
 * cohérent avec le reste : le composant est non contrôlé, donc `checked` est une propriété du
 * DOM, pas une valeur de rendu. Un `useState` ici transformerait les deux radios en champs
 * contrôlés et ferait de React l'autorité sur un état que le navigateur tient déjà — plus de
 * code, plus de bundle, et un rendu de plus à chaque clic.
 *
 * Le contraste avec `Tab` reste net, même s'ils sont maintenant tous deux clients : lui a besoin
 * du JavaScript pour EXISTER (hash de l'URL, roving tabindex, refs) ; celui-ci n'en a besoin que
 * pour son EFFET DE BORD sur le document.
 *
 * LE `<span className="sr-only">` N'EST PAS DÉCORATIF. L'icône étant `aria-hidden`, le `<label>`
 * ne contiendrait aucun texte et la radio n'aurait PAS DE NOM ACCESSIBLE. C'est lui qui le porte,
 * et c'est lui qui donne le sens du glyphe à qui ne le voit pas.
 *
 * `name="theme"` EST ÉCRIT EN DUR, donc le composant est à EXEMPLAIRE UNIQUE sur le site, comme
 * `Portrait` : deux instances sur une page partageraient le groupe de radios. Un `useId()`
 * lèverait la contrainte, et sans coût de directive puisque le composant est client ; rien ne la
 * demande tant que le site n'en pose qu'un par page.
 *
 * L'OPTION HUG SON ICÔNE. 16 + 4 + 4 = 24, où 16 est le second cran de la loi 5 et 4 le demi-pas
 * `space-1` ; la hauteur de 32 px de la piste en découle. Aucune dimension n'est décidée ici,
 * contrairement à `Tab`, dont l'interligne de 20 px ne tombait sur aucun couple de pas.
 *
 * LE CONTRÔLE A RÉTRÉCI, de 76 × 40 à 60 × 32, et les 16 px gagnés en largeur
 * viennent ENTIÈREMENT de la descente du glyphe de 24 à 16 : le passe-partout et la gouttière
 * n'ont pas bougé d'un pixel. C'est ce qui rend l'opération réversible, et c'est pourquoi il ne
 * faut pas « rattraper » l'espace en resserrant `p-1` ou `gap-1` — ils ne sont pour rien dans le
 * gain. Le 16 dans un CONTRÔLE est une ouverture de la loi 5, conditionnée à
 * l'ancrage du calque décrit au point 1. Spec § 15.
 *
 * LE REMPLISSAGE. L'option choisie porte le glyphe PLEIN, l'autre le glyphe creux. Le composant
 * étant non contrôlé, `checked` n'est pas une valeur de rendu : `name={checked ? … : …}` n'existe
 * pas — et la loi 11 interdirait de toute façon qu'un état visuel devienne une prop. Il ne reste
 * qu'une mécanique : LES DEUX GLYPHES SONT RENDUS et le CSS en cache un.
 *
 *   `peer-` et non `has-` : `has-[:checked]` peint le `<label>` lui-même — la couleur du glyphe
 *   —, mais il ne peut pas atteindre un
 *   enfant. Les deux `<span>` sont des frères SUIVANTS de la radio, ce qui est exactement la
 *   condition de `peer`.
 *
 *   `group-active` EN PLUS de `peer-checked`, et ce n'est pas de la décoration : presser doit faire
 *   apparaître l'état FINAL, et c'est le glyphe SEUL qui le montre — la
 *   pastille ne part qu'au relâcher (point 3 plus bas). Sans lui, presser une option non choisie
 *   ne montrerait rien du tout. Avec lui, presser
 *   l'option déjà choisie ne change rien — les deux variantes demandent le même glyphe.
 *
 *   Un seul des deux `<span>` est un item de grille à la fois : `hidden` vaut `display: none`,
 *   donc le glyphe caché ne prend aucune place et `place-items-center` centre celui qui reste.
 *
 * PAS DE `self-start`, et ce n'est pas un oubli : l'item de flux est ici le `<fieldset>`, pas la
 * piste. Le fieldset s'étire, mais il ne porte ni fond ni bordure et n'est pas cliquable — son
 * étirement est invisible. La piste est `inline-flex` à l'intérieur, donc elle hug ses deux
 * hug ses deux options quoi qu'il arrive (loi 8). Cette piste est `SegmentedTrack`.
 *
 * LA PASTILLE GLISSE — spec `2026-10-07-pastille-glissante-design`. Elle est
 * peinte par `SegmentedTrack`, qui LIT l'option choisie sur le `:checked` de sa radio : le
 * composant reste non contrôlé, ses radios natives, et il n'a toujours aucun `useState`. La ref
 * `track` est passée à `SegmentedTrack`, qui la relaie sur la piste — c'est elle que le recalage
 * ci-dessous interroge. Ce recalage ne fait pas glisser la pastille au
 * chargement en thème sombre : elle est posée sans transition sous « Dark », un recalage n'étant
 * pas un geste (voir la docstring de `SegmentedTrack`).
 *
 * QUATRE POINTS SUR LE SQUELETTE DE CLASSES, à relire avant toute retouche :
 *
 *   1. LA CIBLE FAIT 44 × 44, LA PASTILLE 24. Un `::before` transparent, en absolu, tiré de 10 px
 *      en haut et en bas (`--size-theme-option-target-inset`) et large de `--size-touch-target`,
 *      ANCRÉ AU BORD INTÉRIEUR de la pastille — `before:right-0` à gauche, `before:left-0` à
 *      droite — et débordant vers l'extérieur. Les deux calques ne se touchent jamais : centrés
 *      sur leurs pastilles ils se recouvriraient de 20 px, et un clic dans cette bande partirait
 *      vers le mauvais thème selon l'ordre du DOM. C'est l'obligation posée par la loi 5 amendée,
 *      et c'est aussi LA CONDITION qui autorise un glyphe de 16 dans un
 *      contrôle : sans cet ancrage, la loi le refuserait. Les 4 px de gouttière sont donc une
 *      bande morte, assumée. Le calque ne porte PAS `pointer-events-none`, sans quoi il
 *      n'agrandirait rien. Empreinte de pointage totale : 92 × 44 autour d'un dessin de 60 × 32 —
 *      la part invisible vaut 4,2 fois la part visible, et Florian l'a
 *      arbitré en connaissance du chiffre.
 *   2. L'ANNEAU DE FOCUS EST DÉCLARÉ ENTIÈREMENT ICI — largeur, style, couleur ET décalage —
 *      contrairement à `Tab`, qui n'en déclare que deux. La raison est mécanique : le plancher
 *      `:focus-visible` de `globals.css` s'applique à l'ÉLÉMENT FOCUSÉ, qui est ici la radio
 *      `sr-only`, réduite à un pixel et rognée ; il ne peut donc pas peindre le `<label>`.
 *      Le décalage passe par `--focus-ring-offset`, extrait du plancher pour
 *      cette raison précise : c'est LA MÊME VALEUR, lue à la source, donc l'alignement visuel
 *      avec `Tab` est garanti et le reste si le plancher change. `outline-offset-1` aurait valu
 *      1 px et non 4 — l'utilitaire de Tailwind v4 est en pixels, pas sur l'échelle
 *      d'espacement — et `outline-offset-4` aurait figé un littéral. Vérifié dans le CSS émis.
 *      L'anneau s'accroche comme celui du plancher (lot E, 2026-10-21, A11Y-05) : le label joue le
 *      même `@keyframes focus-ring-arrive` de `globals.css`, en `--duration-fast` sur
 *      `--ease-spring-pop`, de `--focus-ring-offset-from` (8 px) à `--focus-ring-offset` (4 px) —
 *      les mêmes variables, donc le même geste, ramené d'emblée sous `prefers-reduced-motion`.
 *      Écrit ici et non hérité parce que le plancher ne peint pas le label, pour la raison
 *      ci-dessus. Seul le décalage bouge, jamais la couleur ni l'épaisseur. L'animation, et non
 *      une transition, parce que le label porte déjà la sienne (`transition-colors`) : elle
 *      n'existe que tant que le focus clavier est dans le label, la sortie est instantanée.
 *   3. LE `<label>` NE PEINT PLUS AUCUN FOND, NI PRESSÉ NI SÉLECTIONNÉ
 *      (spec `2026-10-07-pastille-glissante-design` § 7). La pastille est celle de
 *      `SegmentedTrack`, unique, qui GLISSE d'une option à l'autre au CLIC — jamais à l'appui,
 *      décision de Florian au cadrage. Jusque-là, le pressé et le sélectionné peignaient le même
 *      fond sur l'option, pour que presser montre l'état FINAL ; ce rôle d'aperçu est désormais
 *      tenu par le seul glyphe, qui se remplit sous le doigt (`group-active`, « LE REMPLISSAGE »
 *      plus haut). Presser l'option déjà choisie ne produit toujours aucun clignotement : les deux
 *      variantes demandent le même glyphe.
 *   4. AUCUN `cursor-pointer` ICI. Il y en avait un, parce qu'aucun
 *      navigateur ne pose la main sur un `<label>` ; c'est maintenant `@layer base` de
 *      `globals.css` qui le fait, et le sélecteur qui attrape ce composant est
 *      `label:has(input)` — écrit POUR LUI, puisqu'il est le seul contrôle du système qui n'est
 *      ni lien ni bouton. Si la main disparaît des deux options, c'est cette ligne qu'il faut
 *      aller lire. Le curseur vaut sur les DEUX options, y compris celle déjà choisie, pour la
 *      raison écrite dans `Tab` — un curseur qui retomberait en flèche ferait clignoter le
 *      pointeur en traversant le contrôle. Spec
 *      `docs/specs/2026-08-09-curseurs-pixel-design.md` § 8.4.
 *
 * L'OPTION S'ENFONCE AU PRESSÉ (lot J du 2026-10-28, spec `2026-10-28-lot-j-petits-restes-design` § 3.4,
 * A11Y-07) : `active:scale-[var(--scale-press)]` sur le `<label>`, en `--duration-fast`, le glyphe qui se
 * remplit sous le doigt — `group-active` — s'y ramassant avec lui. L'échelle est celle de l'option, pas de
 * la piste ni de la pastille, qui ne glisse qu'au clic. `globals.css` ne retire le halo système que des `<button>` : celui d'un `<label>`, que cette
 * option est, n'est pas touché, et l'échelle s'y ajoute.
 *
 * LA SÉLECTION EST PORTÉE PAR L'ÉCART ENTRE LES DEUX GLYPHES, 3.75:1, et non par la pastille, qui
 * ne vaut que 1.10:1 sur la piste (1.47:1 en dark) — elle ACCOMPAGNE. C'est l'exception de la loi 7,
 * plus étroite que celle des bordures interactives, et elle survit à `prefers-reduced-motion`
 * puisque rien ne bouge. Ne pas la perdre en route : rapprocher les deux gris ferait tomber le
 * composant sous une exception qu'il n'a plus.
 *
 * LE REMPLISSAGE LUI AJOUTE UN SECOND SIGNAL, NON CHROMATIQUE : l'option
 * choisie porte 25 % d'encre en plus pour le soleil, 26 % pour la lune. C'est la mécanique de la
 * graisse du libellé de `Tab`, et elle a la même vertu — elle tient sous un daltonisme ou sur un
 * écran mal calibré, là où un écart de gris seul est fragile. L'exception ci-dessus n'est donc pas
 * élargie : elle est MOINS SOLLICITÉE. Ce qui veut dire l'inverse d'un
 * relâchement — le jour où quelqu'un rapprochera les deux gris, ce sera l'encre qui tiendra seule,
 * et il faudra le décider plutôt que le subir.
 *
 * ANONYMISÉ POUR CONSORT, le 2026-11-11 (décision de Florian, spec
 * `docs/specs/2026-11-11-anonymisation-design.md` § 2) : `labels` (`{ light: "Light", dark: "Dark" }`
 * par défaut) remplace les deux mots lus par les lecteurs d'écran, écrits en dur ; aucun pixel ne
 * bouge.
 *
 * Histoire : `docs/history/theme-selector.md`.
 */
export function ThemeSelector({
  defaultValue = "light",
  labels = { light: "Light", dark: "Dark" },
}: ThemeSelectorProps) {
  const track = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLFieldSetElement>(null);

  /* Le recalage décrit plus haut, une seule fois, à l'hydratation. Il lit le thème DÉJÀ APPLIQUÉ
   * par le script anti-flash plutôt que de relire `localStorage` : une seule autorité décide du
   * thème, et c'est le script — le composant ne fait que s'accorder à ce qu'il trouve.
   *
   * Le garde sur les deux valeurs n'est pas de la paranoïa : `data-theme` est un attribut du
   * document, donc n'importe quoi peut l'avoir écrit — une extension, un `document.write`, une
   * faute de frappe dans une console. Sans lui, un `input[value="…"]` fabriqué depuis une chaîne
   * arbitraire irait chercher un élément qui n'existe pas, ou pire.
   *
   * Tableau de dépendances VIDE, et c'est voulu : il n'y a rien à re-synchroniser après le
   * montage. Passé ce point, c'est l'utilisateur qui décide, et son clic passe par `choose`.
   *
   * LES DEUX RADIOS SONT ÉCRITES, PAS SEULEMENT CELLE QUI GAGNE — correction, et
   * c'est un sélecteur MORT qu'elle répare, pas un rangement. N'écrire que la bonne radio suffisait
   * à recaler la pastille, mais laissait le contrôle entièrement inerte dès que le thème appliqué
   * différait de `defaultValue` — donc, en pratique, pour tout visiteur dont le navigateur est en
   * sombre. Symptôme signalé sur Chrome : la pastille se déplace, la page ne se repeint jamais.
   *
   * LA MÉCANIQUE, parce qu'elle est invisible depuis ce fichier. React n'écoute pas `change` sur
   * une radio : il écoute `click`, et ne fabrique son `onChange` QUE si la valeur du nœud a bougé
   * depuis celle qu'il a mémorisée — `_valueTracker`, lu par `getTargetInstForClickEvent` dans
   * `react-dom`. Ce mémo est tenu par un setter que React pose sur la propriété `checked` du nœud.
   * Or cocher une radio DÉCOCHE sa sœur, et le navigateur le fait NATIVEMENT, sans passer par ce
   * setter : en n'écrivant que la radio gagnante, on laissait la perdante avec un mémo à `true` et
   * un `checked` à `false`. Au premier clic sur elle, React comparait `true` à `true`, ne voyait
   * aucun changement, et n'appelait donc jamais `choose`. La pastille bougeait quand même — elle
   * est peinte par `:checked`, qui n'a que faire de React —, et c'est ce qui rendait la panne si
   * trompeuse : le contrôle répond, le document ne suit pas.
   *
   * Écrire les DEUX fait passer les deux mémos par le setter, donc les remet d'accord avec le DOM.
   * Au premier `onChange` réel, React reprend la main : il resynchronise lui-même toutes les radios
   * du même `name` après un changement (`restoreStateOfTarget`), et les va-et-vient suivants n'ont
   * plus rien à corriger. Reproduit et vérifié sous jsdom avec ce react-dom, avant et après. */
  useEffect(() => {
    const applied = document.documentElement.dataset.theme;
    if (applied === "light" || applied === "dark") {
      const inputs = track.current?.querySelectorAll<HTMLInputElement>('input[name="theme"]');
      inputs?.forEach((input) => {
        input.checked = input.value === applied;
      });
    }

    /* LE RELAIS (2026-10-28, voir « AVANT L'HYDRATATION » dans la docstring) : les radios disent
     * désormais le thème, le CSS qui le lisait sur `<html>` se retire. Posé même si le garde
     * ci-dessus a sauté : sans thème reconnu, les règles d'avant l'hydratation ne s'appliquaient
     * déjà pas. */
    if (root.current) root.current.dataset.synced = "";
  }, []);

  return (
    <fieldset ref={root}>
      <legend className="sr-only">Theme</legend>

      <SegmentedTrack ref={track}>
        {OPTIONS.map((option) => (
          <label
            key={option.value}
            className={cn(
              "group relative grid place-items-center rounded-full p-1",
              "text-text-tertiary duration-[var(--duration-fast)] ease-out",
              "transition-[color,background-color,border-color,outline-color,text-decoration-color,fill,stroke,scale]",
              "active:scale-[var(--scale-press)]",
              "before:absolute before:inset-y-[var(--size-theme-option-target-inset)]",
              "before:w-[var(--size-touch-target)] before:content-['']",
              option.target,
              "hover:text-text-primary",
              "has-[:checked]:text-text-primary",
              option.early.label,
              "has-[:focus-visible]:outline-solid",
              "has-[:focus-visible]:outline-offset-[var(--focus-ring-offset)]",
              "has-[:focus-visible]:outline-[length:var(--border-thick)]",
              "has-[:focus-visible]:outline-focus-ring",
              "has-[:focus-visible]:[animation:focus-ring-arrive_var(--duration-fast)_var(--ease-spring-pop)]",
            )}
          >
            <input
              type="radio"
              name="theme"
              value={option.value}
              defaultChecked={option.value === defaultValue}
              onChange={() => choose(option.value)}
              className="peer sr-only"
            />
            <span className="sr-only">{labels[option.value]}</span>
            <span className={cn("peer-checked:hidden group-active:hidden", option.early.hollow)}>
              <Icon name={option.icon} size={16} />
            </span>
            <span
              className={cn("hidden peer-checked:block group-active:block", option.early.filled)}
            >
              <Icon name={option.iconFilled} size={16} />
            </span>
          </label>
        ))}
      </SegmentedTrack>
    </fieldset>
  );
}
