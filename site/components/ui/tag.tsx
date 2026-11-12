import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/**
 * Gestionnaires et attributs qui rendraient Tag interactif malgré sa déclaration
 * `interactive: false` au manifeste (`.claude/rules/loi-04-etats.md`, exception « composant non
 * interactif avec des états »). Sans cette exclusion, `TagProps` hériterait via
 * l'extension des props natives de span un `onClick` qui compilerait, fonctionnerait à la
 * souris, et resterait inatteignable au clavier — ni `tabIndex`, ni `role`, ni
 * `:focus-visible` : l'anti-patron `<div onClick>` que rien d'autre dans le repo n'attrape.
 * Le type rend ce mensonge impossible plutôt que simplement non documenté (loi 11,
 * « la barrière est typée »). Limité aux gestionnaires de pointeur et de clavier, plus
 * `role` et `tabIndex` : ce sont eux qui rendraient l'élément focusable ou sémantiquement
 * interactif. `onFocus` et `onBlur` ne sont pas exclus — sans `tabIndex`, un span ne peut
 * de toute façon pas recevoir le focus, donc ils ne se déclencheraient jamais.
 *
 * Nom court délibérément : la loi 11 exige que l'`Omit` qui suit tienne sur une seule ligne
 * avec `"className"`, pour que son grep de contrôle passe (Prettier à 100 colonnes).
 */
type InertSpanEvents =
  | "onClick"
  | "onDoubleClick"
  | "onMouseDown"
  | "onMouseUp"
  | "onMouseEnter"
  | "onMouseLeave"
  | "onMouseOver"
  | "onMouseOut"
  | "onMouseMove"
  | "onPointerDown"
  | "onPointerUp"
  | "onPointerEnter"
  | "onPointerLeave"
  | "onPointerOver"
  | "onPointerOut"
  | "onPointerMove"
  | "onPointerCancel"
  | "onTouchStart"
  | "onTouchEnd"
  | "onTouchMove"
  | "onTouchCancel"
  | "onKeyDown"
  | "onKeyUp"
  | "onKeyPress"
  | "role"
  | "tabIndex";

type TagProps = Omit<ComponentProps<"span">, "className" | "style" | InertSpanEvents>;

/**
 * Tag — étiquette de métadonnée, non interactive : elle ne reçoit ni le pointeur ni le
 * clavier, et n'a donc aucun des cinq états de la loi 4. Une pill, à poser à côté d'un titre
 * pour y accrocher un mot court — un statut, une année —, jamais comme un contrôle ni comme un
 * lien. Le contenu est libre : le composant ne connaît aucun libellé.
 *
 * UN SEUL ASPECT, et la prop `variant` est partie avec le second. La loi 10 dit d'une variante sans
 * appelant ce qu'elle dit d'un token mort. C'est réversible sans rien casser — un second aspect
 * revient comme il est parti, une entrée dans un objet de classes et une union de deux littéraux.
 * Ce qui ne revient PAS tout seul, ce sont les deux tokens supprimés : leurs valeurs sont écrites
 * au § 4.2 du spec `docs/specs/2026-08-28-carte-side-project-lien-design.md` et dans le delta 2.1
 * de `semantic.css`, pour qu'un retour n'ait pas à les redeviner.
 *
 * `px-2 py-1` ET NON UNE HAUTEUR FIXE. Le node de Florian décrit une seule boîte avec trois
 * valeurs : un padding de 8 sur les quatre côtés, une hauteur figée à 24, un centrage
 * automatique — ce qui donne un padding vertical réel de 5 px et non de 8. Le compte propre est
 * celui-ci : l'échelle `caption` porte une hauteur de ligne de 16 px, plus deux fois
 * `--space-1` (4 px) fait EXACTEMENT les 24 px du node, sans aucune hauteur à déclarer. Le 4 px
 * vertical est un demi-pas, légal parce qu'interne au composant (loi 2), comme celui que
 * l'étiquette portait déjà ; l'horizontal descend d'un cran pour suivre le node.
 *
 * AUCUNE BORDURE, et `--color-border-strong` N'EN MEURT PAS : il est dans la liste `SEEDED` en tête
 * de `scripts/laws/tokens-audit.mjs`, la vérification descendante de la loi 10 ne le réclame pas,
 * et il reste rendu sur `/design-system/tokens`. Ne lui cherche pas un appelant. Le prix de cette
 * suppression est que la FRONTIÈRE de la pill ne tient plus qu'à 1.10:1 en light et 1.06:1 en dark,
 * ce que le delta 2.1 de `semantic.css` écrit en toutes lettres.
 *
 * PIXELIFY SANS À 12 PX. C'est le node, et rien n'est à créer pour l'obtenir.
 *
 * `text-text-primary` ET NON SA VARIANTE SECONDAIRE : 17.62:1 sur la pill en light, 17.51:1 en
 * dark. Une étiquette de statut n'est pas du texte secondaire — elle est courte, elle est seule
 * dans sa boîte, et elle doit se lire d'un coup.
 *
 * LA SILHOUETTE CRANTÉE, depuis le 2026-11-09 : la pill perd `rounded-full` pour `--clip-cursor-pill`,
 * les trois marches de 2 px par coin de `Tooltip` et de `CursorPill`. Demande de Florian : « Change
 * radius of the tag (like tooltip ones) ». ELLE ROUVRE LA DÉCISION DU 2026-10-28, où `Tag` restait
 * arrondi (« ok, tooltip seul ») : Florian l'a lui-même renversée — un mot en Pixelify dans une
 * pastille est le même geste que la bulle et la pill du curseur, et deux silhouettes pour un même
 * geste se voient. `Tag` n'a ni bordure ni ombre : aucun second nœud, aucun `drop-shadow`, le
 * `clip-path` se pose sur la pill elle-même. `--radius-full` sort des tokens du composant.
 *
 * Histoire : `docs/history/tag.md`.
 */
export function Tag({ children, ...props }: TagProps) {
  return (
    <span
      {...props}
      className={cn(
        "inline-flex h-6 items-center px-2 [clip-path:var(--clip-cursor-pill)]",
        "font-pixel text-caption text-text-primary",
        "bg-tag-surface",
      )}
    >
      {/* LE BAS-DE-CASSE CENTRÉ, décision de Florian du 2026-11-11 (« le bas-de-casse »). Pixelify
       * Sans est asymétrique : à 12 px dans la pill de 24, la masse d'un mot en bas-de-casse (« ew »
       * de « New ») tombait 1.1 px sous le milieu. `text-box` rogne la boîte du mot de la hauteur d'x
       * à la ligne de base, et `items-center` centre cette boîte-là : le bas-de-casse est au milieu,
       * les capitales et les chiffres montent d'environ 1 px — le compromis choisi, les tags portant
       * surtout des mots (New, Open Source, Stable). La hauteur de la pill, 24 px, était celle de
       * `py-1` autour de l'interligne de 16 px : elle est maintenant posée par `h-6`. */}
      <span className="[text-box:trim-both_ex_alphabetic]">{children}</span>
    </span>
  );
}
