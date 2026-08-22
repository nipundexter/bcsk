import { requirePermission } from "@/lib/auth";
import { PageEditor } from "../PageEditor";

export default async function CmsNewPage() {
  await requirePermission("content:manage");
  return (
    <PageEditor slug="" lang="en" langLabel="English" initialTitle="" initialContent="" published exists={false} isNew />
  );
}
