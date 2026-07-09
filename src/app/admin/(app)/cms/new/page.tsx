import { requireAdmin } from "@/lib/auth";
import { PageEditor } from "../PageEditor";

export default async function CmsNewPage() {
  await requireAdmin();
  return (
    <PageEditor slug="" lang="en" langLabel="English" initialTitle="" initialContent="" published exists={false} isNew />
  );
}
