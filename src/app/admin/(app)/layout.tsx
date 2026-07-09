import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { LogoMark } from "@/components/Logo";
import { LogoutButton } from "@/components/portal/LogoutButton";
import { AdminNav } from "./AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  // FR-ADMIN-01: permission scoping per module by role
  const isSuper = session.role === "SUPER_ADMIN";
  const isSupport = session.role === "ADMIN_SUPPORT" || isSuper;
  const isIT = session.role === "IT_SUPPORT" || isSuper;

  const nav = [
    { href: "/admin/dashboard", label: "Dashboard", show: true },
    { href: "/admin/admissions", label: "Admissions", show: isSupport },
    { href: "/admin/payments", label: "Payments", show: isSupport },
    { href: "/admin/fees", label: "Fee Configuration", show: isSupport },
    { href: "/admin/cms", label: "CMS Pages", show: isSupport },
    { href: "/admin/news", label: "News & Events", show: isSupport },
    { href: "/admin/gallery", label: "Media Gallery", show: isSupport },
    { href: "/admin/student-corner", label: "Student Corner", show: isSupport },
    { href: "/admin/governing", label: "Governing Body", show: isSupport },
    { href: "/admin/courses", label: "Courses & Levels", show: isSupport },
    { href: "/admin/scheduling", label: "Scheduling", show: isSupport },
    { href: "/admin/users", label: "Users", show: isIT },
    { href: "/admin/reports", label: "Reports", show: isSupport },
    { href: "/admin/tickets", label: "Support Tickets", show: isIT || isSupport },
    { href: "/admin/settings", label: "Settings", show: isSuper },
    { href: "/admin/audit", label: "Audit Log", show: isSuper },
  ].filter((n) => n.show);

  return (
    <div className="min-h-screen bg-[#f3f4f8] flex">
      <aside className="w-60 shrink-0 bg-navy text-white min-h-screen sticky top-0 hidden lg:flex flex-col no-print">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5 px-5 h-16 border-b border-white/10">
          <LogoMark size={34} />
          <span className="font-display font-semibold text-sm leading-tight">BCSK Admin</span>
        </Link>
        <AdminNav items={nav} />
        <div className="mt-auto p-4 border-t border-white/10 text-xs">
          <p className="font-bold">{session.name}</p>
          <p className="text-white/60 mt-0.5">{session.role.replace(/_/g, " ")}</p>
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <header className="bg-white border-b border-line h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 no-print">
          <div className="lg:hidden flex items-center gap-2">
            <LogoMark size={30} />
            <span className="font-display font-semibold text-sm text-navy">BCSK Admin</span>
          </div>
          <nav className="lg:hidden overflow-x-auto flex gap-3 text-xs font-bold text-ink-soft mx-3">
            {nav.slice(0, 6).map((n) => (
              <Link key={n.href} href={n.href} className="whitespace-nowrap hover:text-navy">{n.label}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 ml-auto">
            <Link href="/" className="text-xs font-bold text-ink-soft hover:text-sky hidden sm:block">← Public site</Link>
            <LogoutButton dest="/admin" />
          </div>
        </header>
        <main className="p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
