"use client";

import { useId } from "react";
import { Icon } from "@/components/ui/icon";
import { useKeyboardFocus } from "@/lib/use-keyboard-focus";
import { cn } from "@/lib/cn";

/**
 * Le statut et son message vont ENSEMBLE, et c'est le type qui l'impose : un statut sans message serait
 * une couleur seule, ce que la loi 7 interdit. Le message est écrit par l'appelant, l'icône est celle
 * du statut.
 */
type TextFieldStatusProps =
  | { status?: undefined; message?: never }
  | {
      /**
       * L'état de retour du champ : `negative` (une erreur), `positive` (validé), `warning` (accepté, mais à
       * revoir). Le filet de la pastille, le message et le contour clavier prennent la couleur ; le message
       * est précédé de l'icône du statut. Absent : le champ est au repos.
       */
      status: "negative" | "positive" | "warning";
      /** Le message du statut, dit par un mot et non par la couleur seule (loi 7). Requis avec `status`. */
      message: string;
    };

type TextFieldProps = {
  /**
   * Le libellé, AU-DESSUS du champ, et son nom accessible. REQUIS : le texte d'attente disparaît à la
   * première frappe et ne nomme pas un champ (loi 7).
   */
  label: string;
  /** Le texte d'attente, au tertiaire, champ vide. Facultatif. */
  placeholder?: string;
  /**
   * Une aide, sous le champ, au tertiaire. Facultative. Un statut la remplace par son message, dans la
   * même place.
   */
  help?: string;
  /**
   * La nature du champ, ce que le navigateur en fait : clavier mobile, saisie masquée. Une union fermée de
   * types de SAISIE TEXTE — la case à cocher, la radio ou le fichier ne sont pas des champs texte, et
   * l'exception de la loi 4 sur le contour ne les couvre pas.
   */
  type?: "text" | "email" | "url" | "password" | "tel";
  /**
   * Le texte du champ, tenu par l'appelant. À passer avec `onValueChange`, sans quoi le champ ne bougerait
   * plus. Le modèle est celui de `SearchField` et de `Tab` : `value` l'emporte sur `defaultValue`, et les
   * passer ensemble est une erreur d'appel (loi 11).
   */
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
  /** L'indice d'autoremplissage du navigateur : `"email"`, `"current-password"`, `"off"`… */
  autoComplete?: string;
} & TextFieldStatusProps;

/**
 * LES TROIS STATUTS, chacun avec ses trois tokens de couleur de retour et son icône de 16 px. Les classes
 * sont écrites en toutes lettres, jamais assemblées : Tailwind lit le source, pas l'exécution.
 */
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

/**
 * TextField — le champ texte générique du système : un libellé au-dessus, une pastille grise, une aide
 * ou un message dessous. Cousin de `SearchField` (il en copie la pastille et le contour au clavier),
 * pour le site de Neume, Consort et le portfolio. Spec :
 * `docs/specs/2026-11-11-lot-3-retours-formulaires-design.md` § 2.1, `create`, sans benchmark Mobbin
 * (en pause depuis le 2026-11-07). Les mots sont des props : le composant n'écrit aucun texte.
 *
 * L'ANATOMIE. Une colonne : le libellé en Geist 14 / 20 au primaire, à 8 px de la pastille ; la pastille,
 * 44 px de haut (`--size-touch-target`), en rayon plein comme `SearchField`, sur le gris des pistes
 * (`--color-search-field-surface`, un cran plus sombre au survol) ; l'aide ou le message, 8 px plus bas, en
 * `caption`. La pastille porte un filet de 1 px transparent au repos, pour que l'arrivée d'un statut ne
 * déplace rien. LA LARGEUR EST CELLE DU PARENT (loi 8) : le champ remplit ce qu'on lui donne. Le champ
 * remplit toute la pastille — marges comprises —, donc un clic sur la marge met le focus dedans sans
 * gestionnaire.
 *
 * LES STATUTS (décision de Florian, 2026-11-11, après le prototype : « super » pour le rouge et le vert,
 * l'orangé tourné vers l'orange). `negative`, `positive`, `warning` : la pastille passe au BLANC de la page
 * (`--color-surface`) et prend un filet de 1 px à la couleur du statut ; le message dessous prend la même
 * couleur et est précédé de l'icône (`alert-circle`, `check-circle`, `alert-triangle`, de Neume, à 16 px).
 * LA COULEUR NE VA JAMAIS SEULE (loi 7) : le type exige un `message` avec tout `status`, donc l'icône et
 * le mot sont toujours là. Le texte tient 4.5:1 sur la page, le filet 3:1 (paires dans
 * `scripts/contrast-pairs.json`). Le message est lu par l'assistance : `role="alert"` en négatif, une
 * annonce polie sinon ; `aria-invalid` dit l'erreur, et `aria-describedby` relie le champ à son aide ou à
 * son message.
 *
 * LES ÉTATS (loi 4). `hover` : la pastille un cran plus sombre, et le texte d'attente au secondaire, où le
 * tertiaire ne tient pas 4.5:1 — comme `SearchField`. `active` : identique au repos, un clic ne change rien.
 * `disabled` : le champ entier estompé (`--opacity-disabled`), SANS survol — règle du lot 1, un contrôle
 * désactivé n'a ni survol ni bulle. `focus-visible` : voir ci-dessous.
 *
 * LE CONTOUR, AU CLAVIER SEULEMENT, COMME `SEARCHFIELD` : l'exception datée du 2026-11-06 de la loi 4 sur le
 * moment du contour d'un champ texte. Florian : « quand on clique sur l'input, j'aimerais qu'il n'y ait pas
 * de contour ». Un clic n'allume rien ; Tab et Maj+Tab allument l'anneau du système sur la pastille (même
 * épaisseur, même décalage, même arrivée sur le ressort). LE CONTOUR PREND LA COULEUR DU STATUT — rouge en
 * négatif, vert en positif, orangé en avertissement : jamais retiré, jamais invisible (3:1 contre la page).
 * La modalité est lue par `lib/use-keyboard-focus.ts`, qui reprend celle de `SearchField`. L'exception de la
 * loi 4 est étendue le même jour aux types `email`, `url`, `password` et `tel` et à `type={type}` : ce sont
 * des champs de saisie texte, et la règle de `npm run check` ne le savait que pour `text` et `search`.
 *
 * L'UNION `type` EST FERMÉE à cinq types de saisie texte, et c'est ce qui autorise `type={type}` sur l'`<input>`
 * dont le contour est retiré : aucune case à cocher ne peut y arriver, le compilateur la refuse.
 *
 * COMPOSANT CLIENT (`runtime: "client"`) : la modalité du focus est un état à lui. Contrôlé (`value` +
 * `onValueChange`) ou non (`defaultValue`), comme `SearchField`.
 *
 * Histoire : `docs/history/text-field.md`.
 */
export function TextField({
  label,
  placeholder,
  help,
  type = "text",
  value,
  onValueChange,
  defaultValue,
  disabled,
  name,
  required,
  autoComplete,
  status,
  message,
}: TextFieldProps) {
  const id = useId();
  const noteId = `${id}-note`;
  const { keyboardFocus, onFocus, onBlur } = useKeyboardFocus();
  const tone = status ? STATUS[status] : null;
  const note = tone ? message : help;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-body text-body-sm font-medium text-text-primary">
        {label}
      </label>
      <div
        data-keyboard-focus={keyboardFocus ? "" : undefined}
        data-disabled={disabled ? "" : undefined}
        className={cn(
          "group flex min-h-[var(--size-touch-target)] items-center rounded-full",
          "border-[length:var(--border-thin)]",
          "transition-[background-color] duration-[var(--duration-fast)] ease-out",
          tone ? ["bg-surface", tone.border] : ["bg-search-field-surface", "border-transparent"],
          !tone && !disabled && "hover:bg-search-field-surface-hover",
          disabled && "opacity-[var(--opacity-disabled)]",
          "data-[keyboard-focus]:outline-solid data-[keyboard-focus]:outline-[length:var(--border-thick)]",
          "data-[keyboard-focus]:outline-offset-[var(--focus-ring-offset)]",
          tone ? tone.ring : "data-[keyboard-focus]:outline-focus-ring",
          "data-[keyboard-focus]:[animation:focus-ring-arrive_var(--duration-fast)_var(--ease-spring-pop)]",
        )}
      >
        <input
          id={id}
          type={type}
          name={name}
          value={value}
          defaultValue={value === undefined ? defaultValue : undefined}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          aria-invalid={status === "negative" ? true : undefined}
          aria-describedby={note ? noteId : undefined}
          onChange={(event) => onValueChange?.(event.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          className={cn(
            "min-w-0 flex-1 self-stretch appearance-none bg-transparent px-4 outline-none",
            "font-body text-body-sm text-text-primary placeholder:text-text-tertiary",
            !tone && !disabled && "group-hover:placeholder:text-text-secondary",
          )}
        />
      </div>
      {note ? (
        <p
          id={noteId}
          role={status === "negative" ? "alert" : undefined}
          aria-live={status && status !== "negative" ? "polite" : undefined}
          className={cn(
            "flex items-center gap-2 font-body text-caption",
            tone ? tone.text : "text-text-tertiary",
          )}
        >
          {tone ? <Icon name={tone.icon} size={16} /> : null}
          <span>{note}</span>
        </p>
      ) : null}
    </div>
  );
}
