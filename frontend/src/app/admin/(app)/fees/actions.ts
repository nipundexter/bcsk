"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { admin, toActionError } from "@/services";

export type FeeState = { ok?: boolean; error?: string };

/**
 * FR-ADMIN-05 — fee configuration.
 *
 * These amounts are the ones `computeApplicationFee` charges, so the coercion and clamping
 * that used to happen here now happens on the authoritative side: the form posts strings and
 * the backend decides what they mean. Nothing here proposes a price.
 */
export async function updateFee(feeId: number, formData: FormData): Promise<FeeState> {
  await requirePermission("fees:manage");
  const field = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v === "" ? null : v;
  };
  try {
    await admin.updateFee(feeId, {
      admissionFee: field("admissionFee"),
      semesterFee: field("semesterFee"),
      bookFee: field("bookFee"),
      bcskPrice: field("bcskPrice"),
      nonBcskPrice: field("nonBcskPrice"),
      active: formData.get("active") === "on",
    });
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/admin/fees");
  revalidatePath("/admission/tuition-fee");
  return { ok: true };
}
