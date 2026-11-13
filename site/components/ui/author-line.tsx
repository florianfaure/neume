import Image from "next/image";

/**
 * AuthorLine — la signature d'auteur : la photo de Florian en carré de 48 px, son nom, son rôle. Elle
 * ferme le texte d'une page projet, juste avant le footer. Zéro prop : c'est toujours Florian, comme
 * `Portrait` et `ShareButton` n'en ont aucune — la photo, le nom et le rôle vivent ici, pas chez
 * l'appelant. Spec : `docs/specs/2026-10-16-signature-auteur-design.md` § 2.
 *
 * LA PHOTO EST CELLE DE `PORTRAIT`, ET `PORTRAIT` N'EST PAS RÉEMPLOYÉ. Le fichier
 * `/portrait-florian.jpeg` est déjà carré, 200 × 200, donc aucun visuel nouveau. Mais `Portrait` est
 * un LIEN qui bascule au survol, déclaré en un seul exemplaire sur tout le site : ce n'est pas le
 * même objet qu'une photo inerte à côté d'un nom, et le restyler par-dessus serait un sosie. L'image
 * est une donnée de contenu (loi 1), pas une valeur de design.
 *
 * LE CADRE EST CELUI DES IMAGES DE CASE STUDY, PAS CELUI DE `PORTRAIT` : `rounded-lg`, un filet
 * `--border-thin` en `--color-border-media`, et rien d'autre. Le passe-partout de 4 px de `Portrait`
 * est le cadre d'un objet interactif, dont la bordure change d'état ; sur une photo inerte de 48 px
 * il pèserait un sixième de sa largeur. Le filet reste NOIR dans les deux polarités, c'est la
 * docstring de `--color-border-media` dans `semantic.css`.
 *
 * LE FILET EST UN FRÈRE DE L'IMAGE, PAS UN STYLE SUR ELLE — même geste que le visuel d'un projet et
 * que le bloc image d'un case study (`app/(reading)/_render.tsx`). Un `box-shadow: inset` sur
 * l'enveloppe serait peint SOUS le contenu, et l'`<Image>`, qui la couvre entièrement, le
 * recouvrirait. `rounded-[inherit]` reprend le rayon de l'enveloppe sans le redéclarer, et
 * `overflow-hidden` impose la forme à l'image, un enfant absolu de `fill`.
 *
 * `alt=""` : la photo est DÉCORATIVE, le nom est écrit à côté — la raison pour laquelle `Logo` est
 * masqué à l'assistance. Rien à annoncer deux fois (loi 7).
 *
 * `sizes="48px"` est le côté de `--size-author-photo`, écrit en littéral pour la raison de
 * `Portrait` : c'est un attribut HTML évalué avant que la feuille de style soit connue, donc il ne
 * peut pas lire une variable CSS. À relire si le token change ; en export statique non optimisé,
 * Next ne l'émet pas.
 *
 * LE NOM EST EN GEIST GRAS, LE RÔLE EN PIXELIFY SANS — la famille et l'échelle de la ligne méta
 * sous le titre d'un projet, `font-pixel` `text-body-sm` en `--color-text-tertiary`. C'est le
 * contraste de familles que la loi 3 donne comme seul levier de hiérarchie d'une palette sans
 * accent : le nom, en texte primaire, passe devant le rôle. Les deux paires contre la surface de
 * page sont celles que `npm run check` tient déjà.
 *
 * `gap-3` ENTRE LA PHOTO ET LE TEXTE : 12 px, un demi-pas de la loi 2, légal parce qu'INTERNE — la
 * photo et le texte disparaissent ensemble quand on retire le composant. 16 aurait été un pas de
 * layout, c'est-à-dire de quoi séparer deux blocs ; le groupe photo, nom, rôle doit se lire comme un
 * seul objet. Il n'y a aucun écart entre les deux lignes de texte : l'interligne de chaque cran fait
 * l'air. Le bloc de 44 px est centré sur la photo de 48 par `items-center`, 2 px de part et d'autre.
 *
 * NON INTERACTIF, DONC UN SEUL ÉTAT, `default`. Ni lien, ni survol, ni bouton : la suite de la page,
 * c'est le footer, 96 px plus bas. Pour la même raison il n'y a NI libellé visible (« Written by »,
 * « About the author ») NI filet au-dessus : celui du footer arrive juste après, et deux traits
 * aussi proches se doubleraient.
 *
 * AUCUNE MARGE EXTÉRIEURE ET AUCUNE LARGEUR IMPOSÉE (lois 2 et 8) : la place est au parent, qui
 * pose sa signature 40 px sous la dernière section, et la ligne remplit ce qu'on lui donne. Aucune
 * porte d'entrée pour une classe venue de l'extérieur (loi 11) : zéro prop.
 *
 * COMPOSANT SERVEUR (`runtime: "server"`) : aucun état, aucune directive.
 *
 * Histoire : `docs/history/author-line.md`.
 */
export function AuthorLine() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative size-[var(--size-author-photo)] shrink-0 overflow-hidden rounded-lg">
        <Image src="/portrait-florian.jpeg" alt="" fill sizes="48px" className="object-cover" />

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] border-[length:var(--border-thin)] border-border-media"
        />
      </div>

      <div>
        <p className="font-body text-body font-bold text-text-primary">Florian Faure</p>
        <p className="font-pixel text-body-sm text-text-tertiary">Product Designer</p>
      </div>
    </div>
  );
}
