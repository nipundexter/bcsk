import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/site/PageShell";
import { admissions, ApiError } from "@/services";
import { krw } from "@/lib/format";

/** Post-payment status page (FR-ADM-07/08). */
export default async function ApplicationCompletePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { id } = await params;
  const { t: token } = await searchParams;
  // SEC-7: this page shows a name, an email and a payment status, so it is gated by the same
  // capability token as the payment step rather than being open on a guessable id.
  if (!token) notFound();

  let app: Awaited<ReturnType<typeof admissions.summary>>;
  try {
    app = await admissions.summary(Number(id), token);
  } catch (e) {
    if (e instanceof ApiError && [400, 401, 404].includes(e.status)) notFound();
    throw e;
  }
  const payment = app.payments[app.payments.length - 1];
  const paid = payment && ["PAID", "VERIFIED"].includes(payment.status);
  const pending = payment?.status === "PENDING_VERIFICATION";

  return (
    <PageShell title={paid ? "Application complete!" : "Application received"} eyebrow="Application">
      <div className="max-w-xl">
        <div className="bg-white border border-line rounded-3xl p-8 text-center">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${paid ? "bg-teal/15 text-teal" : "bg-sunrise/15 text-sunrise"}`}>
            {paid ? (
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
            ) : (
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
            )}
          </div>
          <h2 className="mt-4 font-display text-2xl font-semibold text-navy">
            {paid ? "Payment confirmed" : pending ? "Payment under verification" : "Almost there"}
          </h2>
          <p className="mt-3 text-sm text-ink-soft leading-relaxed">
            {paid && (
              <>
                {app.applicantName}'s admission is confirmed. The <b>Classroom login details were emailed</b> to{" "}
                {app.email}. Welcome to BCSK! 🎉
              </>
            )}
            {pending && (
              <>
                Thank you! Our office is verifying your bank transfer (reference{" "}
                <b>{payment?.virtualRef}</b>). You'll receive the admission confirmation and Classroom login by
                email within 1–2 working days.
              </>
            )}
            {!paid && !pending && <>Your application is saved but payment hasn't been completed yet.</>}
          </p>

          {payment && (
            <dl className="mt-6 bg-cream rounded-xl p-4 text-sm text-left space-y-1.5">
              <div className="flex justify-between"><dt className="font-bold text-ink-soft">Application</dt><dd>#{app.id} — {app.applicantName}</dd></div>
              <div className="flex justify-between"><dt className="font-bold text-ink-soft">Amount</dt><dd className="font-bold text-navy">{krw(payment.amount)}</dd></div>
              <div className="flex justify-between"><dt className="font-bold text-ink-soft">Method</dt><dd>{payment.method === "CARD" ? "Card" : "Bank transfer"}</dd></div>
              <div className="flex justify-between"><dt className="font-bold text-ink-soft">Status</dt><dd>{payment.status.replace(/_/g, " ")}</dd></div>
            </dl>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {!paid && !pending && (
              <Link href={`/apply/payment/${app.id}`} className="bg-sunrise hover:bg-sunrise-deep text-white font-bold rounded-lg px-6 py-2.5 text-sm">
                Complete payment
              </Link>
            )}
            {paid && (
              <Link href="/classroom" className="bg-sunrise hover:bg-sunrise-deep text-white font-bold rounded-lg px-6 py-2.5 text-sm">
                Open Classroom portal
              </Link>
            )}
            <Link href="/" className="bg-navy hover:bg-navy-deep text-white font-bold rounded-lg px-6 py-2.5 text-sm">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
