"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { admin, toActionError } from "@/services";

export type GovState = { ok?: boolean; error?: string } | null;

/** FR-ADMIN-11: governing body and regional representatives share one record type. */
export async function saveMember(_prev: GovState, formData: FormData): Promise<GovState> {
  await requirePermission("content:manage");
  const id = Number(formData.get("id") ?? 0);
  const text = (k: string) => String(formData.get(k) ?? "").trim();
  if (!text("name") || !text("role")) return { error: "Name and role are required." };

  try {
    await admin.saveMember({
      ...(id ? { id } : {}),
      kind: text("kind") || "GOVERNING",
      name: text("name"),
      role: text("role"),
      organization: text("organization"),
      region: text("region"),
      phone: text("phone"),
      email: text("email"),
      bio: text("bio"),
      displayOrder: Number(formData.get("displayOrder") ?? 100) || 100,
    });
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/bcsk/governing-body");
  revalidatePath("/bcsk/regional-representatives");
  revalidatePath("/admin/governing");
  return { ok: true };
}

export async function deleteMember(id: number) {
  await requirePermission("content:manage");
  await admin.deleteMember(id);
  revalidatePath("/bcsk/governing-body");
  revalidatePath("/bcsk/regional-representatives");
  revalidatePath("/admin/governing");
}
