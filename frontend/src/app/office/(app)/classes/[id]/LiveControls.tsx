"use client";

import { useState, useTransition } from "react";
import { toggleLive } from "./actions";

export function LiveControls({
  classSessionId,
  isLive,
  zoomLink,
}: {
  classSessionId: number;
  isLive: boolean;
  zoomLink: string | null;
}) {
  const [pending, start] = useTransition();
  const [link, setLink] = useState(zoomLink ?? "");

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        value={link}
        onChange={(e) => setLink(e.target.value)}
        placeholder="Zoom meeting link"
        className="rounded-lg border border-line px-3 py-2 text-xs w-64 focus:border-sky focus:outline-none"
      />
      {isLive ? (
        <>
          {zoomLink && (
            <a
              href={zoomLink}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-sky hover:bg-sky/85 text-white text-xs font-bold rounded-lg px-4 py-2.5 transition-colors"
            >
              Open Zoom
            </a>
          )}
          <button
            disabled={pending}
            onClick={() => start(() => toggleLive(classSessionId, false))}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-xs font-bold rounded-lg px-4 py-2.5 transition-colors"
          >
            ⏹ End live class
          </button>
        </>
      ) : (
        <button
          disabled={pending}
          onClick={() => start(() => toggleLive(classSessionId, true, link || undefined))}
          className="bg-sunrise hover:bg-sunrise-deep disabled:opacity-60 text-white text-xs font-bold rounded-lg px-4 py-2.5 transition-colors"
        >
          ▶ Start live class
        </button>
      )}
    </div>
  );
}
