import { cn } from "@/lib/cn";

interface IconProps {
  /**
   * Le glyphe rendu. REQUISE et sans défaut, pour la raison de `brand` sur `Logo` : ce ne sont
   * pas deux aspects d'un dessin, ce sont deux dessins, et un défaut afficherait silencieusement
   * le mauvais.
   *
   * ELLE EST CONFRONTÉE AU MANIFESTE, terme pour terme, malgré ses lignes multiples : le motif de
   * `scripts/laws/manifest-sync.mjs` accepte la barre que Prettier pose en tête de chaque membre.
   * Un glyphe ajouté ici et oublié au champ `options` fait échouer `npm run check`.
   */
  name:
    | "download"
    | "mail"
    | "check"
    | "external-link"
    | "close"
    | "share"
    | "arrow-left"
    | "arrow-right"
    | "arrow-down"
    | "linkedin-2"
    | "github"
    | "link"
    | "more-horizontal"
    | "x"
    | "bluesky"
    | "file-text"
    | "scale"
    | "claude"
    | "chatgpt"
    | "pin"
    | "sun"
    | "sun-filled"
    | "moon"
    | "moon-filled"
    | "external-link-xs"
    | "glasses"
    | "search"
    | "close-sm"
    | "copy"
    | "menu"
    | "alert-circle-sm"
    | "check-circle-sm"
    | "alert-triangle-sm"
    | "loader"
    | "alert-circle"
    | "check-circle"
    | "info"
    | "inbox"
    | "arrow-right-sm"
    | "mail-sm"
    | "search-sm"
    | "share-sm"
    | "check-sm"
    | "file-text-sm"
    | "info-sm"
    | "copy-sm"
    | "moon-sm"
    | "external-link-sm"
    | "arrow-up-right";
}

/** L'union des glyphes, pour les composants qui en choisissent un par option. */
export type IconName = IconProps["name"];

/**
 * Les tracés, dans l'espace de 24 × 24 du `viewBox`. Les nombres qu'ils portent sont le DESSIN et
 * non des valeurs de design : ils ne relèvent pas plus de la loi 1 que les pixels d'une image.
 *
 * QUATRE PROVENANCES, et il faut savoir laquelle avant de toucher à un `d` : le set, les nodes de
 * Florian, — pour un seul glyphe, `glasses` — un fichier du dépôt, et — pour quatorze, `search`,
 * `close-sm`, `copy`, `arrow-right`, `menu`, `arrow-up-right` (lot 4, 2026-11-11) et, depuis le lot 3 du
 * 2026-11-11, `alert-circle`, `alert-circle-sm`, `alert-triangle-sm`, `check-circle`, `check-circle-sm`, `info`,
 * `loader` et `inbox` —
 * Neume, le set d'icônes de Florian.
 *
 * LE SET D'ABORD, TOUJOURS — règle de Florian du 2026-10-19, écrite à la loi 5 : une icône, métaphore
 * ou marque, se copie du set libre dès qu'il la livre ; un dessin custom n'est ouvert que s'il ne la
 * livre pas, ou seulement dans son offre payante. Avant de relever un node, vérifier la dernière
 * version du set : il grandit.
 *
 * SEIZE GLYPHES SONT COPIÉS depuis Pixelarticons (licence MIT,
 * https://github.com/halfmage/pixelarticons) — `svg/download.svg`, `svg/mail.svg`,
 * `svg/check.svg`, `svg/external-link.svg`, `svg/close.svg`, `svg/share.svg`,
 * `svg/arrow-left.svg`, `svg/linkedin-2.svg`,
 * `svg/github.svg`, `svg/link.svg`, `svg/more-horizontal.svg`, `svg/x.svg`, `svg/bluesky.svg`,
 * `svg/file-text.svg`, `svg/scale.svg` et `svg/arrow-down.svg`, pris au caractère près. Les sept premiers sont de la variante
 * NON-`sharp` — le set en livre deux de chaque pour `download`, `mail`, `external-link` et `share`,
 * et la `sharp` d'`external-link` ferme sa boîte jusqu'au bord gauche ; `close` et `arrow-left`
 * n'ont pas de `-sharp` sous ce nom dans le set, la variante NON-`sharp` est donc la
 * seule qui existe pour eux. Les neuf derniers viennent de la version 2.4.2 (commit
 * `c9ecc2da61afde85dbe539025e3d931c6152ad75`, 2026-10-06) : les deux marques de la home au trait et
 * non `-solid`, puis les quatre de la popin de partage, puis `file-text` du bouton «
 * `<slug>.md` », tous de la variante non-`sharp`, puis `scale`, le déclencheur de la visionneuse
 * d'`Exhibit`, qui n'a pas de `-sharp` dans le set, puis `arrow-down`, la flèche du lien d'évitement
 * (`SkipLink`, 2026-10-28), qui n'en a pas non plus : un seul `d`, comme l'amont l'écrit.
 *
 * HUIT SONT RELEVÉS DES NODES DE FLORIAN, et pour DEUX raisons distinctes, qui sont deux
 * exceptions séparées de la loi 5. Ne pas les confondre : elles n'autorisent pas les mêmes choses.
 *
 *   • `claude` et `chatgpt` — MARQUES TIERCES, à 24, ABSENTES DU SET LIBRE, même en 2.4.2. Elles
 *     sont arrivées le 2026-10-17 avec les boutons « Ask » des pages projet (spec
 *     `docs/specs/2026-10-16-demander-a-une-ia-design.md` § 6) : le bouton mène chez cette IA, et
 *     son logo est le contenu du contrôle. Exception « une marque tierce dans un contrôle »,
 *     six conditions cumulatives, toutes tenues ici : marque tierce, qui identifie
 *     une destination, monochrome et sans couleur propre, sur la grille de 24 en coordonnées
 *     entières, relevée d'un node cité ci-dessous, absente du set libre. `linkedin`, `figma` et
 *     `github` y étaient jusqu'au 2026-10-19 : le set ne les livrait pas quand ils ont été relevés.
 *
 *   • `pin`, `sun`, `sun-filled`, `moon`, `moon-filled` et `external-link-xs` —
 *     MÉTAPHORES, à une taille que le set ne dessine pas : 16 pour les cinq premières, 12 pour la
 *     dernière. Le set
 *     n'existe qu'à 24 et cette loi interdit d'y réduire un dessin, donc à cette taille il n'y a
 *     rien à copier. Exception « 16 px », ouverte aux CONTRÔLES par la
 *     révision de `ThemeSelector`. Elle ne légitime aucune métaphore dessinée à 24 : là, le set
 *     fait foi.
 *
 * Les blocs des nodes sont en noir pur ; cette couleur ne traverse pas — `fill-current` la fait
 * venir du parent, comme pour les glyphes copiés.
 *
 * UN EST REPRIS D'UN FICHIER DU DÉPÔT, et c'est la troisième provenance : `glasses`, les lunettes
 * du favicon (`app/icon.svg`), arrivées le 2026-10-21 avec `LookingGlasses`, la 404 aux lunettes
 * (spec `docs/specs/2026-10-21-lot-f-clins-design.md` § 3.2). Ni copié du set — le set ne livre pas
 * ces lunettes-là, ce sont celles de Florian —, ni relevé d'un node : le `d` est celui du `<path>`
 * du favicon, au caractère près, sans son carré de fond. La garantie est donc la même que pour une
 * copie du set, « identique à la source », et la source est dans le dépôt : un diff entre les deux
 * fichiers la vérifie. Le jour où le favicon change de dessin, ce glyphe ne le suit pas tout seul.
 *
 * TROIS SONT COPIÉS DE NEUME, et c'est la quatrième provenance : `search` et `close-sm`, arrivés le
 * 2026-11-06 avec `SearchField` (spec `docs/specs/2026-11-06-champ-de-recherche-design.md` § 1, § 3 et
 * § 5). Neume (neume.dev, dépôt `~/neume`, licence MIT) est le set de Florian : chaque icône y est
 * dessinée case par case sur une grille de 12 × 12, et 65 d'entre elles le sont aussi sur une grille
 * de 8 × 8 pour les petites tailles. `search` est le dessin de 12 × 12 d'`icons/grand.json`, à 2 px
 * par case dans la boîte de 24 ; `close-sm` celui de 8 × 8 d'`icons/petit.json` (`close`), à 2 px
 * par case dans la boîte de 16. Le décalage d'une demi-case que Neume écrit en `offset: [1, 1]` est
 * déjà appliqué : les `d` sont ceux que le paquet `@neume-icons/svg` livre dans `dist/24/search.svg` et
 * `dist/16/close.svg`, pris au caractère près au commit `ab2e68d` du 2026-11-06, et la garantie est
 * celle d'une copie, « identique à la source ». Ni un relevé de node — l'angle mort n° 12 de
 * `.claude/rules/loi-05-icones.md` ne les concerne pas —, ni une copie de Pixelarticons.
 *
 *   • `search`, À 24, EST UNE MÉTAPHORE QUE PIXELARTICONS LIVRE AUSSI (`svg/search.svg`). La loi 5
 *     dit que le set fait foi à 24 « sans négociation » ; c'est Florian qui a choisi la loupe de Neume
 *     sur le prototype, contre un 16 px essayé et écarté. La loi 5 l'écrit depuis le 2026-11-06 :
 *     Neume est une source au même rang que Pixelarticons, au choix de Florian icône par icône.
 *     La bascule complète d'`Icon` vers Neume est un lot à part.
 *   • `close-sm`, À 16, tient l'exception « 16 px » de la loi 5 telle qu'elle est écrite : le set ne
 *     dessine pas cette taille, `close`, au set à 24, reste la référence de forme, et la source est
 *     citée ici. Le suffixe `-sm` est celui du token de sa taille, `--size-icon-sm` — comme
 *     `external-link-xs` porte celui de `--size-icon-xs` : deux dessins, deux noms, `close` restant
 *     le glyphe de 24.
 *   • `copy`, À 24, EST LE TROISIÈME, arrivé le 2026-11-07 avec `CopyButton` (spec
 *     `docs/specs/2026-11-07-copie-et-bloc-de-code-design.md` § 2) : deux feuilles qui se recouvrent,
 *     devant « Copy » et seul dans la forme icône. Son `d` est celui que `@neume-icons/svg` livre dans
 *     `dist/24/copy.svg`, pris au caractère près au commit `ab2e68d` du dépôt `neume` (2026-11-06,
 *     arbre propre) — le même que `search` —, et la garantie est celle d'une copie, « identique à la
 *     source ». C'est une métaphore à 24 que Pixelarticons livre aussi : Florian la prend de Neume
 *     pour la même raison que la loupe, Neume étant une source au même rang (loi 5). Ce n'est pas un
 *     relevé de node, donc l'angle mort n° 12 de `.claude/rules/loi-05-icones.md` ne le concerne pas.
 *   • `arrow-right`, À 24, EST LE QUATRIÈME, arrivé le 2026-11-11 (retours de validation du lot 1, spec
 *     `docs/specs/2026-11-11-lot-1-petits-controles-design.md` § 4) : la flèche d'`Announcement`.
 *     Son `d` est celui que `@neume-icons/svg` livre dans `dist/24/arrow-right.svg`, pris au caractère
 *     près au commit `45b03bb` du dépôt `neume`, et il REMPLACE le tracé de Pixelarticons
 *     (`svg/arrow-right.svg`, recopié dans `docs/history/icon.md`). Neume est une source au même rang
 *     (loi 5), au choix de Florian icône par icône ; ce n'est pas un relevé de node. Boîte de 24,
 *     `fill="currentColor"`, 7 rectangles sur les pixels IMPAIRS (hampe de 3 à 21, pointe de 13 à 19) :
 *     aucun `size`, il se rend à 24, la seule taille que la loi 5 lui ouvre. `arrow-left` reste celui
 *     de Pixelarticons : les deux flèches n'ont plus le même auteur, et personne ne les pose côte à côte.
 *
 * LEURS TRACÉS SONT GÉNÉRÉS, PAS COPIÉS, et c'est toute la différence. Une décomposition en
 * rectangles maximaux réduit les blocs du node à des sous-tracés — 44 blocs → 24 pour `claude`,
 * 48 → 27 pour `chatgpt` — sans changer un seul pixel d'encre. La garantie n'est donc pas « identique à l'amont » mais
 * « mêmes pixels que le node », et elle se vérifie en recomposant la grille depuis le `d` : chaque
 * cellule couverte doit l'être dans le node, et réciproquement. C'est l'angle mort n° 12 de
 * `.claude/rules/loi-05-icones.md` — rien ne rejoue ce contrôle.
 *
 * COPIÉS PLUTÔT QU'INSTALLÉS en dépendance, décision de Florian : aucun loader SVG
 * à ajouter à Next, rien dans le bundle qui ne soit utilisé — à deux glyphes près, gardés sans
 * appelant pour la raison écrite plus bas —, et surtout des tracés qu'une mise à
 * jour amont ne peut pas changer sous nos pieds.
 *
 * VINGT-NEUF GLYPHES, et pas un de plus. C'est la loi 10 transposée aux icônes : aucun glyphe sans
 * composant qui le justifie. Un lot de départ « probable » a été proposé au cadrage et écarté —
 * il aurait produit exactement les tokens morts que la loi 10 interdit, sous un autre nom.
 * Chaque composant suivant ajoute les siens : `download` est arrivé avec `Button`, et
 * SEUL. `copy` avait été écarté sous la loi 10, faute de composant qui le justifie, puis il est
 * arrivé avec `CopyButton`, qui le rend : c'est la même loi qui l'avait refusé. `external-link` avait
 * été refusé pour cette même raison, puis il est arrivé avec un appelant, `NoteRow`, qui ne le
 * rend plus. Son arrivée n'était pas une exception qu'on lui accordait — c'est la loi 10 qui
 * fonctionne, et elle seule. `close`, `share`, `arrow-left`
 * et `arrow-right` arrivent avec `Popin`, pour sa barre de contrôle (spec
 * `docs/specs/2026-08-14-popin-design.md` § 7) : quatre appelants d'un coup, un par glyphe. Depuis
 * le retrait de `Popin`, seul `arrow-left` en avait un — le bouton retour des pages
 * projet ; `close`, `share` et `arrow-right` n'en avaient plus. `share` en a retrouvé un le
 * 2026-10-17 : `ShareButton`, passé à `Button`, le rend à 24 px devant son mot. `close` en a retrouvé
 * un le 2026-10-19 : la popin de `ShareButton` porte sa croix.
 * `external-link-xs` arrive pour la même raison qu'`external-link` : il a un
 * appelant, `StandaloneLink`, et ce n'est encore une fois pas une exception qu'on lui accorde —
 * c'est la loi 10 qui fonctionne. `glasses` aussi : son appelant est `LookingGlasses`. `search` et
 * `close-sm` aussi : leur appelant est `SearchField`, la loupe devant le champ et la croix qui l'efface.
 * `copy` aussi : son appelant est `CopyButton`, devant « Copy » et seul dans la forme icône.
 * `share-xs` était arrivé le 2026-10-12 avec `ShareButton`, qui le rendait à côté de son mot depuis
 * qu'il composait `StandaloneLink` : encore un appelant, encore la loi 10. C'était un dessin de
 * Florian (node `303:113`) et non une copie du set. IL EST RETIRÉ LE 2026-10-17 : `ShareButton` est
 * passé à `Button` et au glyphe `share` de 24, `share-xs` n'a plus aucun appelant, et la loi 10 le
 * fait sortir — c'est la même loi qui l'avait fait entrer. L'exception des glyphes gardés sans
 * appelant, ci-dessous, est nominative et ne le couvre pas ; ce qui le sépare d'eux est qu'il n'est
 * pas une copie du set, qu'on retrouverait au caractère près, mais un relevé de node. Son tracé et
 * son commentaire sont recopiés dans `docs/history/icon.md`.
 *
 * DEUX N'ONT PLUS D'APPELANT, ET ILS RESTENT : `external-link` et `arrow-right`. Ils étaient
 * TROIS jusqu'au 2026-10-19, et `close` en est sorti en retrouvant un appelant ; QUATRE jusqu'au
 * 2026-10-17, et `share` en était sorti de la même façon. Selon la
 * phrase plus bas, ce sont des tokens morts, et les garder est une EXCEPTION à « pas un de plus »,
 * décidée par Florian, nominative et fermée à ces deux : ce n'est pas un précédent. Elle ne
 * couvre que des glyphes qui ont eu leur appelant et l'ont perdu ; un glyphe qui arrive sans
 * appelant n'entre toujours pas. Sa raison est le retour : ce sont des copies du set au caractère
 * près, aucune n'est rendue, donc aucun pixel du site n'en dépend, et les retirer pour les recopier
 * le jour où un composant en redemande un coûterait un nouveau cadrage pour rien de visible. Le
 * prix n'est pas nul, et il est chiffré : `ThemeSelector` est un composant client, la table part
 * donc entière dans le bundle client, et ces deux tracés y pèsent 250 octets bruts, environ 140
 * gzippés, dans chaque chunk qui l'embarque — 480 et 230 avec `close`, avant qu'il ne serve.
 *
 * LES SIX SUIVANTS ARRIVENT AVEC LA HOME PAGE, et chacun a son appelant : `mail` et `check` sont
 * les deux faces de `CopyEmailButton`, les trois marques `linkedin-2`, `figma` et `github` étaient les
 * trois liens de sa rangée — `figma` en est sorti le 2026-11-05, remplacé par `x`, déjà dans la table —, et `pin` est celui de `LocationLine`. Aucun n'est spéculatif. `copy`
 * n'avait pas été ajouté alors : le geste de `CopyEmailButton` est dit par l'enveloppe, pas par un
 * presse-papiers dessiné. Il l'est depuis `CopyButton`, qui copie une chaîne quelconque.
 *
 * LES TROIS MARQUES DE LA HOME SONT RECOPIÉES DU SET LE 2026-10-19, à la demande de Florian, et
 * c'est la doctrine « nos noms sont les leurs » qui renomme la première : le set livre un
 * `linkedin` — les lettres seules, sans cadre — et un `linkedin-2`, le « in » dans son cadre, le
 * dessin le plus proche du relevé qu'il remplace. Ce que la copie change au pixel :
 * `github`, un pixel vers la gauche, l'amont n'étant pas centré dans sa case (encre de 1 à 21) ;
 * `linkedin-2`, un cadre plus grand de 2 px dans chaque sens. Les relevés remplacés sont recopiés
 * dans `docs/history/icon.md`.
 *
 * LES DEUX SUIVANTS ARRIVENT AVEC LES BOUTONS « ASK » DES PAGES PROJET, le 2026-10-17 : `claude` et
 * `chatgpt`, un par bouton, rendus par `renderProjectContent` et `ReadingActions`
 * (`app/(reading)/_render.tsx`). Chacun a son appelant. Ils sont sur la grille de 24 en blocs de 1,
 * sur les pixels pairs — l'angle mort n° 12 de `.claude/rules/loi-05-icones.md` le dit. Un TROISIÈME, `perplexity`, est arrivé avec eux et RETIRÉ
 * LE MÊME JOUR, sur décision de Florian après son test : Perplexity n'arrivait pas à lire la page,
 * le bouton est retiré de `ASK_AI_TARGETS`, et son glyphe, sans appelant, sort par la loi 10 — comme
 * `share-xs`, c'est un relevé de node, non une copie du set, et son tracé est recopié dans
 * `docs/history/icon.md`.
 *
 * LES QUATRE SUIVANTS ARRIVENT AVEC LA POPIN DE PARTAGE, le 2026-10-19 : `link`, `x`, `bluesky` et
 * `more-horizontal`, rendus par `ShareButton` (spec `docs/specs/2026-10-19-popin-de-partage-design.md`
 * § 7) — `link` devant « Copy link », `x` et `bluesky` dans la rangée des réseaux,
 * `more-horizontal` pour la feuille de partage du système. Chacun a son appelant. Ils sont COPIÉS
 * du set 2.4.2, variante non-`sharp`, au caractère près : `x` et `bluesky` sont des marques tierces,
 * mais la règle du 2026-10-19 veut une copie dès que le set libre livre le glyphe, marque ou
 * métaphore, et un dessin relevé seulement s'il est absent ou payant. Aucun n'est un relevé de node,
 * donc l'angle mort n° 12 de `.claude/rules/loi-05-icones.md` ne les concerne pas. Leur encre : `link` 108 px, de 2 à 22 en x et de 6 à
 * 18 en y ; `more-horizontal` 48 px, de 1 à 23 sur des x IMPAIRS comme `github`, de 9 à 15 ;
 * `x` 96 px, de 2 à 22 et de 4 à 20 ; `bluesky` 112 px, de 2 à 22 et de 3 à 21.
 *
 * LE SUIVANT ARRIVE AVEC LE BOUTON « `<SLUG>.MD` » DES PAGES PROJET, le 2026-10-19 :
 * `file-text`, rendu par `renderProjectContent` et `ReadingActions` (`app/(reading)/_render.tsx`,
 * spec `docs/specs/2026-10-19-vue-markdown-design.md` § 6) — un document à lignes de texte, devant
 * « `<slug>.md` ». Il a son appelant. Il est COPIÉ du set 2.4.2, variante non-`sharp`, au
 * caractère près, avec les deux `d` que l'amont lui donne ; aucun set ne livre de marque
 * « Markdown », et `code`, `article` et `script` disaient autre chose (« du code », un journal, un
 * parchemin). Ce n'est pas un relevé de node, donc l'angle mort n° 12 de
 * `.claude/rules/loi-05-icones.md` ne le concerne pas. Son encre : 164 px, de 4 à 20 en x et de 2
 * à 22 en y, sur les pixels PAIRS, comme `linkedin-2`, `x`, `claude` et `chatgpt`.
 *
 * LE SUIVANT ARRIVE AVEC LA VISIONNEUSE D'`Exhibit`, le 2026-10-20 (lot C, spec
 * `docs/specs/2026-10-20-lot-c-lecture-design.md` § 5.2 et § 10) : `scale`, le glyphe du bouton qui
 * ouvre l'image en grand, dans le coin haut droit du cadre. Il a son appelant. Il est COPIÉ du set
 * 2.4.2 — toujours la dernière version, vérifiée le même jour : la `master` de l'amont est encore le
 * commit de la 2.4.2 —, au caractère près, avec les trois `d` que l'amont lui donne ; le set n'en livre
 * pas de `-sharp`. C'EST LE DEUXIÈME GLYPHE ESSAYÉ, et le plus proche de la demande, pas la demande :
 * `zoom-in`, une loupe et un plus, était entré le matin, et Florian l'a écarté à la lecture de la
 * branche — il voulait les quatre flèches, une vers chaque coin, des boutons plein écran des vidéos.
 * LE SET NE LIVRE PAS CE DESSIN (`svg/` relevé le 2026-10-20, 1036 fichiers : ni `fullscreen`, ni
 * `maximize` ; `move` est une croix de flèches vers les quatre côtés, pas vers les coins) ; `scale` en
 * est le plus proche, deux flèches vers deux coins opposés. Le dessin à
 * quatre flèches est un dessin CUSTOM, qui n'entrera qu'avec un node de Florian, relevé ici (loi 5,
 * exception « le set ne la livre pas ») : à lui de dire s'il le dessine. `zoom-in` est sorti par la loi
 * 10 — il n'avait plus d'appelant —, et son tracé est recopié dans `docs/history/icon.md`. Ce n'est
 * pas un relevé de node, donc l'angle mort n° 12 de `.claude/rules/loi-05-icones.md` ne concerne pas
 * `scale`. Son encre : 80 px, de 3 à 21 dans les deux sens, sur les pixels IMPAIRS comme `close`.
 *
 * UN TABLEAU DE TRACÉS, et non une chaîne. `download.svg` porte TROIS
 * `<path>` là où les deux premiers glyphes n'en portent qu'un. L'alternative était de concaténer
 * ses trois `d` en une seule chaîne : le rendu serait identique — la règle de remplissage par
 * défaut est `nonzero`, et le troisième tracé est de toute façon contenu dans le second — mais ce
 * fichier cesserait de porter une COPIE LITTÉRALE de l'amont, qui est la seule garantie qu'une
 * mise à jour du set reste comparable au caractère près.
 *
 * Un glyphe que personne ne rend est un token mort
 * sous un autre nom.
 *
 * LA DOCTRINE « nos noms sont les leurs ». Elle disait qu'`image-new` ne se
 * renommait pas en `sun` parce qu'un nom d'icône absent du set doit rester une erreur à signaler,
 * ce qui suppose que notre vocabulaire soit le leur. Elle ne vaut que tant que le DESSIN est le
 * leur. Le soleil est celui de Florian, donc il porte le nom que son dessin appelle :
 * `sun`. La doctrine reste entière pour les glyphes copiés, qui sont les seuls qu'elle
 * concerne encore.
 *
 * LE SUFFIXE EST `-filled`, ET NON `-full` comme dans les frames du node. `full` qualifie une
 * quantité, `filled` un remplissage, et c'est un remplissage : le plein n'ajoute que l'intérieur
 * de la silhouette, il n'en déplace aucun pixel de contour. Cette propriété a été vérifiée au
 * relevé et elle est ce qui fait de la paire un ÉTAT plutôt que deux dessins — si un jour un
 * `-filled` bougeait un pixel de contour, le remplissage tremblerait à la sélection.
 *
 * DEUX CHAMPS DE TAILLE ET NON UN. `box` est la GRILLE DE DESSIN — l'espace
 * du `viewBox`, celui dans lequel les `d` sont écrits — et `size` la TAILLE RENDUE en pixels CSS.
 * `size` est OPTIONNEL et vaut `box` par défaut, si bien que trois
 * glyphes de la table seulement le portent. C'est voulu — l'anomalie doit se voir à la ligne où
 * elle est, pas se diluer dans vingt-six déclarations identiques.
 *
 * DEUX LE PORTENT POUR DESCENDRE, `pin` ET `external-link-xs`, et ils rendent à 12 pour des raisons
 * DIFFÉRENTES — c'est ce qu'il faut savoir avant d'en ajouter un quatrième. `pin` est un dessin de
 * 16 qu'on RÉDUIT ; `external-link-xs` est un dessin NATIF de 8 × 8, écrit dans l'espace de 16 en
 * blocs de 2. Les deux ont pourtant le même grain : `pin` est lui aussi une grille de 8 × 8 en
 * blocs de 2, donc tous leurs blocs valent 1,5 px CSS. Ils étaient TROIS jusqu'au 2026-10-17, avec
 * `share-xs`, retiré ce jour-là. Aucun n'est propre en densité 1× — le prix commun est
 * chiffré à `--size-icon-xs` dans `semantic.css`, la distinction est à la ligne de chaque glyphe.
 *
 * UN LE PORTE POUR MONTER, `glasses`, et il n'a pas leur prix : `box: 16, size: 48`, le patron de
 * `pin` inversé. La grille de dessin est plus petite que le rendu, d'un facteur ENTIER — ×3 —, donc
 * chaque unité du dessin tombe sur 3 pixels CSS et le glyphe est net à toute densité. C'est le 48
 * que la loi 5 réserve à un élément de composition, et non à un contrôle. */
const GLYPH: Record<IconName, { box: 16 | 24; size?: 12 | 48; paths: string[] }> = {
  download: {
    box: 24,
    paths: [
      "M21 15v4h-2v-4zm-2 4v2H5v-2zM5 15v4H3v-4zm8-12v14h-2V3z",
      "M7 11v2h10v-2zm2 2v2h2v-2zm4 0v2h2v-2z",
      "M15 11v2h2v-2z",
    ],
  },
  mail: {
    box: 24,
    paths: [
      "M6 8h2v2H6zm2 2h2v2H8zm10-2h-2v2h2zm-2 2h-2v2h2zm-6 2h4v2h-4zM2 6h2v12H2zm18 0h2v12h-2zM4 4h16v2H4zm0 14h16v2H4z",
    ],
  },
  check: {
    box: 24,
    paths: [
      "M10 18H8v-2h2v2Zm-2-2H6v-2h2v2Zm4-2v2h-2v-2h2Zm-6 0H4v-2h2v2Zm8 0h-2v-2h2v2Zm2-2h-2v-2h2v2Zm2-2h-2V8h2v2Zm2-2h-2V6h2v2Z",
    ],
  },
  /* Node : aucun — COPIÉ du set, `svg/external-link.svg`, variante NON-`sharp`, deux `d` comme
   * l'amont les sépare. 30 blocs de 2 px sur les pixels IMPAIRS d'une grille de 24, 120 px d'encre.
   * Le prix est écrit au § 6 du spec `docs/specs/2026-08-14-panneau-notes-design.md`. */
  "external-link": {
    box: 24,
    paths: [
      "M11 5H5v2h6V5ZM5 7H3v12h2V7Zm12 12H5v2h12v-2Zm2-6h-2v6h2v-6Zm-8 0H9v2h2v-2Zm2-2h-2v2h2v-2Zm2-2h-2v2h2V9Zm2-2h-2v2h2V7Zm2-2h-2v2h2V5Zm2-2h-2v8h2V3Z",
      "M21 3h-8v2h8V3Z",
    ],
  },
  /* Node : aucun — COPIÉ du set, `svg/close.svg`, variante NON-`sharp`. 13 blocs de 2 × 2 en
   * diagonale sur les pixels IMPAIRS d'une grille de 24, 52 px d'encre. */
  close: {
    box: 24,
    paths: [
      "M7 19H5V17H7V19ZM19 19H17V17H19V19ZM9 15V17H7V15H9ZM17 17H15V15H17V17ZM11 15H9V13H11V15ZM15 15H13V13H15V15ZM13 13H11V11H13V13ZM11 11H9V9H11V11ZM15 11H13V9H15V11ZM9 9H7V7H9V9ZM17 9H15V7H17V9ZM7 7H5V5H7V7ZM19 7H17V5H19V7Z",
    ],
  },
  /* Node : aucun — COPIÉ du set, `svg/share.svg`, variante NON-`sharp`. Six rectangles de tailles
   * variables (le socle, la hampe, deux traits), 132 px d'encre au total. */
  share: {
    box: 24,
    paths: [
      "M20 22H4V20H20V22ZM4 20H2V14H4V20ZM22 20H20V14H22V20ZM13 4H15V6H17V8H13V18H11V8H7V6H9V4H11V2H13V4ZM9 14H4V12H9V14ZM20 14H15V12H20V14Z",
    ],
  },
  /* Node : aucun — COPIÉ du set, `svg/arrow-left.svg`, variante NON-`sharp`, deux `d` comme l'amont
   * les sépare. 88 px d'encre : la hampe et la pointe en escalier de part et d'autre. */
  "arrow-left": {
    box: 24,
    paths: [
      "M20 11v2H4v-2zM8 13v2H6v-2zm2 2v2H8v-2zm2 2v2h-2v-2zm-4-6V9H6v2z",
      "M10 15V7H8v8zm2 2V5h-2v12z",
    ],
  },
  /* Node : aucun — COPIÉ DE NEUME, `arrow-right` : le `d` de `dist/24/arrow-right.svg` du paquet
   * `@neume-icons/svg`, au caractère près, au commit `45b03bb` du dépôt `neume`. 7 rectangles, 36 px
   * d'encre, sur les pixels IMPAIRS : la hampe de 3 à 21, la pointe en trois marches de 13 à 19.
   * Remplace le tracé de Pixelarticons (2026-11-11). Appelants : `Announcement`, et `StandaloneLink` /
   * `Tile` sur la vitrine. */
  "arrow-right": {
    box: 24,
    paths: [
      "M13 5h2v2h-2zM15 7h2v2h-2zM17 9h2v2h-2zM3 11h18v2h-18zM17 13h2v2h-2zM15 15h2v2h-2zM13 17h2v2h-2z",
    ],
  },
  /* Node : aucun — COPIÉ du set, `svg/arrow-down.svg`, variante NON-`sharp` (il n'y en a pas d'autre),
   * UN SEUL `d` : l'amont l'écrit en un seul tracé, contrairement à `arrow-left` et `arrow-right`, qu'il
   * sépare en deux. Pris au caractère près le 2026-10-28, sur la branche `master` du dépôt, dont le
   * dernier commit touchant ce fichier est antérieur à la 2.4.2. 88 px d'encre : la hampe, ouverte en
   * haut, et la pointe en escalier. Appelant : `SkipLink`. */
  /* DIX GLYPHES MINI, `arrow-right-sm`, `mail-sm`, `search-sm`, `share-sm`, `check-sm`, `file-text-sm`, `info-sm`,
   * `copy-sm`, `moon-sm` et `external-link-sm` (2026-11-11, lot 4) : COPIÉS DE NEUME, le `d` de `dist/16/<nom>.svg` du
   * paquet `@neume-icons/svg`, au caractère près, au commit `45b03bb` du dépôt `neume` — les minis de 8 × 8 à 2 px par
   * case, FAITS POUR 16 (loi 5), nommés comme `close-sm` : le nom du glyphe de 24 et le suffixe de sa taille. Boîte de
   * 16. Appelant : les lignes de `CommandPalette` sur la vitrine (spec § 2.1 du lot 4, la ligne de 16 px du lot 3).
   * `external-link-sm` est l'icône provisoire de « Open on GitHub », le glyphe GitHub mini restant à dessiner
   * (`GAPS.md`). Ce n'est pas un relevé de node : l'angle mort n° 12 de `.claude/rules/loi-05-icones.md` ne les concerne pas. */
  "arrow-right-sm": {
    box: 16,
    paths: ["M9 3h2v2h-2zM11 5h2v2h-2zM1 7h14v2h-14zM11 9h2v2h-2zM9 11h2v2h-2z"],
  },
  "mail-sm": {
    box: 16,
    paths: [
      "M3 2h10v2h-10zM1 4h2v2h-2zM13 4h2v2h-2zM1 6h4v2h-4zM11 6h4v2h-4zM1 8h2v2h-2zM5 8h6v2h-6zM13 8h2v2h-2zM1 10h2v2h-2zM13 10h2v2h-2zM3 12h10v2h-10z",
    ],
  },
  "search-sm": {
    box: 16,
    paths: [
      "M3 1h6v2h-6zM1 3h2v2h-2zM9 3h2v2h-2zM1 5h2v2h-2zM9 5h2v2h-2zM1 7h2v2h-2zM9 7h2v2h-2zM3 9h8v2h-8zM11 11h2v2h-2zM13 13h2v2h-2z",
    ],
  },
  "share-sm": {
    box: 16,
    paths: [
      "M7 1h2v2h-2zM5 3h6v2h-6zM3 5h2v2h-2zM7 5h2v2h-2zM11 5h2v2h-2zM7 7h2v2h-2zM1 9h4v2h-4zM7 9h2v2h-2zM11 9h4v2h-4zM1 11h2v2h-2zM13 11h2v2h-2zM3 13h10v2h-10z",
    ],
  },
  "check-sm": {
    box: 16,
    paths: ["M11 4h2v2h-2zM9 6h2v2h-2zM3 8h2v2h-2zM7 8h2v2h-2zM5 10h2v2h-2z"],
  },
  "file-text-sm": {
    box: 16,
    paths: [
      "M4 1h6v2h-6zM2 3h2v2h-2zM8 3h4v2h-4zM2 5h2v2h-2zM8 5h6v2h-6zM2 7h2v2h-2zM12 7h2v2h-2zM2 9h2v2h-2zM6 9h4v2h-4zM12 9h2v2h-2zM2 11h2v2h-2zM12 11h2v2h-2zM4 13h8v2h-8z",
    ],
  },
  "info-sm": {
    box: 16,
    paths: [
      "M5 1h6v2h-6zM3 3h2v2h-2zM11 3h2v2h-2zM1 5h2v2h-2zM7 5h2v2h-2zM13 5h2v2h-2zM1 7h2v2h-2zM13 7h2v2h-2zM1 9h2v2h-2zM7 9h2v2h-2zM13 9h2v2h-2zM3 11h2v2h-2zM7 11h2v2h-2zM11 11h2v2h-2zM5 13h6v2h-6z",
    ],
  },
  "copy-sm": {
    box: 16,
    paths: [
      "M3 1h6v2h-6zM1 3h2v2h-2zM9 3h2v2h-2zM1 5h2v2h-2zM7 5h6v2h-6zM1 7h2v2h-2zM5 7h2v2h-2zM13 7h2v2h-2zM3 9h4v2h-4zM13 9h2v2h-2zM5 11h2v2h-2zM13 11h2v2h-2zM7 13h6v2h-6z",
    ],
  },
  "moon-sm": {
    box: 16,
    paths: [
      "M4 0h2v2h-2zM2 2h2v2h-2zM0 4h4v2h-4zM0 6h4v2h-4zM0 8h2v2h-2zM4 8h2v2h-2zM0 10h2v2h-2zM6 10h2v2h-2zM14 10h2v2h-2zM2 12h2v2h-2zM8 12h6v2h-6zM4 14h8v2h-8z",
    ],
  },
  "external-link-sm": {
    box: 16,
    paths: [
      "M9 1h6v2h-6zM3 3h4v2h-4zM11 3h4v2h-4zM1 5h2v2h-2zM9 5h2v2h-2zM13 5h2v2h-2zM1 7h2v2h-2zM7 7h2v2h-2zM1 9h2v2h-2zM11 9h2v2h-2zM1 11h2v2h-2zM11 11h2v2h-2zM3 13h8v2h-8z",
    ],
  },
  /* Node : aucun — COPIÉ DE NEUME, `arrow-up-right` : le `d` de `dist/24/arrow-up-right.svg` du paquet
   * `@neume-icons/svg`, au caractère près, au commit `45b03bb` du dépôt `neume`. Dix rectangles sur les
   * pixels IMPAIRS : le trait du haut, la diagonale, le retour. Appelant : `FeatureCard`, en lien. */
  "arrow-up-right": {
    box: 24,
    paths: [
      "M9 5h10v2h-10zM15 7h4v2h-4zM13 9h2v2h-2zM17 9h2v2h-2zM11 11h2v2h-2zM17 11h2v2h-2zM9 13h2v2h-2zM17 13h2v2h-2zM7 15h2v2h-2zM5 17h2v2h-2z",
    ],
  },
  "arrow-down": {
    box: 24,
    paths: ["M13 12h6v2h-2v2h-2v2h-2v2h-2v-2H9v-2H7v-2H5v-2h6V4h2v8Z"],
  },
  /* Node : aucun — COPIÉ du set 2.4.2, `svg/linkedin-2.svg`, variante au trait. 168 px d'encre, de
   * 2 à 22 dans les deux sens, sur les pixels PAIRS. */
  "linkedin-2": {
    box: 24,
    paths: [
      "M20 22H4v-2h16v2ZM4 20H2V4h2v16Zm18 0h-2V4h2v16ZM9 17H7v-6h2v6Zm6-6v2h-2v4h-2v-6h4Zm2 6h-2v-4h2v4ZM9 9H7V7h2v2Zm11-5H4V2h16v2Z",
    ],
  },
  /* Node : aucun — COPIÉ du set 2.4.2, `svg/github.svg`, variante au trait. 112 px d'encre, x
   * IMPAIRS de 1 à 21 et y pairs : un pixel à gauche du centre, comme l'amont le dessine. */
  github: {
    box: 24,
    paths: [
      "M5 2h4v2H7v2H5V2Zm0 10H3V6h2v6Zm2 2H5v-2h2v2Zm2 2v-2H7v2H3v-2H1v2h2v2h4v4h2v-4h2v-2H9Zm0 0v2H7v-2h2Zm6-12v2H9V4h6Zm4 2h-2V4h-2V2h4v4Zm0 6V6h2v6h-2Zm-2 2v-2h2v2h-2Zm-2 2v-2h2v2h-2Zm0 2h-2v-2h2v2Zm0 0h2v4h-2v-4Z",
    ],
  },
  /* Node : aucun — COPIÉ du set 2.4.2, `svg/link.svg`, variante non-`sharp`. 108 px d'encre, de 2 à
   * 22 en x et de 6 à 18 en y : deux maillons, un trait au milieu. */
  link: {
    box: 24,
    paths: [
      "M4 6h7v2H4zm0 10h7v2H4zM2 8h2v8H2zm18-2h-7v2h7zm0 10h-7v2h7zm2-8h-2v8h2zM7 11h10v2H7z",
    ],
  },
  /* Node : aucun — COPIÉ du set 2.4.2, `svg/more-horizontal.svg`, variante non-`sharp`. 48 px
   * d'encre, trois points de 4 sur 6, x IMPAIRS de 1 à 23 et y de 9 à 15 : un pixel à gauche du
   * centre, comme `github`. */
  "more-horizontal": {
    box: 24,
    paths: [
      "M3 9h2v2H3zm8 0h2v2h-2zm8 0h2v2h-2zM1 11h2v2H1zm8 0h2v2H9zm8 0h2v2h-2zM3 13h2v2H3zm8 0h2v2h-2zm8 0h2v2h-2zM5 11h2v2H5zm8 0h2v2h-2zm8 0h2v2h-2z",
    ],
  },
  /* Node : aucun — COPIÉ du set 2.4.2, `svg/x.svg`. Marque tierce : le set la livre, donc elle est
   * copiée et non relevée. 96 px d'encre, de 2 à 22 en x et de 4 à 20 en y, sur les pixels PAIRS. */
  x: {
    box: 24,
    paths: [
      "M6 20H4v-2h2v2Zm14-2h2v2h-6v-2h2v-2h2v2ZM8 18H6v-2h2v2Zm8 0h-2v-2h2v2Zm-6-2H8v-2h2v2Zm4 0h-2v-2h2v2Zm4 0h-2v-2h2v2Zm-6-2h-2v-2h2v2Zm4 0h-2v-2h2v2Zm-6-2H8v-2h2v2Zm4 0h-2v-2h2v2Zm-6-2H6V8h2v2Zm4 0h-2V8h2v2Zm4 0h-2V8h2v2ZM8 6H6v2H4V6H2V4h6v2Zm2 2H8V6h2v2Zm8 0h-2V6h2v2Zm2-2h-2V4h2v2Z",
    ],
  },
  /* Node : aucun — COPIÉ du set 2.4.2, `svg/bluesky.svg`. Marque tierce, copiée pour la raison de
   * `x`. 112 px d'encre, de 2 à 22 en x et de 3 à 21 en y : ses bords haut et bas sont sur des
   * pixels IMPAIRS, quand ceux de `x` et de `linkedin-2` sont sur des pixels pairs — le décalage
   * d'un pixel entre deux voisins d'une rangée, que l'angle mort n° 12 de
   * `.claude/rules/loi-05-icones.md` décrit pour les marques de la home. */
  bluesky: {
    box: 24,
    paths: [
      "M11 15h2v2h-2zm5-2h2v2h-2zm-8 0H6v2h2zm10-2h2v2h-2zM6 11H4v2h2zm14-6h2v6h-2zM4 5H2v6h2zm9 12h2v2h-2zm-2 0H9v2h2zm7-2h2v4h-2zM6 15H4v4h2zm9 4h3v2h-3zm-6 0H6v2h3zm8-16h3v2h-3zM7 3H4v2h3zm8 2h2v2h-2zM9 5H7v2h2zm4 2h2v2h-2zm-2 0H9v2h2zm0 2h2v2h-2z",
    ],
  },
  /* Node : aucun — COPIÉ du set 2.4.2, `svg/file-text.svg`, variante non-`sharp`, deux `d` comme
   * l'amont les sépare : le cadre de la feuille au coin plié, puis ses trois lignes de texte. 164 px
   * d'encre, de 4 à 20 en x et de 2 à 22 en y, sur les pixels PAIRS. */
  "file-text": {
    box: 24,
    paths: [
      "M6 4H4v16h2zm10-2H6v2h10zm4 4h-2v14h2zm-2 14H6v2h12zM16 4h2v2h-2zm-4 0h2v6h-2z",
      "M12 8h6v2h-6zm-4 8h8v2H8zm0-4h8v2H8zm0-4h2v2H8z",
    ],
  },
  /* Node : aucun — COPIÉ du set 2.4.2, `svg/scale.svg`, sans variante `-sharp` dans l'amont, trois
   * `d` comme l'amont les sépare : la flèche du coin haut droit, puis celle du coin bas gauche et le
   * trait qui ferme chacune. 80 px d'encre, de 3 à 21 dans les deux sens, sur les pixels IMPAIRS. */
  scale: {
    box: 24,
    paths: [
      "M13 9h2v2h-2zm2-2h2v2h-2zm2-2h2v2h-2zm2-2h2v8h-2z",
      "M13 3h8v2h-8zm-2 12H9v-2h2zm-2 2H7v-2h2zm-2 2H5v-2h2zm-2 2H3v-8h2z",
      "M11 21H3v-2h8z",
    ],
  },
  // Node `311:239` — 44 blocs, 176 px d'encre, sur les pixels PAIRS, encre de 2 à 21.
  claude: {
    box: 24,
    paths: [
      "M6 2h2v2H6zM12 2h2v4H12zM8 4h2v2H8zM16 4h2v2H16zM4 6h2v2H4zM10 6h2v2H10zM14 6h2v2H14zM20 6h2v2H20zM6 8h10v2H6zM18 8h2v2H18zM2 10h4v2H2zM8 10h10v2H8zM6 12h10v2H6zM18 12h4v2H18zM4 14h2v2H4zM8 14h10v2H8zM2 16h2v2H2zM8 16h2v2H8zM12 16h2v2H12zM18 16h2v2H18zM6 18h2v2H6zM10 18h2v4H10zM14 18h2v2H14zM16 20h2v2H16z",
    ],
  },
  // Node `311:160` — 48 blocs, 192 px d'encre, sur les pixels PAIRS, encre de 2 à 21.
  chatgpt: {
    box: 24,
    paths: [
      "M10 2h8v2H10zM4 4h6v2H4zM14 4h2v2H14zM18 4h2v4H18zM2 6h2v2H2zM8 6h2v2H8zM12 6h2v2H12zM2 8h4v2H2zM10 8h4v2H10zM16 8h4v2H16zM2 10h2v4H2zM6 10h4v2H6zM14 10h2v2H14zM20 10h2v4H20zM8 12h2v2H8zM14 12h4v2H14zM4 14h4v2H4zM10 14h4v2H10zM18 14h4v2H18zM4 16h2v4H4zM10 16h2v2H10zM14 16h2v2H14zM20 16h2v2H20zM8 18h2v2H8zM14 18h6v2H14zM6 20h8v2H6z",
    ],
  },
  /* Node `114:1656` (frame `pin/small`) — 28 blocs, 112 px d'encre, dans 16 × 16 et sur les pixels
   * PAIRS. Premier glyphe de 16 du système.
   * Ce n'est pas un `pin` de 24 réduit — le rasteriseur en supprimerait des pixels.
   *
   * UN DES DEUX GLYPHES DE LA TABLE DONT LE RENDU N'EST PAS SA GRILLE, et l'un des deux à porter
   * `size` — l'autre est `external-link-xs`. Le tracé reste écrit dans l'espace de 16, où il est
   * propre ; c'est son AFFICHAGE qui descend à 12,
   * sur décision de Florian (node `114:1893`, le même dessin mis à ×0,75 par Figma —
   * blocs de 1,5 px sur des demi-coordonnées). Ce que ça coûte est chiffré à `--size-icon-xs` dans
   * `semantic.css` : net en 2×, franges grises en 1×. NE PAS « corriger » les `d` pour les écrire
   * dans un espace de 12 — ils y tomberaient sur des demi-unités, et le dessin cesserait d'être
   * relevable contre son node. La sortie propre est un dessin neuf en 12 × 12 ou 6 × 6, pas une
   * réécriture de celui-ci. */
  pin: {
    box: 16,
    size: 12,
    paths: ["M12 0h4v4H12zM6 2h6v6H6zM2 4h4v4H2zM12 4h2v6H12zM0 6h2v2H0zM8 8h4v6H8zM8 14h2v2H8z"],
  },
  /* LES QUATRE GLYPHES DU THÈME — node `83:408` (`light/dark`), relevés avec la
   * révision de `ThemeSelector` (`docs/specs/2026-08-09-theme-selector-design.md` § 15). Grille de
   * 8 × 8 rendue en blocs de 2 × 2 dans une boîte de 16, comme la main de curseur `99:1048` — PAS
   * comme les marques, qui sont sur la grille de 24 en blocs de 1.
   *
   * DEUX PAIRES, ET UNE PAIRE N'EST PAS DEUX DESSINS. Le `-filled` de chaque paire n'AJOUTE que
   * l'intérieur de la silhouette : 4 pixels pour le soleil, 5 pour la lune, et pas un pixel de
   * contour déplacé. Vérifié dans les deux sens au relevé. C'est ce qui permet à `ThemeSelector`
   * de basculer de l'un à l'autre sans que le glyphe tremble — et donc ce qu'il ne faut pas casser
   * en retouchant un `d` : si le contour bougeait, la sélection ferait sauter le dessin.
   *
   * L'ÉTOILE DE LA LUNE EST DANS LES DEUX. Elle n'est pas un ornement du plein. */
  sun: {
    box: 16,
    paths: [
      "M6 0h2v2H6zM2 2h2v2H2zM12 2h2v2H12zM6 4h4v2H6zM4 6h2v4H4zM10 6h2v4H10zM14 6h2v2H14zM0 8h2v2H0zM6 10h4v2H6zM2 12h2v2H2zM12 12h2v2H12zM8 14h2v2H8z",
    ],
  },
  "sun-filled": {
    box: 16,
    paths: [
      "M6 0h2v2H6zM2 2h2v2H2zM12 2h2v2H12zM6 4h4v8H6zM4 6h2v4H4zM10 6h2v4H10zM14 6h2v2H14zM0 8h2v2H0zM2 12h2v2H2zM12 12h2v2H12zM8 14h2v2H8z",
    ],
  },
  moon: {
    box: 16,
    paths: [
      "M4 0h2v2H4zM2 2h2v6H2zM0 4h2v8H0zM4 8h2v2H4zM6 10h2v2H6zM14 10h2v2H14zM2 12h2v2H2zM8 12h6v2H8zM4 14h8v2H4z",
    ],
  },
  "moon-filled": {
    box: 16,
    paths: [
      "M4 0h2v2H4zM2 2h2v12H2zM0 4h2v8H0zM4 8h2v8H4zM6 10h2v6H6zM14 10h2v2H14zM8 12h6v2H8zM8 14h4v2H8z",
    ],
  },
  /* Node `195:1848` (frame `external-link/xs`) — 25 blocs, grille logique de 8 × 8, relevé
   * avec `StandaloneLink`. SECOND GLYPHE DE 12 DU SYSTÈME, et le second à porter `size`.
   *
   * `box: 16, size: 12` EST LE PATRON DE `pin`, ET C'EST DÉLIBÉRÉ. Le tracé s'écrit dans un espace
   * de 16 en blocs de 2 × 2 — où la grille de 8 tombe en coordonnées ENTIÈRES, comme celle de
   * `sun` et de `moon` — et c'est son AFFICHAGE qui descend à 12, sur décision de Florian :
   * « nous avons déjà fait des icons 12x12px, cale toi sur eux ». Ne réécris PAS les
   * `d` dans un espace de 12 : ils y tomberaient sur des demi-unités, et le dessin cesserait
   * d'être relevable contre son node — c'est mot pour mot ce que la docstring de `pin` interdit.
   *
   * CE QUE ÇA COÛTE : chaque bloc de la grille de 8 est peint sur 1,5 pixel CSS, donc franges
   * grises en densité 1× et net en 2×. Même angle mort que `pin`, et AUSSI SÉVÈRE — `pin` est lui
   * aussi une grille de 8 en blocs de 2, donc des blocs de 1,5 px à 12. La sortie, si Florian
   * juge les franges trop visibles, est `--size-icon-sm` : retirer `size`, aucun tracé à réécrire.
   *
   * IL N'EST PAS UNE RÉDUCTION D'`external-link`, qui est à 24 et vient du set. Deux dessins, deux
   * noms — `Icon` n'a pas de prop `size`, la taille est intrinsèque au nom. */
  "external-link-xs": {
    box: 16,
    size: 12,
    paths: [
      "M8 0h6v2H8zM14 0h2v8H14zM2 2h4v2H2zM12 2h2v2H12zM0 4h2v10H0zM10 4h2v2H10zM8 6h2v2H8zM6 8h2v2H6zM12 10h2v4H12zM2 14h10v2H2z",
    ],
  },
  /* Node : aucun — COPIÉ DE NEUME, `icons/grand.json`, `search` : la grille de 12 × 12 à 2 px par case,
   * décalée d'une demi-case (1 px), au caractère près du `dist/24/search.svg` du paquet. 15 rectangles,
   * 76 px d'encre, sur les pixels IMPAIRS : la lentille de 3 à 17, le manche jusqu'à 21. Appelant :
   * `SearchField`. */
  search: {
    box: 24,
    paths: [
      "M7 3h6v2h-6zM5 5h2v2h-2zM13 5h2v2h-2zM3 7h2v2h-2zM15 7h2v2h-2zM3 9h2v2h-2zM15 9h2v2h-2zM3 11h2v2h-2zM15 11h2v2h-2zM5 13h2v2h-2zM13 13h2v2h-2zM7 15h6v2h-6zM15 15h2v2h-2zM17 17h2v2h-2zM19 19h2v2h-2z",
    ],
  },
  /* Node : aucun — COPIÉ DE NEUME, `icons/petit.json`, `close` : la grille de 8 × 8 à 2 px par case dans
   * la boîte de 16, décalée d'une demi-case (1 px), au caractère près du `dist/16/close.svg` du paquet.
   * 9 blocs, 36 px d'encre, sur les pixels IMPAIRS de 3 à 13. Un dessin FAIT POUR 16, pas `close` réduit
   * (loi 5) : `close` reste le glyphe de 24, copié du set. Appelant : la croix de `SearchField`. */
  "close-sm": {
    box: 16,
    paths: [
      "M3 3h2v2h-2zM11 3h2v2h-2zM5 5h2v2h-2zM9 5h2v2h-2zM7 7h2v2h-2zM5 9h2v2h-2zM9 9h2v2h-2zM3 11h2v2h-2zM11 11h2v2h-2z",
    ],
  },
  /* Node : aucun — COPIÉ DE NEUME, `copy` : le `d` de `dist/24/copy.svg` du paquet `@neume-icons/svg`,
   * au caractère près, au commit `ab2e68d` du dépôt `neume`. 20 rectangles, 128 px d'encre, sur les
   * pixels PAIRS de 2 à 22 dans les deux sens : la feuille de devant et, derrière, celle dont on ne
   * voit que l'équerre en haut à gauche. Appelant : `CopyButton`. */
  copy: {
    box: 24,
    paths: [
      "M4 2h10v2h-10zM2 4h2v2h-2zM14 4h2v2h-2zM2 6h2v2h-2zM2 8h2v2h-2zM10 8h10v2h-10zM2 10h2v2h-2zM8 10h2v2h-2zM20 10h2v2h-2zM2 12h2v2h-2zM8 12h2v2h-2zM20 12h2v2h-2zM4 14h2v2h-2zM8 14h2v2h-2zM20 14h2v2h-2zM8 16h2v2h-2zM20 16h2v2h-2zM8 18h2v2h-2zM20 18h2v2h-2zM10 20h10v2h-10z",
    ],
  },
  /* Node : aucun — COPIÉ DE NEUME, `menu` : le `d` de `dist/24/menu.svg` du paquet `@neume-icons/svg`
   * (`/packages/svg/dist/24/menu.svg` du dépôt `neume`), au caractère près, au commit `45b03bb`. Trois
   * barres de 16 × 2 sur les pixels de 4 à 20 en x, à y = 5, 11 et 17 : 96 px d'encre, aucun pixel
   * à demi. Boîte de 24, aucun `size` — la seule taille que la loi 5 lui ouvre. Appelant : `NavBar`,
   * le bouton qui ouvre le panneau mobile (lot 2 du site de Neume, spec
   * `docs/specs/2026-11-11-lot-2-navigation-design.md` § 2.2). Neume est une source au même rang que
   * Pixelarticons (loi 5) ; ce n'est pas un relevé de node, l'angle mort n° 12 de `.claude/rules/loi-05-icones.md` ne le concerne pas. */
  menu: {
    box: 24,
    paths: ["M4 5h16v2h-16zM4 11h16v2h-16zM4 17h16v2h-16z"],
  },
  /* Node : aucun — COPIÉ DE NEUME, `alert-circle` : le `d` de `dist/16/alert-circle.svg` du paquet `@neume-icons/svg`, au
   * caractère près, au commit `45b03bb` du dépôt `neume`. Un cercle et un point d'exclamation. Boîte de 16, aucun `size` — un dessin FAIT POUR 16, pas `alert-circle` réduit (loi 5).
   * Appelant : `TextField` et `SubscribeForm` (le message négatif). Lot 3 du site de Neume (spec `docs/specs/2026-11-11-lot-3-retours-formulaires-design.md` § 2). Neume est une
   * source au même rang que Pixelarticons (loi 5) ; ce n'est pas un relevé de node, l'angle mort n° 12 de
   * `.claude/rules/loi-05-icones.md` ne le concerne pas. */
  "alert-circle-sm": {
    box: 16,
    paths: [
      "M5 1h6v2h-6zM3 3h2v2h-2zM7 3h2v2h-2zM11 3h2v2h-2zM1 5h2v2h-2zM7 5h2v2h-2zM13 5h2v2h-2zM1 7h2v2h-2zM13 7h2v2h-2zM1 9h2v2h-2zM7 9h2v2h-2zM13 9h2v2h-2zM3 11h2v2h-2zM11 11h2v2h-2zM5 13h6v2h-6z",
    ],
  },
  /* Node : aucun — COPIÉ DE NEUME, `check-circle` : le `d` de `dist/16/check-circle.svg` du paquet `@neume-icons/svg`, au
   * caractère près, au commit `45b03bb` du dépôt `neume`. Un cercle et une coche. Boîte de 16, aucun `size` — un dessin FAIT POUR 16, pas `check-circle` réduit (loi 5).
   * Appelant : `TextField` et `SubscribeForm` (le message positif). Lot 3 du site de Neume (spec `docs/specs/2026-11-11-lot-3-retours-formulaires-design.md` § 2). Neume est une
   * source au même rang que Pixelarticons (loi 5) ; ce n'est pas un relevé de node, l'angle mort n° 12 de
   * `.claude/rules/loi-05-icones.md` ne le concerne pas. */
  "check-circle-sm": {
    box: 16,
    paths: [
      "M5 1h6v2h-6zM3 3h2v2h-2zM11 3h2v2h-2zM1 5h2v2h-2zM11 5h4v2h-4zM1 7h2v2h-2zM5 7h2v2h-2zM9 7h2v2h-2zM13 7h2v2h-2zM1 9h2v2h-2zM7 9h2v2h-2zM13 9h2v2h-2zM3 11h2v2h-2zM11 11h2v2h-2zM5 13h6v2h-6z",
    ],
  },
  /* Node : aucun — COPIÉ DE NEUME, `alert-triangle` : le `d` de `dist/16/alert-triangle.svg` du paquet `@neume-icons/svg`, au
   * caractère près, au commit `45b03bb` du dépôt `neume`. Un triangle et un point d'exclamation. Boîte de 16, aucun `size` — un dessin FAIT POUR 16, pas `alert-triangle` réduit (loi 5).
   * Appelant : `TextField` (le message d'avertissement). Lot 3 du site de Neume (spec `docs/specs/2026-11-11-lot-3-retours-formulaires-design.md` § 2). Neume est une
   * source au même rang que Pixelarticons (loi 5) ; ce n'est pas un relevé de node, l'angle mort n° 12 de
   * `.claude/rules/loi-05-icones.md` ne le concerne pas. */
  "alert-triangle-sm": {
    box: 16,
    paths: [
      "M7 1h2v2h-2zM5 3h2v2h-2zM9 3h2v2h-2zM3 5h2v2h-2zM7 5h2v2h-2zM11 5h2v2h-2zM3 7h2v2h-2zM7 7h2v2h-2zM11 7h2v2h-2zM1 9h2v2h-2zM13 9h2v2h-2zM1 11h2v2h-2zM7 11h2v2h-2zM13 11h2v2h-2zM1 13h14v2h-14z",
    ],
  },
  /* Node : aucun — COPIÉ DE NEUME, `loader` : le `d` de `dist/24/loader.svg` du paquet `@neume-icons/svg`, au
   * caractère près, au commit `45b03bb` du dépôt `neume`. Un anneau ouvert en haut à droite. Boîte de 24, aucun `size`.
   * Appelant : `SubscribeForm` (l'envoi, glyphe qui tourne). Lot 3 du site de Neume (spec `docs/specs/2026-11-11-lot-3-retours-formulaires-design.md` § 2). Neume est une
   * source au même rang que Pixelarticons (loi 5) ; ce n'est pas un relevé de node, l'angle mort n° 12 de
   * `.claude/rules/loi-05-icones.md` ne le concerne pas. */
  loader: {
    box: 24,
    paths: [
      "M7 3h6v2h-6zM5 5h2v2h-2zM3 7h2v2h-2zM3 9h2v2h-2zM3 11h2v2h-2zM19 11h2v2h-2zM3 13h2v2h-2zM19 13h2v2h-2zM3 15h2v2h-2zM19 15h2v2h-2zM5 17h2v2h-2zM17 17h2v2h-2zM7 19h10v2h-10z",
    ],
  },
  /* Node : aucun — COPIÉ DE NEUME, `alert-circle` : le `d` de `dist/24/alert-circle.svg` du paquet `@neume-icons/svg`, au
   * caractère près, au commit `45b03bb` du dépôt `neume`. Un cercle et un point d'exclamation. Boîte de 24, aucun `size`.
   * Appelant : `Toaster` (le ton négatif). Lot 3 du site de Neume (spec `docs/specs/2026-11-11-lot-3-retours-formulaires-design.md` § 2). Neume est une
   * source au même rang que Pixelarticons (loi 5) ; ce n'est pas un relevé de node, l'angle mort n° 12 de
   * `.claude/rules/loi-05-icones.md` ne le concerne pas. */
  "alert-circle": {
    box: 24,
    paths: [
      "M7 3h10v2h-10zM5 5h2v2h-2zM17 5h2v2h-2zM3 7h2v2h-2zM11 7h2v2h-2zM19 7h2v2h-2zM3 9h2v2h-2zM11 9h2v2h-2zM19 9h2v2h-2zM3 11h2v2h-2zM11 11h2v2h-2zM19 11h2v2h-2zM3 13h2v2h-2zM19 13h2v2h-2zM3 15h2v2h-2zM11 15h2v2h-2zM19 15h2v2h-2zM5 17h2v2h-2zM17 17h2v2h-2zM7 19h10v2h-10z",
    ],
  },
  /* Node : aucun — COPIÉ DE NEUME, `check-circle` : le `d` de `dist/24/check-circle.svg` du paquet `@neume-icons/svg`, au
   * caractère près, au commit `45b03bb` du dépôt `neume`. Un cercle et une coche. Boîte de 24, aucun `size`.
   * Appelant : `Toaster` (le ton positif). Lot 3 du site de Neume (spec `docs/specs/2026-11-11-lot-3-retours-formulaires-design.md` § 2). Neume est une
   * source au même rang que Pixelarticons (loi 5) ; ce n'est pas un relevé de node, l'angle mort n° 12 de
   * `.claude/rules/loi-05-icones.md` ne le concerne pas. */
  "check-circle": {
    box: 24,
    paths: [
      "M7 3h10v2h-10zM5 5h2v2h-2zM17 5h2v2h-2zM3 7h2v2h-2zM19 7h2v2h-2zM3 9h2v2h-2zM15 9h2v2h-2zM19 9h2v2h-2zM3 11h2v2h-2zM13 11h2v2h-2zM19 11h2v2h-2zM3 13h2v2h-2zM7 13h2v2h-2zM11 13h2v2h-2zM19 13h2v2h-2zM3 15h2v2h-2zM9 15h2v2h-2zM19 15h2v2h-2zM5 17h2v2h-2zM17 17h2v2h-2zM7 19h10v2h-10z",
    ],
  },
  /* Node : aucun — COPIÉ DE NEUME, `info` : le `d` de `dist/24/info.svg` du paquet `@neume-icons/svg`, au
   * caractère près, au commit `45b03bb` du dépôt `neume`. Un cercle et un point d'exclamation. Boîte de 24, aucun `size`.
   * Appelant : `Toaster` (le ton neutre). Lot 3 du site de Neume (spec `docs/specs/2026-11-11-lot-3-retours-formulaires-design.md` § 2). Neume est une
   * source au même rang que Pixelarticons (loi 5) ; ce n'est pas un relevé de node, l'angle mort n° 12 de
   * `.claude/rules/loi-05-icones.md` ne le concerne pas. */
  info: {
    box: 24,
    paths: [
      "M7 3h10v2h-10zM5 5h2v2h-2zM17 5h2v2h-2zM3 7h2v2h-2zM11 7h2v2h-2zM19 7h2v2h-2zM3 9h2v2h-2zM19 9h2v2h-2zM3 11h2v2h-2zM11 11h2v2h-2zM19 11h2v2h-2zM3 13h2v2h-2zM11 13h2v2h-2zM19 13h2v2h-2zM3 15h2v2h-2zM11 15h2v2h-2zM19 15h2v2h-2zM5 17h2v2h-2zM17 17h2v2h-2zM7 19h10v2h-10z",
    ],
  },
  /* Node : aucun — COPIÉ DE NEUME, `inbox` : le `d` de `dist/24/inbox.svg` du paquet `@neume-icons/svg`, au
   * caractère près, au commit `45b03bb` du dépôt `neume`. Un bac ouvert. Boîte de 24, aucun `size`.
   * Appelant : `EmptyState` (glyphe par défaut). Lot 3 du site de Neume (spec `docs/specs/2026-11-11-lot-3-retours-formulaires-design.md` § 2). Neume est une
   * source au même rang que Pixelarticons (loi 5) ; ce n'est pas un relevé de node, l'angle mort n° 12 de
   * `.claude/rules/loi-05-icones.md` ne le concerne pas. */
  inbox: {
    box: 24,
    paths: [
      "M6 4h12v2h-12zM4 6h2v2h-2zM18 6h2v2h-2zM4 8h2v2h-2zM18 8h2v2h-2zM2 10h2v2h-2zM20 10h2v2h-2zM2 12h6v2h-6zM16 12h6v2h-6zM2 14h2v2h-2zM8 14h8v2h-8zM20 14h2v2h-2zM2 16h2v2h-2zM20 16h2v2h-2zM4 18h16v2h-16z",
    ],
  },
  /* Node : aucun — REPRIS D'`app/icon.svg`, le favicon du dépôt : le `d` de son `<path>`, les
   * montures, au caractère près, sans le carré de fond. 30 cellules d'une unité sur la grille de
   * 16, encre de 1 à 15 en x et de 5 à 10 en y. Les deux verres sont creux : 4 cellules de large
   * sur 3 de haut, de x = 2 à 5 et de 10 à 13, de y = 6 à 8 — c'est là que `LookingGlasses` pose
   * ses pupilles.
   *
   * `box: 16, size: 48` : le patron de `pin` INVERSÉ, et sans son prix. Le dessin reste écrit dans
   * l'espace de 16 du favicon, où il se compare à sa source ; c'est son AFFICHAGE qui monte, ×3,
   * donc chaque cellule fait 3 px CSS, et les pupilles de `LookingGlasses` s'y calent. Ne réécris PAS le `d` dans un espace de 48 : il cesserait d'être
   * comparable au favicon, et rien n'y gagnerait un pixel. */
  glasses: {
    box: 16,
    size: 48,
    paths: [
      "M2 5h1v1h-1zM3 5h1v1h-1zM4 5h1v1h-1zM5 5h1v1h-1zM10 5h1v1h-1zM11 5h1v1h-1zM12 5h1v1h-1zM13 5h1v1h-1zM1 6h1v1h-1zM6 6h1v1h-1zM9 6h1v1h-1zM14 6h1v1h-1zM1 7h1v1h-1zM6 7h1v1h-1zM7 7h1v1h-1zM8 7h1v1h-1zM9 7h1v1h-1zM14 7h1v1h-1zM1 8h1v1h-1zM6 8h1v1h-1zM9 8h1v1h-1zM14 8h1v1h-1zM2 9h1v1h-1zM3 9h1v1h-1zM4 9h1v1h-1zM5 9h1v1h-1zM10 9h1v1h-1zM11 9h1v1h-1zM12 9h1v1h-1zM13 9h1v1h-1z",
    ],
  },
};

/* Le `viewBox` vient de la GRILLE DE DESSIN, la classe de la TAILLE RENDUE : les deux coïncident
 * partout sauf sur `pin`, `external-link-xs` et `glasses`, les trois seuls glyphes à porter `size` —
 * voir la docstring de la table, qui dit pourquoi les deux premiers descendent à 12 pour des raisons
 * différentes, et pourquoi le troisième monte à 48 sans rien coûter. Un objet
 * plutôt qu'un ternaire imbriqué — à trois crans, la chaîne
 * `a ? x : b ? y : z` cesse de se lire, et un quatrième cran s'ajouterait ici sans la réécrire. */
const SIZE_CLASS = {
  12: "size-[var(--size-icon-xs)]",
  16: "size-[var(--size-icon-sm)]",
  24: "size-[var(--size-icon)]",
  48: "size-[var(--size-icon-lg)]",
} as const;

/**
 * Icon — un glyphe de 24 × 24, de 16 × 16 quand il est dessiné pour 16, de 12 × 12 si la loi 5
 * le nomme, ou de 48 × 48 quand il est un élément de composition — `glasses`, seul à ce jour.
 * Second des deux seuls fichiers, avec `logo.tsx`, que la loi 5 autorise à porter un `<svg>`
 * inline ; il l'était par son nom bien avant d'exister.
 *
 * DÉCORATIF, TOUJOURS. `aria-hidden` et `focusable="false"` sans condition. Le nom accessible
 * appartient au CONTRÔLE qui contient l'icône, jamais au glyphe : sans cette règle, un bouton
 * icône seule se lirait deux fois à l'assistance. C'est déjà la doctrine de `Logo`, et c'est
 * l'articulation de la loi 5 avec la loi 7, pas une exception à l'une des deux.
 *
 * SANS COULEUR PROPRE. `fill-current` fait descendre la couleur du parent, qui la pose avec un
 * token sémantique. C'est la seule mécanique possible : la couleur d'un glyphe change au survol
 * et à la sélection, or la loi 11 interdit qu'un état visuel soit une prop. `Icon` ne connaît
 * donc aucune des intentions de ses appelants, et n'a aucun token de couleur à déclarer.
 *
 * PAS DE PROP `size`, ET IL Y A POURTANT QUATRE TAILLES. La taille est
 * INTRINSÈQUE AU GLYPHE, portée par sa table et jamais par l'appel. Ce n'est pas un raccourci —
 * c'est la loi 5 prise au mot. Un même nom rendu à deux tailles serait deux dessins, et l'un des
 * deux serait une réduction dont le rasteriseur supprimerait des pixels ; une prop `size`
 * autoriserait précisément cet appel-là. Le fait que le système porte MAINTENANT une réduction, sur
 * décision de Florian, ne change rien à cet argument : elle est écrite à UNE ligne de la table, où
 * elle se relit, au lieu d'être ouverte à tous les appelants. 48 est arrivé avec un appelant,
 * `LookingGlasses`, et pour un seul glyphe : c'est encore la table qui le dit, pas l'appel.
 *
 * `cn()` : il compose une base et
 * une classe de taille, exactement comme `Logo` compose une base et une classe de marque.
 *
 * Histoire : `docs/history/icon.md`.
 */
export function Icon({ name }: IconProps) {
  const { box, size, paths } = GLYPH[name];

  return (
    <svg
      viewBox={`0 0 ${box} ${box}`}
      aria-hidden="true"
      focusable="false"
      className={cn("shrink-0 fill-current", SIZE_CLASS[size ?? box])}
    >
      {paths.map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  );
}
