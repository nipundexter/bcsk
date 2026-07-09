import Link from "next/link";

/** Standard interior page header band + content container. */
export function PageShell({
  title,
  eyebrow,
  children,
  cta,
}: {
  title: string;
  eyebrow?: string;
  cta?: { label: string; href: string };
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <div className="relative bg-cream rounded-3xl px-6 sm:px-12 py-10 overflow-hidden">
          <div className="absolute right-8 top-1/2 -translate-y-1/2 w-32 h-32 dot-grid opacity-60 hidden md:block" aria-hidden />
          <div className="absolute -right-6 -bottom-10 w-28 h-28 rounded-full bg-sky-soft" aria-hidden />
          {eyebrow && (
            <p className="relative text-xs font-extrabold tracking-wide uppercase text-sunrise mb-2">{eyebrow}</p>
          )}
          <h1 className="relative font-display text-3xl sm:text-4xl font-semibold text-ink max-w-2xl">{title}</h1>
          {cta && (
            <Link
              href={cta.href}
              className="relative inline-block mt-5 bg-sunrise hover:bg-sunrise-deep text-white font-bold rounded-lg px-6 py-2.5 text-sm transition-colors"
            >
              {cta.label}
            </Link>
          )}
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-10">{children}</div>
    </>
  );
}
