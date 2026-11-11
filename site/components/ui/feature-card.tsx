import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/cn";

interface FeatureCardProps {
  /** La scène : ce que la carte montre — une démo, une image, un composant —, centrée dans sa zone. Requise. */
  scene: ReactNode;
  /** Le titre, en Pixelify 16 / 24 au primaire. Requis. */
  title: string;
  /** La phrase sous le titre, en 14 / 20 au tertiaire. Facultative. */
  description?: string;
  /** Une étiquette en haut à gauche : « New ». Rendue par `Tag`. Facultative. */
  tag?: string;
  /**
   * Où mène la carte. Présent : la carte entière est un lien `<a>`, son fond fonce au survol et une flèche `arrow-up-right`
   * apparaît. Absent : une carte inerte. La scène d'une carte lien ne porte aucun contrôle : un lien dans un lien
   * n'existe pas.
   */
  href?: string;
}

/**
 * FeatureCard — la carte de cas d'usage de l'accueil de Neume (« Made for interfaces »), rendue générique pour
 * Consort et le portfolio : une scène, un titre, une phrase, une étiquette facultative, et un lien facultatif.
 * Spec : `docs/specs/2026-11-11-lot-4-composites-design.md` § 2.2, `create`, sans benchmark Mobbin (en pause).
 *
 * LES DÉCISIONS DE FLORIAN (spec § 1), CADRÉES SUR LE PROTOTYPE EN LOCALHOST : la carte est « super » — une scène,
 * le titre en Pixelify, une phrase, un `Tag` facultatif en haut à gauche. LA SCÈNE EST PLUS GRANDE que celle de la
 * première version : la carte fait AU MOINS 400 px de haut (`--size-feature-card-height`), la scène au moins 240 px
 * (`--size-feature-card-scene-height`), et son contenu y est centré. LA CARTE LIEN : une flèche `arrow-up-right`
 * apparaît en haut à droite en glissant de 4 px depuis le bas à gauche, ET LE FOND FONCE D'UN CRAN en même temps
 * (proposé par Florian, confirmé sur le prototype). Rien d'autre ne change de couleur : le texte, le filet et
 * l'étiquette restent tels quels.
 *
 * L'ANATOMIE. Une colonne : la zone de scène, qui prend la place (`flex-1`), centre son contenu et garde 24 px de
 * marge en haut et 32 en bas ; puis le titre et la phrase, à 4 px l'un de l'autre. Fond `--color-surface-subtle`,
 * filet de `--border-thin` en `--color-border-subtle` (décoratif, loi 7), rayon `--radius-3xl` (24 px), padding
 * de 24 px. Aucun token de couleur neuf : le fond de survol est `--color-list-highlight`, le gris des pistes, dont
 * les paires avec les trois textes sont déjà dans `contrast-pairs.json`. Clair et sombre par ces tokens.
 *
 * `href` → LIEN, SINON CARTE INERTE : la balise suit le sens, comme `Button` (loi 11) — la carte entière est un
 * `<a>`, son nom accessible est son contenu (titre et phrase). La flèche est décorative (`aria-hidden`). Une carte
 * sans `href` est un `<div>`, sans état : elle n'est pas interactive.
 *
 * LES ÉTATS DU LIEN (loi 4). `hover` : le fond passe de `--color-surface-subtle` à `--color-list-highlight` (changement
 * de fond sous un contenu qui tient son seuil, loi 7, exception de `Button` : 1.05 → 1.10:1 en clair, c'est le
 * mouvement de la flèche qui le rend lisible, et elle survit à `prefers-reduced-motion` par son fondu), et la
 * flèche, de 24 px, passe d'invisible à pleine, de `translate(-4px, 4px)` à `none`. `active` : identique au survol.
 * `focus-visible` : l'anneau du système (loi 4) ET la même flèche, au clavier comme à la souris. `disabled` : ne
 * s'applique pas, un lien n'a pas de forme désactivée. SOUS `prefers-reduced-motion`, la flèche ne glisse pas : elle
 * apparaît en fondu seul (`motion-reduce:translate-none`, et `globals.css` ramène la durée à 1 ms).
 *
 * L'ÉTIQUETTE SUR UNE CARTE LIEN. `Tag` est sur `--color-tag-surface` (`--neutral-100`), le même gris que le fond de
 * survol : au survol, la pastille de l'étiquette s'efface dans le fond, et ne reste que son mot — la même frontière
 * que l'angle mort n° 16 de `.claude/rules/loi-07-accessibilite.md` décrit pour la pill. À l'œil de Florian.
 *
 * LA LARGEUR EST CELLE DU PARENT (loi 8) : une ou deux colonnes, c'est la grille qui décide, par une enveloppe
 * (loi 11, cas dur 1) ; la vitrine montre une grille de deux colonnes. COMPOSANT SERVEUR : aucun état, aucune
 * mesure, tout le mouvement est en CSS.
 *
 * Histoire : `docs/history/feature-card.md`.
 */
export function FeatureCard({ scene, title, description, tag, href }: FeatureCardProps) {
  const classes = cn(
    "group relative flex min-h-[var(--size-feature-card-height)] flex-col overflow-hidden rounded-3xl p-6 text-left",
    "border-[length:var(--border-thin)] border-border-subtle bg-surface-subtle",
    href !== undefined && [
      "transition-colors duration-[var(--duration-base)] ease-out",
      "hover:bg-list-highlight active:bg-list-highlight focus-visible:bg-list-highlight",
      "focus-visible:outline-[length:var(--border-thick)] focus-visible:outline-focus-ring",
    ],
  );

  const children = (
    <>
      {tag ? (
        <span className="absolute top-4 left-4 flex">
          <Tag>{tag}</Tag>
        </span>
      ) : null}
      {href !== undefined ? (
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-4 right-4 flex text-text-primary",
            "-translate-x-1 translate-y-1 opacity-0 motion-reduce:translate-none",
            "transition-[opacity,translate] duration-[var(--duration-base)] ease-out",
            "group-hover:translate-none group-hover:opacity-100",
            "group-focus-visible:translate-none group-focus-visible:opacity-100",
          )}
        >
          <Icon name="arrow-up-right" />
        </span>
      ) : null}
      <div className="flex min-h-[var(--size-feature-card-scene-height)] flex-1 items-center justify-center pt-6 pb-8">
        {scene}
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-pixel text-body font-normal text-text-primary">{title}</p>
        {description ? (
          <p className="font-body text-body-sm text-text-tertiary">{description}</p>
        ) : null}
      </div>
    </>
  );

  return href !== undefined ? (
    <a href={href} className={classes}>
      {children}
    </a>
  ) : (
    <div className={classes}>{children}</div>
  );
}
