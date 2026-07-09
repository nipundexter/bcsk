import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDict } from "@/lib/i18n";
import { LoginCard } from "@/components/portal/LoginCard";
import { loginStudent } from "@/lib/actions/auth-actions";

/** FR-STU-01: Classroom login (Student ID + Password) with forgot-password and request-ID paths. */
export default async function ClassroomLoginPage() {
  const session = await getSession();
  if (session?.role === "STUDENT") redirect("/classroom/dashboard");
  const { t } = await getDict();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-cream/60">
      <LoginCard
        title={t.auth.studentLogin}
        idLabel={t.auth.studentId}
        passwordLabel={t.auth.password}
        loginLabel={t.auth.login}
        forgotLabel={t.auth.forgotPassword}
        requestIdLabel={t.auth.requestId}
        invalidMessage={t.auth.invalidCredentials}
        action={loginStudent}
        demoHint="Demo: BCSK-2026-0001 / bcsk1234"
      />
    </div>
  );
}
