"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { saveUpload } from "@/lib/uploads";
import { verifyRecaptcha } from "@/lib/recaptcha";

export type ApplyState = { error?: string } | null;

const shared = {
  applicantName: z.string().min(2).max(120),
  dob: z.string().min(4),
  gender: z.string().min(1),
  religion: z.string().min(1),
  phone: z.string().min(5).max(40),
  email: z.string().email(),
  addressBangladesh: z.string().min(2).max(400),
  emergencyContact: z.string().min(5).max(120),
  parentalConsent: z.literal("on", { message: "Parental consent is required (PIPA)." }),
};

const regularSchema = z.object({
  ...shared,
  grade: z.string().min(1),
  fatherName: z.string().min(2).max(120),
  motherName: z.string().min(2).max(120),
  guardianProfession: z.string().max(120).optional().or(z.literal("")),
  guardianEducation: z.string().max(120).optional().or(z.literal("")),
  guardianPhone2: z.string().max(40).optional().or(z.literal("")),
  addressKorea: z.string().min(2).max(400),
});

const specialSchema = z.object({
  ...shared,
  courseName: z.string().min(1),
  highestEducation: z.string().max(200).optional().or(z.literal("")),
  addressKorea: z.string().max(400).optional().or(z.literal("")), // optional per FR-ADM-03
  isBcskStudent: z.string().optional(),
});

async function handlePhoto(formData: FormData): Promise<{ path: string | null } | { error: string }> {
  const file = formData.get("photo") as File | null;
  if (!file || file.size === 0) return { error: "A photo upload is required (JPG/PNG, max 1 MB)." };
  const saved = await saveUpload(file, "applications", 1024 * 1024); // FR-ADM-02: max 1 MB
  if ("error" in saved) return { error: saved.error };
  return { path: saved.path };
}

/** FR-ADM-02: Regular Course application. */
export async function submitRegular(_prev: ApplyState, formData: FormData): Promise<ApplyState> {
  const parsed = regularSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message === "Required" ? `${i.path.join(".")} is required` : i.message).slice(0, 3).join(" · ") };
  }
  const captcha = await verifyRecaptcha(String(formData.get("recaptchaToken") ?? "") || undefined);
  if (!captcha.ok) return { error: "Captcha verification failed. Please try again." };
  const photo = await handlePhoto(formData);
  if ("error" in photo) return { error: photo.error };

  const d = parsed.data;
  const app = await db.applicationForm.create({
    data: {
      type: "REGULAR",
      applicantName: d.applicantName,
      dob: new Date(d.dob),
      gender: d.gender,
      religion: d.religion,
      phone: d.phone,
      email: d.email,
      photoUrl: photo.path,
      addressKorea: d.addressKorea,
      addressBangladesh: d.addressBangladesh,
      emergencyContact: d.emergencyContact,
      grade: d.grade,
      fatherName: d.fatherName,
      motherName: d.motherName,
      guardianProfession: d.guardianProfession || null,
      guardianEducation: d.guardianEducation || null,
      guardianPhone2: d.guardianPhone2 || null,
      parentalConsent: true,
    },
  });
  redirect(`/apply/payment/${app.id}`);
}

/** FR-ADM-03: Special Course application. */
export async function submitSpecial(_prev: ApplyState, formData: FormData): Promise<ApplyState> {
  const parsed = specialSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message === "Required" ? `${i.path.join(".")} is required` : i.message).slice(0, 3).join(" · ") };
  }
  const captcha = await verifyRecaptcha(String(formData.get("recaptchaToken") ?? "") || undefined);
  if (!captcha.ok) return { error: "Captcha verification failed. Please try again." };
  const photo = await handlePhoto(formData);
  if ("error" in photo) return { error: photo.error };

  const d = parsed.data;
  const app = await db.applicationForm.create({
    data: {
      type: "SPECIAL",
      applicantName: d.applicantName,
      dob: new Date(d.dob),
      gender: d.gender,
      religion: d.religion,
      phone: d.phone,
      email: d.email,
      photoUrl: photo.path,
      addressKorea: d.addressKorea || null,
      addressBangladesh: d.addressBangladesh,
      emergencyContact: d.emergencyContact,
      courseName: d.courseName,
      highestEducation: d.highestEducation || null,
      parentalConsent: true,
      adminNote: d.isBcskStudent === "on" ? "Claims BCSK student rate" : null,
    },
  });
  redirect(`/apply/payment/${app.id}${d.isBcskStudent === "on" ? "?bcsk=1" : ""}`);
}
