"use client";

import { useEffect, useMemo, useState } from "react";

type Owner = { id: string; full_name: string };
type Property = { id: string; name: string; location?: string; city?: string };

type InvoiceRow = Record<string, unknown>;

const STATUS_OPTIONS: Array<{ value: "pending" | "approved" | "rejected"; label: string }> = [
  { value: "pending", label: "قيد المراجعة" },
  { value: "approved", label: "معتمد" },
  { value: "rejected", label: "مرفوض" }
];

function fmtDate(v: unknown): string {
  if (v == null || v === "") return "—";
  const s = String(v);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

function shortText(v: unknown, max = 56): string {
  if (v == null || v === "") return "—";
  const s = String(v).replace(/\s+/g, " ").trim();
  return s.length <= max ? s : `${s.slice(0, max)}…`;
}

function fmtAmount(v: unknown): string {
  if (v == null || v === "") return "—";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return `${n.toLocaleString("ar-SA")} ر.س`;
}

const INV_STATUS: Record<string, string> = { pending: "قيد المراجعة", approved: "معتمد", rejected: "مرفوض" };
function fmtInvoiceStatus(v: unknown): string {
  const s = String(v ?? "").toLowerCase();
  return INV_STATUS[s] ?? (s || "—");
}

function anyId(row: Record<string, unknown>): string {
  return String(row?.id ?? row?.request_id ?? row?.uuid ?? "—");
}

export function MaintenanceInvoicesView({
  initialRows
}: {
  initialRows: InvoiceRow[];
}) {
  const [rows, setRows] = useState<InvoiceRow[]>(initialRows);
  const [open, setOpen] = useState(false);
  const [loadingOwners, setLoadingOwners] = useState(false);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [owners, setOwners] = useState<Owner[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);

  const [ownerId, setOwnerId] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending");

  const propertyLabel = useMemo(() => {
    const p = properties.find((x) => x.id === propertyId);
    if (!p) return "";
    const tail = [p.location, p.city].filter(Boolean).join(" - ");
    return tail ? `${p.name} (${tail})` : p.name;
  }, [properties, propertyId]);

  useEffect(() => {
    if (!open || owners.length > 0) return;
    (async () => {
      setLoadingOwners(true);
      setError(null);
      const res = await fetch("/api/employee/owners/list");
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; owners?: Owner[] };
      setLoadingOwners(false);
      if (!res.ok || !data.ok) {
        setError(data.error ?? "تعذر جلب الملاك.");
        return;
      }
      setOwners((data.owners ?? []).map((o) => ({ id: String(o.id), full_name: String(o.full_name) })));
    })();
  }, [open, owners.length]);

  useEffect(() => {
    if (!ownerId) {
      setProperties([]);
      setPropertyId("");
      return;
    }
    (async () => {
      setLoadingProperties(true);
      setError(null);
      setProperties([]);
      setPropertyId("");
      const res = await fetch("/api/employee/properties/list-by-owner", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ownerId })
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; properties?: Property[] };
      setLoadingProperties(false);
      if (!res.ok || !data.ok) {
        setError(data.error ?? "تعذر جلب عقارات المالك.");
        return;
      }
      setProperties((data.properties ?? []).map((p) => ({ id: String(p.id), name: String(p.name), location: String((p as any).location ?? ""), city: String((p as any).city ?? "") })));
    })();
  }, [ownerId]);

  async function onSave() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/employee/maintenance-invoices/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ownerId,
        propertyId,
        amount,
        description,
        status
      })
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; invoice?: Record<string, unknown> };
    setSaving(false);
    if (!res.ok || !data.ok || !data.invoice) {
      setError(data.error ?? "تعذر حفظ الفاتورة.");
      return;
    }
    // Update UI immediately.
    setRows((prev) => [data.invoice as InvoiceRow, ...prev]);
    setOpen(false);
    setOwnerId("");
    setPropertyId("");
    setAmount("");
    setDescription("");
    setStatus("pending");
  }

  return (
    <div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-ink-900/70">إضافة فاتورة جديدة ستظهر فورًا في الجدول بعد الحفظ.</div>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setOpen(true);
          }}
          className="rounded-full bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600"
        >
          إضافة فاتورة
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : null}

      {open ? (
        <div className="mt-4 rounded-2xl border border-ink-900/10 bg-brand-50/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold text-brand-500">إضافة فاتورة صيانة</h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-ink-900/10 bg-white px-3 py-1 text-sm font-semibold text-ink-900/70 hover:border-gold-400"
            >
              إغلاق
            </button>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-ink-900/80">المالك</span>
              <select
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="w-full rounded-xl border border-ink-900/15 bg-white px-3 py-2 text-ink-900 outline-none focus:border-brand-400"
                disabled={loadingOwners}
              >
                <option value="">{loadingOwners ? "جارٍ تحميل الملاك..." : "اختر المالك"}</option>
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.full_name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-ink-900/80">العقار</span>
              <select
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="w-full rounded-xl border border-ink-900/15 bg-white px-3 py-2 text-ink-900 outline-none focus:border-brand-400"
                disabled={!ownerId || loadingProperties}
              >
                <option value="">
                  {!ownerId ? "اختر المالك أولاً" : loadingProperties ? "جارٍ تحميل العقارات..." : "اختر العقار"}
                </option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {propertyLabel ? <div className="mt-1 text-xs text-ink-900/65">{propertyLabel}</div> : null}
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-ink-900/80">المبلغ</span>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                className="w-full rounded-xl border border-ink-900/15 bg-white px-3 py-2 text-ink-900 outline-none focus:border-brand-400"
                placeholder="مثال: 350"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-ink-900/80">الحالة</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full rounded-xl border border-ink-900/15 bg-white px-3 py-2 text-ink-900 outline-none focus:border-brand-400"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block md:col-span-2">
              <span className="mb-1 block text-sm font-semibold text-ink-900/80">الوصف</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-ink-900/15 bg-white px-3 py-2 text-ink-900 outline-none focus:border-brand-400"
                placeholder="وصف مختصر للفواتير/الأعمال"
              />
            </label>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={onSave}
              disabled={saving || !ownerId || !propertyId || !amount}
              className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {saving ? "جارٍ الحفظ..." : "حفظ الفاتورة"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-ink-900/15 bg-white px-4 py-2 text-sm font-semibold text-ink-900/70 hover:border-gold-400"
            >
              إلغاء
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-5 overflow-x-auto rounded-2xl border border-ink-900/10">
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <thead className="bg-brand-100 text-ink-900/85">
            <tr>
              <th className="px-3 py-3 text-right font-semibold">المعرّف</th>
              <th className="px-3 py-3 text-right font-semibold">الحالة</th>
              <th className="px-3 py-3 text-right font-semibold">العقار</th>
              <th className="px-3 py-3 text-right font-semibold">المبلغ</th>
              <th className="px-3 py-3 text-right font-semibold">الوصف</th>
              <th className="px-3 py-3 text-right font-semibold">تاريخ الإنشاء</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-ink-900/70" colSpan={6}>
                  لا توجد فواتير.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={anyId(row)} className="border-t border-ink-900/5 hover:bg-brand-50/40">
                  <td className="px-3 py-3 font-mono text-xs">{anyId(row).slice(0, 8)}…</td>
                  <td className="px-3 py-3 text-ink-900/80">{fmtInvoiceStatus(row.status)}</td>
                  <td className="px-3 py-3 font-mono text-xs text-ink-900/70">{String(row.property_id ?? "—")}</td>
                  <td className="px-3 py-3 tabular-nums text-ink-900/80">{fmtAmount(row.amount)}</td>
                  <td className="max-w-[14rem] px-3 py-3 text-ink-900/75">{shortText(row.description)}</td>
                  <td className="px-3 py-3 tabular-nums text-ink-900/70">{fmtDate(row.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

