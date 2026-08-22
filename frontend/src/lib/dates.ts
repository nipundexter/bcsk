import type { Lang } from "@/lib/constants";

/**
 * Date formatting for values that arrive from the API.
 *
 * JSON has no date type, so everything the backend returns is an ISO string. Previously
 * Prisma handed pages real `Date` objects and they called `.toLocaleDateString()` directly —
 * that silently became a runtime error the moment the data crossed a network boundary.
 * Routing every format through here makes the string/Date distinction impossible to forget.
 */

const LOCALE: Record<Lang, string> = { en: "en-US", bn: "bn-BD", ko: "ko-KR" };

const toDate = (value: string | Date): Date => (value instanceof Date ? value : new Date(value));

export function formatDate(
  value: string | Date | null | undefined,
  lang: Lang = "en",
  options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" },
): string {
  if (!value) return "—";
  const d = toDate(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString(LOCALE[lang] ?? "en-US", options);
}

/** Short form for dense lists: "12 Mar". */
export const formatShortDate = (value: string | Date | null | undefined, lang: Lang = "en") =>
  formatDate(value, lang, { month: "short", day: "numeric" });

/** The `datetime` attribute of a <time> element wants a machine-readable value. */
export function isoAttr(value: string | Date | null | undefined): string | undefined {
  if (!value) return undefined;
  const d = toDate(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export const dayOfMonth = (value: string | Date): number => toDate(value).getDate();

export const monthShort = (value: string | Date, lang: Lang = "en") =>
  toDate(value).toLocaleDateString(LOCALE[lang] ?? "en-US", { month: "short" });
