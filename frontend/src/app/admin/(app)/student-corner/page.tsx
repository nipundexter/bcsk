import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { CornerEditor } from "./CornerEditor";

/** FR-NEWS-03 (admin side): curate student articles, poems, artwork, achievements. */
export default async function AdminStudentCornerPage() {
  await requirePermission("content:manage");
  const posts = await db.studentCornerPost.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-semibold text-navy mb-6">Student Corner</h1>
      <CornerEditor
        posts={posts.map((p) => ({
          id: p.id,
          title: p.title,
          body: p.body,
          studentName: p.studentName,
          kind: p.kind,
          published: p.published,
        }))}
      />
    </div>
  );
}
