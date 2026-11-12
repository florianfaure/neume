import { CopyButton } from "@/components/ui/copy-button";

interface CodeBlockProps {
  /**
   * La ligne de code, en texte brut : une commande, une instruction. UNE LIGNE — le bloc ne coupe
   * pas et ne montre pas de retours à la ligne ; plusieurs lignes n'ont aucun usage au cadrage.
   * C'est aussi la chaîne que le bouton copie : ce qu'on lit est ce qu'on obtient.
   */
  code: string;
  /**
   * Le nom du bouton de copie, et le texte de sa bulle — « Copy command ». Requis : le bouton est une
   * icône seule, et une icône sans nom ne s'écrit pas (loi 7).
   */
  label: string;
  /**
   * Le mot de confirmation du bouton de copie, transmis tel quel à `CopyButton` — défaut « Copied! »,
   * celui de `CopyButton` (anonymisation pour Consort, 2026-11-11, spec
   * `docs/specs/2026-11-11-anonymisation-design.md` § 2).
   */
  copiedLabel?: string;
}

/**
 * CodeBlock — une ligne de code à copier : sur le site de Neume, `npm i @neume-icons/react`. Cadré
 * avec Florian, en conversation et sur un prototype en localhost, SANS benchmark Mobbin (mis en pause
 * par Florian le 2026-11-07). Spec : `docs/specs/2026-11-07-copie-et-bloc-de-code-design.md` § 3.
 *
 * LA DISPOSITION A, CELLE QUE FLORIAN A CHOISIE : la ligne de code sur sa surface, le bouton de copie
 * dedans, à droite. Écartés sur le prototype : B, une barre d'en-tête au-dessus du code ; C, le filet
 * sans fond ; D, le mot « Copy » au lieu de l'icône.
 *
 * LA SURFACE EST LA PUCE D'`InlineCode` EN PLUS GRAND : le fond et le filet de code, le rayon
 * `--radius-2xl` — celui des surfaces du site de Neume —, 16 px de marge intérieure à gauche et 4 px
 * autour du bouton (un demi-pas de la loi 2, légal parce qu'interne, comme le padding de la puce).
 * LE FOND ET LE FILET SONT SOUS DES NOMS À LUI, `--color-code-block-surface` et
 * `--color-code-block-border`, et non ceux de la puce : une valeur partagée n'est pas un alias. Ce sont
 * des JUMEAUX de la puce, inscrits à `DESIGN.md` aux groupes 2 et 4 (loi 10) ; la raison est à leur
 * déclaration dans `semantic.css`. Le bloc est un objet posé sur la page, qui porte un contrôle ; la
 * puce est un mot dans une phrase.
 *
 * LE BOUTON NE SE VOIT QU'AU SURVOL, ET C'EST UNE ÉGALITÉ À TENIR : le fond du secondaire au repos
 * (`--color-button-surface-secondary`) et celui du bloc sont le même primitif dans les deux
 * polarités — `--neutral-50` en clair, `--neutral-975` en sombre, vérifié à la construction. Le
 * jour où l'un des deux bouge, le bouton se dessine au repos ; c'est une raison de plus pour que les
 * deux restent dans le même groupe de jumeaux. Aucun style de bouton n'est posé ici : `CopyButton`
 * est composé tel quel, et la loi 9 interdit de le restyler par-dessus.
 *
 * LA HAUTEUR VIENT DU BOUTON : 36 px de bouton et 4 px de marge de chaque côté font 44 px DANS le
 * filet, ce qui est aussi la hauteur de la cible de pointage du bouton — son calque de 44 px tient
 * dans la marge, sans en sortir ni en recouvrir un autre (loi 5). Le filet de 1 px s'ajoute autour : la
 * boîte dessinée mesure 46 px. Aucune hauteur n'est écrite.
 *
 * LE CODE EST UN `<pre><code>`, LE PREMIER `<pre>` DU SYSTÈME, en `font-code text-body-sm` et en texte
 * primaire — Geist Mono à 14 px, comme `InlineCode`, qui est la raison de la balise : une règle de
 * `npm run check` refuse `font-code` ailleurs que sur `<code>`, `<pre>`, `<kbd>` et `<samp>` (loi 3).
 * Le `<code>` porte la police et la couleur, le `<pre>` la place. Il tient sur UNE ligne
 * (`whitespace-nowrap`) et, s'il déborde, il défile à l'horizontale dans sa place : `min-w-0 flex-1`
 * l'empêche de repousser le bouton, qui garde sa colonne. La barre de défilement est masquée : une
 * barre classique ajouterait sa hauteur au bloc, et le défilement reste possible au pointeur et au
 * toucher. Le défilement n'a pas de focus : le bouton est la voie du clavier vers la ligne, qu'il
 * copie entière.
 *
 * LA LARGEUR EST CELLE DE L'APPELANT (loi 8) : le bloc remplit son conteneur, sans largeur ni marge à
 * lui.
 *
 * COMPOSANT SERVEUR : il ne tient aucun état, `CopyButton` porte la directive. Il est DÉCLARÉ
 * INTERACTIF au manifeste, comme `SkipLink` et `ShareButton` qui composent un `Button` : un bouton qu'on
 * atteint au clavier est dans le composant, et dire le contraire pour échapper aux états serait une
 * fraude au contrat (loi 4). `elements` reste vide : le `<button>` est rendu par `Button`, et ses
 * états sont ceux de `CopyButton`.
 *
 * Écartés : plusieurs lignes, la coloration syntaxique, les onglets npm / pnpm / yarn — aucun usage.
 *
 * ANONYMISÉ POUR CONSORT, le 2026-11-11 (décision de Florian, spec
 * `docs/specs/2026-11-11-anonymisation-design.md` § 2) : `copiedLabel`, transmis à `CopyButton`,
 * remplace le mot de confirmation écrit en dur ; aucun pixel ne bouge.
 *
 * Histoire : `docs/history/code-block.md`.
 */
export function CodeBlock({ code, label, copiedLabel }: CodeBlockProps) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border-[length:var(--border-thin)] border-code-block-border bg-code-block-surface p-1 pl-4">
      <pre className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none]">
        <code className="whitespace-nowrap font-code text-body-sm text-text-primary">{code}</code>
      </pre>
      <CopyButton value={code} label={label} content="icon" copiedLabel={copiedLabel} />
    </div>
  );
}
