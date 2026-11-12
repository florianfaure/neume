"use client";

import { useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useKeyboardFocus } from "@/lib/use-keyboard-focus";
import { cn } from "@/lib/cn";

interface SubscribeFormProps {
  /**
   * L'adresse qui reçoit l'inscription : celle d'un service extérieur — Buttondown, Brevo… —, fournie par
   * l'appelant, parce que les sites n'ont pas de serveur (`output: "export"`). REQUISE. Sans JavaScript,
   * le formulaire la poste en natif.
   */
  action: string;
  /** La méthode d'envoi. `post` (défaut) pour un service d'inscription ; `get` ajoute l'adresse à la requête. */
  method?: "post" | "get";
  /** Le nom du champ envoyé au service : `email` chez Buttondown. Défaut `"email"`. */
  fieldName?: string;
  /** Le nom accessible du champ, en `<label>` invisible. Défaut « Email » : un petit texte système. */
  label?: string;
  /** Le texte d'attente du champ. Défaut « you@example.com ». */
  placeholder?: string;
  /** Une aide sous le champ, au repos : « Once a month, no spam. » Facultative ; un retour la remplace. */
  help?: string;
  /** Le mot du bouton au repos. Défaut « Subscribe ». */
  submitLabel?: string;
  /** Le mot du bouton pendant l'envoi. Défaut « Sending ». */
  sendingLabel?: string;
  /** Le mot du bouton une fois inscrit. Défaut « Subscribed ». */
  doneLabel?: string;
  /** Le message d'une adresse invalide, dit avant tout envoi. Défaut « Enter a valid email address. ». */
  invalidMessage?: string;
  /** Le message de la réussite. Défaut « Thanks! Check your inbox to confirm. ». */
  successMessage?: string;
  /** Le message de l'échec du réseau. Défaut « Something went wrong. Try again. ». */
  errorMessage?: string;
}

/** Les quatre moments : repos, envoi, réussite, erreur — dont l'adresse invalide. */
type Phase = "idle" | "sending" | "done" | "failed";

/** Une adresse plausible : quelque chose, un @, quelque chose, un point, quelque chose. Le service tranche le reste. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * SubscribeForm — l'inscription à une newsletter : un champ e-mail en pastille, le `Button` primaire
 * DEDANS. Il naît pour la place `newsletter` de `Footer` et pour Consort. Spec :
 * `docs/specs/2026-11-11-lot-3-retours-formulaires-design.md` § 2.2, `create`, sans benchmark Mobbin.
 * Copié sur `TextField` (la pastille, le contour au clavier) et sur `Button`. Tous les mots sont des props
 * avec un défaut anglais remplaçable.
 *
 * L'ANATOMIE, CELLE DU PROTOTYPE : une pastille en rayon plein sur le gris des pistes, de 44 px — 4 de marge,
 * le bouton de 36 —, le champ à gauche, le bouton à droite ; sous elle, l'aide ou le retour, en `caption`.
 * LA LARGEUR EST CELLE DU PARENT (loi 8).
 *
 * QUATRE MOMENTS. REPOS : l'aide, `arrow-right` et « Subscribe ». ENVOI : « Sending », le glyphe `loader` qui
 * tourne (`globals.css`, en huit paliers), le bouton désactivé. RÉUSSITE : `check-circle` à 16 px et le message en
 * vert, le bouton dit « Subscribed » — son `check` arrive sur le ressort de `Button`, après un clic —, désactivé.
 * ERREUR : `alert-circle` à 16 px et le message en rouge, le bouton revient. Une adresse invalide est une erreur dite
 * AVANT tout envoi, et le focus revient au champ. Taper dans le champ efface l'erreur. LA COULEUR NE VA JAMAIS
 * SEULE (loi 7) : l'icône et le mot sont toujours là ; la zone du message est une région `aria-live` polie.
 *
 * LE GLYPHE EST AVANT LE MOT, ET C'EST `Button` QUI L'IMPOSE. Le prototype posait la flèche après « Subscribe » ;
 * `Button` n'a que `"icon-label"`, glyphe devant, et sa docstring interdit un `iconPosition`
 * (« Ne pas rouvrir la décision d'origine »). Le composant la respecte : `arrow-right`, `loader` et `check`
 * précèdent le mot. Le mouvement de la flèche se juge à l'œil sur la vitrine.
 *
 * L'ENVOI EST UN `fetch` EN `no-cors`, LE PLUS SIMPLE QUI MARCHE AVEC UN SERVICE TYPE BUTTONDOWN
 * (`https://buttondown.com/api/emails/embed-subscribe/<nom>`) : ces services n'envoient pas d'en-têtes CORS, et
 * un `POST` de formulaire (`application/x-www-form-urlencoded`) reste une requête « simple », sans pré-vol. La
 * réponse est OPAQUE : on ne lit ni le statut ni le corps. La réussite est donc « la requête est partie et le
 * réseau a répondu » ; l'erreur est une requête qui échoue (hors ligne, adresse injoignable). Un refus du
 * service — adresse déjà inscrite, liste fermée — ne se voit pas : c'est le prix du `no-cors`, et ce que le
 * service dit à l'inscrit passe par son propre e-mail de confirmation. Sans JavaScript, le formulaire se poste en
 * natif, à `action`, avec Entrée dans le champ.
 *
 * LE BOUTON PASSE PAR `requestSubmit()` : `Button` rend un `<button type="button">` et n'a pas de forme
 * `submit`, et Entrée dans l'unique champ d'un formulaire le soumet nativement. Les deux chemins arrivent au
 * même gestionnaire, qui valide, puis envoie.
 *
 * LE CONTOUR, AU CLAVIER SEULEMENT, sur la pastille, comme `TextField` (exception de la loi 4, étendue à `email`) ;
 * `lib/use-keyboard-focus.ts`. Le bouton garde son anneau du système.
 *
 * COMPOSANT CLIENT (`runtime: "client"`) : l'état d'envoi, la modalité du focus, `fetch`.
 *
 * Histoire : `docs/history/subscribe-form.md`.
 */
export function SubscribeForm({
  action,
  method = "post",
  fieldName = "email",
  label = "Email",
  placeholder = "you@example.com",
  help,
  submitLabel = "Subscribe",
  sendingLabel = "Sending",
  doneLabel = "Subscribed",
  invalidMessage = "Enter a valid email address.",
  successMessage = "Thanks! Check your inbox to confirm.",
  errorMessage = "Something went wrong. Try again.",
}: SubscribeFormProps) {
  const id = useId();
  const form = useRef<HTMLFormElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const { keyboardFocus, onFocus, onBlur } = useKeyboardFocus();
  const [phase, setPhase] = useState<Phase>("idle");
  const [note, setNote] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (phase === "sending" || phase === "done") return;

    const address = String(new FormData(event.currentTarget).get(fieldName) ?? "").trim();
    if (!EMAIL.test(address)) {
      setPhase("failed");
      setNote(invalidMessage);
      field.current?.focus();
      return;
    }

    setPhase("sending");
    setNote(null);
    try {
      const body = new URLSearchParams({ [fieldName]: address });
      const response =
        method === "get"
          ? await fetch(`${action}${action.includes("?") ? "&" : "?"}${body}`, { mode: "no-cors" })
          : await fetch(action, { method: "POST", mode: "no-cors", body });
      /* Opaque : on ne lit rien, et c'est la réussite. Une réponse lisible — le même site — doit être `ok`. */
      if (response.type !== "opaque" && !response.ok) throw new Error(String(response.status));
      setPhase("done");
      setNote(successMessage);
    } catch {
      setPhase("failed");
      setNote(errorMessage);
    }
  };

  const failed = phase === "failed";
  const text = note ?? (phase === "idle" ? help : undefined);

  return (
    <form
      ref={form}
      action={action}
      method={method}
      noValidate
      onSubmit={submit}
      data-subscribe-state={phase}
      className={cn(
        "flex flex-col",
        "[&[data-subscribe-state=sending]_button_svg]:[animation:loader-spin_var(--duration-spin)_steps(8)_infinite]",
      )}
    >
      <div
        data-keyboard-focus={keyboardFocus ? "" : undefined}
        className={cn(
          "group flex items-center rounded-full bg-search-field-surface p-1",
          "transition-[background-color] duration-[var(--duration-fast)] ease-out",
          "hover:bg-search-field-surface-hover",
          "data-[keyboard-focus]:outline-solid data-[keyboard-focus]:outline-[length:var(--border-thick)]",
          "data-[keyboard-focus]:outline-offset-[var(--focus-ring-offset)] data-[keyboard-focus]:outline-focus-ring",
          "data-[keyboard-focus]:[animation:focus-ring-arrive_var(--duration-fast)_var(--ease-spring-pop)]",
        )}
      >
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        <input
          ref={field}
          id={id}
          type="email"
          name={fieldName}
          placeholder={placeholder}
          autoComplete="email"
          aria-invalid={failed ? true : undefined}
          aria-describedby={text ? `${id}-note` : undefined}
          onChange={() => {
            if (failed) {
              setPhase("idle");
              setNote(null);
            }
          }}
          onFocus={onFocus}
          onBlur={onBlur}
          className={cn(
            "min-w-0 flex-1 self-stretch appearance-none bg-transparent pr-2 pl-4 outline-none",
            "font-body text-body-sm text-text-primary placeholder:text-text-tertiary",
            "group-hover:placeholder:text-text-secondary",
          )}
        />
        <Button
          label={phase === "sending" ? sendingLabel : phase === "done" ? doneLabel : submitLabel}
          content="icon-label"
          icon={phase === "sending" ? "loader" : phase === "done" ? "check" : "arrow-right"}
          disabled={phase === "sending" || phase === "done"}
          onClick={() => form.current?.requestSubmit()}
        />
      </div>
      <p
        id={`${id}-note`}
        aria-live="polite"
        className={cn(
          "flex items-center gap-2 font-body text-caption",
          text && "mt-2",
          failed
            ? "text-text-negative"
            : phase === "done"
              ? "text-text-positive"
              : "text-text-tertiary",
        )}
      >
        {text && failed ? <Icon name="alert-circle" size={16} /> : null}
        {text && phase === "done" ? <Icon name="check-circle" size={16} /> : null}
        {text ? <span>{text}</span> : null}
      </p>
    </form>
  );
}
