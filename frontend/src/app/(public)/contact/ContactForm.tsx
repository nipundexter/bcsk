"use client";

import { Recaptcha } from "@/components/forms/Recaptcha";

import { useActionState } from "react";
import { submitContact, type ContactState } from "./actions";

const input =
  "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm focus:border-sky focus:outline-none";

export function ContactForm({ recaptchaSiteKey }: { recaptchaSiteKey: string }) {
  const [state, action, pending] = useActionState<ContactState, FormData>(submitContact, null);

  if (state?.ok) {
    return (
      <div className="bg-white rounded-xl p-6 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-teal/15 text-teal flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
        </div>
        <h3 className="mt-3 font-display text-lg font-semibold text-navy">Message sent</h3>
        <p className="mt-1.5 text-sm text-ink-soft">
          Your message is now a support ticket with our office. We reply by email, usually within 1–2 working days.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-xs font-bold text-ink">Your name *</span>
          <input name="name" required minLength={2} className={`mt-1.5 ${input}`} />
        </label>
        <label className="block">
          <span className="text-xs font-bold text-ink">Email *</span>
          <input name="email" type="email" required className={`mt-1.5 ${input}`} />
        </label>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-xs font-bold text-ink">Phone</span>
          <input name="phone" className={`mt-1.5 ${input}`} />
        </label>
        <label className="block">
          <span className="text-xs font-bold text-ink">Topic *</span>
          <select name="category" className={`mt-1.5 ${input}`}>
            <option value="GENERAL">General inquiry</option>
            <option value="ADMISSION">Admission</option>
            <option value="IT">Technical / IT support</option>
          </select>
        </label>
      </div>
      <label className="block">
        <span className="text-xs font-bold text-ink">Subject *</span>
        <input name="subject" required minLength={2} className={`mt-1.5 ${input}`} />
      </label>
      <label className="block">
        <span className="text-xs font-bold text-ink">Message *</span>
        <textarea name="message" required minLength={5} rows={5} className={`mt-1.5 ${input}`} />
      </label>
      {state && !state.ok && <p className="text-sm text-red-600 font-semibold">{state.error}</p>}
      <Recaptcha siteKey={recaptchaSiteKey} />
      <button
        type="submit"
        disabled={pending}
        className="bg-navy hover:bg-navy-deep disabled:opacity-60 text-white font-bold rounded-lg px-6 py-2.5 text-sm transition-colors"
      >
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
