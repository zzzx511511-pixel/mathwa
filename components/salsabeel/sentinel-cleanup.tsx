"use client";

import { useState } from "react";

type FolderEntry = { folder: string; toDelete: string[] };

type ScanResult = {
  folders_scanned: number;
  case_a: FolderEntry[];
  case_b: FolderEntry[];
  error?: string;
};

type ApplyResult = {
  folders_scanned: number;
  case_a_count: number;
  case_b_count: number;
  cleaned: number;
  failed: number;
  error?: string;
};

export function SentinelCleanup() {
  const [open,         setOpen]         = useState(false);
  const [scanLoading,  setScanLoading]  = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [scan,         setScan]         = useState<ScanResult | null>(null);
  const [applied,      setApplied]      = useState<ApplyResult | null>(null);

  async function doScan() {
    setScanLoading(true);
    setScan(null);
    setApplied(null);
    try {
      const res  = await fetch("/api/admin/clean-sentinels");
      const data = await res.json();
      setScan(data);
    } catch {
      setScan({ folders_scanned: 0, case_a: [], case_b: [], error: "فشل الاتصال بالسيرفر" });
    } finally {
      setScanLoading(false);
    }
  }

  async function doApply() {
    if (!scan || (scan.case_a.length + scan.case_b.length === 0)) return;
    setApplyLoading(true);
    setApplied(null);
    try {
      const res  = await fetch("/api/admin/clean-sentinels", { method: "POST" });
      const data = await res.json();
      setApplied(data);
      setScan(null);
    } catch {
      setApplied({ folders_scanned: 0, case_a_count: 0, case_b_count: 0, cleaned: 0, failed: 1, error: "فشل الاتصال بالسيرفر" });
    } finally {
      setApplyLoading(false);
    }
  }

  const totalAffected = scan ? scan.case_a.length + scan.case_b.length : 0;

  return (
    <div className="rounded-2xl border border-sal-100 bg-white overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-3.5 text-right hover:bg-sal-50 transition"
      >
        <span className="text-sm font-bold text-ink-800">🔧 صيانة كاش الصور</span>
        <span className="text-xs text-ink-400">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="border-t border-sal-100 px-5 py-4 space-y-4">
          <p className="text-xs text-ink-600">
            يفحص bucket <span className="font-mono">place-photos</span> بحثاً عن مجلدات تحتوي على
            {" "}<span className="font-mono">.gid-*</span> بصيغة قديمة (بدون رقم) — المجلدات المتأثرة
            قد تعرض صور خاطئة من منشآت أخرى.
          </p>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={doScan}
              disabled={scanLoading || applyLoading}
              className="rounded-xl border border-sal-300 bg-sal-50 px-4 py-2 text-sm font-bold text-sal-700 hover:bg-sal-100 disabled:opacity-50 transition"
            >
              {scanLoading ? "⏳ جاري الفحص..." : "🔍 فحص (Dry Run)"}
            </button>

            {scan && totalAffected > 0 && !applied && (
              <button
                type="button"
                onClick={doApply}
                disabled={applyLoading}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50 transition"
              >
                {applyLoading ? "⏳ جاري التنظيف..." : `🗑️ تطبيق التنظيف (${totalAffected} مجلد)`}
              </button>
            )}

            {(scan || applied) && !scanLoading && !applyLoading && (
              <button
                type="button"
                onClick={() => { setScan(null); setApplied(null); }}
                className="rounded-xl border border-ink-200 bg-white px-4 py-2 text-sm text-ink-500 hover:bg-ink-50 transition"
              >
                إعادة تعيين
              </button>
            )}
          </div>

          {/* Scan error */}
          {scan?.error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-600">
              ❌ {scan.error}
            </div>
          )}

          {/* Scan results */}
          {scan && !scan.error && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3">
                <Stat label="مجلدات مفحوصة" value={scan.folders_scanned} color="ink" />
                <Stat label="تحتاج تنظيف كامل" value={scan.case_a.length} color="red"
                  title="مجلدات فيها صور مختلطة وsentinel قديم — ستُحذف صورها لإعادة جلبها صح" />
                <Stat label="sentinel قديم فقط" value={scan.case_b.length} color="amber"
                  title="مجلدات فيها sentinel قديم بجانب صحيح — يُحذف القديم فقط" />
              </div>

              {totalAffected === 0 ? (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs font-bold text-green-700">
                  ✅ كل المجلدات سليمة — لا يوجد شيء يحتاج تنظيف.
                </div>
              ) : (
                <>
                  {scan.case_a.length > 0 && (
                    <FolderList
                      title="Case A — ستُحذف صورها وsentinelها لإعادة الجلب الصحيح من Google"
                      color="red"
                      entries={scan.case_a}
                    />
                  )}
                  {scan.case_b.length > 0 && (
                    <FolderList
                      title="Case B — sentinel قديم فقط يُحذف، الصور والsentinel الصحيح يبقوا"
                      color="amber"
                      entries={scan.case_b}
                    />
                  )}
                  <p className="text-[11px] text-ink-500">
                    ⚠️ الضغط على &ldquo;تطبيق التنظيف&rdquo; سيطبق هذه التغييرات فعلياً.
                    مجلدات Case A ستجلب صورها تلقائياً من Google عند فتح صفحتها.
                  </p>
                </>
              )}
            </div>
          )}

          {/* Apply result */}
          {applied && (
            <div className={`rounded-xl border px-4 py-3 space-y-1 ${applied.error || applied.failed > 0 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}>
              {applied.error ? (
                <p className="text-xs font-bold text-red-600">❌ {applied.error}</p>
              ) : (
                <>
                  <p className="text-xs font-bold text-green-700">
                    ✅ اكتمل التنظيف — {applied.cleaned} مجلد نُظِّف
                    {applied.failed > 0 && ` / ${applied.failed} فشل`}
                  </p>
                  <p className="text-[11px] text-ink-600">
                    Case A: {applied.case_a_count} مجلد — صورها ستُجلب تلقائياً من Google عند أول فتح للصفحة.
                  </p>
                  <p className="text-[11px] text-ink-600">
                    Case B: {applied.case_b_count} مجلد — الصور الصحيحة محفوظة، فقط الـ sentinel القديم حُذف.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color, title }: { label: string; value: number; color: string; title?: string }) {
  const colors: Record<string, string> = {
    ink:   "border-ink-100 bg-ink-50 text-ink-600",
    red:   "border-red-100 bg-red-50 text-red-600",
    amber: "border-amber-100 bg-amber-50 text-amber-600",
    green: "border-green-100 bg-green-50 text-green-600",
  };
  return (
    <div className={`rounded-xl border px-3 py-2 text-center ${colors[color] ?? colors.ink}`} title={title}>
      <p className="text-lg font-black">{value}</p>
      <p className="text-[10px] font-semibold">{label}</p>
    </div>
  );
}

function FolderList({ title, color, entries }: { title: string; color: "red" | "amber"; entries: FolderEntry[] }) {
  const bg = color === "red" ? "border-red-100 bg-red-50" : "border-amber-100 bg-amber-50";
  const txt = color === "red" ? "text-red-700" : "text-amber-700";
  return (
    <div className={`rounded-xl border ${bg} p-3 space-y-1.5`}>
      <p className={`text-[11px] font-bold ${txt}`}>{title}:</p>
      <div className="max-h-40 overflow-y-auto space-y-1">
        {entries.map(({ folder, toDelete }) => (
          <div key={folder} className="flex items-start gap-2 text-[11px]">
            <span className="font-mono font-bold text-ink-700 shrink-0">{folder}/</span>
            <span className="text-ink-500 truncate">{toDelete.join("، ")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
