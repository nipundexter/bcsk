import { cms } from "@/services";
import { getDict } from "@/lib/i18n";
import { PageShell } from "@/components/site/PageShell";
import { GalleryGrid } from "./GalleryGrid";

/** FR-NEWS-02: categorized albums with lightbox viewing. */
export default async function GalleryPage() {
  const { t } = await getDict();
  const albums = await cms.gallery();

  return (
    <PageShell title={t.nav.gallery} eyebrow={t.nav.eventsNews}>
      <GalleryGrid
        albums={albums.map((a) => ({
          id: a.id,
          title: a.title,
          category: a.category,
          items: a.items.map((i) => ({ id: i.id, url: i.url, caption: i.caption, type: i.type })),
        }))}
      />
    </PageShell>
  );
}
