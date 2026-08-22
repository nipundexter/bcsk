import { redirect } from "next/navigation";
import { getSession, homeFor } from "@/lib/auth";
import { ChangePasswordForm } from "./ChangePasswordForm";

export const metadata = { title: "Change your password" };

/**
 * SEC-2: forced password change for office-issued and seeded credentials, and the
 * voluntary change screen for anyone already signed in.
 *
 * Deliberately uses getSession() rather than a require* guard — those divert here when
 * mustChangePassword is set, which from this page would be an infinite redirect.
 */
export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ voluntary?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/");
  const { voluntary } = await searchParams;

  // Nothing to force and nothing asked for — send them back where they belong.
  if (!session.mustChangePassword && voluntary !== "1") redirect(homeFor(session.role));

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-navy/5">
      <div className="w-full max-w-md bg-white rounded-3xl border border-line shadow-sm p-8">
        <h1 className="font-display text-2xl font-semibold text-navy text-center">
          {session.mustChangePassword ? "Set your password" : "Change your password"}
        </h1>
        {session.mustChangePassword && (
          <p className="mt-3 text-sm text-ink-soft text-center leading-relaxed">
            The password for <span className="font-bold text-ink">{session.loginId}</span> was issued
            by the school office. Choose your own before continuing — nobody else will know it.
          </p>
        )}
        <ChangePasswordForm />
      </div>
    </div>
  );
}
