import { requirePermission } from "@/lib/auth";
import { admin } from "@/services";
import { GoverningEditor } from "./GoverningEditor";

/** FR-ADMIN-11: governing body / regional representatives module. */
export default async function AdminGoverningPage() {
  await requirePermission("content:manage");
  // `/admin/governing` sorts by displayOrder; grouping the two kinds together is a page concern.
  const members = (await admin.members()).sort(
    (a, b) => a.kind.localeCompare(b.kind) || a.displayOrder - b.displayOrder,
  );

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-semibold text-navy mb-6">Governing Body & Regional Representatives</h1>
      <GoverningEditor
        members={members.map((m) => ({
          id: m.id,
          kind: m.kind,
          name: m.name,
          role: m.role,
          organization: m.organization,
          region: m.region,
          phone: m.phone,
          email: m.email,
          bio: m.bio,
          displayOrder: m.displayOrder,
        }))}
      />
    </div>
  );
}
