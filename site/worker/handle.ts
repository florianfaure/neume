import type { Env } from "./env";
import { CONTENT_TYPE, EXTENSION, sniffImage, stripMetadata } from "./image";
import { json } from "./json";
import { fingerprint } from "./limiter";
import { issueBody, issueTitle, parseRequest } from "./request";

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const DRY_RUN_URL = "https://github.com/florianfaure/neume/issues/0";
const IMAGE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp)$/;

/**
 * `POST /api/request` : la demande d'icône (spec § 6). Dans l'ordre : Turnstile, le formulaire, l'image
 * (reconnue et nettoyée en mémoire), la limite, puis le rangement dans R2 et l'issue — ou, hors de
 * `PRODUCTION_HOST`, leur seul journal. Un envoi invalide ou refusé ne compte pas et ne range rien.
 * `fetcher` sert aux appels sortants (Siteverify, GitHub) ; les tests en passent un faux.
 */
export async function handleRequest(request: Request, env: Env, fetcher: typeof fetch = fetch): Promise<Response> {
  const url = new URL(request.url);
  const production = url.hostname === env.PRODUCTION_HOST;
  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "invalid", field: "form" }, 400);
  }

  const verify = new FormData();
  verify.append("secret", env.TURNSTILE_SECRET);
  verify.append("response", String(form.get("cf-turnstile-response") ?? ""));
  verify.append("remoteip", ip);
  const verdict = await fetcher(SITEVERIFY, { method: "POST", body: verify })
    .then((r) => r.json<{ success?: boolean; hostname?: string }>())
    .catch(() => ({ success: false, hostname: undefined }));
  // En production, le jeton doit avoir été délivré sur neume.dev, pas sur une preview qui partage la clé.
  const goodHost = !production || verdict.hostname === env.PRODUCTION_HOST;
  if (verdict.success !== true || !goodHost) return json({ error: "verification" }, 403);

  const parsed = parseRequest(form);
  if (!parsed.ok) return json({ error: "invalid", field: parsed.field }, 400);
  const { image, ...fields } = parsed.value;

  let cleaned: { bytes: Uint8Array; id: string; type: string } | null = null;
  if (image) {
    const bytes = new Uint8Array(await image.arrayBuffer());
    const kind = sniffImage(bytes);
    if (!kind) return json({ error: "invalid", field: "image" }, 400);
    try {
      cleaned = { bytes: stripMetadata(bytes, kind), id: `${crypto.randomUUID()}.${EXTENSION[kind]}`, type: CONTENT_TYPE[kind] };
    } catch {
      return json({ error: "invalid", field: "image" }, 400);
    }
  }

  const limiter = env.REQUEST_LIMITER.get(env.REQUEST_LIMITER.idFromName(await fingerprint(ip, env.IP_SALT)));
  if (!(await limiter.hit(Date.now()))) return json({ error: "rate-limited" }, 429);

  const title = issueTitle(fields.name);
  const imageUrl = cleaned ? `https://${env.PRODUCTION_HOST}/api/request-image/${cleaned.id}` : null;
  const body = issueBody(fields, imageUrl);

  // Hors production (local, previews), rien n'est rangé ni créé : les previews partagent le bucket et le jeton.
  if (!production) {
    console.log(`[dry run] ${title}${cleaned ? ` (image ${cleaned.type}, ${cleaned.bytes.length} octets, non rangée)` : ""}\n${body}`);
    return json({ url: DRY_RUN_URL, dryRun: true }, 201);
  }

  if (cleaned) {
    await env.REQUEST_IMAGES.put(cleaned.id, cleaned.bytes, { httpMetadata: { contentType: cleaned.type } });
  }

  const res = await fetcher(`https://api.github.com/repos/${env.ISSUES_REPO}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "neume-dev",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, body, labels: ["icon-request"] }),
  }).catch(() => null);

  if (!res || res.status !== 201) {
    // Le jeton a peut-être expiré : la panne se lit dans les journaux du Worker, l'image orpheline s'en va.
    console.error(`GitHub a refusé l'issue : ${res ? `${res.status} ${await res.text()}` : "réseau"}`);
    if (cleaned) await env.REQUEST_IMAGES.delete(cleaned.id);
    return json({ error: "github" }, 502);
  }
  const { html_url } = await res.json<{ html_url: string }>();
  return json({ url: html_url }, 201);
}

/** `GET /api/request-image/<id>` : une image jointe à une demande, servie depuis R2 (le bucket n'est pas public). */
export async function handleImage(id: string, env: Env): Promise<Response> {
  if (!IMAGE_ID.test(id)) return json({ error: "not-found" }, 404);
  const object = await env.REQUEST_IMAGES.get(id);
  if (!object) return json({ error: "not-found" }, 404);
  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
