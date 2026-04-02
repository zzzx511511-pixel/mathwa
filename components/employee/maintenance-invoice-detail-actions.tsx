"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getInvoiceImageViewerHref } from "@/lib/maintenance-invoice-image";

export function MaintenanceInvoiceDetailActions({ invoice }: { invoice: Record<string, unknown> }) {
  const router = useRouter();
  const id = String(invoice.id ?? "").trim();
  const [deleting, setDeleting] = useState(false);
  const imgHref = getInvoiceImageViewerHref(invoice);

  async function onDelete() {
    if (!id || id === "—") return;
    if (!confirm("حذف هذه الفاتورة نهائيًا؟")) return;
    setDeleting(true);
    const res = await fetch("/api/employee/maintenance-invoices/delete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ invoiceId: id })
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    setDeleting(false);
    if (!res.ok || !data.ok) {
      alert(data.error ?? "تعذر حذف الفاتورة.");
      return;
    }
    router.push("/employee/maintenance");
    router.refresh();
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {imgHref ? (
        <a
          href={imgHref}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-brand-400 bg-brand-50 px-4 py-2 text-sm font-bold text-brand-600 hover:bg-brand-100"
        >
          عرض صورة الفاتورة
        </a>
      ) : (
        <span className="text-sm text-ink-900/55">لا توجد صورة مرفوعة لهذه الفاتورة.</span>
      )}
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting || !id}
        className="rounded-full border border-red-500/50 bg-white px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-60"
      >
        {deleting ? "جارٍ الحذف..." : "حذف الفاتورة"}
      </button>
    </div>
  );
}
