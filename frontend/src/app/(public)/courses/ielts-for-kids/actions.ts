"use server";

import { site } from "@/services";

/** FR-IELTS-04/05: record a practice-quiz result against the student's progress report. */
export async function recordPracticeScore(score: number, total: number) {
  try {
    await site.recordPracticeScore(score, total);
  } catch {
    // A lost practice score must never interrupt the quiz.
  }
}
