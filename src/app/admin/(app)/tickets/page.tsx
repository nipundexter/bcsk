import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { TicketActions } from "./TicketActions";

/** FR-CONT-01 (admin side): support tickets from the contact form. */
export default async function TicketsPage() {
  await requireAdmin();
  const tickets = await db.supportTicket.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }] });

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-semibold text-navy mb-6">Support Tickets</h1>
      <div className="space-y-4">
        {tickets.length === 0 && (
          <p className="bg-white rounded-2xl border border-line p-6 text-sm text-ink-soft">No tickets.</p>
        )}
        {tickets.map((t) => (
          <div key={t.id} className="bg-white rounded-2xl border border-line p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase bg-cream rounded-full px-2.5 py-1">{t.category}</span>
              <span className="font-bold text-ink text-sm">{t.subject}</span>
              <span className={`ml-auto text-[11px] font-bold rounded-full px-2.5 py-1 ${
                t.status === "OPEN" ? "bg-sunrise/15 text-sunrise-deep" : t.status === "IN_PROGRESS" ? "bg-sky-soft text-navy" : "bg-teal/15 text-teal"
              }`}>
                {t.status.replace(/_/g, " ")}
              </span>
            </div>
            <p className="mt-1 text-xs text-ink-soft">
              {t.name} · <a className="text-sky hover:underline" href={`mailto:${t.email}`}>{t.email}</a>
              {t.phone ? ` · ${t.phone}` : ""} · {t.createdAt.toISOString().slice(0, 10)}
            </p>
            <p className="mt-3 text-sm text-ink whitespace-pre-line">{t.message}</p>
            {t.reply && (
              <p className="mt-3 text-sm bg-cream rounded-xl p-4"><b className="text-navy">Office reply:</b> {t.reply}</p>
            )}
            <div className="mt-4 border-t border-line pt-4">
              <TicketActions ticketId={t.id} status={t.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
