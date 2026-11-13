import { DurableObject } from "cloudflare:workers";
import type { Env } from "./env";

/** Le compte des envois d'une empreinte de connexion. Rempli à la tâche 4. */
export class RequestLimiter extends DurableObject<Env> {}
