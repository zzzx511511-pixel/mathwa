"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
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
type SubsetAction = "branch" | "delete_b" | "delete_a" | "delete_both" | "skip";
type ExactActionKind =
  | "keep_a"
  | "keep_b"
  | "branch_b_under_a"
  | "branch_a_under_b"
  | "delete_both"
  | "skip";

// ── API helpers ───────────────────────────────────────────────────────────────
async function doMerge(keep_id: string, merge_id: string, as_branch = true): Promise<boolean> {
  const res = await fetch("/api/admin/merge-places", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keep_id, merge_id, as_branch }),
  });
  return res.ok;
}

async function doDeleteBoth(id_a: string, id_b: string): Promise<boolean> {
  const res = await fetch("/api/admin/merge-places", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keep_id: id_a, merge_id: id_b, delete_both: true }),
  });
  return res.ok;
}

// ── localStorage helpers ──────────────────────────────────────────────────────
function lsGet<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback; }
  catch { return fallback; }
}
function lsSet(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
}

const LS_SUBSET_CHECKS  = "mrv-subset-checks";
const LS_SUBSET_ACTIONS = "mrv-subset-actions";
const LS_SUBSET_STATUS  = "mrv-subset-status";
const LS_EXACT_STATUS   = "mrv-exact-status";

// ── Shared UI atoms ───────────────────────────────────────────────────────────
function PlaceLink({ id, name }: { id: string; name: string }) {
  return (
    <a href={`/places/${id}`} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[11px] font-semibold text-sal-600 hover:text-sal-800 underline">
      {name} <span className="text-[10px]">↗</span>
    </a>
  );
}

function LocationLine({ place }: { place: PlaceRef }) {
  const parts = [place.neighborhood, place.address].filter(Boolean);
  if (!parts.length) return <span className="text-ink-400 text-[11px]">—</span>;
  return <span className="text-ink-500 text-[11px]">{parts.join(" · ")}</span>;
}

function DoneTag({ state }: { state: MergeState }) {
  if (state === "done")    return <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">✓ تم</span>;
  if (state === "error")   return <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">✗ خطأ</span>;
  if (state === "skipped") return <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-bold text-ink-500">تجاهُل</span>;
  return null;
}

// ── SUBSET Section ────────────────────────────────────────────────────────────
function SubsetSection({ groups }: { groups: DuplicateGroup[] }) {
  const [checks,   setChecks]   = useState<Record<string, boolean>>({});
  const [actions,  setActions]  = useState<Record<string, SubsetAction>>({});
  const [status,   setStatus]   = useState<Record<string, MergeState>>({});
  const [bulkRun,  setBulkRun]  = useState(false);
  const [bulkProg, setBulkProg] = useState<{ done: number; total: number } | null>(null);
  const [showDone, setShowDone] = useState(false);

  // Load from LS on mount — init only reads, never writes.
  useEffect(() => {
    if (!groups.length) return;
    const sc = lsGet<Record<string, boolean>>(LS_SUBSET_CHECKS, {});
    const sa = lsGet<Record<string, SubsetAction>>(LS_SUBSET_ACTIONS, {});
    const ss = lsGet<Record<string, MergeState>>(LS_SUBSET_STATUS, {});
    const ic: Record<string, boolean>      = {};
    const ia: Record<string, SubsetAction> = {};
    for (const g of groups) {
      const key = `${g.place_a.id}__${g.place_b.id}`;
      ic[key] = sc[key]  ?? true;
      ia[key] = sa[key]  ?? "branch";
    }
    setChecks(ic);
    setActions(ia);
    if (Object.keys(ss).length) setStatus(ss);
  }, [groups]);

  // ── Save helpers (called in handlers only, never during init) ─────────────
  function saveChecks(next: Record<string, boolean>) {
    setChecks(next); lsSet(LS_SUBSET_CHECKS, next);
  }
  function saveAction(key: string, action: SubsetAction) {
    setActions(prev => { const n = { ...prev, [key]: action }; lsSet(LS_SUBSET_ACTIONS, n); return n; });
  }
  function saveStatus(key: string, state: MergeState, base: Record<string, MergeState>) {
    const next = { ...base, [key]: state };
    setStatus(next); lsSet(LS_SUBSET_STATUS, next);
    return next;
  }

  // ── Derived lists ─────────────────────────────────────────────────────────
  const isDone = (g: DuplicateGroup) => {
    const s = status[`${g.place_a.id}__${g.place_b.id}`] ?? "idle";
    return s === "done" || s === "error" || s === "skipped";
  };
  const pendingGroups = groups.filter(g => !isDone(g));
  const doneGroups    = groups.filter(g =>  isDone(g));
  const selectedPending = pendingGroups.filter(g => checks[`${g.place_a.id}__${g.place_b.id}`]);
  const allChecked  = pendingGroups.length > 0 && pendingGroups.every(g => checks[`${g.place_a.id}__${g.place_b.id}`]);
  const noneChecked = pendingGroups.every(g => !checks[`${g.place_a.id}__${g.place_b.id}`]);

  function toggleAll() {
    const next = { ...checks };
    for (const g of pendingGroups) next[`${g.place_a.id}__${g.place_b.id}`] = !allChecked;
    saveChecks(next);
  }

  // ── Execute one row immediately ───────────────────────────────────────────
  async function runSingle(g: DuplicateGroup) {
    if (bulkRun) return;
    const key    = `${g.place_a.id}__${g.place_b.id}`;
    const action = actions[key] ?? "branch";
    let cur = saveStatus(key, "pending", status);
    let fin: MergeState;
    if (action === "skip")           fin = "skipped";
    else if (action === "branch")    fin = (await doMerge(g.place_a.id, g.place_b.id, true))       ? "done" : "error";
    else if (action === "delete_b")  fin = (await doMerge(g.place_a.id, g.place_b.id, false))      ? "done" : "error";
    else if (action === "delete_a")  fin = (await doMerge(g.place_b.id, g.place_a.id, false))      ? "done" : "error";
    else                             fin = (await doDeleteBoth(g.place_a.id, g.place_b.id))         ? "done" : "error";
    saveStatus(key, fin, cur);
  }

  // ── Execute all selected rows (bulk) ──────────────────────────────────────
  async function runBulk() {
    if (!selectedPending.length || bulkRun) return;
    setBulkRun(true);
    setBulkProg({ done: 0, total: selectedPending.length });
    let cur = { ...status };
    for (let i = 0; i < selectedPending.length; i++) {
      const g      = selectedPending[i];
      const key    = `${g.place_a.id}__${g.place_b.id}`;
      const action = actions[key] ?? "branch";
      cur = saveStatus(key, "pending", cur);
      let fin: MergeState;
      if (action === "skip")           fin = "skipped";
      else if (action === "branch")    fin = (await doMerge(g.place_a.id, g.place_b.id, true))  ? "done" : "error";
      else if (action === "delete_b")  fin = (await doMerge(g.place_a.id, g.place_b.id, false)) ? "done" : "error";
      else if (action === "delete_a")  fin = (await doMerge(g.place_b.id, g.place_a.id, false)) ? "done" : "error";
      else                             fin = (await doDeleteBoth(g.place_a.id, g.place_b.id))    ? "done" : "error";
      cur = saveStatus(key, fin, cur);
      setBulkProg({ done: i + 1, total: selectedPending.length });
    }
    setBulkRun(false);
  }

  if (!groups.length) return <p className="text-sm text-ink-500 px-1">لا توجد حالات SUBSET.</p>;

  return (
    <div className="space-y-4">

      {/* ── Bulk bar ── */}
      <div className="flex items-center justify-between flex-wrap gap-3 rounded-2xl border border-sal-100 bg-sal-50 px-4 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          <button type="button" onClick={toggleAll} disabled={bulkRun || !pendingGroups.length}
            className="text-xs font-semibold text-sal-600 hover:text-sal-800 underline disabled:opacity-40">
            {allChecked ? "إلغاء الكل" : "تحديد الكل"}
          </button>
          <span className="text-xs text-ink-500">{selectedPending.length} محدد</span>
        </div>
        <button type="button" onClick={runBulk}
          disabled={noneChecked || bulkRun || !pendingGroups.length}
          className="rounded-xl bg-sal-600 px-5 py-2 text-xs font-bold text-white hover:bg-sal-700 disabled:opacity-40 transition">
          {bulkRun
            ? `جاري التنفيذ... (${bulkProg?.done ?? 0}/${bulkProg?.total ?? 0})`
            : `تنفيذ كل الاقتراحات المحددة دفعة وحدة (${selectedPending.length})`}
        </button>
      </div>

      {/* ── Pending table ── */}
      {pendingGroups.length === 0 ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-center">
          <p className="text-sm font-semibold text-green-700">✓ تمت مراجعة جميع الحالات</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-sal-100 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-sal-50 text-xs font-bold text-ink-600 border-b border-sal-100">
                <th className="px-3 py-2.5 w-8"></th>
                <th className="px-3 py-2.5 text-right">المنشأة الأم (A)</th>
                <th className="px-3 py-2.5 text-center w-6">←</th>
                <th className="px-3 py-2.5 text-right">السجل المحتمل (B)</th>
                <th className="px-3 py-2.5 text-right">الموقع</th>
                <th className="px-3 py-2.5 text-right">الإجراء</th>
                <th className="px-3 py-2.5 text-center">تنفيذ فوري</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sal-50">
              {pendingGroups.map((g) => {
                const key = `${g.place_a.id}__${g.place_b.id}`;
                const st  = status[key] ?? "idle";
                const act = actions[key] ?? "branch";
                const isPending = st === "pending";
                return (
                  <tr key={key} className="hover:bg-sal-50 transition">
                    {/* Checkbox */}
                    <td className="px-3 py-2.5">
                      <input type="checkbox"
                        checked={!!checks[key]}
                        disabled={bulkRun || isPending}
                        onChange={(e) => saveChecks({ ...checks, [key]: e.target.checked })}
                        className="h-4 w-4 accent-sal-600"
                      />
                    </td>
                    {/* A */}
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
                    {/* B */}
                    <td className="px-3 py-2.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-ink-800">{g.place_b.name}</span>
                        <PlaceLink id={g.place_b.id} name="عرض الصفحة" />
                      </div>
                    </td>
                    {/* Location */}
                    <td className="px-3 py-2.5"><LocationLine place={g.place_b} /></td>
                    {/* Action dropdown */}
                    <td className="px-3 py-2.5">
                      <select value={act} disabled={bulkRun || isPending}
                        onChange={(e) => saveAction(key, e.target.value as SubsetAction)}
                        className={`rounded-lg border px-2 py-1 text-[11px] font-semibold focus:outline-none disabled:opacity-40 ${
                          act === "delete_b" || act === "delete_a" || act === "delete_both"
                            ? "border-red-200 bg-red-50 text-red-700"
                            : act === "skip" ? "border-ink-200 bg-ink-50 text-ink-500"
                            : "border-sal-200 bg-sal-50 text-sal-700"
                        }`}>
                        <option value="branch">دمج B كفرع تحت A</option>
                        <option value="delete_b">حذف B — احتفظ بـ A</option>
                        <option value="delete_a">حذف A — احتفظ بـ B</option>
                        <option value="delete_both">حذف الاثنين معاً</option>
                        <option value="skip">تجاهل</option>
                      </select>
                    </td>
                    {/* Immediate execute button */}
                    <td className="px-3 py-2.5 text-center">
                      {isPending
                        ? <span className="text-xs text-amber-600">⏳</span>
                        : (
                          <button type="button" disabled={bulkRun}
                            onClick={() => runSingle(g)}
                            className="rounded-lg border border-sal-300 bg-white px-3 py-1 text-[11px] font-bold text-sal-700 hover:bg-sal-50 disabled:opacity-40 transition">
                            تنفيذ ↵
                          </button>
                        )
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Done / collapsed ── */}
      {doneGroups.length > 0 && (
        <div>
          <button type="button" onClick={() => setShowDone(v => !v)}
            className="flex items-center gap-2 text-xs font-semibold text-ink-500 hover:text-ink-700 transition">
            <span>{showDone ? "▲" : "▼"}</span>
            <span>{doneGroups.length} حالة مكتملة</span>
          </button>
          {showDone && (
            <div className="mt-2 overflow-x-auto rounded-2xl border border-sal-100 bg-white opacity-60">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-sal-50">
                  {doneGroups.map((g) => {
                    const key = `${g.place_a.id}__${g.place_b.id}`;
                    const st  = status[key] ?? "idle";
                    return (
                      <tr key={key}>
                        <td className="px-3 py-2 text-xs font-semibold text-ink-800">{g.place_a.name}</td>
                        <td className="px-3 py-2 text-center text-ink-400 w-6">←</td>
                        <td className="px-3 py-2 text-xs text-ink-600">{g.place_b.name}</td>
                        <td className="px-3 py-2"><DoneTag state={st} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
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
  onAction: (kind: ExactActionKind) => void;
}) {
  const { place_a, place_b } = group;
  const isPending = status === "pending";

  return (
    <div className="rounded-2xl border border-amber-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-amber-100 bg-amber-50 px-4 py-3">
        <span className="text-base">⚠️</span>
        <p className="text-sm font-bold text-amber-900">اسم متطابق: {place_a.name}</p>
        {isPending && <span className="mr-auto text-xs text-amber-600">⏳ جاري التنفيذ...</span>}
      </div>
      {/* Two columns */}
      <div className="grid grid-cols-2 divide-x divide-x-reverse divide-sal-100">
        <div className="px-4 py-3 space-y-1">
          <p className="text-[10px] font-bold text-ink-400 uppercase tracking-wider">السجل A</p>
          <p className="font-mono text-[10px] text-ink-400">{place_a.id}</p>
          <p className="text-sm font-semibold text-ink-900">{place_a.name}</p>
          <p className="text-[11px] text-ink-500">فروع: {place_a.branches_count}</p>
          <LocationLine place={place_a} />
          <PlaceLink id={place_a.id} name="عرض الصفحة الكاملة" />
        </div>
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
      <div className="border-t border-sal-100 bg-sal-50 px-4 py-3 space-y-2">
        <div>
          <p className="mb-1.5 text-[10px] font-bold text-ink-500 uppercase tracking-wider">
            نسخة مكررة — نفس المكان أُدخل مرتين
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={isPending} onClick={() => onAction("keep_a")}
              className="rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50 transition">
              احذف B — احتفظ بـ A
            </button>
            <button type="button" disabled={isPending} onClick={() => onAction("keep_b")}
              className="rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50 transition">
              احذف A — احتفظ بـ B
            </button>
            <button type="button" disabled={isPending} onClick={() => onAction("delete_both")}
              className="rounded-xl border border-red-400 bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50 transition">
              احذف الاثنين معاً
            </button>
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-[10px] font-bold text-ink-500 uppercase tracking-wider">
            فروع لنفس السلسلة — مواقع مختلفة
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={isPending} onClick={() => onAction("branch_b_under_a")}
              className="rounded-xl border border-sal-300 bg-white px-3 py-1.5 text-xs font-bold text-sal-700 hover:bg-sal-50 disabled:opacity-50 transition">
              دمج B كفرع تحت A
            </button>
            <button type="button" disabled={isPending} onClick={() => onAction("branch_a_under_b")}
              className="rounded-xl border border-sal-300 bg-white px-3 py-1.5 text-xs font-bold text-sal-700 hover:bg-sal-50 disabled:opacity-50 transition">
              دمج A كفرع تحت B
            </button>
          </div>
        </div>
        <button type="button" disabled={isPending} onClick={() => onAction("skip")}
          className="rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-500 hover:bg-ink-50 disabled:opacity-50 transition">
          تجاهل — مكانان مختلفان تمامًا
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MergeReviewPage() {
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [groups, setGroups]     = useState<DuplicateGroup[]>([]);
  const [subsetGroups, setSubsetGroups] = useState<DuplicateGroup[]>([]);
  const [exactGroups,  setExactGroups]  = useState<DuplicateGroup[]>([]);
  const [exactStatus,  setExactStatus]  = useState<Record<string, MergeState>>({});
  const [exactBulkRun,  setExactBulkRun]  = useState(false);
  const [exactBulkProg, setExactBulkProg] = useState<{ done: number; total: number } | null>(null);
  const [showExactDone, setShowExactDone] = useState(false);

  // Load exactStatus from LS once on mount.
  useEffect(() => {
    const saved = lsGet<Record<string, MergeState>>(LS_EXACT_STATUS, {});
    if (Object.keys(saved).length) setExactStatus(saved);
  }, []);

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

  // Save exactStatus in handler, not effect.
  function saveExactStatus(key: string, state: MergeState) {
    setExactStatus((prev) => {
      const next = { ...prev, [key]: state };
      lsSet(LS_EXACT_STATUS, next);
      return next;
    });
  }

  async function handleExactAction(group: DuplicateGroup, kind: ExactActionKind) {
    const key = `${group.place_a.id}__${group.place_b.id}`;
    if (kind === "skip") { saveExactStatus(key, "skipped"); return; }
    saveExactStatus(key, "pending");
    let ok = false;
    if (kind === "keep_a")           ok = await doMerge(group.place_a.id, group.place_b.id, false);
    if (kind === "keep_b")           ok = await doMerge(group.place_b.id, group.place_a.id, false);
    if (kind === "branch_b_under_a") ok = await doMerge(group.place_a.id, group.place_b.id, true);
    if (kind === "branch_a_under_b") ok = await doMerge(group.place_b.id, group.place_a.id, true);
    if (kind === "delete_both")      ok = await doDeleteBoth(group.place_a.id, group.place_b.id);
    saveExactStatus(key, ok ? "done" : "error");
  }

  // Derived exact lists
  const isExactDone = (g: DuplicateGroup) => {
    const s = exactStatus[`${g.place_a.id}__${g.place_b.id}`] ?? "idle";
    return s === "done" || s === "error" || s === "skipped";
  };
  const pendingExact = exactGroups.filter(g => !isExactDone(g));
  const doneExact    = exactGroups.filter(g =>  isExactDone(g));

  // Bulk exact: default action is "branch_b_under_a"
  async function runAllExact() {
    if (!pendingExact.length || exactBulkRun) return;
    setExactBulkRun(true);
    setExactBulkProg({ done: 0, total: pendingExact.length });
    for (let i = 0; i < pendingExact.length; i++) {
      await handleExactAction(pendingExact[i], "branch_b_under_a");
      setExactBulkProg({ done: i + 1, total: pendingExact.length });
    }
    setExactBulkRun(false);
  }

  const totalGroups = groups.length;
  const exactCount  = exactGroups.length;
  const subsetCount = subsetGroups.length;

  return (
    <div dir="rtl" className="mx-auto max-w-screen-lg space-y-10 px-5 py-10">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs flex-wrap">
            <Link href="/admin" className="font-semibold text-sal-600 hover:text-sal-800">← لوحة التحكم</Link>
            <span className="text-ink-300">·</span>
            <Link href="/admin/branch-review" className="text-ink-400 hover:text-sal-600">فروع — مراجعة الكل</Link>
            <span className="text-ink-300">·</span>
            <Link href="/admin/full-branch-fetch" className="text-ink-400 hover:text-sal-600">فروع — منشأة بعينها</Link>
          </div>
          <h1 className="text-2xl font-extrabold text-ink-900">تنظيف التكرارات — دمج وحذف</h1>
          {!loading && !error && (
            <p className="mt-1 text-sm text-ink-500">
              {totalGroups} حالة مكتشفة — {exactCount} متطابق · {subsetCount} فرع محتمل
            </p>
          )}
        </div>
        <button type="button"
          onClick={() => {
            [LS_SUBSET_CHECKS, LS_SUBSET_ACTIONS, LS_SUBSET_STATUS, LS_EXACT_STATUS]
              .forEach(k => localStorage.removeItem(k));
            window.location.reload();
          }}
          className="rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-500 hover:bg-ink-50 transition">
          ↺ مسح المحفوظات وإعادة التحميل
        </button>
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

      {/* All done */}
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
              استخدم <strong>تنفيذ ↵</strong> لكل حالة لحالها فور اختيار الإجراء،
              أو استخدم الشريط العلوي لتنفيذ كل المحدد دفعة وحدة.
            </p>
          </div>
          <SubsetSection groups={subsetGroups} />
        </section>
      )}

      {/* ── Section 2: EXACT ── */}
      {!loading && !error && exactGroups.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-lg font-extrabold text-ink-900">
                أسماء متطابقة تماماً
                <span className="mr-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                  {exactGroups.length}
                </span>
              </h2>
              <p className="mt-0.5 text-xs text-ink-500">
                راجع كل حالة واضغط الإجراء المناسب مباشرةً.
              </p>
            </div>
            {/* Bulk exact button */}
            <div className="flex flex-col items-end gap-1">
              <button type="button" onClick={runAllExact}
                disabled={!pendingExact.length || exactBulkRun}
                className="rounded-xl bg-sal-600 px-5 py-2 text-xs font-bold text-white hover:bg-sal-700 disabled:opacity-40 transition">
                {exactBulkRun
                  ? `جاري التنفيذ... (${exactBulkProg?.done ?? 0}/${exactBulkProg?.total ?? 0})`
                  : `تنفيذ كل الاقتراحات المتبقية دفعة وحدة (${pendingExact.length})`}
              </button>
              <p className="text-[10px] text-ink-400">الافتراضي: دمج B كفرع تحت A</p>
            </div>
          </div>

          {/* Pending cards */}
          {pendingExact.length === 0 ? (
            <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-center">
              <p className="text-sm font-semibold text-green-700">✓ تمت مراجعة جميع الحالات</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingExact.map((g) => {
                const key = `${g.place_a.id}__${g.place_b.id}`;
                return (
                  <ExactCard key={key} group={g}
                    status={exactStatus[key] ?? "idle"}
                    onAction={(kind) => handleExactAction(g, kind)}
                  />
                );
              })}
            </div>
          )}

          {/* Done collapsed */}
          {doneExact.length > 0 && (
            <div>
              <button type="button" onClick={() => setShowExactDone(v => !v)}
                className="flex items-center gap-2 text-xs font-semibold text-ink-500 hover:text-ink-700 transition">
                <span>{showExactDone ? "▲" : "▼"}</span>
                <span>{doneExact.length} حالة مكتملة</span>
              </button>
              {showExactDone && (
                <div className="mt-2 space-y-2 opacity-60">
                  {doneExact.map((g) => {
                    const key = `${g.place_a.id}__${g.place_b.id}`;
                    return (
                      <div key={key} className="flex items-center justify-between gap-3 rounded-xl border border-sal-100 bg-white px-4 py-2.5">
                        <span className="text-sm font-semibold text-ink-800">{g.place_a.name}</span>
                        <span className="text-ink-400 text-xs">↔</span>
                        <span className="text-sm text-ink-600">{g.place_b.name}</span>
                        <DoneTag state={exactStatus[key] ?? "idle"} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
