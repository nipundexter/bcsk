"use client";

import { useCallback, useEffect, useState } from "react";

type Item = { id: number; url: string; caption: string | null; type: string };
type Album = { id: number; title: string; category: string | null; items: Item[] };

export function GalleryGrid({ albums }: { albums: Album[] }) {
  const [filter, setFilter] = useState<string>("ALL");
  const [lightbox, setLightbox] = useState<{ album: Album; index: number } | null>(null);

  const categories = Array.from(new Set(albums.map((a) => a.category).filter(Boolean))) as string[];
  const visible = filter === "ALL" ? albums : albums.filter((a) => a.category === filter);

  const close = useCallback(() => setLightbox(null), []);
  const step = useCallback(
    (dir: 1 | -1) => {
      setLightbox((lb) => {
        if (!lb) return lb;
        const n = (lb.index + dir + lb.album.items.length) % lb.album.items.length;
        return { ...lb, index: n };
      });
    },
    []
  );

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, close, step]);

  return (
    <div>
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {["ALL", ...categories].map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                filter === c ? "bg-navy text-white" : "bg-cream text-navy hover:bg-cream-deep"
              }`}
            >
              {c === "ALL" ? "All albums" : c}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-10">
        {visible.map((album) => (
          <section key={album.id}>
            <h2 className="font-display text-xl font-semibold text-navy mb-4">
              {album.title}
              {album.category && (
                <span className="ml-3 text-xs font-body font-bold uppercase tracking-wide text-sunrise">{album.category}</span>
              )}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {album.items.map((item, i) => (
                <button
                  key={item.id}
                  onClick={() => setLightbox({ album, index: i })}
                  className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-cream"
                  aria-label={item.caption ?? album.title}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.caption ?? ""}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {item.caption && (
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent text-white text-xs px-3 pb-2 pt-6 text-left opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.caption}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={close}
        >
          <button onClick={close} aria-label="Close" className="absolute top-4 right-4 text-white/80 hover:text-white p-2">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); step(-1); }}
            aria-label="Previous"
            className="absolute left-3 sm:left-6 text-white/80 hover:text-white p-2"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <figure className="max-w-4xl max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.album.items[lightbox.index].url}
              alt={lightbox.album.items[lightbox.index].caption ?? ""}
              className="max-h-[75vh] w-auto mx-auto rounded-lg"
            />
            <figcaption className="text-center text-white/80 text-sm mt-3">
              {lightbox.album.items[lightbox.index].caption ?? lightbox.album.title}
              <span className="text-white/40 ml-2">
                {lightbox.index + 1} / {lightbox.album.items.length}
              </span>
            </figcaption>
          </figure>
          <button
            onClick={(e) => { e.stopPropagation(); step(1); }}
            aria-label="Next"
            className="absolute right-3 sm:right-6 text-white/80 hover:text-white p-2"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6" /></svg>
          </button>
        </div>
      )}
    </div>
  );
}
