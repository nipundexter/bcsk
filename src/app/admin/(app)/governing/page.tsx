import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { GoverningEditor } from "./GoverningEditor";

/** FR-ADMIN-11: governing body / regional representatives module. */
export default async function AdminGoverningPage() {
  await requireAdmin();
  const members = await db.governingMember.findMany({ orderBy: [{ kind: "asc" }, { displayOrder: "asc" }] });

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
