# La page Docs de neume.dev

**Date :** 2026-11-13 · **Cadrage :** Florian, en conversation, sur une maquette jetable (branche
`docs-page`, `site/app/docs/`) · **Statut :** maquette validée, spec à valider

## 1. L'intention

neume.dev a une barre, une palette et un pied de page qui pointent vers `/docs`, et la page n'existe pas.
Elle doit exister avant que le dépôt passe en public : c'est là qu'un développeur apprend à se servir de
Neume, et le README du dépôt en sera tiré.

**Pour qui.** D'abord le développeur qui veut **récupérer toute la banque d'icônes**, en SVG avant tout.
Ensuite celui qui l'installe en React. Le designer curieux des tailles vient après.

**Ce que Florian veut, dans ses mots :** « une doc qui ressemble vraiment à une doc », simple, très claire,
peu d'éléments, un peu stylisée. Du texte, des blocs de code, des images ou des animations seulement
quand elles expliquent. Il faut « blinder en texte » : chaque bloc de code et chaque tableau est introduit
et expliqué, pour qu'on ne voie pas une pile de composants qu'on ne comprend pas. Elle raconte aussi
d'où vient Neume, l'origine du nom, et que Florian l'a dessiné.

## 2. Ce que Florian a tranché

| Question | Réponse |
| --- | --- |
| Le contenu | Tout le README, mieux expliqué, plus l'histoire de Neume, le nom et l'auteur. On suit la 0.2.0 : un seul dessin 12 × 12, au facteur exact `size / 12` |
| La grille d'icônes | Absente : l'accueil l'a déjà |
| La forme | Une seule page, avec le sommaire en barres sur le côté (`TableOfContents`). Le panneau qui passe par-dessus le texte au survol ne le gêne pas |
| La largeur | Celle du site (`--site-max-width`). Le rail du sommaire est aligné sur le signe de la barre, et le texte est serré contre les barres |
| Les démos | Oui, quand elles expliquent : la scène des tailles de l'accueil, l'aperçu pixel de `arrow-up` pour le centrage |
| Download all | Un .zip de tous les SVG à **24 px**, sur la page Docs. **Pas sur l'accueil** pour l'instant : Florian a un autre bouton à poser dans le header |
| L'auteur | `AuthorLine` du portfolio (sa photo, « Florian Faure », « Product Designer »). Pas de titre « Who draws it ». Liens en **boutons icône seule** : florianfaure.com (`globe`), LinkedIn, X (`x`, le logo X de Neume), GitHub |
| Consort | Peut être cité publiquement |
| Les composants manquants | Ils se font **dans le portfolio** (pour Consort), puis on les recopie. Le bloc de code sur plusieurs lignes est cadré dans une session portfolio à part (« Bloc de code multi-ligne pour la doc Neume ») |
| La langue | L'anglais, comme le reste du site |
| Le Changelog | Hors de ce lot, fait juste après |
| Le README | Réécrit à partir de la doc. Le logo provisoire (`.github/assets/logo.svg`, deux carrés) est remplacé par le vrai signe. L'image d'aperçu des icônes : Florian me laisse le choix (voir § 6) |
| `CLAUDE.md` | Corrigé : on retire la grille 8 × 8 et l'ancien tableau de calage. Le mini 8 × 8 reviendra peut-être plus tard, et on le réécrira à ce moment-là |
| La sortie | Une branche puis une PR. La fusion sur `main` met en production : c'est le geste de Florian. Le passage du dépôt en public vient après la doc, et c'est lui qui le fait |

## 3. Objectifs, non-objectifs, anti-objectifs

**Objectifs.** Un développeur qui arrive sur `/docs` doit pouvoir :
- récupérer toute la banque en un clic ;
- installer le bon paquet ;
- comprendre les props, les tailles nettes et lissées, le centrage, la couleur et l'accessibilité ;
- savoir comment évoluent les versions et comment demander une icône.

Il repart en sachant qui a fait Neume et pourquoi.

**Non-objectifs.** Pas de page par sujet. Pas de recherche dans la doc. Pas de coloration syntaxique (sauf
si le cadrage du bloc de code en décide autrement). Pas de doc pour d'autres frameworks que React et le
SVG. Pas de Changelog. Rien sur l'accueil.

**Anti-objectifs.**
- Une page qui empile des composants sans texte pour les relier.
- Une page qui modifie une copie du portfolio côté site.
- Une affirmation non vérifiée sur le code : chaque phrase technique doit être vraie pour `@neume-icons/*`
  0.2.0, à relire contre `packages/*/src` et les README.
- Une phrase inventée sur l'histoire de Florian.

## 4. La page

### 4.1 Les sections, dans l'ordre

Le texte de la maquette (`site/app/docs/docs.tsx`) est la **base validée**. Le builder la reprend, la
corrige si un fait est faux, et ne la raccourcit pas.

1. **En-tête** : le `Tag` de version (lu dans `@neume-icons/svg/package.json`), le titre « Docs » en
   Pixelify `text-h1`, une phrase d'introduction.
2. **Overview** : ce qu'est Neume, la grille de 12 × 12, un dessin pour toutes les tailles, et les trois
   façons de s'en servir (paquet React, paquet SVG, le zip).
3. **Install** : React (React 18 ou plus, ESM, types fournis), n'importe quelle autre pile (le cœur n'a
   aucune dépendance), « Just the files » avec le bouton **Download all SVG (24 px)**.
4. **React** : le nom PascalCase, un exemple, le tri des imports inutilisés, l'import par chemin, puis le
   tableau des props (`Exhibit`).
5. **Plain SVG** : `svg()`, `names`, `SIZES`, l'erreur sur une taille invalide, les fichiers `dist/` (12,
   16 et 24 px), et comment écrire son propre composant avec `@neume-icons/svg/render` et `/data`.
6. **Sizes** : `size / 12`, la scène des tailles avec son curseur, le net contre le lissé (tableau
   `Exhibit` avec des `Tag`), les tailles conseillées, l'arrondi des tailles hors liste.
7. **Centring** : pourquoi une tige d'un pixel ne peut pas être centrée dans une boîte paire, le
   demi-décalage, `PixelPreview` de `arrow-up`, les tailles où le centrage est exact.
8. **Colour and accessibility** : `currentColor` avec un exemple, puis décoratif par défaut ou nommé
   avec `title`.
9. **Versions** : la règle semver de `CLAUDE.md` (icône ajoutée = mineure, tracé corrigé = correctif,
   icône retirée ou renommée = majeure) en tableau, et les deux paquets toujours à la même version.
10. **Requests** : le lien vers une nouvelle issue, et ce qu'elle doit contenir.
11. **About Neume** : le nom, pourquoi il existe, comment il est fait, ce qui vient ensuite (Consort),
    puis `AuthorLine` et les quatre boutons icône, et la licence MIT.

**« Why it exists » est un brouillon.** Le paragraphe de la maquette est écrit à partir de faits relevés
(le portfolio utilisait 49 glyphes empruntés à Pixelarticons ; Neume a démarré le 6 novembre 2026 et la
0.1.0 est publiée le 11). Le vrai texte vient de Florian. Tant qu'il ne l'a pas donné, la page ne sort pas.

### 4.2 La mise en page

- **La grille.** Un conteneur à `--site-max-width`, gouttière `--layout-gutter`. À partir de `xl`, trois
  colonnes : deux marges égales et, au milieu, la colonne de contenu, **centrée dans la page**
  (demande de Florian). Le rail du sommaire est dans la marge de gauche : `TableOfContents` en barres,
  collant (`sticky top-32`), aligné sur le signe de la barre. Sous `xl`, pas de rail : la variante
  `pill` en bas de la fenêtre, comme la coque de lecture du portfolio.
- **Les mesures.** Une seule largeur pour tout le contenu, le texte comme les blocs de code, les tableaux
  et les démos : `--site-docs-copy-width` (48rem), un jeton du site dans `styles/site.css`. Florian ne
  veut pas de blocs plus larges que le texte, « ça fait bizarre ».
- **Le rythme.** `gap-32` entre les sections, `gap-6` dans une section. Un `h3` prend une marge haute
  de `mt-6`.
- **La typographie.** `h2` en `font-pixel text-h2 font-normal`, comme les sections de l'accueil. `h3` en
  `font-pixel text-body-lg font-normal`, comme les groupes du catalogue. La prose en
  `text-body text-text-secondary`, avec des puces en `text-text-tertiary`.
- **Les ancres.** Chaque section porte un `id` et `scroll-mt` pour passer sous la barre. Le `h2` a
  `tabIndex={-1}`, ce que `TableOfContents` attend de son appelant.

### 4.3 Les composants

Ils viennent tous du portfolio. Ceux qui sont déjà copiés servent tels quels : `NavBar`, `NavItem`,
`Button`, `ThemeSelector`, `CodeBlock`, `CopyButton`, `Footer`, `Icon`, `PixelPreview`, `Tag`.

Ce lot ajoute à la liste des copies (`scripts/copy-from-portfolio.mjs` et `COPIES.md`, commit à jour) :
`table-of-contents`, `inline-code`, `text-link`, `logo` (dont `TextLink` a besoin), `exhibit`, `quote`
(recopiée avec les autres, inutilisée pour l'instant : à retirer si rien ne s'en sert), `author-line`
et `public/portrait-florian.jpeg`.

**Le bloc de code sur plusieurs lignes, c'est `CodeBlock` lui-même.** Le cadrage portfolio a tranché une
extension (`extend`, commit `da14e66` du portfolio, spec `2026-11-13-bloc-de-code-multiligne-design`) :
l'API ne change pas, et `code` peut contenir des retours à la ligne, que le bouton copie en entier. La
fonction locale `Code` de la maquette, un `<pre>` brut marqué `GAPS`, disparaît : tous les extraits de la
page passent par `CodeBlock`. Le builder recopie les composants au commit du portfolio qui le contient,
et vérifie à l'œil sur la page et sur l'accueil tout ce que cette recopie apporte d'autre.
**La page ne sort pas** tant que Florian n'a pas validé ce `CodeBlock` (il est en `draft` sur
`/design-system` du portfolio), **ni** avec le `<pre>` brut.

*(Mon choix :)* **une seule PR**, marquée « pas prête à fusionner » tant que la validation de `CodeBlock`
ou le texte de Florian manque, puisque la fusion met en production.

Les petits assemblages de prose (`Section`, `H3`, `P`, `Ul`) restent dans `site/app/docs/` : ce sont des
classes posées par la page, comme le fait `app/(reading)/_render.tsx` dans le portfolio, pas des
composants du système.

### 4.4 La barre et le pied de page

La page reprend **la même barre et le même pied de page que l'accueil**. Aujourd'hui ils sont écrits
dans `app/_home/home.tsx` ; le builder les sort dans une pièce du site que les deux pages partagent,
pour qu'ils ne divergent pas. *(Mon choix : la maquette n'avait ni Search ni palette ⌘K. La page Docs
les garde, comme l'accueil : la palette ouvre la fiche d'une icône, ce qui sert aussi en lisant la doc.)*

### 4.5 Le zip

`site/public/neume-svg-24.zip` contient les 251 fichiers de `packages/svg/dist/24/`, à plat, chacun nommé
d'après son icône.

Comme les autres fichiers générés du dépôt, il est **produit par `npm run build` à la racine,
versionné, et `npm run check` refuse qu'il soit périmé**. Pour cela :
- il doit être **déterministe** : dates fixes, ordre trié ;
- **aucune dépendance nouvelle** : Node seul, `zlib`.

Le build distant de Cloudflare ne le régénère donc pas, il le sert tel quel. Le bouton pointe vers
`/neume-svg-24.zip` sans `newTab`, et le lien porte `download`, si `Button` le permet. Sinon, on le
consigne comme un manque du composant, sans le contourner.

### 4.6 Les métadonnées

`title` « Docs — Neume », une description d'une phrase, `alternates.canonical` `/docs`. L'image de
partage reste celle du site.

## 5. Hors de la page, dans le même lot

- **`CLAUDE.md`**, § « Ce qui ne se discute plus » : remplacer « Deux grilles » et l'ancien « calage » par
  la règle de la 0.2.0. Un seul dessin de 12 × 12 cases, servi à toute taille par pas de 4 de 12 à 64 au
  facteur exact `size / 12`. Net aux multiples de 12, lissé entre les deux. Le demi-décalage
  (`offset`) centre une tige d'une case. Dessiné dans Figma à 2 px par case. Écrire aussi qu'un mini
  8 × 8 est envisagé, pas décidé.
- **`README.md`** : réécrit à partir de la page, plus court qu'elle, avec un lien vers
  `https://neume.dev/docs` pour le détail. Le logo `.github/assets/logo.svg` devient le vrai signe : le
  vecteur de `site/components/brand.tsx`, en `currentColor` adapté au thème comme le provisoire.
- **Les README de `packages/svg` et `packages/react`** : à relire contre la page. On ne corrige que ce qui
  est faux.

## 6. Ce qui reste au builder

- Le découpage des fichiers de `site/app/docs/` et le nom de la pièce partagée barre et pied de page.
- Le mécanisme exact du zip, dans les contraintes du § 4.5.
- *(Mon choix)* **L'image d'aperçu reste dans le README** : sur GitHub, le README est la vitrine, et
  l'aperçu montre le set d'un coup d'œil. Elle est absente de la page Docs seulement.
- Les corrections de faits dans le texte de la maquette, signalées dans la PR.

## 7. Vérifier avant de rendre

- `npm run check` à la racine (zip à jour compris) et `npm run check` dans `site/` (copies comprises), au
  vert.
- La page à 1440 px et à 375 px, en clair et en sombre :
  - le rail et la pastille du sommaire ;
  - chaque ancre ;
  - le curseur des tailles ;
  - le zip téléchargé, qu'on ouvre ;
  - les quatre boutons icône et leurs bulles.
- Aucune erreur dans la console.
- Une PR sur la branche, sans fusion : la fusion met en production, c'est le geste de Florian.
