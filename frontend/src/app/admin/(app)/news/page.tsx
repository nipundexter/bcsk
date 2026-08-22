import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { NewsEditor } from "./NewsEditor";

/** FR-NEWS-01 (admin side): manage news, seminars, and events. */
export default async function AdminNewsPage() {
  await requirePermission("content:manage");
  const items = await db.eventNews.findMany({ orderBy: { date: "desc" } });

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-semibold text-navy mb-6">News & Events</h1>
      <NewsEditor
        items={items.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          date: n.date.toISOString().slice(0, 10),
          published: n.published,
        }))}
      />
    </div>
  );
}
