"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import type { LogoBrand } from "@/components/ui/logo";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/cn";
import { newTabAttributes, newTabNotice } from "@/lib/new-tab";

interface TextLinkProps {
  /** Destination du lien. Requise et sans défaut : un lien sans destination n'est pas un lien. */
  href: string;
  /**
   * Le ou les mots qui portent le lien. `ReactNode` et non `string`, comme les enfants de `Tag` :
   * un nom de marque peut un jour porter une composition, et rien ici n'exige du texte brut.
   */
  children: ReactNode;
  /**
   * Pose `target="_blank"` et `rel="noopener"`, et ajoute « (opens in a new tab) » en `sr-only` au
   * nom accessible. Même prop, même nom et même mention que sur `Button` — un nouvel onglet non
   * annoncé désoriente qui navigue au lecteur d'écran.
   */
  newTab?: boolean;
  /**
   * La marque de la destination, quand `Logo` en a une. Au survol, son carré suit le pointeur, en
   * bas à droite et un peu sous la main du système, qui reste. Facultative : sans elle, le lien n'a
   * que la main. Typée sur l'union que `Logo` exporte, jamais sur une union locale — c'est `Logo`
   * qui connaît les marques.
   */
  brand?: LogoBrand;
}

/**
 * TextLink — un lien dans une phrase. Spec : `docs/specs/2026-08-10-home-page-design.md` § 12.
 *
 * IL COMBLE UN TROU QUE LE SYSTÈME N'AVAIT PAS ENCORE RENCONTRÉ. `Button` navigue déjà quand on lui
 * donne un `href`, mais c'est une pill de 36 px : elle ne peut pas vivre au milieu d'un paragraphe.
 * Écrire un `<a>` à la main dans la page aurait marché et aurait été exactement ce que la loi 9
 * interdit — un contrôle interactif dont les cinq états de la loi 4 ne seraient déclarés nulle part,
 * donc invisibles à la vitrine comme à l'audit.
 *
 * IL N'ÉCRIT AUCUN TOKEN D'ÉCHELLE, et c'est délibéré. Un lien hérite de la taille du texte qui le
 * contient : il doit fonctionner dans une prose de 16 px comme dans une de 14. La loi 3 demande qu'un
 * nœud de texte porte exactement un token d'échelle — c'est le PARAGRAPHE qui le porte, et en poser
 * un ici le mettrait en concurrence avec lui.
 *
 * C'EST CE QUI LE SÉPARE DE `StandaloneLink` : les deux portent le même geste d'états,
 * mais l'autre est un objet de bloc, sans paragraphe dont hériter, donc il pose son échelle
 * lui-même. Ce n'est pas un variant de celui-ci pour cette raison exactement — ce qui change n'est
 * pas l'apparence, c'est QUI DÉCLARE L'ÉCHELLE, et un composant à deux contrats sur ce point serait
 * un composant qui mentirait à l'un de ses deux appelants. (il s'en sépare aussi par `brand`, que
 * `StandaloneLink` n'a pas : aucun de ses appelants n'en a eu besoin.)
 *
 * NE PAS ÉCRIRE LE NOM D'UN CRAN D'ÉCHELLE DANS CE FICHIER, pas même en commentaire : l'extracteur de
 * la loi 10 reconnaît un utilitaire par son PRÉFIXE et ne distingue pas le code du commentaire, donc
 * citer un cran ici le ferait exiger au champ `tokens` — d'un composant qui, justement, n'en consomme
 * aucun. C'est la fragilité que `.claude/rules/loi-10-croissance-tokens.md` nomme, rencontrée pour de vrai.
 *
 * LE GESTE — TEXTE NOIR, TRAIT GRIS CLAIR, ET LE TRAIT REJOINT LE TEXTE AU SURVOL. Demande de
 * Florian : « le texte en noir, et le soulignement en gris, mais très clair ». Le cran est le sien,
 * `--neutral-300`, sous un token né pour lui : `--color-link-underline`.
 *
 *   · repos          — texte primaire, trait de 2 px en `--color-link-underline`.
 *   · survol         — le trait passe au primaire et rejoint le texte. Le curseur reste la main
 *                      du système ; avec `brand`, le carré de la marque l'accompagne, en bas à
 *                      droite et un peu sous la main.
 *   · pressé         — retour au gris du trait, écrit EXPLICITEMENT sur `active:` et non laissé à
 *                      l'héritage : sans cette déclaration le survol resterait peint sous le
 *                      pointeur pressé.
 *   · focus-visible  — l'anneau, et le trait au primaire, comme au survol : qui tabule voit le
 *                      même visage que qui survole (Florian, lot E du 2026-10-21, spec
 *                      `docs/specs/2026-10-21-lot-e-clavier-design.md` § 4, catalogue A11Y-06).
 *                      Le pressé ne change pas : `active:` reste déclaré après, et il gagne.
 *                      `:focus-visible` ne se déclenche pas au clic souris sur un lien, donc un
 *                      clic ne laisse pas le trait au primaire. Aucun token neuf, et ni le logo de
 *                      `brand` ni le curseur n'y participent : le clavier n'a pas de pointeur.
 *
 * LE GESTE ÉTAIT L'INVERSE et Florian l'a retourné à l'œil : texte au gris du paragraphe, trait au
 * primaire, et le texte qui rejoignait le trait au survol. Il n'a jamais été commité ; il est écrit
 * ici pour qu'aucune session ne le repropose comme une piste neuve.
 *
 * DEUX COMPTES DE LA LOI 7, ET ILS NE SE PAIENT PAS AU MÊME PRIX.
 *
 *   · LE SURVOL TIENT SANS EXCEPTION. Le trait passe de `--neutral-300` au primaire : 12.07:1 en
 *     light, du même ordre en dark — le gris seul franchit 3:1, et la paire est dans
 *     `scripts/contrast-pairs.json`, une par polarité. Le second signal que la loi exige de tout
 *     changement de gris est le CURSEUR : la flèche cède la place à la main à l'entrée sur le lien.
 *   · LE REPOS DEMANDE UNE EXCEPTION, la cinquième de la loi 7, écrite dans `.claude/rules/loi-07-accessibilite.md`. Le texte
 *     du lien est au primaire et la prose au secondaire : 2.40:1 entre les deux, donc la couleur
 *     seule ne distingue pas le lien et c'est le TRAIT qui l'identifie — or le trait ne vaut que
 *     1.61:1 contre la page (1.56:1 en dark). Le plus clair des crans qui tenait 3:1 était
 *     `--neutral-500`, à 3.29:1 ; il a été présenté chiffré et écarté par Florian, trop foncé pour
 *     un « gris très clair ». La paire contre la surface n'entre PAS dans `contrast-pairs.json`.
 *
 * LES QUATRE GESTES ESSAYÉS RESTENT SANS OBJET, ILS NE SONT PAS RÉOUVERTS. Ils animaient tous le
 * trait, et le trait ne bouge toujours pas. Chacun avait été refusé pour une raison DIFFÉRENTE, et
 * c'est écrit pour qu'aucune session ne les repropose comme des pistes neuves :
 *
 *   1. le trait disparaît d'un coup (version d'origine) — refusé parce qu'il SAUTAIT.
 *   2. le trait épaissit sur place, 1 → 2 px — refusé : aucune DIRECTION, ça ne se lit pas comme
 *      un mouvement.
 *   3. une barre de 2 px balaie par-dessus le trait — refusée : trop épaisse.
 *   4. un filet de 1 px balaie 1,8 px sous le trait, deux filets séparés — refusé aussi.
 *
 * Le 3 avait été refusé « trop épais » sur une barre MOBILE ; le trait PERMANENT de 2 px
 * n'en est pas un retour, c'est une épaisseur de repos demandée en tant que telle.
 *
 * L'ANGLE MORT QUI RESTE : au doigt, `:active` se déclenche
 * SANS `:hover`, donc le pressé est indiscernable du repos — les deux ont le trait gris. Assumé, et
 * mince : au toucher, la navigation suit immédiatement le lever du doigt.
 *
 * LE TRAIT EST UN FOND, PAS UN `text-decoration`, ET IL LE RESTE. Le rendu du fond a été vérifié au
 * navigateur par Florian, à 6× de zoom, sur le `q` de « Vente-unique ». Un fond ignore
 * `text-decoration-skip-ink`, donc il ne s'interrompt pas autour des jambages descendants ; son bas
 * coïncide avec le bas de la boîte de fond, et à 2 px il occupe [2,72 ; 4,72] px sous la ligne de
 * base à 16 px de corps — encore sous les jambages de Geist (2,40 px). Repasser à une décoration
 * RÉINTRODUIRAIT `skip-ink`, donc un trait qui s'interrompt. Le compte est au token.
 *
 * LE TRAIT EST PEINT PAR SON TOKEN, ET NON PLUS EN `currentColor`. Il suivait le texte tant que le
 * texte portait l'état ; c'est désormais le trait qui le porte, et le texte ne bouge plus. Il est
 * dessiné en DÉGRADÉ À DEUX ARRÊTS IDENTIQUES (`from-` / `to-`) plutôt qu'en `linear-gradient` écrit
 * à la main, et c'est ce qui lui permet de S'ANIMER : Tailwind enregistre les arrêts comme des
 * propriétés `<color>`, que `transition-colors` interpole. Une `background-image` écrite en dur
 * basculerait d'un coup.
 *
 * L'ANCRE RESTE À DROITE bien que plus rien ne s'efface. Sur un trait à 100 % de la boîte, la
 * position ne change rien au rendu : la déplacer serait une modification sans raison.
 *
 * LE LOGO QUI ACCOMPAGNE LE CURSEUR — c'est ce qui rend ce composant CLIENT. Il a d'abord REMPLACÉ
 * la main, centré sur le pointeur ; Florian l'a voulu à côté : « en bas à droite mais un peu sous
 * le pointer ». La main reste donc, et le carré suit, décalé de `space-2` à droite et `space-4` sous
 * le point chaud — la main de 24 px s'arrêtant vers 20 px sous lui, son coin bas-droit chevauche
 * le carré de quelques pixels, et le curseur natif se peint TOUJOURS au-dessus de la page.
 *
 * Le précédent est `CursorPill`, et il est repris au mot : suivi direct sans retard, tactile ignoré,
 * entrée instantanée, sortie en fondu sur place. Deux différences :
 *
 *   · PAS DE CALQUE. `CursorPill` pose un `absolute inset-0` sur son parent positionné ; sur un lien
 *     EN LIGNE qui passe à la ligne, ce calque couvrirait le rectangle englobant des deux
 *     fragments, donc du texte nu. Les écouteurs sont posés sur le `<a>` lui-même, qui n'est plus
 *     rendu par un composant serveur et peut donc les porter (loi 11).
 *   · PAS DE `CursorPill` RÉUTILISÉ. Il porte un mot dans une pill, pas une marque ; lui ajouter une
 *     variante logo en ferait deux objets sous un nom.
 *
 * LE LOGO ENTRE D'UN COUP ET SORT EN FONDU SUR PLACE, comme la pill — Florian, lot D du 2026-10-20
 * (spec `docs/specs/2026-10-20-lot-d-home-design.md` § 5, catalogue MOT-08). Il disparaissait d'un
 * coup avec le montage conditionnel ; il est désormais MONTÉ EN PERMANENCE et bascule par
 * `data-state="open" | "closed"`, la mécanique de `CursorPill` : `display` dans la liste des
 * propriétés transitionnées avec `transition-discrete`, durée nulle à l'ouverture, donc le logo est
 * opaque dès le premier instant ; à la sortie, un fondu seul sur `--duration-fast` et `ease-out`,
 * là où il était — `pointerleave` garde la dernière position, il ne suit plus le pointeur pendant
 * qu'il s'efface. Sous `prefers-reduced-motion`, 1 ms (`globals.css`). DEUX NŒUDS : l'extérieur porte
 * la position (`transform`, aucune transition), l'intérieur l'apparition (`opacity` et `display`) ;
 * ne mets jamais `transform` ni `translate` dans la liste transitionnée. Le trait n'est pas touché :
 * les quatre gestes refusés du 2026-08-10 restent refusés.
 *
 * LA MÊME OBLIGATION QUE `CursorPill` : aucun ancêtre transformé. Le logo est en `fixed`.
 *
 * PAS D'ÉTAT `visited`. La loi 4 l'autorise en plus des cinq, et il est écarté : sur trois liens
 * sortants dans un paragraphe de présentation, un gris de visité serait un quatrième niveau à
 * distinguer dans une palette qui en a déjà trois, sans rien apprendre au lecteur.
 *
 * L'ANNEAU DE FOCUS déclare sa largeur et sa couleur ; son décalage vient du plancher
 * `:focus-visible` de `globals.css`. `--color-focus-ring` et non sa variante inverse : la prose est
 * sur la surface de page.
 *
 * L'AFFORDANCE « NOUVEL ONGLET » N'EST PLUS ÉCRITE ICI, depuis le 2026-10-22 (lot H, spec
 * `2026-10-22-lot-h-hygiene-ds-design` § 6) : `target="_blank"`, `rel="noopener"` et la mention
 * « (opens in a new tab) » en `sr-only` — celle-ci au mot et à la position près — vivent dans
 * `lib/new-tab.tsx`, qu'appellent aussi `Button`, `StandaloneLink`, `BrandLink`. Les paragraphes
 * ci-dessus décrivent toujours le comportement ; ce sont `newTabAttributes` et `newTabNotice` qui le
 * tiennent, et une règle de `npm run check` refuse tout `target="_blank"` écrit ailleurs.
 * `refactor` : HTML identique, prouvé.
 *
 * Histoire : `docs/history/text-link.md`.
 */
export function TextLink({ href, children, newTab, brand }: TextLinkProps) {
  /* Un seul état pour la position ET la visibilité, comme `CursorPill` : les deux changent au même
   * événement. Sans `brand`, aucun écouteur n'est posé et cet état ne bouge jamais. */
  const [pointer, setPointer] = useState({ x: 0, y: 0, visible: false });
  const following = brand !== undefined && pointer.visible;

  return (
    <a
      href={href}
      {...newTabAttributes(newTab)}
      onPointerMove={
        brand
          ? (event) => {
              /* Un appui tactile n'a pas de position de survol : le logo apparaîtrait sous le doigt
               * au moment du tap. Le stylet, lui, en a une et n'est pas filtré. */
              if (event.pointerType === "touch") return;
              setPointer({ x: event.clientX, y: event.clientY, visible: true });
            }
          : undefined
      }
      onPointerLeave={
        brand ? () => setPointer((current) => ({ ...current, visible: false })) : undefined
      }
      className={cn(
        "text-text-primary",
        /* LE TRAIT EST UN FOND et non un `text-decoration` : une décoration réintroduirait
         * `skip-ink`, donc un trait qui s'interrompt autour des jambages. Dégradé à deux arrêts
         * identiques pour que sa couleur s'anime (docstring). `box-decoration-clone` est
         * obligatoire : sans lui, un lien qui passe à la ligne perdrait son trait sur le second
         * fragment. */
        "bg-linear-to-r from-[var(--color-link-underline)] to-[var(--color-link-underline)] bg-no-repeat",
        "bg-[position:right_bottom] bg-[size:100%_var(--underline-thickness-link)]",
        "box-decoration-clone",
        /* La liste est EXPLICITE et non un `transition-all` : seules les couleurs s'animent — dont
         * les deux arrêts du dégradé —, donc rien d'autre ne se met à glisser. */
        "transition-colors",
        "duration-[var(--duration-fast)] ease-out",
        "hover:from-[var(--color-text-primary)] hover:to-[var(--color-text-primary)]",
        /* Au clavier, le trait prend le visage du survol : la parité, sans autre geste. Déclaré
         * AVANT `active:` — le pressé garde le dernier mot. */
        "focus-visible:from-[var(--color-text-primary)] focus-visible:to-[var(--color-text-primary)]",
        /* Le pressé REVIENT au gris du trait, et il est écrit plutôt qu'hérité : sans cette ligne,
         * le survol resterait peint sous le pointeur pressé, et le pressé n'existerait pas. */
        "active:from-[var(--color-link-underline)] active:to-[var(--color-link-underline)]",
        "focus-visible:outline-[length:var(--border-thick)] focus-visible:outline-focus-ring",
      )}
    >
      {children}
      {newTabNotice(newTab)}
      {/* Le logo, monté en permanence avec `brand` et basculé par `data-state`, sur la mécanique de
       * `CursorPill` : entrée instantanée, sortie en fondu sur place (docstring). DEUX NŒUDS : le
       * premier porte la POSITION et aucune transition, le second l'APPARITION (`opacity` et
       * `display`, rien d'autre). `aria-hidden` est porteur : le logo vit DANS le lien, et `Logo`
       * l'est déjà, mais l'enveloppe le dit pour elle-même ; il masque le nœud même fermé. Les
       * coordonnées passent par `style` parce que ce sont des DONNÉES — la position de la main — et
       * non des valeurs de design (loi 1, exception « données de contenu »), comme chez
       * `CursorPill`. Le décalage, lui, est une décision de design : il est dans les classes, sur la
       * propriété `translate`, qui se compose avec le `transform` des données. `flex` retire
       * l'interligne sous le dessin du logo. */}
      {brand !== undefined ? (
        <span
          aria-hidden="true"
          style={{ transform: `translate(${pointer.x}px, ${pointer.y}px)` }}
          className="pointer-events-none fixed top-0 left-0 z-[var(--z-overlay)] translate-x-2 translate-y-4"
        >
          <span
            data-state={following ? "open" : "closed"}
            className={cn(
              "hidden data-[state=open]:flex",
              "opacity-0 transition-[opacity,display] transition-discrete",
              "duration-[var(--duration-fast)] ease-out",
              "data-[state=open]:opacity-100 data-[state=open]:duration-0",
            )}
          >
            <Logo brand={brand} />
          </span>
        </span>
      ) : null}
    </a>
  );
}
