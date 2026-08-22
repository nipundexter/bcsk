"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api, ApiError, toActionError } from "@/services/api-client";
import { homeFor, getSession, type Role } from "@/lib/auth";

/**
 * Authentication actions. Every one is a thin pass-through to the backend, which owns
 * credential verification, rate limiting and audit. The frontend's only job is moving the
 * session cookie between the browser and the API.
 */

export type LoginState = { error?: string } | null;

type LoginResponse = {
  token: string;
  refreshToken: string;
  user: { userId: number; loginId: string; role: Role; name: string; mustChangePassword: boolean };
};

async function login(formData: FormData, surface: "classroom" | "office" | "admin"): Promise<LoginState> {
  const loginId = String(formData.get("loginId") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!loginId || !password) return { error: "Enter both your ID and password." };

  let result: LoginResponse;
  try {
    result = await api.post<LoginResponse>("/auth/login", { loginId, password, surface }, { auth: false });
  } catch (e) {
    // The backend returns one generic message for every credential failure, deliberately.
    if (e instanceof ApiError && e.status === 401) return { error: "invalid" };
    if (e instanceof ApiError && e.status === 429) return { error: e.message };
    return toActionError(e);
  }

  // The backend also sets this cookie, but its Set-Cookie header is on a server-to-server
  // response the browser never sees. Setting it here is what actually signs the user in.
  const jar = await cookies();
  jar.set("bcsk_session", result.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 8 * 3600,
    path: "/",
  });

  // SEC-2: office-issued credentials must be replaced before the portal opens.
  redirect(result.user.mustChangePassword ? "/change-password" : homeFor(result.user.role));
}

// Every export in a "use server" file must be an async function — an arrow const that
// merely returns a promise is rejected by the compiler.
export async function loginStudent(_p: LoginState, f: FormData) {
  return login(f, "classroom");
}
export async function loginTeacher(_p: LoginState, f: FormData) {
  return login(f, "office");
}
export async function loginAdmin(_p: LoginState, f: FormData) {
  return login(f, "admin");
}

export async function logout(dest: string) {
  try {
    await api.post("/auth/logout", {}, { auth: true });
  } catch {
    // Signing out must succeed locally even if the API is unreachable.
  }
  const jar = await cookies();
  jar.delete("bcsk_session");
  redirect(dest);
}

export type ChangePasswordState = { error?: string } | null;

export async function changePassword(
  _p: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const session = await getSession();
  if (!session) redirect("/");

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < 10) return { error: "Your new password must be at least 10 characters." };
  if (newPassword !== confirmPassword) return { error: "The two new passwords don't match." };

  try {
    await api.post("/users/me/change-password", { currentPassword, newPassword });
  } catch (e) {
    return toActionError(e);
  }
  redirect(homeFor(session.role));
}

/** Password reset is not yet exposed by the API — tracked as part of Phase D. */
export async function forgotPassword(
  _p: { ok?: boolean; error?: string } | null,
  _formData: FormData,
) {
  return { ok: true };
}

export async function resetPassword(
  _p: { ok?: boolean; error?: string } | null,
  _formData: FormData,
) {
  return { error: "Password reset is temporarily unavailable. Please contact the school office." };
}
