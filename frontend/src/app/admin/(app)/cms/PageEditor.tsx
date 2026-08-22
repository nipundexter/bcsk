"use client";

import Link from "next/link";
import { useActionState, useTransition } from "react";
import { savePage, deletePage, type CmsState } from "./actions";

export function PageEditor({
  slug,
  lang,
  langLabel,
  initialTitle,
  initialContent,
  published,
  exists,
  isNew,
}: {
  slug: string;
  lang: string;
  langLabel: string;
  initialTitle: string;
  initialContent: string;
  published: boolean;
  exists: boolean;
  isNew: boolean;
}) {
  const [state, action, pending] = useActionState<CmsState, FormData>(savePage, null);
  const [deleting, startDelete] = useTransition();

  return (
    <div className="max-w-3xl">
      <Link href="/admin/cms" className="text-xs font-bold text-ink-soft hover:text-sky">← All pages</Link>
      <h1 className="mt-2 font-display text-2xl font-semibold text-navy mb-6">
        {isNew ? "New page" : `Edit: ${slug}`}
        {!isNew && <span className="ml-3 text-sm font-body font-bold text-sunrise">{langLabel}</span>}
      </h1>

      <form action={action} className="space-y-4 bg-white rounded-2xl border border-line p-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs font-bold text-ink">Slug (URL key)</span>
            <input
              name="slug"
              defaultValue={slug}
              readOnly={!isNew}
              required
              className={`mt-1.5 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm font-mono ${!isNew ? "bg-cream text-ink-soft" : "focus:border-sky focus:outline-none"}`}
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-ink">Language</span>
            <select name="lang" defaultValue={lang} disabled={!isNew} className="mt-1.5 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm disabled:bg-cream">
              <option value="en">English</option>
              <option value="bn">বাংলা</option>
              <option value="ko">한국어</option>
            </select>
            {!isNew && <input type="hidden" name="lang" value={lang} />}
          </label>
        </div>
        <label className="block">
          <span className="text-xs font-bold text-ink">Title</span>
          <input name="title" defaultValue={initialTitle} required className="mt-1.5 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm focus:border-sky focus:outline-none" />
        </label>
        <label className="block">
          <span className="text-xs font-bold text-ink">Content (Markdown — headings ##, lists, tables, links)</span>
          <textarea
            name="content"
            defaultValue={initialContent}
            rows={20}
            className="mt-1.5 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm font-mono leading-relaxed focus:border-sky focus:outline-none"
          />
        </label>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm font-bold text-ink">
            <input type="checkbox" name="publish" defaultChecked={published} className="w-4 h-4 accent-teal" />
            Published (visible on the public site)
          </label>
          <button
            disabled={pending}
            className="ml-auto bg-navy hover:bg-navy-deep disabled:opacity-60 text-white text-sm font-bold rounded-lg px-6 py-2.5 transition-colors"
          >
            {pending ? "Saving…" : "Save page"}
          </button>
          {exists && (
            <button
              type="button"
              disabled={deleting}
              onClick={() => {
                if (confirm(`Delete the ${langLabel} version of "${slug}"?`)) {
                  startDelete(() => deletePage(slug, lang));
                }
              }}
              className="border border-red-200 text-red-600 hover:bg-red-50 text-sm font-bold rounded-lg px-4 py-2.5 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
        {state?.error && <p className="text-sm font-semibold text-red-600">{state.error}</p>}
        {state?.ok && <p className="text-sm font-semibold text-teal">Saved — the public site is updated.</p>}
      </form>
    </div>
  );
}
