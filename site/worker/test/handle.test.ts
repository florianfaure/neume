import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";
import { handleImage, handleRequest } from "../handle";

// Un faux réseau : Siteverify et GitHub répondent ce qu'on leur dit, et chaque appel est noté.
type Call = { url: string; init: RequestInit };
let calls: Call[];
let turnstileOk: boolean;
let turnstileHost: string;
let githubStatus: number;
const fetcher = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
  const url = String(input);
  calls.push({ url, init });
  if (url.startsWith("https://challenges.cloudflare.com/")) return Response.json({ success: turnstileOk, hostname: turnstileHost });
  if (url.startsWith("https://api.github.com/")) {
    return githubStatus === 201
      ? Response.json({ html_url: "https://github.com/florianfaure/neume/issues/42" }, { status: 201 })
      : new Response("Bad credentials", { status: githubStatus });
  }
  throw new Error(`unexpected fetch ${url}`);
}) as typeof fetch;

beforeEach(() => {
  calls = [];
  turnstileOk = true;
  turnstileHost = "neume.dev";
  githubStatus = 201;
});

let ipCounter = 0;
const freshIp = () => `198.51.100.${++ipCounter}`;

const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));
// Un JPEG minimal qui porte un EXIF avec une position.
const JPEG = Uint8Array.from([
  0xff, 0xd8,
  0xff, 0xe1, 0x00, 0x0d, ...ascii("Exif"), 0, 0, ...ascii("GPS 4"),
  0xff, 0xda, 0x00, 0x08, 1, 1, 0, 0, 0x3f, 0,
  0x12, 0x34,
  0xff, 0xd9,
]);

function post(origin: string, fields: Record<string, string | File>, ip = freshIp()) {
  const form = new FormData();
  form.append("cf-turnstile-response", "token");
  for (const [k, v] of Object.entries({ name: "arrow-up", meaning: "Go up", ...fields })) form.append(k, v);
  return new Request(`${origin}/api/request`, {
    method: "POST",
    body: form,
    headers: { "CF-Connecting-IP": ip, Origin: origin },
  });
}

const PROD = "https://neume.dev";
const LOCAL = "http://localhost:8787";
const githubCalls = () => calls.filter((c) => c.url.startsWith("https://api.github.com/"));

describe("POST /api/request", () => {
  it("403 when Turnstile says no", async () => {
    turnstileOk = false;
    const res = await handleRequest(post(PROD, {}, "203.0.113.9"), env, fetcher);
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "verification" });
    const body = calls[0].init.body as FormData;
    expect(body.get("secret")).toBe(env.TURNSTILE_SECRET);
    expect(body.get("response")).toBe("token");
    expect(body.get("remoteip")).toBe("203.0.113.9");
    expect(githubCalls()).toHaveLength(0);
  });

  it("400 when the body is not a form", async () => {
    const req = new Request(`${PROD}/api/request`, { method: "POST", body: "{}", headers: { "content-type": "application/json" } });
    expect((await handleRequest(req, env, fetcher)).status).toBe(400);
  });

  it("400 field when invalid, before counting", async () => {
    const ip = freshIp();
    for (let n = 0; n < 4; n++) {
      const res = await handleRequest(post(PROD, { name: "Arrow Up" }, ip), env, fetcher);
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "invalid", field: "name" });
    }
    expect((await handleRequest(post(PROD, {}, ip), env, fetcher)).status).toBe(201);
  });

  it("400 image when the bytes are not an image", async () => {
    const before = (await env.REQUEST_IMAGES.list()).objects.length;
    const svg = new File([`<svg xmlns="http://www.w3.org/2000/svg"/>`], "x.png", { type: "image/png" });
    const res = await handleRequest(post(PROD, { image: svg }), env, fetcher);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid", field: "image" });
    expect((await env.REQUEST_IMAGES.list()).objects).toHaveLength(before);
  });

  it("429 after three valid requests from the same ip, and stores nothing", async () => {
    const ip = freshIp();
    const before = (await env.REQUEST_IMAGES.list()).objects.length;
    for (let n = 0; n < 3; n++) expect((await handleRequest(post(PROD, {}, ip), env, fetcher)).status).toBe(201);
    const image = new File([JPEG], "ref.jpg", { type: "image/jpeg" });
    const res = await handleRequest(post(PROD, { image }, ip), env, fetcher);
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ error: "rate-limited" });
    expect((await env.REQUEST_IMAGES.list()).objects).toHaveLength(before);
  });

  it("dry run off production", async () => {
    const res = await handleRequest(post(LOCAL, {}), env, fetcher);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ url: "https://github.com/florianfaure/neume/issues/0", dryRun: true });
    expect(githubCalls()).toHaveLength(0);
  });

  it("dry run when the page is not neume.dev, even if the url says neume.dev", async () => {
    // `wrangler dev` réécrit l'hôte de la requête en celui de la route : seul l'Origin du navigateur dit vrai.
    const req = post(PROD, {});
    req.headers.set("Origin", LOCAL);
    const res = await handleRequest(req, env, fetcher);
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ dryRun: true });
    expect(githubCalls()).toHaveLength(0);
  });

  it("dry run without an Origin header", async () => {
    const req = post(PROD, {});
    req.headers.delete("Origin");
    expect(await (await handleRequest(req, env, fetcher)).json()).toMatchObject({ dryRun: true });
    expect(githubCalls()).toHaveLength(0);
  });

  it("creates the issue on production", async () => {
    const res = await handleRequest(post(PROD, { link: "https://example.com/i" }), env, fetcher);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ url: "https://github.com/florianfaure/neume/issues/42" });
    const [gh] = githubCalls();
    expect(gh.url).toBe("https://api.github.com/repos/florianfaure/neume/issues");
    expect(gh.init.method).toBe("POST");
    const headers = new Headers(gh.init.headers);
    expect(headers.get("Authorization")).toBe(`Bearer ${env.GITHUB_TOKEN}`);
    expect(headers.get("Accept")).toBe("application/vnd.github+json");
    expect(headers.get("X-GitHub-Api-Version")).toBe("2022-11-28");
    expect(headers.get("User-Agent")).toBe("neume-dev");
    const payload = JSON.parse(String(gh.init.body));
    expect(payload.title).toBe("Icon request: arrow-up");
    expect(payload.labels).toEqual(["icon-request"]);
    expect(payload.body).toContain("Go up");
    expect(payload.body).toContain("`https://example.com/i`");
  });

  it("stores a stripped image and links it", async () => {
    const image = new File([JPEG], "ref.jpg", { type: "image/jpeg" });
    const before = new Set((await env.REQUEST_IMAGES.list()).objects.map((o) => o.key));
    expect((await handleRequest(post(PROD, { image }), env, fetcher)).status).toBe(201);
    const added = (await env.REQUEST_IMAGES.list()).objects.filter((o) => !before.has(o.key));
    expect(added).toHaveLength(1);
    const key = added[0].key;
    expect(key).toMatch(/^[0-9a-f-]{36}\.jpg$/);
    const obj = await env.REQUEST_IMAGES.get(key);
    expect(obj?.httpMetadata?.contentType).toBe("image/jpeg");
    const stored = new Uint8Array(await obj!.arrayBuffer());
    expect(new TextDecoder("latin1").decode(stored)).not.toContain("Exif");
    const payload = JSON.parse(String(githubCalls()[0].init.body));
    expect(payload.body).toContain(`https://neume.dev/api/request-image/${key}`);
  });

  it("stores nothing off production", async () => {
    const before = (await env.REQUEST_IMAGES.list()).objects.length;
    const image = new File([JPEG], "ref.jpg", { type: "image/jpeg" });
    const res = await handleRequest(post(LOCAL, { image }), env, fetcher);
    expect(res.status).toBe(201);
    expect((await env.REQUEST_IMAGES.list()).objects).toHaveLength(before);
  });

  it("403 on production when the token was issued for another host", async () => {
    turnstileHost = "neume-dev.example.workers.dev";
    const res = await handleRequest(post(PROD, {}), env, fetcher);
    expect(res.status).toBe(403);
    expect(githubCalls()).toHaveLength(0);
  });

  it("502 when GitHub fails", async () => {
    githubStatus = 401;
    const res = await handleRequest(post(PROD, {}), env, fetcher);
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "github" });
  });
});

describe("GET /api/request-image/<id>", () => {
  const id = "0f8fad5b-d9cb-469f-a165-70867728950e.png";

  it("serves a stored image with a long cache", async () => {
    await env.REQUEST_IMAGES.put(id, new Uint8Array([1, 2, 3]), { httpMetadata: { contentType: "image/png" } });
    const res = await handleImage(id, env);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/png");
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=31536000, immutable");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect([...new Uint8Array(await res.arrayBuffer())]).toEqual([1, 2, 3]);
  });

  it.each(["0f8fad5b-d9cb-469f-a165-70867728950f.png", "../secret", "x.svg", "0f8fad5b-d9cb-469f-a165-70867728950e.gif"])(
    "404 for %j",
    async (bad) => expect((await handleImage(bad, env)).status).toBe(404),
  );
});
