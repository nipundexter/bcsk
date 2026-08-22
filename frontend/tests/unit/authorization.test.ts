import { describe, it, expect, vi, afterEach } from "vitest";
import { permissionsFor, roleHas, navFor, PERMISSIONS, ADMIN_NAV } from "@/lib/permissions";
import { requiredSecret, intFromEnv, isDemoMode } from "@/lib/env";
import type { Role } from "@/lib/constants";

/**
 * QUAL-1 — authorisation and environment handling.
 *
 * These encode the SEC-1, SEC-2 and SEC-4 regressions as executable assertions, because
 * each was a silent failure: nothing crashed, the app just quietly did the wrong thing.
 */

describe("SEC-4 — role permissions", () => {
  it("gives SUPER_ADMIN every capability", () => {
    expect(permissionsFor("SUPER_ADMIN")).toHaveLength(PERMISSIONS.length);
  });

  it.each(["payments:verify", "payments:refund", "admissions:decide", "fees:manage", "content:manage"] as const)(
    "denies IT_SUPPORT %s",
    (perm) => expect(roleHas("IT_SUPPORT", perm)).toBe(false)
  );

  it.each(["users:manage", "settings:manage", "audit:read"] as const)(
    "denies ADMIN_SUPPORT %s",
    (perm) => expect(roleHas("ADMIN_SUPPORT", perm)).toBe(false)
  );

  it("grants IT_SUPPORT exactly accounts and the support queue", () => {
    expect([...permissionsFor("IT_SUPPORT")].sort()).toEqual(["tickets:manage", "users:manage"]);
  });

  it("gives non-admin roles no admin capability at all", () => {
    for (const role of ["TEACHER", "STUDENT"] as Role[]) {
      expect(permissionsFor(role)).toHaveLength(0);
      for (const p of PERMISSIONS) expect(roleHas(role, p)).toBe(false);
    }
  });
});

describe("SEC-5 — navigation is derived from the permission map", () => {
  it("shows a link only when the role holds its permission", () => {
    for (const role of ["SUPER_ADMIN", "ADMIN_SUPPORT", "IT_SUPPORT"] as Role[]) {
      for (const item of navFor(role)) {
        if (item.permission) expect(roleHas(role, item.permission)).toBe(true);
      }
    }
  });

  it("hides every module the role cannot use", () => {
    const itHrefs = navFor("IT_SUPPORT").map((n) => n.href);
    expect(itHrefs).not.toContain("/admin/payments");
    expect(itHrefs).not.toContain("/admin/settings");
    expect(itHrefs).toContain("/admin/users");
  });

  it("scales the menu with the role", () => {
    expect(navFor("SUPER_ADMIN").length).toBeGreaterThan(navFor("ADMIN_SUPPORT").length);
    expect(navFor("ADMIN_SUPPORT").length).toBeGreaterThan(navFor("IT_SUPPORT").length);
  });

  it("references only permissions that exist", () => {
    for (const item of ADMIN_NAV) {
      if (item.permission) expect(PERMISSIONS).toContain(item.permission);
    }
  });
});

describe("SEC-1 — environment handling fails loud, not silent", () => {
  it("throws when a required secret is missing", () => {
    delete process.env.__TEST_SECRET;
    expect(() => requiredSecret("__TEST_SECRET")).toThrow(/not set/i);
  });

  it("treats a blank string as missing — the actual production failure", () => {
    process.env.__TEST_SECRET = "   ";
    expect(() => requiredSecret("__TEST_SECRET")).toThrow(/not set/i);
  });

  it("rejects a secret that is too short to be worth having", () => {
    process.env.__TEST_SECRET = "short";
    expect(() => requiredSecret("__TEST_SECRET")).toThrow(/at least 32/i);
  });

  it("accepts a strong secret", () => {
    process.env.__TEST_SECRET = "x".repeat(32);
    expect(requiredSecret("__TEST_SECRET")).toHaveLength(32);
  });

  it("never invents a default", () => {
    delete process.env.__TEST_SECRET;
    // The original bug was `?? "dev-secret"` — any return value here is a regression.
    expect(() => requiredSecret("__TEST_SECRET")).toThrow();
  });
});

describe("SESSION_HOURS — blank must not become zero", () => {
  it.each([
    ["", 8],
    ["   ", 8],
    ["nonsense", 8],
    ["0", 8],
    ["-4", 8],
    ["12", 12],
  ])("intFromEnv(%o) -> %i", (raw, expected) => {
    process.env.__TEST_INT = raw as string;
    expect(intFromEnv("__TEST_INT", 8)).toBe(expected);
  });

  it("falls back when unset", () => {
    delete process.env.__TEST_INT;
    expect(intFromEnv("__TEST_INT", 8)).toBe(8);
  });

  it("demonstrates the original defect for contrast", () => {
    // The old code was `Number(process.env.SESSION_HOURS ?? 8)`. `??` only fires on
    // null/undefined, so a variable that exists but is blank fell through to Number("")
    // — which is 0, and set every session cookie to maxAge 0.
    const blankFromEnv: string | undefined = "";
    expect(Number(blankFromEnv ?? 8)).toBe(0);
    expect(intFromEnv("__TEST_INT_ABSENT", 8)).toBe(8);
  });
});

describe("SEC-2 — demo hints", () => {
  // vi.stubEnv handles NODE_ENV, which Node protects from plain assignment.
  afterEach(() => vi.unstubAllEnvs());

  it("is off when nothing is configured", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "");
    expect(isDemoMode()).toBe(false);
  });

  it("is on only when explicitly requested in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "1");
    expect(isDemoMode()).toBe(true);
  });

  it("is off in production even when explicitly requested", () => {
    // The SEC-2 guarantee: demo credentials can never surface on a production build.
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "1");
    expect(isDemoMode()).toBe(false);
  });
});
