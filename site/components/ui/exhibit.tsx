"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { flushSync } from "react-dom";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Reveal } from "@/components/ui/reveal";
import { Tab } from "@/components/ui/tab";
import { Tag } from "@/components/ui/tag";

/** Une cellule du tableau : un texte, ou une étiquette rendue par `Tag` — le verdict d'une ligne. */
type ExhibitCell = string | { tag: string };

/**
 * Une image du cadre : un fichier SVG ou WebP de `public/`, servi tel quel, avec son `alt` et ses
 * dimensions naturelles.
 */
type ExhibitImage = { src: string; alt: string; width: number; height: number };

/** Un état de l'avant / après : le mot de son onglet, son image et sa phrase. */
type ExhibitState = {
  label: string;
  image: ExhibitImage;
  caption: string;
};

interface ExhibitLabels {
  /**
   * Le nom du bouton qui ouvre la visionneuse, et le texte de sa bulle. Défaut « Enlarge » : un petit
   * texte système, au défaut anglais remplaçable (anonymisation pour Consort, décision de Florian du 2026-11-11, spec `docs/specs/2026-11-11-anonymisation-design.md` § 2).
   */
  enlargeLabel?: string;
  /** Le nom de la croix de la visionneuse. Défaut « Close », même raison que `enlargeLabel`. */
  closeLabel?: string;
}

type ExhibitProps = ExhibitLabels &
  (
    | {
        /**
         * Les en-têtes, de deux à quatre, aux mots libres. La première colonne est le SUJET de
         * chaque ligne — l'affirmation qu'on teste, l'écran qu'on compare.
         */
        columns: [string, string] | [string, string, string] | [string, string, string, string];
        /** Les lignes, une cellule par colonne : du texte, ou `{ tag }` pour une étiquette. */
        rows: ExhibitCell[][];
        /** La phrase sous le cadre : ce que le lecteur doit en retenir. */
        caption: string;
        states?: never;
        image?: never;
        children?: never;
      }
    | {
        /** Les états de l'avant / après, deux au moins, dans l'ordre de leurs onglets. */
        states: [ExhibitState, ExhibitState, ...ExhibitState[]];
        columns?: never;
        rows?: never;
        /** Chaque état porte sa phrase : il n'y en a pas une pour le cadre. */
        caption?: never;
        image?: never;
        children?: never;
      }
    | {
        /** L'image seule, sans onglets : une scène unique, qui prend le cadre des deux autres. */
        image: ExhibitImage;
        /**
         * La phrase sous le cadre. FACULTATIVE ICI ET NULLE PART AILLEURS : une image de contenu peut
         * n'en avoir aucune. Absente, le cadre ne rend ni `<figcaption>` ni l'écart qui l'aurait précédé.
         */
        caption?: string;
        columns?: never;
        rows?: never;
        states?: never;
        children?: never;
      }
    | {
        /**
         * Le contenu libre : ce que l'appelant pose dans le cadre, sur toute la largeur de la surface.
         * Pas de bouton d'agrandissement : agrandir un contenu libre n'a pas de sens.
         */
        children: ReactNode;
        /** La phrase sous le cadre. FACULTATIVE, comme pour l'image seule : absente, ni `<figcaption>` ni écart. */
        caption?: string;
        columns?: never;
        rows?: never;
        states?: never;
        image?: never;
      }
  );

const isTag = (cell: ExhibitCell): cell is { tag: string } => typeof cell !== "string";

/**
 * L'IMAGE DE LA COUCHE TIENT TOUJOURS ENTIÈRE, sans rien qui défile — décision de Florian du
 * 2026-10-20 (spec `2026-10-20-lot-c-lecture-design` § 10). Elle garde ses `width` et `height`
 * intrinsèques en attributs, qui lui donnent son ratio, et deux plafonds : en largeur, la fenêtre
 * moins la gouttière du dialogue et le padding du panneau, de chaque côté ; en hauteur, la fenêtre
 * moins les mêmes marges, et moins ce que la couche porte autour de l'image — la croix
 * (`--size-button-height`), les deux écarts de 12 px (`--space-3`) et la phrase, que `--space-16`
 * réserve sur trois lignes. Celui des états ajoute la rangée d'onglets : sa barre fait 64 px
 * (`--space-16` : 12 de padding, 40 de piste, 12 de padding) et 4 px (`--space-1`) la séparent de la
 * phrase. `w-auto h-auto` sont ce qui fait jouer les deux plafonds ENSEMBLE, à ratio gardé : l'attribut
 * `width` est une largeur définie, et avec elle le plafond de hauteur rognerait l'image sans la
 * resserrer. `object-contain` est le filet, et `min-h-0` laisse l'image rétrécir si une phrase plus
 * longue que la réserve pousse le panneau au bord de la fenêtre : jamais déformée, jamais rognée.
 * `self-center` : sans lui l'image s'étirerait à la largeur du panneau. Le pincement et le défilement
 * restent ceux du navigateur — la couche ne pose plus aucun `touch-action`. `calc()` ne porte que
 * des `var()` et des unités de fenêtre (loi 1) ; `dvh`, pour que la barre d'adresse mobile ne coupe pas
 * le bas.
 */
const FIT = cn(
  "h-auto min-h-0 w-auto self-center object-contain",
  "max-w-[calc(100vw_-_2*var(--layout-gutter)_-_2*var(--space-4))]",
);
const FIT_H =
  "max-h-[calc(100dvh_-_2*var(--layout-gutter)_-_2*var(--space-4)_-_var(--size-button-height)_-_2*var(--space-3)_-_var(--space-16))]";
const FIT_H_TABS =
  "max-h-[calc(100dvh_-_2*var(--layout-gutter)_-_2*var(--space-4)_-_var(--size-button-height)_-_2*var(--space-3)_-_2*var(--space-16)_-_var(--space-1))]";

/**
 * La phrase de la couche : celle du `<figcaption>` du cadre, mêmes classes. `w-0 min-w-full` : elle
 * ne compte pas dans la largeur du panneau, que l'image seule fixe, et prend ensuite toute cette
 * largeur pour passer à la ligne — sans quoi une phrase longue élargirait le panneau au-delà d'une
 * image étroite.
 */
const CAPTION = "w-0 min-w-full text-center font-pixel text-body-sm text-text-tertiary";

/**
 * Une figure, écrite une seule fois pour les trois variantes : le cadre — le contour de 4 px, puis le
 * contenu découpé à 8 px sur `--color-surface` — et, à 12 px dessous, sa phrase. Le tableau et l'image
 * seule l'appellent une fois ; l'avant / après l'appelle dans chaque panneau, pour que chaque état
 * soit sa propre figure et que la rangée d'onglets de `Tab` reste dehors, sous elles. Sans `caption`,
 * pas de `<figcaption>` ni d'écart : seules l'image seule et le contenu libre peuvent s'en passer. `trigger`, le bouton qui
 * ouvre la visionneuse, est posé DANS le contour, en absolu dans son coin haut droit ; le tableau n'en
 * passe pas, et son cadre ne prend alors ni `relative` ni le groupe de survol.
 */
const framed = (inner: ReactNode, caption?: string, trigger?: ReactNode) => (
  <figure className="flex flex-col gap-3">
    <div
      className={cn(
        "rounded-xl border-[length:var(--border-frame)] border-exhibit-frame",
        trigger !== undefined && "group/frame relative",
      )}
    >
      <div className="overflow-hidden rounded-lg bg-surface">{inner}</div>
      {trigger}
    </div>
    {caption !== undefined && (
      <figcaption className="text-center font-pixel text-body-sm text-text-tertiary">
        {caption}
      </figcaption>
    )}
  </figure>
);

/**
 * Exhibit — la pièce qu'un case study montre : un cadre au contour de 4 px, et une phrase dessous
 * qui dit ce qu'il faut y voir. Spec : `docs/specs/2026-10-16-cadre-a-variantes-design.md`.
 *
 * LA VARIANTE SE DÉDUIT DES DONNÉES, ET IL N'Y A PAS DE PROP `variant` (spec § 5). Des `columns` et
 * des `rows` font un tableau de verdicts ; des `states` font un avant / après qu'on bascule par des
 * onglets ; une `image` seule fait un écran sans onglets, depuis le 2026-10-17 ; des `children` font un
 * cadre à contenu libre, depuis le 2026-11-13. Le contour et la
 * phrase sont les mêmes, seul le contenu change — « le contour avec la phrase, c'est la même chose »,
 * dit Florian. Une prop `variant` requise aurait contredit la loi 11, qui veut une variante
 * optionnelle avec un défaut, et aucun défaut n'a de sens ici : c'est le contenu qui décide, comme
 * `Button` déduit sa balise de `href`. Le type est une union discriminée par la présence des champs,
 * chaque branche interdisant ceux des autres (`never`).
 *
 * LE CONTOUR EST CELUI DE `Portrait`, SANS SON ÉTAT. Un trait plein de 4 px (`--border-frame`),
 * rayon de 12 px dehors et de 8 px dedans : des rayons CONCENTRIQUES, l'extérieur moins le trait, et
 * c'est le contenu qui porte le petit, découpé par `overflow-hidden` — ses coins comme ceux de ce
 * qu'il contient. La couleur est un token à lui,
 * `--color-exhibit-frame`, et non la bordure d'état de `Portrait` dont il partage le cran : le cadre
 * n'a aucun état — le pourquoi complet est à sa déclaration, dans `semantic.css`. Décoratif, sans
 * paire de contraste. Ni fond gris, ni ombre, ni second anneau : la référence partagée par Florian
 * en avait un, il est écarté (spec § 1).
 *
 * LA PHRASE EST UN `<figcaption>`, et le cadre un `<figure>` : la phrase nomme la figure pour
 * l'assistance. Police pixel à 14 px, au tertiaire, centrée, à 12 px du cadre — la légende des
 * images de case study (`app/(reading)/_render.tsx`), centrée. Requise, sauf pour l'image seule (voir
 * plus bas) : le cadre existe pour dire ce qui a changé, ou ce qui a tenu. Dans l'avant / après,
 * chaque état porte la sienne, dans sa propre figure.
 *
 * L'AVANT / APRÈS COMPOSE `Tab`, ET N'EN RECOPIE RIEN (spec § 3) — une rangée d'onglets écrite ici
 * serait un sosie, ce que `CLAUDE.md` interdit. CHAQUE ÉTAT EST SA PROPRE FIGURE : le panneau de
 * chaque onglet est un `<figure>` — le cadre, puis sa phrase, comme le tableau et l'image seule —, et
 * le cadre est le contour de 4 px, le contenu découpé à 8 px sur `--color-surface`, puis la scène,
 * 32 px de padding en haut et en bas, 16 sur les côtés, l'image centrée. Un seul panneau est visible
 * à la fois, les autres étant sous `hidden` : il n'y a qu'un contour à l'écran, et il change de
 * panneau avec l'onglet, sa phrase avec lui. LA RANGÉE EST SOUS LA PHRASE, hors de toute figure :
 * celle que `Tab` pose en `placement="bottom"`, ses onglets centrés, sa barre à `--color-surface` se
 * confondant avec la page — rien ne la peint. Il n'y a donc pas de `<figure>` autour de l'avant /
 * après : un `<figcaption>` ne se pose que sous son propre `<figure>`, et la rangée n'est la légende
 * de personne ; le conteneur est la `<div>` que `Tab` rend lui-même. Les écarts se lisent aux
 * classes : 12 px de `gap-3` entre le cadre et la phrase, comme pour les deux autres variantes ;
 * 4 px de `gap-1` de `Tab` entre la phrase et la barre, plus les 12 px de padding de la barre, font
 * 16 px entre la phrase et la piste des onglets ; sous la piste, rien de plus que ces 12 px de
 * padding.
 *
 * LES ONGLETS SONT HORS DU CONTOUR DEPUIS LE 2026-10-17, ET SOUS LA PHRASE : DÉCISIONS DE FLORIAN, À
 * NE PAS DÉFAIRE. D'abord, au relu des visuels de Stash : « j'aimerais bien que le tab soit en
 * dehors du contour gris. Donc il y a juste un contour gris autour de l'image, mais que le tab soit
 * en dehors et juste au-dessus de la phrase. Donc il y a juste un seul contour gris. » C'est la
 * position C2 du cadrage du 2026-10-16, « les onglets sous le cadre », que ce cadrage avait écartée
 * au profit de C3 — la barre dans le cadre, et entre la scène et elle une bande de 4 px du gris du
 * contour — et que Florian reprend lui-même. Puis, le même jour, après avoir vu les onglets entre
 * le contour et la phrase : « En fait, mets les tabs en dessous de la phrase. » L'ordre est donc le
 * contour autour de l'image, la phrase de l'état ouvert, puis la rangée d'onglets : C2, avec la
 * phrase entre le cadre et les onglets. La bande, la barre dans le cadre et le fond gris du cadre
 * (`bg-exhibit-frame`) disparaissent ; `Tab` n'a pas bougé, c'est ce qui l'entoure qui change.
 * Remettre la rangée dans le contour reproposerait C3, la remettre entre le cadre et la phrase
 * défairait le second relu.
 *
 * `Tab` EST CONTRÔLÉ, ET C'EST POUR L'ADRESSE ET POUR `switched`. Contrôlé, `Tab` ne lit ni n'écrit
 * le hash : basculer un avant / après ne touche pas à l'URL, et deux cadres sur une page ne se le
 * disputent pas. L'onglet ouvert vit dans l'état de ce composant, que `Tab` reçoit en `value` et met
 * à jour par `onValueChange` ; il lui apprend qu'un onglet a vraiment changé (`switched`, plus bas).
 * Il servait aussi, jusqu'au 2026-10-17, à poser la phrase sous le cadre, quand elle n'était ni dans
 * la rangée ni dans un panneau : elle est depuis dans le panneau, et le contrôle n'y sert plus. Les
 * onglets ont pour valeur leur RANG (`"0"`, `"1"`…) : rien ne voyage plus dans l'adresse, il n'y a
 * pas de slug à lire. La rangée a pour nom accessible ses mots, joints par des virgules — « Before,
 * After » —, `Tab` l'exigeant et l'API n'en recevant pas.
 *
 * À L'APPARITION, RIEN N'ENTRE — décision de Florian du 2026-10-18, pour les pages de lecture :
 * « J'aimerais que dans les projets et aussi les articles quand y'en aura, il n'y ait pas
 * d'animations d'apparition des éléments, uniquement si on change d'image avec les tabs, mais pas
 * quand on scroll. » Le cadre est là d'emblée, dans les trois variantes : aucun `Reveal` n'enveloppe
 * plus le bloc, ni fondu, ni montée, ni flou au défilement, et la rangée de `Tab` n'entre pas
 * d'elle-même en `"bottom"`. Il en jouait un depuis le 2026-10-16, pour que le cadre entre d'un
 * bloc — « le rectangle entier qui apparaisse ensemble, et pas des trucs qui s'animent de leur
 * côté » —, et ce qu'il demandait alors, que rien ne s'anime de son côté, se tient d'autant mieux
 * que rien ne s'anime du tout.
 *
 * AU CHANGEMENT D'ONGLET, L'IMAGE ENTRE ET LA PHRASE CHANGE D'UN COUP — décision de Florian, et la
 * SEULE animation qui reste au cadre. L'image de chaque état est enveloppée de `Reveal`, et `Reveal`
 * n'a rien appris pour ça : son panneau fermé passe sous `hidden`, sa remise à zéro le voit, et il
 * rejoue son entrée à la réouverture — montée de 16 px, flou de 4 px, 700 ms. L'ancienne image
 * disparaît d'un coup avec son panneau. La phrase, elle, n'a AUCUNE transition : elle est dans le
 * panneau, hors du `Reveal` de l'image, et change d'un coup avec lui. Sous mouvement réduit, rien ne
 * bouge, ce sont les valeurs neutralisées de `Reveal`.
 *
 * LES ÉTATS FERMÉS PORTENT LEUR `Reveal` DÈS LE CHARGEMENT, ET LE PREMIER ÉTAT SEUL RESTE NU JUSQU'AU
 * PREMIER CHANGEMENT D'ONGLET (2026-10-18). Deux raisons, et la seconde est celle qu'on oublierait.
 * L'image du premier état est la seule visible au chargement : enveloppée, elle entrerait au
 * défilement, ce que Florian ne veut plus. Elle est donc rendue nue — `index === 0` tant que
 * `switched` est faux — et ne prend son `Reveal` qu'au premier changement, quand son panneau vient
 * de se fermer. Les autres états sont fermés au chargement : un `Reveal` sous `hidden` n'entre
 * jamais, il joue à l'ouverture de son panneau, et il peut donc être monté d'emblée. C'EST CE QUI
 * GARDE L'ANIMATION EN VIE : le script du `<head>` de `app/layout.tsx` retire `data-reveal` de
 * `<html>` au bout de 3 s si aucun `Reveal` ne s'est annoncé, et sur une page de lecture plus rien
 * d'autre n'en monte un au chargement. Un `Reveal` monté seulement au premier changement d'onglet
 * arriverait, passé ce délai, sur une page sans état de départ — rien ne serait caché, rien ne
 * jouerait. Monté au chargement, celui d'un état fermé s'annonce à temps. Mesuré sur `/work/minos`,
 * 4,5 s après le chargement : en ne montant le `Reveal` qu'au changement, `data-reveal` et
 * `data-reveal-ready` avaient disparu de `<html>`, aucun bloc n'existait, et l'image était à
 * l'opacité 1 dès le premier clic ; monté au chargement, l'attribut reste, et l'image monte et sort
 * du flou. Un cadre sans `states` n'a aucun `Reveal`, ni la page qui ne porterait que lui : il n'y
 * a rien à animer.
 *
 * L'IMAGE EST SERVIE TELLE QU'ELLE EST (`images.unoptimized`), à sa taille naturelle et plafonnée à
 * la largeur de la scène par le `max-width` que la base pose sur toute image ; aucune classe ne la
 * redimensionne. LES ÉTATS D'UN MÊME CADRE PARTAGENT LES MÊMES DIMENSIONS, sans quoi la scène
 * sauterait d'un onglet à l'autre. Le type ne peut pas le vérifier : c'est à l'appelant de livrer des
 * images de même taille.
 *
 * SES PANNEAUX PORTENT UN SEUL FOCUSABLE DEPUIS LE 2026-10-20 : le bouton qui ouvre la visionneuse,
 * dans le coin du cadre (plus bas). Ils n'en portaient aucun — une image et sa phrase —, et c'était le
 * cas que le commentaire des panneaux de `Tab` réservait à Florian pour leur `tabIndex` ; il a tranché
 * le 2026-10-16, pas d'arrêt. La question tombe d'elle-même : un panneau qui contient un focusable n'en
 * demande pas (APG). La touche Tab passe du bouton du panneau ouvert à la rangée d'onglets, qui est
 * sous lui, puis à ce qui suit le cadre.
 *
 * LE TABLEAU EST UN VRAI `<table>`, avec `<thead>` (spec § 4). La première cellule de chaque ligne
 * est un `<th scope="row">` : c'est le sujet de la ligne, et un lecteur d'écran le rappelle quand on
 * se déplace d'une cellule à l'autre. En-têtes de colonne en police pixel à 12 px au tertiaire ;
 * cellules en Geist à 14 px, le sujet au primaire, les autres au secondaire ; padding de 12 × 16 px ;
 * un filet de 1 px en `--color-border-subtle` sous chaque ligne, aucun sous la dernière. Les deux
 * `<th>` posent leur graisse normale eux-mêmes : le navigateur les met en gras et les centre.
 *
 * LES CELLULES S'ALIGNENT SUR LEUR LIGNE DE BASE, ET NON AU MILIEU. Une étiquette de 24 px posée à
 * côté d'un sujet qui passe à la ligne se cale ainsi sur la première ligne du sujet — le geste du
 * `Tag` de `NoteRow` sur la première ligne de son titre —, et les deux crans de texte, 12 et 14 px,
 * écrivent sur la même ligne. Centrer aurait fait descendre l'étiquette au milieu du bloc.
 *
 * UNE CELLULE `{ tag }` SE REND PAR `Tag`, TEL QUEL : le verdict d'une hypothèse — « Validated »,
 * « Partial », « Not tested ». Le mot porte le sens, jamais le gris (loi 7) : `Tag` n'a qu'un fond,
 * le même pour les trois. Sa cellule ne passe pas à la ligne (`whitespace-nowrap`) : la mise en
 * page automatique du tableau donne au sujet toute la place qu'elle peut, et elle coupait
 * « Not tested » en deux lignes DANS la pill — mesuré à 640 px de colonne. C'est la cellule qui
 * refuse la coupure, pas `Tag` qu'on restyle.
 *
 * SOUS `md`, CHAQUE LIGNE SE REPLIE, EN CSS ET SUR LE MÊME DOM (spec § 4) — jamais un second rendu
 * en liste. La ligne devient un `flex` qui passe à la ligne : le sujet prend toute la largeur, puis
 * les autres cellules se posent côte à côte dessous, L'ÉTIQUETTE D'ABORD, par `order` — le sujet en
 * tête, les étiquettes juste après, le texte ensuite. Le padding passe de la cellule à la ligne. La
 * ligne d'en-têtes est MASQUÉE À L'ŒIL (`sr-only`) et reste dans le document : repliée, une colonne
 * n'a plus d'en-tête au-dessus d'elle, et des mots sans colonne ne diraient plus rien.
 *
 * CE QUE LE REPLI PEUT COÛTER À L'ASSISTANCE, ET RIEN NE L'A MESURÉ : un moteur qui retire la
 * sémantique d'un élément de tableau dont on change le `display` lirait des cellules sans lignes ni
 * en-têtes — c'est l'angle mort n° 36 de `.claude/rules/loi-07-accessibilite.md`. Aucun `role`
 * explicite n'est posé pour le prévenir : `jsx-a11y/no-redundant-roles` le refuserait, et le
 * précédent de la liste de `StatRow` est de ne pas désactiver la règle sans la parole de Florian.
 *
 * DEUX À QUATRE COLONNES, par un tuple, pour servir d'autres case studies. Les lignes ne sont pas
 * comptées par le type : une ligne doit porter une cellule par en-tête, et c'est l'appelant qui la
 * tient. Ni classe venue de l'extérieur, ni contenu riche : une cellule est du texte ou une
 * étiquette.
 *
 * L'IMAGE SEULE EST LA TROISIÈME VARIANTE, DU 2026-10-17 — pour l'image de case study qui n'a pas
 * d'onglets. Florian : « le même contour que pour les tables, donc un contour gris un peu plus
 * large, et que la phrase soit au centre ». C'est le cadre des deux autres, sans une classe de
 * plus : le contour de 4 px, les rayons de 12 et de 8 px, la phrase centrée dessous, le tout dans le
 * même `Reveal`. Le contenu est UNE SCÈNE UNIQUE, celle de l'avant / après — fond `--color-surface`,
 * 32 px de padding en haut et en bas, 16 sur les côtés, l'image centrée à sa taille naturelle,
 * plafonnée à la largeur de la scène, par `next/image` comme les états. C'est la figure d'un état de
 * l'avant / après, sans la rangée qui les commute : le contour n'entoure que la scène, dans les deux,
 * et le découpage de 8 px d'`overflow-hidden` arrondit ses quatre coins, comme ceux du tableau. Ni
 * onglet ni état ; depuis le 2026-10-20, le bouton de la visionneuse est son seul contrôle.
 *
 * SA PHRASE EST FACULTATIVE, ET CETTE VARIANTE EST LA SEULE OÙ ELLE L'EST. Une image de contenu peut
 * n'en avoir aucune — l'image de l'article brouillon est dans ce cas. Absente, il n'y a pas de
 * `<figcaption>` : la figure n'a que l'`alt` de son image pour se dire, et l'écart de 12 px qui
 * l'aurait précédé n'existe pas non plus, faute de second enfant. Présente, c'est celle des autres
 * variantes, mêmes classes et même écart. Dans le tableau elle reste requise, et l'avant / après
 * porte la sienne par état.
 *
 * SON PREMIER APPELANT EST L'IMAGE DU DASHBOARD DE STASH, rendue par le bloc `image` des case
 * studies (`app/(reading)/_render.tsx`).
 *
 * LE CONTENU LIBRE EST LA QUATRIÈME FORME, DU 2026-11-13 — décision de Florian, pour la page
 * /changelog de neume.dev (dépôt `/Users/florianfaure/neume`, qui recopie ce composant à l'octet près) :
 * deux figures sous une version, un avant / après de deux panneaux avec une icône agrandie 4 fois et
 * une grille de 24 icônes, chacune avec sa phrase, posées jusque-là dans une boîte faite à la main.
 * Copier les classes du cadre aurait fait un sosie (ordre 3 de `CLAUDE.md`) ; la forme est donc ici.
 * Spec : `docs/specs/2026-11-13-exhibit-contenu-libre-design.md`. `children` est EXCLUSIF des trois
 * autres champs, par une quatrième branche de l'union (`never` de part et d'autre). Sa `caption` est
 * FACULTATIVE, avec la règle de l'image seule : absente, ni `<figcaption>` ni écart ; texte simple,
 * mêmes classes que les autres. IL N'Y A NI BOUTON « ENLARGE » NI VISIONNEUSE : agrandir un contenu
 * libre n'a pas de sens, et la couche le rendrait deux fois — identifiants dupliqués, contrôles en
 * double. Le cadre se pose comme celui du tableau, par `framed` sans `trigger` : ni `relative` ni
 * groupe de survol. LA MARGE EST CELLE DE L'IMAGE SEULE, `px-4 py-8`, mais le contenu prend TOUTE la
 * largeur de la surface — un bloc, et non le `flex justify-center` de l'image, qui ferait rétrécir
 * une grille à son contenu. C'est l'appelant qui dispose son contenu dedans : le cadre ne pose
 * aucune grille, aucun alignement. Aucun `Reveal`, comme les autres formes.
 *
 * LA VISIONNEUSE, DU 2026-10-20 — l'image seule et l'avant / après s'ouvrent en grand ; le tableau,
 * du texte déjà replié sous `md`, n'en a pas. Florian, lot C, spec
 * `docs/specs/2026-10-20-lot-c-lecture-design.md` § 5 (rapports LEC-01 et CON-02 du catalogue du
 * même jour) ; la visibilité du déclencheur est un défaut de l'orchestrateur, validé avec le lot. Les
 * captures d'un case study sont livrées à 1360 px et lues à 656 : c'était le seul endroit où le site
 * faisait perdre de l'information au lecteur.
 *
 * LE DÉCLENCHEUR EST UN `Button` SECONDAIRE EN ICÔNE SEULE, glyphe `maximize` de Neume (depuis le
 * 2026-11-11 ; `scale` de Pixelarticons avant, le plus proche des quatre flèches vers les coins),
 * posé DANS le contour, en absolu, à 8 px de son coin haut droit (`top-2 right-2`) : il ne décale
 * rien. IL ENTRE AU SURVOL DU CADRE PAR LE GESTE DE `Reveal`, EN COURT — décision de Florian du
 * 2026-10-20 (spec § 10) : « le geste d'apparition du site ». Au repos il est à l'opacité 0, décalé de
 * `--lift-reveal` vers le bas, flouté de `--blur-reveal`, et `pointer-events-none` : transparent, il
 * ne capte aucun clic. Au survol du cadre (`group-hover/frame`) et quand il a le focus
 * (`group-focus-within/frame`), il arrive à l'opacité 1, `translate: none`, `filter: none` — à `none`,
 * jamais à une valeur identité, comme `Reveal` —, sur `--duration-base` et `--ease-out`. Il repart en
 * fondu court, `--duration-fast` : la durée est lue sur l'état de DESTINATION, donc `--duration-fast`
 * au repos, `--duration-base` dans l'état survolé. Transparent, il reste dans l'ordre de tabulation, et
 * c'est son focus qui le montre : l'anneau n'est jamais flouté. SOUS `(hover: none)`, où aucun survol
 * ne viendra le montrer, il est là en permanence et IMMOBILE : opacité 1, `none`, cible réactivée.
 * Sous `prefers-reduced-motion`, `--lift-reveal` et `--blur-reveal` sont ramenés à 0 par
 * `globals.css` et la durée à 1 ms : il apparaît d'un coup. Aucun token neuf : les deux amplitudes et
 * les durées sont celles de `Reveal`. Le groupe est NOMMÉ (`frame`) : le dialogue de la visionneuse
 * et `Tab` ont leurs propres groupes, et un `group-*` anonyme répond au plus proche de n'importe quel
 * ancêtre. L'IMAGE ELLE-MÊME RESTE LIBRE : pas de clic réservé, pas de curseur loupe — une septième
 * image de curseur rouvrirait la loi 1. Le tableau ne reçoit pas le bouton, et son cadre ne prend ni
 * `relative` ni le groupe : son HTML n'a pas changé.
 *
 * SON NOM, « ENLARGE », A ÉTÉ PROVISOIRE ET MARQUÉ, PUIS ACTÉ. « Aucun changement de wording »,
 * disait le lot C, et le dépôt n'avait aucune chaîne qui dise « agrandir » : ni la phrase de la
 * figure ni l'`alt` de l'image ne disent ce que fait le bouton. Il a donc porté « Enlarge », repris
 * du catalogue (LEC-01), sous une marque `GAPS:` et une ligne ouverte de `GAPS.md` — « quel mot pour
 * le bouton qui agrandit ? ». FLORIAN L'A ACTÉ LE 2026-10-20 (« tout est bon ») : la ligne est fermée,
 * la marque retirée, le mot reste. Il n'est PAS enveloppé de `Tooltip`, à l'inverse des boutons icône
 * seule de la home et de la popin : le bouton n'apparaît qu'au survol du cadre, une bulle de plus
 * ferait deux entrées pour un geste. Le nom vit en `sr-only`, où `Button` le pose.
 *
 * LA COUCHE EST UN `Dialog`, DEPUIS LE 2026-10-23 (lot I, spec `2026-10-23-lot-i-couche-modale-design`
 * § 5.2). Elle était la troisième couche du système après `ScratchCard` et `ShareButton`, écrite ici
 * comme la popin l'était dans `ShareButton` : un `<dialog>` ouvert par `showModal()`, son cycle de vie
 * en TROISIÈME COPIE DU PATRON, dont l'extraction était prévue au lot suivant. Elle a été faite : le
 * `<dialog>`, le voile, le cycle, le panneau et son mouvement sont ceux de `Dialog`, en
 * `surface="panel"` et `width="lg"`. Ce qui reste ici : la croix, l'image, la phrase et la rangée
 * d'onglets, leur écart de 12 px, l'ouverture — que la croix passe à faux, qu'Échap et le voile
 * demandent par `onOpenChange` — et le retour du focus, dans `onClosed`. Le top layer, le piège de
 * focus, l'inertie du document et Échap sont natifs. Elle n'est écrite qu'à la PREMIÈRE OUVERTURE,
 * par `flushSync` avant que l'ouverture passe à vrai, comme la popin : le HTML d'une page ne porte pas
 * deux fois chaque image et chaque phrase, et le dialogue est nommé quand le navigateur le lit. Échap,
 * la croix et un clic sur le voile — appui et relâché dehors — ferment, par un seul chemin.
 *
 * LE PANNEAU EST CELUI DE LA POPIN, ET C'EST POUR L'ANNEAU DE FOCUS. La spec disait l'image posée sur le
 * voile. Posés sur le voile, la croix et les onglets perdraient leur anneau en clair :
 * `--color-focus-ring` y vaut 1.00:1 contre le noir du voile (`styles/tokens/semantic.css`), et
 * `Button` comme `Tab` sont fermés à un anneau de rechange. Tout ce qui est dans la couche est donc
 * posé sur `--color-surface`, dans le panneau de `ShareButton`, celui de `Dialog` — son rayon, son ombre,
 * son filet `--color-share-border` en dark. Depuis le 2026-10-20 il ENVELOPPE L'IMAGE au lieu de
 * s'étirer jusqu'à la fenêtre (`width="lg"`) : il prend sa largeur plus le padding, le voile
 * l'entoure toujours. De haut en bas : la
 * croix, à droite ; l'image ; la phrase ; pour l'avant / après, la rangée d'onglets. Écarts de 12 px,
 * ceux du cadre entre l'image et sa phrase ; padding de 16 px, celui de la popin.
 *
 * L'IMAGE TIENT ENTIÈRE DANS LA FENÊTRE, ET RIEN NE DÉFILE — décision de Florian du 2026-10-20, après
 * qu'il a vu la couche à sa taille naturelle défiler (spec § 10) : « l'image entière, toujours ». La
 * première version la livrait à ses `width` et `height` dans un conteneur `overflow-auto` — le
 * pincement du mobile sans une ligne de geste ; ce conteneur et son `touch-action` sont retirés. Les
 * `width` et `height` que le cadre reçoit restent en attributs, pour le ratio ; `max-width`,
 * `max-height` et `object-contain` font le reste, et `FIT` plus haut dit le calcul. SUR MOBILE,
 * L'IMAGE EST PETITE : c'est le prix de l'image entière, et la décision de Florian. Une image en
 * portrait se règle sur la hauteur, une en paysage sur la largeur ; elle n'est jamais agrandie
 * au-delà de sa taille naturelle.
 *
 * LA PHRASE EST CELLE DU `<figcaption>`, mêmes classes, dans un `<p>` : la couche n'est pas une figure.
 * Elle NOMME LE DIALOGUE (`aria-labelledby`), comme le titre nomme la popin ; sans phrase, c'est
 * l'image qui le nomme, par son `alt`.
 *
 * L'AVANT / APRÈS DANS LA COUCHE : UNE IMAGE, ET LA MÊME RANGÉE. La couche ne porte que l'image de
 * l'onglet ouvert : changer d'onglet change sa source, pas sa place — les états partageant leurs
 * dimensions, on compare à pleine taille au même endroit. La rangée est un second `Tab`, contrôlé par
 * LE MÊME ÉTAT que celui du cadre, sous la phrase comme dans le cadre ; ses panneaux sont les phrases.
 * L'IMAGE CHANGE D'UN COUP, sans le `Reveal` du cadre : une entrée en montée et en flou ferait perdre
 * l'endroit qu'on compare. Le cadre, derrière le voile, change avec elle et joue son entrée. C'est un
 * choix de cette construction, que la spec ne tranchait pas : à l'œil de Florian.
 *
 * LE FOCUS. `showModal()` le donne à la croix, premier contrôle du panneau, et rien ne le déplace — la
 * décision de la popin. À la fermeture, le navigateur le rend au bouton d'ouverture. Une exception, et
 * c'est `onClosed`, que `Dialog` appelle après `close()` : si l'onglet a changé dans la couche, ce
 * bouton est dans un
 * panneau sous `hidden`, le navigateur ne peut pas le focaliser et le focus tomberait sur le document ;
 * il va alors au bouton du panneau ouvert, au même endroit du cadre. Le bouton est cherché dans son
 * enveloppe, `Button` n'exposant pas de ref.
 *
 * LE MOUVEMENT EST CELUI DE LA POPIN : le panneau entre au geste de `Reveal` — opacité, montée de
 * `--lift-reveal`, flou de `--blur-reveal`, en `--duration-reveal` —, arrive à `none`, et sort par le
 * chemin inverse en `--duration-base` ; le voile fond en `--duration-base`. Sous
 * `prefers-reduced-motion`, le système ramène durées et amplitudes à rien : la couche est là ou n'est
 * pas, et le bouton du cadre apparaît d'un coup (son entrée au survol est décrite plus haut).
 *
 * CE QUE LA MACHINE NE VOIT PAS, ICI : l'entrée du bouton au survol, sa sortie en fondu court et sa
 * présence au toucher ; ses 44 px de cible au coin du cadre ; l'anneau de la croix quand la couche
 * s'ouvre au clavier ; le filet en dark ; que l'image tienne entière en portrait comme en paysage, du
 * mobile au bureau, et que le panneau l'enveloppe sans bande vide ; le calcul de `FIT`, dont la réserve
 * de la phrase (trois lignes) est une estimation, et la même image d'un onglet à l'autre. Ils se
 * jugent sur `/design-system` et sur une page projet.
 *
 * AUCUNE LARGEUR (loi 8) : le cadre remplit la colonne, et `md` est le seul seuil. La couche n'en pose
 * pas à la page : son panneau enveloppe une image plafonnée à la fenêtre, et `(hover: none)` n'est pas
 * un seuil de largeur — les deux sont justifiés au champ `responsive` du manifeste.
 *
 * LES ÉTATS. Le tableau et le contenu libre sont inertes : un seul état, `default`. L'image seule est interactive par son
 * bouton d'agrandissement, et l'avant / après par ses onglets et son bouton : ce sont les cinq états de
 * `Button` et de `Tab` — plus `selected` — qui s'y lisent. Le cadre n'en ajoute qu'un, `open`, la
 * visionneuse ouverte, qui porte les tokens de la couche.
 *
 * COMPOSANT CLIENT (`runtime: "client"`) : il tient l'onglet ouvert dans un état, que `Tab` contrôlé
 * exige, le premier changement d'onglet, et la visionneuse — son ouverture, `flushSync`. Un
 * fichier n'a qu'une nature, donc le tableau et le contenu libre, qui n'en ont aucun besoin, passent client avec lui — la spec
 * le prévoyait (§ 4). Les états et les refs sont déclarés avant toute branche : un hook ne se pose pas
 * sous une condition.
 *
 * LE `tablist` SE NOMME PAR LA PHRASE DE L'ÉTAT OUVERT, le même texte que le `<figcaption>` de son
 * panneau, et non plus par la liste des mots de ses onglets (lot J du 2026-10-28, spec
 * `2026-10-28-lot-j-petits-restes-design` § 3.2, A11Y-13). Les deux rangées, celle du cadre et celle de
 * la couche, portent le même nom, la couche étant déjà nommée par cette phrase.
 *
 * ANONYMISÉ POUR CONSORT, le 2026-11-11 (décision de Florian, spec
 * `docs/specs/2026-11-11-anonymisation-design.md` § 2) : `enlargeLabel` (« Enlarge ») et `closeLabel`
 * (« Close ») remplacent les noms des deux boutons, écrits en dur ; et la visionneuse prend `Dialog`
 * en `width="lg"`, le nouveau nom de `content`. Aucun pixel ne bouge.
 *
 * Histoire : `docs/history/exhibit.md`.
 */
export function Exhibit(props: ExhibitProps) {
  const { enlargeLabel = "Enlarge", closeLabel = "Close" } = props;
  const [open, setOpen] = useState("0");
  /* Vrai dès qu'un onglet a vraiment changé : c'est alors seulement que l'image du premier état
   * prend son `Reveal` — celles des états fermés l'ont dès le chargement (voir la docstring). */
  const [switched, setSwitched] = useState(false);
  /* Vrai dès la première ouverture de la visionneuse : la couche est vide jusque-là (docstring). */
  const [viewing, setViewing] = useState(false);

  /* La visionneuse ouverte ou fermée, que `Dialog` reçoit en `open`. */
  const [enlarged, setEnlarged] = useState(false);

  const uid = useId();
  /* Le rang de l'état dont le bouton a ouvert la couche, et l'enveloppe de chaque bouton. */
  const opener = useRef<number | null>(null);
  const triggers = useRef<(HTMLDivElement | null)[]>([]);

  const choose = (next: string) => {
    if (next === open) return;
    setOpen(next);
    setSwitched(true);
  };

  /* La couche est écrite AVANT que l'ouverture passe à vrai, donc avant `showModal()` : le panneau
   * est complet à son premier affichage, et le nom du dialogue existe quand le navigateur le lit — le
   * geste de `ShareButton`. */
  const view = (index: number) => {
    opener.current = index;
    flushSync(() => setViewing(true));
    setEnlarged(true);
  };

  /* LE FOCUS REVIENT AU BOUTON D'OUVERTURE, et c'est le navigateur qui l'y ramène — sauf quand
   * l'onglet a changé dans la couche : le bouton qui l'a ouverte est alors dans un panneau sous
   * `hidden`, le navigateur ne peut pas le focaliser, et le focus tomberait sur le document. Il va au
   * bouton du panneau ouvert, qui est le même geste au même endroit du cadre. `Dialog` l'appelle
   * après `close()`. */
  const repair = () => {
    const index = Number(open);
    if (opener.current !== null && opener.current !== index) {
      triggers.current[index]?.querySelector("button")?.focus();
    }
    opener.current = null;
  };

  /* Le bouton d'ouverture, dans le coin haut droit du contour, à 8 px : visible au survol du cadre
   * et au focus du bouton, en permanence là où rien ne survole. */
  const trigger = (index: number) => (
    <div
      ref={(node) => {
        triggers.current[index] = node;
      }}
      className={cn(
        "pointer-events-none absolute top-2 right-2 flex",
        "translate-y-[var(--lift-reveal)] opacity-0 blur-[var(--blur-reveal)]",
        "transition-[opacity,translate,filter] duration-[var(--duration-fast)] ease-out",
        "group-hover/frame:pointer-events-auto group-hover/frame:translate-none group-hover/frame:opacity-100 group-hover/frame:filter-none group-hover/frame:duration-[var(--duration-base)]",
        "group-focus-within/frame:pointer-events-auto group-focus-within/frame:translate-none group-focus-within/frame:opacity-100 group-focus-within/frame:filter-none group-focus-within/frame:duration-[var(--duration-base)]",
        "[@media(hover:none)]:pointer-events-auto [@media(hover:none)]:translate-none [@media(hover:none)]:opacity-100 [@media(hover:none)]:filter-none",
      )}
    >
      <Button
        label={enlargeLabel}
        variant="secondary"
        content="icon"
        icon="maximize"
        onClick={() => view(index)}
      />
    </div>
  );

  /* La croix de la couche, au-dessus de l'image, alignée à droite — celle de la popin. */
  const cross = (
    <div className="flex shrink-0 justify-end">
      <Button
        label={closeLabel}
        variant="secondary"
        content="icon"
        icon="close"
        tooltip="none"
        onClick={() => setEnlarged(false)}
      />
    </div>
  );

  /* La couche : vide jusqu'à la première ouverture, puis `body` dans le panneau de `Dialog`, qui
   * enveloppe l'image — une colonne à 12 px d'écart, `min-h-0` pour que l'image se resserre quand la
   * fenêtre est courte. */
  const layer = (name: string, body: ReactNode) => (
    <Dialog
      open={enlarged}
      onOpenChange={setEnlarged}
      onClosed={repair}
      labelledBy={name}
      width="lg"
    >
      {viewing ? <div className="flex min-h-0 flex-col gap-3">{body}</div> : null}
    </Dialog>
  );

  let content: ReactNode;

  if (props.states !== undefined) {
    const { states } = props;
    /* LA RANGÉE SE NOMME PAR LA PHRASE DE L'ÉTAT OUVERT (lot J du 2026-10-28, A11Y-13) : le `tablist`
     * se lisait comme la liste de ses onglets, « Before, After » ; il se lit comme la légende de ce
     * que les onglets commutent. Le nom suit l'onglet ouvert, la phrase qu'on voit sous le cadre. */
    const label = states[Number(open)].caption;
    const shown = states[Number(open)].image;
    content = (
      <>
        <Tab
          label={label}
          value={open}
          onValueChange={choose}
          placement="bottom"
          items={states.map((state, index) => {
            const image = (
              <Image
                src={state.image.src}
                alt={state.image.alt}
                width={state.image.width}
                height={state.image.height}
              />
            );
            return {
              value: String(index),
              label: state.label,
              panel: framed(
                <div className="flex justify-center px-4 py-8">
                  {index > 0 || switched ? <Reveal>{image}</Reveal> : image}
                </div>,
                state.caption,
                trigger(index),
              ),
            };
          })}
        />
        {layer(
          `${uid}-caption-${open}`,
          <>
            {cross}
            {/* UNE SEULE IMAGE, celle de l'onglet ouvert : changer d'onglet change sa source, au
             * même endroit — les états partagent leurs dimensions. */}
            <Image
              src={shown.src}
              alt={shown.alt}
              width={shown.width}
              height={shown.height}
              className={cn(FIT, FIT_H_TABS)}
            />
            <div className="shrink-0">
              <Tab
                label={label}
                value={open}
                onValueChange={choose}
                placement="bottom"
                items={states.map((state, index) => ({
                  value: String(index),
                  label: state.label,
                  panel: (
                    <p id={`${uid}-caption-${index}`} className={CAPTION}>
                      {state.caption}
                    </p>
                  ),
                }))}
              />
            </div>
          </>,
        )}
      </>
    );
  } else if (props.image !== undefined) {
    const { image, caption } = props;
    content = (
      <>
        {framed(
          <div className="flex justify-center px-4 py-8">
            <Image src={image.src} alt={image.alt} width={image.width} height={image.height} />
          </div>,
          caption,
          trigger(0),
        )}
        {layer(
          caption !== undefined ? `${uid}-caption` : `${uid}-image`,
          <>
            {cross}
            <Image
              id={`${uid}-image`}
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              className={cn(FIT, FIT_H)}
            />
            {caption !== undefined && (
              <p id={`${uid}-caption`} className={cn("shrink-0", CAPTION)}>
                {caption}
              </p>
            )}
          </>,
        )}
      </>
    );
  } else if (props.columns !== undefined) {
    const { columns, rows } = props;
    content = framed(
      <table className="block w-full md:table">
        <thead className="sr-only md:not-sr-only">
          <tr className="border-b-[length:var(--border-thin)] border-border-subtle">
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className="px-4 py-3 text-left font-pixel text-caption font-normal text-text-tertiary"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="block md:table-row-group">
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="flex flex-wrap items-baseline gap-x-3 gap-y-2 border-b-[length:var(--border-thin)] border-border-subtle px-4 py-3 last:border-b-0 md:table-row md:p-0"
            >
              {row.map((cell, cellIndex) => {
                const body = isTag(cell) ? <Tag>{cell.tag}</Tag> : cell;
                if (cellIndex === 0) {
                  return (
                    <th
                      key={cellIndex}
                      scope="row"
                      className="order-first w-full text-left align-baseline font-body text-body-sm font-normal text-text-primary md:w-auto md:px-4 md:py-3"
                    >
                      {body}
                    </th>
                  );
                }
                return (
                  <td
                    key={cellIndex}
                    className={cn(
                      "align-baseline font-body text-body-sm text-text-secondary md:px-4 md:py-3",
                      isTag(cell) && "-order-1 whitespace-nowrap",
                    )}
                  >
                    {body}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>,
      props.caption,
    );
  } else {
    /* Le contenu libre, seule branche restante : `children` peut valoir `undefined` (c'est un
     * `ReactNode`), donc on ne le teste pas — la forme se reconnaît aux trois autres. Le cadre du
     * tableau, sans bouton ni couche, la marge de l'image seule, le contenu en bloc sur toute la
     * largeur. */
    content = framed(<div className="px-4 py-8">{props.children}</div>, props.caption);
  }

  return content;
}
