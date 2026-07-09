"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin, audit } from "@/lib/auth";
import { db } from "@/lib/db";

export type SettingsState = { ok?: boolean } | null;

export async function saveSettings(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const admin = await requireSuperAdmin();
  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string") continue;
    await db.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }
  await audit(admin.userId, "SETTINGS_UPDATE", "Setting", "bulk");
  revalidatePath("/", "layout");
  return { ok: true };
}
