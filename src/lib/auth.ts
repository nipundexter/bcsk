import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { ADMIN_ROLES, type Role } from "@/lib/constants";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret");
const COOKIE = "bcsk_session";
const SESSION_HOURS = Number(process.env.SESSION_HOURS ?? 8);

export type Session = { userId: number; loginId: string; role: Role; name: string };

/** NFR-SEC-02: JWT session with role-based access control. */
export async function createSession(user: { id: number; loginId: string; role: string; name: string }) {
  const token = await new SignJWT({ loginId: user.loginId, role: user.role, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(SECRET);
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_HOURS * 3600,
    path: "/",
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    const userId = Number(payload.sub);
    // NFR-SEC-05: support forced logout — reject sessions for deactivated users
    const user = await db.user.findUnique({ where: { id: userId }, select: { active: true } });
    if (!user?.active) return null;
    return {
      userId,
      loginId: payload.loginId as string,
      role: payload.role as Role,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

/** Verify credentials for a given surface. Returns the user or null. */
export async function verifyLogin(loginId: string, password: string, allowedRoles: Role[]) {
  const user = await db.user.findUnique({ where: { loginId } });
  if (!user || !user.active) return null;
  if (!allowedRoles.includes(user.role as Role)) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? user : null;
}

/** Guard helpers — redirect to the surface's login when unauthenticated. */
export async function requireStudent(): Promise<Session> {
  const s = await getSession();
  if (!s || s.role !== "STUDENT") redirect("/classroom");
  return s;
}
export async function requireTeacher(): Promise<Session> {
  const s = await getSession();
  if (!s || s.role !== "TEACHER") redirect("/office");
  return s;
}
export async function requireAdmin(): Promise<Session> {
  const s = await getSession();
  if (!s || !ADMIN_ROLES.includes(s.role)) redirect("/admin");
  return s;
}
export async function requireSuperAdmin(): Promise<Session> {
  const s = await getSession();
  if (!s || s.role !== "SUPER_ADMIN") redirect("/admin");
  return s;
}

export async function audit(userId: number | null, action: string, entity: string, entityId?: string | number, detail?: string) {
  await db.auditLog.create({
    data: { userId, action, entity, entityId: entityId != null ? String(entityId) : null, detail },
  });
}
