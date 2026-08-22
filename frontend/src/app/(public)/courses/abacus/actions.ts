"use server";

import { site } from "@/services";

/** FR-ABC-08: record a Fun Abacus score. The backend ignores it for anonymous visitors. */
export async function recordGameScore(game: string, level: number, score: number) {
  try {
    await site.recordGameScore(game, level, score);
  } catch {
    // A lost game score must never interrupt play.
  }
}
