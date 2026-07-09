import Link from "next/link";
import { requireTeacher } from "@/lib/auth";
import { db } from "@/lib/db";
import { SEMESTER_CURRENT, classLevelLabel } from "@/lib/constants";

/** FR-TCH-02/05: teacher profile, assigned classes grid, notifications panel. */
export default async function TeacherDashboard() {
  const session = await requireTeacher();
  const [profile, sessions, notifications, openQuestions] = await Promise.all([
    db.teacherProfile.findUnique({ where: { userId: session.userId } }),
    db.classSession.findMany({
      where: { teacher: { userId: session.userId }, semester: SEMESTER_CURRENT, active: true },
      include: { _count: { select: { enrollments: { where: { status: "ACTIVE" } } } } },
      orderBy: { id: "asc" },
    }),
    db.notification.findMany({ where: { userId: session.userId }, orderBy: { createdAt: "desc" }, take: 8 }),
    db.question.count({ where: { teacherUserId: session.userId, answer: null } }),
  ]);

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-3xl border border-line p-6 sm:p-8 flex flex-wrap items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-navy flex items-center justify-center text-3xl font-display font-semibold text-white">
          {session.name.split(" ").slice(-1)[0][0]}
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy">{session.name}</h1>
          <p className="text-sm text-ink-soft mt-1">
            <span className="font-bold text-ink">{profile?.teacherId}</span>
            {profile?.designation ? ` · ${profile.designation}` : ""}
            {profile?.guideClass ? ` · Guide teacher: ${classLevelLabel(profile.guideClass)}` : ""}
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="font-display text-3xl font-semibold text-sunrise">{openQuestions}</p>
          <p className="text-xs font-bold text-ink-soft uppercase">Questions waiting</p>
        </div>
      </section>

      <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
        <section>
          <h2 className="font-display text-xl font-semibold text-ink mb-4">My Classes — Semester {SEMESTER_CURRENT}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {sessions.map((s) => (
              <Link
                key={s.id}
                href={`/office/classes/${s.id}`}
                className="group bg-white rounded-2xl border border-line p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-navy group-hover:text-sky transition-colors leading-snug">{s.title}</h3>
                  {s.isLive && (
                    <span className="shrink-0 inline-flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-extrabold rounded-full px-2.5 py-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" aria-hidden />
                      LIVE
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-ink-soft">
                  {s.dayOfWeek} · {s.startTime}{s.endTime ? `–${s.endTime}` : ""} · {s._count.enrollments} students
                </p>
                <span className="inline-block mt-3 text-sunrise text-xs font-bold uppercase tracking-wide">
                  Manage class →
                </span>
              </Link>
            ))}
            {sessions.length === 0 && (
              <p className="bg-white rounded-2xl border border-line p-6 text-sm text-ink-soft sm:col-span-2">
                No classes assigned yet — the admin assigns classes from the Scheduling module.
              </p>
            )}
          </div>
        </section>

        <aside className="bg-white rounded-2xl border border-line p-5">
          <h2 className="font-display text-lg font-semibold text-navy">Notifications</h2>
          <ul className="mt-3 space-y-3">
            {notifications.length === 0 && <li className="text-sm text-ink-soft">Nothing new.</li>}
            {notifications.map((n) => (
              <li key={n.id} className="border-l-2 border-sky pl-3">
                {n.link ? (
                  <Link href={n.link} className="text-sm font-bold text-ink hover:text-sky leading-snug">{n.title}</Link>
                ) : (
                  <p className="text-sm font-bold text-ink leading-snug">{n.title}</p>
                )}
                {n.body && <p className="text-xs text-ink-soft mt-0.5">{n.body}</p>}
                <time className="text-[10px] text-ink-soft">
                  {n.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </time>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
