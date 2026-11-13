import type { RequestLimiter } from "./limiter";

/** Les liaisons du Worker `neume-dev` (`wrangler.jsonc`), et ses trois secrets. */
interface Bindings {
  ASSETS: Fetcher;
  REQUEST_IMAGES: R2Bucket;
  REQUEST_LIMITER: DurableObjectNamespace<RequestLimiter>;
  ISSUES_REPO: string;
  PRODUCTION_HOST: string;
  GITHUB_TOKEN: string;
  TURNSTILE_SECRET: string;
  IP_SALT: string;
}

export type Env = Bindings;

// L'`env` de `cloudflare:workers` et de `cloudflare:test` porte ces liaisons.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cloudflare {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface Env extends Bindings {}
  }
}
