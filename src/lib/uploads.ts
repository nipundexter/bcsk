import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { randomBytes } from "crypto";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

/**
 * NFR-SEC-04: uploads are stored OUTSIDE the public web root (storage/uploads)
 * and served only through the role-checked /api/files route.
 * Returns the relative storage path, e.g. "applications/ab12cd.jpg".
 */
export async function saveUpload(file: File, folder: string, maxBytes = 1024 * 1024): Promise<{ path: string } | { error: string }> {
  if (!ALLOWED.has(file.type)) return { error: "Only JPG, PNG, WEBP, or PDF files are accepted." };
  if (file.size > maxBytes) return { error: `File is too large — the limit is ${Math.round(maxBytes / 1024)} KB.` };
  const buf = Buffer.from(await file.arrayBuffer());
  // lightweight magic-byte sanity check (full AV scanning is a production deployment concern)
  const magicOk =
    (file.type === "image/jpeg" && buf[0] === 0xff && buf[1] === 0xd8) ||
    (file.type === "image/png" && buf[0] === 0x89 && buf[1] === 0x50) ||
    (file.type === "image/webp" && buf.subarray(8, 12).toString() === "WEBP") ||
    (file.type === "application/pdf" && buf.subarray(0, 4).toString() === "%PDF");
  if (!magicOk) return { error: "The file content doesn't match its type." };

  const name = `${randomBytes(8).toString("hex")}.${EXT[file.type]}`;
  const dir = join(process.cwd(), "storage", "uploads", folder);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, name), buf);
  return { path: `${folder}/${name}` };
}
