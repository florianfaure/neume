import { describe, expect, it } from "vitest";
import { call as callUrl } from "./helpers";

const call = (path: string, init?: RequestInit) => callUrl(`http://localhost${path}`, init);

describe("routing", () => {
  it("answers 404 on an unknown /api route", async () => {
    const res = await call("/api/nope");
    expect(res.status).toBe(404);
    expect(res.headers.get("x-neume-worker")).toBe("1");
  });

  it("answers 405 on GET /api/request", async () => {
    const res = await call("/api/request");
    expect(res.status).toBe(405);
  });

  it("hands everything else to the assets", async () => {
    const res = await call("/");
    expect(res.headers.get("x-neume-worker")).toBeNull();
  });
});
