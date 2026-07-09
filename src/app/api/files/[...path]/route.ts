import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join, normalize } from "path";
import { getSession } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/constants";
import { db } from "@/lib/db";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
};

/** NFR-SEC-04: uploaded files are access-restricted by role. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const rel = normalize(path.join("/")).replace(/^(\.\.[/\\])+/, "");
  if (rel.includes("..")) return new NextResponse("Not found", { status: 404 });

  const session = await getSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const isAdmin = ADMIN_ROLES.includes(session.role);
  const folder = rel.split("/")[0];

  if (!isAdmin) {
    // applications/receipts: admin only. student-docs/<userId>/...: owner or teacher.
    if (folder === "applications" || folder === "receipts") {
      return new NextResponse("Forbidden", { status: 403 });
    }
    if (folder === "student-docs") {
      const ownerId = Number(rel.split("/")[1]);
      if (session.role === "STUDENT" && ownerId !== session.userId) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }
    if (folder === "submissions" && session.role === "STUDENT") {
      const ownerId = Number(rel.split("/")[1]);
      if (ownerId !== session.userId) return new NextResponse("Forbidden", { status: 403 });
    }
    if (folder === "class-videos" || folder === "assignments" || folder === "books") {
      // enrolled students and teachers may read; simple role gate here
      if (!["STUDENT", "TEACHER"].includes(session.role)) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }
  }

  const abs = join(process.cwd(), "storage", "uploads", rel);
  if (!existsSync(abs)) return new NextResponse("Not found", { status: 404 });
  const ext = rel.split(".").pop() ?? "";
  const buf = readFileSync(abs);
  void db; // (reserved for future per-record ACL checks)
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": MIME[ext] ?? "application/octet-stream",
      "Cache-Control": "private, max-age=300",
    },
  });
}
