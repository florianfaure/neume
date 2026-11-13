"use client";

import { useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FileField } from "@/components/ui/file-field";
import { Icon } from "@/components/ui/icon";
import { TextArea } from "@/components/ui/text-area";
import { TextField } from "@/components/ui/text-field";
import { TextLink } from "@/components/ui/text-link";
import { ISSUES_URL, REQUESTS_URL } from "./links";
import { Turnstile } from "./turnstile";

type Field = "name" | "meaning" | "link" | "image";

/** Les mots des champs refusés, côté client comme côté Worker (`worker/request.ts`). */
const FIELD_MESSAGE: Record<Field, string> = {
  name: "Use lowercase letters, numbers and hyphens, like arrow-up.",
  meaning: "Say what the icon should mean, in 2,000 characters at most.",
  link: "Paste a full link, starting with https://.",
  image: "Use a PNG, JPG or WebP image of 2 MB at most.",
};

const NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const IMAGE_MAX = 2_097_152;

/** La même règle que le Worker, dite avant l'envoi. Le Worker revérifie tout. */
function firstInvalid(name: string, meaning: string, link: string): Field | null {
  if (!NAME.test(name) || name.length > 40) return "name";
  if (meaning.length === 0 || meaning.length > 2000) return "meaning";
  if (link) {
    try {
      const { protocol } = new URL(link);
      if (protocol !== "https:" && protocol !== "http:") return "link";
    } catch {
      return "link";
    }
  }
  return null;
}

type Phase =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "done"; url: string; dryRun: boolean }
  | { kind: "failed"; message: string; fallback: boolean };

/**
 * Le dialogue « Request an icon » (`docs/specs/2026-11-13-demande-d-icone-design.md` § 5) : quatre champs,
 * le contrôle Turnstile, et l'envoi au Worker (`POST /api/request`), qui crée l'issue GitHub. Les champs ne
 * se vident jamais sur une erreur ; ils se vident à la fermeture après une réussite.
 */
export function RequestDialog({
  open,
  onOpenChange,
  initialName = "",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName?: string;
}) {
  const titleId = useId();
  const form = useRef<HTMLFormElement>(null);
  const [name, setName] = useState(initialName);
  const [meaning, setMeaning] = useState("");
  const [link, setLink] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [invalid, setInvalid] = useState<Field | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [token, setToken] = useState<string | null>(null);
  // Un jeton Turnstile ne sert qu'une fois : le widget renaît après chaque envoi, et le champ fichier après une réussite.
  const [round, setRound] = useState(0);
  const [lastInitial, setLastInitial] = useState(initialName);

  // Une nouvelle ouverture depuis la recherche de l'accueil propose son nom, sans écraser une saisie en cours.
  if (initialName !== lastInitial) {
    setLastInitial(initialName);
    if (initialName && !name) setName(initialName);
  }

  const reset = () => {
    setName("");
    setMeaning("");
    setLink("");
    setImage(null);
    setInvalid(null);
    setPhase({ kind: "idle" });
    setRound((r) => r + 1);
  };

  const status = (field: Field) =>
    invalid === field ? ({ status: "negative", message: FIELD_MESSAGE[field] } as const) : {};

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (phase.kind === "sending") return;
    const trimmed = { name: name.trim(), meaning: meaning.trim(), link: link.trim() };
    const bad = firstInvalid(trimmed.name, trimmed.meaning, trimmed.link);
    setInvalid(bad);
    if (bad) {
      setPhase({ kind: "idle" });
      return;
    }
    if (!token) {
      setPhase({ kind: "failed", message: "The spam check has not loaded. Wait a moment, then send again.", fallback: true });
      return;
    }

    const body = new FormData();
    body.append("name", trimmed.name);
    body.append("meaning", trimmed.meaning);
    body.append("link", trimmed.link);
    if (image) body.append("image", image);
    body.append("cf-turnstile-response", token);

    setPhase({ kind: "sending" });
    let res: Response;
    try {
      res = await fetch("/api/request", { method: "POST", body });
    } catch {
      setPhase({ kind: "failed", message: "Something went wrong.", fallback: true });
      return;
    } finally {
      setToken(null);
      setRound((r) => r + 1);
    }

    const data = (await res.json().catch(() => ({}))) as { url?: string; dryRun?: boolean; error?: string; field?: Field };
    if (res.status === 201 && data.url) {
      setPhase({ kind: "done", url: data.url, dryRun: data.dryRun === true });
      return;
    }
    if (data.error === "invalid" && data.field && data.field in FIELD_MESSAGE) {
      setInvalid(data.field);
      setPhase({ kind: "idle" });
      return;
    }
    if (data.error === "verification") {
      setPhase({ kind: "failed", message: "The spam check failed. Send again.", fallback: true });
      return;
    }
    if (data.error === "rate-limited") {
      setPhase({ kind: "failed", message: "You have sent three requests this hour. Try again later.", fallback: false });
      return;
    }
    setPhase({ kind: "failed", message: "Something went wrong.", fallback: true });
  }

  const sending = phase.kind === "sending";

  return (
    <Dialog
      width="md"
      open={open}
      onOpenChange={onOpenChange}
      onClosed={() => {
        if (phase.kind === "done") reset();
      }}
      labelledBy={titleId}
    >
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h2 id={titleId} className="min-w-0 font-pixel text-h4 text-text-primary">
              Request an icon
            </h2>
            <div className="ml-auto shrink-0">
              <Button label="Close" variant="ghost" content="icon" icon="close" tooltip="none" onClick={() => onOpenChange(false)} />
            </div>
          </div>
          {phase.kind !== "done" ? (
            <p className="font-body text-body-sm text-text-secondary">
              Your request becomes a public issue on GitHub. Leave out anything personal.
            </p>
          ) : null}
        </div>

        {phase.kind === "done" ? (
          <div className="flex flex-col gap-6">
            <div role="status" className="flex items-start gap-2 font-body text-body-sm text-text-primary">
              <span className="mt-0.5 flex shrink-0 text-text-positive">
                <Icon name="check-circle" size={16} />
              </span>
              <p>
                {phase.dryRun ? (
                  "Test mode: nothing was sent to GitHub."
                ) : (
                  <>
                    Thanks, your request is on GitHub.{" "}
                    <TextLink href={phase.url} newTab>
                      See the issue
                    </TextLink>
                  </>
                )}
              </p>
            </div>
            <div className="flex justify-end">
              <Button label="Done" variant="primary" onClick={() => onOpenChange(false)} />
            </div>
          </div>
        ) : (
          <form ref={form} noValidate onSubmit={submit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <TextField
                label="Name"
                placeholder="arrow-up-circle"
                help="The name you would expect to import, in kebab-case."
                value={name}
                onValueChange={(v) => {
                  setName(v);
                  if (invalid === "name") setInvalid(null);
                }}
                required
                disabled={sending}
                {...status("name")}
              />
              <TextArea
                label="What it should mean"
                placeholder="The action or object it stands for, and where you would use it."
                rows={4}
                maxLength={2000}
                value={meaning}
                onValueChange={(v) => {
                  setMeaning(v);
                  if (invalid === "meaning") setInvalid(null);
                }}
                required
                disabled={sending}
                {...status("meaning")}
              />
              <TextField
                label="Link (optional)"
                type="url"
                placeholder="https://"
                help="The same icon in another set, if you saw one."
                value={link}
                onValueChange={(v) => {
                  setLink(v);
                  if (invalid === "link") setInvalid(null);
                }}
                disabled={sending}
                {...status("link")}
              />
              <FileField
                label="Image (optional)"
                action="Choose an image or drop it here"
                removeLabel="Remove the image"
                help="PNG, JPG or WebP, up to 2 MB."
                accept="image/png,image/jpeg,image/webp"
                typeMessage="Use a PNG, JPG or WebP image."
                maxSize={IMAGE_MAX}
                sizeMessage="The image is over 2 MB."
                disabled={sending}
                onFileChange={(file) => {
                  setImage(file);
                  if (invalid === "image") setInvalid(null);
                }}
                {...status("image")}
              />
            </div>

            <Turnstile key={round} onToken={setToken} />

            <p className="font-body text-caption text-text-tertiary">
              Three requests an hour per connection. To count them, the site keeps a one-way fingerprint of your
              connection for that hour, never your address.
            </p>

            <div aria-live="polite" className="empty:hidden">
              {phase.kind === "failed" ? (
                <div className="flex items-start gap-2 font-body text-body-sm text-text-negative">
                  <span className="mt-0.5 flex shrink-0">
                    <Icon name="alert-circle" size={16} />
                  </span>
                  <p>
                    {phase.message}
                    {phase.fallback ? (
                      <>
                        {" "}
                        <TextLink href={ISSUES_URL} newTab>
                          Or open it on GitHub
                        </TextLink>
                      </>
                    ) : null}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <p className="font-body text-body-sm">
                <TextLink href={REQUESTS_URL} newTab>
                  See requests
                </TextLink>
              </p>
              <div className="ml-auto flex gap-2">
                <Button label="Cancel" variant="secondary" onClick={() => onOpenChange(false)} />
                <Button
                  label={sending ? "Sending" : "Send"}
                  variant="primary"
                  disabled={sending}
                  onClick={() => form.current?.requestSubmit()}
                />
              </div>
            </div>
          </form>
        )}
      </div>
    </Dialog>
  );
}
