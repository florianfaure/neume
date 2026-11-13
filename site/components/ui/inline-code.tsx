type InlineCodeProps = {
  children: string;
};

/**
 * InlineCode — un nom de code cité dans une prose : un token, un composant, un fichier, une
 * commande. Une puce en `<code>`, en Geist Mono, posée au fil du texte. Spec :
 * `docs/specs/2026-10-16-code-en-ligne-design.md` § 4.
 *
 * UNE PUCE, ET NON LA FONTE SEULE. Les cinq références du benchmark — Tailscale, Neon, Clerk,
 * IFTTT, Exa — posent le code cité dans un fond et un filet : c'est ce qui le détache d'une phrase
 * dont il n'est pas un mot comme les autres. La chasse fixe dit que c'est du code ; la puce en
 * marque les bords, là où un nom long commence et finit.
 *
 * GEIST MONO, À 14 PX, EN TEXTE PRIMAIRE. C'est la troisième famille de la loi 3, réservée au code
 * et à rien d'autre : elle ne porte aucune hiérarchie, et une règle de `npm run check` la refuse
 * ailleurs que sur un `<code>`, un `<pre>`, un `<kbd>` ou un `<samp>` — d'où la balise. Pixelify
 * Sans a été essayée sur la maquette et écartée : elle fond le double tiret d'un token en un seul
 * tiret long, qui se lit comme une incise. Le cran de 14 px sur 20 est un cran sous la prose de 16
 * qui l'entoure, comme chez IFTTT : posée dans une ligne de 24 px, la puce tient dans l'interligne
 * sans l'écarter. Le texte est au primaire et non au gris de la prose, parce qu'il est seul dans sa
 * boîte et doit se lire d'un coup — le raisonnement de `Tag`.
 *
 * LE FOND ET LE FILET SONT DEUX TOKENS NEUFS, `--color-code-surface` et `--color-code-border`, aux
 * crans de la maquette que Florian a validée. Ils ne réemploient ni le fond détaché ni le filet
 * décoratif du système, dont ils partagent pourtant les valeurs : le premier est le fond d'un ÉTAT,
 * le survol d'une carte, et la puce est inerte ; le second sépare des sections et n'identifie
 * jamais un élément. Le pourquoi complet est à leur déclaration, dans `semantic.css`. Le filet fait
 * `--border-thin`, le rayon 4 px, le padding horizontal 4 px — un demi-pas de la loi 2, légal parce
 * qu'interne —, et il n'y a AUCUN padding vertical : la puce prend la hauteur de son interligne de
 * 20 px, et c'est ce qui la garde dans les 24 px de la ligne.
 *
 * LA PUCE NE SE COUPE JAMAIS EN FIN DE LIGNE : un token coupé à un tiret se lirait comme deux noms.
 * Le prix est qu'un nom trop long déborderait de sa colonne ; le plus long cité aujourd'hui mesure
 * environ 270 px et tient dans les 288 px utiles d'un écran de 320.
 *
 * AUCUNE LARGEUR ET AUCUNE MARGE (lois 2 et 8) : c'est un élément EN LIGNE, le premier composant du
 * système à se poser au milieu d'une phrase à côté de `TextLink`, et il hérite sa place du
 * paragraphe qui le contient. Une seule prop, `children`, une chaîne : ni variante, ni classe venue
 * de l'extérieur (loi 11).
 *
 * INERTE, DONC UN SEUL ÉTAT, `default` : ni lien, ni survol, ni focus. Le mode sombre passe par les
 * tokens, rien à écrire ici. COMPOSANT SERVEUR (`runtime: "server"`) : aucun état, aucune directive.
 *
 * Histoire : `docs/history/inline-code.md`.
 */
export function InlineCode({ children }: InlineCodeProps) {
  return (
    <code className="whitespace-nowrap rounded-md border-[length:var(--border-thin)] border-code-border bg-code-surface px-1 font-code text-body-sm text-text-primary">
      {children}
    </code>
  );
}
