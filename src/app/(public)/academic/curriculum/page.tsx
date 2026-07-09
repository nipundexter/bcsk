import { db } from "@/lib/db";
import { getDict } from "@/lib/i18n";
import { PageShell } from "@/components/site/PageShell";
import { CLASS_LEVELS } from "@/lib/constants";
import { CurriculumFilter } from "./CurriculumFilter";

/** FR-ACAD-02: NCTB-aligned subject list per class as structured, filterable content. */
export default async function CurriculumPage() {
  const { t } = await getDict();
  const entries = await db.curriculumEntry.findMany({ orderBy: [{ classLevel: "asc" }, { displayOrder: "asc" }] });

  const byClass = CLASS_LEVELS.map((c) => ({
    key: c.key,
    label: c.label,
    subjects: entries.filter((e) => e.classLevel === c.key),
  }));

  return (
    <PageShell title={t.nav.curriculum} eyebrow={t.nav.academic}>
      <div className="max-w-4xl">
        <p className="text-sm text-ink-soft mb-6 max-w-2xl">
          BCSK follows the updated <strong className="text-navy">NCTB (National Curriculum and Textbook Board)</strong>{" "}
          curriculum of Bangladesh, with Global English Teaching across speaking, reading, writing, and listening.
          Religious Studies is offered in Islamic and Hindu tracks.
        </p>
        <CurriculumFilter classes={byClass} />
      </div>
    </PageShell>
  );
}
