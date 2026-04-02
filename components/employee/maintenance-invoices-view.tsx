"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getInvoiceImageViewerHref } from "@/lib/maintenance-invoice-image";

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

/** Accepts Arabic/English digits and common separators so the Save button matches a valid amount. */
function parseAmountInput(raw: string): number | null {
  const map: Record<string, string> = {
    "٠": "0",
    "١": "1",
    "٢": "2",
    "٣": "3",
    "٤": "4",
    "٥": "5",
    "٦": "6",
    "٧": "7",
    "٨": "8",
    "٩": "9",
    "۰": "0",
    "۱": "1",
    "۲": "2",
    "۳": "3",
    "۴": "4",
    "۵": "5",
    "۶": "6",
    "۷": "7",
    "۸": "8",
    "۹": "9"
  };
  let s = raw.trim().replace(/\s/g, "");
  s = [...s].map((ch) => map[ch] ?? ch).join("");
  s = s.replace(/\u066C/g, ".").replace(/,/g, "");
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [owners, setOwners] = useState<Owner[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);

  const [ownerId, setOwnerId] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageLabel, setImageLabel] = useState("");
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const propertyLabel = useMemo(() => {
    const p = properties.find((x) => x.id === propertyId);
    if (!p) return "";
    const tail = [p.location, p.city].filter(Boolean).join(" - ");
    return tail ? `${p.name} (${tail})` : p.name;
  }, [properties, propertyId]);

  const amountNumber = useMemo(() => parseAmountInput(amount), [amount]);
  const canSave = Boolean(ownerId && propertyId && amountNumber != null);

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
    setError(null);
    if (!ownerId) {
      setError("اختر المالك.");
      return;
    }
    if (!propertyId) {
      setError("اختر العقار.");
      return;
    }
    const parsed = parseAmountInput(amount);
    if (parsed == null) {
      setError("أدخل مبلغًا صحيحًا أكبر من صفر (يمكنك استخدام الأرقام العربية أو الإنجليزية).");
      return;
    }

    setSaving(true);
    try {
      let uploadedImageUrl = "";
      let uploadedPath = "";
      if (imageFile) {
        const form = new FormData();
        form.append("file", imageFile);
        const uploadRes = await fetch("/api/employee/maintenance-invoices/upload-image", {
          method: "POST",
          body: form
        });
        const uploadData = (await uploadRes.json().catch(() => ({}))) as {
          ok?: boolean;
          error?: string;
          path?: string;
          publicUrl?: string | null;
        };
        if (!uploadRes.ok || !uploadData.ok) {
          setError(uploadData.error ?? "تعذر رفع صورة الفاتورة. تأكد من وجود bucket invoices وصلاحيات التخزين.");
          return;
        }
        uploadedImageUrl = String(uploadData.publicUrl ?? "").trim();
        uploadedPath = String(uploadData.path ?? "").trim();
      }

      const res = await fetch("/api/employee/maintenance-invoices/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ownerId,
          propertyId,
          amount: parsed,
          description,
          imageUrl: uploadedImageUrl || null,
          imagePath: uploadedPath || null,
          status
        })
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; invoice?: Record<string, unknown> };
      if (!res.ok || !data.ok || !data.invoice) {
        setError(data.error ?? "تعذر حفظ الفاتورة.");
        return;
      }
      setRows((prev) => [data.invoice as InvoiceRow, ...prev]);
      setOpen(false);
      setOwnerId("");
      setPropertyId("");
      setAmount("");
      setDescription("");
      setImageFile(null);
      setImageLabel("");
      setStatus("pending");
    } catch {
      setError("حدث خطأ غير متوقع أثناء الحفظ. حاول مرة أخرى.");
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteInvoice(invoiceId: string) {
    if (!confirm("حذف هذه الفاتورة نهائيًا؟")) return;
    setDeletingId(invoiceId);
    setError(null);
    const res = await fetch("/api/employee/maintenance-invoices/delete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ invoiceId })
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    setDeletingId(null);
    if (!res.ok || !data.ok) {
      setError(data.error ?? "تعذر حذف الفاتورة.");
      return;
    }
    setRows((prev) => prev.filter((row) => anyId(row) !== invoiceId));
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

            <label className="block md:col-span-2">
              <span className="mb-1 block text-sm font-semibold text-ink-900/80">صورة الفاتورة</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setImageFile(file);
                  setImageLabel(file ? file.name : "");
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl border border-brand-400 bg-white px-4 py-2 text-sm font-bold text-brand-500 hover:bg-brand-50"
              >
                إرفاق صورة الفاتورة
              </button>
              <div className="mt-1 text-xs text-ink-900/65">{imageLabel || "لم يتم اختيار صورة"}</div>
            </label>
          </div>

          <div className="mt-3 flex flex-col gap-2">
            {!canSave && !saving ? (
              <p className="text-xs text-ink-900/60">
                لإظهار زر الحفظ: اختر المالك والعقار، ثم أدخل مبلغًا صحيحًا (أكبر من صفر). الصورة اختيارية.
              </p>
            ) : null}
            <div className="flex gap-2">
            <button
              type="button"
              onClick={onSave}
              disabled={saving || !canSave}
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
        </div>
      ) : null}

      <p className="mt-2 text-xs text-ink-900/55">
        إن لم تظهر أعمدة «الصورة» أو «حذف»، مرّر الجدول أفقيًا — أو وسّع نافذة المتصفح.
      </p>
      <div className="mt-3 overflow-x-auto rounded-2xl border border-ink-900/10">
        <table className="w-full min-w-[960px] border-collapse text-sm">
          <thead className="bg-brand-100 text-ink-900/85">
            <tr>
              <th className="sticky right-0 z-10 whitespace-nowrap bg-brand-100 px-3 py-3 text-right font-semibold shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.12)]">
                حذف
              </th>
              <th className="px-3 py-3 text-right font-semibold">الصورة</th>
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
                <td className="px-4 py-6 text-ink-900/70" colSpan={8}>
                  لا توجد فواتير.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const rowId = anyId(row);
                const imgHref = getInvoiceImageViewerHref(row);
                return (
                <tr key={rowId} className="group border-t border-ink-900/5 hover:bg-brand-50/40">
                  <td className="sticky right-0 z-10 whitespace-nowrap border-l border-ink-900/10 bg-white px-3 py-3 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)] group-hover:bg-brand-50/40">
                    <button
                      type="button"
                      onClick={() => onDeleteInvoice(rowId)}
                      disabled={deletingId === rowId}
                      className="rounded-full border border-red-500/50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-60"
                    >
                      {deletingId === rowId ? "جارٍ الحذف..." : "حذف الفاتورة"}
                    </button>
                  </td>
                  <td className="px-3 py-3 text-ink-900/75">
                    {imgHref ? (
                      <a
                        href={imgHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-lg border border-brand-400/40 bg-white px-2 py-1 text-base hover:border-brand-500"
                        title="عرض صورة الفاتورة"
                      >
                        🖼️
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-3 font-mono text-xs">
                    <Link
                      prefetch={false}
                      href={`/employee/maintenance/${rowId}`}
                      className="font-medium text-brand-500 hover:underline"
                    >
                      {rowId.slice(0, 8)}…
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-ink-900/80">{fmtInvoiceStatus(row.status)}</td>
                  <td className="px-3 py-3 font-mono text-xs text-ink-900/70">{String(row.property_id ?? "—")}</td>
                  <td className="px-3 py-3 tabular-nums text-ink-900/80">{fmtAmount(row.amount)}</td>
                  <td className="max-w-[14rem] px-3 py-3 text-ink-900/75">{shortText(row.description)}</td>
                  <td className="px-3 py-3 tabular-nums text-ink-900/70">{fmtDate(row.created_at)}</td>
                </tr>
              );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

