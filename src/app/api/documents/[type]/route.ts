import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth";
import { db } from "@/lib/db";
import { certificatePdf, idCardPdf, resultSheetPdf } from "@/lib/pdf";
import { SEMESTER_CURRENT, classLevelLabel } from "@/lib/constants";

/** FR-STU-05/09 + FR-ADMIN-09: generated student documents. Records a Certificate row per issue. */
export async function GET(_req: Request, ctx: { params: Promise<{ type: string }> }) {
  const session = await requireStudent();
  const { type } = await ctx.params;
  const profile = await db.studentProfile.findUnique({ where: { userId: session.userId } });
  if (!profile) return new NextResponse("No student profile", { status: 404 });

  const classLabel = classLevelLabel(profile.classLevel);
  const year = new Date().getFullYear();

  if (type === "certificate") {
    const serial = `BCSK-CERT-${year}-${String(session.userId).padStart(4, "0")}`;
    await db.certificate.upsert({
      where: { serial },
      update: {},
      create: {
        studentUserId: session.userId,
        type: "ENROLLMENT",
        serial,
        dataJson: JSON.stringify({ name: session.name, studentId: profile.studentId, class: classLabel, semester: SEMESTER_CURRENT }),
      },
    });
    const buf = await certificatePdf({
      serial,
      studentName: session.name,
      studentId: profile.studentId,
      classLevel: classLabel,
      semester: SEMESTER_CURRENT,
    });
    return pdfResponse(buf, serial);
  }

  if (type === "id-card") {
    const serial = `BCSK-ID-${year}-${String(session.userId).padStart(4, "0")}`;
    await db.certificate.upsert({
      where: { serial },
      update: {},
      create: {
        studentUserId: session.userId,
        type: "ID_CARD",
        serial,
        dataJson: JSON.stringify({ name: session.name, studentId: profile.studentId, class: classLabel }),
      },
    });
    const buf = await idCardPdf({
      serial,
      studentName: session.name,
      studentId: profile.studentId,
      classLevel: classLabel,
      verifyUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/verify/${serial}`,
    });
    return pdfResponse(buf, serial);
  }

  if (type === "result-sheet") {
    const results = await db.examResult.findMany({
      where: { studentUserId: session.userId },
      orderBy: { subject: "asc" },
    });
    if (results.length === 0) return new NextResponse("No results published yet", { status: 404 });
    const semester = results.map((r) => r.semester).sort().reverse()[0];
    const serial = `BCSK-RES-${semester}-${String(session.userId).padStart(4, "0")}`;
    const buf = await resultSheetPdf({
      serial,
      studentName: session.name,
      studentId: profile.studentId,
      classLevel: classLabel,
      semester,
      rows: results.filter((r) => r.semester === semester),
    });
    return pdfResponse(buf, serial);
  }

  return new NextResponse("Unknown document type", { status: 404 });
}

function pdfResponse(buf: Buffer, name: string) {
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${name}.pdf"`,
    },
  });
}
