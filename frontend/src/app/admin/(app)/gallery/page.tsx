import { requirePermission } from "@/lib/auth";
import { admin } from "@/services";
import { GalleryManager } from "./GalleryManager";

/** FR-ADMIN-10: media/gallery module. */
export default async function AdminGalleryPage() {
  await requirePermission("content:manage");
  const albums = (await admin.albums()).sort((a, b) => b.id - a.id);

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
