import type { MouseEvent } from "react";
import type { IconName } from "@/components/ui/icon";
import { Icon } from "@/components/ui/icon";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import { newTabAttributes, newTabNotice } from "@/lib/new-tab";

interface ButtonBaseProps {
  /**
   * Le mot du bouton, et son NOM ACCESSIBLE — les deux à la fois. Requis, toujours, y compris
   * quand `content` vaut `"icon"` : il ne disparaît pas alors, il passe en `sr-only`. C'est ce qui
   * rend un bouton icône seule sans nom accessible impossible à ÉCRIRE, et pas seulement
   * déconseillé (loi 7).
   */
  label: string;
  /**
   * L'aspect du bouton. `primary` et `secondary` sont PLEINES — décision de Florian, il n'y a pas de
   * variante à contour : dans une palette sans accent coloré, un trait à 1.10:1
   * n'identifierait rien de plus que le libellé (loi 7). `ghost`, ajoutée le 2026-11-11, est
   * TRANSPARENTE au repos — la seule des trois —, grise au survol et un cran plus foncée au clic :
   * décision de Florian du même jour, « utilisable partout, portfolio compris ». Son libellé est au
   * primaire, donc il tient son seuil sur la page et sur ses deux fonds d'état.
   */
  variant?: "primary" | "secondary" | "ghost";
  /**
   * LA SUITE DU NOM ACCESSIBLE, lue après `label` et jamais affichée : « Back » + « to all projects »
   * se lit « Back to all projects » (lot J du 2026-10-28, spec `2026-10-28-lot-j-petits-restes-design`
   * § 3.2, A11Y-13). Facultative. C'est un SUFFIXE et non un nom de remplacement, pour deux raisons :
   * le mot affiché reste le début du nom, ce que WCAG 2.5.3 (Label in Name) exige, et le texte
   * s'ajoute au contenu au lieu de le recouvrir, donc la mention « nouvel onglet » qui suit survit.
   * Elle est écrite en `sr-only`, comme cette mention, et reçoit son espace de tête dans l'expression.
   */
  assistiveSuffix?: string;
  /**
   * La hauteur du bouton. `default` : 36 px, `--size-button-height`. `large` (2026-11-12) : 46 px,
   * `--size-button-height-large` — la hauteur de `CodeBlock` (le bouton de copie de 36 px, son `p-1` et son
   * filet), pour poser un bouton et une commande côte à côte sans écart. Les trois variantes, les états et les
   * formes sont les mêmes ; à 46 px la cible de 44 px est native, sans calque.
   */
  size?: "default" | "large";
}

/**
 * Ce que le bouton montre — LE LIBELLÉ OU LE GLYPHE, JAMAIS LES DEUX, À UNE EXCEPTION.
 * Décision de Florian, resserrée : la première version rendait le glyphe à droite du libellé, et
 * les deux ensemble ont été retirés. `icon` est donc `never` sur la forme à libellé — un couple
 * `label` + `icon` sans `content` ne compile pas, il n'est pas seulement ignoré au rendu.
 *
 * L'EXCEPTION, `"icon-label"` : Florian valide le glyphe AVANT le libellé pour le bouton retour
 * des pages projet — « flèche avant le libellé validée » (spec `2026-10-12-pages-projet-design`
 * § 3.2). Ce qu'il avait retiré, c'était le glyphe APRÈS le libellé, et CETTE FORME RESTE FERMÉE :
 * le glyphe d'`icon-label` précède toujours le mot, à 8 px (`gap-2`), et il n'existe aucun moyen de
 * le poser derrière. Ne pas rouvrir la décision d'origine en ajoutant un `iconPosition`. Le bouton
 * retour n'en est plus le seul appelant : les deux boutons « Ask » des pages projet — le logo de
 * l'IA devant le libellé — s'en servent depuis le 2026-10-17 (spec
 * `2026-10-16-demander-a-une-ia-design` § 2), et `ShareButton` avec eux le même jour, le glyphe
 * `share` devant « Share » (§ 8 du même spec).
 *
 * `hideLabel` avait été proposé au cadrage et retiré : la loi 11 écrit « jamais un booléen par
 * variante », et la raison qu'elle invoque (les combinaisons illégales de deux booléens) ne
 * s'applique pas à un booléen seul — mais une loi qu'on interprète à la marge cesse d'être
 * appliquée par le compilateur. `display` a été retiré ensuite : c'est l'homonyme d'une propriété
 * CSS, et sa valeur `"label"` faisait écho à la prop `label` juste à côté.
 *
 * CE QUE LA MACHINE NE VERRA PAS : `optionsRule` de `npm run check` cherche une union de deux
 * littéraux ou plus SUR UNE SEULE LIGNE. Il ne verra donc ni `content?: "label"`, ni
 * `content: "icon"`, ni `content: "icon-label"`, et ne confrontera pas cette prop au manifeste — c'est
 * la dégradation « au mieux » que la loi 11 assume déjà. Elle ne produit aucun faux positif : la
 * règle ne se déclenche pas du tout. `variant`, écrit en union sur une ligne, reste vérifié.
 */
type ButtonContentProps =
  | { content?: "label"; icon?: never; forceTooltip?: never; tooltip?: never }
  | {
      content: "icon";
      icon: IconName;
      /**
       * Ouvre la bulle de la forme icône seule sans survol ni focus : le `forceVisible` de
       * `Tooltip`, relayé. Écrite pour la confirmation « Copied! » de `CopyButton` et de
       * `CopyEmailButton`, que le tactile ne voyait pas — c'est ce qui leur évite d'envelopper le
       * bouton eux-mêmes, donc d'afficher deux bulles (lot 1, 2026-11-11). Ne ferme jamais.
       */
      forceTooltip?: boolean;
      /**
       * La bulle automatique de la forme icône seule. `auto` (défaut) : `Tooltip` enveloppe le bouton, le `label`
       * pour texte. `none` (2026-11-12) : pas de bulle — le nom accessible reste porté par `label`, en `sr-only`.
       * Pour les contrôles des couches (précédent, suivant, fermer), dont le sens se lit sans bulle.
       */
      tooltip?: "auto" | "none";
    }
  | { content: "icon-label"; icon: IconName; forceTooltip?: never; tooltip?: never };

/**
 * La balise rendue, inférée depuis `href` — et les deux exclusions que ce choix impose.
 *
 * `disabled` avec `href` est refusé À LA COMPILATION : HTML n'a pas de `<a>` désactivé, et la
 * loi 11 dit qu'un lien désactivé se rendrait avec `aria-disabled` et sans `href` — un détour dont
 * aucun usage du portfolio n'a besoin. `newTab` est réservé à la forme lien, où il a un sens.
 *
 * `onClick` EST PERMIS SUR LES DEUX FORMES. Sur la forme bouton il est
 * `() => void`. Sur la forme lien il reçoit l'ÉVÉNEMENT, pour que l'appelant puisse
 * l'annuler : c'est le retour intelligent des pages projet, un `<a href>` dont on intercepte le clic
 * pour appeler `history.back()` quand on vient de la home (spec `2026-10-12-pages-projet-design`
 * § 3.2). Sans l'événement, impossible d'appeler `preventDefault()`, et le lien suivrait son `href`
 * en plus du rappel.
 */
type ButtonElementProps =
  | {
      href: string;
      newTab?: boolean;
      disabled?: never;
      expanded?: never;
      onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
    }
  | {
      href?: never;
      newTab?: never;
      disabled?: boolean;
      /**
       * L'ÉTAT FONCTIONNEL `expanded` DE LA LOI 11 : le bouton commande une couche qui s'ouvre et se
       * ferme (la liste de la pastille de `TableOfContents`, lot C du 2026-10-20), et l'assistance
       * doit savoir laquelle des deux. Fourni, il se rend en `aria-expanded` ; absent, l'attribut
       * n'est pas rendu : un bouton qui n'ouvre rien ne dit rien. Jamais sur la forme lien, qui
       * navigue.
       */
      expanded?: boolean;
      onClick?: () => void;
    };

type ButtonProps = ButtonBaseProps & ButtonContentProps & ButtonElementProps;

/**
 * LE GLYPHE DE `Button`, ET LE SEUL ENDROIT OÙ UN GLYPHE NAÎT SUR LE RESSORT. `key={name}` remonte
 * le nœud à chaque changement de glyphe : sans elle, React réutiliserait le même nœud et
 * `@starting-style` n'aurait aucun nœud neuf à jouer. L'entrée n'est posée QUE sur `check`, dans un
 * `<span>` à elle, parce que `Icon` n'accepte pas de classe : `--scale-glyph-enter` → identité, sur
 * `--ease-spring-pop` en `--duration-base`, la forme de la bulle de `Tooltip`. Le retour vers
 * l'enveloppe ou le maillon est instantané : ce glyphe-là n'a ni `starting:` ni transition.
 *
 * C'EST L'OPTION A du 2026-10-20, ET ELLE TIENT À UNE CONDITION : aucun bouton ne NAÎT avec un
 * check. Un `starting:` joue au montage du nœud, pas seulement au changement — c'est la raison pour
 * laquelle le lot 2 des micro-animations (2026-10-07) n'a jamais été livré : le glyphe de chaque
 * bouton icône aurait pop à chaque chargement de page. Seuls `CopyEmailButton` et `ShareButton` posent
 * `check`, et tous deux APRÈS un clic. Un bouton qui arrive avec un `check` joue le pop au
 * chargement : décision de Florian (ordre 4 de `CLAUDE.md`), pas un réglage d'ici. Sous
 * `prefers-reduced-motion`, `globals.css` ramène l'échelle de départ à 1 : le glyphe change d'un
 * coup. Spec : `docs/specs/2026-10-20-lot-b-signature-design.md` § 6.
 */
function Glyph({ name }: { name: IconName }) {
  if (name !== "check") return <Icon key={name} name={name} />;

  return (
    <span
      key={name}
      className={cn(
        "inline-flex shrink-0 transition-[scale] duration-[var(--duration-base)] ease-spring-pop",
        "starting:scale-[var(--scale-glyph-enter)]",
      )}
    >
      <Icon name={name} />
    </span>
  );
}

/**
 * Button — le contrôle d'action du système. Cadré avec Florian, SANS maquette. Spec :
 * `docs/specs/2026-08-10-button-design.md`, dont le § 12 porte la révision et le § 14 le
 * resserrement des fonds du secondaire.
 *
 * PREMIER POLYMORPHE PAR INFÉRENCE du système. `href` fourni rend un `<a>`, absent un
 * `<button type="button">`. C'est la forme que la loi 11 PRÉFÈRE aux deux qu'elle autorise — « la
 * différence de sens est portée par la donnée elle-même, rien à documenter en plus ».
 *
 * PROPS ÉNUMÉRÉES, PAS HÉRITÉES. La loi 11 réserve l'extension des props natives à un composant
 * qui n'enveloppe QU'UN SEUL élément ; celui-ci en enveloppe deux selon `href`. Le coût est réel —
 * ni `aria-*`, ni `data-*`, ni `ref` gratuits — et il est assumé : aucun appelant n'en a besoin
 * aujourd'hui, et la loi 10 dit de ne pas légiférer au-delà du besoin.
 *
 * COMPOSANT SERVEUR ALORS QU'IL ACCEPTE UN GESTIONNAIRE, et c'est exactement ce que la loi 11
 * décrit : « accepter un gestionnaire d'événement et le transmettre à un élément natif ne justifie
 * pas la directive ». Ce fichier rejoint le graphe client dès qu'un composant client l'importe, et
 * `onClick` y est une fonction ordinaire. C'est l'appelant du « copy email » qui portera
 * `"use client"` — il en a de toute façon besoin pour l'API presse-papiers. Ici le rappel est
 * fabriqué côté client et franchit la frontière dans le bon sens.
 *
 * CINQ POINTS SUR LE SQUELETTE DE CLASSES, à relire avant toute retouche :
 *
 *   1. LA CIBLE FAIT 44, LE DESSIN 36. Un `::after` transparent, en absolu, tiré de 4 px
 *      (`--size-button-target-inset`, qui vaut (44 − 36) / 2, signe compris) — verticalement sur les
 *      deux formes, et HORIZONTALEMENT AUSSI sur la forme icône seule, où il porte en plus
 *      `--size-touch-target` en largeur. C'est la loi 5 qui l'impose : 44 × 44 pour un contrôle
 *      icône seule, et 36 ne suffit pas. Le calque ne porte PAS `pointer-events-none`, sans quoi il
 *      n'agrandirait rien, et il ne masque pas l'anneau de focus, qui est un `outline` — les
 *      outlines sont peints par-dessus tout le contenu de leur contexte d'empilement.
 *
 *      SA CONTRAINTE POUR L'APPELANT EST TRIVIALE, contrairement à la version de 32 px : 4 px de
 *      débord de chaque côté, donc `space-2` — le plus petit pas de layout — suffit à empêcher deux
 *      calques voisins de se recouvrir (loi 5). À 32 px il fallait 6 px, donc `space-4`, ce qui
 *      interdisait le pas de 8. À 44 px, la cible était native et ce
 *      calque n'existait pas : ne pas redescendre la hauteur sans le faire revenir.
 *   2. LA HAUTEUR VIENT D'UN TOKEN, PAS D'UN `py-*`, alors qu'elle est construite par la loi 2
 *      (20 px d'interligne + 8 + 8). C'est la forme ICÔNE SEULE qui l'impose : un `p-2` autour d'un
 *      glyphe de 24 px donnerait un carré de 40 et non de 36, et les deux formes du même composant
 *      cesseraient d'avoir la même hauteur. Le token les tient égales.
 *   3. `self-start` PARCE QUE LE PARENT EST SOUVENT UNE COLONNE FLEX. Sans lui, l'étirement par
 *      défaut d'un item de colonne donnerait au bouton toute la largeur reçue, et il cesserait de
 *      hug son contenu (loi 8). C'est le contournement de `Tab`, à ceci près que lui le pose sur
 *      sa piste et non sur sa racine — ici la racine EST l'élément interactif.
 *   4. AUCUN `cursor-pointer`, ET AUCUN `cursor-not-allowed`. `@layer base` de `globals.css` pose
 *      la main sur tout ce qui est cliquable et l'enlève à tout ce qui porte `:disabled` — le
 *      curseur est une décision de SITE. Un bouton désactivé retombe donc sur
 *      la flèche par héritage, et `not-allowed` n'existe pas dans le système.
 *   5. LE DÉSACTIVÉ FANE, IL NE REPEINT PLUS : il posait un
 *      fond et un texte à lui, qui étaient exactement ceux du secondaire au repos — Florian a pris
 *      l'un pour l'autre sur la vitrine, à juste titre. Une opacité s'applique à l'élément ENTIER,
 *      donc chaque variante garde sa POLARITÉ en perdant sa force : le primaire désactivé reste
 *      sombre, le secondaire reste clair, et aucun des deux ne peut plus être lu comme l'autre
 *      variante. C'est aussi ce qui le fait tenir sans conflit de cascade avec `hover:` et
 *      `active:` — une opacité ne concourt avec aucune couleur.
 *
 * LE LIBELLÉ EST EN PIXELIFY SANS. Le bouton rejoint donc le registre de `Tab` et de la pill de
 * curseur, et quitte celui du titre de la carte.
 * C'est la seule famille écrite par ce composant : la métrique de base du document est posée une
 * fois pour toutes par `globals.css`.
 *
 * LE GESTE EST UNE TRANSITION DE COULEUR, trois crans par variante, un par état — et les deux
 * variantes vont VERS LE MILIEU DE LA RAMPE, chacune depuis son extrémité : le primaire
 * s'éclaircit, le secondaire s'assombrit. L'`active` va plus loin que le survol au lieu de revenir
 * au repos, contrairement à `Portrait` : sur un fond seul, un retour au repos serait indistinguable
 * du non survolé pointeur immobile. La transition est neutralisée sous `prefers-reduced-motion`, où
 * `globals.css` ramène les durées du système à 1 ms.
 *
 * LES QUATRE CRANS D'ÉTAT ONT ÉTÉ ÉCARTÉS D'UN CRAN DE PLUS, Florian ne voyant aucun survol à
 * l'écran : 1.16:1 entre le repos et le survol du primaire, ce que la valeur calculée disait déjà
 * et que l'angle mort n° 11 de `.claude/rules/loi-07-accessibilite.md` nommait. Le survol du primaire vaut 1.56:1.
 *
 * LE SECONDAIRE, LUI, EST REPARTI EN SENS INVERSE — `50 → 100 → 200` au lieu de
 * `100 → 300 → 400`, sur demande explicite de Florian, calcul présenté avant l'application. Son
 * survol ne vaut plus que 1.06:1 contre son repos, donc MOINS que l'écart jugé invisible :
 * c'est une décision assumée, pas une régression à rattraper, et elle est écrite au § 14 de la
 * spec. Les deux variantes restent sous l'exception de la loi 7 — ce qui porte le
 * sens, libellé ou glyphe, ne descend jamais sous 8.11:1 sur les six fonds, et les six paires sont
 * dans `scripts/contrast-pairs.json`, donc la condition est calculée et non promise. Ne pas
 * rapprocher les fonds DU PRIMAIRE : lui n'a rien qui l'y autorise.
 *
 * L'ANNEAU DE FOCUS déclare ici sa LARGEUR et sa COULEUR ; son DÉCALAGE vient du plancher
 * `:focus-visible` de `globals.css`, posé une fois pour tout le système — c'est le partage de
 * `Tab`, et non celui de `ThemeSelector`, qui doit tout réécrire parce que son élément focusé est
 * une radio `sr-only`. `--color-focus-ring` et non sa variante inverse : l'anneau est HORS du
 * bouton, sur la surface de page, où il vaut 19.44:1 — y compris autour du primaire noir.
 *
 * LE PRESSÉ S'ENFONCE (lot J du 2026-10-28, spec `2026-10-28-lot-j-petits-restes-design` § 3.4, A11Y-07) :
 * `active:scale-[var(--scale-press)]` sur le bouton entier — pastille, glyphe et libellé ensemble —, en
 * `--duration-fast` sur `--ease-out`, qui revient à 1 au relâchement. C'est le retour que le halo système
 * donnait au toucher, retiré des boutons par `globals.css`. La transition de couleur de la ligne
 * au-dessus garde EXACTEMENT ses propriétés — la liste de `transition-colors`, écrite en clair — et
 * gagne `scale` : sans cela, remplacer l'utilitaire aurait retiré la transition de l'anneau. Loi 6 :
 * passager, lié au geste, revient à l'identité ; sous `prefers-reduced-motion`, `--scale-press` vaut 1
 * et le fond de pressé reste. Le calque de pointage de 44 px est un pseudo-élément, il suit l'échelle.
 *
 * L'AFFORDANCE « NOUVEL ONGLET » N'EST PLUS ÉCRITE ICI, depuis le 2026-10-22 (lot H, spec
 * `2026-10-22-lot-h-hygiene-ds-design` § 6) : `target="_blank"`, `rel="noopener"` et la mention
 * « (opens in a new tab) » en `sr-only` — celle-ci au mot et à la position près — vivent dans
 * `lib/new-tab.tsx`, qu'appellent aussi `TextLink`, `StandaloneLink`, `BrandLink`. Les paragraphes
 * ci-dessus décrivent toujours le comportement ; ce sont `newTabAttributes` et `newTabNotice` qui le
 * tiennent, et une règle de `npm run check` refuse tout `target="_blank"` écrit ailleurs.
 * `refactor` : HTML identique, prouvé.
 *
 * LA VARIANTE `ghost` ET LA BULLE DE LA FORME ICÔNE SEULE sont du 2026-11-11, décisions de Florian
 * (spec `docs/specs/2026-11-11-lot-1-petits-controles-design.md` § 1 et § 2.1) : « un IconButton ?
 * non : c'est `Button` en `content="icon"`, qui gagne le vrai `Tooltip` du système ». Le composant
 * reste SERVEUR : il importe `Tooltip`, client, comme n'importe quel serveur importe un client.
 * `ghost` n'a pas de fond au repos : le contrôle s'identifie par son contenu (condition 2 de
 * l'exception « changement de fond » de la loi 7).
 *
 * DEUX AJOUTS DU 2026-11-12 (`extend`, retours de Florian sur neume.dev). `tooltip` (`"auto"` par défaut, ou
 * `"none"`, forme icône seule seulement) retire la bulle automatique : les boutons Précédent, Suivant et Fermer des
 * couches n'en ont pas, décision de Florian — leur sens se lit sans bulle, et une bulle de plus dans une couche était
 * une couche de bruit. Le nom accessible reste porté par `label`, en `sr-only` : rien ne change pour l'assistance.
 * `size` (`"default"`, ou `"large"`) donne une hauteur de 46 px (`--size-button-height-large`), celle de
 * `CodeBlock` — 36 px de bouton de copie, `p-1` de chaque côté, filet de 1 px de chaque côté, mesuré dans le
 * navigateur — pour que « Star on GitHub » et la commande npm se posent côte à côte sans écart. La cible de 44 px
 * est alors native : le calque de pointage prend la boîte et ne la déborde plus.
 *
 * Histoire : `docs/history/button.md`.
 */
export function Button({
  label,
  variant = "primary",
  assistiveSuffix,
  size = "default",
  content = "label",
  icon,
  forceTooltip,
  tooltip = "auto",
  href,
  newTab,
  disabled,
  expanded,
  onClick,
}: ButtonProps) {
  const classes = cn(
    "relative inline-flex items-center justify-center self-start rounded-full",
    "font-pixel text-body-sm font-medium",
    "after:absolute after:content-['']",
    /* `large` : 46 px, la cible de 44 est native, le calque prend la boîte (`inset-0`) au lieu de la déborder. */
    size === "large" ? "after:inset-0" : "after:inset-y-[var(--size-button-target-inset)]",
    content === "icon"
      ? [
          size === "large"
            ? "size-[var(--size-button-height-large)]"
            : [
                "size-[var(--size-button-height)]",
                "after:left-[var(--size-button-target-inset)] after:w-[var(--size-touch-target)]",
              ],
        ]
      : [
          size === "large"
            ? "h-[var(--size-button-height-large)] px-4"
            : "h-[var(--size-button-height)] px-4",
          size === "large" ? undefined : "after:inset-x-0",
          content === "icon-label" && "gap-2",
        ],
    "transition-[color,background-color,border-color,outline-color,text-decoration-color,fill,stroke,scale] duration-[var(--duration-fast)] ease-out",
    "not-disabled:active:scale-[var(--scale-press)]",
    variant === "primary" && [
      "bg-button-surface-primary text-text-inverse",
      "not-disabled:hover:bg-button-surface-primary-hover not-disabled:active:bg-button-surface-primary-active",
    ],
    variant === "secondary" && [
      "bg-button-surface-secondary text-text-primary",
      "not-disabled:hover:bg-button-surface-secondary-hover not-disabled:active:bg-button-surface-secondary-active",
    ],
    variant === "ghost" && [
      "text-text-primary",
      "not-disabled:hover:bg-button-surface-ghost-hover not-disabled:active:bg-button-surface-ghost-active",
    ],
    "focus-visible:outline-[length:var(--border-thick)] focus-visible:outline-focus-ring",
    "disabled:opacity-[var(--opacity-disabled)]",
  );

  /* Le libellé passe en `sr-only` sur la forme icône seule — il ne disparaît jamais du DOM. En
   * `icon-label`, le glyphe passe AVANT le libellé ; en icône seule, il reste après le libellé
   * `sr-only`, ce qui ne change rien à l'œil.
   *
   * LA MENTION DU NOUVEL ONGLET EST UN NŒUD À PART, et pas une chaîne concaténée au libellé : elle
   * n'est jamais visible, même quand le libellé l'est. Un nouvel onglet non annoncé désoriente qui
   * navigue au lecteur d'écran — c'est le seul reproche sérieux qu'on puisse faire à
   * `target="_blank"`. L'espace de tête est écrit dans l'expression et non dans le JSX, où il
   * serait retiré à la compilation. */
  const glyph = icon ? <Glyph name={icon} /> : null;
  const children = (
    <>
      {content === "icon-label" ? glyph : null}
      <span className={content === "icon" ? "sr-only" : undefined}>{label}</span>
      {assistiveSuffix ? <span className="sr-only">{` ${assistiveSuffix}`}</span> : null}
      {newTabNotice(newTab)}
      {content === "icon" ? glyph : null}
    </>
  );

  /* `rel="noopener"` et NON `noreferrer` : les deux ferment la faille du contexte d'ouverture,
   * mais `noreferrer` supprime en plus l'en-tête Referer — or envoyer du trafic référencé vers un
   * site qu'on a livré est précisément l'intérêt du lien. */
  const control =
    href !== undefined ? (
      <a href={href} {...newTabAttributes(newTab)} onClick={onClick} className={classes}>
        {children}
      </a>
    ) : (
      <button
        type="button"
        disabled={disabled}
        aria-expanded={expanded}
        onClick={onClick}
        className={classes}
      >
        {children}
      </button>
    );

  /* LA FORME ICÔNE SEULE PORTE SA BULLE, depuis le 2026-11-11 (lot 1 du site de Neume, spec
   * `2026-11-11-lot-1-petits-controles-design.md` § 2.1) : `Tooltip` enveloppe le contrôle avec le
   * `label` pour texte, le même mot que son nom accessible — c'est exactement l'emploi que la
   * docstring de `Tooltip` prévoit. Les appelants qui enveloppaient déjà un bouton icône seule
   * ont retiré leur enveloppe dans le même commit ; `CopyButton` et `CopyEmailButton` gardent leur
   * bulle forcée par `forceTooltip`, sans second `Tooltip`.
   *
   * DÉSACTIVÉ, PAS DE BULLE (Florian, 2026-11-11) : la bulle est un état de survol, et un contrôle
   * désactivé n'en a plus — `Tooltip` n'enveloppe donc pas un bouton `disabled`. Le nom accessible
   * reste porté par le libellé `sr-only`. */
  return content === "icon" && !disabled && tooltip === "auto" ? (
    <Tooltip label={label} forceVisible={forceTooltip}>
      {control}
    </Tooltip>
  ) : (
    control
  );
}
