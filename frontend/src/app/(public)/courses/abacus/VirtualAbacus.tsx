"use client";

import { useState } from "react";

const RODS = 9;

/**
 * FR-ABC-06: interactive soroban. Per rod: 1 heaven bead (value 5) + 4 earth beads (value 1).
 * A bead counts when moved toward the beam.
 */
export function VirtualAbacus() {
  // heaven[i]: heaven bead active; earth[i]: how many earth beads are raised (0-4)
  const [heaven, setHeaven] = useState<boolean[]>(Array(RODS).fill(false));
  const [earth, setEarth] = useState<number[]>(Array(RODS).fill(0));

  const value = heaven.reduce(
    (acc, h, i) => acc + (h ? 5 : 0) * 10 ** (RODS - 1 - i),
    earth.reduce((acc, e, i) => acc + e * 10 ** (RODS - 1 - i), 0)
  );

  function toggleHeaven(rod: number) {
    setHeaven((prev) => prev.map((h, i) => (i === rod ? !h : h)));
  }
  /** Clicking earth bead k raises beads 0..k if it was lowered, otherwise lowers k..3. */
  function clickEarth(rod: number, k: number) {
    setEarth((prev) => prev.map((e, i) => (i === rod ? (k < e ? k : k + 1) : e)));
  }
  function reset() {
    setHeaven(Array(RODS).fill(false));
    setEarth(Array(RODS).fill(0));
  }

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="bg-navy text-white font-mono text-2xl font-bold rounded-xl px-6 py-3 tabular-nums" aria-live="polite">
          {value.toLocaleString("en-US")}
        </div>
        <button
          onClick={reset}
          className="bg-white border border-line hover:border-sky text-navy text-xs font-bold rounded-lg px-4 py-2.5 transition-colors"
        >
          Reset beads
        </button>
      </div>

      <div className="bg-gradient-to-b from-amber-800 to-amber-900 rounded-2xl p-4 sm:p-6 shadow-inner overflow-x-auto">
        <div className="flex justify-between gap-2 min-w-[560px]">
          {Array.from({ length: RODS }).map((_, rod) => (
            <div key={rod} className="flex-1 flex flex-col items-center">
              {/* heaven deck */}
              <div className="relative h-24 w-full flex flex-col items-center">
                <div className="absolute inset-y-0 w-1.5 bg-amber-950/70 rounded-full" aria-hidden />
                <button
                  onClick={() => toggleHeaven(rod)}
                  aria-label={`Rod ${rod + 1} heaven bead ${heaven[rod] ? "counted" : "not counted"}`}
                  aria-pressed={heaven[rod]}
                  className={`relative z-10 w-10 h-7 sm:w-12 sm:h-8 rounded-[50%] bg-gradient-to-b from-orange-400 to-orange-600 border-2 border-orange-800 shadow-md transition-all duration-150 hover:brightness-110 ${
                    heaven[rod] ? "mt-[52px]" : "mt-1"
                  }`}
                />
              </div>
              {/* beam */}
              <div className="h-2.5 w-full bg-amber-950 rounded-sm my-0.5" aria-hidden />
              {/* earth deck */}
              <div className="relative h-44 w-full flex flex-col items-center">
                <div className="absolute inset-y-0 w-1.5 bg-amber-950/70 rounded-full" aria-hidden />
                {Array.from({ length: 4 }).map((_, k) => {
                  const raised = k < earth[rod];
                  return (
                    <button
                      key={k}
                      onClick={() => clickEarth(rod, k)}
                      aria-label={`Rod ${rod + 1} earth bead ${k + 1} ${raised ? "counted" : "not counted"}`}
                      aria-pressed={raised}
                      className={`relative z-10 w-10 h-7 sm:w-12 sm:h-8 rounded-[50%] bg-gradient-to-b from-sky-400 to-sky-600 border-2 border-sky-800 shadow-md transition-all duration-150 hover:brightness-110 ${
                        raised ? "mt-1" : k === earth[rod] ? "mt-[26px]" : "mt-1"
                      }`}
                    />
                  );
                })}
              </div>
              <span className="mt-2 text-[10px] font-bold text-amber-100/70 tabular-nums" aria-hidden>
                {new Intl.NumberFormat("en", { notation: "compact" }).format(10 ** (RODS - 1 - rod))}
              </span>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-soft">
        Tip: click an earth bead to raise it (and the beads above it); click a raised bead to lower it. Click the
        orange heaven bead to count 5.
      </p>
    </div>
  );
}
