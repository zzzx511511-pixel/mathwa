"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { OFFER_SECTION_FORM_OPTIONS, type OfferSectionKey } from "@/lib/marketing/offer-section";

type ListingRow = Record<string, unknown>;

function sectionLabel(v: unknown): string {
  const s = String(v ?? "");
  const o = OFFER_SECTION_FORM_OPTIONS.find((x) => x.value === s);
  return o?.label ?? s;
}

export function MarketingListingsManager() {
  const [rows, setRows] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/employee/marketing/offers/list");
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; listings?: ListingRow[]; error?: string };
    setLoading(false);
    if (!res.ok || !data.ok) {
      setError(data.error ?? "تعذر جلب العروض.");
      return;
    }
    setRows(data.listings ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onDelete(id: string) {
    if (!confirm("حذف هذا العرض نهائياً من قاعدة البيانات؟ لا يمكن التراجع.")) return;
    setDeletingId(id);
    setError(null);
    const res = await fetch("/api/employee/marketing/offers/delete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ listingId: id })
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    setDeletingId(null);
    if (!res.ok || !data.ok) {
      setError(data.error ?? "تعذر الحذف.");
      return;
    }
    setRows((prev) => prev.filter((r) => String(r.id) !== id));
  }

  async function onArchive(id: string, archive: boolean) {
    const msg = archive
      ? "إخفاء هذا العرض عن الموقع العام (يبقى في قاعدة البيانات)؟"
      : "إعادة نشر هذا العرض على الموقع؟";
    if (!confirm(msg)) return;
    setArchivingId(id);
    setError(null);
    const res = await fetch("/api/employee/marketing/offers/archive", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ listingId: id, archive })
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; status?: string };
    setArchivingId(null);
    if (!res.ok || !data.ok) {
      setError(data.error ?? "تعذر تحديث حالة العرض.");
      return;
    }
    setRows((prev) =>
      prev.map((r) => (String(r.id) === id ? { ...r, status: data.status ?? (archive ? "archived" : "published") } : r))
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-ink-900/10 bg-white p-8 text-sm text-ink-900/75">
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        جاري تحميل العروض…
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-ink-900/10 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-bold text-brand-400">عروض التسويق المحفوظة</h3>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-ink-900/15 px-3 py-1.5 text-sm font-semibold text-ink-900 hover:bg-brand-50"
        >
          تحديث القائمة
        </button>
      </div>
      {error ? (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-ink-900/70">لا توجد عروض في الجدول بعد، أو فشل الاتصال بـ Supabase.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((row) => {
            const id = String(row.id ?? "");
            const title = String(row.title ?? "—");
            const sec = row.offer_section as OfferSectionKey | undefined;
            const st = String(row.status ?? "published");
            const isArchived = st === "archived";
            return (
              <li
                key={id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-900/10 bg-[#faf8f5] px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink-900">{title}</p>
                  <p className="text-xs text-ink-900/60">
                    القسم: {sectionLabel(sec)} ·{" "}
                    <span className={isArchived ? "text-amber-800" : "text-emerald-800"}>
                      {isArchived ? "مؤرشف (مخفي عن الموقع)" : "منشور"}
                    </span>{" "}
                    ·{" "}
                    <Link href={`/offers/${id}`} className="text-brand-600 hover:underline" target="_blank" rel="noopener noreferrer">
                      معاينة الرابط
                    </Link>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {!isArchived ? (
                    <button
                      type="button"
                      disabled={archivingId === id || deletingId === id}
                      onClick={() => void onArchive(id, true)}
                      className="shrink-0 rounded-lg border border-amber-500/50 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 disabled:opacity-60"
                    >
                      {archivingId === id ? "جارٍ التحديث…" : "أرشفة"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={archivingId === id || deletingId === id}
                      onClick={() => void onArchive(id, false)}
                      className="shrink-0 rounded-lg border border-emerald-500/50 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-900 hover:bg-emerald-100 disabled:opacity-60"
                    >
                      {archivingId === id ? "جارٍ التحديث…" : "إعادة النشر"}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={deletingId === id || archivingId === id}
                    onClick={() => void onDelete(id)}
                    className="shrink-0 rounded-lg border border-red-500/50 bg-red-50 px-3 py-2 text-xs font-bold text-red-800 hover:bg-red-100 disabled:opacity-60"
                  >
                    {deletingId === id ? "جارٍ الحذف…" : "حذف نهائي"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
