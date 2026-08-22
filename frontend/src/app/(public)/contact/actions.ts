"use server";

import { site, toActionError } from "@/services";

export type ContactState = { ok: boolean; error?: string } | null;

/**
 * FR-CONT-01: creates a support ticket.
 *
 * Validation, rate limiting (SEC-8) and captcha verification (SEC-9) all happen in the
 * backend now — this action only shuttles the form across.
 */
export async function submitContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  try {
    await site.contact({
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim() || undefined,
      subject: String(formData.get("subject") ?? "").trim(),
      message: String(formData.get("message") ?? "").trim(),
      category: String(formData.get("category") ?? "GENERAL"),
      recaptchaToken: String(formData.get("recaptchaToken") ?? "") || undefined,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, ...toActionError(e) };
  }
}
