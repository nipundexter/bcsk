import { notFound } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { office, ApiError } from "@/services";
import { LiveControls } from "./LiveControls";
import { AttendanceSheet } from "./AttendanceSheet";
import { AssignmentPanel } from "./AssignmentPanel";
import { VideoPanel } from "./VideoPanel";

/** FR-TCH-03/04: class management — live session, roster, attendance, assignments, videos. */
export default async function ClassManagePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireTeacher();
  const { id } = await params;
  // Ownership is enforced by the backend — it returns 403 for someone else's class, so a
  // guessed id cannot leak a roster.
  let detail: Awaited<ReturnType<typeof office.classDetail>>;
  try {
    detail = await office.classDetail(Number(id));
  } catch (e) {
    if (e instanceof ApiError && [403, 404].includes(e.status)) notFound();
    throw e;
  }
  const cs = detail.classSession;
  const { roster, assignments, videos, todayAttendance: todayAtt } = detail;

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-8 max-w-4xl">
      <section className="bg-white rounded-3xl border border-line p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-navy">{cs.title}</h1>
            <p className="text-sm text-ink-soft mt-1">
              {cs.dayOfWeek} · {cs.startTime}{cs.endTime ? `–${cs.endTime}` : ""} · {roster.length} students
            </p>
          </div>
          <LiveControls classSessionId={cs.id} isLive={cs.isLive} zoomLink={cs.zoomLink} />
        </div>
      </section>

      <AttendanceSheet
        classSessionId={cs.id}
        date={today}
        students={roster.map((e) => ({
          userId: e.student.id,
          name: e.student.name,
          studentId: e.student.studentProfile?.studentId ?? "",
          current: todayAtt.find((a) => a.studentUserId === e.student.id)?.status ?? "",
        }))}
      />

      <AssignmentPanel
        classSessionId={cs.id}
        assignments={assignments.map((a) => ({
          id: a.id,
          title: a.title,
          dueDate: a.dueDate ? a.dueDate.slice(0, 10) : null,
          submissions: a.submissions.map((s) => ({
            id: s.id,
            studentName: s.student.name,
            studentCode: s.student.studentProfile?.studentId ?? "",
            text: s.text,
            fileUrl: s.fileUrl,
            grade: s.grade,
            feedback: s.feedback,
            submittedAt: s.submittedAt.slice(0, 16).replace("T", " "),
          })),
        }))}
        enrolledCount={roster.length}
      />

      <VideoPanel
        classSessionId={cs.id}
        videos={videos.map((v) => ({
          id: v.id,
          title: v.title,
          url: v.videoUrl,
          date: String(v.recordedAt).slice(0, 10),
        }))}
      />
    </div>
  );
}
