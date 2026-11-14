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
  /** Le dessin de base, 12 × 12 sur Neume : ses lignes et son décalage. */
  base: Drawing;
  /** La version pleine du même dessin, à la même taille : ses lignes et son décalage. */
  solid: Drawing;
  /**
   * L'onglet ouvert, tenu par l'appelant : c'est lui qui choisit, d'après elle, le SVG, le JSX et
   * l'import qu'il passe à la fiche. Contrôlé, comme `open`.
   */
  value: "base" | "solid";
  /**
   * La demande de changement d'onglet : un clic, Entrée ou Espace sur un onglet, et `"base"` après la
   * fermeture si la fiche n'y était pas. La fiche ne change pas d'onglet seule.
   */
  onValueChange: (value: "base" | "solid") => void;
  /** La ligne d'import, copiée et affichée telle quelle : `import { Heart } from "@neume-icons/react";`. */
  importLine: string;
  /** Le SVG de l'icône, tel que « Copy SVG » le met dans le presse-papiers et que « Download » l'écrit. */
  svg: string;
  /**
   * Le nom du fichier que « Download » écrit, sans l'extension `.svg`, ajoutée par la fiche : celui du
   * style montré, `star-solid` sous Solid. `name` par défaut.
   */
  fileName?: string;
  /** Le JSX de l'icône, tel que « Copy JSX » le met dans le presse-papiers. */
  jsx: string;
  /** L'icône précédente. Fourni, il fait exister la flèche ← et la touche ←. */
  onPrevious?: () => void;
  /** L'icône suivante. Fourni, il fait exister la flèche → et la touche →. */
  onNext?: () => void;
  /**
   * Les petits textes système, défaut anglais. `styles` nomme la rangée d'onglets, `base` et `solid` ses
   * deux onglets ; `cells` finit le nom des dessins (« heart, Solid, 12 × 12 cells »). Chacun est
   * remplaçable seul.
   */
  labels?: {
    previous?: string;
    next?: string;
    close?: string;
    styles?: string;
    base?: string;
    solid?: string;
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
 * son thème, le dessin dans son contour, le choix Base / Solid sous lui, l'import à copier, puis Copy SVG,
 * Copy JSX et Download. Cadrée avec Florian le 2026-11-11 sur un prototype en localhost, trois versions,
 * sans benchmark Mobbin (en pause) ; spec `docs/specs/2026-11-11-fiche-icone-design.md`. Le choix des
 * tailles (12 × 12 / 8 × 8) a laissé la place au choix des styles le 2026-11-14, pour la 1.0.0 de Neume.
 *
 * ELLE COMPOSE, ET N'ÉCRIT RIEN QUI EXISTE (loi 9). `Dialog` pour la couche, `PixelPreview` pour le dessin,
 * `Tab` pour le choix du style, `CodeBlock` pour l'import, `CopyButton` et `Button` pour les actions,
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
 * dessin sur toute la largeur, le dessin centré ; les onglets Base / Solid ; l'import ; les trois actions.
 * La bande des tailles du premier prototype est retirée.
 *
 * LES STYLES SONT LE `Tab` D'`EXHIBIT`, SOUS LE CADRE (`placement="bottom"`) : la piste grise, la pastille
 * blanche sans ombre, centrée dans sa barre. Deux onglets, toujours : « Base », le dessin de 12 × 12, et
 * « Solid », sa version pleine, à la même taille — Neume 1.0.0 en donne une à chacune de ses icônes, d'où
 * `solid` requis. Les deux libellés sont dans `labels`, remplaçables.
 *
 * L'ONGLET OUVERT APPARTIENT À L'APPELANT, `value` + `onValueChange` (loi 11), et c'est la raison de tout :
 * la fiche ne fabrique ni SVG ni JSX, donc c'est l'appelant qui, sachant l'onglet ouvert, lui passe le SVG,
 * le JSX et l'import du dessin montré — « Copy SVG », « Copy JSX », « Download » et la ligne d'import
 * suivent l'onglet sans que la fiche le sache. Il n'y a pas de mode non contrôlé : aucun appelant n'en a
 * l'usage, et un appelant qui n'aurait pas l'onglet montrerait un dessin et copierait l'autre. La fiche ne
 * change pas d'onglet seule : elle DEMANDE, comme `Dialog` demande la fermeture — au clic d'un onglet, et
 * `"base"` APRÈS LA FERMETURE si elle n'y était pas, pour qu'une fiche rouverte reparte du dessin de base.
 * Passer d'une icône à l'autre (← → ou les boutons) ne touche pas à l'onglet : le choix SE GARDE (depuis
 * le 2026-11-12, alors pour les tailles), et l'icône suivante s'ouvre dans le même style.
 *
 * AU CHANGEMENT D'ONGLET, LE NOUVEAU DESSIN ENTRE AU GESTE DE `Reveal` — monte, floute, se pose net —,
 * exactement comme l'image d'`Exhibit` : le dessin de l'onglet fermé a son `Reveal` dès le départ, sous un
 * panneau fermé ; celui de l'onglet ouvert à l'ouverture ne prend le sien qu'une fois qu'un onglet a
 * vraiment changé, pour qu'il ne rejoue pas à l'ouverture de la fiche (voir « Exhibit » pour la raison du
 * délai de secours). Passer à une autre icône ne rejoue rien : les `Reveal` restent montés, seules leurs
 * cases changent. Sous mouvement réduit, rien ne bouge : ce sont les valeurs neutralisées de `Reveal`. LA
 * HAUTEUR NE BOUGE PAS d'une icône à l'autre : la rangée a toujours ses deux onglets, et les deux dessins
 * ont la même grille.
 *
 * LE MINI DE 8 × 8 EST SORTI LE 2026-11-14 (`petit`, `break`). Aucun appelant de neume.dev ne le passait
 * plus, et `Icon` ne le rend plus depuis Neume 0.2.0 (loi 5). Le garder à côté aurait mis trois onglets de
 * deux natures dans une rangée — deux styles, puis une taille — et en faire une entrée générique aurait
 * ouvert une liste de dessins que personne n'appelle (loi 11, retenue de la loi 10). Il revient, s'il revient,
 * sur la parole de Florian.
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
 * `label`, qui nomme le style (« heart, Solid, 12 × 12 cells »), la rangée est nommée par ce qu'elle choisit
 * (« Drawing style »), les boutons à icône seule portent leur nom et leur bulle ; le focus
 * est natif : `showModal()` le donne au premier contrôle et le navigateur le rend au déclencheur. Les
 * confirmations « Copied! » sont annoncées par la région `aria-live` de `CopyButton`.
 *
 * « DOWNLOAD » ÉCRIT LE SVG QU'ON LUI A PASSÉ, en `<fileName>.svg`, depuis une adresse d'objet — et non une adresse
 * de fichier passée en prop, comme la spec le prévoyait. Une adresse aurait demandé à `Button` une prop
 * `download` ; le SVG est déjà là pour « Copy SVG », et c'est la même chaîne : ce qu'on copie est ce qu'on
 * télécharge. Choix de l'agent de build, à juger. LE NOM DU FICHIER EST À L'APPELANT (`fileName`, `name` par
 * défaut), depuis le 2026-11-14 : sous Solid, Neume nomme le fichier `star-solid.svg` quand le titre reste `star`,
 * et la fiche ne connaît pas la convention de nommage du paquet — elle reçoit le nom, comme elle reçoit le SVG.
 *
 * COMPOSANT CLIENT : l'état « un onglet a changé », l'écoute des flèches, l'adresse d'objet du téléchargement.
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
  base,
  solid,
  value,
  onValueChange,
  importLine,
  svg,
  fileName,
  jsx,
  onPrevious,
  onNext,
  labels,
}: IconSheetProps) {
  const {
    previous = "Previous icon",
    next = "Next icon",
    close = "Close",
    styles = "Drawing style",
    base: baseLabel = "Base",
    solid: solidLabel = "Solid",
    cells = "cells",
    copyImport = "Copy import",
    copySvg = "Copy SVG",
    copyJsx = "Copy JSX",
    download = "Download",
    copied = "Copied!",
  } = labels ?? {};

  const titleId = useId();

  /* Vrai dès qu'un onglet a vraiment changé dans la fiche ouverte : c'est alors seulement que le dessin
   * de l'onglet ouvert à l'ouverture prend son `Reveal` — l'autre l'a dès le départ, sous son panneau
   * fermé (voir la docstring). Faux de nouveau à la fermeture. Passer d'une icône à l'autre n'y touche
   * pas : l'onglet ouvert, tenu par l'appelant, ne bouge pas, et aucun dessin ne rejoue. */
  const [switched, setSwitched] = useState(false);

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

  const drawings = [
    { value: "base" as const, label: baseLabel, drawing: base },
    { value: "solid" as const, label: solidLabel, drawing: solid },
  ];

  const items = drawings.map((item) => {
    const preview = (
      <PixelPreview
        size="large"
        rows={item.drawing.rows}
        offset={item.drawing.offset}
        label={`${name}, ${item.label}, ${item.drawing.rows.length} × ${item.drawing.rows.length} ${cells}`}
      />
    );
    return {
      value: item.value,
      label: item.label,
      panel: switched || item.value !== value ? <Reveal>{preview}</Reveal> : preview,
    };
  });

  return (
    <Dialog
      width="mid"
      open={open}
      onOpenChange={onOpenChange}
      onClosed={() => {
        setSwitched(false);
        if (value !== "base") onValueChange("base");
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
                tooltip="none"
                onClick={onPrevious}
              />
            ) : null}
            {onNext ? (
              <Button
                label={next}
                variant="ghost"
                content="icon"
                icon="arrow-right"
                tooltip="none"
                onClick={onNext}
              />
            ) : null}
            <Button
              label={close}
              variant="ghost"
              content="icon"
              icon="close"
              tooltip="none"
              onClick={() => onOpenChange(false)}
            />
          </div>
        </div>

        {/* La barre de `Tab` pose 12 px de padding sous la piste : ce retrait ramène l'écart de la
         * piste à l'import à celui de l'en-tête au dessin. */}
        <div className="-mb-3">
          <Tab
            label={styles}
            placement="bottom"
            items={items}
            value={value}
            onValueChange={(next) => {
              if (next === value) return;
              setSwitched(true);
              onValueChange(next === "solid" ? "solid" : "base");
            }}
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
            onClick={() => save(fileName ?? name, svg)}
          />
        </div>
      </div>
    </Dialog>
  );
}
