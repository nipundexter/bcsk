import { requireStudent } from "@/lib/auth";
import { classroom } from "@/services";
import { SEMESTER_CURRENT } from "@/lib/constants";

/** FR-STU-05: syllabus for the student's enrolled courses. */
export default async function StudentSyllabusPage() {
  const session = await requireStudent();
  const entries = await classroom.syllabus();

  // The endpoint returns one flattened row per enrolment, so the page only renders.
  const items = entries;

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-semibold text-navy mb-6">Syllabus</h1>
      <div className="space-y-4">
        {items.map((i, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-line p-6">
            <h2 className="font-bold text-navy">
              {i.courseName}
              {i.levelName && <span className="text-ink-soft font-semibold"> — {i.levelName}</span>}
            </h2>
            <p className="mt-2 text-sm text-ink leading-relaxed">
              {i.syllabus ?? "Syllabus will be published by your teacher."}
            </p>
            {i.studentBookUrl && (
              <a href={`/api/files/${i.studentBookUrl}`} className="inline-block mt-3 text-sky text-sm font-bold hover:underline">
                Student Book (PDF)
              </a>
            )}
            {i.workBookUrl && (
              <a href={`/api/files/${i.workBookUrl}`} className="inline-block mt-3 ml-4 text-sky text-sm font-bold hover:underline">
                Work Book (PDF)
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
