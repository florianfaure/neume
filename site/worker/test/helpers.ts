import { exports } from "cloudflare:workers";

/** Le Worker sous test, appelé comme le ferait Cloudflare. `exports` n'est pas typé par défaut. */
const worker = (exports as unknown as { default: Fetcher }).default;

export const call = (url: string, init?: RequestInit) => worker.fetch(new Request(url, init));
