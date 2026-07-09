"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, audit } from "@/lib/auth";
import { db } from "@/lib/db";
import { saveUpload } from "@/lib/uploads";

export type GalleryState = { ok?: boolean; error?: string } | null;

export async function createAlbum(_prev: GalleryState, formData: FormData): Promise<GalleryState> {
  const admin = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || null;
  if (!title) return { error: "Album title is required." };
  await db.galleryAlbum.create({ data: { title, category } });
  await audit(admin.userId, "GALLERY_ALBUM_CREATE", "GalleryAlbum", title);
  revalidatePath("/admin/gallery");
  revalidatePath("/events/gallery");
  return { ok: true };
}

/** Gallery photos are public site content, stored as DB blobs (serverless-safe). */
export async function addGalleryImage(_prev: GalleryState, formData: FormData): Promise<GalleryState> {
  const admin = await requireAdmin();
  const albumId = Number(formData.get("albumId"));
  const caption = String(formData.get("caption") ?? "").trim() || null;
  const file = formData.get("image") as File | null;
  if (!file || file.size === 0) return { error: "Choose an image." };
  if (file.type === "application/pdf") return { error: "JPG, PNG, or WEBP only." };

  const saved = await saveUpload(file, "gallery", 8 * 1024 * 1024);
  if ("error" in saved) return { error: saved.error };

  await db.galleryItem.create({
    data: { albumId, url: `/api/files/${saved.path}`, caption },
  });
  await audit(admin.userId, "GALLERY_UPLOAD", "GalleryItem", saved.path);
  revalidatePath("/admin/gallery");
  revalidatePath("/events/gallery");
  return { ok: true };
}

export async function deleteGalleryItem(id: number) {
  const admin = await requireAdmin();
  await db.galleryItem.delete({ where: { id } });
  await audit(admin.userId, "GALLERY_DELETE", "GalleryItem", id);
  revalidatePath("/admin/gallery");
  revalidatePath("/events/gallery");
}

export async function deleteAlbum(id: number) {
  const admin = await requireAdmin();
  await db.galleryAlbum.delete({ where: { id } });
  await audit(admin.userId, "GALLERY_ALBUM_DELETE", "GalleryAlbum", id);
  revalidatePath("/admin/gallery");
  revalidatePath("/events/gallery");
}
