import { CmsPage } from "@/components/site/CmsPage";
import { SideCard } from "@/components/site/SideCard";

export default function Page() {
  return (
    <CmsPage
      slug="privacy-policy"
      eyebrow="Legal"
    >
      <SideCard />
    </CmsPage>
  );
}
