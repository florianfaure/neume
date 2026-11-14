# Les copies du portfolio dans `site/`

**Règle : on ne modifie jamais une copie ici.** Les composants, les tokens et `lib/` naissent et se
modifient dans le portfolio (le dépôt `portfolio`, voisin de celui-ci) ; `site/` en garde des copies
identiques, octet pour octet. Un défaut se corrige dans le portfolio, puis on recopie. En phase 3,
ces copies seront remplacées par le paquet Consort.

Ce qui n'est pas une copie et qui est donc du site : `app/` (layout, pages), `data/`, `styles/site.css` (les mesures de page `--site-*`), `public/_headers` (ne garde que les règles du site : il a été copié du portfolio au temps 1, puis nettoyé de ses règles `/work/…` au temps 2), `next.config.ts`,
`wrangler.jsonc`, `package.json`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `scripts/`.
`app/layout.tsx` reprend les réglages de polices et les deux scripts de tête du layout du portfolio.

## Source

Commit du portfolio d'où viennent les copies : `40fb77a04efe464c41fc86a4ec104af28367ecae`

## Commandes

```bash
cd site
node scripts/copy-from-portfolio.mjs [chemin-du-portfolio]          # refait la copie (défaut : $PORTFOLIO_PATH ou ../../portfolio)
node scripts/copy-from-portfolio.mjs [chemin-du-portfolio] --check  # échoue si une copie diffère de sa source, ou si components/ui contient un fichier non déclaré
```

Après une mise à jour, remplace le commit ci-dessus par `git -C <portfolio> rev-parse HEAD`.
`npm run check` lance le `--check` ; sans portfolio sur la machine, il est sauté avec un avertissement.

## Fichiers copiés (59)

- `styles/globals.css`
- `styles/tokens/primitives.css`
- `styles/tokens/semantic.css`
- `public/fonts/geist-latin.woff2`
- `public/fonts/geist-latin-ext.woff2`
- `public/fonts/geist-mono-latin.woff2`
- `public/fonts/pixelify-sans.woff2`
- `public/fonts/geist-OFL.txt`
- `public/fonts/geist-mono-OFL.txt`
- `public/fonts/pixelify-sans-OFL.txt`
- `public/portrait-florian.jpeg`
- `lib/cn.ts`
- `lib/new-tab.tsx`
- `lib/shortcut.ts`
- `lib/toast.ts`
- `lib/use-copy-feedback.ts`
- `lib/use-keyboard-focus.ts`
- `components/ui/announcement.tsx`
- `components/ui/author-line.tsx`
- `components/ui/button.tsx`
- `components/ui/chip.tsx`
- `components/ui/chip-group.tsx`
- `components/ui/code-block.tsx`
- `components/ui/command-palette.tsx`
- `components/ui/copy-button.tsx`
- `components/ui/dialog.tsx`
- `components/ui/empty-state.tsx`
- `components/ui/exhibit.tsx`
- `components/ui/feature-card.tsx`
- `components/ui/footer.tsx`
- `components/ui/icon.tsx`
- `components/ui/icon-sheet.tsx`
- `components/ui/inline-code.tsx`
- `components/ui/kbd.tsx`
- `components/ui/list.tsx`
- `components/ui/list-row.tsx`
- `components/ui/logo.tsx`
- `components/ui/nav-bar.tsx`
- `components/ui/nav-item.tsx`
- `components/ui/pixel-preview.tsx`
- `components/ui/progress-bar.tsx`
- `components/ui/reveal.tsx`
- `components/ui/search-field.tsx`
- `components/ui/segmented-track.tsx`
- `components/ui/slider.tsx`
- `components/ui/subscribe-form.tsx`
- `components/ui/tab.tsx`
- `components/ui/table-of-contents.tsx`
- `components/ui/tag.tsx`
- `components/ui/text-area.tsx`
- `components/ui/text-field.tsx`
- `components/ui/file-field.tsx`
- `components/ui/text-link.tsx`
- `components/ui/theme-selector.tsx`
- `components/ui/tile.tsx`
- `components/ui/toaster.tsx`
- `components/ui/toggle-button.tsx`
- `components/ui/toggle-group.tsx`
- `components/ui/tooltip.tsx`
