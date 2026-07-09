"use server";

import { revalidatePath } from "next/cache";
import { requireTeacher } from "@/lib/auth";
import { db } from "@/lib/db";

export async function toggleTask(taskId: number, done: boolean) {
  const session = await requireTeacher();
  const task = await db.teacherTask.findUnique({ where: { id: taskId } });
  if (!task || task.teacherUserId !== session.userId) return;
  await db.teacherTask.update({ where: { id: taskId }, data: { done } });
  revalidatePath("/office/tasks");
}
