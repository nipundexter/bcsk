"use server";

import { revalidatePath } from "next/cache";
import { requirePermission, audit } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendMail, emailLayout } from "@/lib/email";

export type TicketState = { ok?: boolean; error?: string } | null;

export async function replyTicket(_prev: TicketState, formData: FormData): Promise<TicketState> {
  const admin = await requirePermission("tickets:manage");
  const ticketId = Number(formData.get("ticketId"));
  const reply = String(formData.get("reply") ?? "").trim();
  const close = formData.get("close") === "on";
  if (!reply) return { error: "Write a reply first." };

  const ticket = await db.supportTicket.update({
    where: { id: ticketId },
    data: { reply, status: close ? "CLOSED" : "IN_PROGRESS" },
  });
  await sendMail(
    ticket.email,
    `Re: ${ticket.subject} — BCSK support`,
    emailLayout(
      "Reply from BCSK office",
      `<p style="font-size:14px;color:#232323">Dear ${ticket.name},</p>
       <p style="font-size:14px;color:#232323">${reply.replace(/\n/g, "<br/>")}</p>
       <p style="font-size:12px;color:#5b5b6b">Your original message: "${ticket.message.slice(0, 300)}"</p>`
    )
  );
  await audit(admin.userId, "TICKET_REPLY", "SupportTicket", ticketId);
  revalidatePath("/admin/tickets");
  return { ok: true };
}

export async function setTicketStatus(ticketId: number, status: string) {
  const admin = await requirePermission("tickets:manage");
  await db.supportTicket.update({ where: { id: ticketId }, data: { status } });
  await audit(admin.userId, "TICKET_STATUS", "SupportTicket", ticketId, status);
  revalidatePath("/admin/tickets");
}
