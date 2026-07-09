import { requireStudent } from "@/lib/auth";
import { db } from "@/lib/db";
import { SEMESTER_CURRENT } from "@/lib/constants";

/** FR-STU-05: syllabus for the student's enrolled courses. */
export default async function StudentSyllabusPage() {
  const session = await requireStudent();
  const enrollments = await db.enrollment.findMany({
    where: { studentUserId: session.userId, semester: SEMESTER_CURRENT, status: "ACTIVE" },
    include: { classSession: { include: { course: true, level: true } } },
  });

  const seen = new Set<string>();
  const items = enrollments
    .map((e) => ({
      course: e.classSession.course,
      level: e.classSession.level,
    }))
    .filter((i) => {
      const key = `${i.course.id}-${i.level?.id ?? 0}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-semibold text-navy mb-6">Syllabus</h1>
      <div className="space-y-4">
        {items.map((i, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-line p-6">
            <h2 className="font-bold text-navy">
              {i.course.name}
              {i.level && <span className="text-ink-soft font-semibold"> — {i.level.name}</span>}
            </h2>
            <p className="mt-2 text-sm text-ink leading-relaxed">
              {i.level?.syllabus ?? i.course.description ?? "Syllabus will be published by your teacher."}
            </p>
            {i.level?.studentBookUrl && (
              <a href={`/api/files/${i.level.studentBookUrl}`} className="inline-block mt-3 text-sky text-sm font-bold hover:underline">
                Student Book (PDF)
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
