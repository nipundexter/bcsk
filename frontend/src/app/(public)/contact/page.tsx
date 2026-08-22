import { recaptchaSiteKey } from "@/lib/recaptcha";
import { getDict } from "@/lib/i18n";
import { PageShell } from "@/components/site/PageShell";
import { SCHOOL } from "@/lib/constants";
import { ContactForm } from "./ContactForm";

/** FR-CONT-01: address, map, phone/WhatsApp, email, social links, and a support-ticket contact form. */
export default async function ContactPage() {
  const siteKey = recaptchaSiteKey();

  const { t } = await getDict();

  return (
    <PageShell title={t.nav.contact} eyebrow="BCSK">
      <div className="grid lg:grid-cols-2 gap-10 max-w-5xl">
        <div>
          <ul className="space-y-4 text-sm">
            <li className="flex gap-3">
              <span className="w-10 h-10 rounded-full bg-cream flex items-center justify-center shrink-0 text-navy" aria-hidden>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
              </span>
              <div>
                <p className="font-bold text-ink">Address</p>
                <p className="text-ink-soft mt-0.5">{SCHOOL.address}</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-10 h-10 rounded-full bg-cream flex items-center justify-center shrink-0 text-navy" aria-hidden>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.5 2.9.6a2 2 0 0 1 1.7 2Z" /></svg>
              </span>
              <div>
                <p className="font-bold text-ink">Phone / WhatsApp</p>
                <p className="text-ink-soft mt-0.5">
                  {SCHOOL.phone} · {SCHOOL.phone2}
                  <br />
                  WhatsApp:{" "}
                  <a className="text-sky hover:underline" href={`https://wa.me/${SCHOOL.whatsapp.replace("+", "")}`} target="_blank" rel="noopener noreferrer">
                    {SCHOOL.whatsappDisplay}
                  </a>
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-10 h-10 rounded-full bg-cream flex items-center justify-center shrink-0 text-navy" aria-hidden>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 6L22 7" /></svg>
              </span>
              <div>
                <p className="font-bold text-ink">Email</p>
                <a className="text-sky hover:underline mt-0.5 inline-block" href={`mailto:${SCHOOL.email}`}>{SCHOOL.email}</a>
              </div>
            </li>
          </ul>

          {/* Google Maps embed (4.3 Software Interfaces) */}
          <div className="mt-8 rounded-2xl overflow-hidden border border-line">
            <iframe
              title="BCSK location map"
              src={`https://www.google.com/maps?q=${encodeURIComponent(SCHOOL.address)}&output=embed`}
              className="w-full h-64"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        <div className="bg-cream rounded-2xl p-6 sm:p-8">
          <h2 className="font-display text-xl font-semibold text-navy mb-5">Send us a message</h2>
          <ContactForm recaptchaSiteKey={siteKey} />
        </div>
      </div>
    </PageShell>
  );
}
