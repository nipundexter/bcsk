import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/constants";
import { db } from "@/lib/db";

/** NFR-SEC-04: uploaded files are stored in the DB and access-restricted by role. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const rel = path.join("/");
  if (rel.includes("..")) return new NextResponse("Not found", { status: 404 });
  const folder = rel.split("/")[0];

  // gallery images are public site content
  if (folder !== "gallery") {
    const session = await getSession();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });
    const isAdmin = ADMIN_ROLES.includes(session.role);

    if (!isAdmin) {
      // applications/receipts: admin only. per-user folders: owner only for students.
      if (folder === "applications" || folder === "receipts") {
        return new NextResponse("Forbidden", { status: 403 });
      }
      if (folder === "student-docs" || folder === "submissions") {
        const ownerId = Number(rel.split("/")[1]);
        if (session.role === "STUDENT" && ownerId !== session.userId) {
          return new NextResponse("Forbidden", { status: 403 });
        }
      }
      if ((folder === "class-videos" || folder === "assignments" || folder === "books") &&
          !["STUDENT", "TEACHER"].includes(session.role)) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }
  }

  const blob = await db.fileBlob.findUnique({ where: { path: rel } });
  if (!blob) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(new Uint8Array(blob.data), {
    headers: {
      "Content-Type": blob.mime,
      "Cache-Control": folder === "gallery" ? "public, max-age=3600" : "private, max-age=300",
    },
  });
}
