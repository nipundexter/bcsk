import { db } from "@/lib/db";
import { marked } from "marked";
import type { Lang } from "@/lib/constants";

/** Fetch a published CMS page in the requested language, falling back to English. */
export async function getPage(slug: string, lang: Lang) {
  const page =
    (await db.contentPage.findFirst({ where: { slug, lang, status: "PUBLISHED" } })) ??
    (await db.contentPage.findFirst({ where: { slug, lang: "en", status: "PUBLISHED" } }));
  return page;
}

export function renderMarkdown(md: string): string {
  return marked.parse(md, { async: false }) as string;
}

export async function getSetting(key: string, fallback = ""): Promise<string> {
  const s = await db.setting.findUnique({ where: { key } });
  return s?.value ?? fallback;
}

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const rows = await db.setting.findMany({ where: { key: { in: keys } } });
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}
