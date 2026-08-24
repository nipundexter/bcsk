import { requirePermission } from "@/lib/auth";
import { admin } from "@/services";
import { isoAttr } from "@/lib/dates";
import { NewsEditor } from "./NewsEditor";

/** FR-NEWS-01 (admin side): manage news, seminars, and events. */
export default async function AdminNewsPage() {
  await requirePermission("content:manage");
  const items = await admin.news();

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-semibold text-navy mb-6">News & Events</h1>
      <NewsEditor
        items={items.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          // <input type="date"> wants yyyy-mm-dd; the API sends a full ISO timestamp.
          date: (isoAttr(n.date) ?? "").slice(0, 10),
          published: n.published,
        }))}
      />
    </div>
  );
}
