/**
 * L'image jointe à une demande : reconnue par ses octets (jamais par son nom ni par le type annoncé), puis
 * débarrassée de ses métadonnées — EXIF, position GPS, XMP, commentaires — sans bibliothèque, par une coupe
 * au niveau des segments du format. Les pixels ne sont jamais décodés ni touchés.
 */
export type ImageKind = "png" | "jpeg" | "webp";

export const CONTENT_TYPE: Record<ImageKind, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

export const EXTENSION: Record<ImageKind, string> = { png: "png", jpeg: "jpg", webp: "webp" };

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const startsWith = (bytes: Uint8Array, prefix: number[], at = 0) =>
  bytes.length >= at + prefix.length && prefix.every((b, i) => bytes[at + i] === b);

const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));

/** Le format de l'image, lu sur ses premiers octets ; `null` pour tout autre fichier, SVG compris. */
export function sniffImage(bytes: Uint8Array): ImageKind | null {
  if (startsWith(bytes, PNG_SIGNATURE)) return "png";
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "jpeg";
  if (startsWith(bytes, ascii("RIFF")) && startsWith(bytes, ascii("WEBP"), 8)) return "webp";
  return null;
}

/** L'image sans ses métadonnées. Lève une erreur sur un fichier tronqué ou incohérent. */
export function stripMetadata(bytes: Uint8Array, kind: ImageKind): Uint8Array {
  if (kind === "jpeg") return stripJpeg(bytes);
  if (kind === "png") return stripPng(bytes);
  return stripWebp(bytes);
}

function truncated(): never {
  throw new Error("image tronquée ou incohérente");
}

const concat = (parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
};

/** JPEG : APP1 (EXIF, XMP), APP13 (Photoshop, IPTC) et COM tombent ; à partir de SOS, tout est recopié. */
const JPEG_DROPPED = new Set([0xe1, 0xed, 0xfe]);

function stripJpeg(bytes: Uint8Array): Uint8Array {
  const parts: Uint8Array[] = [bytes.subarray(0, 2)];
  let i = 2;
  while (i < bytes.length) {
    if (bytes[i] !== 0xff) truncated();
    const marker = bytes[i + 1];
    if (marker === undefined) truncated();
    // Les marqueurs sans longueur : remplissage, RSTn, TEM, SOI, EOI.
    if (marker === 0xff) {
      i += 1;
      continue;
    }
    if (marker === 0xd9) {
      parts.push(bytes.subarray(i));
      return concat(parts);
    }
    if ((marker >= 0xd0 && marker <= 0xd8) || marker === 0x01) {
      parts.push(bytes.subarray(i, i + 2));
      i += 2;
      continue;
    }
    if (i + 4 > bytes.length) truncated();
    const length = (bytes[i + 2] << 8) | bytes[i + 3];
    const end = i + 2 + length;
    if (length < 2 || end > bytes.length) truncated();
    if (marker === 0xda) {
      parts.push(bytes.subarray(i));
      return concat(parts);
    }
    if (!JPEG_DROPPED.has(marker)) parts.push(bytes.subarray(i, end));
    i = end;
  }
  truncated();
}

/** PNG : les morceaux EXIF et texte tombent ; on s'arrête à IEND. */
const PNG_DROPPED = new Set(["eXIf", "tEXt", "iTXt", "zTXt"]);

function stripPng(bytes: Uint8Array): Uint8Array {
  const parts: Uint8Array[] = [bytes.subarray(0, 8)];
  let i = 8;
  while (i < bytes.length) {
    if (i + 12 > bytes.length) truncated();
    const length = ((bytes[i] << 24) | (bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3]) >>> 0;
    const end = i + 12 + length;
    if (end > bytes.length) truncated();
    const type = String.fromCharCode(...bytes.subarray(i + 4, i + 8));
    if (!PNG_DROPPED.has(type)) parts.push(bytes.subarray(i, end));
    i = end;
    if (type === "IEND") return concat(parts);
  }
  truncated();
}

/** WebP : les morceaux EXIF et XMP tombent, la taille RIFF et les drapeaux de VP8X suivent. */
const WEBP_DROPPED = new Set(["EXIF", "XMP "]);
const VP8X_EXIF = 0x08;
const VP8X_XMP = 0x04;

function stripWebp(bytes: Uint8Array): Uint8Array {
  const parts: Uint8Array[] = [];
  let i = 12;
  while (i < bytes.length) {
    if (i + 8 > bytes.length) truncated();
    const length = (bytes[i + 4] | (bytes[i + 5] << 8) | (bytes[i + 6] << 16) | (bytes[i + 7] << 24)) >>> 0;
    const end = i + 8 + length + (length % 2);
    if (end > bytes.length) truncated();
    const type = String.fromCharCode(...bytes.subarray(i, i + 4));
    if (!WEBP_DROPPED.has(type)) {
      const part = bytes.slice(i, end);
      if (type === "VP8X" && length >= 1) part[8] &= ~(VP8X_EXIF | VP8X_XMP);
      parts.push(part);
    }
    i = end;
  }
  const body = concat(parts);
  const size = body.length + 4;
  const header = Uint8Array.from([...ascii("RIFF"), size & 0xff, (size >>> 8) & 0xff, (size >>> 16) & 0xff, (size >>> 24) & 0xff, ...ascii("WEBP")]);
  return concat([header, body]);
}
