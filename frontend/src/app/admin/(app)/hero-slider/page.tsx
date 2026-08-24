import { requirePermission } from "@/lib/auth";
import { admin } from "@/services";
import { HeroSliderManager } from "./HeroSliderManager";

/** Homepage hero slider — admin-managed photos, capped at 5. */
export default async function AdminHeroSliderPage() {
  await requirePermission("content:manage");
  const images = await admin.heroImages();

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl font-semibold text-navy mb-2">Homepage Slider</h1>
      <p className="text-sm text-ink-soft mb-6">
        Photos shown one at a time in the homepage hero, auto-advancing every few seconds.
      </p>
      <HeroSliderManager
        images={images.map((i) => ({ id: i.id, url: i.url, caption: i.caption }))}
      />
    </div>
  );
}
