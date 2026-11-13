import { DurableObject } from "cloudflare:workers";
import type { Env } from "./env";

/** Trois demandes par heure et par empreinte de connexion (spec § 5). */
export const LIMIT = 3;
export const WINDOW_MS = 3_600_000;

/**
 * Ce qu'on compte d'une adresse : l'IPv4 entière (y compris écrite `::ffff:a.b.c.d`), et pour l'IPv6 son
 * préfixe /64 — un seul abonné en a des milliards, qu'il ferait tourner pour contourner la limite.
 */
export function connectionKey(ip: string): string {
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(ip);
  if (mapped) return mapped[1];
  if (!ip.includes(":")) return ip;
  const [head, tail = ""] = ip.toLowerCase().split("::");
  const left = head ? head.split(":") : [];
  const right = ip.includes("::") && tail ? tail.split(":") : [];
  const groups = ip.includes("::") ? [...left, ...new Array(8 - left.length - right.length).fill("0"), ...right] : left;
  return `${groups.slice(0, 4).map((g) => g.padStart(4, "0")).join(":")}::/64`;
}

/**
 * L'empreinte d'une connexion : SHA-256 de sa clé (`connectionKey`) et d'un sel secret, en hexadécimal.
 * L'adresse n'est jamais gardée ; sans le sel, l'empreinte ne la redonne pas.
 */
export async function fingerprint(ip: string, salt: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${connectionKey(ip)}|${salt}`));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Le compte des envois d'UNE empreinte (`idFromName(empreinte)`) : les horodatages de l'heure écoulée, rien
 * d'autre. Un envoi refusé ne compte pas. Une alarme efface ce qui a plus d'une heure, et tout l'objet quand
 * il ne reste rien : aucune trace ne survit à l'heure.
 */
export class RequestLimiter extends DurableObject<Env> {
  /** Vrai si l'envoi est permis, et alors compté. */
  async hit(now: number): Promise<boolean> {
    const hits = ((await this.ctx.storage.get<number[]>("hits")) ?? []).filter((t) => t > now - WINDOW_MS);
    if (hits.length >= LIMIT) return false;
    hits.push(now);
    await this.ctx.storage.put("hits", hits);
    if ((await this.ctx.storage.getAlarm()) === null) await this.ctx.storage.setAlarm(hits[0] + WINDOW_MS);
    return true;
  }

  async alarm(): Promise<void> {
    const now = Date.now();
    const hits = ((await this.ctx.storage.get<number[]>("hits")) ?? []).filter((t) => t > now - WINDOW_MS);
    if (hits.length === 0) {
      await this.ctx.storage.deleteAll();
      return;
    }
    await this.ctx.storage.put("hits", hits);
    await this.ctx.storage.setAlarm(hits[0] + WINDOW_MS);
  }
}
