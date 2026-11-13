/** Le formulaire « Request an icon », validé, et l'issue qu'il devient. Limites : spec § 5. */
export interface IconRequest {
  name: string;
  meaning: string;
  link: string | null;
  image: File | null;
}

export type Field = "name" | "meaning" | "link" | "image";

const NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const NAME_MAX = 40;
const MEANING_MAX = 2000;
const LINK_MAX = 500;
export const IMAGE_MAX = 2_097_152;

/** Le champ texte, sans espaces autour. Le navigateur envoie les retours à la ligne en `\r\n` : ramenés à `\n`,
 * ils comptent pour un caractère, comme dans le compteur du dialogue. */
const text = (form: FormData, key: string) => {
  const v = form.get(key);
  return typeof v === "string" ? v.replace(/\r\n?/g, "\n").trim() : "";
};

/** Ce qui n'a rien à faire dans un lien collé, et qui pourrait sortir de `<…>` dans le Markdown. */
const UNSAFE_IN_LINK = /[\s<>`\u0000-\u001f\u007f]/;

/** Le lien normalisé (`URL.href`), s'il est un `http(s)` propre ; sinon `null`. */
function httpHref(value: string): string | null {
  if (UNSAFE_IN_LINK.test(value)) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

/** Le formulaire lu et vérifié. Le premier champ fautif est nommé ; le type réel de l'image se vérifie plus tard. */
export function parseRequest(form: FormData): { ok: true; value: IconRequest } | { ok: false; field: Field } {
  const name = text(form, "name");
  if (!NAME.test(name) || name.length > NAME_MAX) return { ok: false, field: "name" };

  const meaning = text(form, "meaning");
  if (meaning.length === 0 || meaning.length > MEANING_MAX) return { ok: false, field: "meaning" };

  const rawLink = text(form, "link");
  const link = rawLink ? httpHref(rawLink) : null;
  if (rawLink && (link === null || link.length > LINK_MAX)) return { ok: false, field: "link" };

  const file = form.get("image");
  const image = file instanceof File && file.size > 0 ? file : null;
  if (image && image.size > IMAGE_MAX) return { ok: false, field: "image" };

  return { ok: true, value: { name, meaning, link, image } };
}

export const issueTitle = (name: string) => `Icon request: ${name}`;

/**
 * Le texte de l'utilisateur, en texte brut : dans un bloc de code, GitHub n'y lit ni mention, ni renvoi
 * d'issue, ni lien, ni image. La clôture est plus longue que la plus longue suite d'accents graves du texte,
 * pour qu'il ne puisse pas la refermer.
 */
function plainText(s: string): string {
  const longest = Math.max(0, ...(s.match(/`+/g) ?? []).map((run) => run.length));
  const fence = "`".repeat(Math.max(3, longest + 1));
  return `${fence}text\n${s}\n${fence}`;
}

/** Le corps Markdown de l'issue. */
export function issueBody(req: Omit<IconRequest, "image">, imageUrl: string | null): string {
  const lines = ["### What it should mean", "", plainText(req.meaning), ""];
  // En code, pas en lien : une URL d'issue GitHub ferait un renvoi (« mentioned this ») dans ce dépôt-là.
  // Le lien ne peut pas contenir d'accent grave (`httpHref`).
  if (req.link) lines.push("### Link", "", `\`${req.link}\``, "");
  if (imageUrl) lines.push("### Image", "", `![Reference](<${imageUrl}>)`, "");
  lines.push("---", "Sent from neume.dev");
  return lines.join("\n");
}
