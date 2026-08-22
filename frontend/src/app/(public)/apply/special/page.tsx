import { recaptchaSiteKey } from "@/lib/recaptcha";
import { site } from "@/services";
import { getDict } from "@/lib/i18n";
import { PageShell } from "@/components/site/PageShell";
import { SpecialForm } from "./SpecialForm";

export default async function SpecialApplyPage({ searchParams }: { searchParams: Promise<{ course?: string }> }) {
  const siteKey = recaptchaSiteKey();

  const { course } = await searchParams;
  const { t } = await getDict();
  const courses = await site.specialCourses();

  return (
    <PageShell title={`${t.nav.specialCourse} — Application`} eyebrow={t.nav.applyNow}>
      <div className="max-w-2xl bg-white border border-line rounded-3xl p-6 sm:p-8">
        <SpecialForm
          recaptchaSiteKey={siteKey}
          courses={courses.map((c) => ({ value: c.slug, label: c.name }))}
          preselect={course}
        />
      </div>
    </PageShell>
  );
}
