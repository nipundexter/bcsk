"use client";

export const inputCls =
  "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm focus:border-sky focus:outline-none";

export function Field({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-ink">
        {label} {required && <span className="text-sunrise">*</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`mt-1.5 ${inputCls}`}
      />
    </label>
  );
}

export function SelectField({
  label,
  name,
  required = false,
  options,
  placeholder,
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-ink">
        {label} {required && <span className="text-sunrise">*</span>}
      </span>
      <select name={name} required={required} defaultValue="" className={`mt-1.5 ${inputCls}`}>
        <option value="" disabled>
          {placeholder ?? "Select…"}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function PhotoField({ label = "Applicant photo (JPG/PNG, max 1 MB)" }: { label?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-ink">
        {label} <span className="text-sunrise">*</span>
      </span>
      <input
        type="file"
        name="photo"
        accept="image/jpeg,image/png,image/webp"
        required
        className="mt-1.5 block w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-cream file:px-4 file:py-2.5 file:text-xs file:font-bold file:text-navy"
      />
    </label>
  );
}

export function ConsentField() {
  return (
    <label className="flex items-start gap-3 bg-cream rounded-xl p-4">
      <input type="checkbox" name="parentalConsent" required className="mt-0.5" />
      <span className="text-xs text-ink leading-relaxed">
        <span className="font-bold">Parental consent (required).</span> As the parent/legal guardian, I consent to
        BCSK collecting and processing this child's personal information for admission and school operations, in
        accordance with South Korea's Personal Information Protection Act (PIPA) and the school's{" "}
        <a href="/privacy-policy" target="_blank" className="text-sky font-bold hover:underline">Privacy Policy</a>.
      </span>
    </label>
  );
}
