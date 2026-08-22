import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { UserRowActions } from "./UserRowActions";
import { NewUserForm } from "./NewUserForm";

/** FR-ADMIN-06: users module — create/manage accounts, reset passwords, deactivate. */
export default async function UsersPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  await requirePermission("users:manage");
  const { role = "ALL" } = await searchParams;
  const users = await db.user.findMany({
    where: role === "ALL" ? {} : { role },
    include: { studentProfile: true, teacherProfile: true },
    orderBy: [{ role: "asc" }, { id: "asc" }],
    take: 300,
  });

  const tabs = ["ALL", "STUDENT", "TEACHER", "ADMIN_SUPPORT", "IT_SUPPORT", "SUPER_ADMIN"];

  return (
    <div className="max-w-5xl">
      <h1 className="font-display text-2xl font-semibold text-navy mb-6">Users</h1>
      <div className="flex flex-wrap gap-2 mb-5">
        {tabs.map((t) => (
          <Link
            key={t}
            href={`/admin/users?role=${t}`}
            className={`text-xs font-bold rounded-full px-4 py-2 transition-colors ${
              role === t ? "bg-navy text-white" : "bg-white border border-line text-ink-soft hover:text-navy"
            }`}
          >
            {t === "ALL" ? "All" : t.replace(/_/g, " ")}
          </Link>
        ))}
      </div>

      <NewUserForm />

      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-cream text-navy text-left">
              <th className="px-4 py-3.5 font-bold">Login ID</th>
              <th className="px-4 py-3.5 font-bold">Name</th>
              <th className="px-4 py-3.5 font-bold">Role</th>
              <th className="px-4 py-3.5 font-bold">Email</th>
              <th className="px-4 py-3.5 font-bold">Status</th>
              <th className="px-4 py-3.5 font-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-line">
                <td className="px-4 py-3 font-mono text-xs font-bold text-navy">{u.loginId}</td>
                <td className="px-4 py-3 font-bold text-ink">
                  {u.name}
                  {u.studentProfile && <span className="block text-[10px] font-body text-ink-soft">{u.studentProfile.classLevel}</span>}
                  {u.teacherProfile?.designation && <span className="block text-[10px] font-body text-ink-soft">{u.teacherProfile.designation}</span>}
                </td>
                <td className="px-4 py-3"><span className="text-[11px] font-bold bg-cream rounded-full px-2.5 py-1">{u.role.replace(/_/g, " ")}</span></td>
                <td className="px-4 py-3 text-ink-soft">{u.email ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-[11px] font-bold rounded-full px-2.5 py-1 ${u.active ? "bg-teal/15 text-teal" : "bg-red-50 text-red-600"}`}>
                    {u.active ? "Active" : "Deactivated"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <UserRowActions userId={u.id} active={u.active} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
