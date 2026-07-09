import { notFound } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { db } from "@/lib/db";
import { LiveControls } from "./LiveControls";
import { AttendanceSheet } from "./AttendanceSheet";
import { AssignmentPanel } from "./AssignmentPanel";
import { VideoPanel } from "./VideoPanel";

/** FR-TCH-03/04: class management — live session, roster, attendance, assignments, videos. */
export default async function ClassManagePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireTeacher();
  const { id } = await params;
  const cs = await db.classSession.findUnique({
    where: { id: Number(id) },
    include: {
      teacher: true,
      course: true,
      enrollments: {
        where: { status: "ACTIVE" },
        include: { student: { include: { studentProfile: true } } },
        orderBy: { id: "asc" },
      },
      assignments: {
        include: { submissions: { include: { student: { include: { studentProfile: true } } } } },
        orderBy: { createdAt: "desc" },
      },
      videos: { orderBy: { recordedAt: "desc" } },
    },
  });
  if (!cs || cs.teacher?.userId !== session.userId) notFound();

  const today = new Date().toISOString().slice(0, 10);
  const todayAtt = await db.attendance.findMany({
    where: { classSessionId: cs.id, date: new Date(today + "T00:00:00Z") },
  });

  return (
    <div className="space-y-8 max-w-4xl">
      <section className="bg-white rounded-3xl border border-line p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-navy">{cs.title}</h1>
            <p className="text-sm text-ink-soft mt-1">
              {cs.dayOfWeek} · {cs.startTime}{cs.endTime ? `–${cs.endTime}` : ""} · {cs.enrollments.length} students
            </p>
          </div>
          <LiveControls classSessionId={cs.id} isLive={cs.isLive} zoomLink={cs.zoomLink} />
        </div>
      </section>

      <AttendanceSheet
        classSessionId={cs.id}
        date={today}
        students={cs.enrollments.map((e) => ({
          userId: e.student.id,
          name: e.student.name,
          studentId: e.student.studentProfile?.studentId ?? "",
          current: todayAtt.find((a) => a.studentUserId === e.student.id)?.status ?? "",
        }))}
      />

      <AssignmentPanel
        classSessionId={cs.id}
        assignments={cs.assignments.map((a) => ({
          id: a.id,
          title: a.title,
          dueDate: a.dueDate?.toISOString().slice(0, 10) ?? null,
          submissions: a.submissions.map((s) => ({
            id: s.id,
            studentName: s.student.name,
            studentCode: s.student.studentProfile?.studentId ?? "",
            text: s.text,
            fileUrl: s.fileUrl,
            grade: s.grade,
            feedback: s.feedback,
            submittedAt: s.submittedAt.toISOString().slice(0, 16).replace("T", " "),
          })),
        }))}
        enrolledCount={cs.enrollments.length}
      />

      <VideoPanel
        classSessionId={cs.id}
        videos={cs.videos.map((v) => ({
          id: v.id,
          title: v.title,
          url: v.videoUrl,
          date: v.recordedAt.toISOString().slice(0, 10),
        }))}
      />
    </div>
  );
}
