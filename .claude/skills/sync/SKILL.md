---
name: sync
description: Importe les icônes dessinées par Florian dans Figma vers icons/*.json et ouvre une PR. Déclencher sur « sync », « sync les icônes », « importe les icônes », « j'ai dessiné / corrigé des icônes ».
---

# Sync Figma → Neume

Aucun jeton Figma : on lit le fichier ouvert dans Figma desktop, par le plugin **Desktop Bridge**
(outils `figma-console`). Si `figma_execute` ne répond pas, demande à Florian d'ouvrir le fichier
« Consort - Icons » et de lancer le plugin, puis réessaie. Ne contourne jamais par l'API REST.

Le contrôle est fait par le code, pas par toi : `figma/extract.js` rastérise et refuse, `scripts/ingest.mjs`
compare et écrit, `scripts/check.mjs` tranche. Tu transportes les données, tu ne les corriges pas.

## Étapes

1. **Branche.** Depuis `main` à jour : `git switch -c sync/AAAA-MM-JJ` (suffixe `-2`, `-3` si elle existe).
2. **Empreintes.** Lis `figma/extract.js`, passe son contenu à `figma_execute` avec `MODE = "digest"`
   et `ONLY = []` (timeout 120000). Écris le résultat JSON tel quel dans le scratchpad
   (`digests.json`).
3. **Diff.** `node scripts/ingest.mjs <digests.json>` imprime `ONLY = [...]`, ou « Rien n'a changé ».
   Rien de changé et aucune refusée : dis-le à Florian, supprime la branche, arrête-toi.
4. **Lecture complète.** Relance `figma/extract.js` avec `MODE = "full"` et la liste `ONLY` recopiée
   à l'identique. Écris le résultat dans `full.json`.
5. **Écriture.** `node scripts/ingest.mjs <digests.json> <full.json>`. Il refuse si une lecture ne
   correspond pas à son empreinte : relis alors l'étape 4, ne modifie jamais `icons/*.json` à la main.
6. **Contrôle.** `npm run check` doit être vert. Rouge : n'ouvre pas de PR, donne l'erreur à Florian.
7. **Commit et PR.** Un commit `sync: <ajoutées>, <modifiées>` ; pousse la branche ; `gh pr create`
   avec, dans le corps : les icônes ajoutées, modifiées, retirées, les refusées et **pourquoi**
   (message de l'extraction, traduit en geste Figma : « décale la poignée d'1 px », etc.), et
   « `npm run sheet && open sheet/index.html` pour voir le rendu de 12 à 64 ».
8. **Rends compte** à Florian en quelques puces. **La fusion est à lui.**

## Les refus, et ce qu'ils veulent dire dans Figma

| Message | Geste |
|---|---|
| blocs hors grille ou parités mélangées | une partie est décalée d'1 px par rapport au reste |
| cadre W × H | le cadre doit faire 24 × 24 (pages 24px et 24px solid) ou 16 × 16 (page 16px) |
| pivoté ou mis à l'échelle | remettre rotation à 0 et échelle à 100 % |
| contour / arrondi / opacité / pas en noir plein | formes pleines, noir #000, opacité 100 %, sans rayon |
| opération booléenne | aplatir (Cmd+E) |
| contient une courbe | redessiner en blocs |
| nom en double | renommer l'un des deux cadres |

Une icône refusée garde sa version précédente : un refus ne casse jamais le set.

## La page « 24px solid »

Elle est lue comme les autres (jeu `solid`, clés `solid/<nom>` dans `ONLY`). Chaque cadre y porte le nom de
son icône de la page 24px, sans suffixe : c'est le build qui publie `<nom>-solid`. Une icône ajoutée sur la
page 24px sans son solide (ou l'inverse) fait échouer `npm run check` : dis à Florian lequel manque.
