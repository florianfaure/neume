import type { Env } from "./env";
import { handleImage, handleRequest } from "./handle";
import { json } from "./json";

export { RequestLimiter } from "./limiter";

const IMAGE_PREFIX = "/api/request-image/";

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
      return handleRequest(request, env);
    }
    if (pathname.startsWith(IMAGE_PREFIX) && request.method === "GET") {
      return handleImage(pathname.slice(IMAGE_PREFIX.length), env);
    }
    return json({ error: "not-found" }, 404);
  },
} satisfies ExportedHandler<Env>;
