import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDict } from "@/lib/i18n";
import { LoginCard } from "@/components/portal/LoginCard";
import { loginTeacher } from "@/lib/actions/auth-actions";

/** FR-TCH-01: Office login (Teacher ID + Password). */
export default async function OfficeLoginPage() {
  const session = await getSession();
  if (session?.role === "TEACHER") redirect("/office/dashboard");
  const { t } = await getDict();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-sky-soft/50">
      <LoginCard
        title={t.auth.teacherLogin}
        idLabel={t.auth.teacherId}
        passwordLabel={t.auth.password}
        loginLabel={t.auth.login}
        forgotLabel={t.auth.forgotPassword}
        invalidMessage={t.auth.invalidCredentials}
        action={loginTeacher}
        accent="bg-sky hover:bg-sky/85"
        demoHint="Demo: BCSK-T-003 / bcsk1234"
      />
    </div>
  );
}
