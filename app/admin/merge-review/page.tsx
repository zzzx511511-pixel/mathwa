"use client";

import { useState, useEffect } from "react";

// ── Local type definitions (mirrors the API route types) ──────────────────────
type PlaceRef = {
  id: string;
  name: string;
  category: string;
  branches_count: number;
  neighborhood?: string;
  address?: string;
};

type DuplicateGroup = {
  kind: "EXACT" | "SUBSET" | "BRANCH_CLASH";
  place_a: PlaceRef;
  place_b: PlaceRef;
  matching_branch?: { name: string };
  note: string;
};

type MergeState = "idle" | "pending" | "done" | "error" | "skipped";

// ── Helpers ───────────────────────────────────────────────────────────────────
async function doMerge(keep_id: string, merge_id: string): Promise<boolean> {
  const res = await fetch("/api/admin/merge-places", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keep_id, merge_id }),
  });
  return res.ok;
}

function LocationLine({ place }: { place: PlaceRef }) {
  const parts = [place.neighborhood, place.address].filter(Boolean);
  if (!parts.length) return <span className="text-ink-400 text-[11px]">—</span>;
  return <span className="text-ink-500 text-[11px]">{parts.join(" · ")}</span>;
}

function StatusIcon({ state }: { state: MergeState }) {
  if (state === "pending") return <span className="text-xs text-amber-600">⏳</span>;
  if (state === "done")    return <span className="text-xs text-green-600 font-bold">✓</span>;
  if (state === "error")   return <span className="text-xs text-red-600 font-bold">✗</span>;
  if (state === "skipped") return <span className="text-xs text-ink-400">—</span>;
  return null;
}

// ── SUBSET Section ────────────────────────────────────────────────────────────
function SubsetSection({
  groups,
}: {
  groups: DuplicateGroup[];
}) {
  const [checks, setChecks]   = useState<Record<string, boolean>>({});
  const [status, setStatus]   = useState<Record<string, MergeState>>({});
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  // Initialise checkboxes pre-checked on first load.
  useEffect(() => {
    if (!groups.length) return;
    const initial: Record<string, boolean> = {};
    for (const g of groups) {
      initial[`${g.place_a.id}__${g.place_b.id}`] = true;
    }
    setChecks(initial);
  }, [groups]);

  const allSelected = groups.every((g) => checks[`${g.place_a.id}__${g.place_b.id}`]);
  const noneSelected = groups.every((g) => !checks[`${g.place_a.id}__${g.place_b.id}`]);

  function toggleAll() {
    const next: Record<string, boolean> = {};
    for (const g of groups) {
      next[`${g.place_a.id}__${g.place_b.id}`] = !allSelected;
    }
    setChecks(next);
  }

  const selected = groups.filter((g) => checks[`${g.place_a.id}__${g.place_b.id}`]);

  async function mergeAllSubset() {
    if (!selected.length || running) return;
    setRunning(true);
    setProgress({ done: 0, total: selected.length });

    for (let i = 0; i < selected.length; i++) {
      const g = selected[i];
      const key = `${g.place_a.id}__${g.place_b.id}`;
      setStatus((prev) => ({ ...prev, [key]: "pending" }));
      const ok = await doMerge(g.place_a.id, g.place_b.id);
      setStatus((prev) => ({ ...prev, [key]: ok ? "done" : "error" }));
      setProgress({ done: i + 1, total: selected.length });
    }

    setRunning(false);
  }

  if (!groups.length) {
    return (
      <p className="text-sm text-ink-500 px-1">لا توجد حالات SUBSET.</p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <button
          type="button"
          onClick={toggleAll}
          disabled={running}
          className="text-xs font-semibold text-sal-600 hover:text-sal-800 underline disabled:opacity-50"
        >
          {allSelected ? "إلغاء الكل" : "تحديد الكل"}
        </button>
        <span className="text-xs text-ink-500">{selected.length} محدد من {groups.length}</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-sal-100 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-sal-50 text-xs font-bold text-ink-600 border-b border-sal-100">
              <th className="px-3 py-2.5 text-right w-8"></th>
              <th className="px-3 py-2.5 text-right">المنشأة الأم (A)</th>
              <th className="px-3 py-2.5 text-center w-8">←</th>
              <th className="px-3 py-2.5 text-right">الفرع المحتمل (B)</th>
              <th className="px-3 py-2.5 text-right">الموقع</th>
              <th className="px-3 py-2.5 text-center w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sal-50">
            {groups.map((g) => {
              const key = `${g.place_a.id}__${g.place_b.id}`;
              const st  = status[key] ?? "idle";
              const isDone = st === "done" || st === "error";
              return (
                <tr
                  key={key}
                  className={`transition ${isDone ? "opacity-60" : "hover:bg-sal-50"}`}
                >
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={!!checks[key]}
                      disabled={running || isDone}
                      onChange={(e) =>
                        setChecks((prev) => ({ ...prev, [key]: e.target.checked }))
                      }
                      className="h-4 w-4 accent-sal-600"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="font-semibold text-ink-900">{g.place_a.name}</span>
                    <span className="mr-1 text-[10px] text-ink-400">
                      ({g.place_a.branches_count} فرع)
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center text-ink-400">←</td>
                  <td className="px-3 py-2.5">
                    <span className="text-ink-800">{g.place_b.name}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <LocationLine place={g.place_b} />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <StatusIcon state={st} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Progress */}
      {progress && (
        <p className="text-xs text-ink-600">
          {running ? "جاري الدمج..." : "اكتمل"} ({progress.done}/{progress.total})
        </p>
      )}

      {/* Bulk merge button */}
      <button
        type="button"
        onClick={mergeAllSubset}
        disabled={noneSelected || running}
        className="rounded-xl bg-sal-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-sal-700 disabled:opacity-40 transition"
      >
        {running
          ? `جاري الدمج... (${progress?.done ?? 0}/${progress?.total ?? 0})`
          : `دمج المحدد (${selected.length} حالة)`}
      </button>
    </div>
  );
}

// ── EXACT Card ────────────────────────────────────────────────────────────────
function ExactCard({
  group,
  status,
  onAction,
}: {
  group: DuplicateGroup;
  status: MergeState;
  onAction: (keep_id: string, merge_id: string) => void;
}) {
  const { place_a, place_b } = group;
  const isDone    = status === "done" || status === "error" || status === "skipped";
  const isPending = status === "pending";

  return (
    <div
      className={`rounded-2xl border bg-white shadow-sm transition-all duration-300 overflow-hidden ${
        isDone ? "opacity-50" : "border-amber-200"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-amber-100 bg-amber-50 px-4 py-3">
        <span className="text-base">⚠️</span>
        <p className="text-sm font-bold text-amber-900">
          اسم متطابق: {place_a.name}
        </p>
        {isDone && (
          <span className="mr-auto text-xs font-semibold text-ink-500">
            {status === "done" ? "✓ تم الدمج" : status === "skipped" ? "تجاهُل" : "✗ خطأ"}
          </span>
        )}
      </div>

      {/* Body: two columns */}
      <div className="grid grid-cols-2 gap-0 divide-x-0 sm:divide-x sm:divide-sal-100">
        {/* Place A */}
        <div className="px-4 py-3 space-y-1 border-b border-sal-100 sm:border-b-0">
          <p className="text-[10px] font-bold text-ink-500 uppercase tracking-wide">
            السجل A
          </p>
          <p className="font-mono text-[10px] text-ink-400">{place_a.id}</p>
          <p className="text-sm font-semibold text-ink-900">{place_a.name}</p>
          <p className="text-[11px] text-ink-600">
            فروع: {place_a.branches_count}
          </p>
          <LocationLine place={place_a} />
        </div>
        {/* Place B */}
        <div className="px-4 py-3 space-y-1">
          <p className="text-[10px] font-bold text-ink-500 uppercase tracking-wide">
            السجل B
          </p>
          <p className="font-mono text-[10px] text-ink-400">{place_b.id}</p>
          <p className="text-sm font-semibold text-ink-900">{place_b.name}</p>
          <p className="text-[11px] text-ink-600">
            فروع: {place_b.branches_count}
          </p>
          <LocationLine place={place_b} />
        </div>
      </div>

      {/* Actions */}
      {!isDone && (
        <div className="flex flex-wrap gap-2 border-t border-sal-100 bg-sal-50 px-4 py-3">
          <button
            type="button"
            disabled={isPending}
            onClick={() => onAction(place_a.id, place_b.id)}
            className="rounded-xl border border-sal-300 bg-white px-3 py-1.5 text-xs font-bold text-ink-700 hover:bg-sal-50 disabled:opacity-50 transition"
          >
            احتفظ بـ A (احذف B)
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => onAction(place_b.id, place_a.id)}
            className="rounded-xl border border-sal-300 bg-white px-3 py-1.5 text-xs font-bold text-ink-700 hover:bg-sal-50 disabled:opacity-50 transition"
          >
            احتفظ بـ B (احذف A)
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => onAction("__skip__", "__skip__")}
            className="rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-500 hover:bg-ink-50 disabled:opacity-50 transition"
          >
            تجاهل (مختلفان)
          </button>
          {isPending && (
            <span className="self-center text-xs text-amber-600">⏳ جاري الدمج...</span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MergeReviewPage() {
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [groups, setGroups]     = useState<DuplicateGroup[]>([]);

  // SUBSET state
  const [subsetGroups, setSubsetGroups] = useState<DuplicateGroup[]>([]);

  // EXACT state
  const [exactGroups, setExactGroups]   = useState<DuplicateGroup[]>([]);
  const [exactStatus, setExactStatus]   = useState<Record<string, MergeState>>({});

  useEffect(() => {
    fetch("/api/admin/find-duplicates")
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { error?: string };
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<{ groups: DuplicateGroup[] }>;
      })
      .then((data) => {
        setGroups(data.groups);
        setSubsetGroups(data.groups.filter((g) => g.kind === "SUBSET"));
        setExactGroups(data.groups.filter((g) => g.kind === "EXACT"));
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleExactAction(
    group: DuplicateGroup,
    keep_id: string,
    merge_id: string,
  ) {
    const key = `${group.place_a.id}__${group.place_b.id}`;
    if (keep_id === "__skip__") {
      setExactStatus((prev) => ({ ...prev, [key]: "skipped" }));
      return;
    }
    setExactStatus((prev) => ({ ...prev, [key]: "pending" }));
    const ok = await doMerge(keep_id, merge_id);
    setExactStatus((prev) => ({ ...prev, [key]: ok ? "done" : "error" }));
  }

  const totalGroups = groups.length;
  const exactCount  = exactGroups.length;
  const subsetCount = subsetGroups.length;

  return (
    <div dir="rtl" className="mx-auto max-w-screen-lg space-y-10 px-5 py-10">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-extrabold text-ink-900">مراجعة التكرارات والدمج</h1>
        {!loading && !error && (
          <p className="mt-1 text-sm text-ink-500">
            {totalGroups} حالة مكتشفة — {exactCount} متطابق · {subsetCount} فرع محتمل
          </p>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="rounded-2xl border border-sal-100 bg-white px-6 py-10 text-center">
          <p className="text-sm text-ink-500">جاري الجلب...</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-5">
          <p className="text-sm font-semibold text-red-700">خطأ: {error}</p>
          <p className="mt-1 text-xs text-red-500">تأكد من تسجيل الدخول ثم أعد تحميل الصفحة.</p>
        </div>
      )}

      {/* No duplicates */}
      {!loading && !error && totalGroups === 0 && (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-6 py-8 text-center">
          <p className="text-sm font-semibold text-green-700">لا توجد تكرارات مكتشفة.</p>
        </div>
      )}

      {/* ── Section 1: SUBSET ── */}
      {!loading && !error && subsetGroups.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-extrabold text-ink-900">
              فروع مسجّلة كمنشآت مستقلة
              <span className="mr-2 rounded-full bg-sal-100 px-2 py-0.5 text-xs font-bold text-sal-700">
                {subsetGroups.length}
              </span>
            </h2>
            <p className="mt-0.5 text-xs text-ink-500">
              هذه المنشآت يبدو أن اسمها يبدأ باسم منشأة أخرى — على الأرجح فروع خاطئة.
              الدمج سيحوّل السجل الفرعي إلى فرع داخل السجل الأصلي.
            </p>
          </div>
          <SubsetSection groups={subsetGroups} />
        </section>
      )}

      {/* ── Section 2: EXACT ── */}
      {!loading && !error && exactGroups.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-extrabold text-ink-900">
              أسماء متطابقة تماماً
              <span className="mr-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                {exactGroups.length}
              </span>
            </h2>
            <p className="mt-0.5 text-xs text-ink-500">
              هذه الأزواج لها نفس الاسم بالضبط. قد تكون نسخاً مكررة أو منشآت مختلفة تصادفياً لها نفس الاسم.
              راجع كل حالة واتخذ قرارك.
            </p>
          </div>
          <div className="space-y-4">
            {exactGroups.map((g) => {
              const key = `${g.place_a.id}__${g.place_b.id}`;
              return (
                <ExactCard
                  key={key}
                  group={g}
                  status={exactStatus[key] ?? "idle"}
                  onAction={(keep_id, merge_id) =>
                    handleExactAction(g, keep_id, merge_id)
                  }
                />
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
