"use server";

import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession, destroySession, verifyLogin, audit } from "@/lib/auth";
import { ADMIN_ROLES, type Role } from "@/lib/constants";
import { sendMail, emailLayout } from "@/lib/email";

export type LoginState = { error?: string } | null;

async function login(formData: FormData, roles: Role[], dest: string): Promise<LoginState> {
  const loginId = String(formData.get("loginId") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!loginId || !password) return { error: "Enter both your ID and password." };
  const user = await verifyLogin(loginId, password, roles);
  if (!user) return { error: "invalid" };
  await createSession(user);
  redirect(dest);
}

export async function loginStudent(_p: LoginState, f: FormData) {
  return login(f, ["STUDENT"], "/classroom/dashboard");
}
export async function loginTeacher(_p: LoginState, f: FormData) {
  return login(f, ["TEACHER"], "/office/dashboard");
}
export async function loginAdmin(_p: LoginState, f: FormData) {
  return login(f, ADMIN_ROLES, "/admin/dashboard");
}

export async function logout(dest: string) {
  await destroySession();
  redirect(dest);
}

/** FR-STU-01 "Forgot Password" path — works for any account with an email on file. */
export async function forgotPassword(_p: { ok?: boolean; error?: string } | null, formData: FormData) {
  const loginId = String(formData.get("loginId") ?? "").trim();
  const user = await db.user.findUnique({ where: { loginId } });
  // Always claim success so account IDs can't be probed.
  if (user?.email) {
    const token = randomBytes(24).toString("hex");
    await db.passwordReset.create({
      data: { userId: user.id, token, expiresAt: new Date(Date.now() + 3600_000) },
    });
    const url = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${token}`;
    await sendMail(
      user.email,
      "BCSK password reset",
      emailLayout(
        "Reset your password",
        `<p style="font-size:14px;color:#232323">A password reset was requested for account <b>${user.loginId}</b>. This link is valid for 1 hour:</p>
         <p><a href="${url}" style="display:inline-block;background:#f5820b;color:#fff;text-decoration:none;font-weight:bold;border-radius:8px;padding:10px 22px;font-size:14px">Set a new password</a></p>
         <p style="font-size:12px;color:#5b5b6b">If you didn't request this, you can ignore this email.</p>`
      )
    );
  }
  return { ok: true };
}

export async function resetPassword(_p: { ok?: boolean; error?: string } | null, formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  const rec = await db.passwordReset.findUnique({ where: { token }, include: { user: true } });
  if (!rec || rec.usedAt || rec.expiresAt < new Date()) {
    return { error: "This reset link is invalid or has expired. Request a new one from the login page." };
  }
  // NFR-SEC-01: salted hash
  const hash = await bcrypt.hash(password, 10);
  await db.$transaction([
    db.user.update({ where: { id: rec.userId }, data: { passwordHash: hash } }),
    db.passwordReset.update({ where: { id: rec.id }, data: { usedAt: new Date() } }),
  ]);
  await audit(rec.userId, "PASSWORD_RESET", "User", rec.userId);
  return { ok: true };
}
