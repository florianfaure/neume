"use client";

import { useId, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { useKeyboardFocus } from "@/lib/use-keyboard-focus";
import { cn } from "@/lib/cn";

/**
 * Le statut et son message vont ENSEMBLE, comme chez `TextField` : un statut sans message serait une
 * couleur seule, ce que la loi 7 interdit.
 */
type TextAreaStatusProps =
  | { status?: undefined; message?: never }
  | {
      /**
       * L'état de retour du champ : `negative`, `positive`, `warning`. Le filet de la zone, le message et
       * le contour clavier prennent la couleur ; le message est précédé de l'icône du statut.
       */
      status: "negative" | "positive" | "warning";
      /** Le message du statut, dit par un mot et non par la couleur seule (loi 7). Requis avec `status`. */
      message: string;
    };

type TextAreaProps = {
  /** Le libellé, AU-DESSUS du champ, et son nom accessible. REQUIS, comme chez `TextField`. */
  label: string;
  /** Le texte d'attente, au tertiaire, champ vide. Facultatif. */
  placeholder?: string;
  /** Une aide, sous le champ, au tertiaire. Un statut la remplace par son message, dans la même place. */
  help?: string;
  /** Le nombre de lignes visibles : la hauteur du champ, fixe. 4 par défaut. */
  rows?: number;
  /**
   * Le nombre de caractères au plus : l'attribut natif `maxLength`, qui bloque la frappe à la limite. Fourni,
   * il affiche le COMPTEUR sous le champ, à droite : « 0 / 2,000 ».
   */
  maxLength?: number;
  /** Le texte du champ, tenu par l'appelant, avec `onValueChange`. L'emporte sur `defaultValue` (loi 11). */
  value?: string;
  /** Appelé à chaque frappe, avec le texte entier. */
  onValueChange?: (value: string) => void;
  /** Le texte de départ, en mode non contrôlé : le champ tient alors son état lui-même. */
  defaultValue?: string;
  /** Désactivé : estompé, sans survol, hors de l'ordre de tabulation. */
  disabled?: boolean;
  /** Le nom du champ dans un formulaire natif. */
  name?: string;
  /** Champ obligatoire : l'attribut natif `required`. */
  required?: boolean;
} & TextAreaStatusProps;

/** Les trois statuts, copiés de `TextField`. Classes écrites en toutes lettres : Tailwind lit le source. */
const STATUS = {
  negative: {
    border: "border-border-negative",
    ring: "data-[keyboard-focus]:outline-focus-ring-negative",
    text: "text-text-negative",
    icon: "alert-circle",
  },
  positive: {
    border: "border-border-positive",
    ring: "data-[keyboard-focus]:outline-focus-ring-positive",
    text: "text-text-positive",
    icon: "check-circle",
  },
  warning: {
    border: "border-border-warning",
    ring: "data-[keyboard-focus]:outline-focus-ring-warning",
    text: "text-text-warning",
    icon: "alert-triangle",
  },
} as const;

/** Le compteur se lit en anglais, comme le site : « 1,234 ». */
const COUNT = new Intl.NumberFormat("en-US");

/**
 * TextArea — le champ de texte sur plusieurs lignes, frère de `TextField` : même libellé au-dessus, même
 * gris, même aide dessous, mêmes trois statuts, même contour au clavier seulement. Né pour le dialogue
 * « Request an icon » de neume.dev (« What it should mean », 2 000 caractères au plus). Spec :
 * `docs/specs/2026-11-13-zone-de-texte-et-fichier-design.md` § 2, `create`, sans benchmark Mobbin (en pause
 * depuis le 2026-11-07). Les mots sont des props : le composant n'écrit aucun texte, sinon les chiffres du
 * compteur.
 *
 * L'ANATOMIE, ET CE QUI CHANGE DE `TEXTFIELD`. La pilule ne tient pas sur plusieurs lignes : la zone prend un
 * rayon de 16 px (`--radius-2xl`, celui de `CodeBlock` et de `Tile`), 16 px de marge sur les côtés comme le
 * champ d'une ligne, 12 px en haut et en bas pour que la première ligne tombe où tomberait celle d'un
 * `TextField`. La hauteur est FIXE, donnée par `rows` (4 par défaut) : ni poignée, ni hauteur qui suit le
 * texte — décision de Florian au cadrage. Au-delà, le texte défile dans la zone. LA LARGEUR EST CELLE DU
 * PARENT (loi 8).
 *
 * LE COMPTEUR. Avec `maxLength`, « n / max » sous la zone, À DROITE, sur la ligne de l'aide ou du message, en
 * `caption` au tertiaire et en chiffres tabulaires (le compte ne fait pas danser la ligne). Il ne change pas
 * de couleur à la limite : `maxLength` bloque la frappe, le compteur n'a donc jamais rien à reprocher. Il est
 * relié au champ par `aria-describedby`, avec l'aide : un lecteur d'écran le lit à l'arrivée dans le champ, et
 * ne l'annonce pas à chaque frappe.
 *
 * LES ÉTATS (loi 4), ceux de `TextField` : `hover`, la zone un cran plus sombre et le texte d'attente au
 * secondaire — en statut, le blanc reprend le gris du repos, filet coloré gardé ; `active`, identique au repos ; `disabled`, estompé, sans survol ; `focus-visible`, au clavier
 * seulement, à la couleur du statut. L'EXCEPTION DE LA LOI 4 SUR LE MOMENT DU CONTOUR EST ÉTENDUE LE
 * 2026-11-13 AU `<textarea>` : c'est un champ de saisie texte, le navigateur y allume `:focus-visible` au clic
 * comme sur un `<input>`, et la règle de `npm run check` ne connaissait que la balise `<input`.
 *
 * COMPOSANT CLIENT (`runtime: "client"`) : la modalité du focus, et le compte du mode non contrôlé.
 *
 * Histoire : `docs/history/text-area.md`.
 */
export function TextArea({
  label,
  placeholder,
  help,
  rows = 4,
  maxLength,
  value,
  onValueChange,
  defaultValue,
  disabled,
  name,
  required,
  status,
  message,
}: TextAreaProps) {
  const id = useId();
  const noteId = `${id}-note`;
  const countId = `${id}-count`;
  const { keyboardFocus, onFocus, onBlur } = useKeyboardFocus();
  const [ownLength, setOwnLength] = useState((defaultValue ?? "").length);
  const length = value !== undefined ? value.length : ownLength;
  const tone = status ? STATUS[status] : null;
  const note = tone ? message : help;
  const counted = maxLength !== undefined;
  const describedBy = [note ? noteId : null, counted ? countId : null].filter(Boolean).join(" ");

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-body text-body-sm font-medium text-text-primary">
        {label}
      </label>
      <div
        data-keyboard-focus={keyboardFocus ? "" : undefined}
        data-disabled={disabled ? "" : undefined}
        className={cn(
          "group flex rounded-2xl",
          "border-[length:var(--border-thin)]",
          "transition-[background-color] duration-[var(--duration-fast)] ease-out",
          tone ? ["bg-surface", tone.border] : ["bg-search-field-surface", "border-transparent"],
          !disabled &&
            (tone ? "hover:bg-search-field-surface" : "hover:bg-search-field-surface-hover"),
          disabled && "opacity-[var(--opacity-disabled)]",
          "data-[keyboard-focus]:outline-solid data-[keyboard-focus]:outline-[length:var(--border-thick)]",
          "data-[keyboard-focus]:outline-offset-[var(--focus-ring-offset)]",
          tone ? tone.ring : "data-[keyboard-focus]:outline-focus-ring",
          "data-[keyboard-focus]:[animation:focus-ring-arrive_var(--duration-fast)_var(--ease-spring-pop)]",
        )}
      >
        <textarea
          id={id}
          name={name}
          rows={rows}
          maxLength={maxLength}
          value={value}
          defaultValue={value === undefined ? defaultValue : undefined}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          aria-invalid={status === "negative" ? true : undefined}
          aria-describedby={describedBy || undefined}
          onChange={(event) => {
            setOwnLength(event.target.value.length);
            onValueChange?.(event.target.value);
          }}
          onFocus={onFocus}
          onBlur={onBlur}
          className={cn(
            "block min-w-0 flex-1 resize-none appearance-none bg-transparent px-4 py-3 outline-none",
            "font-body text-body-sm text-text-primary placeholder:text-text-tertiary",
            !disabled && "group-hover:placeholder:text-text-secondary",
          )}
        />
      </div>
      {note || counted ? (
        <div className="flex items-start gap-4">
          {note ? (
            <p
              id={noteId}
              role={status === "negative" ? "alert" : undefined}
              aria-live={status && status !== "negative" ? "polite" : undefined}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2 font-body text-caption",
                tone ? tone.text : "text-text-tertiary",
              )}
            >
              {tone ? <Icon name={tone.icon} size={16} /> : null}
              <span>{note}</span>
            </p>
          ) : null}
          {counted ? (
            <p
              id={countId}
              className="ml-auto shrink-0 font-body text-caption text-text-tertiary tabular-nums"
            >
              {COUNT.format(length)} / {COUNT.format(maxLength)}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
