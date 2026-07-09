import { requireStudent } from "@/lib/auth";
import { db } from "@/lib/db";
import { SEMESTER_CURRENT } from "@/lib/constants";

/** FR-STU-05: class videos for asynchronous review. */
export default async function VideosPage() {
  const session = await requireStudent();
  const enrollments = await db.enrollment.findMany({
    where: { studentUserId: session.userId, semester: SEMESTER_CURRENT, status: "ACTIVE" },
    select: { classSessionId: true },
  });
  const videos = await db.classVideo.findMany({
    where: { classSessionId: { in: enrollments.map((e) => e.classSessionId) } },
    include: { classSession: { select: { title: true } } },
    orderBy: { recordedAt: "desc" },
  });

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-semibold text-navy mb-6">Class Videos</h1>
      <div className="grid sm:grid-cols-2 gap-4">
        {videos.length === 0 && (
          <p className="bg-white rounded-2xl border border-line p-6 text-sm text-ink-soft sm:col-span-2">
            No recordings yet. Your teachers upload class videos here after each lesson.
          </p>
        )}
        {videos.map((v) => (
          <a
            key={v.id}
            href={v.videoUrl.startsWith("http") ? v.videoUrl : `/api/files/${v.videoUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white rounded-2xl border border-line p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-full bg-sunrise/15 text-sunrise flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5v14l11-7L8 5Z" /></svg>
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-sky">{v.classSession.title}</p>
                <h2 className="font-bold text-ink group-hover:text-sky transition-colors leading-snug">{v.title}</h2>
              </div>
            </div>
            <time className="block mt-3 text-xs text-ink-soft">
              {v.recordedAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </time>
          </a>
        ))}
      </div>
    </div>
  );
}
