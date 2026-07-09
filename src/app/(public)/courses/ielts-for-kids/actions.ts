"use server";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

/** FR-IELTS-04/05: record a practice score to the student's progress report. */
export async function recordPracticeScore(score: number, total: number) {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") return;
  await db.progressRecord.create({
    data: {
      studentUserId: session.userId,
      courseSlug: "ielts-for-kids",
      label: "Practice quiz (mixed skills)",
      score: `${score}/${total}`,
    },
  });
}
