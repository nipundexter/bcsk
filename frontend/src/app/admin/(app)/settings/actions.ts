"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { admin, toActionError } from "@/services";

export type SettingsState = { ok?: boolean; error?: string } | null;

/** FR-ADMIN-13: the whole form is saved in one call, upserted in one transaction. */
export async function saveSettings(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  await requirePermission("settings:manage");
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") values[key] = value;
  }
  try {
    await admin.saveSettings(values);
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
