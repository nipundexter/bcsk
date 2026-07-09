import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { SEMESTER_CURRENT } from "@/lib/constants";
import { SessionRow } from "./SessionRow";
import { NewSessionForm } from "./NewSessionForm";

/** FR-ADMIN-08: scheduling — assign teachers to sessions, manage the routine. */
export default async function SchedulingPage() {
  await requireAdmin();
  const [sessions, teachers, courses] = await Promise.all([
    db.classSession.findMany({
      where: { semester: SEMESTER_CURRENT },
      include: { teacher: { include: { user: true } }, course: true, level: true, _count: { select: { enrollments: true } } },
      orderBy: [{ classLevel: "asc" }, { dayOfWeek: "asc" }, { startTime: "asc" }],
    }),
    db.teacherProfile.findMany({ include: { user: true }, orderBy: { displayOrder: "asc" } }),
    db.course.findMany({ where: { active: true }, include: { levels: true }, orderBy: { displayOrder: "asc" } }),
  ]);

  const teacherOptions = teachers.map((t) => ({ id: t.id, name: t.user.name }));

  return (
    <div className="max-w-5xl">
      <h1 className="font-display text-2xl font-semibold text-navy mb-2">Scheduling — Semester {SEMESTER_CURRENT}</h1>
      <p className="text-xs text-ink-soft mb-6">
        The class routine and teacher assignments. Changes show immediately on student/teacher dashboards and course pages.
      </p>

      <NewSessionForm
        courses={courses.map((c) => ({ id: c.id, name: c.name, levels: c.levels.map((l) => ({ id: l.id, name: l.name })) }))}
        teachers={teacherOptions}
      />

      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-cream text-navy text-left">
              <th className="px-4 py-3.5 font-bold">Class / Session</th>
              <th className="px-4 py-3.5 font-bold">Day</th>
              <th className="px-4 py-3.5 font-bold">Time</th>
              <th className="px-4 py-3.5 font-bold">Teacher</th>
              <th className="px-4 py-3.5 font-bold">Students</th>
              <th className="px-4 py-3.5 font-bold">Zoom</th>
              <th className="px-4 py-3.5 font-bold"></th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <SessionRow
                key={s.id}
                session={{
                  id: s.id,
                  title: s.title,
                  dayOfWeek: s.dayOfWeek,
                  startTime: s.startTime,
                  endTime: s.endTime,
                  teacherId: s.teacherId,
                  zoomLink: s.zoomLink,
                  active: s.active,
                  enrollmentCount: s._count.enrollments,
                }}
                teachers={teacherOptions}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
