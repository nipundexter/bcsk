"use client";

import { useActionState, useTransition } from "react";
import { addHeroImage, deleteHeroImage, type HeroSliderState } from "./actions";

type Image = { id: number; url: string; caption: string | null };
const input = "rounded-lg border border-line px-3 py-2 text-sm focus:border-sky focus:outline-none";
const LIMIT = 5;

export function HeroSliderManager({ images }: { images: Image[] }) {
  const [state, action, pending] = useActionState<HeroSliderState, FormData>(addHeroImage, null);
  const [, start] = useTransition();
  const full = images.length >= LIMIT;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-line p-5">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h2 className="font-bold text-navy">Homepage slider</h2>
          <span className="text-xs text-ink-soft">
            {images.length} / {LIMIT} images
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
          {images.map((img) => (
            <figure key={img.id} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.caption ?? ""} className="aspect-[4/3] object-cover rounded-lg" />
              <button
                onClick={() => start(() => deleteHeroImage(img.id))}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove from slider"
              >
                ✕
              </button>
              {img.caption && (
                <figcaption className="mt-1 text-[11px] text-ink-soft truncate">{img.caption}</figcaption>
              )}
            </figure>
          ))}
          {images.length === 0 && (
            <p className="col-span-full text-sm text-ink-soft">
              No images yet — the homepage shows its default illustration until you add one.
            </p>
          )}
        </div>

        {full ? (
          <p className="text-xs font-semibold text-ink-soft border-t border-line pt-4">
            The slider is full. Remove an image above before adding another.
          </p>
        ) : (
          <form action={action} className="flex flex-wrap gap-3 items-center border-t border-line pt-4">
            <input
              type="file"
              name="image"
              required
              accept="image/jpeg,image/png,image/webp"
              className="text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-cream file:px-3 file:py-2 file:text-xs file:font-bold file:text-navy"
            />
            <input name="caption" placeholder="Caption (optional, not shown publicly)" className={`flex-1 min-w-52 ${input}`} />
            <button
              disabled={pending}
              className="bg-sunrise hover:bg-sunrise-deep disabled:opacity-60 text-white text-xs font-bold rounded-lg px-4 py-2 transition-colors"
            >
              {pending ? "Uploading…" : "Add to slider"}
            </button>
            {state?.error && <p className="w-full text-xs font-semibold text-red-600">{state.error}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
