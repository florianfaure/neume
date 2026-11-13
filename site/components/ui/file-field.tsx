"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useKeyboardFocus } from "@/lib/use-keyboard-focus";
import { cn } from "@/lib/cn";

/** Le statut et son message vont ENSEMBLE, comme chez `TextField` (loi 7). */
type FileFieldStatusProps =
  | { status?: undefined; message?: never }
  | {
      /** L'état de retour posé par l'appelant : `negative`, `positive`, `warning`, comme chez `TextField`. */
      status: "negative" | "positive" | "warning";
      /** Le message du statut, écrit par l'appelant. Requis avec `status`. */
      message: string;
    };

/** Un filtre de type n'existe pas sans le mot qui dit le refus : sans lui, le refus serait une couleur seule. */
type FileFieldAcceptProps =
  | { accept?: undefined; typeMessage?: never }
  | {
      /**
       * Les types acceptés, à la syntaxe de l'attribut natif : types MIME (`image/png`), familles
       * (`image/*`) ou extensions (`.png`), séparés par des virgules. Filtre le sélecteur du système, et
       * refuse un fichier hors liste, choisi ou déposé.
       */
      accept: string;
      /** Le message du refus de type, dit dans le statut `negative`. Requis avec `accept`. */
      typeMessage: string;
    };

/** Un poids maximum n'existe pas sans le mot qui dit le refus. */
type FileFieldSizeProps =
  | { maxSize?: undefined; sizeMessage?: never }
  | {
      /** Le poids maximum, en octets. Un fichier plus lourd est refusé. */
      maxSize: number;
      /** Le message du refus de poids, dit dans le statut `negative`. Requis avec `maxSize`. */
      sizeMessage: string;
    };

type FileFieldProps = {
  /** Le libellé, AU-DESSUS de la zone, et le nom accessible du champ fichier. REQUIS. */
  label: string;
  /** La phrase de la zone vide, sous l'icône : « Choose an image or drop it here ». REQUISE. */
  action: string;
  /** Le nom accessible du bouton qui retire le fichier choisi, et le texte de sa bulle. REQUIS. */
  removeLabel: string;
  /** Une aide, sous la zone, au tertiaire — les types et le poids acceptés. Un statut la remplace. */
  help?: string;
  /** Le nom du champ dans un formulaire natif : le fichier part avec le formulaire, tel quel. */
  name?: string;
  /** Champ obligatoire : l'attribut natif `required`. */
  required?: boolean;
  /** Désactivé : estompé, sans survol, hors de l'ordre de tabulation, sourd au dépôt. */
  disabled?: boolean;
  /** Appelé quand le fichier change : le fichier accepté, ou `null` quand il est retiré ou refusé. */
  onFileChange?: (file: File | null) => void;
} & FileFieldStatusProps &
  FileFieldAcceptProps &
  FileFieldSizeProps;

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

/** Vrai si le fichier répond à l'un des motifs de `accept` : type exact, famille `x/*`, ou extension. */
function matchesAccept(file: File, accept: string) {
  const type = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  return accept
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)
    .some((pattern) => {
      if (pattern.startsWith(".")) return fileName.endsWith(pattern);
      if (pattern.endsWith("/*")) return type.startsWith(pattern.slice(0, -1));
      return type === pattern;
    });
}

/** Le poids, en anglais et en base 1 000, comme le Finder : « 517 bytes », « 820 kB », « 1.2 MB ». */
function formatSize(bytes: number) {
  const [unit, value] =
    bytes >= 1_000_000
      ? (["megabyte", bytes / 1_000_000] as const)
      : bytes >= 1_000
        ? (["kilobyte", bytes / 1_000] as const)
        : (["byte", bytes] as const);
  return new Intl.NumberFormat("en-US", {
    style: "unit",
    unit,
    unitDisplay: unit === "byte" ? "long" : "short",
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * FileField — choisir ou déposer UN fichier. Un libellé au-dessus, une zone grise, une aide dessous ; le
 * fichier choisi prend la place de la zone, avec sa vignette, son nom, son poids et un bouton pour le
 * retirer. Né pour le champ « Image » du dialogue « Request an icon » de neume.dev (PNG, JPG ou WebP, 2 Mo au
 * plus). Spec : `docs/specs/2026-11-13-zone-de-texte-et-fichier-design.md` § 3, `create`, sans benchmark
 * Mobbin (en pause depuis le 2026-11-07). Les mots sont des props ; le composant n'écrit que le poids.
 *
 * UN VRAI `<input type="file">`, ET C'EST LUI LE CONTRÔLE. Masqué à l'œil (`sr-only`) mais focusable, nommé
 * par le libellé et par la zone, qui sont ses deux `<label>`. Tab y arrive, Espace ouvre le sélecteur du
 * système, et un lecteur d'écran l'annonce comme un champ fichier. Dans un `<form>` natif, le fichier part
 * avec le formulaire sans une ligne de JavaScript. Un fichier DÉPOSÉ est écrit dans le même champ (par un
 * `DataTransfer`), donc il part aussi. Le champ reste dans le DOM quand un fichier est choisi : Tab y passe
 * encore, pour en choisir un autre, puis va au bouton qui retire.
 *
 * LES DEUX FACES. VIDE : la zone, au gris de `TextField` et au rayon de 16 px de `TextArea`, l'icône `upload`
 * de 24 px et la phrase `action` au tertiaire, qui passent au secondaire au survol avec la zone un cran plus
 * sombre — le texte d'attente de `TextField`. Quand un fichier passe au-dessus, la zone prend en plus un
 * filet au gris fort (`--color-border-strong`) : un second signal, non chromatique, que la zone attend le
 * dépôt. CHOISI : une ligne, au même gris, sans survol (rien n'y est cliquable que le bouton) : la vignette de
 * 48 px (`--size-file-field-thumb`, rayon de 8 px, `object-cover`) si c'est une image, l'icône `file` sinon ;
 * le nom (tronqué) au primaire et le poids au tertiaire, en `caption` ; le `Button` `ghost` icône seule `close`,
 * avec sa bulle, nommé par `removeLabel`. Le retrait rend le focus au champ.
 *
 * LE REFUS. `accept` et `maxSize` sont vérifiés au choix comme au dépôt — le sélecteur du système filtre déjà
 * sur `accept`, mais on peut lui dire « tous les fichiers ». Un fichier refusé est retiré du champ, et le
 * statut `negative` de `TextField` prend la place de l'aide, avec `typeMessage` ou `sizeMessage`. Le type
 * EXIGE le message avec la limite : un refus sans mot serait une couleur seule (loi 7). Le refus l'emporte sur
 * le statut de l'appelant, et tombe au choix suivant.
 *
 * LES ÉTATS (loi 4). `hover` : sur la zone vide seulement — un cran plus sombre au repos ; EN STATUT, le
 * blanc de la zone reprend le gris du repos et le filet coloré reste (Florian, 2026-11-13 : « il n'y a pas
 * de rollover » en négatif, positif ou attention), comme chez `TextField` et `TextArea`. `active` : identique au repos. `focus-visible` :
 * au clavier seulement, sur la zone ou la ligne, à la couleur du statut — la modalité de `TextField`
 * (`lib/use-keyboard-focus.ts`), peinte sous `data-[keyboard-focus]:`. Le champ masqué n'a pas d'`outline`
 * visible à retirer : il est découpé à 1 px. `disabled` : estompé, sans survol, sourd au dépôt, le bouton de
 * retrait désactivé avec lui.
 *
 * COMPOSANT CLIENT (`runtime: "client"`) : le fichier choisi, l'aperçu, le refus et la modalité du focus sont
 * des états à lui. Il n'est PAS contrôlé : la valeur d'un champ fichier ne s'écrit pas depuis l'extérieur.
 * L'appelant suit le fichier par `onFileChange`.
 *
 * Histoire : `docs/history/file-field.md`.
 */
export function FileField({
  label,
  action,
  removeLabel,
  help,
  name,
  required,
  disabled,
  onFileChange,
  status,
  message,
  accept,
  typeMessage,
  maxSize,
  sizeMessage,
}: FileFieldProps) {
  const id = useId();
  const noteId = `${id}-note`;
  const input = useRef<HTMLInputElement>(null);
  const { keyboardFocus, onFocus, onBlur } = useKeyboardFocus();
  const [chosen, setChosen] = useState<{ file: File; preview: string | null } | null>(null);
  const [refusal, setRefusal] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  // L'aperçu naît avec le fichier (une URL `blob:`), et se libère quand le fichier change ou part.
  useEffect(() => {
    const url = chosen?.preview;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [chosen]);
  const file = chosen?.file ?? null;
  const preview = chosen?.preview ?? null;

  const shownStatus = refusal ? "negative" : status;
  const tone = shownStatus ? STATUS[shownStatus] : null;
  const note = refusal ?? (status ? message : help);

  function take(next: File | null) {
    if (next && accept && typeMessage && !matchesAccept(next, accept)) {
      return refuse(typeMessage);
    }
    if (next && maxSize !== undefined && sizeMessage && next.size > maxSize) {
      return refuse(sizeMessage);
    }
    setRefusal(null);
    setChosen(
      next
        ? { file: next, preview: next.type.startsWith("image/") ? URL.createObjectURL(next) : null }
        : null,
    );
    onFileChange?.(next);
  }

  function refuse(words: string) {
    if (input.current) input.current.value = "";
    setRefusal(words);
    setChosen(null);
    onFileChange?.(null);
  }

  function remove() {
    if (input.current) {
      input.current.value = "";
      input.current.focus();
    }
    setRefusal(null);
    setChosen(null);
    onFileChange?.(null);
  }

  function onDragOver(event: DragEvent<HTMLDivElement>) {
    if (disabled || !event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setDragging(true);
  }

  function onDragLeave(event: DragEvent<HTMLDivElement>) {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    setDragging(false);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    if (disabled) return;
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files[0];
    if (!dropped || !input.current) return;
    const transfer = new DataTransfer();
    transfer.items.add(dropped);
    input.current.files = transfer.files;
    take(dropped);
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-body text-body-sm font-medium text-text-primary">
        {label}
      </label>
      <div
        data-keyboard-focus={keyboardFocus ? "" : undefined}
        data-disabled={disabled ? "" : undefined}
        onDragEnter={onDragOver}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "group relative rounded-2xl",
          "border-[length:var(--border-thin)]",
          "transition-[background-color,border-color] duration-[var(--duration-fast)] ease-out",
          tone
            ? ["bg-surface", tone.border]
            : dragging
              ? ["bg-search-field-surface-hover", "border-border-strong"]
              : ["bg-search-field-surface", "border-transparent"],
          !file &&
            !disabled &&
            (tone ? "hover:bg-search-field-surface" : "hover:bg-search-field-surface-hover"),
          disabled && "opacity-[var(--opacity-disabled)]",
          "data-[keyboard-focus]:outline-solid data-[keyboard-focus]:outline-[length:var(--border-thick)]",
          "data-[keyboard-focus]:outline-offset-[var(--focus-ring-offset)]",
          tone ? tone.ring : "data-[keyboard-focus]:outline-focus-ring",
          "data-[keyboard-focus]:[animation:focus-ring-arrive_var(--duration-fast)_var(--ease-spring-pop)]",
        )}
      >
        <input
          ref={input}
          id={id}
          type="file"
          name={name}
          accept={accept}
          required={required}
          disabled={disabled}
          aria-invalid={shownStatus === "negative" ? true : undefined}
          aria-describedby={note ? noteId : undefined}
          onChange={(event) => take(event.target.files?.[0] ?? null)}
          onFocus={onFocus}
          onBlur={onBlur}
          className="sr-only"
        />
        {file ? (
          <div className="flex items-center gap-3 p-2">
            <span className="flex size-[var(--size-file-field-thumb)] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface text-text-tertiary">
              {preview ? (
                <Image
                  src={preview}
                  alt=""
                  width={48}
                  height={48}
                  unoptimized
                  className="size-full object-cover"
                />
              ) : (
                <Icon name="file" size={24} />
              )}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-body text-body-sm text-text-primary">{file.name}</span>
              <span className="font-body text-caption text-text-tertiary tabular-nums">
                {formatSize(file.size)}
              </span>
            </span>
            {/* L'enveloppe de la bulle de `Button` se cale en haut de son parent : cette boîte, centrée dans la
             * ligne, la remet à mi-hauteur sans toucher au bouton. */}
            <span className="flex shrink-0">
              <Button
                variant="ghost"
                content="icon"
                icon="close"
                label={removeLabel}
                disabled={disabled}
                onClick={remove}
              />
            </span>
          </div>
        ) : (
          <label
            htmlFor={id}
            className={cn(
              "flex flex-col items-center gap-2 px-4 py-6 text-center",
              "font-body text-body-sm text-text-tertiary",
              !disabled && "group-hover:text-text-secondary",
              disabled ? "cursor-not-allowed" : "cursor-pointer",
            )}
          >
            <Icon name="upload" size={24} />
            <span>{action}</span>
          </label>
        )}
      </div>
      {note ? (
        <p
          id={noteId}
          role={shownStatus === "negative" ? "alert" : undefined}
          aria-live={shownStatus && shownStatus !== "negative" ? "polite" : undefined}
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
