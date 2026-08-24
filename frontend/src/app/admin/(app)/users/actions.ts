"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { users, toActionError, ApiError } from "@/services";
import { ROLES } from "@/lib/constants";

export type UserFormState = { ok?: string; error?: string } | null;

/**
 * FR-ADMIN-06 — accounts.
 *
 * Password generation, hashing and the `mustChangePassword` flag (SEC-2) all live in the
 * backend now; this file never sees a hash and the frontend needs no bcrypt. The temporary
 * password is shown once, in the response, and emailed by the backend if an address exists.
 */
export async function createUser(_prev: UserFormState, formData: FormData): Promise<UserFormState> {
  await requirePermission("users:manage");
  const loginId = String(formData.get("loginId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "");
  if (!loginId || !name) return { error: "Login ID and name are required." };
  if (!Object.values(ROLES).includes(role as never)) return { error: "Choose a role." };

  try {
    const created = await users.create({
      loginId,
      name,
      email: String(formData.get("email") ?? "").trim() || null,
      role,
      classLevel: String(formData.get("classLevel") ?? "") || undefined,
      designation: String(formData.get("designation") ?? "") || undefined,
    });
    revalidatePath("/admin/users");
    return { ok: `Created ${created.loginId} — temporary password: ${created.temporaryPassword}` };
  } catch (e) {
    return toActionError(e);
  }
}

/** Returns the new temporary password so the office can read it out; also emailed. */
export async function resetUserPassword(userId: number): Promise<{ password?: string; error?: string }> {
  await requirePermission("users:manage");
  try {
    const { temporaryPassword } = await users.resetPassword(userId);
    return { password: temporaryPassword };
  } catch (e) {
    return toActionError(e);
  }
}

/** FR-ADMIN-06 + NFR-SEC-05: deactivating rejects the account's existing sessions. */
export async function setUserActive(userId: number, active: boolean): Promise<{ ok?: boolean; error?: string }> {
  await requirePermission("users:manage");
  try {
    await users.setActive(userId, active);
  } catch (e) {
    // The backend refuses self-deactivation; that is a message, not a crash.
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath("/admin/users");
  return { ok: true };
}
