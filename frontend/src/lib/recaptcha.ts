/**
 * The frontend half of reCAPTCHA: the site key only.
 *
 * The secret stays in the backend, which is what verifies the token (SEC-9). This exists so
 * a page can decide whether to render the widget at all — without a site key there is
 * nothing to render, and the backend correspondingly enforces nothing.
 */
export function recaptchaSiteKey(): string {
  return process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim() ?? "";
}
