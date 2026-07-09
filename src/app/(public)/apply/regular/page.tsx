import { getDict } from "@/lib/i18n";
import { PageShell } from "@/components/site/PageShell";
import { RegularForm } from "./RegularForm";

export default async function RegularApplyPage() {
  const { t } = await getDict();
  return (
    <PageShell title={`${t.nav.regularCourse} — Application`} eyebrow={t.nav.applyNow}>
      <div className="max-w-2xl bg-white border border-line rounded-3xl p-6 sm:p-8">
        <RegularForm />
      </div>
    </PageShell>
  );
}
