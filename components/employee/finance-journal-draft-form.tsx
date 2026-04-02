"use client";

import { FormEvent, useState } from "react";

export function FinanceJournalDraftForm() {
  const [entryType, setEntryType] = useState<"expense" | "revenue" | "memo">("memo");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOk(false);
    try {
      const res = await fetch("/api/employee/finance/journal-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryType,
          amount: amount.trim(),
          description: description.trim(),
          reference: reference.trim()
        })
      });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) throw new Error(j.error || "تعذّر حفظ المسودة.");
      setOk(true);
      setAmount("");
      setDescription("");
      setReference("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ.");
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
        <label className="block text-sm font-semibold text-ink-900/80">نوع القيد</label>
        <select
          value={entryType}
          onChange={(e) => setEntryType(e.target.value as typeof entryType)}
          className="mt-1 w-full rounded-xl border border-ink-900/15 px-3 py-2.5 outline-none focus:border-brand-400"
        >
          <option value="memo">مذكرة داخلية</option>
          <option value="expense">مصروف (مسودة)</option>
          <option value="revenue">إيراد (مسودة)</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold text-ink-900/80">المبلغ (اختياري)</label>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          className="mt-1 w-full rounded-xl border border-ink-900/15 px-3 py-2.5 outline-none focus:border-brand-400"
          placeholder="0.00"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-ink-900/80">البيان / الوصف</label>
        <textarea
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-xl border border-ink-900/15 px-3 py-2.5 outline-none focus:border-brand-400"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-ink-900/80">مرجع (فاتورة / عقد — اختياري)</label>
        <input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          className="mt-1 w-full rounded-xl border border-ink-900/15 px-3 py-2.5 outline-none focus:border-brand-400"
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {ok ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          تم تسجيل المسودة (معاينة). سيتم ربطها بجدول القيود عند التفعيل.
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-400 disabled:opacity-60"
      >
        {loading ? "جاري الحفظ…" : "حفظ مسودة"}
      </button>
    </form>
  );
}
