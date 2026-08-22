import Link from "next/link";
import { requireStudent } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/portal/LogoutButton";
import { PortalNav } from "@/components/portal/PortalNav";

export default async function ClassroomLayout({ children }: { children: React.ReactNode }) {
  const session = await requireStudent();

  const links = [
    { href: "/classroom/dashboard", label: "Dashboard" },
    { href: "/classroom/assignments", label: "Assignments" },
    { href: "/classroom/videos", label: "Class Videos" },
    { href: "/classroom/routine", label: "Routine" },
    { href: "/classroom/results", label: "Results" },
    { href: "/classroom/attendance", label: "Attendance" },
    { href: "/classroom/documents", label: "Documents" },
    { href: "/classroom/payments", label: "Payments" },
    { href: "/classroom/ask-teacher", label: "Ask Teacher" },
    { href: "/classroom/re-admission", label: "Re-Admission" },
  ];

  return (
    <div className="min-h-screen bg-cream/50 flex flex-col">
      <header className="bg-white border-b border-line sticky top-0 z-40 no-print">
        <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between gap-4">
          <Logo href="/classroom/dashboard" />
          <div className="flex items-center gap-3">
            <Link href="/" className="hidden sm:block text-xs font-bold text-ink-soft hover:text-sky">
              ← Public site
            </Link>
            <span className="text-sm font-bold text-navy hidden sm:block">{session.name}</span>
            <LogoutButton dest="/classroom" />
          </div>
        </div>
        <PortalNav links={links} />
      </header>
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
