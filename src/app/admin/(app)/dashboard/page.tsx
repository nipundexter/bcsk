import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function AdminDashboard() {
  await requireAdmin();
  const [pendingPayments, pendingApps, openTickets, students, teachers, unansweredQ] = await Promise.all([
    db.payment.count({ where: { status: "PENDING_VERIFICATION" } }),
    db.applicationForm.count({ where: { status: { in: ["PENDING_PAYMENT", "PENDING_VERIFICATION", "PAID"] } } }),
    db.supportTicket.count({ where: { status: "OPEN" } }),
    db.user.count({ where: { role: "STUDENT", active: true } }),
    db.user.count({ where: { role: "TEACHER", active: true } }),
    db.question.count({ where: { answer: null } }),
  ]);

  const cards = [
    { label: "Payments to verify", value: pendingPayments, href: "/admin/payments", color: "bg-sunrise", urgent: pendingPayments > 0 },
    { label: "Open applications", value: pendingApps, href: "/admin/admissions", color: "bg-sky", urgent: false },
    { label: "Open support tickets", value: openTickets, href: "/admin/tickets", color: "bg-teal", urgent: openTickets > 0 },
    { label: "Active students", value: students, href: "/admin/users?role=STUDENT", color: "bg-navy", urgent: false },
    { label: "Teachers", value: teachers, href: "/admin/users?role=TEACHER", color: "bg-navy", urgent: false },
    { label: "Unanswered questions", value: unansweredQ, href: "/admin/dashboard", color: "bg-sky", urgent: false },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="bg-white rounded-2xl border border-line p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className={`w-3 h-3 rounded-full ${c.color}`} aria-hidden />
              {c.urgent && <span className="text-[10px] font-extrabold text-sunrise uppercase">Action needed</span>}
            </div>
            <p className="mt-3 font-display text-4xl font-semibold text-navy">{c.value}</p>
            <p className="mt-1 text-xs font-bold text-ink-soft uppercase tracking-wide">{c.label}</p>
          </Link>
        ))}
      </div>
      <p className="mt-8 text-xs text-ink-soft max-w-xl">
        Manage the public site from <Link href="/admin/cms" className="text-sky font-bold">CMS Pages</Link>, verify
        bank transfers under <Link href="/admin/payments" className="text-sky font-bold">Payments</Link>, and keep
        fees current in <Link href="/admin/fees" className="text-sky font-bold">Fee Configuration</Link>.
      </p>
    </div>
  );
}
