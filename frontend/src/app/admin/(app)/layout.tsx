import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { navFor } from "@/lib/permissions";
import { LogoMark } from "@/components/Logo";
import { LogoutButton } from "@/components/portal/LogoutButton";
import { AdminNav } from "./AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  // SEC-5: the menu is derived from the same permission map the server guards use
  // (src/lib/permissions.ts), so a visible link and an allowed action can never disagree.
  const nav = navFor(session.role);

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
