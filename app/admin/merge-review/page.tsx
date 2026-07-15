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

type MergeState   = "idle" | "pending" | "done" | "error" | "skipped";
type SubsetAction = "branch" | "delete" | "skip";

// ── Helpers ───────────────────────────────────────────────────────────────────
async function doMerge(keep_id: string, merge_id: string, as_branch = true): Promise<boolean> {
  const res = await fetch("/api/admin/merge-places", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keep_id, merge_id, as_branch }),
  });
  return res.ok;
}

function PlaceLink({ id, name }: { id: string; name: string }) {
  return (
    <a
      href={`/places/${id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[11px] font-semibold text-sal-600 hover:text-sal-800 underline"
    >
      {name} <span className="text-[10px]">↗</span>
    </a>
  );
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
  const [actions, setActions] = useState<Record<string, SubsetAction>>({});
  const [status, setStatus]   = useState<Record<string, MergeState>>({});
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  // Initialise checkboxes pre-checked and actions defaulting to "branch".
  useEffect(() => {
    if (!groups.length) return;
    const initChecks: Record<string, boolean> = {};
    const initActions: Record<string, SubsetAction> = {};
    for (const g of groups) {
      const key = `${g.place_a.id}__${g.place_b.id}`;
      initChecks[key]  = true;
      initActions[key] = "branch";
    }
    setChecks(initChecks);
    setActions(initActions);
  }, [groups]);

  const allSelected  = groups.every((g) => checks[`${g.place_a.id}__${g.place_b.id}`]);
  const noneSelected = groups.every((g) => !checks[`${g.place_a.id}__${g.place_b.id}`]);

  function toggleAll() {
    const next: Record<string, boolean> = {};
    for (const g of groups) {
      next[`${g.place_a.id}__${g.place_b.id}`] = !allSelected;
    }
    setChecks(next);
  }

  const selected = groups.filter((g) => checks[`${g.place_a.id}__${g.place_b.id}`]);

  async function runSelected() {
    if (!selected.length || running) return;
    setRunning(true);
    setProgress({ done: 0, total: selected.length });

    for (let i = 0; i < selected.length; i++) {
      const g      = selected[i];
      const key    = `${g.place_a.id}__${g.place_b.id}`;
      const action = actions[key] ?? "branch";

      setStatus((prev) => ({ ...prev, [key]: "pending" }));

      if (action === "skip") {
        setStatus((prev) => ({ ...prev, [key]: "skipped" }));
      } else {
        const ok = await doMerge(g.place_a.id, g.place_b.id, action === "branch");
        setStatus((prev) => ({ ...prev, [key]: ok ? "done" : "error" }));
      }

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
              <th className="px-3 py-2.5 text-center w-6">←</th>
              <th className="px-3 py-2.5 text-right">السجل المحتمل (B)</th>
              <th className="px-3 py-2.5 text-right">الموقع</th>
              <th className="px-3 py-2.5 text-right">الإجراء</th>
              <th className="px-3 py-2.5 text-center w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sal-50">
            {groups.map((g) => {
              const key  = `${g.place_a.id}__${g.place_b.id}`;
              const st   = status[key] ?? "idle";
              const act  = actions[key] ?? "branch";
              const isDone = st === "done" || st === "error" || st === "skipped";
              return (
                <tr
                  key={key}
                  className={`transition ${isDone ? "opacity-50" : "hover:bg-sal-50"}`}
                >
                  {/* Checkbox */}
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

                  {/* Place A */}
                  <td className="px-3 py-2.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-ink-900">
                        {g.place_a.name}
                        <span className="mr-1 text-[10px] text-ink-400">({g.place_a.branches_count} فرع)</span>
                      </span>
                      <PlaceLink id={g.place_a.id} name="عرض الصفحة" />
                    </div>
                  </td>

                  <td className="px-3 py-2.5 text-center text-ink-400">←</td>

                  {/* Place B */}
                  <td className="px-3 py-2.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-ink-800">{g.place_b.name}</span>
                      <PlaceLink id={g.place_b.id} name="عرض الصفحة" />
                    </div>
                  </td>

                  {/* Location */}
                  <td className="px-3 py-2.5">
                    <LocationLine place={g.place_b} />
                  </td>

                  {/* Action selector */}
                  <td className="px-3 py-2.5">
                    {isDone ? (
                      <StatusIcon state={st} />
                    ) : (
                      <select
                        value={act}
                        disabled={running || !checks[key]}
                        onChange={(e) =>
                          setActions((prev) => ({ ...prev, [key]: e.target.value as SubsetAction }))
                        }
                        className={`rounded-lg border px-2 py-1 text-[11px] font-semibold focus:outline-none disabled:opacity-40 ${
                          act === "delete"
                            ? "border-red-200 bg-red-50 text-red-700"
                            : act === "skip"
                            ? "border-ink-200 bg-ink-50 text-ink-500"
                            : "border-sal-200 bg-sal-50 text-sal-700"
                        }`}
                      >
                        <option value="branch">دمج B كفرع تحت A</option>
                        <option value="delete">حذف B — تكرار حقيقي</option>
                        <option value="skip">تجاهل</option>
                      </select>
                    )}
                  </td>

                  {/* Running spinner */}
                  <td className="px-3 py-2.5 text-center">
                    {st === "pending" && <span className="text-xs text-amber-600">⏳</span>}
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
          {running ? "جاري التنفيذ..." : "اكتمل"} ({progress.done}/{progress.total})
        </p>
      )}

      {/* Bulk action button */}
      <button
        type="button"
        onClick={runSelected}
        disabled={noneSelected || running}
        className="rounded-xl bg-sal-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-sal-700 disabled:opacity-40 transition"
      >
        {running
          ? `جاري التنفيذ... (${progress?.done ?? 0}/${progress?.total ?? 0})`
          : `تنفيذ المحدد (${selected.length} حالة)`}
      </button>
    </div>
  );
}

type ExactActionKind =
  | "keep_a"          // true duplicate: delete B, no branch added
  | "keep_b"          // true duplicate: delete A, no branch added
  | "branch_b_under_a" // B becomes a branch of A (A is the main)
  | "branch_a_under_b" // A becomes a branch of B (B is the main)
  | "skip";            // different places, do nothing

// ── EXACT Card ────────────────────────────────────────────────────────────────
function ExactCard({
  group,
  status,
  onAction,
}: {
  group: DuplicateGroup;
  status: MergeState;
  onAction: (kind: ExactActionKind) => void;
}) {
  const { place_a, place_b } = group;
  const isDone    = status === "done" || status === "error" || status === "skipped";
  const isPending = status === "pending";

  const statusLabel =
    status === "done"    ? "✓ تم" :
    status === "skipped" ? "تجاهُل" :
    status === "error"   ? "✗ خطأ" : "";

  return (
    <div
      className={`rounded-2xl border bg-white shadow-sm overflow-hidden transition-opacity duration-300 ${
        isDone ? "opacity-50 border-sal-100" : "border-amber-200"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-amber-100 bg-amber-50 px-4 py-3">
        <span className="text-base">⚠️</span>
        <p className="text-sm font-bold text-amber-900">اسم متطابق: {place_a.name}</p>
        {isDone && <span className="mr-auto text-xs font-semibold text-ink-500">{statusLabel}</span>}
      </div>

      {/* Body: two columns */}
      <div className="grid grid-cols-2 divide-x divide-x-reverse divide-sal-100">
        {/* Place A */}
        <div className="px-4 py-3 space-y-1">
          <p className="text-[10px] font-bold text-ink-400 uppercase tracking-wider">السجل A</p>
          <p className="font-mono text-[10px] text-ink-400">{place_a.id}</p>
          <p className="text-sm font-semibold text-ink-900">{place_a.name}</p>
          <p className="text-[11px] text-ink-500">فروع: {place_a.branches_count}</p>
          <LocationLine place={place_a} />
          <PlaceLink id={place_a.id} name="عرض الصفحة الكاملة" />
        </div>
        {/* Place B */}
        <div className="px-4 py-3 space-y-1">
          <p className="text-[10px] font-bold text-ink-400 uppercase tracking-wider">السجل B</p>
          <p className="font-mono text-[10px] text-ink-400">{place_b.id}</p>
          <p className="text-sm font-semibold text-ink-900">{place_b.name}</p>
          <p className="text-[11px] text-ink-500">فروع: {place_b.branches_count}</p>
          <LocationLine place={place_b} />
          <PlaceLink id={place_b.id} name="عرض الصفحة الكاملة" />
        </div>
      </div>

      {/* Actions */}
      {!isDone && (
        <div className="border-t border-sal-100 bg-sal-50 px-4 py-3 space-y-2">

          {/* Group 1: true duplicate */}
          <div>
            <p className="mb-1.5 text-[10px] font-bold text-ink-500 uppercase tracking-wider">
              نسخة مكررة — نفس المكان أُدخل مرتين
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={isPending}
                onClick={() => onAction("keep_a")}
                className="rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50 transition">
                احذف B — احتفظ بـ A
              </button>
              <button type="button" disabled={isPending}
                onClick={() => onAction("keep_b")}
                className="rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50 transition">
                احذف A — احتفظ بـ B
              </button>
            </div>
          </div>

          {/* Group 2: same chain, different locations */}
          <div>
            <p className="mb-1.5 text-[10px] font-bold text-ink-500 uppercase tracking-wider">
              فروع لنفس السلسلة — مواقع مختلفة
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={isPending}
                onClick={() => onAction("branch_b_under_a")}
                className="rounded-xl border border-sal-300 bg-white px-3 py-1.5 text-xs font-bold text-sal-700 hover:bg-sal-50 disabled:opacity-50 transition">
                دمج B كفرع تحت A
              </button>
              <button type="button" disabled={isPending}
                onClick={() => onAction("branch_a_under_b")}
                className="rounded-xl border border-sal-300 bg-white px-3 py-1.5 text-xs font-bold text-sal-700 hover:bg-sal-50 disabled:opacity-50 transition">
                دمج A كفرع تحت B
              </button>
            </div>
          </div>

          {/* Skip */}
          <div className="flex items-center gap-3">
            <button type="button" disabled={isPending}
              onClick={() => onAction("skip")}
              className="rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-500 hover:bg-ink-50 disabled:opacity-50 transition">
              تجاهل — مكانان مختلفان تمامًا
            </button>
            {isPending && <span className="text-xs text-amber-600">⏳ جاري التنفيذ...</span>}
          </div>

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

  async function handleExactAction(group: DuplicateGroup, kind: ExactActionKind) {
    const key = `${group.place_a.id}__${group.place_b.id}`;
    if (kind === "skip") {
      setExactStatus((prev) => ({ ...prev, [key]: "skipped" }));
      return;
    }
    setExactStatus((prev) => ({ ...prev, [key]: "pending" }));
    let ok = false;
    if (kind === "keep_a")           ok = await doMerge(group.place_a.id, group.place_b.id, false);
    if (kind === "keep_b")           ok = await doMerge(group.place_b.id, group.place_a.id, false);
    if (kind === "branch_b_under_a") ok = await doMerge(group.place_a.id, group.place_b.id, true);
    if (kind === "branch_a_under_b") ok = await doMerge(group.place_b.id, group.place_a.id, true);
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
                  onAction={(kind) => handleExactAction(g, kind)}
                />
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
