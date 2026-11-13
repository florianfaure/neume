import { describe, expect, it } from "vitest";
import { sniffImage, stripMetadata } from "../image";

// Les fichiers sont bâtis octet par octet : aucun binaire dans le dépôt.
const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));
const cat = (...parts: (number[] | Uint8Array)[]) => Uint8Array.from(parts.flatMap((p) => [...p]));
const has = (bytes: Uint8Array, s: string) => new TextDecoder("latin1").decode(bytes).includes(s);

// --- JPEG -----------------------------------------------------------------------------------
const seg = (marker: number, payload: number[]) => {
  const len = payload.length + 2;
  return [0xff, marker, len >> 8, len & 0xff, ...payload];
};
const SOI = [0xff, 0xd8];
const EOI = [0xff, 0xd9];
const APP0 = seg(0xe0, [...ascii("JFIF"), 0, 1, 1, 0, 0, 1, 0, 1, 0, 0]);
const APP1 = seg(0xe1, [...ascii("Exif"), 0, 0, ...ascii("GPS 48.85N 2.35E")]);
const APP13 = seg(0xed, ascii("Photoshop 3.0"));
const COM = seg(0xfe, ascii("shot on my phone"));
const DQT = seg(0xdb, [0, ...new Array(64).fill(1)]);
const SOS = seg(0xda, [1, 1, 0, 0, 0x3f, 0]);
const SCAN = [0x12, 0x34, 0xff, 0x00, 0x56];

// --- PNG ------------------------------------------------------------------------------------
const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const u32be = (n: number) => [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];
const chunk = (type: string, data: number[]) => [...u32be(data.length), ...ascii(type), ...data, 0, 0, 0, 0];
const IHDR = chunk("IHDR", [0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0]);
const IDAT = chunk("IDAT", [1, 2, 3]);
const IEND = chunk("IEND", []);
const pngChunks = (bytes: Uint8Array) => {
  const types: string[] = [];
  for (let i = 8; i < bytes.length; ) {
    const len = (bytes[i] << 24) | (bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3];
    types.push(String.fromCharCode(...bytes.slice(i + 4, i + 8)));
    i += 12 + len;
  }
  return types;
};

// --- WebP -----------------------------------------------------------------------------------
const u32le = (n: number) => [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];
const rchunk = (type: string, data: number[]) => [...ascii(type), ...u32le(data.length), ...data, ...(data.length % 2 ? [0] : [])];
const webp = (...chunks: number[][]) => {
  const body = [...ascii("WEBP"), ...chunks.flat()];
  return cat(ascii("RIFF"), u32le(body.length), body);
};
const VP8X = (flags: number) => rchunk("VP8X", [flags, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const VP8 = rchunk("VP8 ", [9, 8, 7]);
const EXIF = rchunk("EXIF", ascii("GPS 48.85N"));
const XMP = rchunk("XMP ", ascii("<x:xmpmeta>"));
const webpChunks = (bytes: Uint8Array) => {
  const types: string[] = [];
  for (let i = 12; i < bytes.length; ) {
    const len = bytes[i + 4] | (bytes[i + 5] << 8) | (bytes[i + 6] << 16) | (bytes[i + 7] << 24);
    types.push(String.fromCharCode(...bytes.slice(i, i + 4)));
    i += 8 + len + (len % 2);
  }
  return types;
};

describe("sniffImage", () => {
  it("sniffs png/jpeg/webp by magic bytes", () => {
    expect(sniffImage(cat(PNG_SIG, IHDR, IEND))).toBe("png");
    expect(sniffImage(cat(SOI, APP0, EOI))).toBe("jpeg");
    expect(sniffImage(webp(VP8))).toBe("webp");
  });

  it("rejects bytes that are not png/jpeg/webp", () => {
    expect(sniffImage(Uint8Array.from(ascii("<svg xmlns='http://www.w3.org/2000/svg'/>")))).toBeNull();
    expect(sniffImage(Uint8Array.from(ascii("MZ\x90\x00 program")))).toBeNull();
    expect(sniffImage(Uint8Array.from(ascii("GIF89a....")))).toBeNull();
    expect(sniffImage(new Uint8Array())).toBeNull();
    expect(sniffImage(Uint8Array.from(ascii("RIFF\x04\x00\x00\x00WAVE")))).toBeNull();
  });
});

describe("stripMetadata", () => {
  it("jpeg: drops APP1 (EXIF/XMP), APP13 and COM, keeps the rest", () => {
    const out = stripMetadata(cat(SOI, APP0, APP1, APP13, COM, DQT, SOS, SCAN, EOI), "jpeg");
    expect(has(out, "Exif")).toBe(false);
    expect(has(out, "GPS")).toBe(false);
    expect(has(out, "Photoshop")).toBe(false);
    expect(has(out, "phone")).toBe(false);
    expect([...out]).toEqual([...cat(SOI, APP0, DQT, SOS, SCAN, EOI)]);
  });

  it("png: drops eXIf, tEXt, iTXt, zTXt, keeps IHDR/IDAT/IEND", () => {
    const input = cat(PNG_SIG, IHDR, chunk("eXIf", ascii("GPS")), chunk("tEXt", ascii("Author")), IDAT,
      chunk("iTXt", ascii("x")), chunk("zTXt", ascii("y")), IEND);
    const out = stripMetadata(input, "png");
    expect(pngChunks(out)).toEqual(["IHDR", "IDAT", "IEND"]);
    expect(has(out, "GPS")).toBe(false);
  });

  it("webp: drops EXIF and XMP chunks and fixes the RIFF size", () => {
    const out = stripMetadata(webp(VP8X(0x08 | 0x04 | 0x10), VP8, EXIF, XMP), "webp");
    expect(webpChunks(out)).toEqual(["VP8X", "VP8 "]);
    const riff = out[4] | (out[5] << 8) | (out[6] << 16) | (out[7] << 24);
    expect(riff).toBe(out.length - 8);
    expect(out[20] & 0x08).toBe(0);
    expect(out[20] & 0x04).toBe(0);
    expect(out[20] & 0x10).toBe(0x10);
    expect(has(out, "GPS")).toBe(false);
  });

  it("leaves a file without metadata byte-identical", () => {
    const jpeg = cat(SOI, APP0, DQT, SOS, SCAN, EOI);
    const png = cat(PNG_SIG, IHDR, IDAT, IEND);
    const wp = webp(VP8X(0x10), VP8);
    expect([...stripMetadata(jpeg, "jpeg")]).toEqual([...jpeg]);
    expect([...stripMetadata(png, "png")]).toEqual([...png]);
    expect([...stripMetadata(wp, "webp")]).toEqual([...wp]);
  });

  it("throws on a truncated file", () => {
    expect(() => stripMetadata(cat(SOI, [0xff, 0xe1, 0x00, 0x40, 1, 2]), "jpeg")).toThrow();
    expect(() => stripMetadata(cat(PNG_SIG, u32be(100), ascii("IDAT"), [1]), "png")).toThrow();
  });
});
