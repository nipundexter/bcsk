import Link from "next/link";
import { getDict } from "@/lib/i18n";
import { cms, site, getSettings } from "@/services";
import { formatDate, isoAttr } from "@/lib/dates";
import { CLASS_LEVELS } from "@/lib/constants";

export default async function HomePage() {
  const { lang, t } = await getDict();
  // A missing CMS page must not take the homepage down, so each is caught individually.
  const [
    hero,
    welcome,
    stats,
    allCourses,
    allTeachers,
    news,
    whyBcsk,
    missionVision,
    educationManagement,
    chairmanMsg,
    principalMsg,
    campusStatus,
  ] = await Promise.all([
    cms.page("home-hero", lang).catch(() => null),
    cms.page("about-us", lang).catch(() => null),
    getSettings(["stat_total_students", "stat_total_classes", "stat_special_courses", "stat_teachers_staff"]),
    site.specialCourses(),
    cms.teachers(),
    cms.news(3),
    cms.page("why-bcsk", lang).catch(() => null),
    cms.page("mission-vision", lang).catch(() => null),
    cms.page("education-management", lang).catch(() => null),
    cms.page("message-chairman", lang).catch(() => null),
    cms.page("message-principal", lang).catch(() => null),
    site.campusStatus().catch(() => null),
  ]);
  const specialCourses = allCourses.slice(0, 6);
  const teachers = allTeachers.slice(0, 4);
  // Real, attributed excerpts only — chairman and principal have full published messages to
  // pull from. No quote is invented for a role (ambassador, guardian, community leader) that
  // has no real content behind it yet.
  const voices = [
    chairmanMsg,
    principalMsg,
  ].filter((v): v is NonNullable<typeof v> => Boolean(v));

  const statCards = [
    { label: t.home.stats_students, value: stats.stat_total_students ?? "30", color: "bg-sunrise" },
    { label: t.home.stats_classes, value: stats.stat_total_classes ?? "6", color: "bg-sky" },
    { label: t.home.stats_special, value: stats.stat_special_courses ?? "6", color: "bg-teal" },
    { label: t.home.stats_teachers, value: stats.stat_teachers_staff ?? "9", color: "bg-navy" },
  ];

  return (
    <>
      {/* ---------------- HERO (FR-HOME-03) ---------------- */}
      <section className="relative mx-auto max-w-7xl px-4 pt-6">
        {/* decorative quarter circle, screenshot motif */}
        <div className="absolute -left-2 top-40 w-16 h-8 bg-sunrise rounded-b-full hidden xl:block" aria-hidden />
        <div className="absolute right-6 -top-2 w-20 h-20 border-[6px] border-sky-soft rounded-full hidden xl:block" aria-hidden />

        <div className="relative bg-cream rounded-3xl overflow-hidden">
          <div className="absolute right-8 bottom-8 w-40 h-40 dot-grid opacity-60 hidden md:block" aria-hidden />
          <div className="grid lg:grid-cols-2 gap-8 items-center px-6 sm:px-12 py-12 lg:py-16">
            <div className="relative z-10">
              <p className="inline-block bg-sky-soft text-navy text-xs font-extrabold tracking-wide uppercase rounded-full px-3 py-1.5 mb-5">
                {t.home.firstSchool}
              </p>
              <h1 className="font-display text-4xl sm:text-5xl xl:text-[3.4rem] leading-[1.12] font-semibold text-ink">
                {hero?.title ?? "Kids are the best explorers in the world!"}
              </h1>
              <div
                className="mt-5 text-ink-soft text-[15px] leading-relaxed max-w-md [&_strong]:text-navy"
                dangerouslySetInnerHTML={{ __html: hero?.html ?? "" }}
              />
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/apply"
                  className="bg-sunrise hover:bg-sunrise-deep text-white font-bold rounded-lg px-6 py-3 text-sm transition-colors shadow-sm"
                >
                  {t.home.getStarted}
                </Link>
                <Link
                  href="/bcsk/about-us"
                  className="bg-navy hover:bg-navy-deep text-white font-bold rounded-lg px-6 py-3 text-sm transition-colors inline-flex items-center gap-2"
                >
                  {t.home.watchVideo}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M8 5v14l11-7L8 5Z" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* signature visual: one child, three language worlds */}
            <div className="relative h-72 sm:h-80 lg:h-[380px] select-none" aria-hidden>
              {/* Bangla bubble */}
              <div className="bubble-float absolute left-[6%] top-[8%]">
                <div className="relative bg-teal text-white rounded-[2rem] rounded-bl-md w-28 h-24 sm:w-32 sm:h-28 flex items-center justify-center shadow-md">
                  <span lang="bn" className="text-4xl sm:text-5xl font-bold">অ আ</span>
                  <div className="absolute -bottom-3 left-5 w-0 h-0 border-l-[14px] border-l-transparent border-t-[16px] border-t-teal" />
                </div>
              </div>
              {/* English bubble */}
              <div className="bubble-float-slow absolute left-[38%] top-[2%]">
                <div className="relative bg-sunrise text-white rounded-[2.4rem] rounded-br-md w-32 h-28 sm:w-40 sm:h-32 flex items-center justify-center shadow-md">
                  <span className="text-4xl sm:text-5xl font-display font-bold">ABC</span>
                  <div className="absolute -bottom-3 right-6 w-0 h-0 border-r-[14px] border-r-transparent border-t-[16px] border-t-sunrise" />
                </div>
              </div>
              {/* Korean bubble */}
              <div className="bubble-float-slower absolute right-[4%] top-[26%]">
                <div className="relative bg-sky text-white rounded-[2rem] rounded-bl-md w-28 h-24 sm:w-32 sm:h-26 flex items-center justify-center shadow-md">
                  <span lang="ko" className="text-4xl sm:text-[2.6rem] font-bold">한글</span>
                  <div className="absolute -bottom-3 left-6 w-0 h-0 border-l-[14px] border-l-transparent border-t-[16px] border-t-sky" />
                </div>
              </div>
              {/* the child beneath the bubbles: open book */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-2 sm:bottom-4">
                <svg width="220" height="130" viewBox="0 0 220 130" fill="none" aria-hidden>
                  {/* ground shadow */}
                  <ellipse cx="110" cy="122" rx="85" ry="8" fill="#F6ECD6" />
                  {/* open book */}
                  <path d="M110 45c-14-12-38-16-60-10v62c22-6 46-2 60 10 14-12 38-16 60-10V35c-22-6-46-2-60 10Z" fill="#fff" stroke="#1D2B64" strokeWidth="4" strokeLinejoin="round" />
                  <path d="M110 45v62" stroke="#1D2B64" strokeWidth="4" />
                  <path d="M62 52c14-3 28-1 38 5M62 66c14-3 28-1 38 5M62 80c14-3 28-1 38 5M158 52c-14-3-28-1-38 5M158 66c-14-3-28-1-38 5M158 80c-14-3-28-1-38 5" stroke="#38A8DC" strokeWidth="3.5" strokeLinecap="round" />
                  {/* stars rising from the book */}
                  <path d="m40 30 2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5 2.5-6Z" fill="#F5820B" />
                  <path d="m184 22 2 4.8 4.8 2-4.8 2-2 4.8-2-4.8-4.8-2 4.8-2 2-4.8Z" fill="#0FB5A6" />
                  <circle cx="170" cy="52" r="4" fill="#38A8DC" />
                  <circle cx="52" cy="14" r="3" fill="#1D2B64" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- CAMPUS RIGHT NOW ---------------- */}
      {campusStatus && (
        <section className="mx-auto max-w-7xl px-4 mt-10">
          <h2 className="text-xs font-extrabold uppercase tracking-wide text-ink-soft mb-3">
            {t.home.campusStatus}
          </h2>
          <div className="bg-white border border-line rounded-2xl px-6 py-5 flex flex-wrap items-center gap-5">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide ${
                campusStatus.open ? "bg-teal/10 text-teal" : "bg-cream text-ink-soft"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${campusStatus.open ? "bg-teal animate-pulse" : "bg-ink-soft/40"}`}
                aria-hidden
              />
              {campusStatus.open ? t.common.live : t.home.campusClosedMsg}
            </span>

            {campusStatus.open ? (
              <div className="flex flex-wrap gap-2">
                {campusStatus.sessions.map((s) => (
                  <span
                    key={s.id}
                    className="text-xs font-bold text-navy bg-sky-soft rounded-full px-3 py-1.5"
                    title={s.teacherName ?? undefined}
                  >
                    {s.title} · {s.students} {t.common.enrolled.toLowerCase()}
                  </span>
                ))}
              </div>
            ) : null}

            <Link
              href="/academic/class-schedule"
              className="ml-auto text-sky text-xs font-bold hover:underline underline-offset-4 whitespace-nowrap"
            >
              {t.home.viewFullSchedule} →
            </Link>
          </div>
        </section>
      )}

      {/* ---------------- THREE PILLARS ---------------- */}
      <section className="mx-auto max-w-7xl px-4 mt-16 grid sm:grid-cols-3 gap-8">
        {[
          { title: t.home.pillars_active, text: t.home.pillars_active_text, color: "bg-sunrise" },
          { title: t.home.pillars_happy, text: t.home.pillars_happy_text, color: "bg-sky" },
          { title: t.home.pillars_enrich, text: t.home.pillars_enrich_text, color: "bg-teal" },
        ].map((p) => (
          <div key={p.title} className="flex flex-col">
            <div className="flex items-center gap-3">
              <span className={`w-9 h-9 rounded-full ${p.color} shrink-0`} aria-hidden />
              <h2 className="font-display text-xl font-semibold text-ink leading-snug">{p.title}</h2>
            </div>
            <p className="mt-3 text-sm text-ink-soft leading-relaxed">{p.text}</p>
          </div>
        ))}
      </section>

      {/* ---------------- WELCOME (FR-HOME-03) ---------------- */}
      <section className="mx-auto max-w-7xl px-4 mt-20 grid lg:grid-cols-2 gap-10 items-center">
        <div className="relative">
          <div className="absolute -left-6 -top-6 w-28 h-28 dot-grid" aria-hidden />
          <h2 className="relative font-display text-3xl font-semibold text-ink">{t.home.welcome}</h2>
          <div
            className="relative mt-4 text-ink-soft text-[15px] leading-relaxed prose-bcsk [&_h2]:hidden [&_h3]:hidden [&_ul]:hidden line-clamp-[8]"
            dangerouslySetInnerHTML={{ __html: welcome?.html ?? "" }}
          />
          <Link href="/bcsk/about-us" className="inline-block mt-5 text-sky font-bold text-sm hover:underline underline-offset-4">
            {t.common.readMore} →
          </Link>
        </div>
        {/* stats counters (FR-HOME-04) */}
        <div className="grid grid-cols-2 gap-4">
          {statCards.map((s) => (
            <div key={s.label} className="bg-cream rounded-2xl p-6 text-center">
              <span className={`inline-block w-3 h-3 rounded-full ${s.color} mb-3`} aria-hidden />
              <p className="font-display text-4xl font-semibold text-navy">{s.value}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-ink-soft">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- SCHOOL OVERVIEW ---------------- */}
      {(whyBcsk || missionVision || educationManagement) && (
        <section id="school-overview" className="mx-auto max-w-7xl px-4 mt-20 scroll-mt-24">
          <h2 className="font-display text-3xl font-semibold text-ink mb-8">{t.home.overview}</h2>
          <div className="grid lg:grid-cols-3 gap-5">
            {whyBcsk && (
              <div className="bg-white border border-line rounded-2xl p-6">
                <h3 className="font-display text-lg font-semibold text-navy">{t.home.whyBcsk}</h3>
                <div
                  className="mt-3 prose-bcsk text-[14px] text-ink-soft leading-relaxed [&_ul]:space-y-2 [&_ul]:pl-4"
                  dangerouslySetInnerHTML={{ __html: whyBcsk.html }}
                />
              </div>
            )}
            {missionVision && (
              <div className="bg-white border border-line rounded-2xl p-6">
                <h3 className="font-display text-lg font-semibold text-navy">{t.home.missionVision}</h3>
                <div
                  className="mt-3 prose-bcsk text-[14px] text-ink-soft leading-relaxed [&_h2]:text-sm [&_h2]:font-extrabold [&_h2]:text-sunrise [&_h2]:uppercase [&_h2]:tracking-wide [&_h2]:mt-4 [&_h2]:first:mt-0"
                  dangerouslySetInnerHTML={{ __html: missionVision.html }}
                />
              </div>
            )}
            {educationManagement && (
              <div className="bg-white border border-line rounded-2xl p-6">
                <h3 className="font-display text-lg font-semibold text-navy">{t.home.educationManagement}</h3>
                <div
                  className="mt-3 prose-bcsk text-[14px] text-ink-soft leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: educationManagement.html }}
                />
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-bold">
                  <Link href="/bcsk/teachers" className="text-sky hover:underline underline-offset-4">
                    {t.home.viewTeachers} →
                  </Link>
                  <Link href="/academic/class-schedule" className="text-sky hover:underline underline-offset-4">
                    {t.home.viewSchedule} →
                  </Link>
                  <Link href="/admission/tuition-fee" className="text-sky hover:underline underline-offset-4">
                    {t.home.tuitionFeesLink} →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ---------------- REGULAR CLASSES QUICK BAR (FR-HOME-05) ---------------- */}
      <section className="mx-auto max-w-7xl px-4 mt-20">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="font-display text-3xl font-semibold text-ink">{t.home.regularClasses}</h2>
          <Link href="/admission/regular-course" className="text-sky text-sm font-bold hover:underline underline-offset-4">
            {t.home.viewAll} →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {CLASS_LEVELS.map((c, i) => (
            <Link
              key={c.key}
              href={`/admission/regular-course#${c.key.toLowerCase()}`}
              className={`rounded-xl px-4 py-5 text-center font-bold text-sm transition-transform hover:-translate-y-1 ${
                ["bg-cream text-navy", "bg-sky-soft text-navy", "bg-cream-deep text-navy"][i % 3]
              }`}
            >
              {c.label}
            </Link>
          ))}
        </div>
      </section>

      {/* ---------------- SPECIAL COURSES ---------------- */}
      <section className="bg-cream mt-20 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="font-display text-3xl font-semibold text-ink">{t.home.ourCourses}</h2>
            <Link href="/admission/special-course" className="text-sky text-sm font-bold hover:underline underline-offset-4">
              {t.home.viewAll} →
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {specialCourses.map((c) => {
              const href = ["deen", "ielts-for-kids", "abacus"].includes(c.slug)
                ? `/courses/${c.slug}`
                : "/admission/special-course";
              return (
                <Link
                  key={c.id}
                  href={href}
                  className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <h3 className="font-display text-lg font-semibold text-navy group-hover:text-sky transition-colors">
                    {c.name}
                  </h3>
                  <p className="mt-2 text-sm text-ink-soft leading-relaxed line-clamp-3">{c.description}</p>
                  <span className="inline-block mt-4 text-sunrise font-bold text-xs uppercase tracking-wide">
                    {t.common.readMore} →
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------------- TEACHERS ---------------- */}
      <section className="mx-auto max-w-7xl px-4 mt-20">
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="font-display text-3xl font-semibold text-ink">{t.home.ourTeachers}</h2>
          <Link href="/bcsk/teachers" className="text-sky text-sm font-bold hover:underline underline-offset-4">
            {t.home.viewAll} →
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {teachers.map((tp, i) => (
            <div key={tp.teacherId} className="text-center">
              <div
                className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center text-2xl font-display font-semibold text-white ${
                  ["bg-navy", "bg-sky", "bg-teal", "bg-sunrise"][i % 4]
                }`}
                aria-hidden
              >
                {tp.name.split(" ").slice(-2).map((w) => w[0]).join("")}
              </div>
              <h3 className="mt-3 font-bold text-sm text-ink">{tp.name}</h3>
              <p className="text-xs text-ink-soft mt-0.5">{tp.designation}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- NEWS ---------------- */}
      <section className="mx-auto max-w-7xl px-4 mt-20">
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="font-display text-3xl font-semibold text-ink">{t.home.latestNews}</h2>
          <Link href="/events/news" className="text-sky text-sm font-bold hover:underline underline-offset-4">
            {t.home.viewAll} →
          </Link>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          {news.map((n) => (
            <Link key={n.id} href={`/events/news/${n.id}`} className="group bg-white border border-line rounded-2xl p-6 hover:shadow-md transition-shadow">
              <p className="text-xs font-bold uppercase tracking-wide text-sunrise">{n.type}</p>
              <h3 className="mt-2 font-display text-lg font-semibold text-navy group-hover:text-sky transition-colors leading-snug">
                {n.title}
              </h3>
              <p className="mt-2 text-sm text-ink-soft line-clamp-3">{n.body}</p>
              <time className="block mt-3 text-xs text-ink-soft" dateTime={isoAttr(n.date)}>
                {formatDate(n.date, lang)}
              </time>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------------- VOICES FROM BCSK ---------------- */}
      {voices.length > 0 && (
        <section className="bg-cream mt-20 py-16">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="font-display text-3xl font-semibold text-ink mb-8">{t.home.voices}</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {voices.map((v) => (
                <div key={v.slug} className="relative bg-white rounded-2xl p-7 shadow-sm">
                  <span className="absolute top-5 right-6 font-display text-5xl text-sky-soft select-none" aria-hidden>
                    “
                  </span>
                  <div
                    className="relative prose-bcsk text-sm text-ink-soft leading-relaxed line-clamp-6 [&_strong]:text-navy"
                    dangerouslySetInnerHTML={{ __html: v.html }}
                  />
                  <Link
                    href={`/bcsk/${v.slug}`}
                    className="relative inline-block mt-4 text-sky font-bold text-xs uppercase tracking-wide hover:underline underline-offset-4"
                  >
                    {t.common.readFullMessage} →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------------- CTA BAND ---------------- */}
      <section className="mx-auto max-w-7xl px-4 mt-20">
        <div className="relative bg-navy rounded-3xl px-6 sm:px-12 py-12 text-center overflow-hidden">
          <div className="absolute left-8 top-6 w-24 h-24 rounded-full bg-sky/20" aria-hidden />
          <div className="absolute right-10 bottom-4 w-16 h-16 rounded-full bg-sunrise/30" aria-hidden />
          <h2 className="relative font-display text-3xl sm:text-4xl font-semibold text-white">
            {lang === "bn" ? "আজই আপনার সন্তানের যাত্রা শুরু করুন" : lang === "ko" ? "오늘 자녀의 여정을 시작하세요" : "Start your child's journey today"}
          </h2>
          <p className="relative mt-3 text-white/70 text-sm max-w-xl mx-auto">
            {lang === "bn"
              ? "নিয়মিত ক্লাস অথবা বিশেষ কোর্স — অনলাইনে আবেদন করুন মাত্র কয়েক মিনিটে।"
              : lang === "ko"
              ? "정규 수업 또는 특별 과정 — 몇 분 만에 온라인으로 지원하세요."
              : "Regular classes or special courses — apply online in just a few minutes."}
          </p>
          <Link
            href="/apply"
            className="relative inline-block mt-7 bg-sunrise hover:bg-sunrise-deep text-white font-bold rounded-lg px-8 py-3.5 text-sm transition-colors"
          >
            {t.nav.applyNow}
          </Link>
        </div>
      </section>
    </>
  );
}
