"use client";

import { Button } from "@/components/ui/button";
import { useCopyFeedback } from "@/lib/use-copy-feedback";

interface CopyButtonProps {
  /**
   * La chaîne écrite dans le presse-papiers. Requise et sans défaut : un bouton qui copie une chaîne
   * par défaut copierait la mauvaise en silence. C'est une prop et non une constante, pour la raison
   * de l'adresse de `CopyEmailButton` : une chaîne est du CONTENU, et le contenu vit chez l'appelant
   * — sur le site de Neume, c'est la page d'une icône qui calcule son JSX et son SVG.
   */
  value: string;
  /**
   * Le mot du bouton et son nom accessible — « Copy SVG », « Copy command ». Requis : en forme icône
   * il est le seul texte du contrôle, et la bulle l'affiche. À la copie, le composant le remplace par
   * « Copied! » pendant deux secondes, puis le rend.
   */
  label: string;
  /**
   * Ce que le bouton montre, les deux valeurs de `Button` dont il a l'usage. `"icon-label"` : le
   * glyphe puis le mot, SANS bulle, et la confirmation se dit dans le bouton même. `"icon"` : le
   * glyphe seul, enveloppé d'une bulle qui porte le mot. Les valeurs sont écrites sur une seule ligne
   * pour que `npm run check` les confronte au manifeste, terme pour terme.
   */
  content?: "icon-label" | "icon";
  /**
   * L'aspect du `Button` composé, relayé tel quel : `"secondary"` (défaut, l'existant) ou `"primary"`, le
   * bouton noir — l'action principale d'une rangée, « Copy SVG » de `IconSheet`. Ajoutée le 2026-11-11
   * (`extend`, spec `docs/specs/2026-11-11-fiche-icone-design.md` § 2). Les valeurs sont écrites sur une
   * seule ligne pour que `npm run check` les confronte au manifeste, terme pour terme.
   */
  variant?: "secondary" | "primary";
  /**
   * Le mot de la confirmation, qui remplace `label` deux secondes après la copie, dans le bouton, dans
   * la bulle et dans la région `aria-live`. Défaut « Copied! » : un petit texte système, au défaut
   * anglais remplaçable (anonymisation pour Consort, décision de Florian du 2026-11-11, spec
   * `docs/specs/2026-11-11-anonymisation-design.md` § 2). Le portfolio garde ainsi son mot sans le passer.
   */
  copiedLabel?: string;
}

/**
 * CopyButton — le bouton qui écrit une chaîne dans le presse-papiers, et le dit. Cadré avec Florian,
 * en conversation et sur un prototype en localhost, SANS benchmark Mobbin (mis en pause par Florian
 * le 2026-11-07). Spec : `docs/specs/2026-11-07-copie-et-bloc-de-code-design.md` § 2.
 *
 * C'EST `CopyEmailButton` GÉNÉRALISÉ, et il en reprend la composition à l'identique : `Button` en
 * `secondary`, `Tooltip` autour, `useCopyFeedback` pour la séquence « copier, le dire, l'oublier »,
 * une région `aria-live` à côté. Les raisons de chaque pièce sont dans la docstring de
 * `CopyEmailButton`, qui reste la référence et ne bouge pas : lui faire composer celui-ci serait un
 * `refactor`, prouvé par `npm run check:refactor`, et il n'est pas dans ce lot. Il est client pour la
 * même raison — l'état, la minuterie, l'API du presse-papiers —, et il n'écrit AUCUNE classe : aucun
 * token, un champ `tokens` vide. Tout ce qui se peint l'est par `Button` et par `Tooltip`.
 *
 * DEUX FORMES, ET LA BULLE N'EST PAS DANS LES DEUX. C'est la décision du cadrage, et elle est le
 * précédent que ce composant pose : une bulle qui répète le mot que le bouton porte déjà n'apprend
 * rien. Avec un mot visible, la copie se dit DANS LE BOUTON — le glyphe passe de `copy` à `check` et
 * « Copy SVG » devient « Copied! » —, sans bulle : c'est le premier bouton du système dont la
 * confirmation est son propre mot. Sans mot visible, la bulle est le seul texte du contrôle, donc
 * elle reste : elle l'affiche au survol et à la copie (`forceVisible`), comme celle de
 * `CopyEmailButton`, tactile compris. Le mot est écrit deux fois dans cette forme, comme là-bas :
 * `Tooltip` enveloppe et n'injecte rien, et les deux disent la même chose pour que la bulle reste
 * `aria-hidden`.
 *
 * LA LARGEUR DU BOUTON SUIT SON MOT, donc elle bouge d'un cran à la bascule de `icon-label` — « Copy
 * JSX » devient « Copied! » —, comme sur le prototype que Florian a validé. Rien ne la fige : ce serait
 * poser une largeur au bouton, que la loi 8 refuse à un composant, pour un saut de quelques pixels
 * d'un contrôle qui hug son contenu.
 *
 * LA RÉGION `aria-live` EST DANS LES DEUX FORMES, pour la raison écrite à `CopyEmailButton` : un nom
 * qui change sur un élément déjà focusé n'est pas réannoncé, et la région, vide au repos, est ce qui
 * dit « Copied! » à l'assistance. En `icon-label` le nom change aussi, et la région ne le double
 * pas : le nom est relu à qui revient sur le bouton, la région est l'annonce du moment.
 *
 * `disabled` NE S'APPLIQUE PAS : copier est toujours possible, et un échec du presse-papiers ne
 * désactive rien — il ne bascule rien, ce que `useCopyFeedback` tient. Aucun message d'erreur, pour
 * la raison de `CopyEmailButton` : la chaîne est lisible ailleurs dans la page, et le bouton qui
 * ne bascule pas dit la vérité.
 *
 * LE GLYPHE `copy` EST NEUF DANS `Icon`, copié de Neume (`dist/24/copy.svg`, commit `ab2e68d`) : la
 * provenance est écrite à la docstring d'`Icon` (loi 5). `check` y était déjà.
 *
 * Écartés au cadrage : une variante `primary` (aucun usage), une classe venue de l'extérieur (loi 11), un `disabled`,
 * une bulle sur la forme à mot, un `content="label"` — un bouton « copier » sans glyphe ne dit pas qu'il
 * copie autre chose qu'il ne fait.
 *
 * ANONYMISÉ POUR CONSORT, le 2026-11-11 (décision de Florian, spec
 * `docs/specs/2026-11-11-anonymisation-design.md` § 2) : `copiedLabel` (« Copied! » par défaut)
 * remplace le mot de confirmation écrit en dur ; aucun pixel ne bouge.
 *
 * `variant`, DU 2026-11-11 (`extend`) : `"primary"` pose le bouton noir de `Button`, pour l'action principale de
 * la fiche d'une icône ; `"secondary"` reste le défaut, rien ne bouge pour les appelants d'avant.
 *
 * Histoire : `docs/history/copy-button.md`.
 */
export function CopyButton({
  value,
  label,
  content = "icon-label",
  copiedLabel = "Copied!",
  variant = "secondary",
}: CopyButtonProps) {
  const { copied, copy } = useCopyFeedback();

  const shownLabel = copied ? copiedLabel : label;
  const icon = copied ? "check" : "copy";

  const onClick = () => copy(value);

  return (
    <>
      {content === "icon" ? (
        <Button
          label={shownLabel}
          variant={variant}
          content="icon"
          icon={icon}
          forceTooltip={copied}
          onClick={onClick}
        />
      ) : (
        <Button
          label={shownLabel}
          variant={variant}
          content="icon-label"
          icon={icon}
          onClick={onClick}
        />
      )}

      <span aria-live="polite" className="sr-only">
        {copied ? copiedLabel : ""}
      </span>
    </>
  );
}
