import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { admin } from "@/services";

export default async function AdminDashboard() {
  await requireAdmin();
  // One endpoint, six counts — previously six separate queries issued from the page.
  const stats = await admin.dashboard();

  const cards = [
    { label: "Payments to verify", value: stats.paymentsToVerify, href: "/admin/payments", color: "bg-sunrise", urgent: stats.paymentsToVerify > 0 },
    { label: "Open applications", value: stats.openApplications, href: "/admin/admissions", color: "bg-sky", urgent: false },
    { label: "Open support tickets", value: stats.openTickets, href: "/admin/tickets", color: "bg-teal", urgent: stats.openTickets > 0 },
    { label: "Active students", value: stats.students, href: "/admin/users?role=STUDENT", color: "bg-navy", urgent: false },
    { label: "Teachers", value: stats.teachers, href: "/admin/users?role=TEACHER", color: "bg-navy", urgent: false },
    { label: "Unanswered questions", value: stats.unanswered, href: "/admin/dashboard", color: "bg-sky", urgent: false },
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
