import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { FeeRow } from "./FeeRow";

/** FR-ADMIN-05: fee configuration by class/level, BCSK vs non-BCSK. */
export default async function FeesPage() {
  await requirePermission("fees:manage");
  const fees = await db.feeConfig.findMany({ orderBy: { displayOrder: "asc" } });

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl font-semibold text-navy mb-2">Fee Configuration</h1>
      <p className="text-xs text-ink-soft mb-6">
        Amounts in KRW. These drive the public tuition table and every payment amount. Changes apply immediately.
      </p>
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-cream text-navy text-left">
              <th className="px-4 py-3.5 font-bold">Item</th>
              <th className="px-4 py-3.5 font-bold">Admission</th>
              <th className="px-4 py-3.5 font-bold">Semester</th>
              <th className="px-4 py-3.5 font-bold">Book</th>
              <th className="px-4 py-3.5 font-bold">BCSK price</th>
              <th className="px-4 py-3.5 font-bold">Non-BCSK</th>
              <th className="px-4 py-3.5 font-bold">Active</th>
              <th className="px-4 py-3.5"></th>
            </tr>
          </thead>
          <tbody>
            {fees.map((f) => (
              <FeeRow
                key={f.id}
                fee={{
                  id: f.id,
                  label: f.label,
                  kind: f.kind,
                  admissionFee: f.admissionFee,
                  semesterFee: f.semesterFee,
                  bookFee: f.bookFee,
                  bcskPrice: f.bcskPrice,
                  nonBcskPrice: f.nonBcskPrice,
                  active: f.active,
                }}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
