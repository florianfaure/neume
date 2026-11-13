import { env } from "cloudflare:workers";
import { runDurableObjectAlarm, runInDurableObject } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { connectionKey, fingerprint, LIMIT, WINDOW_MS, type RequestLimiter } from "../limiter";

const stub = (name: string) => env.REQUEST_LIMITER.get(env.REQUEST_LIMITER.idFromName(name));
// Proche de l’heure réelle : une alarme posée dans le passé partirait aussitôt et viderait le compte.
const T = Date.now();

describe("RequestLimiter", () => {
  it("allows three hits in an hour, refuses the fourth", async () => {
    const s = stub("a");
    expect(LIMIT).toBe(3);
    expect(await s.hit(T)).toBe(true);
    expect(await s.hit(T + 1)).toBe(true);
    expect(await s.hit(T + 2)).toBe(true);
    expect(await s.hit(T + 3)).toBe(false);
  });

  it("allows again once the first hit is an hour old", async () => {
    const s = stub("b");
    await s.hit(T);
    await s.hit(T + 1);
    await s.hit(T + 2);
    expect(await s.hit(T + WINDOW_MS - 1)).toBe(false);
    expect(await s.hit(T + WINDOW_MS)).toBe(true);
  });

  it("does not count a refused hit", async () => {
    const s = stub("c");
    for (const t of [T, T + 1, T + 2, T + 3, T + 4]) await s.hit(t);
    // Les deux refus ne s'ajoutent pas : à T + 1 h + 1, deux envois sont sortis de la fenêtre.
    expect(await s.hit(T + WINDOW_MS + 1)).toBe(true);
    expect(await s.hit(T + WINDOW_MS + 2)).toBe(true);
  });

  it("alarm forgets everything older than an hour", async () => {
    const s = stub("d");
    const now = Date.now();
    // Deux envois de plus d'une heure, posés à la main ; l'alarme est armée pour plus tard, puis déclenchée.
    await runInDurableObject(s, async (_o: RequestLimiter, state) => {
      await state.storage.put("hits", [now - WINDOW_MS - 10, now - WINDOW_MS - 5]);
      await state.storage.setAlarm(now + 60_000);
    });
    expect(await runDurableObjectAlarm(s)).toBe(true);
    await runInDurableObject(s, async (_o: RequestLimiter, state) => {
      expect(await state.storage.get("hits")).toBeUndefined();
      expect(await state.storage.getAlarm()).toBeNull();
    });
  });

  it("alarm keeps recent hits and re-arms", async () => {
    const s = stub("e");
    const now = Date.now();
    await s.hit(now - WINDOW_MS - 5);
    await s.hit(now - 1000);
    await runInDurableObject(s, async (_o: RequestLimiter, state) => {
      await state.storage.setAlarm(now);
    });
    await runDurableObjectAlarm(s);
    await runInDurableObject(s, async (_o: RequestLimiter, state) => {
      expect(await state.storage.get("hits")).toEqual([now - 1000]);
      expect(await state.storage.getAlarm()).toBe(now - 1000 + WINDOW_MS);
    });
  });
});

describe("fingerprint", () => {
  it("is stable, salted and never contains the ip", async () => {
    const a = await fingerprint("203.0.113.7", "s1");
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(await fingerprint("203.0.113.7", "s1")).toBe(a);
    expect(await fingerprint("203.0.113.7", "s2")).not.toBe(a);
    expect(a).not.toContain("203.0.113.7");
  });
});

describe("connectionKey", () => {
  it("keeps an IPv4 address whole", () => {
    expect(connectionKey("203.0.113.7")).toBe("203.0.113.7");
    expect(connectionKey("::ffff:203.0.113.7")).toBe("203.0.113.7");
  });

  it("reduces an IPv6 address to its /64, whatever its spelling", () => {
    const k = connectionKey("2001:db8:1:2:aaaa::1");
    expect(k).toBe("2001:0db8:0001:0002::/64");
    expect(connectionKey("2001:DB8:1:2:bbbb:cccc:dddd:9")).toBe(k);
    expect(connectionKey("2001:db8:1:3::1")).not.toBe(k);
    expect(connectionKey("2001:db8::1")).toBe("2001:0db8:0000:0000::/64");
  });
});
