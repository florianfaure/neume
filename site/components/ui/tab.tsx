"use client";

import { useEffect, useEffectEvent, useId, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Reveal } from "@/components/ui/reveal";
import { SegmentedTrack } from "@/components/ui/segmented-track";

interface TabProps {
  /**
   * Les onglets, dans l'ordre d'affichage. `value` est le SLUG : c'est lui qui voyage dans le
   * hash de l'URL quand `Tab` n'est pas contrôlé, donc il tient lieu d'identifiant stable. `label`
   * est le mot rendu dans la pill, `panel` le contenu que l'onglet commute.
   */
  items: { value: string; label: string; panel: ReactNode }[];
  /**
   * Onglet ouvert au premier rendu, en NON CONTRÔLÉ — le premier de `items` à défaut. Le hash de
   * l'URL l'emporte sur lui s'il désigne un onglet connu. Ignoré si `value` est passé : les deux
   * ensemble sont une erreur d'appel (loi 11).
   */
  defaultValue?: string;
  /**
   * L'onglet ouvert, en CONTRÔLÉ : l'état appartient à l'appelant, et `Tab` ne lit ni n'écrit le
   * hash. À passer avec `onValueChange`, sans quoi la rangée ne bougerait plus.
   */
  value?: string;
  /**
   * Appelé avec le slug de l'onglet que l'on vient d'activer — clic, Entrée ou Espace —, dans les
   * deux modes, et, en non contrôlé, au clic d'un lien vers l'onglet (« UN LIEN VERS UN ONGLET »).
   * Jamais aux flèches, qui ne déplacent que le focus.
   */
  onValueChange?: (value: string) => void;
  /**
   * La rangée au-dessus des panneaux (`"top"`, la home) ou SOUS eux, dans sa barre (`"bottom"`,
   * le cadre d'`Exhibit`). Voir « LA RANGÉE SE POSE » dans la docstring.
   */
  placement?: "top" | "bottom";
  /**
   * Nom accessible de la rangée. Requis, et sans défaut : une page peut porter plusieurs
   * rangées d'onglets, et une rangée anonyme ne se distingue d'aucune autre à l'assistance.
   */
  label: string;
}

/**
 * Tab — une rangée d'onglets en pill, et les panneaux qu'elle commute. D'après les maquettes
 * Figma `tabItem` (node `87:686`) et `tab` (node `87:713`), cadrées avec Florian.
 *
 * UN SEUL COMPOSANT. `TabItem`, plus bas, est une fonction INTERNE non exportée : avec une API
 * en `items[]`, l'item n'est jamais adressable par l'appelant, donc c'est du JSX interne au
 * fichier et non un composant au sens de la loi 11 — il n'a ni fichier, ni entrée de manifeste,
 * ni trois preuves à fournir. Le sortir en `tab-item.tsx` serait inventer une API que personne
 * n'appelle.
 *
 * LA RANGÉE REND AUSSI LES PANNEAUX, et c'est ce qui rend le câblage ARIA possible : les
 * identifiants viennent de `useId()`, donc l'onglet peut pointer son panneau (`aria-controls`)
 * et le panneau son onglet (`aria-labelledby`) sans que l'appelant ait à fabriquer un seul id.
 * TOUS LES PANNEAUX SONT DANS LE DOM en permanence ; les non sélectionnés portent l'attribut
 * `hidden`. Un rendu conditionnel serait plus court et ferait disparaître du document tout ce
 * qui n'est pas l'onglet ouvert : le contenu de la home page cesserait d'être indexable et
 * introuvable au Ctrl-F du navigateur.
 *
 * LA HAUTEUR DE LA PILL EST UNE DIMENSION DÉCIDÉE, pas un couple de paddings : l'interligne de
 * `--text-body-sm` vaut 20 px, et aucun couple de pas de la loi 2 ne produit 32 (20 + 8 + 8 = 36,
 * 20 + 4 + 4 = 28). Elle vit donc dans un token, `--size-tab-item-height`, justifié au champ
 * `responsive` du manifeste — même traitement que les 80 × 107 px de `Portrait` (loi 8).
 *
 * LA PILL NE PORTE PAS LA SÉLECTION. `--color-segmented-surface-selected` ne vaut que 1.10:1 sur
 * `--color-segmented-track` (1.47:1 en dark) : elle l'ACCOMPAGNE ; elle n'est d'ailleurs plus
 * peinte par l'onglet : c'est la pastille de `SegmentedTrack`, qui glisse d'un onglet à l'autre
 * (voir plus bas). Ce qui la porte est la GRAISSE du libellé, qui passe
 * de `--font-weight-normal` à `--font-weight-medium` — un signal non chromatique, exactement ce
 * que la loi 7 demande. C'est ce qui permet à `Tab` d'honorer la loi 7 SANS l'exception écrite
 * dont `Portrait` a besoin, et cette propriété survit à `prefers-reduced-motion`, qui ne touche pas
 * une graisse. Ne pas la perdre en route : retirer la graisse ferait retomber le composant sous une
 * exception qu'il n'a pas.
 *
 * LE CLAVIER SUIT LE PATTERN ARIA APG, EN ACTIVATION MANUELLE — décision de Florian.
 * Roving tabindex : l'onglet sélectionné est le seul à porter `tabIndex={0}`, les autres −1,
 * si bien que la touche Tab entre sur le sélectionné puis ressort vers le CONTENU du panneau
 * visible — et non vers le panneau lui-même, qui n'est plus focusable (la
 * raison est au long au-dessus du `.map()` des panneaux) — au lieu de traverser tous les onglets. Les flèches gauche et droite déplacent le FOCUS en boucle sans
 * activer, Home et End vont au premier et au dernier, Entrée et Espace activent — et ces deux
 * dernières n'ont aucun gestionnaire ici : un `<button>` les traduit nativement en clic, et un
 * gestionnaire de plus les déclencherait deux fois.
 *
 * DEUX MODES, ET SEUL LE NON CONTRÔLÉ TOUCHE À L'ADRESSE. Non contrôlé — `defaultValue`, ou
 * rien —, `Tab` tient l'onglet ouvert lui-même et le slug voyage dans le hash : c'est la home, et
 * le paragraphe suivant. Contrôlé — `value` et `onValueChange`, les noms que la loi 11 imposait
 * d'avance —, l'onglet ouvert APPARTIENT À L'APPELANT, et `Tab` NE LIT NI N'ÉCRIT LE HASH : ni
 * lecture au montage, ni écouteur `hashchange`, ni `replaceState`, ni écoute des liens. Les trois raisons sont celles
 * de la spec `2026-10-16-cadre-a-variantes-design` § 3 : un avant / après au milieu d'un case
 * study n'a rien à faire dans l'URL ; deux rangées sur une page se disputeraient le même hash, que
 * `TableOfContents` laisse déjà à `Tab` en interceptant ses liens ; et l'appelant a besoin de
 * l'onglet ouvert — `Exhibit` y lit qu'un onglet a vraiment changé, pour n'enrichir ses images d'un
 * `Reveal` qu'au premier changement ; jusqu'au 2026-10-17 il y lisait aussi la phrase qu'il posait
 * sous son cadre, avant qu'elle ne passe dans les panneaux. Un seul couple de props donne les trois. `value` l'emporte sur
 * `defaultValue`, et les passer ensemble reste une erreur d'appel. `onValueChange` ne part qu'à
 * l'ACTIVATION — clic, Entrée, Espace —, dans les deux modes ; ni aux flèches, ni au hash édité.
 *
 * EN NON CONTRÔLÉ, L'URL PORTE LE SLUG, et `replaceState` — JAMAIS `pushState`. Avec
 * `pushState`, chaque coup d'onglet empilerait une entrée d'historique et le bouton retour du
 * navigateur deviendrait un parcours arrière des onglets visités au lieu de quitter la page : le
 * geste « revenir d'où je viens » cesserait de marcher après trois clics. La lecture du hash,
 * elle, se fait dans un effet et jamais au premier rendu — le serveur ne connaît pas le hash, qui
 * ne lui est même pas envoyé, donc le lire au rendu ferait diverger le HTML serveur du premier
 * rendu client.
 * L'écouteur `hashchange` couvre l'édition manuelle de l'URL, et il est retiré au démontage.
 *
 * L'ONGLET DU HASH DÈS LE PREMIER PAINT — lot K du 2026-10-28, spec
 * `2026-10-28-lot-k-arrivee-design` § 5 (FIL-02, PERF-05). La lecture ci-dessus reste dans l'effet,
 * et pour la même raison ; mais le haut de la home entre désormais au premier paint, avant le
 * JavaScript, et `/#about` montrait `Work` tant que l'effet n'avait pas tourné — deux secondes sur
 * un téléphone en 3G. Le premier paint est donc juste par le CSS seul, en trois pièces, toutes en
 * non contrôlé :
 *   1. UNE ANCRE PAR PANNEAU : un `<span>` vide, `hidden`, premier enfant du panneau, à l'`id` du
 *      slug. L'adresse `#about` la vise, et elle devient `:target`. Elle n'a pas de boîte, donc le
 *      navigateur n'a rien vers quoi défiler : le comportement « une commutation, pas un saut » de
 *      la home tient. Elle fait aussi marcher le portrait de la home AVANT l'hydratation — le lien
 *      `#about` vise l'ancre, et le CSS ouvre l'onglet.
 *   2. LE PANNEAU : deux règles de `globals.css`, dans `@layer base` parce que le `hidden` du
 *      preflight est un `!important` de cette couche — la raison est écrite à côté d'elles.
 *   3. L'ONGLET : `EARLY_SELECTION`, plus bas, peint l'onglet du panneau visé comme choisi et les
 *      autres comme non choisis, par le rang.
 * Le tout vit sous `[data-tab-hash]:not([data-tab-hash-synced])` : la racine porte la marque, et le
 * second effet ci-dessous pose `data-tab-hash-synced` une fois l'état rejoint. À partir de là
 * `:target` ne commande plus rien — `replaceState` ne le déplace pas, et c'est voulu. Ce que le CSS
 * ne fait pas : l'`aria-selected` et le `hidden` lus par l'assistance restent ceux du serveur
 * jusqu'à l'effet. Un `id` de slug impose une seule rangée non contrôlée par page, ce qui est le
 * cas — deux se disputeraient déjà le hash.
 *
 * UN LIEN VERS UN ONGLET LE CHOISIT COMME UN CLIC — le second critère nommé, spec
 * `2026-10-20-lot-d-home-design` § 3 (HOME-01). En non contrôlé, `Tab` écoute aussi les clics du
 * DOCUMENT : un lien dont le `href` est exactement `#<slug>` d'un de ses onglets — le portrait de
 * la home, `#about` — est intercepté (`preventDefault`) et fait ce que fait un clic d'onglet :
 * `replaceState` du hash, sélection, `onValueChange`. Trois choses en plus :
 *   1. LE SIGNAL DE GESTE À `SegmentedTrack` : `Tab` pose `data-gesture` sur la piste, et la
 *      pastille GLISSE au lieu de sauter. C'est un signal NOMMÉ, jamais une lecture du hash par la
 *      piste : le hash édité à la main reste un saut (`hashchange`, sans signal), et un `#about`
 *      collé dans l'URL au chargement passe par `applyHash` seul — ni glissement, ni défilement.
 *   2. LA RANGÉE VIENT EN HAUT DE LA FENÊTRE SI ELLE N'Y EST PAS ENTIÈRE — sous le pli, en tout ou
 *      en partie, ou au-dessus du bord pour un lien posé plus bas qu'elle —, à une gouttière du
 *      bord : `scroll-margin-top` à `--layout-gutter`, lue par le script. Sur un téléphone,
 *      l'en-tête et l'intro poussent la rangée sous le pli, et sans ce défilement le clic sur le
 *      portrait semblait ne rien faire. Une rangée déjà entière dans la fenêtre ne bouge pas : la
 *      pastille qui glisse montre le geste. `window.scrollTo` et non `scrollIntoView`, qui
 *      honorerait la réserve de `scroll-padding-top` que `globals.css` pose sous `xl` pour le
 *      bouton Back des pages de lecture : la rangée s'arrêterait sous elle. Doux, instantané sous
 *      `prefers-reduced-motion`, la requête lue au clic comme le fait `TableOfContents` — la règle
 *      `scroll-behavior` de `globals.css` ne peut rien contre un `behavior` passé en JavaScript.
 *      La boîte mesurée n'est jamais transformée : en `"top"`, la racine, dont le haut est celui de
 *      la rangée, que `Reveal` décale tant qu'il ne l'a pas révélée ; en `"bottom"`, la barre.
 *   3. LE FOCUS NE BOUGE PAS : il reste sur le lien.
 * Un clic modifié (Cmd, Ctrl, Maj, Alt), un autre bouton que le principal, ou un clic qu'un autre
 * a déjà intercepté (`defaultPrevented`) passent leur chemin. Sans JavaScript, le lien reste une
 * ancre qui marche.
 *
 * LA RANGÉE SE POSE AU-DESSUS DES PANNEAUX, OU SOUS EUX (`placement`). `"top"`, le défaut, est
 * la home : la piste à gauche, 16 px au-dessus des panneaux. `"bottom"` pose la rangée SOUS les
 * panneaux, DANS UNE BARRE : une surface (`--color-surface`), 12 px de padding, la piste centrée,
 * un rayon de 4 px, et 4 px entre les panneaux et elle (spec `2026-10-16-cadre-a-variantes-design`
 * § 3). Entre les deux, `Tab` NE PEINT RIEN : la bande prend la couleur de ce qui est derrière lui
 * — le gris du contour dans `Exhibit`, la page ailleurs.
 *
 * POURQUOI LA BARRE EST DANS `Tab`, ET POURQUOI `placement` SEUL NE SUFFISAIT PAS. Le cadre
 * d'`Exhibit` veut sa scène blanche, une bande de 4 px du gris de son contour, puis une barre
 * blanche où se posent les onglets — des onglets posés sur le gris, c'était l'habillage écarté au
 * cadrage. La barre enveloppe le `tablist`, que `Tab` est seul à rendre : aucun appelant ne peut la
 * poser sans styler `Tab` depuis l'extérieur, ce que la loi 11 ferme. L'extension la plus petite
 * est donc que la valeur `"bottom"` porte la barre, et non une seconde prop : une barre en booléen
 * aurait ouvert une barre AU-DESSUS des panneaux, que personne n'a dessinée — un rendu que le
 * design n'a jamais décidé (loi 11). Les coins EXTÉRIEURS ne sont pas ceux de `Tab` : la barre est
 * à 4 px partout, et c'est le parent qui découpe ses coins du bas à son propre rayon — `Exhibit`
 * les découpe à 8 px, concentriques à son contour. Sur la page nue, la barre se confond avec elle :
 * on ne voit qu'une rangée centrée sous les panneaux.
 *
 * LES DEUX PARAGRAPHES CI-DESSUS DÉCRIVENT `Exhibit` JUSQU'AU 2026-10-17. Ce jour-là, Florian a sorti
 * les onglets du contour (« il y a juste un seul contour gris »), puis les a mis sous la phrase :
 * chaque panneau d'`Exhibit` est désormais sa propre figure — le cadre, puis sa phrase —, et la
 * bande comme la barre sont posées sur la page, où elles se confondent avec elle — le cas « page
 * nue » ci-dessus. `Tab` n'a pas changé pour autant : la valeur `"bottom"` rend la même barre, aux
 * mêmes 4 et 12 px, et c'est elle qui donne 16 px entre la phrase d'`Exhibit` et la piste, sans
 * rien de plus sous elle. Révision : § 9 de la même spec.
 *
 * L'ORDRE DU DOM SUIT L'ÉCRAN (loi 7) : en `"bottom"`, les panneaux précèdent la rangée. La touche
 * Tab entre sur l'onglet ouvert puis sort vers ce qui suit `Tab` ; un focusable de panneau, s'il y
 * en a un, s'atteint AVANT les onglets. Le roving tabindex et les flèches, eux, ne changent pas.
 *
 * EN `"top"`, LA RANGÉE ENTRE PAR `Reveal` — décision de Florian, spec
 * `2026-10-07-apparition-au-defilement-design` § 4.4. Le `tablist` — `SegmentedTrack`,
 * voir plus bas — est enveloppé dans `<Reveal>` PAR `Tab` LUI-MÊME, et non par la page autour de `<Tab>` : envelopper `<Tab>` entier
 * aurait fait subir à chaque carte un double fondu (celui du bloc entier, puis le sien) et un flou
 * sur des milliers de pixels. LES PANNEAUX NE SONT PAS ENVELOPPÉS PAR `Tab` : leurs blocs le sont
 * un à un, par la page, ce qui est ce qui fait rejouer l'entrée au changement d'onglet. La rangée,
 * elle, NE REJOUE PAS à ce changement : elle n'est jamais masquée, donc jamais remise à zéro. Au
 * chargement elle entre en quatrième de la cascade — après les boutons, avant la première carte.
 * DEPUIS LE LOT K (2026-10-28), ELLE ENTRE AU PREMIER PAINT, `timing="load"` : sur la home elle est
 * au-dessus de la flottaison, entre les boutons et la première carte qui entrent eux aussi sans
 * attendre l'hydratation, et une rangée restée à l'opacité 0 entre les deux aurait fait un trou.
 * Son rang de cascade est toujours le quatrième, posé par le script du `<head>` dans l'ordre du
 * document. Conséquence assumée : sur la vitrine, où la rangée est bien sous la flottaison, son
 * entrée joue au chargement, hors de vue, et ne rejoue pas au défilement.
 * En `"bottom"`, la piste n'entre PAS d'elle-même : le cadre d'`Exhibit` entre d'un bloc, par
 * son propre `Reveal`, et une rangée qui y jouerait son entrée s'animerait de son côté
 * (2026-10-16). Ce qui précède vaut jusqu'au 2026-10-18 : depuis, le cadre d'`Exhibit` n'entre plus
 * au défilement, décision de Florian pour les pages de lecture, et la piste reste immobile avec lui.
 *
 * LA PISTE EST `SegmentedTrack` — décision de Florian, spec
 * `2026-10-07-pastille-glissante-design`. `SegmentedTrack` ne reçoit pas
 * l'onglet ouvert : il le LIT sur l'`aria-selected` que ce composant pose déjà. L'état reste ici,
 * dans React et dans le hash — ou chez l'appelant, en contrôlé : la pastille ne fait pas la
 * différence.
 *
 * COMPOSANT CLIENT (`runtime: "client"`), et la directive est justifiée au sens strict de la
 * loi 11 : état propre (l'onglet ouvert, en non contrôlé), effet (le hash), refs (le focus des
 * onglets et la piste), API navigateur (`location`, `history`, `scrollTo`, `matchMedia`). Ce n'est pas un composant qui se
 * contenterait de transmettre un gestionnaire.
 *
 * Histoire : `docs/history/tab.md`.
 */
export function Tab({
  items,
  defaultValue,
  value,
  onValueChange,
  placement = "top",
  label,
}: TabProps) {
  const uid = useId();
  const [own, setOwn] = useState(defaultValue ?? items[0].value);

  /* Contrôlé dès que l'appelant passe `value` : l'onglet ouvert est alors le sien, et `own` ne
   * sert plus à rien. Un composant ne change pas de mode en cours de vie. */
  const controlled = value !== undefined;
  const open = controlled ? value : own;

  /* Les nœuds des onglets, pour déplacer le focus aux flèches. Une ref plutôt qu'un index
   * « focusé » en état : déplacer le focus n'est pas un changement de rendu, et le passer par
   * l'état ferait re-rendre tous les onglets à chaque flèche pour ne rien peindre de neuf. */
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  /* La piste, où poser le geste nommé de `SegmentedTrack`, et la boîte de la rangée, jamais
   * transformée, qu'un lien vers un onglet fait défiler (« UN LIEN VERS UN ONGLET »). */
  const trackNode = useRef<HTMLDivElement>(null);
  const rowNode = useRef<HTMLDivElement>(null);

  /* Les slugs en une chaîne, et non le tableau `items` lui-même, comme dépendance de l'effet :
   * un appelant qui écrit son tableau en littéral en fabrique un nouveau à chaque rendu, donc
   * l'effet se démonterait et se remonterait à chaque rendu du parent. Ce qui compte pour lui
   * est la LISTE DES SLUGS, qui, elle, ne change que si les onglets changent. */
  const slugs = items.map((item) => item.value).join(" ");

  const activate = (next: string) => {
    if (!controlled) {
      setOwn(next);
      window.history.replaceState(null, "", `#${next}`);
    }
    onValueChange?.(next);
  };

  /* La rangée à une gouttière du haut de la fenêtre, si elle n'y est pas entière. En `"top"`, la
   * racine porte le haut de la rangée sans sa translation d'entrée, et la piste sa hauteur. */
  const bringRowIntoView = () => {
    const row = rowNode.current;
    const piste = trackNode.current;
    if (row === null || piste === null) return;

    const top = row.getBoundingClientRect().top;
    const bottom = top + (placement === "top" ? piste.offsetHeight : row.offsetHeight);
    if (top >= 0 && bottom <= window.innerHeight) return;

    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";
    const margin = parseFloat(getComputedStyle(row).scrollMarginTop);
    window.scrollTo({ top: window.scrollY + top - margin, behavior });
  };

  /* UN LIEN VERS UN ONGLET LE CHOISIT COMME UN CLIC (docstring). Un `useEffectEvent` : l'écouteur
   * posé dans l'effet du hash lit toujours les onglets et l'`onValueChange` du dernier rendu. */
  const followLink = useEffectEvent((event: MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const link = event.target instanceof Element ? event.target.closest("a") : null;
    const href = link?.getAttribute("href") ?? "";
    const slug = href.slice(1);
    if (!href.startsWith("#") || !items.some((item) => item.value === slug)) return;

    event.preventDefault();
    trackNode.current?.setAttribute("data-gesture", "");
    activate(slug);
    bringRowIntoView();
  });

  useEffect(() => {
    /* CONTRÔLÉ, LE HASH N'EST PAS À `Tab` : ni lecture, ni écouteur (voir la docstring). */
    if (controlled) return;

    const applyHash = () => {
      const slug = window.location.hash.slice(1);
      if (slug !== "" && slugs.split(" ").includes(slug)) setOwn(slug);
    };

    const onClick = (event: MouseEvent) => followLink(event);

    applyHash();
    window.addEventListener("hashchange", applyHash);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("hashchange", applyHash);
      document.removeEventListener("click", onClick);
    };
  }, [slugs, controlled]);

  /* LE RELAIS DU CSS D'AVANT L'HYDRATATION (« L'ONGLET DU HASH DÈS LE PREMIER PAINT », docstring).
   * Tant que la racine n'a pas `data-tab-hash-synced`, les règles qui lisent `:target` ouvrent le
   * panneau du hash et l'onglet qui le commande. Elles se retirent quand l'état de React dit la
   * même chose — donc APRÈS le rendu que `applyHash` a demandé, et non dans le même effet : levées
   * avant ce rendu, elles laisseraient voir `Work` le temps d'une image. D'où la dépendance à
   * `own` : tant que le hash désigne un onglet que l'état n'a pas encore rejoint, on attend le
   * rendu suivant. Une fois posé, l'attribut ne bouge plus : la suite appartient à React. */
  useEffect(() => {
    if (controlled) return;
    const root = trackNode.current?.closest<HTMLElement>("[data-tab-hash]");
    if (!root || root.dataset.tabHashSynced !== undefined) return;
    const slug = window.location.hash.slice(1);
    if (slug !== own && slugs.split(" ").includes(slug)) return;
    root.dataset.tabHashSynced = "";
  }, [own, slugs, controlled]);

  const moveFocus = (event: KeyboardEvent<HTMLButtonElement>, from: number) => {
    const last = items.length - 1;
    let to: number;

    switch (event.key) {
      case "ArrowRight":
        to = from === last ? 0 : from + 1;
        break;
      case "ArrowLeft":
        to = from === 0 ? last : from - 1;
        break;
      case "Home":
        to = 0;
        break;
      case "End":
        to = last;
        break;
      default:
        return;
    }

    /* Les flèches déplacent le FOCUS et rien d'autre : l'activation reste manuelle. Le
     * `preventDefault` empêche Home et End de faire défiler la page sous les onglets. */
    event.preventDefault();
    buttons.current[to]?.focus();
  };

  /* EN `"top"`, LA RANGÉE ENTRE PAR `Reveal` (décision de Florian, spec § 4.4) : le `Reveal`
   * enveloppe le `tablist` SEUL, jamais les panneaux — voir la docstring de `Tab`. En `"bottom"`,
   * elle n'entre pas d'elle-même : c'est le cadre d'`Exhibit` qui entrait, jusqu'au 2026-10-18 ;
   * depuis, rien n'entre au défilement en lecture.
   *
   * PAS DE `self-start` SUR LE `tablist`. Il servait à
   * empêcher l'étirement par défaut d'un item de colonne flex de donner à la piste toute la
   * largeur reçue. Le parent du `tablist` n'est plus cette colonne mais le `<div>` bloc de
   * `Reveal`, qui, lui, s'étire : la classe n'aurait plus aucun effet. Ce qui fait hugger la
   * piste est désormais son `inline-flex`, dans un bloc (loi 8 : le composant remplit ce
   * qu'on lui donne, la piste à l'intérieur ne s'impose aucune largeur). */
  const track = (
    <SegmentedTrack ref={trackNode} role="tablist" aria-label={label}>
      {items.map((item, index) => (
        <TabItem
          key={item.value}
          id={`${uid}-tab-${item.value}`}
          controls={`${uid}-panel-${item.value}`}
          label={item.label}
          selected={item.value === open}
          nodeRef={(node) => {
            buttons.current[index] = node;
          }}
          onActivate={() => activate(item.value)}
          onNavigate={(event) => moveFocus(event, index)}
        />
      ))}
    </SegmentedTrack>
  );
  const row = placement === "bottom" ? track : <Reveal timing="load">{track}</Reveal>;

  /* Les panneaux, tous montés — c'est ce qui rend le contenu commuté indexable.
   *
   * LE PANNEAU NE PORTE PLUS `tabIndex={0}` — RETIRÉ, SUR CONSTAT DE FLORIAN AU
   * CLAVIER : « le layout tout entier a un focus alors qu'il ne devrait pas y en avoir un ».
   * Il le voyait sur les trois onglets, et ce n'était pas un défaut de peinture mais un ARRÊT
   * DE TABULATION réel — le panneau était focusable, donc la règle `:focus-visible` de la
   * couche `base` de `globals.css` lui posait son anneau, autour du bloc entier.
   *
   * LE COMMENTAIRE QUI JUSTIFIAIT CE `tabIndex` ÉTAIT FAUX SUR LES FAITS, et c'est la seule
   * raison pour laquelle il est parti. Il affirmait que sans lui « la touche Tab sauterait du
   * dernier onglet au premier lien qui suit la rangée, et le contenu commuté deviendrait
   * inatteignable ». Les panneaux masqués portent `hidden` : leur contenu n'est PAS focusable,
   * donc la tabulation passe de l'onglet sélectionné au premier focusable du panneau VISIBLE,
   * jamais à ce qui suit la rangée. Mesuré au clavier sur `/#about` avant et après le retrait :
   * l'onglet `About` était suivi du `<div role=tabpanel>` de 640 × 696 px, puis du lien
   * `Fullphysio` ; il est maintenant suivi directement de `Fullphysio`. Aucun arrêt perdu, un
   * arrêt parasite en moins.
   *
   * CE QUE DIT L'APG, ET C'EST LA CONDITION À SURVEILLER : un `tabpanel` doit porter
   * `tabindex="0"` UNIQUEMENT s'il ne contient AUCUN élément focusable — sinon il est
   * superflu. Les panneaux de la home en contiennent : `Work` ses cartes-liens, `Sides` le lien
   * de chaque carte, `Articles` ses lignes-liens, `About` les marques liées de la section
   * Experience. La condition est donc remplie aujourd'hui. **Le jour où un panneau
   * n'aurait plus rien de focusable** — un panneau de prose seule —, la question se repose
   * pour CE panneau, et elle se repose à Florian : ce composant mappe ses `items` sans savoir
   * ce qu'ils contiennent, il ne peut pas trancher panneau par panneau tout seul.
   *
   * CE JOUR EST VENU AVEC `Exhibit`, ET FLORIAN A TRANCHÉ LE 2026-10-16 : PAS D'ARRÊT. Les
   * panneaux de son avant / après ne portent qu'une image, rien de focusable, et ils n'ont pas de
   * `tabIndex` : la tabulation passe de l'onglet ouvert à ce qui suit le cadre, et l'image se lit à
   * son `alt` en parcourant la page. Le même choix que pour les panneaux de la home, sans anneau.
   *
   * DEPUIS LE 2026-10-20 (lot C, spec `2026-10-20-lot-c-lecture-design` § 5), CHAQUE PANNEAU
   * D'`Exhibit` PORTE UN FOCALISABLE : le `Button` qui ouvre la visionneuse, au coin du cadre. La
   * décision ne change pas — le panneau lui-même n'a toujours pas de `tabIndex` —, mais la phrase
   * ci-dessus (« rien de focusable ») ne décrit plus l'avant / après : la tabulation va de l'onglet
   * ouvert au bouton d'agrandissement de son panneau, puis à ce qui suit le cadre, exactement le cas
   * « un focusable de panneau, s'il y en a un » prévu plus haut.
   *
   * ET SURTOUT : SI L'ANNEAU REVIENT, ON NE LE FAIT PAS TAIRE. Éteindre l'outline sur ce
   * `div` aurait supprimé le symptôme en laissant l'arrêt de tabulation en place — un arrêt
   * invisible, c'est-à-dire pire que celui qu'on voulait retirer. La loi 4 l'interdit et
   * `npm run check` le refuse : la règle est LEXICALE et ne distingue pas le code de la prose,
   * si bien que nommer la classe fautive ici, même pour l'interdire, la fait échouer. Vérifié,
   * sur ce commentaire même. */
  const panels = items.map((item) => (
    <div
      key={item.value}
      id={`${uid}-panel-${item.value}`}
      role="tabpanel"
      aria-labelledby={`${uid}-tab-${item.value}`}
      hidden={item.value !== open}
    >
      {controlled ? null : <span id={item.value} data-tab-anchor="" hidden />}
      {item.panel}
    </div>
  ));

  /* `"bottom"` : les panneaux, puis la rangée dans sa barre — voir « LA RANGÉE SE POSE » dans la
   * docstring. `gap-1` est la bande de 4 px, que `Tab` ne peint pas. */
  if (placement === "bottom") {
    return (
      <div data-tab-hash={controlled ? undefined : ""} className="flex flex-col gap-1">
        {panels}
        <div
          ref={rowNode}
          className="flex scroll-mt-[var(--layout-gutter)] justify-center rounded-md bg-surface p-3"
        >
          {row}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={rowNode}
      data-tab-hash={controlled ? undefined : ""}
      className="flex scroll-mt-[var(--layout-gutter)] flex-col gap-4"
    >
      {row}
      {panels}
    </div>
  );
}

/**
 * LA SÉLECTION D'AVANT L'HYDRATATION, EN CSS (« L'ONGLET DU HASH DÈS LE PREMIER PAINT », docstring de
 * `Tab`). Quand un panneau de la racine porte l'ancre visée par l'adresse (`:target`) et que React
 * n'a pas encore pris le relais (`data-tab-hash-synced`), chaque onglet de la rangée prend
 * l'apparence d'un onglet non choisi — la première classe — et celui dont le RANG est celui du
 * panneau visé prend l'apparence de l'onglet choisi : les quatre suivantes, une par rang, plus
 * spécifiques. Les classes sont écrites par rang et non par slug parce que Tailwind ne génère que
 * des classes écrites en toutes lettres, et qu'un sélecteur CSS ne sait pas comparer deux valeurs
 * d'attribut : le rang est la seule correspondance qu'il sait lire entre un onglet et son panneau.
 *
 * QUATRE RANGS, la plus longue rangée non contrôlée du site (la home, la vitrine). Un cinquième
 * onglet visé par l'adresse ouvrirait bien son panneau avant l'hydratation, mais la rangée n'y
 * aurait aucun onglet choisi jusqu'à elle : le jour où une rangée en compte cinq, une ligne de plus.
 *
 * `> * > [role=tablist] > &` ET NON UN DESCENDANT : une rangée contrôlée posée dans un panneau — un
 * cadre d'`Exhibit` — ne doit pas lire l'ancre de la rangée qui la contient. `*` est l'enveloppe de
 * `Reveal` en `"top"`, la barre en `"bottom"`.
 */
const EARLY_SELECTION = cn(
  "[[data-tab-hash]:not([data-tab-hash-synced]):has(>[role=tabpanel]>[data-tab-anchor]:target)>*>[role=tablist]>&]:font-normal",
  "[[data-tab-hash]:not([data-tab-hash-synced]):has(>[role=tabpanel]>[data-tab-anchor]:target)>*>[role=tablist]>&]:text-text-tertiary",
  "[[data-tab-hash]:not([data-tab-hash-synced]):has(>:nth-child(1_of_[role=tabpanel])>[data-tab-anchor]:target)>*>[role=tablist]>&:nth-child(1_of_[role=tab])]:font-medium",
  "[[data-tab-hash]:not([data-tab-hash-synced]):has(>:nth-child(1_of_[role=tabpanel])>[data-tab-anchor]:target)>*>[role=tablist]>&:nth-child(1_of_[role=tab])]:text-text-primary",
  "[[data-tab-hash]:not([data-tab-hash-synced]):has(>:nth-child(2_of_[role=tabpanel])>[data-tab-anchor]:target)>*>[role=tablist]>&:nth-child(2_of_[role=tab])]:font-medium",
  "[[data-tab-hash]:not([data-tab-hash-synced]):has(>:nth-child(2_of_[role=tabpanel])>[data-tab-anchor]:target)>*>[role=tablist]>&:nth-child(2_of_[role=tab])]:text-text-primary",
  "[[data-tab-hash]:not([data-tab-hash-synced]):has(>:nth-child(3_of_[role=tabpanel])>[data-tab-anchor]:target)>*>[role=tablist]>&:nth-child(3_of_[role=tab])]:font-medium",
  "[[data-tab-hash]:not([data-tab-hash-synced]):has(>:nth-child(3_of_[role=tabpanel])>[data-tab-anchor]:target)>*>[role=tablist]>&:nth-child(3_of_[role=tab])]:text-text-primary",
  "[[data-tab-hash]:not([data-tab-hash-synced]):has(>:nth-child(4_of_[role=tabpanel])>[data-tab-anchor]:target)>*>[role=tablist]>&:nth-child(4_of_[role=tab])]:font-medium",
  "[[data-tab-hash]:not([data-tab-hash-synced]):has(>:nth-child(4_of_[role=tabpanel])>[data-tab-anchor]:target)>*>[role=tablist]>&:nth-child(4_of_[role=tab])]:text-text-primary",
);

/**
 * L'onglet lui-même — interne au fichier, jamais exporté (voir la docstring de `Tab`).
 *
 * QUATRE POINTS SUR LE SQUELETTE DE CLASSES, à relire avant toute retouche :
 *
 *   1. LA ZONE DE CLIC FAIT 36 PX, LA PILL 32. Le bouton occupe 32 px dans le flux
 *      (`--size-tab-item-height`) ; un pseudo-élément `after:` transparent, en absolu, tiré de
 *      2 px vers le haut et vers le bas par `--size-tab-target-inset`, porte la cible à
 *      32 + 2 × 2 = 36 px SANS déplacer quoi que ce soit et SANS changer la hauteur de la piste
 *      — le débord tombe dans les 4 px de padding de la piste. C'est au-dessus du seuil de
 *      24 × 24 px de WCAG 2.2 SC 2.5.8, et en dessous des 44 px que la loi 5 réserve aux
 *      contrôles ICÔNE SEULE : un onglet est un contrôle textuel, sa cible se lit sur le mot.
 *      Le pseudo-élément ne porte PAS `pointer-events-none`, sans quoi il n'agrandirait aucune
 *      cible ; et il ne masque pas l'anneau de focus, qui est un `outline` — les outlines sont
 *      peints par-dessus tout le contenu de leur contexte d'empilement, descendants positionnés
 *      compris.
 *   2. AUCUN `cursor-pointer` ICI. Il y en avait un, avec
 *      une raison juste — aucun navigateur ne pose la main sur un `<button>`. Le curseur est
 *      depuis devenu une décision de SITE : `@layer base` de `globals.css` pose
 *      `--cursor-pointer` sur tout ce qui est cliquable, avec une spécificité de `(0,3,1)` que
 *      la classe de Tailwind ne pouvait de toute façon plus battre. La garder aurait posé le
 *      mot-clé `pointer` — la main NATIVE, donc un autre curseur — dans une classe qui ne
 *      produisait plus rien.
 *
 *      CE QUI SURVIT À CE RETRAIT, et qu'il ne faut pas perdre : le curseur vaut sur les QUATRE
 *      onglets, y compris celui déjà sélectionné. Un curseur qui retomberait en flèche sur lui
 *      ferait clignoter le pointeur en traversant la rangée, et laisserait croire à un contrôle
 *      mort là où il n'y a qu'un contrôle sans effet. La règle de base ne connaît pas la
 *      sélection, donc elle tient cette propriété sans condition. Le pseudo-élément de la zone
 *      de clic hérite du curseur du bouton : les 36 px complets restent couverts.
 *
 *      Le curseur est un token, gardé par `scripts/laws/cursor.mjs`. Voir
 *      `docs/specs/2026-08-09-curseurs-pixel-design.md` § 8.4.
 *   3. AUCUN PADDING VERTICAL. La hauteur est fixe et le mot est centré par
 *      `inline-flex items-center justify-center`. Ajouter un `py-*` ferait dépasser le texte de
 *      la hauteur décidée, ou l'écraserait selon le cran choisi.
 *   4. L'ANNEAU DE FOCUS déclare sa LARGEUR et sa COULEUR ici ; son DÉCALAGE vient de la règle
 *      `:focus-visible` de la couche `base` de `globals.css`, posée une seule fois pour tout le
 *      système — vérifié, ne pas le réécrire ici. `--color-focus-ring` (et non `-inverse`)
 *      suppose la rangée posée sur une surface claire ; sur une surface inversée il descendrait
 *      à 1:1 et devrait être remappé. Contrainte écrite, pas un trou implicite.
 *
 * L'ÉTAT PRESSÉ PRÉ-VISUALISE LA SÉLECTION PAR LA GRAISSE (spec
 * `2026-10-07-pastille-glissante-design` § 6) : `active:font-medium` fait prendre au mot, sous le
 * doigt, la graisse de l'onglet choisi, et relâcher la fige. C'est le pendant du glyphe qui se
 * remplit sous le doigt dans `ThemeSelector` ;
 * une pill qui GLISSE ne peut plus être peinte par l'onglet, et elle ne part qu'au CLIC,
 * jamais à l'appui — décision de Florian au cadrage. Presser un onglet déjà sélectionné ne change
 * toujours rien. LE DÉFAUT EST CONNU ET ACCEPTÉ : le mot pressé s'élargit de quelques pixels, ses
 * voisins se décalent pendant l'appui, et la pastille les suit — c'est déjà ce qui se produit à
 * chaque changement de sélection.
 *
 * L'ONGLET S'ENFONCE AU PRESSÉ (lot J du 2026-10-28, spec `2026-10-28-lot-j-petits-restes-design` § 3.4,
 * A11Y-07) : `active:scale-[var(--scale-press)]` en plus de la graisse, en `--duration-fast`, revenu à 1
 * au relâchement. Il s'ajoute à `active:font-medium` sans le remplacer : la graisse est toujours
 * l'aperçu de la sélection, l'échelle est le « clic » que le doigt reçoit. L'échelle est celle du bouton,
 * non de la pastille de `SegmentedTrack`, qui ne bouge pas à l'appui.
 *
 * La transition de l'onglet ne porte que la COULEUR DU MOT — et, depuis le lot J, l'échelle —, en `--duration-fast` et `--ease-out` ;
 * le mouvement de la pastille appartient à `SegmentedTrack`. Elle est neutralisée sous
 * `prefers-reduced-motion`, où `globals.css` ramène les trois durées du système à 1 ms — vérifié,
 * le composant n'a pas la requête média à connaître. La graisse, elle, ne transitionne pas, ni au
 * pressé ni à la sélection : c'est un saut, et c'est ce qui rend la sélection lisible d'un coup.
 */
function TabItem({
  id,
  controls,
  label,
  selected,
  nodeRef,
  onActivate,
  onNavigate,
}: {
  id: string;
  controls: string;
  label: string;
  selected: boolean;
  nodeRef: (node: HTMLButtonElement | null) => void;
  onActivate: () => void;
  onNavigate: (event: KeyboardEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      ref={nodeRef}
      aria-controls={controls}
      aria-selected={selected}
      tabIndex={selected ? 0 : -1}
      onClick={onActivate}
      onKeyDown={onNavigate}
      className={cn(
        "relative inline-flex h-[var(--size-tab-item-height)] items-center justify-center rounded-full px-3",
        "font-pixel text-body-sm",
        "after:absolute after:inset-x-0 after:inset-y-[var(--size-tab-target-inset)] after:content-['']",
        "transition-[color,background-color,border-color,outline-color,text-decoration-color,fill,stroke,scale] duration-[var(--duration-fast)] ease-out",
        "hover:text-text-primary",
        "active:scale-[var(--scale-press)] active:font-medium",
        "focus-visible:outline-[length:var(--border-thick)] focus-visible:outline-focus-ring",
        selected ? "font-medium text-text-primary" : "font-normal text-text-tertiary",
        EARLY_SELECTION,
      )}
    >
      {label}
    </button>
  );
}
