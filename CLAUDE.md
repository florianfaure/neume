# Neume

Un icon set pixel, produit à part entière (site neume.dev, paquets npm `@neume-icons/*`, licence MIT).
Il sera réutilisé par Consort, le design system de Florian Faure ; Consort ne démarre qu'une fois
Neume terminé. Dépôt privé jusqu'au lancement.

## Ce qui ne se discute plus

- **Deux grilles.** Grand : 12 × 12 cases. Petit : 8 × 8, pour les UI denses. Dessinées dans Figma
  à 2 px par case (pages « 24px » et « 16px »), sur une seule parité par icône ; la parité impaire
  centre une tige d'une case (`offset` = 1).
- **Le calage** (`packages/svg/src/render.js`, seule version) : toute taille par pas de 4 de 12 à 64 ; la plus
  grande version nette qui tient, centrée. 12 → petit ×1 (grand ×1 sans petit) · 16–20 → petit ×2 · 24–32 → ×2 ·
  36–44 → ×3 · 48–56 → ×4 · 60–64 → ×5. Une case vaut toujours un nombre entier de pixels.
- **La source de vérité** est `icons/*.json`, écrite par `scripts/ingest.mjs` seulement. On ne la
  retouche pas à la main : on corrige dans Figma et on resynchronise (skill `/sync`).
- **Aucun secret Figma** dans le projet : Claude lit Figma par le Desktop Bridge.
- **Ce qui sort du dépôt est à Florian** : fusion, publication npm, passage en public.

## Commandes

```bash
npm run build   # génère packages/svg et packages/react depuis icons/*.json (fichiers générés, versionnés)
npm run check   # le vérificateur (+ paquets à jour + smoke test React) : rouge, rien ne sort
npm run sheet   # la planche de contrôle, sheet/index.html
```

## Paquets

Monorepo npm workspaces : `packages/svg` (`@neume-icons/svg`, le cœur) et `packages/react`
(`@neume-icons/react`). Ne jamais éditer à la main `packages/svg/src/data.js`, `packages/svg/dist/`
ni `packages/react/dist/` : `npm run build` les écrit, `npm run check` refuse qu'ils soient périmés.
Le React importe le cœur par `@neume-icons/svg/render` (aucune donnée tirée). Pas de `npm publish` ici.

## Sortir une version

Les deux paquets sortent toujours ensemble, à la même version (semver : une icône ajoutée = mineure,
un tracé modifié = correctif, une icône retirée ou renommée = majeure).

1. Sur une branche : `npm run version <x.y.z>` (met les deux `package.json`, la dépendance et le lock
   à jour, relance le build), commit, PR, fusion par Florian.
2. Florian crée une release GitHub au tag `v<x.y.z>`. `.github/workflows/release.yml` vérifie que le
   tag et les paquets disent la même version, relance `npm run check`, puis dépose svg puis react en
   attente (`npm stage publish`). Aucun jeton : npm reconnaît ce workflow comme « trusted publisher »,
   réglé pour la seule publication par étapes. Ne renomme pas le fichier.
3. Florian approuve les deux versions sur npmjs.com (ou `npm stage approve <id>`), avec sa 2FA, svg
   d'abord : c'est l'approbation qui les publie.

`.github/workflows/check.yml` rejoue `npm run check` sur chaque PR.

## Le site (`site/`)

Le site neume.dev vit dans `site/` : Next.js 16 / React 19 / Tailwind v4, **export statique** (`out/`), servi
par un Worker Cloudflare en assets statiques (`site/wrangler.jsonc`, nom `neume-dev`). Pleine largeur. `site`
est un **workspace npm** de la racine : `@neume-icons/react` y est le paquet local, et une seule copie de React
est installée (la racine épingle `react` et `react-dom` à la version du site, 19.2.8). Un `file:` aurait installé
une seconde copie de React sous les icônes (qui utilisent `useId`).

**Les copies.** Les composants, tokens, polices et `lib/` du site sont des copies du portfolio, listées dans
`site/COPIES.md` avec le commit d'origine. On ne les modifie **jamais** ici : on corrige dans le portfolio, puis
`node scripts/copy-from-portfolio.mjs` les recopie (`--check` échoue si l'une diffère). Elles seront remplacées
par le paquet Consort.

```bash
cd site
npm run dev      # http://localhost:3100
npm run check    # lint + tsc + copies:check + build (export dans site/out)
```

**Déploiement.** neume.dev est le Worker `neume-dev`, branché sur le domaine en Custom Domain
(`site/wrangler.jsonc`). Workers Builds le reconstruit depuis GitHub : **un push sur `main` met en production**,
toute autre branche produit une URL de preview. Réglages côté Cloudflare : racine du dépôt `/`, build
`npm run build -w site`, déploiement `npx wrangler deploy -c site/wrangler.jsonc`, preview
`npx wrangler preview -c site/wrangler.jsonc`. Le build distant ne lance **pas** `copies:check`, qui lit
`~/portfolio` : c'est `npm run check` en local qui le tient, avant de pousser. `www.neume.dev` redirige en 301
vers l'apex, par une Redirect Rule de zone. `npx wrangler deploy` depuis `site/` reste possible en secours ;
c'est un geste de Florian, comme tout ce qui touche le compte Cloudflare. `npm run check` de la racine ne
construit pas le site.

**Images de marque.** Le favicon (`icon.svg`, `favicon.ico`), l'icône Apple et l'image de partage sont des
fichiers de `site/app/`, générés par `node scripts/brand-assets.mjs` (depuis `site/`, Chrome et sharp) à partir
du vecteur du signe (`components/brand.tsx`). On relance le script quand le signe ou la composition change.
