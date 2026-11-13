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

const text = (form: FormData, key: string) => {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
};

function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

/** Le formulaire lu et vérifié. Le premier champ fautif est nommé ; le type réel de l'image se vérifie plus tard. */
export function parseRequest(form: FormData): { ok: true; value: IconRequest } | { ok: false; field: Field } {
  const name = text(form, "name");
  if (!NAME.test(name) || name.length > NAME_MAX) return { ok: false, field: "name" };

  const meaning = text(form, "meaning");
  if (meaning.length === 0 || meaning.length > MEANING_MAX) return { ok: false, field: "meaning" };

  const rawLink = text(form, "link");
  if (rawLink && (rawLink.length > LINK_MAX || !isHttpUrl(rawLink))) return { ok: false, field: "link" };

  const file = form.get("image");
  const image = file instanceof File && file.size > 0 ? file : null;
  if (image && image.size > IMAGE_MAX) return { ok: false, field: "image" };

  return { ok: true, value: { name, meaning, link: rawLink || null, image } };
}

export const issueTitle = (name: string) => `Icon request: ${name}`;

/**
 * Le texte de l'utilisateur, rendu inoffensif sur GitHub : un espace sans chasse après `@` et après un `#`
 * suivi d'un chiffre, pour ne notifier personne et ne renvoyer vers aucune issue. Il se lit pareil.
 */
const neutralise = (s: string) => s.replace(/@/g, "@​").replace(/#(?=\d)/g, "#​");

/** Le corps Markdown de l'issue. */
export function issueBody(req: Omit<IconRequest, "image">, imageUrl: string | null): string {
  const lines = ["### What it should mean", "", neutralise(req.meaning), ""];
  if (req.link) lines.push("### Link", "", `<${req.link}>`, "");
  if (imageUrl) lines.push("### Image", "", `![Reference](<${imageUrl}>)`, "");
  lines.push("---", "Sent from neume.dev");
  return lines.join("\n");
}
