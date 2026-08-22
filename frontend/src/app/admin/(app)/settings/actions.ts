"use server";

import { revalidatePath } from "next/cache";
import { requirePermission, audit } from "@/lib/auth";
import { db } from "@/lib/db";

export type SettingsState = { ok?: boolean } | null;

export async function saveSettings(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const admin = await requirePermission("settings:manage");
  // PERF-3: one transaction rather than an upsert round-trip per field.
  const settings = [...formData.entries()]
    .filter((e): e is [string, string] => typeof e[1] === "string")
    .map(([key, value]) => ({ key, value }));
  await db.$transaction(
    settings.map((s) => db.setting.upsert({ where: { key: s.key }, update: { value: s.value }, create: s }))
  );
  await audit(admin.userId, "SETTINGS_UPDATE", "Setting", "bulk");
  revalidatePath("/", "layout");
  return { ok: true };
}
