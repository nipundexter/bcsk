import Link from "next/link";

/** SEC-4.1: rendered when requirePermission() rejects a signed-in admin. */
export default function Forbidden() {
  return (
    <div className="max-w-lg">
      <p className="text-xs font-extrabold uppercase tracking-wide text-sunrise">403</p>
      <h1 className="mt-2 font-display text-2xl font-semibold text-navy">
        Your role doesn&apos;t have access to this
      </h1>
      <p className="mt-3 text-sm text-ink-soft leading-relaxed">
        You&apos;re signed in, but this module is restricted to a different admin role. If you need
        it, ask a Super Admin to review your permissions.
      </p>
      <Link
        href="/admin/dashboard"
        className="mt-6 inline-block bg-navy hover:bg-navy-deep text-white text-sm font-bold rounded-lg px-5 py-2.5 transition-colors"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
