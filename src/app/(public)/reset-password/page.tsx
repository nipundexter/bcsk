import { ResetForm } from "./ResetForm";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-cream/60">
      <ResetForm token={token} />
    </div>
  );
}
