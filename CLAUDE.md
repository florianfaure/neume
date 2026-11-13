# Neume

Un icon set pixel, produit à part entière (site neume.dev, paquets npm `@neume-icons/*`, licence MIT).
Il sera réutilisé par Consort, le design system de Florian Faure ; Consort ne démarre qu'une fois
Neume terminé. Dépôt privé jusqu'au lancement.

## Ce qui ne se discute plus

- **La grille.** Un seul dessin par icône, 12 × 12 cases, dessiné dans Figma à 2 px par case (page
  « 24px »). Le demi-décalage (`offset` = 1) centre une tige d'une case. Les données 8 × 8 de `icons/`
  ne sont pas rendues : une gamme mini est envisagée, pas décidée.
- **Le calage** (`packages/svg/src/render.js`, seule version) : toute taille par pas de 4 de 12 à 64, au
  facteur exact `size / 12`. Net aux multiples de 12 (une case = un nombre entier de pixels), lissé entre
  les deux. Une taille quelconque est arrondie vers le bas par `snap`.
- **La source de vérité** est `icons/*.json`, écrite par `scripts/ingest.mjs` seulement. On ne la
  retouche pas à la main : on corrige dans Figma et on resynchronise (skill `/sync`).
- **Aucun secret Figma** dans le projet : Claude lit Figma par le Desktop Bridge.
- **Ce qui sort du dépôt est à Florian** : fusion, publication npm, passage en public.

## Commandes

```bash
npm run build   # génère packages/svg, packages/react et le zip du site depuis icons/*.json (fichiers générés, versionnés)
npm run check   # le vérificateur (+ paquets à jour + smoke test React) : rouge, rien ne sort
npm run sheet   # la planche de contrôle, sheet/index.html
```

## Paquets

Monorepo npm workspaces : `packages/svg` (`@neume-icons/svg`, le cœur) et `packages/react`
(`@neume-icons/react`). Ne jamais éditer à la main `packages/svg/src/data.js`, `packages/svg/dist/`,
`packages/react/dist/`, `.github/assets/preview.svg` ni `site/public/neume-svg-24.zip` (le zip du bouton
« Download all » de la page Docs) : `npm run build` les écrit, `npm run check` refuse qu'ils soient périmés.
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

`.github/workflows/check.yml` rejoue `npm run check` sur chaque PR, puis le lint, les types et les tests du Worker du site.

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
npm run check    # lint + tsc + tests du Worker + copies:check + build (export dans site/out)
```

**La demande d'icône.** Le dialogue « Request an icon » (`app/_shell/request-dialog.tsx`) poste à
`/api/request`, le seul chemin où le Worker exécute du code (`site/worker/`, `run_worker_first: ["/api/*"]`).
Il vérifie Turnstile, valide, compte trois envois par heure et par connexion (Durable Object
`RequestLimiter`, empreinte salée, /64 en IPv6), retire les métadonnées de l'image (liste blanche, sans
décodage), la range dans le bucket R2 `neume-requests` et crée l'issue (`icon-request`) par l'API GitHub.
**Hors production, rien n'est créé ni rangé** : la production exige l'hôte `neume.dev` ET l'`Origin`
`https://neume.dev` (`wrangler dev` réécrit l'hôte en celui de la route). Secrets du Worker, posés par Florian
et jamais dans le dépôt : `GITHUB_TOKEN` (jeton à grain fin, Issues en écriture sur ce dépôt, un an),
`TURNSTILE_SECRET`, `IP_SALT`, posés en dernier `TURNSTILE_SECRET` (c'est lui qui ouvre le formulaire) ; les
previews ont les leurs (`npx wrangler preview secret put`, `TURNSTILE_SECRET` et `IP_SALT` suffisent) et leurs
bindings dans le bloc `previews` de `wrangler.jsonc`, qui n'hérite de rien ; en local, `site/.dev.vars` (copie de `.dev.vars.example`, clés de test).
La clé de site Turnstile, publique, est `TURNSTILE_SITE_KEY` dans `app/_shell/links.ts`. `npm run check` du site
lance les tests du Worker (`npm test -w site`, Vitest dans le runtime Workers). Pour essayer le tout en local :
`npm run build -w site && cd site && npx wrangler dev --port 8787`.

**Déploiement.** neume.dev est le Worker `neume-dev`, branché sur le domaine en Custom Domain
(`site/wrangler.jsonc`). Workers Builds le reconstruit depuis GitHub : **un push sur `main` met en production**,
toute autre branche produit une URL de preview (`preview_urls`, actif depuis le déploiement de production qui l'a introduit). Réglages côté Cloudflare : racine du dépôt `/`, build
`npm run build -w site`, déploiement `npx wrangler deploy -c site/wrangler.jsonc`, preview
`npx wrangler preview -c site/wrangler.jsonc`. Le build distant ne lance **pas** `copies:check`, qui lit
`~/portfolio` : c'est `npm run check` en local qui le tient, avant de pousser. `www.neume.dev` redirige en 301
vers l'apex, par une Redirect Rule de zone. `npx wrangler deploy` depuis `site/` reste possible en secours ;
c'est un geste de Florian, comme tout ce qui touche le compte Cloudflare. `npm run check` de la racine ne
construit pas le site.

**Images de marque.** Le favicon (`icon.svg`, `favicon.ico`), l'icône Apple et l'image de partage sont des
fichiers de `site/app/`, générés par `node scripts/brand-assets.mjs` (depuis `site/`, Chrome et sharp) à partir
du vecteur du signe (`components/brand.tsx`). On relance le script quand le signe ou la composition change.
