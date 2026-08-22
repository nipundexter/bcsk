"use server";

import { revalidatePath } from "next/cache";
import { office } from "@/services";

export async function toggleTask(taskId: number, done: boolean) {
  // Ownership is checked server-side; a task id from the client is only a claim.
  await office.toggleTask(taskId, done);
  revalidatePath("/office/tasks");
}
