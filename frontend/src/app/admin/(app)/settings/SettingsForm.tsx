"use client";

import { useActionState } from "react";
import { saveSettings, type SettingsState } from "./actions";

export function SettingsForm({
  groups,
  values,
}: {
  groups: Array<{ title: string; note?: string; keys: Array<[string, string]> }>;
  values: Record<string, string>;
}) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(saveSettings, null);

  return (
    <form action={action} className="space-y-6">
      {groups.map((g) => (
        <fieldset key={g.title} className="bg-white rounded-2xl border border-line p-6">
          <legend className="sr-only">{g.title}</legend>
          <h2 className="font-display text-lg font-semibold text-navy mb-1">{g.title}</h2>
          {g.note && <p className="text-xs text-ink-soft mb-3">{g.note}</p>}
          <div className="grid sm:grid-cols-2 gap-4 mt-3">
            {g.keys.map(([key, label]) => (
              <label key={key} className="block">
                <span className="text-xs font-bold text-ink">{label}</span>
                <input
                  name={key}
                  defaultValue={values[key] ?? ""}
                  className="mt-1.5 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm focus:border-sky focus:outline-none"
                />
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <div className="flex items-center gap-3">
        <button
          disabled={pending}
          className="bg-navy hover:bg-navy-deep disabled:opacity-60 text-white text-sm font-bold rounded-lg px-6 py-2.5 transition-colors"
        >
          {pending ? "Saving…" : "Save all settings"}
        </button>
        {state?.ok && <span className="text-sm font-bold text-teal">Saved ✓</span>}
      </div>
    </form>
  );
}
