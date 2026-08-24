import { Logo } from "@/components/Logo";
import { getDict } from "@/lib/i18n";
import { MainNav, type NavItem } from "./MainNav";

/** FR-HOME-02: primary navigation — Home, BCSK, Admission, Academic, Student Lounge, Events & News, Contact. */
export async function Header() {
  const { t } = await getDict();

  const items: NavItem[] = [
    { label: t.nav.home, href: "/" },
    {
      label: t.nav.bcsk,
      children: [
        { label: t.nav.aboutUs, href: "/bcsk/about-us" },
        { label: t.nav.educationProcess, href: "/bcsk/education-process" },
        { label: t.nav.administration, href: "/bcsk/administration" },
        { label: t.nav.teachers, href: "/bcsk/teachers" },
        { label: t.nav.governingBody, href: "/bcsk/governing-body" },
        { label: t.nav.regionalReps, href: "/bcsk/regional-representatives" },
      ],
    },
    {
      label: t.nav.admission,
      children: [
        { label: t.nav.admissionProcess, href: "/admission/process" },
        { label: t.nav.regularCourse, href: "/admission/regular-course" },
        { label: t.nav.specialCourse, href: "/admission/special-course" },
        { label: t.nav.quranDepartment, href: "/admission/quran-department" },
        { label: t.nav.reAdmission, href: "/admission/re-admission" },
        { label: t.nav.tuitionFee, href: "/admission/tuition-fee" },
        { label: t.nav.brochure, href: "/admission/brochure" },
      ],
    },
    {
      label: t.nav.academic,
      children: [
        { label: t.nav.bookList, href: "/academic/book-list" },
        { label: t.nav.curriculum, href: "/academic/curriculum" },
        { label: t.nav.syllabus, href: "/academic/syllabus" },
        { label: t.nav.academicCalendar, href: "/academic/calendar" },
        { label: t.nav.classSchedule, href: "/academic/class-schedule" },
        { label: t.nav.deen, href: "/courses/deen" },
        { label: t.nav.ielts, href: "/courses/ielts-for-kids" },
        { label: t.nav.abacus, href: "/courses/abacus" },
      ],
    },
    {
      label: t.nav.studentLounge,
      children: [
        { label: t.auth.studentLogin, href: "/classroom" },
        { label: t.nav.studentCorner, href: "/student-corner" },
        { label: t.nav.gallery, href: "/events/gallery" },
        { label: t.nav.reAdmission, href: "/admission/re-admission" },
      ],
    },
    {
      label: t.nav.eventsNews,
      children: [
        { label: t.nav.seminarUpdate, href: "/events/seminars" },
        { label: t.nav.latestNews, href: "/events/news" },
        { label: t.nav.gallery, href: "/events/gallery" },
        { label: t.nav.academicCalendar, href: "/academic/calendar" },
      ],
    },
  ];

  return (
    <header className="bg-white/95 backdrop-blur sticky top-0 z-50 border-b border-line/70">
      <div className="relative mx-auto max-w-7xl px-4 h-[72px] flex items-center justify-between gap-4">
        <Logo />
        <MainNav items={items} contactLabel={t.nav.contact} />
      </div>
    </header>
  );
}
