"use client";

import { useActionState, useState } from "react";
import { createCardOrder, submitBankTransfer, type BankState } from "./actions";

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => {
      payment: (opts: { customerKey: string }) => {
        requestPayment: (opts: Record<string, unknown>) => Promise<void>;
      };
    };
  }
}

const krw = (n: number) => `₩${n.toLocaleString("en-US")}`;

export function PaymentOptions({
  applicationId,
  amount,
  orderName,
  customerName,
  customerEmail,
  token,
  bank,
  tossClientKey,
  cardEnabled,
  devMode,
}: {
  applicationId: number;
  amount: number;
  orderName: string;
  customerName: string;
  customerEmail: string;
  /** SEC-7: capability token proving this visitor submitted this application. */
  token: string;
  bank: { name: string; accountName: string; accountNumber: string };
  tossClientKey: string;
  /** SEC-2.1: false when the gateway keys are unset — card payment is hidden entirely. */
  cardEnabled: boolean;
  devMode: boolean;
}) {
  const [method, setMethod] = useState<"CARD" | "BANK">(cardEnabled ? "CARD" : "BANK");
  const [cardError, setCardError] = useState<string | null>(null);
  const [cardBusy, setCardBusy] = useState(false);
  const [bankState, bankAction, bankPending] = useActionState<BankState, FormData>(submitBankTransfer, null);

  async function payByCard() {
    setCardBusy(true);
    setCardError(null);
    try {
      const { orderId } = await createCardOrder(applicationId, token);
      // load Toss SDK on demand
      if (!window.TossPayments) {
        await new Promise<void>((res, rej) => {
          const s = document.createElement("script");
          s.src = "https://js.tosspayments.com/v2/standard";
          s.onload = () => res();
          s.onerror = () => rej(new Error("Could not load the payment gateway. Check your connection or use bank transfer."));
          document.head.appendChild(s);
        });
      }
      const toss = window.TossPayments!(tossClientKey);
      const payment = toss.payment({ customerKey: `bcsk-app-${applicationId}` });
      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: amount },
        orderId,
        orderName: orderName.slice(0, 100),
        customerName,
        customerEmail: customerEmail || undefined,
        successUrl: `${window.location.origin}/api/payments/toss/confirm`,
        failUrl: `${window.location.origin}/apply/payment/${applicationId}?t=${encodeURIComponent(token)}&error=card-declined`,
        card: { useEscrow: false, flowMode: "DEFAULT", useCardPoint: false, useAppCardOnly: false },
      });
    } catch (e) {
      setCardError(e instanceof Error ? e.message : "Payment could not be started.");
    } finally {
      setCardBusy(false);
    }
  }

  return (
    <div>
      {/* method tabs */}
      <div className={`grid ${cardEnabled ? "grid-cols-2" : "grid-cols-1"} gap-2 mb-6`} role="tablist">
        {cardEnabled && (
        <button
          role="tab"
          aria-selected={method === "CARD"}
          onClick={() => setMethod("CARD")}
          className={`rounded-xl px-4 py-3.5 text-sm font-bold border-2 transition-colors ${
            method === "CARD" ? "border-sunrise bg-sunrise/5 text-navy" : "border-line bg-white text-ink-soft"
          }`}
        >
          💳 Card Payment
        </button>
        )}
        <button
          role="tab"
          aria-selected={method === "BANK"}
          onClick={() => setMethod("BANK")}
          className={`rounded-xl px-4 py-3.5 text-sm font-bold border-2 transition-colors ${
            method === "BANK" ? "border-sunrise bg-sunrise/5 text-navy" : "border-line bg-white text-ink-soft"
          }`}
        >
          🏦 Bank Transfer ({bank.name})
        </button>
      </div>

      {method === "CARD" && cardEnabled ? (
        <div className="bg-white border border-line rounded-2xl p-6">
          <p className="text-sm text-ink-soft leading-relaxed">
            Pay {krw(amount)} securely by card. You'll be redirected to our certified payment gateway
            (Toss Payments) — BCSK never sees or stores your card details.
          </p>
          {cardError && <p className="mt-3 text-sm font-semibold text-red-600">{cardError}</p>}
          <button
            onClick={payByCard}
            disabled={cardBusy}
            className="mt-5 w-full bg-sunrise hover:bg-sunrise-deep disabled:opacity-60 text-white font-bold rounded-lg px-6 py-3.5 text-sm transition-colors"
          >
            {cardBusy ? "Opening secure checkout…" : `Pay ${krw(amount)} by card`}
          </button>
        </div>
      ) : (
        <div className="bg-white border border-line rounded-2xl p-6">
          <p className="text-sm text-ink-soft leading-relaxed">
            Transfer <span className="font-bold text-navy">{krw(amount)}</span> to the school account, then upload
            your transfer receipt. Our office verifies transfers within 1–2 working days (your application stays{" "}
            <em>Pending Verification</em> until then).
          </p>
          <dl className="mt-4 bg-cream rounded-xl p-4 text-sm space-y-1.5">
            <div className="flex justify-between"><dt className="font-bold text-ink-soft">Bank</dt><dd className="font-bold text-ink">{bank.name}</dd></div>
            <div className="flex justify-between"><dt className="font-bold text-ink-soft">Account name</dt><dd>{bank.accountName}</dd></div>
            <div className="flex justify-between"><dt className="font-bold text-ink-soft">Account number</dt><dd className="font-bold text-navy">{bank.accountNumber}</dd></div>
            <div className="flex justify-between"><dt className="font-bold text-ink-soft">Transfer memo</dt><dd>Applicant's name</dd></div>
          </dl>
          <form action={bankAction} className="mt-5 space-y-4">
            <input type="hidden" name="applicationId" value={applicationId} />
            <input type="hidden" name="token" value={token} />
            <label className="block">
              <span className="text-xs font-bold text-ink">Transfer receipt (photo or PDF, max 5 MB) *</span>
              <input
                type="file"
                name="receipt"
                required
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="mt-1.5 block w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-cream file:px-4 file:py-2.5 file:text-xs file:font-bold file:text-navy"
              />
            </label>
            {bankState?.error && <p className="text-sm font-semibold text-red-600">{bankState.error}</p>}
            <button
              disabled={bankPending}
              className="w-full bg-navy hover:bg-navy-deep disabled:opacity-60 text-white font-bold rounded-lg px-6 py-3.5 text-sm transition-colors"
            >
              {bankPending ? "Uploading…" : "Submit receipt for verification"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
