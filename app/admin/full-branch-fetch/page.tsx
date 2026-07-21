"use client";

import Link from "next/link";
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
  _placeName?: string;   // Original Google chain name — used for search-quality warning
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

type ExistingBranch = {
  id: string;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  cafes: "مقاهي", restaurants: "مطاعم",
  clinics: "عيادات", salons: "صالونات", malls: "مولات",
};

// Returns true when the Google result's chain name reasonably matches the query.
function nameMatchesQuery(searchQuery: string, googlePlaceName: string): boolean {
  if (!googlePlaceName) return true;
  const norm = (s: string) =>
    s.replace(/[ً-ْٰ]/g, "").replace(/[أإآا]/g, "ا").replace(/[ةه]/g, "ه").replace(/[يى]/g, "ي")
     .replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim().toLowerCase();
  const q = norm(searchQuery);
  const r = norm(googlePlaceName);
  if (!q || !r) return true;
  if (r.includes(q) || q.includes(r)) return true;
  return q.split(/\s+/).filter(w => w.length >= 3).some(w => r.includes(w));
}

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Extract a Google Place ID from a Maps URL or bare ChIJ... string.
function extractPlaceId(raw: string): string {
  const trimmed = raw.trim();
  const m1 = trimmed.match(/place_id[=:]([A-Za-z0-9_-]+)/);
  if (m1) return m1[1];
  const m2 = trimmed.match(/\b(ChIJ[A-Za-z0-9_-]+)/);
  if (m2) return m2[1];
  return trimmed;
}

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
function FullBranchFetchDashboard() {
  const [allPlaces, setAllPlaces]     = useState<PlaceOption[]>([]);
  const [placesLoading, setPlacesLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState<PlaceOption | null>(null);
  const [searchName, setSearchName]   = useState("");
  const [existingBranches, setExistingBranches] = useState<ExistingBranch[]>([]);

  // Google fetch
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError]     = useState<string | null>(null);
  const [fetched, setFetched]           = useState<FetchedBranch[] | null>(null);

  // Checklist
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  // Manual single-GID add
  const [manualGid, setManualGid]           = useState("");
  const [manualLoading, setManualLoading]   = useState(false);
  const [manualError, setManualError]       = useState("");

  // Save
  const [saveState, setSaveState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [saveMsg, setSaveMsg]     = useState("");

  // M5: photo cache reset
  const [resetGid, setResetGid]     = useState("");
  const [resetState, setResetState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [resetPhotos, setResetPhotos] = useState<string[]>([]);
  const [resetError, setResetError]   = useState("");

  const photoSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/admin/all-places")
      .then((r) => r.json())
      .then((d: { places?: PlaceOption[] }) => setAllPlaces(d.places ?? []))
      .catch(() => {})
      .finally(() => setPlacesLoading(false));
  }, []);

  // Fetch existing branches whenever selected place changes (for M1 comparison)
  useEffect(() => {
    if (!selectedPlace) { setExistingBranches([]); return; }
    fetch(`/api/admin/place-info?place_id=${encodeURIComponent(selectedPlace.id)}`)
      .then((r) => r.json())
      .then((d: { branches?: ExistingBranch[] }) => setExistingBranches(d.branches ?? []))
      .catch(() => setExistingBranches([]));
  }, [selectedPlace]);

  function isNearExisting(lat?: number, lng?: number): boolean {
    if (lat == null || lng == null) return false;
    return existingBranches.some((b) => {
      if (b.lat == null || b.lng == null) return false;
      return haversineM(lat, lng, b.lat, b.lng) < 200;
    });
  }

  function handlePlaceSelect(p: PlaceOption | null) {
    setSelectedPlace(p);
    if (p) setSearchName(p.name);
    setFetched(null);
    setFetchError(null);
    setSaveState("idle");
    setResetState("idle");
    setResetGid("");
    setManualGid("");
    setManualError("");
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
      // M1: pre-uncheck branches already registered within 200 m
      const initial: Record<string, boolean> = {};
      branches.forEach((b) => {
        initial[b._googlePlaceId] = !isNearExisting(b.lat, b.lng);
      });
      setChecks(initial);
    } catch (err) {
      setFetchError((err as Error).message);
    } finally {
      setFetchLoading(false);
    }
  }

  // Add a single branch by its Google Place ID
  async function fetchManualBranch() {
    const pid = extractPlaceId(manualGid);
    if (!pid) return;
    setManualLoading(true);
    setManualError("");
    try {
      const res = await fetch(`/api/place-branches?gid=${encodeURIComponent(pid)}`);
      const data = await res.json() as { branches?: FetchedBranch[] };
      const branches = data.branches ?? [];
      if (!branches.length) {
        setManualError("لم يُعثر على بيانات لهذا المعرّف — تأكد من صحته");
        return;
      }
      // Append to list if not already present
      setFetched((prev) => {
        const base = prev ?? [];
        const existing = new Set(base.map((b) => b._googlePlaceId));
        const fresh = branches.filter((b) => !existing.has(b._googlePlaceId));
        return [...base, ...fresh];
      });
      // Pre-check the new branch
      const gid = branches[0]._googlePlaceId;
      setChecks((prev) => ({ ...prev, [gid]: true }));
      setManualGid("");
    } catch (err) {
      setManualError((err as Error).message);
    } finally {
      setManualLoading(false);
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
      const data = await res.json() as {
        ok?: boolean; added?: number; updated?: number; total?: number;
        gid_changed?: boolean; new_gid?: string; error?: string;
      };
      if (!res.ok || !data.ok) {
        setSaveMsg(data.error ?? "خطأ غير معروف");
        setSaveState("error");
      } else {
        const parts = [];
        if (data.added)      parts.push(`${data.added} فرع جديد`);
        if (data.updated)    parts.push(`${data.updated} فرع مُحدَّث`);
        if (data.gid_changed) parts.push(`✓ تم تحديث Google Place ID للمنشأة`);
        setSaveMsg(`${parts.join(" · ")}. إجمالي الفروع الآن: ${data.total}`);
        setSaveState("done");
        const gid = selected[0]?._googlePlaceId;
        if (gid) {
          setResetGid(gid);
          setTimeout(() => photoSectionRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
          // Auto-fetch photos immediately — no manual button press needed
          await doPhotoReset(selectedPlace.id, gid, selectedPlace.name);
        }
      }
    } catch (err) {
      setSaveMsg((err as Error).message);
      setSaveState("error");
    }
  }

  async function doPhotoReset(placeId: string, gid: string, placeName: string) {
    setResetState("loading");
    setResetPhotos([]);
    setResetError("");
    try {
      const res = await fetch("/api/admin/reset-place-cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ place_id: placeId, google_place_id: gid, place_name: placeName }),
      });
      const data = await res.json() as { new_photos?: string[]; error?: string };
      if (!res.ok || data.error) {
        setResetError(data.error ?? "خطأ غير معروف");
        setResetState("error");
      } else {
        setResetPhotos(data.new_photos ?? []);
        setResetState("done");
      }
    } catch (err) {
      setResetError((err as Error).message);
      setResetState("error");
    }
  }

  async function resetPhotoCache() {
    if (!selectedPlace || !resetGid.trim()) return;
    await doPhotoReset(selectedPlace.id, resetGid.trim(), selectedPlace.name);
  }

  const allChecked  = (fetched ?? []).length > 0 && (fetched ?? []).every((b) => checks[b._googlePlaceId]);
  const noneChecked = (fetched ?? []).every((b) => !checks[b._googlePlaceId]);

  function toggleAll() {
    const next: Record<string, boolean> = {};
    (fetched ?? []).forEach((b) => { next[b._googlePlaceId] = !allChecked; });
    setChecks(next);
  }

  return (
    <div dir="rtl" className="mx-auto max-w-3xl space-y-8 px-5 py-10">

      {/* Back link + Header */}
      <div>
        <div className="mb-3 flex items-center gap-2 text-xs flex-wrap">
          <Link href="/admin" className="font-semibold text-sal-600 hover:text-sal-800">← لوحة التحكم</Link>
          <span className="text-ink-300">·</span>
          <Link href="/admin/branch-review" className="text-ink-400 hover:text-sal-600">مراجعة الكل دفعة</Link>
          <span className="text-ink-300">·</span>
          <Link href="/admin/merge-review" className="text-ink-400 hover:text-sal-600">تنظيف التكرارات</Link>
        </div>
        <h1 className="text-2xl font-extrabold text-ink-900">فروع منشأة بعينها — جلب من قوقل</h1>
        <p className="mt-1 text-sm text-ink-500">
          للمنشآت بفرع واحد فقط وتريد مراجعة الكل دفعة، استخدم{" "}
          <Link href="/admin/branch-review" className="text-sal-600 underline">مراجعة الكل</Link>.
        </p>
      </div>

      {/* Step 1: pick place */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-ink-700">1. اختر المنشأة</h2>
        {placesLoading ? (
          <p className="text-xs text-ink-500">جاري تحميل قائمة المنشآت...</p>
        ) : (
          <PlaceSelector places={allPlaces} value={selectedPlace} onChange={handlePlaceSelect} />
        )}
        {selectedPlace && (
          <p className="text-[11px] text-ink-500">
            {selectedPlace.id} · {CATEGORY_LABELS[selectedPlace.category] ?? selectedPlace.category} ·
            {" "}{selectedPlace.branches_count} فرع حالي
            {existingBranches.length > 0 && (
              <span className="mr-1 text-ink-400">
                ({existingBranches.length} فرع مُحمَّل للمقارنة)
              </span>
            )}
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
            onKeyDown={(e) => e.key === "Enter" && fetchBranches()}
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
              3. راجع النتائج وأكّد الفروع
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
              <span className="text-xs text-ink-500">{selected.length} مؤكد</span>
            </div>
          </div>

          {fetched.length === 0 ? (
            <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-4 text-sm">
              <p className="font-semibold text-amber-700">لم يُعثر على نتائج</p>
              <p className="mt-1 text-xs text-amber-600">
                قد يكون اسم المنشأة مختلفًا في قوقل. جرّب تعديل اسم البحث (مثال: أضف &quot;مطعم&quot; أو غيّر الإملاء)،
                أو استخدم &quot;إضافة فرع بـ Place ID&quot; أدناه لإضافة فرع تعرف معرّفه مباشرة.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-sal-100 bg-white">
              {fetched.map((b, idx) => {
                const alreadyReg  = isNearExisting(b.lat, b.lng);
                const isConfirmed = !!checks[b._googlePlaceId];
                return (
                  <div
                    key={b._googlePlaceId}
                    className={`flex items-start gap-3 px-4 py-3 transition ${
                      idx !== 0 ? "border-t border-sal-50" : ""
                    } ${isConfirmed ? "bg-green-50/40" : "opacity-60"}`}
                  >
                    {/* Single toggle: confirmed ↔ rejected */}
                    <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
                      <button
                        type="button"
                        title={isConfirmed ? "مؤكد — اضغط للاستبعاد" : "مستبعد — اضغط للتأكيد"}
                        onClick={() => setChecks((p) => ({ ...p, [b._googlePlaceId]: !p[b._googlePlaceId] }))}
                        className={`h-9 w-9 rounded-full border-2 text-sm font-bold transition ${
                          isConfirmed
                            ? "border-green-500 bg-green-500 text-white hover:border-red-400 hover:bg-red-50 hover:text-red-500"
                            : "border-red-300 bg-red-50 text-red-400 hover:border-green-500 hover:bg-green-50 hover:text-green-600"
                        }`}
                      >
                        {isConfirmed ? "✓" : "✗"}
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-ink-900">{b.name}</p>
                        {alreadyReg && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                            مسجل بالفعل
                          </span>
                        )}
                        {isConfirmed && !alreadyReg && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                            مؤكد
                          </span>
                        )}
                        {b._placeName && !nameMatchesQuery(searchName, b._placeName) && (
                          <span
                            title={`قوقل أرجع: "${b._placeName}" — قد لا يكون المطلوب`}
                            className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700"
                          >
                            ⚠️ {b._placeName}
                          </span>
                        )}
                      </div>
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
                            className="text-sal-500 underline hover:text-sal-700"
                          >
                            تحقق في قوقل مابس ↗
                          </a>
                        )}
                        <span className="text-ink-300 font-mono">{b._googlePlaceId}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Manual Place ID add */}
          <div className="rounded-xl border border-dashed border-sal-200 bg-sal-50/40 px-4 py-3 space-y-2">
            <p className="text-xs font-semibold text-ink-600">
              الفرع الصحيح غير موجود في النتائج؟ أضفه يدويًا بـ Place ID أو رابط قوقل مابس
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                dir="ltr"
                value={manualGid}
                onChange={(e) => { setManualGid(e.target.value); setManualError(""); }}
                onKeyDown={(e) => e.key === "Enter" && fetchManualBranch()}
                placeholder="ChIJ... أو https://maps.google.com/..."
                className="flex-1 rounded-xl border border-sal-200 bg-white px-3 py-2 text-xs text-ink-900 placeholder:text-ink-400 focus:border-sal-400 focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={fetchManualBranch}
                disabled={!manualGid.trim() || manualLoading}
                className="rounded-xl bg-sal-500 px-4 py-2 text-xs font-bold text-white hover:bg-sal-600 disabled:opacity-40 transition"
              >
                {manualLoading ? "..." : "جلب"}
              </button>
            </div>
            {manualError && (
              <p className="text-[11px] font-semibold text-red-600">{manualError}</p>
            )}
          </div>
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
              : `حفظ ${selected.length} فرع مؤكد تحت "${selectedPlace?.name ?? "..."}"`}
          </button>

          {saveState === "done" && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
              <p className="text-sm font-semibold text-green-700">✓ {saveMsg}</p>
              {resetGid && (
                <p className="mt-1 text-xs text-green-600">
                  جاري جلب الصور تلقائيًا... ↓
                </p>
              )}
            </div>
          )}
          {saveState === "error" && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-semibold text-red-700">✗ {saveMsg}</p>
            </div>
          )}
        </section>
      )}

      {/* M5: photo cache reset */}
      {selectedPlace && (
        <section ref={photoSectionRef} className="space-y-3 border-t border-sal-100 pt-6">
          <h2 className="text-sm font-bold text-ink-700">تحديث صور المنشأة بمعرّف قوقل</h2>
          <p className="text-[11px] text-ink-500">
            تُجلب الصور تلقائيًا بعد الحفظ. لإعادة الجلب يدويًا أو تصحيح Place ID خاطئ، عدّله أدناه ثم اضغط &quot;تحديث&quot;.
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              dir="ltr"
              value={resetGid}
              onChange={(e) => { setResetGid(e.target.value); setResetState("idle"); }}
              placeholder="ChIJ... (Google Place ID)"
              className="flex-1 rounded-xl border border-sal-200 bg-white px-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-sal-400 focus:outline-none font-mono"
            />
            <button
              type="button"
              onClick={resetPhotoCache}
              disabled={!resetGid.trim() || resetState === "loading"}
              className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-40 transition"
            >
              {resetState === "loading" ? "جاري..." : "تحديث"}
            </button>
          </div>

          {resetState === "done" && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 space-y-2">
              <p className="text-sm font-semibold text-green-700">
                ✓ تم مسح الذاكرة وجلب {resetPhotos.length} صورة جديدة
              </p>
              {resetPhotos.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {resetPhotos.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-sal-600 underline hover:text-sal-800">
                      صورة {i + 1} ↗
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
          {resetState === "error" && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-semibold text-red-700">✗ {resetError}</p>
            </div>
          )}
        </section>
      )}

    </div>
  );
}

// ── Password Gate ─────────────────────────────────────────────────────────────
function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw] = useState("");
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
      if (res.ok) { onAuth(); } else { setError(true); setPw(""); }
    } catch { setError(true); setPw(""); } finally { setLoading(false); }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sal-50 px-4">
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
          <button type="submit" disabled={loading}
            className="w-full rounded-2xl bg-sal-600 py-3 text-sm font-bold text-white hover:bg-sal-700 transition disabled:opacity-60">
            {loading ? "جاري التحقق…" : "دخول"}
          </button>
        </form>
        <div className="text-center">
          <Link href="/admin" className="text-xs text-ink-500 hover:text-sal-600">← لوحة التحكم الرئيسية</Link>
        </div>
      </div>
    </div>
  );
}

// ── Page entry ────────────────────────────────────────────────────────────────
export default function FullBranchFetchPage() {
  const [authed, setAuthed] = useState(false);
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
  return <FullBranchFetchDashboard />;
}
