/** Google reCAPTCHA verification (4.3). When no secret is configured (dev), verification passes. */
export async function verifyRecaptcha(token?: string): Promise<{ ok: boolean }> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return { ok: true }; // dev / not configured
  if (!token) return { ok: false };
  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`,
    });
    const data = (await res.json()) as { success: boolean };
    return { ok: data.success };
  } catch {
    return { ok: false };
  }
}
