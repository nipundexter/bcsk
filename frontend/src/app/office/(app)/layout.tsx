import Link from "next/link";
import { requireTeacher } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/portal/LogoutButton";
import { PortalNav } from "@/components/portal/PortalNav";

export default async function OfficeLayout({ children }: { children: React.ReactNode }) {
  const session = await requireTeacher();

  const links = [
    { href: "/office/dashboard", label: "Dashboard" },
    { href: "/office/classes", label: "My Classes" },
    { href: "/office/questions", label: "Questions" },
    { href: "/office/guardians", label: "Guardians" },
    { href: "/office/tasks", label: "Task List" },
  ];

  return (
    <div className="min-h-screen bg-sky-soft/30 flex flex-col">
      <header className="bg-white border-b border-line sticky top-0 z-40 no-print">
        <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between gap-4">
          <Logo href="/office/dashboard" />
          <div className="flex items-center gap-3">
            <Link href="/" className="hidden sm:block text-xs font-bold text-ink-soft hover:text-sky">
              ← Public site
            </Link>
            <span className="text-sm font-bold text-navy hidden sm:block">{session.name}</span>
            <LogoutButton dest="/office" />
          </div>
        </div>
        <PortalNav links={links} />
      </header>
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
