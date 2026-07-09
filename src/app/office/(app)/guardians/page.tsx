import { requireTeacher } from "@/lib/auth";
import { db } from "@/lib/db";
import { SEMESTER_CURRENT, classLevelLabel } from "@/lib/constants";

/** FR-TCH-06: guardians contact directory for the teacher's classes. */
export default async function GuardiansPage() {
  const session = await requireTeacher();
  const sessions = await db.classSession.findMany({
    where: { teacher: { userId: session.userId }, semester: SEMESTER_CURRENT },
    include: {
      enrollments: {
        where: { status: "ACTIVE" },
        include: { student: { include: { studentProfile: true } } },
      },
    },
  });

  // unique students across the teacher's classes
  const students = new Map<number, { name: string; profile: NonNullable<(typeof sessions)[0]["enrollments"][0]["student"]["studentProfile"]> }>();
  for (const cs of sessions) {
    for (const e of cs.enrollments) {
      if (e.student.studentProfile) students.set(e.student.id, { name: e.student.name, profile: e.student.studentProfile });
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl font-semibold text-navy mb-6">Guardians Contact Directory</h1>
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-cream text-navy text-left">
              <th className="px-5 py-3.5 font-bold">Student</th>
              <th className="px-5 py-3.5 font-bold">Class</th>
              <th className="px-5 py-3.5 font-bold">Father / Mother</th>
              <th className="px-5 py-3.5 font-bold">Phone</th>
              <th className="px-5 py-3.5 font-bold">Email</th>
              <th className="px-5 py-3.5 font-bold">Emergency</th>
            </tr>
          </thead>
          <tbody>
            {students.size === 0 && (
              <tr><td colSpan={6} className="px-5 py-6 text-ink-soft">No students in your classes yet.</td></tr>
            )}
            {[...students.values()].map(({ name, profile }) => (
              <tr key={profile.studentId} className="border-t border-line">
                <td className="px-5 py-3">
                  <span className="font-bold text-ink">{name}</span>
                  <span className="block text-[11px] text-ink-soft">{profile.studentId}</span>
                </td>
                <td className="px-5 py-3">{classLevelLabel(profile.classLevel)}</td>
                <td className="px-5 py-3 text-ink-soft">
                  {profile.fatherName ?? "—"}<br />{profile.motherName ?? "—"}
                </td>
                <td className="px-5 py-3">{profile.guardianPhone ?? "—"}</td>
                <td className="px-5 py-3">
                  {profile.guardianEmail ? (
                    <a className="text-sky hover:underline" href={`mailto:${profile.guardianEmail}`}>{profile.guardianEmail}</a>
                  ) : "—"}
                </td>
                <td className="px-5 py-3 text-ink-soft">{profile.emergencyContact ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
