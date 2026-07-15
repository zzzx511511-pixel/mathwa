"use client";

import { useState, useEffect, useRef } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
type PlaceOption = {
  id: string;
  name: string;
  category: string;
  branches_count: number;
};

type FetchedBranch = {
  _googlePlaceId: string;
  name: string;
  address: string;
  city: string;
  neighborhood?: string;
  lat?: number;
  lng?: number;
  openingHours?: string;
  phone?: string;
  mapsUrl?: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  cafes: "مقاهي", restaurants: "مطاعم",
  clinics: "عيادات", salons: "صالونات", malls: "مولات",
};

// ── PlaceSelector ─────────────────────────────────────────────────────────────
function PlaceSelector({
  places,
  value,
  onChange,
}: {
  places: PlaceOption[];
  value: PlaceOption | null;
  onChange: (p: PlaceOption | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen]   = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) setQuery(value.name);
  }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = places.filter((p) =>
    p.name.includes(query) || p.id.includes(query)
  ).slice(0, 50);

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        placeholder="ابحث عن منشأة..."
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); onChange(null); }}
        onFocus={() => setOpen(true)}
        className="w-full rounded-xl border border-sal-200 bg-white px-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-sal-400 focus:outline-none"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-sal-100 bg-white shadow-lg">
          {filtered.map((p) => (
            <li
              key={p.id}
              onMouseDown={() => { onChange(p); setQuery(p.name); setOpen(false); }}
              className="cursor-pointer px-4 py-2.5 text-sm hover:bg-sal-50"
            >
              <span className="font-semibold text-ink-900">{p.name}</span>
              <span className="mr-2 text-[11px] text-ink-400">
                {CATEGORY_LABELS[p.category] ?? p.category} · {p.branches_count} فروع · {p.id}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function FullBranchFetchPage() {
  // Step 1: load all places for the selector
  const [allPlaces, setAllPlaces] = useState<PlaceOption[]>([]);
  const [placesLoading, setPlacesLoading] = useState(true);

  // Step 2: user selections
  const [selectedPlace, setSelectedPlace] = useState<PlaceOption | null>(null);
  const [searchName, setSearchName] = useState("");

  // Step 3: Google fetch
  const [fetchLoading, setFetchLoading]   = useState(false);
  const [fetchError, setFetchError]       = useState<string | null>(null);
  const [fetched, setFetched]             = useState<FetchedBranch[] | null>(null);

  // Step 4: checklist
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  // Step 5: save
  const [saveState, setSaveState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [saveMsg, setSaveMsg]     = useState("");

  // Load place list on mount
  useEffect(() => {
    fetch("/api/admin/all-places")
      .then((r) => r.json())
      .then((d: { places?: PlaceOption[] }) => setAllPlaces(d.places ?? []))
      .catch(() => {})
      .finally(() => setPlacesLoading(false));
  }, []);

  // When user picks a place, pre-fill the search name
  function handlePlaceSelect(p: PlaceOption | null) {
    setSelectedPlace(p);
    if (p) setSearchName(p.name);
    setFetched(null);
    setFetchError(null);
    setSaveState("idle");
  }

  async function fetchBranches() {
    if (!searchName.trim()) return;
    setFetchLoading(true);
    setFetchError(null);
    setFetched(null);
    setSaveState("idle");
    try {
      const url = `/api/place-branches?name=${encodeURIComponent(searchName.trim())}&paginate=true`;
      const res = await fetch(url);
      const data = await res.json() as { branches?: FetchedBranch[]; error?: string };
      if (data.error) { setFetchError(data.error); return; }
      const branches = data.branches ?? [];
      setFetched(branches);
      // Pre-check all
      const initial: Record<string, boolean> = {};
      branches.forEach((b) => { initial[b._googlePlaceId] = true; });
      setChecks(initial);
    } catch (err) {
      setFetchError((err as Error).message);
    } finally {
      setFetchLoading(false);
    }
  }

  const selected = (fetched ?? []).filter((b) => checks[b._googlePlaceId]);

  async function saveBranches() {
    if (!selectedPlace || !selected.length) return;
    setSaveState("saving");
    try {
      const res = await fetch("/api/admin/add-branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ place_id: selectedPlace.id, branches: selected }),
      });
      const data = await res.json() as { ok?: boolean; added?: number; total?: number; error?: string };
      if (!res.ok || !data.ok) {
        setSaveMsg(data.error ?? "خطأ غير معروف");
        setSaveState("error");
      } else {
        setSaveMsg(`تم حفظ ${data.added} فرع. إجمالي الفروع الآن: ${data.total}`);
        setSaveState("done");
      }
    } catch (err) {
      setSaveMsg((err as Error).message);
      setSaveState("error");
    }
  }

  const allChecked  = (fetched ?? []).every((b) => checks[b._googlePlaceId]);
  const noneChecked = (fetched ?? []).every((b) => !checks[b._googlePlaceId]);

  function toggleAll() {
    const next: Record<string, boolean> = {};
    (fetched ?? []).forEach((b) => { next[b._googlePlaceId] = !allChecked; });
    setChecks(next);
  }

  return (
    <div dir="rtl" className="mx-auto max-w-3xl space-y-8 px-5 py-10">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-ink-900">جلب الفروع الكاملة من قوقل</h1>
        <p className="mt-1 text-sm text-ink-500">
          اختر منشأة، ثم اجلب كل فروعها من قوقل مابس لمراجعتها وحفظها.
        </p>
      </div>

      {/* Step 1: pick place */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-ink-700">1. اختر المنشأة</h2>
        {placesLoading ? (
          <p className="text-xs text-ink-500">جاري تحميل قائمة المنشآت...</p>
        ) : (
          <PlaceSelector
            places={allPlaces}
            value={selectedPlace}
            onChange={handlePlaceSelect}
          />
        )}
        {selectedPlace && (
          <p className="text-[11px] text-ink-500">
            {selectedPlace.id} · {CATEGORY_LABELS[selectedPlace.category] ?? selectedPlace.category} ·
            {" "}{selectedPlace.branches_count} فرع حالي
          </p>
        )}
      </section>

      {/* Step 2: search name + fetch */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-ink-700">2. اسم البحث على قوقل</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="مثال: ستاربكس"
            className="flex-1 rounded-xl border border-sal-200 bg-white px-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-sal-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={fetchBranches}
            disabled={!searchName.trim() || fetchLoading}
            className="rounded-xl bg-sal-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-sal-700 disabled:opacity-40 transition"
          >
            {fetchLoading ? "جاري الجلب..." : "جلب الفروع"}
          </button>
        </div>
        {fetchLoading && (
          <p className="text-xs text-ink-500 animate-pulse">
            ⏳ جاري جلب النتائج من قوقل (قد يستغرق حتى 6 ثوانٍ لجلب كل الصفحات)...
          </p>
        )}
        {fetchError && (
          <p className="text-xs font-semibold text-red-600">خطأ: {fetchError}</p>
        )}
      </section>

      {/* Step 3: review checklist */}
      {fetched !== null && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink-700">
              3. راجع النتائج
              <span className="mr-2 rounded-full bg-sal-100 px-2 py-0.5 text-xs font-bold text-sal-700">
                {fetched.length} نتيجة
              </span>
            </h2>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs font-semibold text-sal-600 hover:text-sal-800 underline"
              >
                {allChecked ? "إلغاء الكل" : "تحديد الكل"}
              </button>
              <span className="text-xs text-ink-500">{selected.length} محدد</span>
            </div>
          </div>

          {fetched.length === 0 ? (
            <p className="text-sm text-ink-500 px-1">لم يُعثر على نتائج.</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-sal-100 bg-white">
              {fetched.map((b, idx) => (
                <label
                  key={b._googlePlaceId}
                  className={`flex cursor-pointer items-start gap-3 px-4 py-3 transition hover:bg-sal-50 ${
                    idx !== 0 ? "border-t border-sal-50" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!checks[b._googlePlaceId]}
                    onChange={(e) =>
                      setChecks((prev) => ({ ...prev, [b._googlePlaceId]: e.target.checked }))
                    }
                    className="mt-0.5 h-4 w-4 shrink-0 accent-sal-600"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink-900">{b.name}</p>
                    <p className="text-[11px] text-ink-500 mt-0.5">
                      {[b.neighborhood, b.address].filter(Boolean).join(" · ")}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-ink-400">
                      {b.openingHours && <span>⏰ {b.openingHours}</span>}
                      {b.phone        && <span>📞 {b.phone}</span>}
                      {b.mapsUrl && (
                        <a
                          href={b.mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-sal-500 underline hover:text-sal-700"
                        >
                          عرض في قوقل مابس ↗
                        </a>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Step 4: save */}
      {fetched !== null && fetched.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-ink-700">4. حفظ تحت المنشأة</h2>

          {!selectedPlace && (
            <p className="text-xs font-semibold text-amber-600">
              ⚠️ اختر منشأة أولاً من الخطوة 1 قبل الحفظ.
            </p>
          )}

          <button
            type="button"
            onClick={saveBranches}
            disabled={!selectedPlace || noneChecked || saveState === "saving" || saveState === "done"}
            className="rounded-xl bg-sal-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-sal-700 disabled:opacity-40 transition"
          >
            {saveState === "saving"
              ? "جاري الحفظ..."
              : `حفظ ${selected.length} فرع تحت "${selectedPlace?.name ?? "..."}"`}
          </button>

          {saveState === "done" && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
              <p className="text-sm font-semibold text-green-700">✓ {saveMsg}</p>
            </div>
          )}
          {saveState === "error" && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-semibold text-red-700">✗ {saveMsg}</p>
            </div>
          )}
        </section>
      )}

    </div>
  );
}
