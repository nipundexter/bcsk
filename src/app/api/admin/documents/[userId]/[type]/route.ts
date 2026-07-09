import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ADMIN_ROLES, SEMESTER_CURRENT, classLevelLabel } from "@/lib/constants";
import { db } from "@/lib/db";
import { certificatePdf, idCardPdf, resultSheetPdf } from "@/lib/pdf";

/** FR-ADMIN-09: admin-generated student documents (per student). */
export async function GET(_req: Request, ctx: { params: Promise<{ userId: string; type: string }> }) {
  const session = await getSession();
  if (!session || !ADMIN_ROLES.includes(session.role)) return new NextResponse("Forbidden", { status: 403 });

  const { userId: userIdStr, type } = await ctx.params;
  const userId = Number(userIdStr);
  const user = await db.user.findUnique({ where: { id: userId }, include: { studentProfile: true } });
  if (!user?.studentProfile) return new NextResponse("Student not found", { status: 404 });
  const profile = user.studentProfile;
  const classLabel = classLevelLabel(profile.classLevel);
  const year = new Date().getFullYear();

  const respond = (buf: Buffer, name: string) =>
    new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${name}.pdf"`,
      },
    });

  if (type === "certificate") {
    const serial = `BCSK-CERT-${year}-${String(userId).padStart(4, "0")}`;
    await db.certificate.upsert({
      where: { serial },
      update: {},
      create: { studentUserId: userId, type: "ENROLLMENT", serial, dataJson: JSON.stringify({ by: session.loginId }) },
    });
    return respond(
      await certificatePdf({ serial, studentName: user.name, studentId: profile.studentId, classLevel: classLabel, semester: SEMESTER_CURRENT }),
      serial
    );
  }
  if (type === "id-card") {
    const serial = `BCSK-ID-${year}-${String(userId).padStart(4, "0")}`;
    await db.certificate.upsert({
      where: { serial },
      update: {},
      create: { studentUserId: userId, type: "ID_CARD", serial, dataJson: JSON.stringify({ by: session.loginId }) },
    });
    return respond(
      await idCardPdf({
        serial,
        studentName: user.name,
        studentId: profile.studentId,
        classLevel: classLabel,
        verifyUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/verify/${serial}`,
      }),
      serial
    );
  }
  if (type === "result-sheet") {
    const results = await db.examResult.findMany({ where: { studentUserId: userId }, orderBy: { subject: "asc" } });
    if (results.length === 0) return new NextResponse("No results recorded for this student", { status: 404 });
    const semester = results.map((r) => r.semester).sort().reverse()[0];
    const serial = `BCSK-RES-${semester}-${String(userId).padStart(4, "0")}`;
    return respond(
      await resultSheetPdf({
        serial,
        studentName: user.name,
        studentId: profile.studentId,
        classLevel: classLabel,
        semester,
        rows: results.filter((r) => r.semester === semester),
      }),
      serial
    );
  }
  return new NextResponse("Unknown document type", { status: 404 });
}
