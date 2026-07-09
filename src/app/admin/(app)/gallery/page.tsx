import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { GalleryManager } from "./GalleryManager";

/** FR-ADMIN-10: media/gallery module. */
export default async function AdminGalleryPage() {
  await requireAdmin();
  const albums = await db.galleryAlbum.findMany({ include: { items: true }, orderBy: { id: "desc" } });

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl font-semibold text-navy mb-6">Media Gallery</h1>
      <GalleryManager
        albums={albums.map((a) => ({
          id: a.id,
          title: a.title,
          category: a.category,
          items: a.items.map((i) => ({ id: i.id, url: i.url, caption: i.caption })),
        }))}
      />
    </div>
  );
}
