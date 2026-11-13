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

/**
 * JPEG, par liste blanche : on ne garde que ce qu'il faut pour décoder — tables, trames, balayages — et trois
 * segments d'application connus : APP0 (JFIF), APP2 s'il porte un profil ICC, APP14 (Adobe). Tout le reste
 * (EXIF, XMP, MPF, IPTC, commentaires, segments inconnus) tombe, y compris entre deux balayages ; ce qui suit
 * EOI tombe aussi.
 */
const startsWithAscii = (bytes: Uint8Array, at: number, s: string) => startsWith(bytes, ascii(s), at);

function keepJpegSegment(bytes: Uint8Array, marker: number, payload: number): boolean {
  if (marker >= 0xc0 && marker <= 0xcf) return true; // SOFn, DHT, DAC
  if (marker === 0xdb || marker === 0xdc || marker === 0xdd) return true; // DQT, DNL, DRI
  if (marker === 0xe0) return startsWithAscii(bytes, payload, "JFIF\0") || startsWithAscii(bytes, payload, "JFXX\0");
  if (marker === 0xe2) return startsWithAscii(bytes, payload, "ICC_PROFILE\0");
  if (marker === 0xee) return startsWithAscii(bytes, payload, "Adobe");
  return false;
}

function stripJpeg(bytes: Uint8Array): Uint8Array {
  const parts: Uint8Array[] = [bytes.subarray(0, 2)];
  let i = 2;
  while (i < bytes.length) {
    if (bytes[i] !== 0xff || i + 1 >= bytes.length) truncated();
    const marker = bytes[i + 1];
    if (marker === 0xff) {
      i += 1; // octet de remplissage
      continue;
    }
    if (marker === 0xd9) {
      parts.push(bytes.subarray(i, i + 2));
      return concat(parts); // ce qui suit EOI tombe
    }
    if (i + 4 > bytes.length) truncated();
    const length = (bytes[i + 2] << 8) | bytes[i + 3];
    const end = i + 2 + length;
    if (length < 2 || end > bytes.length) truncated();
    if (marker === 0xda) {
      // SOS, puis les données entropiques jusqu'au prochain vrai marqueur (ni FF00, ni RSTn, ni remplissage).
      let j = end;
      while (j < bytes.length) {
        if (bytes[j] === 0xff) {
          const next = bytes[j + 1];
          if (next === undefined) truncated();
          if (next === 0x00 || (next >= 0xd0 && next <= 0xd7)) {
            j += 2;
            continue;
          }
          if (next === 0xff) {
            j += 1;
            continue;
          }
          break;
        }
        j += 1;
      }
      parts.push(bytes.subarray(i, j));
      i = j;
      continue;
    }
    if (keepJpegSegment(bytes, marker, i + 4)) parts.push(bytes.subarray(i, end));
    i = end;
  }
  truncated();
}

/** PNG, par liste blanche : les morceaux de l'image, de sa couleur et de son animation ; on s'arrête à IEND. */
const PNG_KEPT = new Set([
  "IHDR", "PLTE", "IDAT", "IEND", "tRNS", "gAMA", "cHRM", "sRGB", "iCCP", "sBIT", "bKGD", "pHYs",
  "acTL", "fcTL", "fdAT",
]);

function stripPng(bytes: Uint8Array): Uint8Array {
  const parts: Uint8Array[] = [bytes.subarray(0, 8)];
  let i = 8;
  while (i < bytes.length) {
    if (i + 12 > bytes.length) truncated();
    const length = ((bytes[i] << 24) | (bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3]) >>> 0;
    const end = i + 12 + length;
    if (end > bytes.length) truncated();
    const type = String.fromCharCode(...bytes.subarray(i + 4, i + 8));
    if (PNG_KEPT.has(type)) parts.push(bytes.subarray(i, end));
    i = end;
    if (type === "IEND") return concat(parts);
  }
  truncated();
}

/** WebP, par liste blanche : image, alpha, animation, profil ICC ; la taille RIFF et les drapeaux de VP8X suivent. */
const WEBP_KEPT = new Set(["VP8 ", "VP8L", "VP8X", "ALPH", "ANIM", "ANMF", "ICCP"]);
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
    if (WEBP_KEPT.has(type)) {
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
