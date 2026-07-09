import { db } from "@/lib/db";
import { PageShell } from "@/components/site/PageShell";

/** FR-STU-09: QR verification endpoint for issued certificates and ID cards. */
export default async function VerifyPage({ params }: { params: Promise<{ serial: string }> }) {
  const { serial } = await params;
  const cert = await db.certificate.findUnique({
    where: { serial },
    include: { student: { include: { studentProfile: true } } },
  });

  return (
    <PageShell title="Document Verification" eyebrow="BCSK">
      <div className="max-w-md">
        {cert ? (
          <div className="bg-white border border-line rounded-2xl p-8 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-teal/15 text-teal flex items-center justify-center">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
            </div>
            <h2 className="mt-4 font-display text-xl font-semibold text-navy">Valid document</h2>
            <dl className="mt-5 text-sm text-left space-y-2.5">
              <div className="flex justify-between"><dt className="font-bold text-ink-soft">Serial</dt><dd className="font-bold text-ink">{cert.serial}</dd></div>
              <div className="flex justify-between"><dt className="font-bold text-ink-soft">Type</dt><dd>{cert.type.replace(/_/g, " ")}</dd></div>
              <div className="flex justify-between"><dt className="font-bold text-ink-soft">Student</dt><dd>{cert.student.name}</dd></div>
              <div className="flex justify-between"><dt className="font-bold text-ink-soft">Student ID</dt><dd>{cert.student.studentProfile?.studentId}</dd></div>
              <div className="flex justify-between"><dt className="font-bold text-ink-soft">Issued</dt><dd>{cert.issuedAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</dd></div>
            </dl>
          </div>
        ) : (
          <div className="bg-white border border-line rounded-2xl p-8 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </div>
            <h2 className="mt-4 font-display text-xl font-semibold text-navy">Not found</h2>
            <p className="mt-2 text-sm text-ink-soft">
              No document with serial “{serial}” was issued by BCSK. If you believe this is an error, contact
              bcskr22@gmail.com.
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
}
