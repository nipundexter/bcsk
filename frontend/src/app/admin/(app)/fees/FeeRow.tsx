"use client";

import { useTransition, useState } from "react";
import { updateFee } from "./actions";

type Fee = {
  id: number;
  label: string;
  kind: string;
  admissionFee: number;
  semesterFee: number;
  bookFee: number | null;
  bcskPrice: number | null;
  nonBcskPrice: number | null;
  active: boolean;
};

const cell = "w-24 rounded border border-line px-2 py-1.5 text-xs text-right focus:border-sky focus:outline-none";

export function FeeRow({ fee }: { fee: Fee }) {
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <tr className="border-t border-line">
      <td className="px-4 py-2.5">
        <span className="font-bold text-ink">{fee.label}</span>
        <span className="block text-[10px] text-ink-soft">{fee.kind.replace(/_/g, " ")}</span>
      </td>
      <FormCells
        fee={fee}
        pending={pending}
        saved={saved}
        error={error}
        onSave={(fd) =>
          start(async () => {
            const result = await updateFee(fee.id, fd);
            setError(result.error ?? null);
            if (!result.error) {
              setSaved(true);
              setTimeout(() => setSaved(false), 2000);
            }
          })
        }
      />
    </tr>
  );
}

function FormCells({ fee, pending, saved, error, onSave }: { fee: Fee; pending: boolean; saved: boolean; error: string | null; onSave: (fd: FormData) => void }) {
  // one form per row via form attribute
  const formId = `fee-${fee.id}`;
  return (
    <>
      <td className="px-4 py-2.5"><input form={formId} name="admissionFee" type="number" defaultValue={fee.admissionFee} className={cell} /></td>
      <td className="px-4 py-2.5"><input form={formId} name="semesterFee" type="number" defaultValue={fee.semesterFee} className={cell} /></td>
      <td className="px-4 py-2.5"><input form={formId} name="bookFee" type="number" defaultValue={fee.bookFee ?? ""} className={cell} /></td>
      <td className="px-4 py-2.5"><input form={formId} name="bcskPrice" type="number" defaultValue={fee.bcskPrice ?? ""} className={cell} /></td>
      <td className="px-4 py-2.5"><input form={formId} name="nonBcskPrice" type="number" defaultValue={fee.nonBcskPrice ?? ""} className={cell} /></td>
      <td className="px-4 py-2.5 text-center">
        <input form={formId} name="active" type="checkbox" defaultChecked={fee.active} className="w-4 h-4 accent-teal" />
      </td>
      <td className="px-4 py-2.5">
        <form id={formId} action={onSave} className="flex items-center gap-2">
          <button disabled={pending} className="bg-navy hover:bg-navy-deep disabled:opacity-60 text-white text-[11px] font-bold rounded-lg px-3 py-1.5 transition-colors">
            Save
          </button>
          {saved && <span className="text-[11px] font-bold text-teal">✓</span>}
          {error && <span className="text-[11px] font-semibold text-red-600">{error}</span>}
        </form>
      </td>
    </>
  );
}
