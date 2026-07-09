import { requireStudent } from "@/lib/auth";
import { db } from "@/lib/db";
import { classLevelLabel, SEMESTER_CURRENT } from "@/lib/constants";
import { krw } from "@/lib/payments";
import { ReAdmissionForm } from "./ReAdmissionForm";

/** FR-ADM-10 / FR-STU-05: returning-student re-admission — semester fee only, admission fee waived. */
export default async function ReAdmissionPage() {
  const session = await requireStudent();
  const profile = await db.studentProfile.findUnique({ where: { userId: session.userId } });
  const feeKey = (profile?.classLevel ?? "").toLowerCase();
  const fee = await db.feeConfig.findUnique({ where: { key: feeKey } });
  const existing = await db.payment.findFirst({
    where: {
      payerUserId: session.userId,
      purpose: "RE_ADMISSION",
      status: { in: ["PENDING_VERIFICATION", "PAID", "VERIFIED"] },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-navy mb-2">Re-Admission</h1>
      <p className="text-sm text-ink-soft mb-6">
        Continue in <b>{profile ? classLevelLabel(profile.classLevel) : "your class"}</b> for the next semester. As a
        continuing student, the admission fee is waived — you pay the semester fee only.
      </p>

      {existing ? (
        <div className="bg-white border border-line rounded-2xl p-6">
          <p className="text-sm">
            <span className={`inline-block text-xs font-bold rounded-full px-3 py-1 mr-2 ${
              existing.status === "PENDING_VERIFICATION" ? "bg-sunrise/15 text-sunrise-deep" : "bg-teal/15 text-teal"
            }`}>
              {existing.status.replace(/_/g, " ")}
            </span>
            Re-admission payment of <b>{krw(existing.amount)}</b>
            {existing.virtualRef ? <> (ref {existing.virtualRef})</> : null} —{" "}
            {existing.status === "PENDING_VERIFICATION"
              ? "our office is verifying your transfer."
              : "your enrollment for the new semester is confirmed."}
          </p>
          {["PAID", "VERIFIED"].includes(existing.status) && (
            <a href={`/api/receipts/${existing.id}`} className="inline-block mt-3 text-sky text-sm font-bold hover:underline">
              Download receipt (PDF)
            </a>
          )}
        </div>
      ) : fee ? (
        <ReAdmissionForm
          amount={fee.semesterFee}
          classLabel={classLevelLabel(profile?.classLevel ?? "")}
          semester={SEMESTER_CURRENT}
        />
      ) : (
        <p className="bg-white border border-line rounded-2xl p-6 text-sm text-ink-soft">
          No semester fee is configured for your class. Please contact the office (bcskr22@gmail.com).
        </p>
      )}
    </div>
  );
}
