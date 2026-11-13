import type { Env } from "./env";

export { RequestLimiter } from "./limiter";

/** Une réponse JSON du Worker, marquée `x-neume-worker` : le reste du site ne passe jamais par ce code. */
export function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "x-neume-worker": "1" },
  });
}

/**
 * Le Worker de neume.dev. `run_worker_first: ["/api/*"]` ne lui envoie que l'API ; un autre chemin
 * (`wrangler dev`, les tests) repart aux assets, comme si le code n'existait pas.
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (!pathname.startsWith("/api/")) return env.ASSETS.fetch(request);

    if (pathname === "/api/request") {
      if (request.method !== "POST") return json({ error: "method" }, 405);
      return json({ error: "not-implemented" }, 501);
    }
    return json({ error: "not-found" }, 404);
  },
} satisfies ExportedHandler<Env>;
