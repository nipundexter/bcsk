import Link from "next/link";

/**
 * BCSK logo — adapted from the school's badge: the open-book-with-wings mark
 * in the logo's navy/sky palette, paired with the school wordmark.
 */
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* outer ring — light blue halo */}
      <circle cx="24" cy="24" r="23" fill="#D9EEF8" />
      {/* deep navy disc */}
      <circle cx="24" cy="24" r="17.5" fill="#1D2B64" />
      {/* sky-blue inner disc */}
      <circle cx="24" cy="22.5" r="10.5" fill="#38A8DC" />
      {/* open book / wings */}
      <path
        d="M24 31.5c-1-2.6-4.6-4.6-10.5-4.2 1.6-1 3.2-1.5 5-1.6-2.8-.5-5.4 0-7.5 1 1.8-2.2 5.3-3.4 9-2.7-2.9-1.3-6.3-1.2-9 .2 2.3-2.7 7.2-3.3 10.8-1.2 1 .6 1.8 1.4 2.2 2.3.4-.9 1.2-1.7 2.2-2.3 3.6-2.1 8.5-1.5 10.8 1.2-2.7-1.4-6.1-1.5-9-.2 3.7-.7 7.2.5 9 2.7-2.1-1-4.7-1.5-7.5-1 1.8.1 3.4.6 5 1.6-5.9-.4-9.5 1.6-10.5 4.2Z"
        fill="#fff"
      />
      <path d="M24 31.5c-.5-1.3-1.6-2.4-3.2-3.2 1.3.2 2.4.8 3.2 1.7.8-.9 1.9-1.5 3.2-1.7-1.6.8-2.7 1.9-3.2 3.2Z" fill="#1D2B64" />
    </svg>
  );
}

export function Logo({ variant = "dark", href = "/" }: { variant?: "dark" | "light"; href?: string }) {
  const ink = variant === "dark" ? "text-navy" : "text-white";
  const sub = variant === "dark" ? "text-ink-soft" : "text-sky-soft";
  return (
    <Link href={href} className="flex items-center gap-2.5 shrink-0" aria-label="BCSK — Home">
      <LogoMark size={42} />
      <span className="leading-tight">
        <span className={`block font-display font-semibold text-[15px] sm:text-base ${ink}`}>
          Bangladesh Community School
        </span>
        <span className={`block text-[11px] sm:text-xs font-semibold tracking-[0.18em] uppercase ${sub}`}>
          Korea · কোরিয়া · 코리아
        </span>
      </span>
    </Link>
  );
}
