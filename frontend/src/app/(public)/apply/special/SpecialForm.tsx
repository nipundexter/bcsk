"use client";

import { Recaptcha } from "@/components/forms/Recaptcha";

import { useActionState } from "react";
import { submitSpecial, type ApplyState } from "../actions";
import { Field, PhotoField, ConsentField, inputCls } from "@/components/forms/fields";

/** FR-ADM-03 field set. */
export function SpecialForm({
  courses,
  preselect,
  recaptchaSiteKey,
}: {
  courses: { value: string; label: string }[];
  preselect?: string;
  recaptchaSiteKey: string;
}) {
  const [state, action, pending] = useActionState<ApplyState, FormData>(submitSpecial, null);

  return (
    <form action={action} className="space-y-5">
      <label className="block">
        <span className="text-xs font-bold text-ink">Course <span className="text-sunrise">*</span></span>
        <select name="courseName" required defaultValue={preselect ?? ""} className={`mt-1.5 ${inputCls}`}>
          <option value="" disabled>Choose a course…</option>
          {courses.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Applicant's full name" name="applicantName" required autoComplete="name" />
        <Field label="Date of birth" name="dob" type="date" required />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-xs font-bold text-ink">Gender <span className="text-sunrise">*</span></span>
          <select name="gender" required defaultValue="" className={`mt-1.5 ${inputCls}`}>
            <option value="" disabled>Select…</option>
            <option>Male</option>
            <option>Female</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-bold text-ink">Religion <span className="text-sunrise">*</span></span>
          <select name="religion" required defaultValue="" className={`mt-1.5 ${inputCls}`}>
            <option value="" disabled>Select…</option>
            <option>Islam</option>
            <option>Hinduism</option>
            <option>Christianity</option>
            <option>Buddhism</option>
            <option>Other</option>
          </select>
        </label>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Phone number" name="phone" required autoComplete="tel" placeholder="+82 10-…" />
        <Field label="Email" name="email" type="email" required autoComplete="email" />
      </div>
      <Field label="Highest education (for adult programs)" name="highestEducation" />
      <PhotoField />
      <Field label="Address in Korea (optional)" name="addressKorea" />
      <Field label="Address in Bangladesh" name="addressBangladesh" required />
      <Field label="Emergency contact (name + phone)" name="emergencyContact" required />

      <label className="flex items-start gap-3 bg-sky-soft rounded-xl p-4">
        <input type="checkbox" name="isBcskStudent" className="mt-0.5" />
        <span className="text-xs text-ink leading-relaxed">
          <span className="font-bold">The applicant is a current BCSK regular student.</span> BCSK students pay the
          discounted course fee (verified against school records).
        </span>
      </label>

      <ConsentField />
      {state?.error && <p className="text-sm text-red-600 font-semibold">{state.error}</p>}
      <Recaptcha siteKey={recaptchaSiteKey} />
      <button
        disabled={pending}
        className="w-full bg-sunrise hover:bg-sunrise-deep disabled:opacity-60 text-white font-bold rounded-lg px-6 py-3.5 text-sm transition-colors"
      >
        {pending ? "Submitting…" : "Continue to payment →"}
      </button>
    </form>
  );
}
