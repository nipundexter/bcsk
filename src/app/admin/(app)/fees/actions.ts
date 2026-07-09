"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, audit } from "@/lib/auth";
import { db } from "@/lib/db";

export async function updateFee(feeId: number, formData: FormData) {
  const admin = await requireAdmin();
  const num = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v === "" ? null : Math.max(0, Number(v) || 0);
  };
  await db.feeConfig.update({
    where: { id: feeId },
    data: {
      admissionFee: num("admissionFee") ?? 0,
      semesterFee: num("semesterFee") ?? 0,
      bookFee: num("bookFee"),
      bcskPrice: num("bcskPrice"),
      nonBcskPrice: num("nonBcskPrice"),
      active: formData.get("active") === "on",
    },
  });
  await audit(admin.userId, "FEE_UPDATE", "FeeConfig", feeId);
  revalidatePath("/admin/fees");
  revalidatePath("/admission/tuition-fee");
}
