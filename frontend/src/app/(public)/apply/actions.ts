"use server";

import { redirect } from "next/navigation";
import { admissions, files, toActionError } from "@/services";

/**
 * FR-ADM-02/03: the application forms.
 *
 * Validation, rate limiting (SEC-8), captcha (SEC-9), the minimum-age rule (GAP-12) and the
 * BCSK-discount claim (SEC-3) are all enforced by the backend. This action's job is to move
 * the photo and the fields across, then hand back the capability token that unlocks payment.
 */

export type ApplyState = { error?: string } | null;

/** Upload the applicant photo first — the application row stores its path, not the bytes. */
async function uploadPhoto(formData: FormData): Promise<string> {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("A photo upload is required (JPG/PNG, max 1 MB).");
  }
  const { path } = await files.upload(file, "applications");
  return path;
}

function fields(formData: FormData): Record<string, unknown> {
  const get = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" && v.trim() ? v.trim() : undefined;
  };
  return {
    applicantName: get("applicantName"),
    dob: get("dob"),
    gender: get("gender"),
    religion: get("religion"),
    phone: get("phone"),
    email: get("email"),
    addressKorea: get("addressKorea"),
    addressBangladesh: get("addressBangladesh"),
    emergencyContact: get("emergencyContact"),
    // A checkbox posts "on" when ticked and nothing when not; the API expects a boolean.
    parentalConsent: formData.get("parentalConsent") === "on",
    learningMode: get("learningMode"),
    recaptchaToken: get("recaptchaToken"),
  };
}

export async function submitRegular(_prev: ApplyState, formData: FormData): Promise<ApplyState> {
  let created: Awaited<ReturnType<typeof admissions.submitRegular>>;
  try {
    const photoPath = await uploadPhoto(formData);
    created = await admissions.submitRegular({
      ...fields(formData),
      photoPath,
      grade: String(formData.get("grade") ?? ""),
      fatherName: String(formData.get("fatherName") ?? "").trim(),
      motherName: String(formData.get("motherName") ?? "").trim(),
      guardianProfession: String(formData.get("guardianProfession") ?? "").trim() || undefined,
      guardianEducation: String(formData.get("guardianEducation") ?? "").trim() || undefined,
      guardianPhone2: String(formData.get("guardianPhone2") ?? "").trim() || undefined,
    });
  } catch (e) {
    if (e instanceof Error && !("code" in e)) return { error: e.message };
    return toActionError(e);
  }
  // SEC-7: the token is what opens the payment step. An application id alone is useless.
  redirect(`/apply/payment/${created.applicationId}?t=${created.paymentToken}`);
}

export async function submitSpecial(_prev: ApplyState, formData: FormData): Promise<ApplyState> {
  let created: Awaited<ReturnType<typeof admissions.submitSpecial>>;
  try {
    const photoPath = await uploadPhoto(formData);
    created = await admissions.submitSpecial({
      ...fields(formData),
      photoPath,
      courseName: String(formData.get("courseName") ?? ""),
      highestEducation: String(formData.get("highestEducation") ?? "").trim() || undefined,
      // SEC-3: persisted on the record, and the only thing the fee calculation reads.
      isBcskStudent: formData.get("isBcskStudent") === "on",
    });
  } catch (e) {
    if (e instanceof Error && !("code" in e)) return { error: e.message };
    return toActionError(e);
  }
  redirect(`/apply/payment/${created.applicationId}?t=${created.paymentToken}`);
}
