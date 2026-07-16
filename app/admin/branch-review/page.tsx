"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { PLACES as INITIAL_PLACES } from "@/lib/salsabeel/data";
import { CATEGORIES, getCategoryMeta } from "@/lib/salsabeel/categories";
import type { Place, Branch, Category } from "@/lib/salsabeel/types";

// ── Types ────────────────────────────────────────────────────────────────────

type FetchStatus = "idle" | "loading" | "done" | "error";
type SaveStatus  = "idle" | "saving" | "saved" | "error";

interface FetchedBranch {
  _googlePlaceId: string;
  _placeName?: string;  // Original Google chain name — used for match-quality warning
  name: string;
  address: string;
  city: string;
  neighborhood?: string;
  lat?: number;
  lng?: number;
  openingHours?: string;
  phone?: string;
  mapsUrl?: string;
}

// Returns true when the Google result's chain name reasonably matches the search query.
// False → likely a different place surfaced by phonetic similarity (e.g. "لوسين" → "لوسيال").
function nameMatchesQuery(searchQuery: string, googlePlaceName: string): boolean {
  if (!googlePlaceName) return true; // unknown — don't warn
  const norm = (s: string) =>
    s.replace(/[ً-ْٰ]/g, "") // strip tashkeel
     .replace(/[أإآا]/g, "ا")               // normalize alef
     .replace(/[ةه]/g, "ه")
     .replace(/[يى]/g, "ي")
     .replace(/\([^)]*\)/g, "")             // remove parentheticals like "(Leciel)"
     .replace(/\s+/g, " ")
     .trim()
     .toLowerCase();
  const q = norm(searchQuery);
  const r = norm(googlePlaceName);
  if (!q || !r) return true;
  if (r.includes(q) || q.includes(r)) return true;
  // Word-level overlap: any meaningful word (≥ 3 chars) from query in result
  const qWords = q.split(/\s+/).filter(w => w.length >= 3);
  return qWords.some(w => r.includes(w));
}

interface PlaceFetchState {
  status: FetchStatus;
  branches: FetchedBranch[];
}

// ── Password gate (same pattern as main admin page) ───────────────────────────

function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw]       = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function tryLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) onAuth();
      else { setError(true); setPw(""); }
    } catch {
      setError(true); setPw("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sal-50 px-4" dir="rtl">
      <div className="w-full max-w-sm rounded-3xl border border-sal-100 bg-white p-8 shadow-xl space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-sal-100 text-3xl">🔒</div>
          <h1 className="text-xl font-extrabold text-ink-900">لوحة التحكم</h1>
          <p className="mt-1 text-sm text-ink-600">أدخل كلمة المرور للمتابعة</p>
        </div>
        <form onSubmit={tryLogin} className="space-y-4">
          <input
            type="password"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setError(false); }}
            placeholder="كلمة المرور"
            autoFocus
            className={`w-full rounded-2xl border px-4 py-3 text-sm text-center tracking-widest focus:outline-none ${
              error ? "border-red-400 bg-red-50" : "border-sal-200 focus:border-sal-500"
            }`}
          />
          {error && <p className="text-center text-xs font-semibold text-red-600">كلمة المرور غير صحيحة</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-sal-600 py-3 text-sm font-bold text-white hover:bg-sal-700 transition disabled:opacity-60"
          >
            {loading ? "جاري التحقق…" : "دخول"}
          </button>
        </form>
        <div className="text-center">
          <Link href="/" className="text-xs text-ink-500 hover:text-sal-600">← العودة للموقع</Link>
        </div>
      </div>
    </div>
  );
}

// ── Branch review panel (right side) ─────────────────────────────────────────

function PlaceReviewPanel({
  place, fetchState, approval, saveState,
  onToggle, onToggleAll, onSave, onRefetch, onNext, hasNext,
}: {
  place: Place;
  fetchState?: PlaceFetchState;
  approval?: boolean[];
  saveState: SaveStatus;
  onToggle: (i: number, checked: boolean) => void;
  onToggleAll: (val: boolean) => void;
  onSave: () => void;
  onRefetch: () => void;
  onNext: () => void;
  hasNext: boolean;
}) {
  const cat = getCategoryMeta(place.category);
  const approvedCount = (approval ?? []).filter(Boolean).length;
  const branches = fetchState?.branches ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold text-ink-500 mb-0.5">{cat?.icon} {cat?.label}</p>
          <h2 className="text-xl font-extrabold text-ink-900">{place.name}</h2>
          <p className="mt-0.5 text-xs text-ink-500">الفرع الحالي: {place.branches[0]?.address}</p>
        </div>
        {hasNext && (
          <button
            onClick={onNext}
            className="shrink-0 rounded-xl border border-sal-200 bg-white px-4 py-2 text-xs font-bold text-sal-700 hover:border-sal-400 transition"
          >
            التالية →
          </button>
        )}
      </div>

      {/* States */}
      {(!fetchState || fetchState.status === "idle") && (
        <div className="rounded-2xl border border-sal-100 bg-sal-50 p-8 text-center">
          <p className="text-sm text-ink-500">⏳ جارٍ جلب الفروع من قوقل…</p>
        </div>
      )}

      {fetchState?.status === "loading" && (
        <div className="rounded-2xl border border-sal-100 bg-sal-50 p-8 text-center animate-pulse">
          <p className="text-sm font-bold text-sal-600">🌐 جارٍ البحث عن فروع {place.name}…</p>
        </div>
      )}

      {fetchState?.status === "error" && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center space-y-3">
          <p className="text-sm font-bold text-red-700">حدث خطأ أثناء الجلب</p>
          <button
            onClick={onRefetch}
            className="rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition"
          >
            🔄 إعادة المحاولة
          </button>
        </div>
      )}

      {fetchState?.status === "done" && branches.length === 0 && (
        <div className="rounded-2xl border border-ink-100 bg-ink-50 p-8 text-center space-y-3">
          <p className="text-2xl">📍</p>
          <p className="text-sm font-bold text-ink-700">لم تُعثر على فروع إضافية من قوقل</p>
          <p className="text-xs text-ink-400">المنشأة على الأرجح موقع وحيد — انتقل للتالية</p>
          <div className="flex justify-center gap-2 pt-1">
            <button onClick={onRefetch} className="rounded-xl border border-ink-200 bg-white px-4 py-2 text-xs font-bold text-ink-600 hover:bg-ink-100 transition">
              🔄 إعادة الجلب
            </button>
            {hasNext && (
              <button onClick={onNext} className="rounded-xl bg-sal-600 px-4 py-2 text-xs font-bold text-white hover:bg-sal-700 transition">
                التالية →
              </button>
            )}
          </div>
        </div>
      )}

      {fetchState?.status === "done" && branches.length > 0 && (
        <div className="space-y-3">
          {/* Toggle all */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-ink-700">
              {branches.length} فرع مقترح — اختر ما تريد حفظه:
            </p>
            <div className="flex gap-2 text-[11px]">
              <button onClick={() => onToggleAll(true)} className="font-bold text-sal-600 hover:text-sal-800">تحديد الكل</button>
              <span className="text-ink-300">|</span>
              <button onClick={() => onToggleAll(false)} className="font-bold text-ink-500 hover:text-ink-700">إلغاء الكل</button>
            </div>
          </div>

          {/* Branch cards */}
          {branches.map((b, i) => {
            const checked   = approval?.[i] ?? true;
            const goodMatch = nameMatchesQuery(place.name, b._placeName ?? "");
            return (
              <label
                key={b._googlePlaceId}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                  checked ? "border-sal-200 bg-white shadow-sm" : "border-ink-100 bg-ink-50 opacity-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => onToggle(i, e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-sal-600"
                />
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm font-bold text-ink-900">{b.name}</p>
                    {!goodMatch && b._placeName && (
                      <span
                        title={`قوقل أرجع: "${b._placeName}" — قد لا يكون "${place.name}"`}
                        className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700"
                      >
                        ⚠️ اسم مختلف: {b._placeName}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-600">📍 {b.neighborhood ? `${b.neighborhood}، ` : ""}{b.address}</p>
                  {b.openingHours && <p className="text-xs text-ink-500">⏰ {b.openingHours}</p>}
                  {b.phone && <p className="text-xs text-ink-500" dir="ltr">📞 {b.phone}</p>}
                  {b.mapsUrl && (
                    <a href={b.mapsUrl} target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="block text-[10px] text-sal-500 underline hover:text-sal-700">
                      تحقق في قوقل مابس ↗
                    </a>
                  )}
                </div>
              </label>
            );
          })}

          {/* Save / Next */}
          <div className="flex items-center gap-3 pt-1">
            {saveState === "saved" ? (
              <div className="flex-1 rounded-2xl border border-green-200 bg-green-50 py-3 text-center text-xs font-bold text-green-700">
                ✅ تم حفظ {approvedCount} فرع بنجاح
              </div>
            ) : (
              <button
                onClick={onSave}
                disabled={approvedCount === 0 || saveState === "saving"}
                className="flex-1 rounded-2xl bg-sal-600 py-3 text-xs font-bold text-white hover:bg-sal-700 disabled:opacity-40 transition"
              >
                {saveState === "saving" ? "⏳ جارٍ الحفظ…" : `✓ حفظ ${approvedCount} فرع محدد`}
              </button>
            )}
            {saveState === "error" && (
              <p className="text-xs font-bold text-red-600">فشل الحفظ، حاول مجددًا</p>
            )}
            {hasNext && (
              <button
                onClick={onNext}
                className="shrink-0 rounded-2xl border border-sal-200 bg-white px-5 py-3 text-xs font-bold text-sal-700 hover:border-sal-400 transition"
              >
                التالية →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────

function BranchReviewDashboard() {
  const [allPlaces, setAllPlaces] = useState<Place[]>(INITIAL_PLACES);
  const [search, setSearch]       = useState("");
  const [catFilter, setCatFilter] = useState<Category | "">("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [fetchStates, setFetchStates] = useState<Record<string, PlaceFetchState>>({});
  const [approvals, setApprovals]     = useState<Record<string, boolean[]>>({});
  const [saveStates, setSaveStates]   = useState<Record<string, SaveStatus>>({});

  const batchRunning = useRef(false);
  const [batchProgress, setBatchProgress] = useState<{ done: number; total: number } | null>(null);

  // Merge custom places from Supabase on mount
  useEffect(() => {
    fetch("/api/places")
      .then((r) => r.json())
      .then((custom: Place[]) => {
        if (!custom.length) return;
        setAllPlaces((prev) => {
          const customById = new Map(custom.map((p) => [p.id, p]));
          const merged = prev.map((p) => (customById.has(p.id) ? customById.get(p.id)! : p));
          const existing = new Set(prev.map((p) => p.id));
          const newOnes = custom.filter((p) => !existing.has(p.id) && !p._deleted);
          return [...merged.filter((p) => !customById.get(p.id)?._deleted), ...newOnes];
        });
      })
      .catch(() => {});
  }, []);

  // Places with exactly 1 branch (likely need more)
  const filteredPlaces = useMemo(
    () =>
      allPlaces
        .filter((p) => !p._deleted && p.branches.length === 1)
        .filter((p) => !catFilter || p.category === catFilter)
        .filter((p) => !search || p.name.includes(search)),
    [allPlaces, catFilter, search]
  );

  const selectedPlace = useMemo(
    () => allPlaces.find((p) => p.id === selectedId) ?? null,
    [allPlaces, selectedId]
  );

  // Auto-fetch on selection
  useEffect(() => {
    if (!selectedId) return;
    const state = fetchStates[selectedId];
    if (state && state.status !== "idle") return;
    const place = allPlaces.find((p) => p.id === selectedId);
    if (place) doFetch(place.id, place.name);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  async function doFetch(placeId: string, placeName: string) {
    const cur = fetchStates[placeId];
    if (cur?.status === "loading") return;
    setFetchStates((prev) => ({ ...prev, [placeId]: { status: "loading", branches: [] } }));
    try {
      const res  = await fetch(`/api/place-branches?name=${encodeURIComponent(placeName)}`);
      const data = await res.json();
      const branches: FetchedBranch[] = data.branches ?? [];
      setFetchStates((prev) => ({ ...prev, [placeId]: { status: "done", branches } }));
      setApprovals((prev) => ({ ...prev, [placeId]: branches.map(() => true) }));
    } catch {
      setFetchStates((prev) => ({ ...prev, [placeId]: { status: "error", branches: [] } }));
    }
  }

  // Batch fetch with 3 concurrent workers
  async function startBatchFetch() {
    const toFetch = filteredPlaces.filter(
      (p) => !fetchStates[p.id] || fetchStates[p.id].status === "idle"
    );
    if (!toFetch.length || batchRunning.current) return;

    batchRunning.current = true;
    const queue = [...toFetch];
    let done = 0;
    setBatchProgress({ done: 0, total: toFetch.length });

    async function worker() {
      while (queue.length > 0 && batchRunning.current) {
        const place = queue.shift()!;
        await doFetch(place.id, place.name);
        done++;
        setBatchProgress({ done, total: toFetch.length });
      }
    }

    await Promise.all([worker(), worker(), worker()]);
    batchRunning.current = false;
    setBatchProgress(null);
  }

  function stopBatchFetch() {
    batchRunning.current = false;
    setBatchProgress(null);
  }

  async function savePlace(placeId: string) {
    const place    = allPlaces.find((p) => p.id === placeId);
    const state    = fetchStates[placeId];
    const approval = approvals[placeId];
    if (!place || state?.status !== "done" || !approval) return;

    const approvedBranches: Branch[] = state.branches
      .filter((_, i) => approval[i])
      .map((b) => ({
        id:           "",  // stamped by add-branches route
        name:         b.name,
        address:      b.address,
        city:         b.city,
        neighborhood: b.neighborhood,
        lat:          b.lat,
        lng:          b.lng,
        openingHours: b.openingHours,
        phone:        b.phone,
        mapsUrl:      b.mapsUrl,
      }));

    if (!approvedBranches.length) return;

    setSaveStates((prev) => ({ ...prev, [placeId]: "saving" }));
    try {
      const res = await fetch("/api/admin/add-branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ place_id: placeId, branches: approvedBranches }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "فشل الحفظ");
      setSaveStates((prev) => ({ ...prev, [placeId]: "saved" }));
      // Update local display (IDs will be stamped server-side)
      setAllPlaces((prev) =>
        prev.map((p) =>
          p.id === placeId
            ? { ...p, branches: [...p.branches, ...approvedBranches] }
            : p
        )
      );
    } catch {
      setSaveStates((prev) => ({ ...prev, [placeId]: "error" }));
    }
  }

  function goNext() {
    const idx = filteredPlaces.findIndex((p) => p.id === selectedId);
    if (idx < filteredPlaces.length - 1) setSelectedId(filteredPlaces[idx + 1].id);
  }

  const savedCount   = Object.values(saveStates).filter((s) => s === "saved").length;
  const fetchedCount = Object.values(fetchStates).filter((s) => s.status === "done").length;
  const pendingCount = filteredPlaces.filter(
    (p) => !fetchStates[p.id] || fetchStates[p.id].status === "idle"
  ).length;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-sal-50" dir="rtl">

      {/* ── Top bar ── */}
      <div className="flex shrink-0 items-center justify-between border-b border-sal-200 bg-white px-4 py-3 gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/admin"
            className="rounded-lg border border-sal-200 bg-sal-50 px-3 py-1.5 text-xs font-semibold text-sal-700 hover:bg-sal-100 transition"
          >
            ← لوحة التحكم
          </Link>
          <span className="text-ink-300">/</span>
          <div>
            <h1 className="text-sm font-extrabold text-ink-900">مراجعة الفروع — دفعة شاملة</h1>
            <p className="text-[10px] text-ink-400">جلب فروع كل المنشآت ذات الفرع الواحد تلقائيًا · لمنشأة واحدة بعينها ←
              <Link href="/admin/full-branch-fetch" className="mr-1 text-sal-600 underline hover:text-sal-800">جلب مستهدف</Link>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          {savedCount > 0 && (
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 font-bold text-green-700">
              ✅ {savedCount} محفوظة
            </span>
          )}
          {fetchedCount > 0 && (
            <span className="rounded-full bg-sal-100 px-2.5 py-0.5 font-bold text-sal-700">
              🔍 {fetchedCount} جُلبت
            </span>
          )}
          <span className="text-ink-500">{filteredPlaces.length} منشأة</span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ── */}
        <div className="flex w-64 shrink-0 flex-col border-l border-sal-200 bg-white">

          {/* Filters */}
          <div className="space-y-2 border-b border-sal-100 p-3">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن منشأة…"
              className="w-full rounded-lg border border-sal-200 px-3 py-1.5 text-xs focus:border-sal-500 focus:outline-none"
            />
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value as Category | "")}
              className="w-full rounded-lg border border-sal-200 px-3 py-1.5 text-xs focus:border-sal-500 focus:outline-none"
            >
              <option value="">كل الفئات</option>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>{c.icon} {c.label}</option>
              ))}
            </select>

            {/* Batch fetch */}
            {batchProgress ? (
              <div className="space-y-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-sal-100">
                  <div
                    className="h-full rounded-full bg-sal-500 transition-all duration-300"
                    style={{ width: `${Math.round((batchProgress.done / batchProgress.total) * 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-ink-500">
                  <span>{batchProgress.done}/{batchProgress.total}</span>
                  <button onClick={stopBatchFetch} className="font-bold text-red-500 hover:text-red-700">
                    إيقاف
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={startBatchFetch}
                disabled={pendingCount === 0}
                className="w-full rounded-lg border border-sal-200 bg-sal-50 py-1.5 text-[11px] font-bold text-sal-700 hover:bg-sal-100 disabled:opacity-40 transition"
              >
                🌐 جلب الجميع تلقائيًا ({pendingCount})
              </button>
            )}
          </div>

          {/* Place list */}
          <div className="flex-1 overflow-y-auto">
            {filteredPlaces.map((place) => {
              const state    = fetchStates[place.id];
              const save     = saveStates[place.id];
              const isActive = place.id === selectedId;
              const cat      = getCategoryMeta(place.category);

              return (
                <button
                  key={place.id}
                  onClick={() => setSelectedId(place.id)}
                  className={`w-full border-b border-sal-50 px-3 py-2.5 text-right transition ${
                    isActive
                      ? "border-l-2 border-l-sal-500 bg-sal-100"
                      : "hover:bg-sal-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <p className="truncate text-xs font-bold text-ink-900">{place.name}</p>
                    {save === "saved" ? (
                      <span className="shrink-0 text-green-600 text-[11px]">✅</span>
                    ) : state?.status === "loading" ? (
                      <span className="shrink-0 text-[10px] text-sal-400">⏳</span>
                    ) : state?.status === "done" && state.branches.length > 0 ? (
                      <span className="shrink-0 rounded-full bg-sal-100 px-1.5 text-[10px] font-bold text-sal-700">
                        {state.branches.length}
                      </span>
                    ) : state?.status === "done" && state.branches.length === 0 ? (
                      <span className="shrink-0 text-[10px] text-ink-400">—</span>
                    ) : state?.status === "error" ? (
                      <span className="shrink-0 text-[10px] text-red-400">✕</span>
                    ) : null}
                  </div>
                  <p className="text-[10px] text-ink-400 mt-0.5">{cat?.icon} {cat?.label}</p>
                </button>
              );
            })}

            {filteredPlaces.length === 0 && (
              <p className="p-5 text-center text-xs text-ink-400">لا توجد نتائج</p>
            )}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedPlace ? (
            <div className="flex h-full items-center justify-center">
              <div className="space-y-3 text-center">
                <p className="text-5xl">📍</p>
                <p className="text-sm font-bold text-ink-700">اختر منشأة من القائمة</p>
                <p className="text-xs text-ink-500">سيتم جلب فروعها من قوقل تلقائيًا عند الاختيار</p>
                {pendingCount > 0 && (
                  <button
                    onClick={startBatchFetch}
                    className="mt-2 rounded-xl bg-sal-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-sal-700 transition"
                  >
                    🌐 ابدأ جلب كل المنشآت ({pendingCount})
                  </button>
                )}
              </div>
            </div>
          ) : (
            <PlaceReviewPanel
              place={selectedPlace}
              fetchState={fetchStates[selectedPlace.id]}
              approval={approvals[selectedPlace.id]}
              saveState={saveStates[selectedPlace.id] ?? "idle"}
              onToggle={(i, checked) =>
                setApprovals((prev) => {
                  const cur = [...(prev[selectedPlace.id] ?? [])];
                  cur[i] = checked;
                  return { ...prev, [selectedPlace.id]: cur };
                })
              }
              onToggleAll={(val) =>
                setApprovals((prev) => ({
                  ...prev,
                  [selectedPlace.id]: (fetchStates[selectedPlace.id]?.branches ?? []).map(() => val),
                }))
              }
              onSave={() => savePlace(selectedPlace.id)}
              onRefetch={() => {
                const p = allPlaces.find((x) => x.id === selectedPlace.id);
                if (p) doFetch(p.id, p.name);
              }}
              onNext={goNext}
              hasNext={filteredPlaces.findIndex((p) => p.id === selectedId) < filteredPlaces.length - 1}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page entry ────────────────────────────────────────────────────────────────

export default function BranchReviewPage() {
  const [authed, setAuthed]   = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch("/api/admin-auth")
      .then((r) => r.json())
      .then((d: { authed?: boolean }) => { if (d.authed) setAuthed(true); })
      .catch(() => {})
      .finally(() => setChecked(true));
  }, []);

  if (!checked) return null;
  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />;
  return <BranchReviewDashboard />;
}
