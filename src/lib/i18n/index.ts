import { cookies } from "next/headers";
import { dictionaries, type Dictionary } from "./dictionaries";
import type { Lang } from "@/lib/constants";

export async function getLang(): Promise<Lang> {
  const store = await cookies();
  const v = store.get("bcsk_lang")?.value;
  return v === "bn" || v === "ko" ? v : "en";
}

export async function getDict(): Promise<{ lang: Lang; t: Dictionary }> {
  const lang = await getLang();
  return { lang, t: dictionaries[lang] };
}
