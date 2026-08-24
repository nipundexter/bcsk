"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { admin, files, toActionError } from "@/services";

export type GalleryState = { ok?: boolean; error?: string } | null;

/**
 * FR-ADMIN-10 — media gallery.
 *
 * Uploads go to `POST /files` with an allowlisted folder; the backend checks size, MIME and
 * magic bytes and hands back a stored path. The `/api/files/…` prefix is kept on the saved
 * URL because that is the shape already in the database and `next.config.ts` rewrites it to
 * the backend — repointing it would invalidate every existing row.
 */
export async function createAlbum(_prev: GalleryState, formData: FormData): Promise<GalleryState> {
  await requirePermission("content:manage");
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Album title is required." };
  const category = String(formData.get("category") ?? "").trim() || null;
  try {
    await admin.createAlbum(title, category);
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/admin/gallery");
  revalidatePath("/events/gallery");
  return { ok: true };
}

export async function addGalleryImage(_prev: GalleryState, formData: FormData): Promise<GalleryState> {
  await requirePermission("content:manage");
  const albumId = Number(formData.get("albumId"));
  const caption = String(formData.get("caption") ?? "").trim() || null;
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image." };
  if (file.type === "application/pdf") return { error: "JPG, PNG, or WEBP only." };

  try {
    const { path } = await files.upload(file, "gallery");
    await admin.addGalleryItem(albumId, `/api/files/${path}`, caption);
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/admin/gallery");
  revalidatePath("/events/gallery");
  return { ok: true };
}

export async function deleteGalleryItem(id: number) {
  await requirePermission("content:manage");
  await admin.deleteGalleryItem(id);
  revalidatePath("/admin/gallery");
  revalidatePath("/events/gallery");
}

export async function deleteAlbum(id: number) {
  await requirePermission("content:manage");
  await admin.deleteAlbum(id);
  revalidatePath("/admin/gallery");
  revalidatePath("/events/gallery");
}
