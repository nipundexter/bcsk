"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { admin, files, toActionError } from "@/services";

export type HeroSliderState = { ok?: boolean; error?: string } | null;

/**
 * The homepage hero slider. Same upload path as the gallery — `POST /files` with an
 * allowlisted folder, backend checks size/MIME/magic bytes and hands back a stored path —
 * but capped at `AdminService.HERO_IMAGE_LIMIT` (5) server-side, not just by this form.
 */
export async function addHeroImage(_prev: HeroSliderState, formData: FormData): Promise<HeroSliderState> {
  await requirePermission("content:manage");
  const caption = String(formData.get("caption") ?? "").trim() || null;
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image." };
  if (file.type === "application/pdf") return { error: "JPG, PNG, or WEBP only." };

  try {
    const { path } = await files.upload(file, "gallery");
    await admin.addHeroImage(`/api/files/${path}`, caption);
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/admin/hero-slider");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteHeroImage(id: number) {
  await requirePermission("content:manage");
  await admin.deleteHeroImage(id);
  revalidatePath("/admin/hero-slider");
  revalidatePath("/");
}
