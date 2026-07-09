"use client";

import { useActionState } from "react";
import { addClassVideo, type TeacherFormState } from "./actions";

export function VideoPanel({
  classSessionId,
  videos,
}: {
  classSessionId: number;
  videos: { id: number; title: string; url: string; date: string }[];
}) {
  const [state, action, pending] = useActionState<TeacherFormState, FormData>(addClassVideo, null);

  return (
    <section className="bg-white rounded-2xl border border-line p-6">
      <h2 className="font-display text-lg font-semibold text-navy mb-4">Class Videos</h2>
      <form action={action} className="bg-cream rounded-xl p-4 flex flex-wrap gap-3 items-center mb-5">
        <input type="hidden" name="classSessionId" value={classSessionId} />
        <input
          name="title"
          required
          placeholder="Video title (e.g. Lesson 4 recording)"
          className="flex-1 min-w-48 rounded-lg border border-line px-3.5 py-2.5 text-sm focus:border-sky focus:outline-none"
        />
        <input
          name="videoUrl"
          required
          placeholder="YouTube / Zoom recording link"
          className="flex-1 min-w-48 rounded-lg border border-line px-3.5 py-2.5 text-sm focus:border-sky focus:outline-none"
        />
        <button
          disabled={pending}
          className="bg-navy hover:bg-navy-deep disabled:opacity-60 text-white text-xs font-bold rounded-lg px-5 py-2.5 transition-colors"
        >
          {pending ? "Adding…" : "Add video"}
        </button>
        {state?.error && <p className="w-full text-xs font-semibold text-red-600">{state.error}</p>}
        {state?.ok && <p className="w-full text-xs font-semibold text-teal">Video added.</p>}
      </form>
      <ul className="space-y-2">
        {videos.length === 0 && <li className="text-sm text-ink-soft">No videos yet.</li>}
        {videos.map((v) => (
          <li key={v.id} className="flex items-center gap-3 text-sm border border-line rounded-xl px-4 py-3">
            <span aria-hidden>🎬</span>
            <a href={v.url} target="_blank" rel="noopener noreferrer" className="font-bold text-navy hover:text-sky">
              {v.title}
            </a>
            <time className="ml-auto text-xs text-ink-soft">{v.date}</time>
          </li>
        ))}
      </ul>
    </section>
  );
}
