import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { CourseEditor } from "./CourseEditor";

/** FR-ADMIN-07: manage Course, Level, Syllabus, and Book records. */
export default async function AdminCoursesPage() {
  await requirePermission("courses:manage");
  const courses = await db.course.findMany({
    include: { levels: { orderBy: { displayOrder: "asc" } } },
    orderBy: { displayOrder: "asc" },
  });

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl font-semibold text-navy mb-6">Courses & Levels</h1>
      <CourseEditor
        courses={courses.map((c) => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
          type: c.type,
          description: c.description ?? "",
          active: c.active,
          levels: c.levels.map((l) => ({
            id: l.id,
            name: l.name,
            syllabus: l.syllabus ?? "",
            studentBookUrl: l.studentBookUrl,
            workBookUrl: l.workBookUrl,
          })),
        }))}
      />
    </div>
  );
}
