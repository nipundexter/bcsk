import { requireTeacher } from "@/lib/auth";
import { db } from "@/lib/db";
import { TaskToggle } from "./TaskToggle";

/** FR-TCH-07: administrative task list assigned by Admin. */
export default async function TeacherTasksPage() {
  const session = await requireTeacher();
  const tasks = await db.teacherTask.findMany({
    where: { teacherUserId: session.userId },
    orderBy: [{ done: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-navy mb-6">Task List</h1>
      <div className="space-y-2.5">
        {tasks.length === 0 && (
          <p className="bg-white rounded-2xl border border-line p-6 text-sm text-ink-soft">
            No tasks assigned. The admin assigns to-dos here.
          </p>
        )}
        {tasks.map((t) => (
          <div key={t.id} className={`bg-white rounded-xl border border-line px-5 py-3.5 flex items-center gap-3 ${t.done ? "opacity-60" : ""}`}>
            <TaskToggle taskId={t.id} done={t.done} />
            <div>
              <p className={`text-sm font-bold ${t.done ? "line-through text-ink-soft" : "text-ink"}`}>{t.title}</p>
              {t.detail && <p className="text-xs text-ink-soft">{t.detail}</p>}
            </div>
            {t.dueDate && (
              <time className="ml-auto text-xs font-bold text-ink-soft">
                {t.dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </time>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
