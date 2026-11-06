# Neume

Un icon set pixel, produit à part entière (site neume.dev, paquets npm `@neume-icons/*`, licence MIT).
Il sera réutilisé par Consort, le design system de Florian Faure ; Consort ne démarre qu'une fois
Neume terminé. Dépôt privé jusqu'au lancement.

## Ce qui ne se discute plus

- **Deux grilles.** Grand : 12 × 12 cases. Petit : 8 × 8, pour les UI denses. Dessinées dans Figma
  à 2 px par case (pages « 24px » et « 16px »), sur une seule parité par icône ; la parité impaire
  centre une tige d'une case (`offset` = 1).
- **Le calage** (`src/render.js`, seule version) : toute taille par pas de 4 de 12 à 64 ; la plus
  grande version nette qui tient, centrée. 12 → grand ×1 · 16–20 → petit ×2 · 24–32 → ×2 ·
  36–44 → ×3 · 48–56 → ×4 · 60–64 → ×5. Une case vaut toujours un nombre entier de pixels.
- **La source de vérité** est `icons/*.json`, écrite par `scripts/ingest.mjs` seulement. On ne la
  retouche pas à la main : on corrige dans Figma et on resynchronise (skill `/sync`).
- **Aucun secret Figma** dans le projet : Claude lit Figma par le Desktop Bridge.
- **Ce qui sort du dépôt est à Florian** : fusion, publication npm, passage en public.

## Commandes

```bash
npm run check   # le vérificateur : rouge, rien ne sort
npm run sheet   # la planche de contrôle, sheet/index.html
```
