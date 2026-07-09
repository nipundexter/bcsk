"use client";

import { useActionState, useTransition } from "react";
import { createAlbum, addGalleryImage, deleteGalleryItem, deleteAlbum, type GalleryState } from "./actions";

type Album = { id: number; title: string; category: string | null; items: { id: number; url: string; caption: string | null }[] };
const input = "rounded-lg border border-line px-3 py-2 text-sm focus:border-sky focus:outline-none";

export function GalleryManager({ albums }: { albums: Album[] }) {
  const [albumState, albumAction, albumPending] = useActionState<GalleryState, FormData>(createAlbum, null);
  const [, start] = useTransition();

  return (
    <div className="space-y-6">
      <form action={albumAction} className="bg-white rounded-2xl border border-line p-5 flex flex-wrap gap-3 items-end">
        <label className="block text-xs font-bold text-ink">
          New album title
          <input name="title" required className={`block mt-1 ${input}`} />
        </label>
        <label className="block text-xs font-bold text-ink">
          Category
          <input name="category" placeholder="e.g. Events" className={`block mt-1 ${input}`} />
        </label>
        <button disabled={albumPending} className="bg-navy hover:bg-navy-deep disabled:opacity-60 text-white text-xs font-bold rounded-lg px-5 py-2.5 transition-colors">
          + Create album
        </button>
        {albumState?.error && <p className="w-full text-xs font-semibold text-red-600">{albumState.error}</p>}
      </form>

      {albums.map((a) => (
        <AlbumCard key={a.id} album={a} onDeleteItem={(id) => start(() => deleteGalleryItem(id))} onDeleteAlbum={() => {
          if (confirm(`Delete album "${a.title}" and all its photos?`)) start(() => deleteAlbum(a.id));
        }} />
      ))}
    </div>
  );
}

function AlbumCard({ album, onDeleteItem, onDeleteAlbum }: { album: Album; onDeleteItem: (id: number) => void; onDeleteAlbum: () => void }) {
  const [state, action, pending] = useActionState<GalleryState, FormData>(addGalleryImage, null);

  return (
    <div className="bg-white rounded-2xl border border-line p-5">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h2 className="font-bold text-navy">{album.title}</h2>
        {album.category && <span className="text-[10px] font-extrabold uppercase bg-cream rounded-full px-2.5 py-1">{album.category}</span>}
        <span className="text-xs text-ink-soft">{album.items.length} photos</span>
        <button onClick={onDeleteAlbum} className="ml-auto text-xs font-bold text-red-600 hover:underline">Delete album</button>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 gap-2.5 mb-4">
        {album.items.map((i) => (
          <figure key={i.id} className="relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={i.url} alt={i.caption ?? ""} className="aspect-square object-cover rounded-lg" />
            <button
              onClick={() => onDeleteItem(i.id)}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Delete photo"
            >
              ✕
            </button>
          </figure>
        ))}
      </div>
      <form action={action} className="flex flex-wrap gap-3 items-center border-t border-line pt-4">
        <input type="hidden" name="albumId" value={album.id} />
        <input type="file" name="image" required accept="image/jpeg,image/png,image/webp" className="text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-cream file:px-3 file:py-2 file:text-xs file:font-bold file:text-navy" />
        <input name="caption" placeholder="Caption (optional)" className={`flex-1 min-w-40 ${input}`} />
        <button disabled={pending} className="bg-sunrise hover:bg-sunrise-deep disabled:opacity-60 text-white text-xs font-bold rounded-lg px-4 py-2 transition-colors">
          {pending ? "Uploading…" : "Upload photo"}
        </button>
        {state?.error && <p className="w-full text-xs font-semibold text-red-600">{state.error}</p>}
      </form>
    </div>
  );
}
