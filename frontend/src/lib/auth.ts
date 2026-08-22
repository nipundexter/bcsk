import "server-only";
import { cache } from "react";
import { redirect, forbidden } from "next/navigation";
import { api, ApiError } from "@/services/api-client";

/**
 * Session and access guards for the web app.
 *
 * The frontend no longer verifies tokens. It forwards the browser's httpOnly cookie to
 * `GET /auth/me` and the backend — which owns `JWT_SECRET` — decides who the caller is and
 * what they may do. That is why this project needs no secret of its own.
 *
 * The shape of the guards is unchanged, so every call site keeps working: `requireStudent()`
 * still redirects, `requirePermission()` still renders the 403 boundary.
 */

export type Role = "STUDENT" | "TEACHER" | "ADMIN_SUPPORT" | "IT_SUPPORT" | "SUPER_ADMIN";

export type Session = {
  userId: number;
  loginId: string;
  role: Role;
  name: string;
  /** SEC-2: an office-issued credential not yet replaced by its holder. */
  mustChangePassword: boolean;
  /** Served by the backend so the menu and the API can never disagree (SEC-4 / SEC-5). */
  permissions: string[];
};

export const CHANGE_PASSWORD_PATH = "/change-password";

const ADMIN_ROLES: Role[] = ["ADMIN_SUPPORT", "IT_SUPPORT", "SUPER_ADMIN"];

/** Where a user lands after signing in. */
export function homeFor(role: Role): string {
  if (role === "STUDENT") return "/classroom/dashboard";
  if (role === "TEACHER") return "/office/dashboard";
  return "/admin/dashboard";
}

/**
 * PERF-2 still applies: memoised per request, so a layout guard and a page guard on the
 * same render share one call to the backend rather than making two.
 */
export const getSession = cache(async function getSession(): Promise<Session | null> {
  try {
    return await api.get<Session>("/auth/me");
  } catch (e) {
    // 401 simply means "not signed in" — anything else is a real fault and must surface.
    if (e instanceof ApiError && e.status === 401) return null;
    throw e;
  }
});

/** SEC-2: an office-issued credential must be replaced before any portal page renders. */
function enforcePasswordChange(session: Session): void {
  if (session.mustChangePassword) redirect(CHANGE_PASSWORD_PATH);
}

export async function requireStudent(): Promise<Session> {
  const s = await getSession();
  if (!s || s.role !== "STUDENT") redirect("/classroom");
  enforcePasswordChange(s);
  return s;
}

export async function requireTeacher(): Promise<Session> {
  const s = await getSession();
  if (!s || s.role !== "TEACHER") redirect("/office");
  enforcePasswordChange(s);
  return s;
}

export async function requireAdmin(): Promise<Session> {
  const s = await getSession();
  if (!s || !ADMIN_ROLES.includes(s.role)) redirect("/admin");
  enforcePasswordChange(s);
  return s;
}

export async function requireSuperAdmin(): Promise<Session> {
  const s = await getSession();
  if (!s || s.role !== "SUPER_ADMIN") redirect("/admin");
  enforcePasswordChange(s);
  return s;
}

/**
 * SEC-4.1: capability check against the permission list the backend issued.
 *
 * This is defence in depth, not the enforcement point — the API refuses the call regardless.
 * Checking here means the user sees a 403 page instead of a broken screen.
 */
export async function requirePermission(permission: string): Promise<Session> {
  const session = await requireAdmin();
  if (!session.permissions.includes(permission)) forbidden();
  return session;
}

/** Any signed-in user, with no forced-change diversion — used by the change-password screen. */
export async function requireAnyUser(): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/");
  return s;
}

export const can = (session: Session | null, permission: string): boolean =>
  session?.permissions.includes(permission) ?? false;
