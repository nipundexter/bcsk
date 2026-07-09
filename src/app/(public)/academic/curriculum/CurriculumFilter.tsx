"use client";

import { useState } from "react";

type ClassGroup = {
  key: string;
  label: string;
  subjects: { id: number; subject: string; details: string | null }[];
};

export function CurriculumFilter({ classes }: { classes: ClassGroup[] }) {
  const [selected, setSelected] = useState<string>("ALL");
  const visible = selected === "ALL" ? classes : classes.filter((c) => c.key === selected);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-8" role="tablist" aria-label="Filter by class">
        <button
          role="tab"
          aria-selected={selected === "ALL"}
          onClick={() => setSelected("ALL")}
          className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
            selected === "ALL" ? "bg-navy text-white" : "bg-cream text-navy hover:bg-cream-deep"
          }`}
        >
          All classes
        </button>
        {classes.map((c) => (
          <button
            key={c.key}
            role="tab"
            aria-selected={selected === c.key}
            onClick={() => setSelected(c.key)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
              selected === c.key ? "bg-navy text-white" : "bg-cream text-navy hover:bg-cream-deep"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="space-y-6">
        {visible.map((c) => (
          <section key={c.key} id={c.key.toLowerCase()} className="bg-white border border-line rounded-2xl p-6">
            <h2 className="font-display text-xl font-semibold text-navy">{c.label}</h2>
            <ul className="mt-4 grid sm:grid-cols-2 gap-2.5">
              {c.subjects.map((s) => (
                <li key={s.id} className="flex items-center gap-2.5 text-sm text-ink">
                  <span className="w-2 h-2 rounded-full bg-sunrise shrink-0" aria-hidden />
                  <span className="font-semibold">{s.subject}</span>
                  {s.details && <span className="text-xs text-ink-soft">· {s.details}</span>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
