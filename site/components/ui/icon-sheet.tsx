"use client";

import { useEffect, useEffectEvent, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import { CopyButton } from "@/components/ui/copy-button";
import { Dialog } from "@/components/ui/dialog";
import { PixelPreview } from "@/components/ui/pixel-preview";
import { Reveal } from "@/components/ui/reveal";
import { Tab } from "@/components/ui/tab";
import { Tag } from "@/components/ui/tag";

/** Un dessin, dans le format de `PixelPreview` : une chaîne par ligne, et le décalage d'une demi-case. */
interface Drawing {
  rows: readonly string[];
  offset?: readonly [0 | 1, 0 | 1];
}

interface IconSheetProps {
  /** Ouverte ou fermée, tenue par l'appelant, comme `Dialog`. */
  open: boolean;
  /** La demande de changement : Échap, le voile, la croix. La fiche ne se ferme pas seule. */
  onOpenChange: (open: boolean) => void;
  /** Après la sortie animée : le focus et le reste de l'appelant s'y règlent. Relayé à `Dialog`. */
  onClosed?: () => void;
  /** Le nom de l'icône, titre de la couche et nom de ses images : `arrow-down-right`. */
  name: string;
  /** Le thème de l'icône, en `Tag` à côté du nom. Sans lui, pas de pastille. */
  tag?: string;
  /** Le grand dessin, 12 × 12 sur Neume : les lignes de `icons/grand.json`. */
  rows: readonly string[];
  /** Le décalage du grand dessin d'une demi-case, `[0, 0]` par défaut. */
  offset?: readonly [0 | 1, 0 | 1];
  /**
   * Le mini, 8 × 8 sur Neume : ses lignes et son décalage. Sans lui, la rangée d'onglets ne porte que la
   * taille du grand dessin, grisée de rien : un seul onglet, et la fiche garde la même hauteur.
   */
  petit?: Drawing;
  /** La ligne d'import, copiée et affichée telle quelle : `import { Heart } from "@neume-icons/react";`. */
  importLine: string;
  /** Le SVG de l'icône, tel que « Copy SVG » le met dans le presse-papiers et que « Download » l'écrit. */
  svg: string;
  /** Le JSX de l'icône, tel que « Copy JSX » le met dans le presse-papiers. */
  jsx: string;
  /** L'icône précédente. Fourni, il fait exister la flèche ← et la touche ←. */
  onPrevious?: () => void;
  /** L'icône suivante. Fourni, il fait exister la flèche → et la touche →. */
  onNext?: () => void;
  /**
   * Les petits textes système, défaut anglais. `sizes` nomme la rangée d'onglets, `cells` finit le nom des
   * dessins (« heart, 12 × 12 cells »). Chacun est remplaçable seul.
   */
  labels?: {
    previous?: string;
    next?: string;
    close?: string;
    sizes?: string;
    cells?: string;
    copyImport?: string;
    copySvg?: string;
    copyJsx?: string;
    download?: string;
    copied?: string;
  };
}

/** Écrit le SVG en fichier `<nom>.svg`, par une adresse d'objet retirée dès le clic. */
function save(name: string, svg: string) {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}.svg`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * IconSheet — la fiche d'une icône de neume.dev : la couche qui s'ouvre au clic sur une icône. Le nom et
 * son thème, le dessin dans son contour, le choix grand dessin / mini sous lui, l'import à copier, puis
 * Copy SVG, Copy JSX et Download. Cadrée avec Florian le 2026-11-11 sur un prototype en localhost, trois
 * versions, sans benchmark Mobbin (en pause) ; spec `docs/specs/2026-11-11-fiche-icone-design.md`.
 *
 * ELLE COMPOSE, ET N'ÉCRIT RIEN QUI EXISTE (loi 9). `Dialog` pour la couche, `PixelPreview` pour le dessin,
 * `Tab` pour le choix des tailles, `CodeBlock` pour l'import, `CopyButton` et `Button` pour les actions,
 * `Tag` pour le thème, `Reveal` pour le geste. Elle ne connaît pas le paquet d'icônes : elle reçoit les
 * données d'une icône — nom, dessins, chaînes à copier — et ne fabrique ni SVG ni JSX. Elle n'a aucun
 * token à elle ; deux composants ont été étendus pour elle, `PixelPreview` (la taille `large`) et
 * `CopyButton` (la variante `primary`), qui repassent `draft`.
 *
 * LA MISE EN PAGE EST VERTICALE, UNE COLONNE — décision de Florian (la version en deux colonnes a été
 * essayée et écartée). Le panneau est celui de `Dialog` en `mid`, 440 px au plus, comme le prototype : en `sm`
 * (366 px utiles) les trois actions, 393 px, passaient à la ligne. De haut en bas : l'en-tête, TOUJOURS SUR UNE
 * LIGNE (le nom en Pixelify, qui se rogne s'il est trop long, le thème en `Tag`, entier, puis ← → et la croix,
 * des `Button` ghost icône avec la bulle de `Tooltip`, poussés à droite) ; le contour du
 * dessin sur toute la largeur, le dessin centré ; les onglets 12 × 12 / 8 × 8 ; l'import ; les trois actions.
 * La bande des tailles du premier prototype est retirée.
 *
 * LES TAILLES SONT LE `Tab` D'`EXHIBIT`, SOUS LE CADRE (`placement="bottom"`), contrôlé : la piste grise,
 * la pastille blanche sans ombre, centrée dans sa barre. Au changement d'onglet, LE NOUVEAU DESSIN ENTRE AU
 * GESTE DE `Reveal` — monte, floute, se pose net —, exactement comme l'image d'`Exhibit` : le mini a son
 * `Reveal` dès le départ, sous un panneau fermé ; le grand dessin ne prend le sien qu'une fois qu'un
 * onglet a vraiment changé, pour qu'il ne rejoue pas à l'ouverture de la fiche (voir « Exhibit » pour la
 * raison du délai de secours). Passer à une autre icône ne rejoue rien et ramène au grand dessin. Sous
 * mouvement réduit, rien ne bouge : ce sont les valeurs neutralisées de `Reveal`. UNE ICÔNE SANS MINI GARDE
 * LA RANGÉE, avec son seul onglet « 12 × 12 » : c'est ce qui évite que la fiche change de hauteur, donc
 * saute dans la fenêtre, quand on passe d'une icône à l'autre avec ← →. Choix de l'agent de build, à juger :
 * l'autre issue était d'ôter la rangée, ou de griser un second onglet — `Tab` n'a pas d'onglet désactivé.
 *
 * ← → ET ÉCHAP SANS ÊTRE ÉCRITS. Aucun raccourci n'est affiché : ← et → sont écoutés sur le document tant
 * que la fiche est ouverte, et seulement si l'appelant a fourni `onPrevious` et `onNext`. Une flèche déjà
 * prise — sur la rangée d'onglets, où `Tab` déplace le focus d'un onglet à l'autre — n'est pas rejouée :
 * l'écoute lit `defaultPrevented`. Échap et le voile sont ceux de `Dialog`.
 *
 * L'IMPORT NE PEUT PAS ÉLARGIR LA FICHE : `CodeBlock` tient sa ligne sur une seule ligne et la fait défiler
 * dans sa place (`min-w-0`, barre masquée), le bouton de copie gardant sa colonne ; la colonne de la fiche est
 * `min-w-0`. Vérifié avec `arrow-down-right`, le nom le plus long.
 *
 * L'ACCESSIBILITÉ. La couche est nommée par le titre — le nom de l'icône —, `PixelPreview` porte son
 * `label` (« heart, 12 × 12 cells »), les boutons à icône seule portent leur nom et leur bulle ; le focus
 * est natif : `showModal()` le donne au premier contrôle et le navigateur le rend au déclencheur. Les
 * confirmations « Copied! » sont annoncées par la région `aria-live` de `CopyButton`.
 *
 * « DOWNLOAD » ÉCRIT LE SVG QU'ON LUI A PASSÉ, en `<nom>.svg`, depuis une adresse d'objet — et non une adresse
 * de fichier passée en prop, comme la spec le prévoyait. Une adresse aurait demandé à `Button` une prop
 * `download` ; le SVG est déjà là pour « Copy SVG », et c'est la même chaîne : ce qu'on copie est ce qu'on
 * télécharge. Choix de l'agent de build, à juger.
 *
 * COMPOSANT CLIENT : l'état du choix de taille, l'écoute des flèches, l'adresse d'objet du téléchargement.
 * Contrôlé comme `Dialog`, il n'est instanciable que depuis un composant client : sur `/design-system`, c'est
 * un îlot de vitrine qui l'ouvre.
 *
 * CE QUE LA MACHINE NE VOIT PAS : le geste de `Reveal` au changement d'onglet, ← → qui passent d'une icône à
 * l'autre, l'import long qui ne bouge rien, le focus rendu au déclencheur, les bulles, le dessin dans les
 * deux polarités. Ils se jugent sur `/design-system`.
 *
 * Histoire : `docs/history/icon-sheet.md`.
 */
export function IconSheet({
  open,
  onOpenChange,
  onClosed,
  name,
  tag,
  rows,
  offset,
  petit,
  importLine,
  svg,
  jsx,
  onPrevious,
  onNext,
  labels,
}: IconSheetProps) {
  const {
    previous = "Previous icon",
    next = "Next icon",
    close = "Close",
    sizes = "Drawing size",
    cells = "cells",
    copyImport = "Copy import",
    copySvg = "Copy SVG",
    copyJsx = "Copy JSX",
    download = "Download",
    copied = "Copied!",
  } = labels ?? {};

  const titleId = useId();

  /* Le choix de taille appartient à une icône : il est lu pour `name` et repart du grand dessin pour une
   * autre, sans effet. `picked` est vide tant qu'aucun onglet n'a changé sur cette icône, et c'est aussi ce
   * qui dit au grand dessin de prendre son `Reveal`. */
  const [picked, setPicked] = useState<{ name: string; size: string } | null>(null);
  const chosen = picked !== null && picked.name === name ? picked.size : null;
  const size = petit !== undefined && chosen === "petit" ? "petit" : "grand";

  const grandLabel = `${rows.length} × ${rows.length}`;
  const petitLabel = petit ? `${petit.rows.length} × ${petit.rows.length}` : "";

  const walk = useEffectEvent((event: KeyboardEvent) => {
    if (
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    ) {
      return;
    }
    if (event.key === "ArrowLeft" && onPrevious) {
      event.preventDefault();
      onPrevious();
    } else if (event.key === "ArrowRight" && onNext) {
      event.preventDefault();
      onNext();
    }
  });

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", walk);
    return () => document.removeEventListener("keydown", walk);
  }, [open]);

  const preview = (drawing: Drawing, side: string) => (
    <PixelPreview
      size="large"
      rows={drawing.rows}
      offset={drawing.offset}
      label={`${name}, ${side} ${cells}`}
    />
  );

  const grand = preview({ rows, offset }, grandLabel);

  const items = [
    {
      value: "grand",
      label: grandLabel,
      panel: chosen !== null ? <Reveal>{grand}</Reveal> : grand,
    },
    ...(petit
      ? [
          {
            value: "petit",
            label: petitLabel,
            panel: <Reveal>{preview(petit, petitLabel)}</Reveal>,
          },
        ]
      : []),
  ];

  return (
    <Dialog
      width="mid"
      open={open}
      onOpenChange={onOpenChange}
      onClosed={() => {
        setPicked(null);
        onClosed?.();
      }}
      labelledBy={titleId}
    >
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex items-center gap-2">
          <h2 id={titleId} className="min-w-0 truncate font-pixel text-h4 text-text-primary">
            {name}
          </h2>
          {tag ? (
            <div className="shrink-0">
              <Tag>{tag}</Tag>
            </div>
          ) : null}
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {onPrevious ? (
              <Button
                label={previous}
                variant="ghost"
                content="icon"
                icon="arrow-left"
                onClick={onPrevious}
              />
            ) : null}
            {onNext ? (
              <Button
                label={next}
                variant="ghost"
                content="icon"
                icon="arrow-right"
                onClick={onNext}
              />
            ) : null}
            <Button
              label={close}
              variant="ghost"
              content="icon"
              icon="close"
              onClick={() => onOpenChange(false)}
            />
          </div>
        </div>

        {/* La barre de `Tab` pose 12 px de padding sous la piste : ce retrait ramène l'écart de la
         * piste à l'import à celui de l'en-tête au dessin. */}
        <div className="-mb-3">
          <Tab
            label={sizes}
            placement="bottom"
            items={items}
            value={size}
            onValueChange={(next) => setPicked({ name, size: next })}
          />
        </div>

        <CodeBlock code={importLine} label={copyImport} copiedLabel={copied} />

        <div className="flex flex-wrap items-center gap-2">
          <CopyButton value={svg} label={copySvg} variant="primary" copiedLabel={copied} />
          <CopyButton value={jsx} label={copyJsx} copiedLabel={copied} />
          <Button
            label={download}
            variant="ghost"
            content="icon-label"
            icon="download"
            onClick={() => save(name, svg)}
          />
        </div>
      </div>
    </Dialog>
  );
}
