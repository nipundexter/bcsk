import Link from "next/link";
import { requireStudent } from "@/lib/auth";
import { db } from "@/lib/db";
import { SEMESTER_CURRENT, classLevelLabel } from "@/lib/constants";

/** FR-STU-02..06: student profile dashboard, class tiles with live status, reminders, quick links. */
export default async function StudentDashboard() {
  const session = await requireStudent();
  const [profile, enrollments, reminders] = await Promise.all([
    db.studentProfile.findUnique({ where: { userId: session.userId } }),
    db.enrollment.findMany({
      where: { studentUserId: session.userId, semester: SEMESTER_CURRENT, status: "ACTIVE" },
      include: { classSession: { include: { course: true, teacher: { include: { user: true } }, level: true } } },
      orderBy: { id: "asc" },
    }),
    db.notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  const quick = [
    { href: "/classroom/documents", label: "Enrollment Certificate", icon: "📜" },
    { href: "/classroom/documents", label: "Digital ID Card", icon: "🪪" },
    { href: "/classroom/syllabus", label: "Syllabus", icon: "📘" },
    { href: "/classroom/routine", label: "Class Routine", icon: "🗓️" },
    { href: "/classroom/results", label: "Progress Report & Results", icon: "📈" },
    { href: "/classroom/assignments", label: "Assignment & Homework", icon: "✏️" },
    { href: "/classroom/videos", label: "Class Videos", icon: "🎬" },
    { href: "/classroom/attendance", label: "Attendance Report", icon: "✅" },
    { href: "/classroom/payments", label: "Payment Report", icon: "🧾" },
    { href: "/classroom/re-admission", label: "Re-Admission", icon: "🔄" },
  ];

  return (
    <div className="space-y-8">
      {/* profile header (FR-STU-02) */}
      <section className="bg-white rounded-3xl border border-line p-6 sm:p-8 flex flex-wrap items-center gap-6">
        {profile?.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/api/files/${profile.photoUrl}`} alt="" className="w-20 h-20 rounded-full object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-sky flex items-center justify-center text-3xl font-display font-semibold text-white">
            {session.name[0]}
          </div>
        )}
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy">{session.name}</h1>
          <p className="text-sm text-ink-soft mt-1">
            <span className="font-bold text-ink">{profile?.studentId}</span>
            {" · "}
            {profile ? classLevelLabel(profile.classLevel) : ""}
            {" · Semester "}
            {SEMESTER_CURRENT}
          </p>
        </div>
        <div className="ml-auto hidden sm:block text-right text-xs text-ink-soft">
          <p className="font-bold text-navy">Bangladesh Community School, Korea</p>
          <p>Classroom Portal</p>
        </div>
      </section>

      <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
        {/* class tiles (FR-STU-03/04) */}
        <section>
          <h2 className="font-display text-xl font-semibold text-ink mb-4">My Classes</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {enrollments.map((e) => {
              const cs = e.classSession;
              return (
                <div key={e.id} className="bg-white rounded-2xl border border-line p-5 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-navy leading-snug">{cs.title}</h3>
                    {cs.isLive ? (
                      <span className="shrink-0 inline-flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-extrabold rounded-full px-2.5 py-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" aria-hidden />
                        LIVE
                      </span>
                    ) : (
                      <span className="shrink-0 text-[10px] font-bold text-ink-soft bg-cream rounded-full px-2.5 py-1">
                        {cs.dayOfWeek}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-ink-soft">
                    {cs.dayOfWeek} · {cs.startTime}
                    {cs.endTime ? `–${cs.endTime}` : ""}
                    {cs.teacher ? ` · ${cs.teacher.user.name}` : ""}
                  </p>
                  {cs.notice && <p className="mt-2 text-xs bg-cream rounded-lg p-2.5 text-ink">{cs.notice}</p>}
                  <div className="mt-auto pt-4">
                    {cs.isLive && cs.zoomLink ? (
                      <a
                        href={cs.zoomLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-sunrise hover:bg-sunrise-deep text-white text-xs font-bold rounded-lg px-4 py-2 transition-colors"
                      >
                        Join Zoom class
                      </a>
                    ) : (
                      <span className="text-xs text-ink-soft">Join link appears here when class is live</span>
                    )}
                  </div>
                </div>
              );
            })}
            {enrollments.length === 0 && (
              <p className="text-sm text-ink-soft bg-white rounded-2xl border border-line p-6 sm:col-span-2">
                No active enrollments this semester. Use <Link className="text-sky font-bold" href="/classroom/re-admission">Re-Admission</Link> to enroll.
              </p>
            )}
          </div>

          {/* quick links (FR-STU-05) */}
          <h2 className="font-display text-xl font-semibold text-ink mt-8 mb-4">Student Services</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {quick.map((q) => (
              <Link
                key={q.label}
                href={q.href}
                className="bg-white rounded-2xl border border-line p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <span className="text-2xl" aria-hidden>{q.icon}</span>
                <span className="block mt-2 text-xs font-bold text-navy leading-snug">{q.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* reminders (FR-STU-06) */}
        <aside className="bg-white rounded-2xl border border-line p-5">
          <h2 className="font-display text-lg font-semibold text-navy">Reminders</h2>
          <ul className="mt-3 space-y-3">
            {reminders.length === 0 && <li className="text-sm text-ink-soft">No reminders right now.</li>}
            {reminders.map((r) => (
              <li key={r.id} className="border-l-2 border-sunrise pl-3">
                <p className="text-sm font-bold text-ink leading-snug">{r.title}</p>
                {r.body && <p className="text-xs text-ink-soft mt-0.5">{r.body}</p>}
                <time className="text-[10px] text-ink-soft">{r.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</time>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
