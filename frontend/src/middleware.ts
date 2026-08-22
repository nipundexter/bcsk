import { NextRequest, NextResponse } from "next/server";

/**
 * SEC-8: security headers for every response.
 *
 * The app previously sent none — no CSP, no HSTS, no framing protection — and there was no
 * middleware at all to add them centrally. This runs on the Edge runtime before every
 * request, so it cannot use Prisma; the rate limiting that needs the database lives in
 * `src/lib/rate-limit.ts` and is called from the sensitive server actions instead.
 */

/** External origins the app genuinely loads code or data from. */
const TOSS = "https://js.tosspayments.com";
const TOSS_API = "https://api.tosspayments.com";
const RECAPTCHA = "https://www.google.com https://www.gstatic.com";

function contentSecurityPolicy(nonce: string, isDev: boolean): string {
  // Next injects inline bootstrap scripts; it picks up this nonce automatically because the
  // policy is also set on the *request* headers below. Dev additionally needs eval for HMR.
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    TOSS,
    RECAPTCHA,
    isDev ? "'unsafe-eval'" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    // Tailwind compiles to a stylesheet, but Next still emits some inline style attributes.
    // Style nonces buy little here — inline CSS is not an execution sink.
    "style-src 'self' 'unsafe-inline'",
    // next/font self-hosts Google Fonts at build time, so no external font origin is needed.
    "font-src 'self' data:",
    // Uploads are served from /api/files on our own origin; QR codes are data URIs.
    "img-src 'self' data: blob:",
    `connect-src 'self' ${TOSS_API} ${RECAPTCHA}`,
    // Toss opens a payment window and reCAPTCHA renders in an iframe.
    `frame-src 'self' ${TOSS} ${RECAPTCHA}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function middleware(req: NextRequest) {
  const isDev = process.env.NODE_ENV !== "production";
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const csp = contentSecurityPolicy(nonce, isDev);

  // Passing the policy through on the request is what lets Next stamp its own inline
  // scripts with this nonce. Without it, a nonce-based CSP breaks hydration.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const res = NextResponse.next({ request: { headers: requestHeaders } });

  res.headers.set("content-security-policy", csp);
  res.headers.set("x-content-type-options", "nosniff");
  res.headers.set("x-frame-options", "DENY");
  res.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  // The platform handles no camera/mic/geolocation, so decline them outright.
  res.headers.set(
    "permissions-policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );
  // HSTS only over TLS — sending it on plain http in dev would poison localhost.
  if (!isDev) {
    res.headers.set("strict-transport-security", "max-age=63072000; includeSubDomains; preload");
  }
  return res;
}

export const config = {
  matcher: [
    /*
     * Every path except Next's own static output and the favicon. Static assets are
     * immutable build artefacts and gain nothing from a per-request policy.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
