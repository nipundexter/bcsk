"use client";

import { useRouter } from "next/navigation";
import { LANGS } from "@/lib/constants";

export function LangSwitcher({ current }: { current: string }) {
  const router = useRouter();
  return (
    <select
      aria-label="Language"
      value={current}
      onChange={(e) => {
        document.cookie = `bcsk_lang=${e.target.value};path=/;max-age=31536000;samesite=lax`;
        router.refresh();
      }}
      className="bg-transparent text-white/90 text-xs font-semibold border border-white/25 rounded-md px-1.5 py-1 cursor-pointer hover:border-white/60 [&>option]:text-ink"
    >
      {LANGS.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  );
}
