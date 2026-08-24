"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { admin, toActionError } from "@/services";

export type TicketState = { ok?: boolean; error?: string } | null;

/**
 * FR-CONT-01 (admin side).
 *
 * The reply email is sent by the backend, which escapes the operator's text before it goes
 * into an HTML body — the previous version interpolated both the reply and the sender's name
 * raw.
 */
export async function replyTicket(_prev: TicketState, formData: FormData): Promise<TicketState> {
  await requirePermission("tickets:manage");
  const ticketId = Number(formData.get("ticketId"));
  const reply = String(formData.get("reply") ?? "").trim();
  if (!reply) return { error: "Write a reply first." };
  try {
    await admin.replyTicket(ticketId, reply, formData.get("close") === "on");
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/admin/tickets");
  return { ok: true };
}

export async function setTicketStatus(ticketId: number, status: string) {
  await requirePermission("tickets:manage");
  await admin.setTicketStatus(ticketId, status);
  revalidatePath("/admin/tickets");
}
