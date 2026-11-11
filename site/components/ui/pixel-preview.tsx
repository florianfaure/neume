import type { CSSProperties } from "react";

import { cn } from "@/lib/cn";

interface PixelPreviewProps {
  /**
   * Le dessin, une chaîne par ligne : `#` une case pleine, `.` une case vide — le format lisible des
   * fichiers `icons/*.json` de Neume. La grille est carrée : autant de lignes que de caractères par
   * ligne, 12 ou 8 aujourd'hui. Tout côté qui divise la boîte de 240 px en un nombre entier de pixels
   * convient (loi 6) ; le composant ne le vérifie pas.
   */
  rows: readonly string[];
  /**
   * Le décalage du dessin d'une demi-case, `0` ou `1` sur chaque axe, dans l'ordre `[x, y]`. C'est ce
   * qui centre une tige d'une case dans la boîte. Le damier suit le dessin. `[0, 0]` par défaut.
   */
  offset?: readonly [0 | 1, 0 | 1];
  /**
   * Le nom accessible de l'image, REQUIS : les cases ne sont pas annoncées, le nom dit ce que le dessin
   * est — « arrow-up, 12 × 12 cases ». Écrit par l'appelant, qui connaît l'icône (loi 7).
   */
  label: string;
  /**
   * La taille du cadre. `default` : il prend la taille de son contenu, boîte de 240 px, 290 px en tout.
   * `large` : le cadre prend toute la largeur que lui donne le parent, et le dessin, dans une boîte de
   * `--size-pixel-preview-box-lg` (288 px, une case de 24 px en 12 × 12, de 36 px en 8 × 8), s'y centre.
   * Sous `sm`, où 288 px ne tiennent plus dans un panneau de 375 px, la boîte retombe à 240 px : un saut
   * discret entre deux échelles entières (loi 6). Ajouté le 2026-11-11 pour `IconSheet`.
   */
  size?: "default" | "large";
}

/**
 * PixelPreview — l'aperçu d'un dessin pixel en grand, case par case, sur sa grille : un cadre posé sur la
 * page, un damier derrière les cases vides, le dessin plein par-dessus. Spec :
 * `docs/specs/2026-11-06-apercu-pixel-design.md` § 2. Quatrième composant du site de Neume, après
 * `SearchField`, `Slider` et `Tile`, et pour Consort : le portfolio n'a pas d'appelant pour lui.
 * Il ne connaît pas Neume : il reçoit un dessin, pas une icône.
 *
 * L'ANATOMIE, CELLE DU PROTOTYPE VALIDÉ — fond C, le damier ; cadre sur la page avec un filet ; ni axes,
 * ni version 8 × 8 à côté. Écartés au cadrage : un point par case vide, les lignes de la grille, rien ;
 * le cadre sur le gris le plus clair sans filet. LE CADRE : un filet d'1 px en `--color-border-subtle`
 * (le filet décoratif du système, celui du prototype), le rayon `--radius-2xl` d'`Tile`, 24 px de
 * marge intérieure. Il prend la taille de son contenu — ni largeur ni centrage : l'appelant le pose.
 * LA BOÎTE : un carré de `--size-pixel-preview-box`, 240 px. Une case y mesure 20 px pour 12 × 12, 30 px
 * pour 8 × 8, toujours un entier. Le cadre mesure 240 + 2 × 24 + le filet, et tient dans 375 px.
 *
 * LE DAMIER suit le dessin : une case vide sur deux — celles dont (x + y) est pair — prend
 * `--color-pixel-preview-check`, le gris des pistes ; les autres gardent la page. Quand le dessin est
 * décalé d'une demi-case, le damier l'est avec lui et la boîte le coupe en demi-cases sur ses bords :
 * c'est ce qui montre qu'une tige d'une case tombe au centre. Aucun axe n'est tracé. Le dessin plein est
 * en texte primaire, ses cases d'une même ligne fusionnées en un bloc, comme le fait Neume.
 *
 * LE RENDU : AUCUN SVG. La loi 5 réserve le SVG inline à `icon.tsx` et `logo.tsx`, et un aperçu
 * dessiné à partir de données n'est ni une icône ni un logo : le premier jet, en SVG, rougissait
 * `npm run check`, et Florian a tranché de ne pas toucher à la loi (2026-11-06). LE DAMIER est UN seul
 * fond CSS sur la boîte, un `repeating-conic-gradient` à deux couleurs — transparent, donc la page, et
 * `--color-pixel-preview-check` —, dont la tuile fait deux cases de côté et dont les quadrants haut-gauche
 * et bas-droite sont peints : une case du damier est une case du dessin. Il est posé au décalage du dessin
 * (`offset`, en demi-cases) et la boîte, en `overflow-hidden`, le coupe en demi-cases sur ses bords : la
 * parité est celle de l'ancien rendu, la case (x + y) paire peinte. LE DESSIN est une pile de `<span>`
 * `aria-hidden`, en absolu, un par rectangle de cases pleines d'une même ligne.
 * AUCUNE MESURE EN DUR : la boîte pose `--cell`, `--size-pixel-preview-box` divisé par `n`, et tout
 * s'écrit en multiples de `--cell` — 20 px pour 12 × 12, 30 px pour 8 × 8, un entier (loi 6) ; la demi-case
 * tombe sur 10 ou 15 px. Un `n` qui ne divise pas 240 donnerait des fractions : c'est le contrat de
 * `rows`, que le composant ne vérifie pas. Ni `image-rendering` ni `crispEdges` : des rectangles CSS à
 * coordonnées entières n'ont pas de bord à lisser.
 *
 * L'ACCESSIBILITÉ. `role="img"` et le `label` de l'appelant ; les blocs ne sont pas annoncés.
 * Le damier est décoratif (loi 7) : il ne porte aucun sens, le dessin plein est lu par son nom.
 *
 * AUCUN ÉTAT (loi 4) : le composant n'est pas interactif. SERVEUR : rien à retenir.
 *
 * LA TAILLE `large`, DU 2026-11-11 (`extend`, spec `docs/specs/2026-11-11-fiche-icone-design.md` § 2) : la fiche
 * d'une icône veut le contour sur toute la largeur de sa colonne et le dessin centré dedans, un cran plus
 * grand. Le cadre prend alors la largeur du parent (loi 8 : il remplit ce qu'on lui donne) et la boîte
 * passe à `--size-pixel-preview-box-lg`, 288 px — 24 px par case en 12 × 12 et 36 en 8 × 8, deux entiers,
 * quand 300 px donnaient 37,5 px en 8 × 8. Sous `sm` la boîte reste à 240 px pour tenir dans un panneau
 * de 375 px. La taille se lit dans `--box`, posée sur la boîte et lue par `--cell` : rien d'autre ne
 * change, ni le damier ni le dessin. La valeur par défaut est celle d'avant.
 *
 * Histoire : `docs/history/pixel-preview.md`.
 */
export function PixelPreview({
  rows,
  offset = [0, 0],
  label,
  size = "default",
}: PixelPreviewProps) {
  const large = size === "large";
  const n = rows.length;
  const dx = offset[0] / 2;
  const dy = offset[1] / 2;

  const ink: { x: number; y: number; w: number }[] = [];
  rows.forEach((row, y) => {
    for (const m of row.matchAll(/#+/g)) {
      ink.push({ x: m.index + dx, y: y + dy, w: m[0].length });
    }
  });

  return (
    <div
      className={cn(
        "rounded-2xl border-[length:var(--border-thin)] border-border-subtle p-6",
        large ? "flex w-full justify-center" : "w-fit",
      )}
    >
      <div
        role="img"
        aria-label={label}
        className={cn(
          "relative block h-[var(--box)] w-[var(--box)] shrink-0 overflow-hidden",
          "[--box:var(--size-pixel-preview-box)]",
          large && "sm:[--box:var(--size-pixel-preview-box-lg)]",
        )}
        style={
          {
            "--cell": `calc(var(--box) / ${n})`,
            backgroundImage:
              "repeating-conic-gradient(transparent 0 25%, var(--color-pixel-preview-check) 0 50%)",
            backgroundSize: "calc(var(--cell) * 2) calc(var(--cell) * 2)",
            backgroundPosition: `calc(var(--cell) * ${dx}) calc(var(--cell) * ${dy})`,
          } as CSSProperties
        }
      >
        {ink.map(({ x, y, w }) => (
          <span
            key={`${x},${y}`}
            aria-hidden="true"
            className="absolute bg-text-primary"
            style={{
              left: `calc(var(--cell) * ${x})`,
              top: `calc(var(--cell) * ${y})`,
              width: `calc(var(--cell) * ${w})`,
              height: "var(--cell)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
