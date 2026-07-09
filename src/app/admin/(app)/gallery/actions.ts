"use server";

import { revalidatePath } from "next/cache";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { randomBytes } from "crypto";
import { requireAdmin, audit } from "@/lib/auth";
import { db } from "@/lib/db";

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

/** Gallery photos are public content → stored under public/images/gallery-uploads. */
export async function addGalleryImage(_prev: GalleryState, formData: FormData): Promise<GalleryState> {
  const admin = await requireAdmin();
  const albumId = Number(formData.get("albumId"));
  const caption = String(formData.get("caption") ?? "").trim() || null;
  const file = formData.get("image") as File | null;
  if (!file || file.size === 0) return { error: "Choose an image." };
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return { error: "JPG, PNG, or WEBP only." };
  if (file.size > 8 * 1024 * 1024) return { error: "Max 8 MB per image." };

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const name = `${randomBytes(8).toString("hex")}.${ext}`;
  const dir = join(process.cwd(), "public", "images", "gallery-uploads");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, name), Buffer.from(await file.arrayBuffer()));

  await db.galleryItem.create({
    data: { albumId, url: `/images/gallery-uploads/${name}`, caption },
  });
  await audit(admin.userId, "GALLERY_UPLOAD", "GalleryItem", name);
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
