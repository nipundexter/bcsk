"use client";

import { useEffect, useRef, useState } from "react";

/**
 * SEC-9: the reCAPTCHA v2 checkbox that produces the `recaptchaToken` the server actions
 * verify. Without this component the server-side check could only ever reject, which is
 * why enabling the secret used to take both public forms down.
 *
 * Renders nothing when reCAPTCHA is unconfigured, so local development is unaffected.
 */

declare global {
  interface Window {
    grecaptcha?: {
      render: (el: HTMLElement, opts: { sitekey: string; callback: (t: string) => void; "expired-callback": () => void }) => number;
      reset: (id?: number) => void;
    };
    onRecaptchaLoad?: () => void;
  }
}

const SCRIPT_ID = "recaptcha-script";

export function Recaptcha({ siteKey }: { siteKey: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<number | null>(null);
  const [token, setToken] = useState("");

  useEffect(() => {
    if (!siteKey) return;

    function render() {
      if (!boxRef.current || widgetId.current !== null || !window.grecaptcha) return;
      widgetId.current = window.grecaptcha.render(boxRef.current, {
        sitekey: siteKey,
        callback: (t) => setToken(t),
        // Tokens are single-use and expire after ~2 minutes; clear ours so the form
        // cannot submit a stale one and get a confusing rejection.
        "expired-callback": () => setToken(""),
      });
    }

    if (window.grecaptcha) {
      render();
      return;
    }
    window.onRecaptchaLoad = render;
    if (!document.getElementById(SCRIPT_ID)) {
      const s = document.createElement("script");
      s.id = SCRIPT_ID;
      s.src = "https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit";
      s.async = true;
      s.defer = true;
      document.head.appendChild(s);
    }
  }, [siteKey]);

  if (!siteKey) return null;

  return (
    <div>
      <div ref={boxRef} />
      <input type="hidden" name="recaptchaToken" value={token} />
    </div>
  );
}
