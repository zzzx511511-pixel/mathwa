"use client";

import { FormEvent, useEffect, useState } from "react";

const LS_KEY = "mathwa-marketing-leads-preview-v1";

export type MarketingLeadRow = {
  id: string;
  name: string;
  phone: string;
  requestType: "buy" | "rent" | "management" | "consulting";
  propertyTypeWanted: string;
  budgetMin: string;
  budgetMax: string;
  preferredCity: string;
  source: "website" | "whatsapp" | "instagram" | "twitter" | "referral";
  interestedListingId: string;
  status: "new" | "contacted" | "interested" | "client" | "not_interested";
  notes: string;
  createdAt: string;
};

const empty: Omit<MarketingLeadRow, "id" | "createdAt"> = {
  name: "",
  phone: "",
  requestType: "buy",
  propertyTypeWanted: "",
  budgetMin: "",
  budgetMax: "",
  preferredCity: "",
  source: "website",
  interestedListingId: "",
  status: "new",
  notes: ""
};

function loadRows(): MarketingLeadRow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as MarketingLeadRow[];
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

function saveRows(rows: MarketingLeadRow[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(rows));
}

export function MarketingLeadsPanel() {
  const [rows, setRows] = useState<MarketingLeadRow[]>([]);
  const [form, setForm] = useState(empty);

  useEffect(() => {
    setRows(loadRows());
  }, []);

  function persist(next: MarketingLeadRow[]) {
    setRows(next);
    saveRows(next);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const row: MarketingLeadRow = {
      id: crypto.randomUUID(),
      ...form,
      createdAt: new Date().toISOString()
    };
    persist([row, ...rows]);
    setForm(empty);
  }

  function remove(id: string) {
    persist(rows.filter((r) => r.id !== id));
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-2xl border border-ink-900/10 bg-white p-6 shadow-sm"
      >
        <h3 className="text-lg font-bold text-brand-400">إضافة عميل محتمل (Lead)</h3>
        <p className="text-sm text-ink-900/70">
          تخزين محلي للمعاينة فقط؛ مع Supabase + RLS يُعرض لكل موظف طلباته المعنّاة فقط، مع محرك المطابقة
          التلقائي عند إضافة عرض جديد.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-ink-900/80">الاسم</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-ink-900/15 px-3 py-2.5 outline-none focus:border-brand-400"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink-900/80">الجوال</label>
            <input
              required
              inputMode="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-ink-900/15 px-3 py-2.5 outline-none focus:border-brand-400"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink-900/80">نوع الطلب</label>
            <select
              value={form.requestType}
              onChange={(e) =>
                setForm((f) => ({ ...f, requestType: e.target.value as MarketingLeadRow["requestType"] }))
              }
              className="mt-1 w-full rounded-xl border border-ink-900/15 px-3 py-2.5 outline-none focus:border-brand-400"
            >
              <option value="buy">شراء</option>
              <option value="rent">إيجار</option>
              <option value="management">إدارة</option>
              <option value="consulting">استشارة</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink-900/80">نوع العقار المطلوب</label>
            <input
              value={form.propertyTypeWanted}
              onChange={(e) => setForm((f) => ({ ...f, propertyTypeWanted: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-ink-900/15 px-3 py-2.5 outline-none focus:border-brand-400"
              placeholder="اختياري"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink-900/80">الحد الأدنى للميزانية</label>
            <input
              value={form.budgetMin}
              onChange={(e) => setForm((f) => ({ ...f, budgetMin: e.target.value }))}
              inputMode="decimal"
              className="mt-1 w-full rounded-xl border border-ink-900/15 px-3 py-2.5 outline-none focus:border-brand-400"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink-900/80">الحد الأعلى للميزانية</label>
            <input
              value={form.budgetMax}
              onChange={(e) => setForm((f) => ({ ...f, budgetMax: e.target.value }))}
              inputMode="decimal"
              className="mt-1 w-full rounded-xl border border-ink-900/15 px-3 py-2.5 outline-none focus:border-brand-400"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink-900/80">المدينة المفضلة</label>
            <input
              value={form.preferredCity}
              onChange={(e) => setForm((f) => ({ ...f, preferredCity: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-ink-900/15 px-3 py-2.5 outline-none focus:border-brand-400"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink-900/80">المصدر</label>
            <select
              value={form.source}
              onChange={(e) =>
                setForm((f) => ({ ...f, source: e.target.value as MarketingLeadRow["source"] }))
              }
              className="mt-1 w-full rounded-xl border border-ink-900/15 px-3 py-2.5 outline-none focus:border-brand-400"
            >
              <option value="website">الموقع</option>
              <option value="whatsapp">واتساب</option>
              <option value="instagram">إنستغرام</option>
              <option value="twitter">تويتر</option>
              <option value="referral">إحالة</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-ink-900/80">معرّف عرض مرتبط (اختياري)</label>
            <input
              value={form.interestedListingId}
              onChange={(e) => setForm((f) => ({ ...f, interestedListingId: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-ink-900/15 px-3 py-2.5 font-mono text-sm outline-none focus:border-brand-400"
              placeholder="UUID بعد التفعيل"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink-900/80">الحالة</label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value as MarketingLeadRow["status"] }))
              }
              className="mt-1 w-full rounded-xl border border-ink-900/15 px-3 py-2.5 outline-none focus:border-brand-400"
            >
              <option value="new">جديد</option>
              <option value="contacted">تم التواصل</option>
              <option value="interested">مهتم</option>
              <option value="client">عميل</option>
              <option value="not_interested">غير مهتم</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-ink-900/80">ملاحظات</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={3}
            className="mt-1 w-full rounded-xl border border-ink-900/15 px-3 py-2.5 outline-none focus:border-brand-400"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-brand-400"
        >
          حفظ Lead (معاينة)
        </button>
      </form>

      <section className="rounded-2xl border border-ink-900/10 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-brand-400">القائمة</h3>
        {rows.length === 0 ? (
          <p className="mt-4 text-sm text-ink-900/65">لا توجد طلبات محفوظة بعد.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {rows.map((r) => (
              <li
                key={r.id}
                className="flex flex-col gap-2 rounded-xl border border-ink-900/10 bg-[#faf8f5] p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div>
                  <p className="font-bold text-ink-900">
                    {r.name} — <span dir="ltr">{r.phone}</span>
                  </p>
                  <p className="mt-1 text-xs text-ink-900/70">
                    {r.requestType} · {r.source} · {r.status}
                    {r.preferredCity ? ` · ${r.preferredCity}` : ""}
                  </p>
                  {r.notes ? <p className="mt-2 text-sm text-ink-900/80">{r.notes}</p> : null}
                </div>
                <button
                  type="button"
                  onClick={() => remove(r.id)}
                  className="shrink-0 self-start rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                >
                  حذف
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
