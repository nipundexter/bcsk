"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { admissions, toActionError } from "@/services";

/**
 * FR-ADMIN-03 — admission decisions.
 *
 * The decision logic lives behind `/admissions/:id/*`: activating the student account when a
 * payment is already confirmed, emailing the guardian, and writing the audit row are all the
 * backend's job now. These functions carry the permission guard (so the caller gets the 403
 * boundary rather than a broken screen), make one call, and revalidate.
 */

export type DecisionResult = { ok?: boolean; error?: string };

/**
 * Approve. Every export in a "use server" file must be an async *function* — an arrow const
 * returning a promise compiles and then fails at runtime.
 */
export async function approveApplication(applicationId: number): Promise<DecisionResult> {
  await requirePermission("admissions:decide");
  try {
    await admissions.approve(applicationId);
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath(`/admin/admissions/${applicationId}`);
  revalidatePath("/admin/admissions");
  return { ok: true };
}

export async function rejectApplication(applicationId: number, formData: FormData): Promise<DecisionResult> {
  await requirePermission("admissions:decide");
  const reason =
    String(formData.get("reason") ?? "").trim() || "Application did not meet admission requirements";
  try {
    await admissions.reject(applicationId, reason);
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath(`/admin/admissions/${applicationId}`);
  revalidatePath("/admin/admissions");
  return { ok: true };
}

export async function requestCorrections(applicationId: number, formData: FormData): Promise<DecisionResult> {
  await requirePermission("admissions:decide");
  const note = String(formData.get("note") ?? "").trim();
  if (!note) return { error: "Say what needs correcting." };
  try {
    await admissions.requestCorrections(applicationId, note);
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath(`/admin/admissions/${applicationId}`);
  revalidatePath("/admin/admissions");
  return { ok: true };
}
