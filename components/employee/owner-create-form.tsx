"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function OwnerCreateForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOk(false);
    try {
      const res = await fetch("/api/employee/owners/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          nationalId: nationalId.trim()
        })
      });
      const j = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        owner?: { id?: string };
      };
      if (!res.ok || !j.ok) {
        throw new Error(j.error || "تعذّر حفظ بيانات المالك.");
      }
      setOk(true);
      const ownerId = String(j.owner?.id ?? "").trim();
      setTimeout(() => {
        router.push(ownerId ? `/employee/owners/${ownerId}` : "/employee/owners");
        router.refresh();
      }, 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border border-ink-900/10 bg-white p-6 shadow-sm"
    >
      <div>
        <label className="block text-sm font-semibold text-ink-900/80">اسم المالك</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="mt-1 w-full rounded-xl border border-ink-900/15 bg-white px-3 py-2.5 text-ink-900 outline-none focus:border-brand-400"
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-ink-900/80">رقم الجوال</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            className="mt-1 w-full rounded-xl border border-ink-900/15 bg-white px-3 py-2.5 text-ink-900 outline-none focus:border-brand-400"
            placeholder="05xxxxxxxx"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-ink-900/80">رقم الهوية</label>
          <input
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
            inputMode="numeric"
            className="mt-1 w-full rounded-xl border border-ink-900/15 bg-white px-3 py-2.5 text-ink-900 outline-none focus:border-brand-400"
            placeholder="10 أرقام"
            required
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {ok ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          تم حفظ المالك بنجاح. جارٍ فتح ملف المالك…
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-brand-400 disabled:opacity-60"
        >
          {loading ? "جارٍ الحفظ…" : "حفظ المالك"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-ink-900/15 bg-white px-5 py-2.5 text-sm font-semibold text-ink-900/80 hover:border-gold-400 hover:bg-gold-400/10"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}

