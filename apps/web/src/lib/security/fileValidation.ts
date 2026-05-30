import { randomUUID } from "crypto";
import sharp from "sharp";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_DIMENSION = 4000;

const MAGIC_BYTES: Array<{ mime: "image/jpeg" | "image/png" | "image/webp"; signature: number[] }> = [
  { mime: "image/jpeg", signature: [0xff, 0xd8, 0xff] },
  { mime: "image/png", signature: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/webp", signature: [0x52, 0x49, 0x46, 0x46] }
];

function detectMimeFromMagicBytes(buffer: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  for (const item of MAGIC_BYTES) {
    if (item.signature.every((byte, index) => buffer[index] === byte)) {
      if (item.mime === "image/webp") {
        const webpHeader = buffer.subarray(8, 12).toString("ascii");
        if (webpHeader !== "WEBP") continue;
      }
      return item.mime;
    }
  }
  return null;
}

export function validateFileName(filename: string): void {
  const value = filename.toLowerCase();
  if (value.includes("../") || value.includes("..\\") || value.includes("%2f") || value.includes("%5c")) {
    throw new Error("Invalid filename: path traversal detected");
  }
  if (value.endsWith(".svg")) {
    throw new Error("SVG uploads are blocked for security reasons");
  }
}

export async function validateImageUpload(file: {
  originalName: string;
  size: number;
  buffer: Buffer;
}): Promise<{ mime: "image/jpeg" | "image/png" | "image/webp"; safeFilename: string }> {
  validateFileName(file.originalName);

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("File too large. Max 5MB allowed.");
  }

  const signatureBuffer = file.buffer.subarray(0, 12);
  const mime = detectMimeFromMagicBytes(signatureBuffer);
  if (!mime) {
    throw new Error("Unsupported file type. Only JPEG, PNG, WEBP allowed.");
  }

  const metadata = await sharp(file.buffer).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error("Invalid image dimensions");
  }
  if (metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION) {
    throw new Error("Image dimensions exceed 4000x4000");
  }

  const extension = mime === "image/jpeg" ? "jpg" : mime === "image/png" ? "png" : "webp";
  const safeFilename = `${randomUUID()}.${extension}`;
  return { mime, safeFilename };
}
