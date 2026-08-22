import { notFound, redirect } from "next/navigation";
import { PageShell } from "@/components/site/PageShell";
import { admissions, payments, ApiError } from "@/services";
import { krw } from "@/lib/format";
import { SCHOOL } from "@/lib/constants";
import { PaymentOptions } from "./PaymentOptions";

/** FR-ADM-06: payment step — card via gateway or manual Hana Bank transfer with receipt upload. */
export default async function PaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string; error?: string }>;
}) {
  const { id } = await params;
  const { t: token, error } = await searchParams;
  // SEC-7: the token is the only thing that opens this page. The backend rejects a missing
  // or mismatched one, so a guessed application id gets a 404 here.
  if (!token) notFound();

  let app: Awaited<ReturnType<typeof admissions.summary>>;
  let fee: Awaited<ReturnType<typeof payments.quote>>;
  try {
    [app, fee] = await Promise.all([
      admissions.summary(Number(id), token),
      payments.quote(Number(id), token),
    ]);
  } catch (e) {
    if (e instanceof ApiError && [400, 401, 404].includes(e.status)) notFound();
    throw e;
  }

  const settled = app.payments.find((p) => ["PAID", "VERIFIED", "PENDING_VERIFICATION"].includes(p.status));
  if (settled) redirect(`/apply/complete/${app.id}?t=${encodeURIComponent(token)}`);

  // SEC-2.1: don't advertise a checkout that cannot complete — with no gateway keys the page
  // offers bank transfer only rather than failing after the customer has committed.
  const toss = await payments.config();

  return (
    <PageShell title="Payment" eyebrow="Application">
      <div className="max-w-2xl">
        <div className="bg-white border border-line rounded-2xl p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-sky">
                Application #{app.id} · {app.type === "REGULAR" ? "Regular Course" : "Special Course"}
              </p>
              <h2 className="mt-1 font-bold text-ink">{app.applicantName}</h2>
              <p className="text-xs text-ink-soft mt-1">{fee.breakdown}</p>
            </div>
            <p className="font-display text-3xl font-semibold text-navy">{krw(fee.amount)}</p>
          </div>
        </div>

        {error && (
          <p className="mb-4 text-sm font-semibold text-red-600 bg-red-50 rounded-xl p-4">
            Payment failed: {decodeURIComponent(error)}. You can try again or use bank transfer.
          </p>
        )}

        <PaymentOptions
          applicationId={app.id}
          amount={fee.amount}
          orderName={`BCSK ${app.type === "REGULAR" ? "Admission" : "Course"} — ${app.applicantName}`}
          customerName={app.applicantName}
          customerEmail={app.email ?? ""}
          token={token}
          bank={{ name: SCHOOL.bank.name, accountName: SCHOOL.bank.accountName, accountNumber: SCHOOL.bank.accountNumber }}
          tossClientKey={toss.clientKey}
          cardEnabled={toss.cardEnabled}
          devMode={process.env.NODE_ENV !== "production"}
        />
      </div>
    </PageShell>
  );
}
