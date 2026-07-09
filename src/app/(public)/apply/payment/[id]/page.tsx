import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { PageShell } from "@/components/site/PageShell";
import { computeApplicationFee, krw } from "@/lib/payments";
import { SCHOOL } from "@/lib/constants";
import { PaymentOptions } from "./PaymentOptions";

/** FR-ADM-06: payment step — card via gateway or manual Hana Bank transfer with receipt upload. */
export default async function PaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ bcsk?: string; error?: string }>;
}) {
  const { id } = await params;
  const { bcsk, error } = await searchParams;
  const app = await db.applicationForm.findUnique({
    where: { id: Number(id) },
    include: { payments: true },
  });
  if (!app) notFound();

  const confirmed = app.payments.find((p) => ["PAID", "VERIFIED"].includes(p.status));
  if (confirmed) redirect(`/apply/complete/${app.id}`);
  const pendingBank = app.payments.find((p) => p.status === "PENDING_VERIFICATION");
  if (pendingBank) redirect(`/apply/complete/${app.id}`);

  const fee = await computeApplicationFee(app, bcsk === "1");

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
          bcsk={bcsk === "1"}
          bank={{ name: SCHOOL.bank.name, accountName: SCHOOL.bank.accountName, accountNumber: SCHOOL.bank.accountNumber }}
          tossClientKey={process.env.TOSS_CLIENT_KEY ?? ""}
          devMode={process.env.NODE_ENV !== "production"}
        />
      </div>
    </PageShell>
  );
}
