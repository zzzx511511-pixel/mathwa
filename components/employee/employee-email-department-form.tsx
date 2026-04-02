"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";
import {
  DEPARTMENT_KEYS,
  departmentHubPaths,
  departmentLabels,
  type DepartmentKey
} from "@/lib/employee/department-keys";
import { syncPublicUserRole } from "@/lib/auth/sync-public-user-role";

function mapErr(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials") || m.includes("invalid credentials")) {
    return "البريد أو كلمة المرور غير صحيحة.";
  }
  if (m.includes("email not confirmed")) {
    return "يرجى تأكيد البريد قبل تسجيل الدخول.";
  }
  return msg;
}

export function EmployeeEmailDepartmentForm() {
  const router = useRouter();
  const [department, setDepartment] = useState<DepartmentKey>("estates");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const { data, error: signErr } = await supabaseClient.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      if (signErr) throw signErr;
      const user = data.user;
      if (!user) throw new Error("لم يُرجع الخادم مستخدماً.");

      const prev = (user.user_metadata ?? {}) as Record<string, unknown>;
      await supabaseClient.auth.updateUser({
        data: { ...prev, role: "employee" }
      });

      const sync = await syncPublicUserRole(user.id, "employee");
      if (!sync.ok) {
        setErrorMessage(sync.message ?? "تعذّر مزامنة دور الموظف في قاعدة البيانات.");
        setLoading(false);
        return;
      }

      const sessionRes = await fetch("/api/employee/email-department-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ department })
      });

      if (!sessionRes.ok) {
        const j = (await sessionRes.json().catch(() => ({}))) as {
          error?: string;
          detail?: string;
        };
        if (j.error === "department_denied") {
          setErrorMessage(
            j.detail ??
              "لا يمكنك الدخول لهذا القسم. اطلب من المسؤول إضافة القسم في allowed_departments في بيانات حسابك (Supabase)."
          );
        } else {
          setErrorMessage("تعذّر تفعيل جلسة القسم؛ حاول مرة أخرى.");
        }
        setLoading(false);
        await supabaseClient.auth.signOut();
        return;
      }

      const payload = (await sessionRes.json()) as { redirectTo?: string };
      await supabaseClient.auth.getSession();
      router.replace(payload.redirectTo ?? departmentHubPaths[department]);
      router.refresh();
    } catch (err) {
      setErrorMessage(mapErr(err instanceof Error ? err.message : "حدث خطأ."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-md space-y-4 rounded-2xl border border-brand-200/80 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-bold text-brand-400">دخول بالبريد وكلمة المرور</h2>
      <p className="text-sm leading-relaxed text-ink-900/75">
        اختر <strong>قسم عملك</strong> ثم أدخل البريد وكلمة المرور الصادرين من الإدارة لحسابك في النظام.
      </p>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink-900/85">القسم</span>
        <select
          className="w-full rounded-lg border border-ink-900/15 bg-white px-3 py-2.5 text-ink-900 outline-none focus:border-brand-400"
          value={department}
          onChange={(e) => setDepartment(e.target.value as DepartmentKey)}
          required
        >
          {DEPARTMENT_KEYS.map((k) => (
            <option key={k} value={k}>
              {departmentLabels[k]}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink-900/85">البريد الإلكتروني</span>
        <input
          className="w-full rounded-lg border border-ink-900/15 bg-white px-3 py-2.5 text-ink-900 outline-none focus:border-brand-400"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink-900/85">كلمة المرور</span>
        <input
          className="w-full rounded-lg border border-ink-900/15 bg-white px-3 py-2.5 text-ink-900 outline-none focus:border-brand-400"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
        className="w-full rounded-xl bg-brand-500 px-4 py-3 text-sm font-bold text-white shadow hover:bg-brand-400 disabled:opacity-60"
      >
        {loading ? "جارٍ الدخول…" : "دخول إلى القسم المختار"}
      </button>
    </form>
  );
}
