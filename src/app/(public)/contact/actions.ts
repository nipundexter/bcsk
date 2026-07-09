"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { verifyRecaptcha } from "@/lib/recaptcha";

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  phone: z.string().max(40).optional().or(z.literal("")),
  subject: z.string().min(2).max(200),
  message: z.string().min(5).max(5000),
  category: z.enum(["GENERAL", "IT", "ADMISSION"]),
  recaptchaToken: z.string().optional(),
});

export type ContactState = { ok: boolean; error?: string } | null;

/** FR-CONT-01: contact form creates a support ticket routed to Admin/IT Support. */
export async function submitContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    subject: formData.get("subject"),
    message: formData.get("message"),
    category: formData.get("category") ?? "GENERAL",
    recaptchaToken: formData.get("recaptchaToken") ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: "Please check the highlighted fields — every required field needs a valid value." };
  }
  const captcha = await verifyRecaptcha(parsed.data.recaptchaToken);
  if (!captcha.ok) {
    return { ok: false, error: "Captcha verification failed. Please try again." };
  }
  await db.supportTicket.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      subject: parsed.data.subject,
      message: parsed.data.message,
      category: parsed.data.category,
    },
  });
  return { ok: true };
}
