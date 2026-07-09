import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDict } from "@/lib/i18n";
import { ADMIN_ROLES } from "@/lib/constants";
import { LoginCard } from "@/components/portal/LoginCard";
import { loginAdmin } from "@/lib/actions/auth-actions";

/** FR-ADMIN-01: Admin login with RBAC. */
export default async function AdminLoginPage() {
  const session = await getSession();
  if (session && ADMIN_ROLES.includes(session.role)) redirect("/admin/dashboard");
  const { t } = await getDict();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-navy/5">
      <LoginCard
        title={t.auth.adminLogin}
        idLabel={t.auth.adminId}
        passwordLabel={t.auth.password}
        loginLabel={t.auth.login}
        forgotLabel={t.auth.forgotPassword}
        invalidMessage={t.auth.invalidCredentials}
        action={loginAdmin}
        demoHint="Demo: admin / bcsk1234"
      />
    </div>
  );
}
