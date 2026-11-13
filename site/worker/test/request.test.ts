import { describe, expect, it } from "vitest";
import { issueBody, issueTitle, parseRequest } from "../request";

const form = (fields: Record<string, string | File>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.append(k, v);
  return f;
};
const png = (size: number) => new File([new Uint8Array(size)], "ref.png", { type: "image/png" });

describe("parseRequest", () => {
  it("accepts a full request", () => {
    const image = png(10);
    const r = parseRequest(form({ name: "arrow-up", meaning: "Go up", link: "https://example.com/i", image }));
    expect(r).toEqual({ ok: true, value: { name: "arrow-up", meaning: "Go up", link: "https://example.com/i", image } });
  });

  it("accepts name + meaning only", () => {
    expect(parseRequest(form({ name: "a1", meaning: "x", link: "" }))).toEqual({
      ok: true,
      value: { name: "a1", meaning: "x", link: null, image: null },
    });
    const empty = new File([], "", { type: "application/octet-stream" });
    const r = parseRequest(form({ name: "a1", meaning: "x", image: empty }));
    expect(r.ok && r.value.image).toBeNull();
  });

  it("trims fields before validating", () => {
    const r = parseRequest(form({ name: "  arrow-up ", meaning: "  Go up  ", link: " https://x.dev " }));
    expect(r).toEqual({ ok: true, value: { name: "arrow-up", meaning: "Go up", link: "https://x.dev", image: null } });
  });

  it.each([["", "name"], ["Arrow Up", "name"], ["arrow--up", "name"], ["-up", "name"], ["a".repeat(41), "name"]])(
    "rejects the name %j",
    (name, field) => expect(parseRequest(form({ name, meaning: "x" }))).toEqual({ ok: false, field }),
  );

  it("rejects a missing or too long meaning", () => {
    expect(parseRequest(form({ name: "a" }))).toEqual({ ok: false, field: "meaning" });
    expect(parseRequest(form({ name: "a", meaning: "   " }))).toEqual({ ok: false, field: "meaning" });
    expect(parseRequest(form({ name: "a", meaning: "x".repeat(2001) }))).toEqual({ ok: false, field: "meaning" });
    expect(parseRequest(form({ name: "a", meaning: "x".repeat(2000) })).ok).toBe(true);
  });

  it.each(["javascript:alert(1)", "ftp://x.dev", "not a url", `https://x.dev/${"a".repeat(490)}`])(
    "rejects the link %j",
    (link) => expect(parseRequest(form({ name: "a", meaning: "x", link }))).toEqual({ ok: false, field: "link" }),
  );

  it("rejects an image over 2 MB", () => {
    expect(parseRequest(form({ name: "a", meaning: "x", image: png(2_097_153) }))).toEqual({ ok: false, field: "image" });
    expect(parseRequest(form({ name: "a", meaning: "x", image: png(2_097_152) })).ok).toBe(true);
  });
});

describe("issue", () => {
  it("titles the issue", () => {
    expect(issueTitle("arrow-up")).toBe("Icon request: arrow-up");
  });

  it("writes the meaning, the link, the image and the source", () => {
    const body = issueBody({ name: "arrow-up", meaning: "Go up", link: "https://x.dev/i" }, "https://neume.dev/api/request-image/a.png");
    expect(body).toContain("Go up");
    expect(body).toContain("<https://x.dev/i>");
    expect(body).toContain("![Reference](<https://neume.dev/api/request-image/a.png>)");
    expect(body.trimEnd().endsWith("Sent from neume.dev")).toBe(true);
  });

  it("leaves out the link and image lines when there are none", () => {
    const body = issueBody({ name: "arrow-up", meaning: "Go up", link: null }, null);
    expect(body).not.toContain("Link");
    expect(body).not.toContain("Reference");
  });

  it("neutralises mentions and references", () => {
    const body = issueBody({ name: "a", meaning: "ask @florianfaure about #12 and #fun", link: null }, null);
    expect(body).not.toContain("@florianfaure");
    expect(body).not.toContain("#12");
    expect(body).toContain("#fun");
    expect(body.replaceAll("​", "")).toContain("ask @florianfaure about #12");
  });
});
