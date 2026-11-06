# Neume

Un icon set pixel, produit à part entière (site neume.dev, paquets npm `@neume-icons/*`, licence MIT).
Il sera réutilisé par Consort, le design system de Florian Faure ; Consort ne démarre qu'une fois
Neume terminé. Dépôt privé jusqu'au lancement.

## Ce qui ne se discute plus

- **Deux grilles.** Grand : 12 × 12 cases. Petit : 8 × 8, pour les UI denses. Dessinées dans Figma
  à 2 px par case (pages « 24px » et « 16px »), sur une seule parité par icône ; la parité impaire
  centre une tige d'une case (`offset` = 1).
- **Le calage** (`packages/svg/src/render.js`, seule version) : toute taille par pas de 4 de 12 à 64 ; la plus
  grande version nette qui tient, centrée. 12 → grand ×1 · 16–20 → petit ×2 · 24–32 → ×2 ·
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
   tag et les paquets disent la même version, relance `npm run check`, puis publie svg puis react.
   Aucun jeton : npm reconnaît ce workflow comme « trusted publisher ». Ne renomme pas le fichier.

`.github/workflows/check.yml` rejoue `npm run check` sur chaque PR.
