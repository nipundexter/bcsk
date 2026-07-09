import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { SEMESTER_CURRENT } from "@/lib/constants";

/** Which course slugs the current visitor (if a logged-in student) is enrolled in. */
export async function getEnrolledCourseSlugs(): Promise<{ studentUserId: number | null; slugs: Set<string> }> {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") return { studentUserId: null, slugs: new Set() };
  const enrollments = await db.enrollment.findMany({
    where: { studentUserId: session.userId, semester: SEMESTER_CURRENT, status: "ACTIVE" },
    include: { classSession: { include: { course: true } } },
  });
  return {
    studentUserId: session.userId,
    slugs: new Set(enrollments.map((e) => e.classSession.course.slug)),
  };
}
