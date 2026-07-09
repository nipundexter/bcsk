"use server";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

/** FR-ABC-08: record Fun Abacus game scores for the Progress Report. */
export async function recordGameScore(game: string, level: number, score: number) {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") return;
  await db.gameScore.create({
    data: { studentUserId: session.userId, game, level, score },
  });
}
