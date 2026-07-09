"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, audit } from "@/lib/auth";
import { db } from "@/lib/db";

export type GovState = { ok?: boolean; error?: string } | null;

export async function saveMember(_prev: GovState, formData: FormData): Promise<GovState> {
  const admin = await requireAdmin();
  const id = Number(formData.get("id") ?? 0);
  const data = {
    kind: String(formData.get("kind") ?? "GOVERNING"),
    name: String(formData.get("name") ?? "").trim(),
    role: String(formData.get("role") ?? "").trim(),
    organization: String(formData.get("organization") ?? "").trim() || null,
    region: String(formData.get("region") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    bio: String(formData.get("bio") ?? "").trim() || null,
    displayOrder: Number(formData.get("displayOrder") ?? 100) || 100,
  };
  if (!data.name || !data.role) return { error: "Name and role are required." };
  if (id) await db.governingMember.update({ where: { id }, data });
  else await db.governingMember.create({ data });
  await audit(admin.userId, "CONTENT_EDIT", "GoverningMember", id || "new", data.name);
  revalidatePath("/bcsk/governing-body");
  revalidatePath("/bcsk/regional-representatives");
  revalidatePath("/admin/governing");
  return { ok: true };
}

export async function deleteMember(id: number) {
  const admin = await requireAdmin();
  await db.governingMember.delete({ where: { id } });
  await audit(admin.userId, "CONTENT_DELETE", "GoverningMember", id);
  revalidatePath("/bcsk/governing-body");
  revalidatePath("/bcsk/regional-representatives");
  revalidatePath("/admin/governing");
}
