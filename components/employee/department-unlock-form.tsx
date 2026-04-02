"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEPARTMENT_KEYS,
  departmentLabels,
  type DepartmentKey
} from "@/lib/employee/department-keys";
import {
  EMPLOYEE_PORTAL_CODE_LENGTH,
  isValidEmployeePortalCode
} from "@/lib/employee/employee-portal-code";

type Props = {
  initialDepartment: DepartmentKey;
  returnTo: string;
};

export function DepartmentUnlockForm({ initialDepartment, returnTo }: Props) {
  const router = useRouter();
  const [department, setDepartment] = useState<DepartmentKey>(initialDepartment);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function setDigitsOnly(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, EMPLOYEE_PORTAL_CODE_LENGTH);
    setCode(digits);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    if (!isValidEmployeePortalCode(code)) {
      setLoading(false);
      setErrorMessage(`أدخل ${EMPLOYEE_PORTAL_CODE_LENGTH} أرقام بالضبط كما أعطاك المسؤول.`);
      return;
    }
    const res = await fetch("/api/employee/department-unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ department, code: code.trim() })
    });
    setLoading(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (j.error === "invalid_format") {
        setErrorMessage(`يجب إدخال ${EMPLOYEE_PORTAL_CODE_LENGTH} أرقام بالضبط.`);
        return;
      }
      setErrorMessage(
        j.error === "wrong_code"
          ? "رقم التعريف غير صحيح لهذا القسم."
          : "تعذّر التحقق. تحقق من الاتصال أو من تشغيل سكربت قاعدة البيانات (راجع docs)."
      );
      return;
    }
    router.replace(returnTo);
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border border-ink-900/10 bg-white p-6 shadow-sm"
    >
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink-900/80">القسم</span>
        <select
          className="w-full rounded-md border border-ink-900/15 bg-white px-3 py-2 text-ink-900 outline-none focus:border-brand-400"
          value={department}
          onChange={(e) => setDepartment(e.target.value as DepartmentKey)}
        >
          {DEPARTMENT_KEYS.map((k) => (
            <option key={k} value={k}>
              {departmentLabels[k]}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink-900/80">
          رقم التعريف ({EMPLOYEE_PORTAL_CODE_LENGTH} أرقام — يصدره المسؤول لكل موظف وقسم)
        </span>
        <input
          className="w-full rounded-md border border-ink-900/15 bg-white px-3 py-2 font-mono text-xl tracking-[0.35em] text-ink-900 outline-none focus:border-brand-400"
          value={code}
          onChange={(e) => setDigitsOnly(e.target.value)}
          autoComplete="one-time-code"
          inputMode="numeric"
          pattern="\d{4}"
          maxLength={EMPLOYEE_PORTAL_CODE_LENGTH}
          placeholder="••••"
          required
        />
      </label>

      {errorMessage ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-brand-400 px-4 py-3 text-sm font-bold text-white shadow hover:bg-brand-500 disabled:opacity-60"
      >
        {loading ? "جارٍ التحقق…" : "تأكيد الدخول للقسم"}
      </button>
    </form>
  );
}
