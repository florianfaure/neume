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
    expect(r).toEqual({ ok: true, value: { name: "arrow-up", meaning: "Go up", link: "https://x.dev/", image: null } });
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

  it.each([
    "javascript:alert(1)",
    "ftp://x.dev",
    "not a url",
    `https://x.dev/${"a".repeat(490)}`,
    "https://x.dev/a>b",
    "https://x.dev/<b",
    "https://x.dev/a b",
    "https://x.dev/`b`",
    "https://x.dev/a\u0007",
  ])(
    "rejects the link %j",
    (link) => expect(parseRequest(form({ name: "a", meaning: "x", link }))).toEqual({ ok: false, field: "link" }),
  );

  it("stores the link as its normalised href", () => {
    const r = parseRequest(form({ name: "a", meaning: "x", link: "HTTPS://X.dev" }));
    expect(r.ok && r.value.link).toBe("https://x.dev/");
  });

  it("counts a browser's CRLF line breaks as one character", () => {
    const meaning = Array(1000).fill("a").join("\r\n");
    const r = parseRequest(form({ name: "a", meaning }));
    expect(r.ok && r.value.meaning).toBe(Array(1000).fill("a").join("\n"));
  });

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
    expect(body).toContain("`https://x.dev/i`");
    expect(body).toContain("![Reference](<https://neume.dev/api/request-image/a.png>)");
    expect(body.trimEnd().endsWith("Sent from neume.dev")).toBe(true);
  });

  it("leaves out the link and image lines when there are none", () => {
    const body = issueBody({ name: "arrow-up", meaning: "Go up", link: null }, null);
    expect(body).not.toContain("Link");
    expect(body).not.toContain("Reference");
  });

  it("keeps the meaning out of Markdown, in a fence longer than any backtick run", () => {
    const meaning = "ask @florianfaure about #12\n```\n![x](https://evil.example/p.png)";
    const body = issueBody({ name: "a", meaning, link: null }, null);
    expect(body).toContain("````text\n" + meaning + "\n````\n");
  });

  it("writes the link as code, so a GitHub issue URL makes no cross-reference", () => {
    const body = issueBody({ name: "a", meaning: "x", link: "https://github.com/o/r/issues/1" }, null);
    expect(body).toContain("### Link\n\n`https://github.com/o/r/issues/1`\n");
    expect(body).not.toContain("<https://github.com");
  });

  it("uses a three-backtick fence for plain text", () => {
    const body = issueBody({ name: "a", meaning: "Go up", link: null }, null);
    expect(body).toContain("```text\nGo up\n```\n");
  });
});
