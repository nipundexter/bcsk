"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { requirePermission, audit } from "@/lib/auth";
import { db } from "@/lib/db";
import { ROLES } from "@/lib/constants";
import { sendMail, emailLayout } from "@/lib/email";
import { log } from "@/lib/logger";

export type UserFormState = { ok?: string; error?: string } | null;

/** FR-ADMIN-06: create an account (student/teacher/admin). */
export async function createUser(_prev: UserFormState, formData: FormData): Promise<UserFormState> {
  const admin = await requirePermission("users:manage");
  const loginId = String(formData.get("loginId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  const role = String(formData.get("role") ?? "");
  if (!loginId || !name) return { error: "Login ID and name are required." };
  if (!Object.values(ROLES).includes(role as never)) return { error: "Choose a role." };
  if (await db.user.findUnique({ where: { loginId } })) return { error: `Login ID ${loginId} already exists.` };

  const tempPassword = randomBytes(4).toString("hex");
  const hash = await bcrypt.hash(tempPassword, 10);
  await db.user.create({
    data: {
      loginId,
      name,
      email,
      passwordHash: hash,
      role,
      // SEC-2: office-issued credential — the holder must replace it at first login.
      mustChangePassword: true,
      ...(role === "STUDENT"
        ? { studentProfile: { create: { studentId: loginId, classLevel: String(formData.get("classLevel") ?? "PRE_PRIMARY") } } }
        : {}),
      ...(role === "TEACHER"
        ? { teacherProfile: { create: { teacherId: loginId, designation: String(formData.get("designation") ?? "") || null } } }
        : {}),
    },
  });
  if (email) {
    await sendMail(
      email,
      "Your BCSK account",
      emailLayout(
        "Account created",
        `<p style="font-size:14px;color:#232323">An account was created for you: ID <b>${loginId}</b>, temporary password <b>${tempPassword}</b>. Please change it after first login.</p>`
      )
    );
  }
  await audit(admin.userId, "USER_CREATE", "User", loginId, role);
  log.info("auth", "user_created", { loginId, role, by: admin.loginId });
  revalidatePath("/admin/users");
  return { ok: `Created ${loginId} — temporary password: ${tempPassword}` };
}

/** FR-ADMIN-06: reset password → returns the new temporary password. */
export async function resetUserPassword(userId: number): Promise<string> {
  const admin = await requirePermission("users:manage");
  const tempPassword = randomBytes(4).toString("hex");
  const hash = await bcrypt.hash(tempPassword, 10);
  const user = await db.user.update({
    where: { id: userId },
    // SEC-2: the office chose this password, so the holder must replace it at next login.
    data: { passwordHash: hash, mustChangePassword: true },
  });
  if (user.email) {
    await sendMail(
      user.email,
      "BCSK password reset by office",
      emailLayout("Password reset", `<p style="font-size:14px;color:#232323">Your password was reset by the school office. Temporary password: <b>${tempPassword}</b></p>`)
    );
  }
  await audit(admin.userId, "USER_PASSWORD_RESET", "User", userId);
  log.info("auth", "password_reset_by_office", { userId, loginId: user.loginId, by: admin.loginId });
  return tempPassword;
}

/** FR-ADMIN-06 + NFR-SEC-05: deactivate = forced logout (sessions are rejected for inactive users). */
export async function setUserActive(userId: number, active: boolean) {
  const admin = await requirePermission("users:manage");
  if (admin.userId === userId && !active) return; // don't lock yourself out
  await db.user.update({ where: { id: userId }, data: { active } });
  await audit(admin.userId, active ? "USER_ACTIVATE" : "USER_DEACTIVATE", "User", userId);
  revalidatePath("/admin/users");
}
