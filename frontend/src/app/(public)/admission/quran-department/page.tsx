import { CmsPage } from "@/components/site/CmsPage";
import { SideCard } from "@/components/site/SideCard";

export default function Page() {
  return (
    <CmsPage
      slug="quran-department"
      eyebrow="Admission"
      cta={{ label: "Apply Now", href: "/apply" }}
    >
      <SideCard />
    </CmsPage>
  );
}
