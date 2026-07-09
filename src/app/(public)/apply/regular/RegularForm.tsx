"use client";

import { useActionState } from "react";
import { submitRegular, type ApplyState } from "../actions";
import { Field, SelectField, PhotoField, ConsentField } from "@/components/forms/fields";

/** FR-ADM-02 field set. */
export function RegularForm() {
  const [state, action, pending] = useActionState<ApplyState, FormData>(submitRegular, null);

  return (
    <form action={action} className="space-y-5">
      <h2 className="font-display text-lg font-semibold text-navy">Student information</h2>
      <SelectField
        label="Applying for grade"
        name="grade"
        required
        options={[
          { value: "PRE_PRIMARY", label: "Pre-Primary" },
          { value: "CLASS_1", label: "Class 1" },
          { value: "CLASS_2", label: "Class 2" },
          { value: "CLASS_3", label: "Class 3" },
          { value: "CLASS_4", label: "Class 4" },
          { value: "CLASS_5", label: "Class 5" },
        ]}
      />
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Student's full name" name="applicantName" required autoComplete="name" />
        <Field label="Date of birth" name="dob" type="date" required />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <SelectField label="Gender" name="gender" required options={[{ value: "Male", label: "Male" }, { value: "Female", label: "Female" }]} />
        <SelectField
          label="Religion"
          name="religion"
          required
          options={[
            { value: "Islam", label: "Islam" },
            { value: "Hinduism", label: "Hinduism" },
            { value: "Christianity", label: "Christianity" },
            { value: "Buddhism", label: "Buddhism" },
            { value: "Other", label: "Other" },
          ]}
        />
      </div>
      <PhotoField />

      <h2 className="font-display text-lg font-semibold text-navy pt-2">Guardian information</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Father's name" name="fatherName" required />
        <Field label="Mother's name" name="motherName" required />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Guardian profession" name="guardianProfession" />
        <Field label="Guardian education" name="guardianEducation" />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Phone number" name="phone" required autoComplete="tel" placeholder="+82 10-…" />
        <Field label="Second phone (optional)" name="guardianPhone2" />
      </div>
      <Field label="Email (admission confirmation is sent here)" name="email" type="email" required autoComplete="email" />

      <h2 className="font-display text-lg font-semibold text-navy pt-2">Addresses</h2>
      <Field label="Address in Korea" name="addressKorea" required />
      <Field label="Address in Bangladesh" name="addressBangladesh" required />
      <Field label="Emergency contact (name + phone)" name="emergencyContact" required />

      <ConsentField />
      {state?.error && <p className="text-sm text-red-600 font-semibold">{state.error}</p>}
      <button
        disabled={pending}
        className="w-full bg-sunrise hover:bg-sunrise-deep disabled:opacity-60 text-white font-bold rounded-lg px-6 py-3.5 text-sm transition-colors"
      >
        {pending ? "Submitting…" : "Continue to payment →"}
      </button>
    </form>
  );
}
