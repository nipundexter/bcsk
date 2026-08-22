"use client";

import { useActionState, useTransition } from "react";
import { replyTicket, setTicketStatus, type TicketState } from "./actions";

export function TicketActions({ ticketId, status }: { ticketId: number; status: string }) {
  const [state, action, pending] = useActionState<TicketState, FormData>(replyTicket, null);
  const [, start] = useTransition();

  if (status === "CLOSED") {
    return (
      <button
        onClick={() => start(() => setTicketStatus(ticketId, "OPEN"))}
        className="text-xs font-bold text-sky hover:underline"
      >
        Reopen ticket
      </button>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="ticketId" value={ticketId} />
      <textarea
        name="reply"
        rows={2}
        placeholder="Write a reply (emailed to the sender)…"
        className="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm focus:border-sky focus:outline-none"
      />
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs font-bold text-ink">
          <input type="checkbox" name="close" defaultChecked className="w-4 h-4 accent-teal" />
          Close ticket after reply
        </label>
        <button
          disabled={pending}
          className="ml-auto bg-navy hover:bg-navy-deep disabled:opacity-60 text-white text-xs font-bold rounded-lg px-5 py-2.5 transition-colors"
        >
          {pending ? "Sending…" : "Send reply"}
        </button>
      </div>
      {state?.error && <p className="text-xs font-semibold text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-xs font-semibold text-teal">Reply sent ✓</p>}
    </form>
  );
}
