"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { matchesQuery, expandQuery } from "@/lib/salsabeel/search";
import Link from "next/link";
import { PLACES as INITIAL_PLACES } from "@/lib/salsabeel/data";
import { CATEGORIES, getCategoryMeta } from "@/lib/salsabeel/categories";
import { RatingStars } from "@/components/salsabeel/rating-stars";
import type { Place, Category, Branch, Region } from "@/lib/salsabeel/types";
import { CLINIC_SPECS } from "@/lib/salsabeel/types";
import { LocationPicker } from "@/components/salsabeel/location-picker";

// ── Name similarity check ─────────────────────────────────────────────────────
// Returns true when the two names are likely the same place (safe to auto-select).
// Returns false when they appear to be unrelated businesses (show confirmation).
function namesSimilar(dbName: string, googleName: string): boolean {
  const norm = (s: string) =>
    s.replace(/\([^)]*\)/g, "").toLowerCase().trim(); // strip parenthetical
  const a = norm(dbName);
  const b = norm(googleName);
  if (!a || !b) return true;

  const hasArabic = (s: string) => /[؀-ۿ]/.test(s);

  // Cross-script pair (e.g. "نمق" vs "Namq Coffee"): can't compare — trust user
  if (hasArabic(a) !== hasArabic(b)) return true;

  // Same script: word overlap (any shared word ≥ 2 chars)
  const words = (s: string) => s.split(/\s+/).filter((w) => w.length >= 2);
  const setB = new Set(words(b));
  if (words(a).some((w) => setB.has(w))) return true;

  // Substring containment (e.g. "بيسمنترز" ⊂ "بيسمنترز القيروان")
  const aCore = a.replace(/\s+/g, "");
  const bCore = b.replace(/\s+/g, "");
  if (aCore.length >= 3 && (bCore.includes(aCore) || aCore.includes(bCore))) return true;

  return false; // looks like a different business → show confirmation
}

// ── Map Modal for Place ID selection ─────────────────────────────────────────
function PlaceMapModal({
  name,
  onSelect,
  onClose,
}: {
  name: string;
  onSelect: (id: string, placeName: string) => void;
  onClose: () => void;
}) {
  const mapDivRef      = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null);
  const markerRef      = useRef<import("leaflet").Marker | null>(null);
  const [nearby, setNearby]       = useState<{ place_id: string; name: string; address: string }[]>([]);
  const [loading, setLoading]     = useState(false);
  const [clicked, setClicked]     = useState(false);
  const [geoQuery, setGeoQuery]   = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError]   = useState("");
  const [pendingResult, setPendingResult] = useState<{ place_id: string; name: string; address: string } | null>(null);

  useEffect(() => {
    if (!mapDivRef.current || mapInstanceRef.current) return;

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id   = "leaflet-css";
      link.rel  = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    import("leaflet").then((L) => {
      if (!mapDivRef.current || mapInstanceRef.current) return;

      const proto = L.Icon.Default.prototype as unknown as Record<string, unknown>;
      delete proto._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapDivRef.current, { center: [24.69, 46.69], zoom: 12 });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      map.on("click", async (e: import("leaflet").LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        setClicked(true);
        setNearby([]);
        setLoading(true);

        if (markerRef.current) markerRef.current.remove();
        const pinIcon = L.divIcon({
          html: '<span style="font-size:32px;line-height:1;display:block;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.4))">📍</span>',
          className: "",
          iconSize: [32, 32],
          iconAnchor: [10, 32],
        });
        markerRef.current = L.marker([lat, lng], { icon: pinIcon }).addTo(map);

        try {
          const res  = await fetch(`/api/place-nearby?lat=${lat}&lng=${lng}&name=${encodeURIComponent(name)}`);
          const data = await res.json() as { results?: { place_id: string; name: string; address: string }[] };
          setNearby(data.results ?? []);
        } catch {
          setNearby([]);
        } finally {
          setLoading(false);
        }
      });

      mapInstanceRef.current = map;
    });

    return () => { mapInstanceRef.current?.remove(); mapInstanceRef.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function flyToLocation() {
    const q = geoQuery.trim();
    if (!q || !mapInstanceRef.current) return;
    setGeoLoading(true);
    setGeoError("");
    try {
      // Try Google Places first (finds business names)
      const placeRes = await fetch(`/api/place-search?q=${encodeURIComponent(q)}`);
      const placeData = await placeRes.json() as { results: { lat?: number; lng?: number }[] };
      const first = placeData.results?.[0];
      if (first?.lat != null && first?.lng != null) {
        mapInstanceRef.current.flyTo([first.lat, first.lng], 17, { duration: 1 });
        return;
      }

      // Fall back to Nominatim for pure geographic names
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("q", `${q} الرياض`);
      url.searchParams.set("format", "json");
      url.searchParams.set("limit", "1");
      url.searchParams.set("countrycodes", "sa");
      const res  = await fetch(url.toString(), { headers: { "Accept-Language": "ar" } });
      const data = await res.json() as { lat: string; lon: string }[];
      if (data[0]) {
        mapInstanceRef.current.flyTo([parseFloat(data[0].lat), parseFloat(data[0].lon)], 16, { duration: 1 });
      } else {
        setGeoError("لم يُعثر على هذا المكان — جرب اسماً آخر");
      }
    } catch {
      setGeoError("خطأ في البحث — تحقق من الاتصال");
    } finally {
      setGeoLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        style={{ maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-sal-100 px-5 py-3">
          <h3 className="text-sm font-black text-ink-900">🗺️ حدد الموقع على الخريطة</h3>
          <button type="button" onClick={onClose} className="text-xl leading-none text-ink-400 hover:text-ink-700">✕</button>
        </div>

        {/* Location search */}
        <div className="border-b border-sal-100 bg-sal-50 px-4 py-2.5 space-y-1.5">
          <div className="flex gap-2">
            <input
              value={geoQuery}
              onChange={(e) => { setGeoQuery(e.target.value); setGeoError(""); }}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), flyToLocation())}
              placeholder="ابحث عن منشأة"
              className="flex-1 rounded-xl border border-sal-200 bg-white px-3 py-1.5 text-sm focus:border-sal-400 focus:outline-none transition"
              style={{ direction: "rtl" }}
            />
            <button
              type="button"
              onClick={flyToLocation}
              disabled={geoLoading || !geoQuery.trim()}
              className="whitespace-nowrap rounded-xl border border-sal-300 bg-white px-3 py-1.5 text-xs font-bold text-sal-700 hover:bg-sal-50 disabled:opacity-40 transition"
            >
              {geoLoading ? "⏳" : "🔍 انتقل"}
            </button>
          </div>
          {geoError && <p className="text-[11px] text-red-500">{geoError}</p>}
          <p className="text-[11px] text-ink-400">
            بعد الانتقال، اضغط على الموقع الدقيق للمنشأة في الخريطة
          </p>
        </div>

        {/* Map */}
        <div ref={mapDivRef} style={{ height: 300, flexShrink: 0 }} />

        {/* Results panel */}
        <div className="max-h-56 overflow-y-auto border-t border-sal-100">
          {!clicked && (
            <p className="py-5 text-center text-xs text-ink-400">اضغط على نقطة في الخريطة للبدء</p>
          )}
          {loading && (
            <p className="py-5 text-center text-sm text-ink-500">⏳ جارٍ البحث عن الأماكن القريبة...</p>
          )}
          {!loading && clicked && nearby.length === 0 && (
            <p className="py-5 text-center text-xs text-ink-500">
              لا توجد نتائج — جرب تكبير الخريطة والضغط على الموقع بدقة أكبر
            </p>
          )}
          {!loading && nearby.length > 0 && (
            <>
              <p className="bg-ink-50 px-4 py-2 text-[11px] font-bold text-ink-500">
                اختر المنشأة الصحيحة ({nearby.length} نتيجة):
              </p>

              {/* Name-mismatch confirmation */}
              {pendingResult && (
                <div className="mx-4 my-3 rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
                  <p className="text-xs font-extrabold text-amber-800">⚠️ تحقق من المنشأة</p>
                  <p className="text-[11px] text-ink-700">
                    اسم المنشأة في قاعدة البيانات: <strong>{name}</strong>
                  </p>
                  <p className="text-[11px] text-ink-700">
                    اسم المنشأة في Google: <strong>{pendingResult.name}</strong>
                  </p>
                  <p className="text-[11px] text-amber-700 font-medium">
                    الأسماء مختلفة — هل هذه فعلاً نفس المنشأة؟
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => { onSelect(pendingResult.place_id, pendingResult.name); onClose(); }}
                      className="flex-1 rounded-lg bg-amber-600 py-1.5 text-[11px] font-bold text-white hover:bg-amber-700 transition"
                    >
                      نعم، اختر هذه المنشأة
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingResult(null)}
                      className="flex-1 rounded-lg border border-amber-300 bg-white py-1.5 text-[11px] font-bold text-amber-700 hover:bg-amber-50 transition"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}

              {nearby.map((r) => (
                <button
                  key={r.place_id}
                  type="button"
                  onClick={() => {
                    if (namesSimilar(name, r.name)) {
                      onSelect(r.place_id, r.name);
                      onClose();
                    } else {
                      setPendingResult(r);
                    }
                  }}
                  className="flex w-full items-center gap-3 border-b border-sal-50 px-4 py-3 text-right transition last:border-0 hover:bg-sal-50 active:bg-sal-100"
                >
                  <span className="shrink-0 text-lg text-sal-500">📍</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink-900">{r.name}</p>
                    <p className="truncate text-[11px] text-ink-500">{r.address}</p>
                    <p className="font-mono text-[10px] text-sal-600">{r.place_id}</p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-sal-100 px-2 py-1 text-[11px] font-bold text-sal-700">
                    اختر
                  </span>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Nearby Place Suggestions (auto-filled from LocationPicker) ───────────────
function NearbyPlaceSuggestions({
  results,
  currentId,
  placeName,
  onSelect,
  onDismiss,
}: {
  results: { place_id: string; name: string; address: string }[];
  currentId: string;
  placeName: string;
  onSelect: (id: string) => void;
  onDismiss: () => void;
}) {
  const [pendingResult, setPendingResult] = useState<{ place_id: string; name: string; address: string } | null>(null);

  if (!results.length) return null;
  return (
    <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold text-emerald-800">
          📍 {results.length === 1 ? "عُثر على منشأة قريبة — هل هي الصحيحة؟" : `عُثر على ${results.length} أماكن قريبة — اختر الصحيحة:`}
        </p>
        <button type="button" onClick={onDismiss} className="text-xs text-emerald-600 hover:text-emerald-900 leading-none">✕</button>
      </div>

      {/* Name-mismatch confirmation */}
      {pendingResult && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
          <p className="text-xs font-extrabold text-amber-800">⚠️ تحقق من المنشأة</p>
          <p className="text-[11px] text-ink-700">اسمها في قاعدة البيانات: <strong>{placeName}</strong></p>
          <p className="text-[11px] text-ink-700">اسمها في Google: <strong>{pendingResult.name}</strong></p>
          <p className="text-[11px] text-amber-700 font-medium">الأسماء مختلفة — هل هذه فعلاً نفس المنشأة؟</p>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => { onSelect(pendingResult.place_id); setPendingResult(null); }}
              className="flex-1 rounded-lg bg-amber-600 py-1.5 text-[11px] font-bold text-white hover:bg-amber-700 transition"
            >
              نعم، اختر
            </button>
            <button
              type="button"
              onClick={() => setPendingResult(null)}
              className="flex-1 rounded-lg border border-amber-300 bg-white py-1.5 text-[11px] font-bold text-amber-700 hover:bg-amber-50 transition"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      <div className="space-y-1">
        {results.map((r) => (
          <button
            key={r.place_id}
            type="button"
            onClick={() => {
              if (currentId === r.place_id) return;
              if (namesSimilar(placeName, r.name)) {
                onSelect(r.place_id);
              } else {
                setPendingResult(r);
              }
            }}
            disabled={currentId === r.place_id}
            className="flex w-full items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-right transition hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-default"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-ink-900 truncate">{r.name}</p>
              <p className="text-[10px] text-ink-500 truncate">{r.address}</p>
            </div>
            <span className="shrink-0 rounded-lg bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
              {currentId === r.place_id ? "✓ محدد" : "اختر"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Place ID Picker ──────────────────────────────────────────────────────────
function PlaceIdPicker({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string;
  onChange: (id: string) => void;
}) {
  const [query, setQuery]       = useState(name);
  const [results, setResults]   = useState<{ place_id: string; name: string; address: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched]   = useState(false);
  const [showMap, setShowMap]     = useState(false);

  useEffect(() => { if (name && !query) setQuery(name); }, [name]); // eslint-disable-line react-hooks/exhaustive-deps

  async function doSearch() {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setSearched(false);
    setResults([]);
    try {
      const res  = await fetch(`/api/place-search?q=${encodeURIComponent(q)}`);
      const data = await res.json() as { results?: { place_id: string; name: string; address: string }[] };
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
      setSearched(true);
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-ink-700">
        Google Place ID
        <span className="mr-2 text-[10px] font-normal text-ink-500">لضمان جلب الصور الصحيحة</span>
      </label>

      {/* Saved ID */}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="ChIJ... — سيُملأ عند الاختيار أدناه، أو أدخله يدوياً"
        dir="ltr"
        className="w-full rounded-xl border border-sal-300 px-3 py-2 text-sm font-mono focus:border-sal-500 focus:outline-none"
      />
      {value && (
        <p className="px-1 text-[11px] font-semibold text-green-600">
          ✓ Place ID محدد: <span className="font-mono">{value}</span>
        </p>
      )}

      {/* Text search */}
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), doSearch())}
          placeholder="ابحث بالاسم..."
          className="flex-1 rounded-xl border border-sal-200 bg-sal-50 px-3 py-2 text-sm focus:border-sal-400 focus:bg-white focus:outline-none transition"
          style={{ direction: "rtl" }}
        />
        <button
          type="button"
          onClick={doSearch}
          disabled={searching || !query.trim()}
          className="whitespace-nowrap rounded-xl border border-sal-300 bg-white px-4 py-2 text-xs font-bold text-sal-700 transition hover:bg-sal-50 disabled:opacity-40"
        >
          {searching ? "⏳ جاري..." : "🔍 بحث نصي"}
        </button>
        <button
          type="button"
          onClick={() => setShowMap(true)}
          className="whitespace-nowrap rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
        >
          🗺️ تحديد على الخريطة
        </button>
      </div>

      {/* Text results */}
      {results.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-sal-200 bg-white shadow-lg">
          <p className="border-b border-sal-50 bg-sal-50 px-4 py-1.5 text-[11px] font-bold text-ink-500">
            {results.length} نتيجة — اختر المنشأة الصحيحة:
          </p>
          {results.map((r) => (
            <button
              key={r.place_id}
              type="button"
              onClick={() => { onChange(r.place_id); setResults([]); setSearched(false); }}
              className="w-full border-b border-sal-50 px-4 py-2.5 text-right transition last:border-0 hover:bg-sal-50 active:bg-sal-100"
            >
              <p className="text-sm font-bold text-ink-900">{r.name}</p>
              <p className="mt-0.5 text-[11px] text-ink-500">{r.address}</p>
              <p className="mt-0.5 font-mono text-[10px] text-sal-600">{r.place_id}</p>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {searched && results.length === 0 && (
        <div className="space-y-1 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <p className="font-semibold">لم تُعثر على نتائج لـ &ldquo;{query}&rdquo;</p>
          <p>جرب: اكتب الاسم بالعربي أو الإنجليزي، أو أضف اسم الحي — أو استخدم زر 🗺️ لتحديد الموقع يدوياً</p>
        </div>
      )}

      {/* Map modal */}
      {showMap && (
        <PlaceMapModal
          name={name || query}
          onSelect={(id, placeName) => { onChange(id); setQuery(placeName); setResults([]); }}
          onClose={() => setShowMap(false)}
        />
      )}
    </div>
  );
}

type EditState = Omit<Partial<Place>, "tags" | "keywords" | "photos" | "videos" | "branches" | "instagramPosts"> & {
  id: string;
  lat?: number;
  lng?: number;
  tags?: string | string[];
  keywords?: string | string[];
  photos?: string[];
  videos?: string[];
  branches?: Branch[];
  instagramPosts?: string | string[];
};

// ── Password Gate ────────────────────────────────────────────────────────────
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
      if (res.ok) {
        onAuth();
      } else {
        setError(true);
        setPw("");
      }
    } catch {
      setError(true);
      setPw("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sal-50 px-4">
      <div className="w-full max-w-sm rounded-3xl border border-sal-100 bg-white p-8 shadow-xl space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-sal-100 text-3xl">
            🔒
          </div>
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
          {error && (
            <p className="text-center text-xs font-semibold text-red-600">كلمة المرور غير صحيحة</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-sal-600 py-3 text-sm font-bold text-white hover:bg-sal-700 transition disabled:opacity-60"
          >
            {loading ? "جاري التحقق…" : "دخول"}
          </button>
        </form>
        <div className="text-center">
          <Link href="/" className="text-xs text-ink-500 hover:text-sal-600">
            ← العودة للموقع
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Main Admin Dashboard ─────────────────────────────────────────────────────
export default function AdminPage() {
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

  return <AdminDashboard />;
}

function AdminDashboard() {
  const [places, setPlaces]         = useState<Place[]>(INITIAL_PLACES);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [editForm, setEditForm]     = useState<EditState | null>(null);
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError]     = useState<string | null>(null);
  const [filterCat, setFilterCat]   = useState<string>("all");
  const [tab, setTab]               = useState<"places" | "add">("places");
  const [videoUrlInput, setVideoUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [aiLoading, setAiLoading] = useState<string | null>(null); // field key being generated
  const [placeStatuses, setPlaceStatuses] = useState<Map<string, string>>(new Map());
  const [statusChecking, setStatusChecking] = useState(false);
  const [photoClearId, setPhotoClearId] = useState<string | null>(null); // "clearing" | "done" | "error" keyed by id
  const [photoClearState, setPhotoClearState] = useState<Record<string, "clearing" | "done" | "error">>({});
  const [newNearby, setNewNearby]   = useState<{ place_id: string; name: string; address: string }[]>([]);
  const [editNearby, setEditNearby] = useState<{ place_id: string; name: string; address: string }[]>([]);

  async function generateWithAI(
    field: "description" | "opinion",
    name: string,
    category: string,
    tags: string,
    onResult: (text: string) => void,
  ) {
    if (!name.trim()) return;
    setAiLoading(field);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, tags, field }),
      });
      const data = await res.json();
      if (data.text) onResult(data.text);
    } catch {
      // silently fail
    } finally {
      setAiLoading(null);
    }
  }

  async function generateAllWithAI(
    name: string,
    category: string,
    region: string,
    tags: string,
  ) {
    if (!name.trim()) return;
    setAiLoading("all");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, region, tags, field: "all" }),
      });
      const data = await res.json() as {
        description?: string;
        opinion?: string;
        tags?: string;
        keywords?: string;
      };
      setNewForm((f) => ({
        ...f,
        description: data.description ?? f.description,
        opinion:     data.opinion     ?? f.opinion,
        tags:        data.tags        ?? f.tags,
        keywords:    data.keywords    ?? f.keywords,
      }));
    } catch {
      // silently fail
    } finally {
      setAiLoading(null);
    }
  }

  async function checkAllStatuses() {
    if (statusChecking) return;
    setStatusChecking(true);
    try {
      const payload = places.map((p) => ({
        id: p.id,
        name: p.name,
        neighborhood: p.neighborhood ?? p.branches[0]?.neighborhood,
      }));
      const res = await fetch("/api/place-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ places: payload }),
      });
      const data = await res.json() as { results?: { id: string; business_status: string | null }[] };
      if (data.results) {
        setPlaceStatuses(
          new Map(
            data.results
              .filter((r) => r.business_status)
              .map((r) => [r.id, r.business_status as string])
          )
        );
      }
    } catch {
      // silently fail
    } finally {
      setStatusChecking(false);
    }
  }

  // Branch editing state (inside edit form)
  const [newBranch, setNewBranch] = useState<Partial<Branch>>({});
  const [editBranchId, setEditBranchId] = useState<string | null>(null);

  // Load custom places from Supabase on mount.
  // Supabase entries override static entries with the same id (so edits to static places persist).
  useEffect(() => {
    fetch("/api/places")
      .then((r) => r.json())
      .then((custom: Place[]) => {
        if (!custom.length) return;
        setPlaces((prev) => {
          const customById = new Map(custom.map((p) => [p.id, p]));
          // Replace static places with their custom versions (edits / tombstones)
          // Filter out tombstones (_deleted: true) so they disappear from the list
          const merged = prev
            .map((p) => customById.get(p.id) ?? p)
            .filter((p) => !p._deleted);
          // Add brand-new custom places (not in static data, not deleted)
          const staticIds = new Set(prev.map((p) => p.id));
          const brandNew  = custom.filter((p) => !staticIds.has(p.id) && !p._deleted);
          return brandNew.length > 0 ? [...brandNew, ...merged] : merged;
        });
      })
      .catch(() => {});
  }, []);

  // Load business statuses from Google Places cache.
  useEffect(() => {
    fetch("/api/place-status")
      .then((r) => r.json())
      .then((rows: { id: string; business_status: string }[]) => {
        if (!Array.isArray(rows)) return;
        setPlaceStatuses(new Map(rows.map((r) => [r.id, r.business_status])));
      })
      .catch(() => {});
  }, []);

  // ── Add form state ──────────────────────────────────────────────────
  const [newForm, setNewForm] = useState({
    name: "",
    category: "cafes" as Category,
    region: "" as Region | "",
    description: "",
    opinion: "",
    rating: "4.5",
    visits: "0",
    tags: "",
    keywords: "",
    isWomenOnly: false,
    phone: "",
    instagramUrl: "",
    instagramPosts: "",
    website: "",
    mapsUrl: "",
    googlePlaceId: "",
    lat: undefined as number | undefined,
    lng: undefined as number | undefined,
    neighborhood: "",
    address: "",
    openingHours: "",
    branchAddress: "",
    branchCity: "الرياض",
    branchMapsUrl: "",
    branchLat: undefined as number | undefined,
    branchLng: undefined as number | undefined,
  });

  // ── Edit helpers ────────────────────────────────────────────────────
  function startEdit(place: Place) {
    setEditingId(place.id);
    setVideoUrlInput("");
    setNewBranch({});
    setEditBranchId(null);
    setEditForm({
      id: place.id,
      name: place.name,
      category: place.category,
      region: place.region,
      description: place.description,
      opinion: place.opinion ?? "",
      rating: place.rating,
      acceptanceRate: place.acceptanceRate,
      rejectionRate: place.rejectionRate,
      tags: place.tags,
      keywords: place.keywords ?? [],
      isWomenOnly: place.isWomenOnly,
      phone: place.phone ?? "",
      instagramUrl: place.instagramUrl ?? "",
      instagramPosts: place.instagramPosts ?? [],
      website: place.website ?? "",
      mapsUrl: place.mapsUrl ?? "",
      googlePlaceId: place.googlePlaceId ?? "",
      lat: place.lat,
      lng: place.lng,
      neighborhood: place.neighborhood ?? "",
      address: place.address ?? "",
      openingHours: place.openingHours ?? "",
      photos: place.photos ? [...place.photos] : [],
      videos: place.videos ? [...place.videos] : [],
      branches: place.branches ? place.branches.map((b) => ({ ...b })) : [],
    });
  }

  function saveEdit() {
    if (!editForm) return;
    const original = places.find((p) => p.id === editForm.id);
    if (!original) return;
    const updated: Place = {
      ...original,
      name: editForm.name ?? original.name,
      category: editForm.category ?? original.category,
      region: (editForm.region as Region) || undefined,
      description: editForm.description ?? original.description,
      opinion: (editForm.opinion as string)?.trim() || undefined,
      rating: Number(editForm.rating ?? original.rating),
      acceptanceRate: editForm.acceptanceRate !== undefined ? Number(editForm.acceptanceRate) : original.acceptanceRate,
      rejectionRate: editForm.rejectionRate !== undefined ? Number(editForm.rejectionRate) : original.rejectionRate,
      isWomenOnly: editForm.isWomenOnly,
      phone: (editForm.phone as string)?.trim() || undefined,
      instagramUrl: (editForm.instagramUrl as string)?.trim() || undefined,
      instagramPosts: Array.isArray(editForm.instagramPosts)
        ? (editForm.instagramPosts as string[]).filter(Boolean)
        : typeof editForm.instagramPosts === "string"
          ? (editForm.instagramPosts as string).split("\n").map((u) => u.trim()).filter(Boolean)
          : original.instagramPosts,
      website: (editForm.website as string)?.trim() || undefined,
      mapsUrl: (editForm.mapsUrl as string)?.trim() || undefined,
      googlePlaceId: (editForm.googlePlaceId as string)?.trim() || undefined,
      lat: editForm.lat,
      lng: editForm.lng,
      neighborhood: (editForm.neighborhood as string)?.trim() || undefined,
      address: (editForm.address as string)?.trim() || undefined,
      openingHours: (editForm.openingHours as string)?.trim() || undefined,
      keywords: Array.isArray(editForm.keywords)
        ? (editForm.keywords as string[]).filter(Boolean)
        : typeof editForm.keywords === "string"
          ? (editForm.keywords as string).split(",").map((k) => k.trim()).filter(Boolean)
          : original.keywords,
      photos: editForm.photos ?? original.photos,
      videos: editForm.videos ?? original.videos,
      branches: editForm.branches ?? original.branches,
      tags: typeof editForm.tags === "string"
        ? (editForm.tags as string).split(",").map((t) => t.trim()).filter(Boolean)
        : editForm.tags ?? original.tags,
    };
    setPlaces((prev) => prev.map((p) => p.id === updated.id ? updated : p));
    setEditingId(null);
    setEditForm(null);
    setVideoUrlInput("");
    setNewBranch({});
    setEditBranchId(null);
    fetch("/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    }).catch(() => {});
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
    setVideoUrlInput("");
    setNewBranch({});
    setEditBranchId(null);
  }

  // ── Branch helpers ──────────────────────────────────────────────────
  function addBranchToEdit() {
    if (!newBranch.address?.trim()) return;
    const branch: Branch = {
      id: `b-${Date.now()}`,
      name:         newBranch.name?.trim()         || `فرع ${(editForm?.branches?.length ?? 0) + 1}`,
      address:      newBranch.address.trim(),
      city:         newBranch.city?.trim()          || "الرياض",
      neighborhood: newBranch.neighborhood?.trim()  || undefined,
      region:       newBranch.region                || undefined,
      phone:        newBranch.phone?.trim()         || undefined,
      openingHours: newBranch.openingHours?.trim()  || undefined,
      mapsUrl:      newBranch.mapsUrl?.trim()       || undefined,
      lat:          newBranch.lat,
      lng:          newBranch.lng,
    };
    setEditForm((prev) => prev ? { ...prev, branches: [...(prev.branches ?? []), branch] } : prev);
    setNewBranch({});
  }

  function removeBranchFromEdit(branchId: string) {
    setEditForm((prev) =>
      prev ? { ...prev, branches: (prev.branches ?? []).filter((b) => b.id !== branchId) } : prev
    );
  }

  function updateBranchInEdit(branchId: string, updates: Partial<Branch>) {
    setEditForm((prev) =>
      prev
        ? { ...prev, branches: (prev.branches ?? []).map((b) => b.id === branchId ? { ...b, ...updates } : b) }
        : prev
    );
  }

  // ── Photo upload helper ─────────────────────────────────────────────
  function handlePhotoUpload(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setEditForm((prev) =>
          prev ? { ...prev, photos: [...(prev.photos ?? []), dataUrl] } : prev
        );
      };
      reader.readAsDataURL(file);
    });
  }

  function removePhoto(index: number) {
    setEditForm((prev) =>
      prev ? { ...prev, photos: (prev.photos ?? []).filter((_, i) => i !== index) } : prev
    );
  }

  function addVideo() {
    const url = videoUrlInput.trim();
    if (!url) return;
    setEditForm((prev) =>
      prev ? { ...prev, videos: [...(prev.videos ?? []), url] } : prev
    );
    setVideoUrlInput("");
  }

  function removeVideo(index: number) {
    setEditForm((prev) =>
      prev ? { ...prev, videos: (prev.videos ?? []).filter((_, i) => i !== index) } : prev
    );
  }

  // ── Delete helpers ──────────────────────────────────────────────────
  function confirmDelete(id: string) { setDeleteId(id); setDeleteError(null); }
  async function doDelete() {
    if (!deleteId || deleteLoading) return;
    const id = deleteId;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/places", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        setDeleteError(body.error ?? "فشل الحذف، حاول مجددًا");
        return;
      }
      // Only update UI after confirmed server success
      setPlaces((prev) => prev.filter((p) => p.id !== id));
      setDeleteId(null);
    } catch {
      setDeleteError("خطأ في الاتصال، تحقق من الإنترنت وحاول مجددًا");
    } finally {
      setDeleteLoading(false);
    }
  }
  function cancelDelete() { setDeleteId(null); setDeleteError(null); }

  // ── Add helpers ─────────────────────────────────────────────────────
  function handleAdd() {
    if (!newForm.name.trim()) return;
    const gradients = [
      "from-sal-700 to-teal-500",
      "from-amber-700 to-amber-500",
      "from-pink-600 to-rose-400",
    ];
    const ts = Date.now();
    const firstBranch: Branch | null = newForm.branchAddress.trim()
      ? {
          id: `${ts}-b1`,
          name: "الفرع الرئيسي",
          address: newForm.branchAddress.trim(),
          city: newForm.branchCity.trim() || "الرياض",
          mapsUrl: newForm.branchMapsUrl.trim() || undefined,
          lat: newForm.branchLat,
          lng: newForm.branchLng,
        }
      : null;
    const newPlace: Place = {
      id: `custom-${ts}`,
      name: newForm.name.trim(),
      category: newForm.category,
      region: (newForm.region as Region) || undefined,
      neighborhood: newForm.neighborhood.trim() || undefined,
      address: newForm.address.trim() || undefined,
      openingHours: newForm.openingHours.trim() || undefined,
      description: newForm.description.trim(),
      opinion: newForm.opinion.trim() || undefined,
      rating: Math.min(5, Math.max(0, Number(newForm.rating) || 4.5)),
      visits: Math.max(0, Number(newForm.visits) || 0),
      phone: newForm.phone.trim() || undefined,
      instagramUrl: newForm.instagramUrl.trim() || undefined,
      instagramPosts: newForm.instagramPosts.split("\n").map((u) => u.trim()).filter(Boolean),
      website: newForm.website.trim() || undefined,
      mapsUrl: newForm.mapsUrl.trim() || undefined,
      googlePlaceId: newForm.googlePlaceId.trim() || undefined,
      lat: newForm.lat,
      lng: newForm.lng,
      gradient: gradients[Math.floor(Math.random() * gradients.length)],
      tags: newForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
      keywords: newForm.keywords.split(",").map((k) => k.trim()).filter(Boolean),
      isWomenOnly: newForm.isWomenOnly,
      branches: firstBranch ? [firstBranch] : [],
      createdAt: new Date().toISOString().split("T")[0],
    };
    setPlaces((prev) => [newPlace, ...prev]);
    fetch("/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPlace),
    }).catch(() => {});
    setNewForm({
      name: "", category: "cafes", region: "", description: "", opinion: "",
      rating: "4.5", visits: "0", tags: "", keywords: "", isWomenOnly: false,
      phone: "", instagramUrl: "", instagramPosts: "", website: "", mapsUrl: "", googlePlaceId: "",
      lat: undefined, lng: undefined,
      neighborhood: "", address: "", openingHours: "",
      branchAddress: "", branchCity: "الرياض", branchMapsUrl: "",
      branchLat: undefined, branchLng: undefined,
    });
    setTab("places");
  }

  // ── Logout ──────────────────────────────────────────────────────────
  async function logout() {
    await fetch("/api/admin-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    }).catch(() => {});
    window.location.reload();
  }

  // ── Search + filter ─────────────────────────────────────────────────
  const [adminSearch, setAdminSearch] = useState("");
  const [adminExpandedTerms, setAdminExpandedTerms] = useState<string[]>([]);
  const [adminAiSearching, setAdminAiSearching] = useState(false);
  const adminDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAdminSearch = useCallback((val: string) => {
    setAdminSearch(val);
    if (adminDebounceRef.current) clearTimeout(adminDebounceRef.current);
    if (!val.trim()) { setAdminExpandedTerms([]); setAdminAiSearching(false); return; }
    setAdminAiSearching(true);
    adminDebounceRef.current = setTimeout(async () => {
      const terms = await expandQuery(val.trim());
      setAdminExpandedTerms(terms);
      setAdminAiSearching(false);
    }, 700);
  }, []);

  const filtered = places.filter((p) => {
    const matchCat = filterCat === "all" || p.category === filterCat;
    if (!matchCat) return false;
    return matchesQuery(p, adminSearch.trim(), adminExpandedTerms);
  });

  return (
    <div className="mx-auto max-w-screen-xl space-y-6 px-5 py-10">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900">لوحة التحكم</h1>
          <p className="text-sm text-ink-600">{places.length} مكان مسجّل</p>
        </div>
        <div className="flex gap-2">
          <Link href="/" className="rounded-xl border border-sal-200 bg-white px-4 py-2 text-sm font-semibold text-sal-700 hover:bg-sal-50 transition">
            ← العودة للموقع
          </Link>
          <button
            onClick={logout}
            className="rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 transition"
          >
            خروج
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {CATEGORIES.map((cat) => {
          const count = places.filter((p) => p.category === cat.slug).length;
          return (
            <div
              key={cat.slug}
              className="rounded-2xl p-4 text-center"
              style={{ background: cat.bg }}
            >
              <p className="text-2xl">{cat.icon}</p>
              <p className="mt-1 text-xl font-extrabold" style={{ color: cat.color }}>{count}</p>
              <p className="text-xs font-medium opacity-70" style={{ color: cat.color }}>{cat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("places")}
          className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${
            tab === "places"
              ? "bg-sal-600 text-white shadow"
              : "border border-sal-200 bg-white text-sal-700 hover:bg-sal-50"
          }`}
        >
          📋 قائمة الأماكن
        </button>
        <button
          onClick={() => setTab("add")}
          className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${
            tab === "add"
              ? "bg-amber-400 text-amber-900 shadow"
              : "border border-sal-200 bg-white text-sal-700 hover:bg-sal-50"
          }`}
        >
          ➕ إضافة مكان
        </button>
      </div>

      {/* ── ADD TAB ──────────────────────────────────────────────────── */}
      {tab === "add" && (
        <div className="rounded-2xl border border-sal-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-extrabold text-ink-900">إضافة مكان جديد</h2>
            <button
              type="button"
              disabled={!newForm.name.trim() || aiLoading === "all"}
              onClick={() => generateAllWithAI(newForm.name, newForm.category, newForm.region, newForm.tags)}
              className="flex items-center gap-2 rounded-xl border-2 border-violet-300 bg-violet-50 px-4 py-2 text-sm font-bold text-violet-700 hover:bg-violet-100 disabled:opacity-40 transition shadow-sm"
            >
              {aiLoading === "all"
                ? "⏳ جاري التوليد..."
                : "✨ توليد الكل بالذكاء الاصطناعي"}
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-700">اسم المكان *</label>
              <input
                value={newForm.name}
                onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                className="w-full rounded-xl border border-sal-200 px-4 py-2.5 text-sm focus:border-sal-500 focus:outline-none"
                placeholder="مثال: كافيه الورد"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-700">التصنيف *</label>
              <select
                value={newForm.category}
                onChange={(e) => setNewForm({ ...newForm, category: e.target.value as Category })}
                className="w-full rounded-xl border border-sal-200 px-4 py-2.5 text-sm focus:border-sal-500 focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.icon} {c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-700">المنطقة</label>
              <select
                value={newForm.region}
                onChange={(e) => setNewForm({ ...newForm, region: e.target.value as Region | "" })}
                className="w-full rounded-xl border border-sal-200 px-4 py-2.5 text-sm focus:border-sal-500 focus:outline-none"
              >
                <option value="">— بدون منطقة —</option>
                {(["شمال","جنوب","شرق","غرب","وسط"] as Region[]).map((r) => (
                  <option key={r} value={r}>{r} الرياض</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-700">التقييم (0–5)</label>
              <input
                type="number"
                min={0}
                max={5}
                step={0.1}
                value={newForm.rating}
                onChange={(e) => setNewForm({ ...newForm, rating: e.target.value })}
                className="w-full rounded-xl border border-sal-200 px-4 py-2.5 text-sm focus:border-sal-500 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-ink-700">الوصف ✨</label>
              <textarea
                value={newForm.description}
                onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                rows={3}
                className="w-full rounded-xl border border-sal-200 px-4 py-2.5 text-sm focus:border-sal-500 focus:outline-none resize-none"
                placeholder="وصف مختصر عن المكان — يُوَلَّد تلقائياً بزر التوليد أعلاه"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-ink-700">رأي الناس (المربع الأصفر) ✨</label>
              <textarea
                value={newForm.opinion}
                onChange={(e) => setNewForm({ ...newForm, opinion: e.target.value })}
                rows={2}
                className="w-full rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none resize-none"
                placeholder="ما يقوله الزوار عن المكان — يُوَلَّد تلقائياً"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-700">الوسوم (مفصولة بفاصلة) ✨</label>
              <input
                value={newForm.tags}
                onChange={(e) => setNewForm({ ...newForm, tags: e.target.value })}
                className="w-full rounded-xl border border-sal-200 px-4 py-2.5 text-sm focus:border-sal-500 focus:outline-none"
                placeholder="مثال: قهوة, عائلي, هادئ"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-700">كلمات بحث إضافية (مفصولة بفاصلة) ✨</label>
              <input
                value={newForm.keywords}
                onChange={(e) => setNewForm({ ...newForm, keywords: e.target.value })}
                className="w-full rounded-xl border border-sal-200 px-4 py-2.5 text-sm focus:border-sal-500 focus:outline-none"
                placeholder="مثال: برجر كينج, Burger King, وجبات سريعة"
              />
              <p className="mt-1 text-[10px] text-ink-500">✨ = يتم توليده تلقائياً بزر الذكاء الاصطناعي أعلاه</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-700">عدد الزيارات</label>
              <input
                type="number"
                min={0}
                value={newForm.visits}
                onChange={(e) => setNewForm({ ...newForm, visits: e.target.value })}
                className="w-full rounded-xl border border-sal-200 px-4 py-2.5 text-sm focus:border-sal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-700">هاتف المنشأة</label>
              <input
                value={newForm.phone}
                onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })}
                className="w-full rounded-xl border border-sal-200 px-4 py-2.5 text-sm focus:border-sal-500 focus:outline-none"
                placeholder="05xxxxxxxx"
                dir="ltr"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-700">انستقرام (رابط كامل)</label>
              <input
                value={newForm.instagramUrl}
                onChange={(e) => setNewForm({ ...newForm, instagramUrl: e.target.value })}
                className="w-full rounded-xl border border-sal-200 px-4 py-2.5 text-sm focus:border-sal-500 focus:outline-none"
                placeholder="https://instagram.com/..."
                dir="ltr"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-pink-700">📸 روابط منشورات انستقرام (للصور)</label>
              <textarea
                value={newForm.instagramPosts}
                onChange={(e) => setNewForm({ ...newForm, instagramPosts: e.target.value })}
                className="w-full rounded-xl border border-pink-200 bg-pink-50 px-4 py-2.5 text-sm focus:border-pink-500 focus:outline-none"
                placeholder={"https://www.instagram.com/p/ABC123/\nhttps://www.instagram.com/p/XYZ456/"}
                dir="ltr"
                rows={3}
              />
              <p className="mt-1 text-[10px] text-ink-500">رابط منشور واحد في كل سطر (حتى 5) — ليس رابط الملف الشخصي</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-700">الموقع الإلكتروني</label>
              <input
                value={newForm.website}
                onChange={(e) => setNewForm({ ...newForm, website: e.target.value })}
                className="w-full rounded-xl border border-sal-200 px-4 py-2.5 text-sm focus:border-sal-500 focus:outline-none"
                placeholder="https://..."
                dir="ltr"
              />
            </div>
            <div>
              <PlaceIdPicker
                name={newForm.name}
                value={newForm.googlePlaceId}
                onChange={(id) => setNewForm({ ...newForm, googlePlaceId: id })}
              />
            </div>
            {newForm.category === "salons" && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="womenOnly"
                  checked={newForm.isWomenOnly}
                  onChange={(e) => setNewForm({ ...newForm, isWomenOnly: e.target.checked })}
                  className="h-4 w-4 accent-pink-600"
                />
                <label htmlFor="womenOnly" className="text-sm font-medium text-ink-700">نسائية فقط</label>
              </div>
            )}

            {/* ── Place-level location ── */}
            <div className="sm:col-span-2 rounded-xl border border-sal-200 bg-sal-50 p-4 space-y-3">
              <p className="text-xs font-bold text-sal-700">📍 موقع المنشأة الأم</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink-700">الحي</label>
                  <input
                    value={newForm.neighborhood}
                    onChange={(e) => setNewForm({ ...newForm, neighborhood: e.target.value })}
                    className="w-full rounded-xl border border-sal-200 bg-white px-4 py-2.5 text-sm focus:border-sal-500 focus:outline-none"
                    placeholder="مثال: حي الريان"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink-700">الشارع / العنوان النصي</label>
                  <input
                    value={newForm.address}
                    onChange={(e) => setNewForm({ ...newForm, address: e.target.value })}
                    className="w-full rounded-xl border border-sal-200 bg-white px-4 py-2.5 text-sm focus:border-sal-500 focus:outline-none"
                    placeholder="مثال: شارع بريدة"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-ink-700">ساعات العمل</label>
                  <input
                    value={newForm.openingHours}
                    onChange={(e) => setNewForm({ ...newForm, openingHours: e.target.value })}
                    className="w-full rounded-xl border border-sal-200 bg-white px-4 py-2.5 text-sm focus:border-sal-500 focus:outline-none"
                    placeholder="مثال: 12م–12ص يومياً"
                  />
                </div>
                <div className="sm:col-span-2">
                  <LocationPicker
                    value={newForm.mapsUrl}
                    searchHint={newForm.name}
                    onSelect={async (url, lat, lng) => {
                      setNewForm((f) => ({ ...f, mapsUrl: url, lat, lng }));
                      if (lat && lng) {
                        try {
                          const res  = await fetch(`/api/place-nearby?lat=${lat}&lng=${lng}&name=${encodeURIComponent(newForm.name)}`);
                          const data = await res.json() as { results?: { place_id: string; name: string; address: string }[] };
                          setNewNearby(data.results ?? []);
                        } catch { setNewNearby([]); }
                      }
                    }}
                  />
                  <NearbyPlaceSuggestions
                    results={newNearby}
                    currentId={newForm.googlePlaceId}
                    placeName={newForm.name}
                    onSelect={(id) => { setNewForm((f) => ({ ...f, googlePlaceId: id })); setNewNearby([]); }}
                    onDismiss={() => setNewNearby([])}
                  />
                </div>
              </div>
            </div>

            {/* ── Optional first named branch ── */}
            <div className="sm:col-span-2 rounded-xl border border-dashed border-sal-300 bg-white p-4 space-y-3">
              <p className="text-xs font-bold text-sal-600">➕ إضافة فرع بعنوان مختلف (اختياري)</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink-700">عنوان الفرع (شارع / طريق)</label>
                  <input
                    value={newForm.branchAddress}
                    onChange={(e) => setNewForm({ ...newForm, branchAddress: e.target.value })}
                    className="w-full rounded-xl border border-sal-200 bg-white px-4 py-2.5 text-sm focus:border-sal-500 focus:outline-none"
                    placeholder="مثال: طريق أنس بن مالك"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink-700">المدينة</label>
                  <input
                    value={newForm.branchCity}
                    onChange={(e) => setNewForm({ ...newForm, branchCity: e.target.value })}
                    className="w-full rounded-xl border border-sal-200 bg-white px-4 py-2.5 text-sm focus:border-sal-500 focus:outline-none"
                    placeholder="الرياض"
                  />
                </div>
                <div className="sm:col-span-2">
                  <LocationPicker
                    value={newForm.branchMapsUrl}
                    searchHint={newForm.name}
                    onSelect={(url, lat, lng) => setNewForm({ ...newForm, branchMapsUrl: url, branchLat: lat, branchLng: lng })}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <button
              onClick={handleAdd}
              disabled={!newForm.name.trim()}
              className="rounded-xl bg-sal-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-sal-700 disabled:opacity-40 transition"
            >
              ✓ حفظ المكان
            </button>
            <button
              onClick={() => setTab("places")}
              className="rounded-xl border border-sal-200 px-6 py-2.5 text-sm font-semibold text-sal-700 hover:bg-sal-50 transition"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* ── PLACES TAB ───────────────────────────────────────────────── */}
      {tab === "places" && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0Z" />
            </svg>
            <input
              type="text"
              value={adminSearch}
              onChange={(e) => handleAdminSearch(e.target.value)}
              placeholder="ابحث بالعربي أو الإنجليزي..."
              className="w-full rounded-xl border border-sal-200 bg-white py-2.5 pr-9 pl-16 text-sm focus:border-sal-500 focus:outline-none"
              style={{ direction: "rtl" }}
            />
            {adminSearch && (
              <button onClick={() => { handleAdminSearch(""); }} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700">✕</button>
            )}
            {adminSearch && (
              <span className="absolute left-8 top-1/2 -translate-y-1/2 text-[10px] font-bold"
                style={{ color: adminAiSearching ? "#94a3b8" : "#0ea5e9" }}>
                {adminAiSearching ? "..." : "✦ AI"}
              </span>
            )}
          </div>
          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterCat("all")}
              className={`rounded-xl px-4 py-1.5 text-sm font-semibold transition ${
                filterCat === "all"
                  ? "bg-sal-600 text-white"
                  : "border border-sal-200 bg-white text-sal-700 hover:bg-sal-50"
              }`}
            >
              الكل ({places.length})
            </button>
            {CATEGORIES.map((cat) => {
              const count = places.filter((p) => p.category === cat.slug).length;
              return (
                <button
                  key={cat.slug}
                  onClick={() => setFilterCat(cat.slug)}
                  className={`rounded-xl px-4 py-1.5 text-sm font-semibold transition ${
                    filterCat === cat.slug
                      ? "text-white shadow"
                      : "border bg-white hover:opacity-90"
                  }`}
                  style={
                    filterCat === cat.slug
                      ? { background: cat.color }
                      : { borderColor: cat.color + "40", color: cat.color, background: cat.bg }
                  }
                >
                  {cat.icon} {cat.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Status check */}
          <div className="flex items-center justify-between">
            <button
              onClick={checkAllStatuses}
              disabled={statusChecking}
              className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition"
            >
              {statusChecking ? "⏳ جاري الفحص…" : "🔍 فحص حالة المنشآت"}
            </button>
            {placeStatuses.size > 0 && (
              <span className="text-xs text-ink-500">
                {[...placeStatuses.values()].filter((s) => s !== "OPERATIONAL").length} منشأة تحتاج مراجعة
              </span>
            )}
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-sal-100 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sal-100 bg-sal-50 text-xs font-bold text-ink-700">
                  <th className="px-4 py-3 text-right">المكان</th>
                  <th className="hidden px-4 py-3 text-right sm:table-cell">التصنيف</th>
                  <th className="hidden px-4 py-3 text-right md:table-cell">التقييم</th>
                  <th className="hidden px-4 py-3 text-right md:table-cell">الزيارات</th>
                  <th className="hidden px-4 py-3 text-right lg:table-cell">الفروع</th>
                  <th className="px-4 py-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((place) => {
                  const cat = getCategoryMeta(place.category);
                  const isEditing = editingId === place.id;

                  return (
                    <tr key={place.id} className={`border-b border-sal-50 last:border-0 transition ${isEditing ? "bg-sal-50" : "hover:bg-gray-50"}`}>
                      {isEditing && editForm ? (
                        <>
                          {/* Inline edit row */}
                          <td className="px-4 py-4" colSpan={5}>
                            <div className="grid gap-3 sm:grid-cols-2">

                              {/* Name */}
                              <div>
                                <label className="mb-1 block text-xs font-semibold text-ink-700">الاسم</label>
                                <input
                                  value={editForm.name ?? ""}
                                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                  className="w-full rounded-xl border border-sal-300 px-3 py-2 text-sm focus:border-sal-500 focus:outline-none"
                                />
                              </div>

                              {/* Category */}
                              <div>
                                <label className="mb-1 block text-xs font-semibold text-ink-700">التصنيف</label>
                                <select
                                  value={editForm.category ?? "cafes"}
                                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value as Category })}
                                  className="w-full rounded-xl border border-sal-300 px-3 py-2 text-sm focus:border-sal-500 focus:outline-none"
                                >
                                  {CATEGORIES.map((c) => (
                                    <option key={c.slug} value={c.slug}>{c.icon} {c.label}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Description */}
                              <div className="sm:col-span-2">
                                <div className="mb-1 flex items-center justify-between">
                                  <label className="text-xs font-semibold text-ink-700">الوصف</label>
                                  <button
                                    type="button"
                                    disabled={!editForm.name?.trim() || aiLoading === "description"}
                                    onClick={() =>
                                      generateWithAI(
                                        "description",
                                        editForm.name ?? "",
                                        editForm.category ?? "cafes",
                                        Array.isArray(editForm.tags) ? (editForm.tags as string[]).join(", ") : (editForm.tags as string | undefined) ?? "",
                                        (text) => setEditForm((f) => f ? { ...f, description: text } : f)
                                      )
                                    }
                                    className="flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-bold text-violet-700 hover:bg-violet-100 disabled:opacity-40 transition"
                                  >
                                    {aiLoading === "description" ? "⏳ جاري التوليد..." : "✨ توليد بالذكاء الاصطناعي"}
                                  </button>
                                </div>
                                <textarea
                                  value={editForm.description ?? ""}
                                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                  rows={2}
                                  className="w-full rounded-xl border border-sal-300 px-3 py-2 text-sm focus:border-sal-500 focus:outline-none resize-none"
                                />
                              </div>

                              {/* Opinion */}
                              <div className="sm:col-span-2">
                                <div className="mb-1 flex items-center justify-between">
                                  <label className="text-xs font-semibold text-ink-700">رأي الناس (المربع الأصفر)</label>
                                  <button
                                    type="button"
                                    disabled={!editForm.name?.trim() || aiLoading === "opinion"}
                                    onClick={() =>
                                      generateWithAI(
                                        "opinion",
                                        editForm.name ?? "",
                                        editForm.category ?? "cafes",
                                        Array.isArray(editForm.tags) ? (editForm.tags as string[]).join(", ") : (editForm.tags as string | undefined) ?? "",
                                        (text) => setEditForm((f) => f ? { ...f, opinion: text } : f)
                                      )
                                    }
                                    className="flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-bold text-violet-700 hover:bg-violet-100 disabled:opacity-40 transition"
                                  >
                                    {aiLoading === "opinion" ? "⏳ جاري التوليد..." : "✨ توليد بالذكاء الاصطناعي"}
                                  </button>
                                </div>
                                <textarea
                                  value={(editForm.opinion as string) ?? ""}
                                  onChange={(e) => setEditForm({ ...editForm, opinion: e.target.value })}
                                  rows={2}
                                  placeholder="ما يقوله الزوار عن المكان..."
                                  className="w-full rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none resize-none"
                                />
                              </div>

                              {/* Rating */}
                              <div>
                                <label className="mb-1 block text-xs font-semibold text-ink-700">التقييم (0–5)</label>
                                <input
                                  type="number" min={0} max={5} step={0.1}
                                  value={editForm.rating ?? ""}
                                  onChange={(e) => setEditForm({ ...editForm, rating: Number(e.target.value) })}
                                  className="w-full rounded-xl border border-sal-300 px-3 py-2 text-sm focus:border-sal-500 focus:outline-none"
                                />
                              </div>

                              {/* Tags */}
                              <div>
                                <label className="mb-1 block text-xs font-semibold text-ink-700">الوسوم (مفصولة بفاصلة)</label>
                                <input
                                  value={Array.isArray(editForm.tags) ? editForm.tags.join(", ") : editForm.tags ?? ""}
                                  onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                                  className="w-full rounded-xl border border-sal-300 px-3 py-2 text-sm focus:border-sal-500 focus:outline-none"
                                />
                              </div>

                              {/* Region */}
                              <div>
                                <label className="mb-1 block text-xs font-semibold text-ink-700">المنطقة</label>
                                <select
                                  value={(editForm.region as string) ?? ""}
                                  onChange={(e) => setEditForm({ ...editForm, region: e.target.value as Region | undefined })}
                                  className="w-full rounded-xl border border-sal-300 px-3 py-2 text-sm focus:border-sal-500 focus:outline-none"
                                >
                                  <option value="">— بدون منطقة —</option>
                                  {(["شمال","جنوب","شرق","غرب","وسط"] as Region[]).map((r) => (
                                    <option key={r} value={r}>{r} الرياض</option>
                                  ))}
                                </select>
                              </div>

                              {/* Phone */}
                              <div>
                                <label className="mb-1 block text-xs font-semibold text-ink-700">هاتف المنشأة</label>
                                <input
                                  value={(editForm.phone as string) ?? ""}
                                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                  className="w-full rounded-xl border border-sal-300 px-3 py-2 text-sm focus:border-sal-500 focus:outline-none"
                                  placeholder="05xxxxxxxx"
                                  dir="ltr"
                                />
                              </div>

                              {/* Instagram */}
                              <div>
                                <label className="mb-1 block text-xs font-semibold text-pink-600">انستقرام (رابط كامل)</label>
                                <input
                                  value={(editForm.instagramUrl as string) ?? ""}
                                  onChange={(e) => setEditForm({ ...editForm, instagramUrl: e.target.value })}
                                  className="w-full rounded-xl border border-pink-300 bg-pink-50 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                                  placeholder="https://instagram.com/..."
                                  dir="ltr"
                                />
                              </div>

                              {/* Instagram Posts */}
                              <div className="sm:col-span-2">
                                <label className="mb-1 block text-xs font-semibold text-pink-600">📸 روابط منشورات انستقرام (للصور)</label>
                                <textarea
                                  value={
                                    Array.isArray(editForm.instagramPosts)
                                      ? (editForm.instagramPosts as string[]).join("\n")
                                      : (editForm.instagramPosts as string) ?? ""
                                  }
                                  onChange={(e) => setEditForm({ ...editForm, instagramPosts: e.target.value })}
                                  className="w-full rounded-xl border border-pink-300 bg-pink-50 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                                  placeholder={"https://www.instagram.com/p/ABC123/\nhttps://www.instagram.com/p/XYZ456/"}
                                  dir="ltr"
                                  rows={3}
                                />
                                <p className="mt-1 text-[10px] text-ink-500">رابط منشور واحد في كل سطر (حتى 5) — ليس رابط الملف الشخصي</p>
                              </div>

                              {/* Website */}
                              <div>
                                <label className="mb-1 block text-xs font-semibold text-blue-600">الموقع الإلكتروني</label>
                                <input
                                  value={(editForm.website as string) ?? ""}
                                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                                  className="w-full rounded-xl border border-blue-300 bg-blue-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                  placeholder="https://..."
                                  dir="ltr"
                                />
                              </div>

                              {/* Keywords */}
                              <div className="sm:col-span-2">
                                <label className="mb-1 block text-xs font-semibold text-ink-700">كلمات بحث إضافية (مفصولة بفاصلة)</label>
                                <input
                                  value={Array.isArray(editForm.keywords) ? (editForm.keywords as string[]).join(", ") : (editForm.keywords as string | undefined) ?? ""}
                                  onChange={(e) => setEditForm({ ...editForm, keywords: e.target.value })}
                                  className="w-full rounded-xl border border-sal-300 px-3 py-2 text-sm focus:border-sal-500 focus:outline-none"
                                  placeholder="مثال: برجر كينج, Burger King, وجبات سريعة"
                                />
                              </div>

                              {/* Google Place ID */}
                              <div className="sm:col-span-2">
                                <PlaceIdPicker
                                  name={editForm.name ?? ""}
                                  value={(editForm.googlePlaceId as string) ?? ""}
                                  onChange={(id) => setEditForm({ ...editForm, googlePlaceId: id })}
                                />
                              </div>

                              {/* Place location picker */}
                              <div className="sm:col-span-2">
                                <LocationPicker
                                  value={(editForm.mapsUrl as string) ?? ""}
                                  searchHint={editForm.name ?? ""}
                                  onSelect={async (url, lat, lng) => {
                                    setEditForm((f) => f ? { ...f, mapsUrl: url || undefined, lat: lat ?? f.lat, lng: lng ?? f.lng } : f);
                                    if (lat && lng) {
                                      try {
                                        const res  = await fetch(`/api/place-nearby?lat=${lat}&lng=${lng}&name=${encodeURIComponent(editForm.name ?? "")}`);
                                        const data = await res.json() as { results?: { place_id: string; name: string; address: string }[] };
                                        setEditNearby(data.results ?? []);
                                      } catch { setEditNearby([]); }
                                    }
                                  }}
                                />
                                <NearbyPlaceSuggestions
                                  results={editNearby}
                                  currentId={(editForm.googlePlaceId as string) ?? ""}
                                  placeName={(editForm.name as string) ?? ""}
                                  onSelect={(id) => { setEditForm((f) => f ? { ...f, googlePlaceId: id } : f); setEditNearby([]); }}
                                  onDismiss={() => setEditNearby([])}
                                />
                              </div>

                              {/* Place-level location */}
                              <div className="sm:col-span-2 rounded-xl border border-sal-200 bg-sal-50 p-4 space-y-3">
                                <p className="text-xs font-bold text-sal-700">📍 موقع المنشأة الأم</p>
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <div>
                                    <label className="mb-1 block text-[10px] font-semibold text-ink-600">الحي</label>
                                    <input
                                      value={(editForm.neighborhood as string) ?? ""}
                                      onChange={(e) => setEditForm({ ...editForm, neighborhood: e.target.value || undefined })}
                                      placeholder="مثال: حي الريان"
                                      className="w-full rounded-lg border border-sal-200 bg-white px-3 py-2 text-xs focus:border-sal-500 focus:outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-[10px] font-semibold text-ink-600">الشارع / العنوان النصي</label>
                                    <input
                                      value={(editForm.address as string) ?? ""}
                                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value || undefined })}
                                      placeholder="مثال: شارع بريدة"
                                      className="w-full rounded-lg border border-sal-200 bg-white px-3 py-2 text-xs focus:border-sal-500 focus:outline-none"
                                    />
                                  </div>
                                  <div className="sm:col-span-2">
                                    <label className="mb-1 block text-[10px] font-semibold text-ink-600">ساعات العمل</label>
                                    <input
                                      value={(editForm.openingHours as string) ?? ""}
                                      onChange={(e) => setEditForm({ ...editForm, openingHours: e.target.value || undefined })}
                                      placeholder="مثال: 12م–12ص يومياً"
                                      className="w-full rounded-lg border border-sal-200 bg-white px-3 py-2 text-xs focus:border-sal-500 focus:outline-none"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Acceptance Rate */}
                              <div>
                                <label className="mb-1 block text-xs font-semibold text-green-700">نسبة القبول % (0–100)</label>
                                <input
                                  type="number" min={0} max={100}
                                  value={editForm.acceptanceRate ?? ""}
                                  onChange={(e) => setEditForm({ ...editForm, acceptanceRate: e.target.value === "" ? undefined : Number(e.target.value) })}
                                  placeholder="مثال: 88"
                                  className="w-full rounded-xl border border-green-300 bg-green-50 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                                />
                              </div>

                              {/* Rejection Rate */}
                              <div>
                                <label className="mb-1 block text-xs font-semibold text-red-600">نسبة الرفض % (0–100)</label>
                                <input
                                  type="number" min={0} max={100}
                                  value={editForm.rejectionRate ?? ""}
                                  onChange={(e) => setEditForm({ ...editForm, rejectionRate: e.target.value === "" ? undefined : Number(e.target.value) })}
                                  placeholder="مثال: 12"
                                  className="w-full rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                                />
                              </div>

                              {/* Photos */}
                              <div className="sm:col-span-2">
                                <label className="mb-1 block text-xs font-semibold text-ink-700">صور المكان</label>
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  onChange={(e) => handlePhotoUpload(e.target.files)}
                                  className="w-full rounded-xl border border-sal-300 px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-sal-100 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-sal-700"
                                />
                                {(editForm.photos ?? []).length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {(editForm.photos ?? []).map((photo, i) => (
                                      <div key={i} className="relative">
                                        <img
                                          src={photo}
                                          alt=""
                                          className="h-20 w-20 rounded-xl object-cover"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => removePhoto(i)}
                                          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Videos */}
                              <div className="sm:col-span-2">
                                <label className="mb-1 block text-xs font-semibold text-ink-700">روابط الفيديوهات</label>
                                <div className="flex gap-2">
                                  <input
                                    value={videoUrlInput}
                                    onChange={(e) => setVideoUrlInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addVideo())}
                                    placeholder="https://youtube.com/..."
                                    className="flex-1 rounded-xl border border-sal-300 px-3 py-2 text-sm focus:border-sal-500 focus:outline-none"
                                    dir="ltr"
                                  />
                                  <button
                                    type="button"
                                    onClick={addVideo}
                                    className="rounded-xl bg-sal-600 px-4 py-2 text-xs font-bold text-white hover:bg-sal-700 transition"
                                  >
                                    إضافة
                                  </button>
                                </div>
                                {(editForm.videos ?? []).length > 0 && (
                                  <div className="mt-2 space-y-1.5">
                                    {(editForm.videos ?? []).map((vid, i) => (
                                      <div key={i} className="flex items-center gap-2 rounded-xl bg-sal-50 px-3 py-2 text-xs">
                                        <span className="flex-1 truncate text-ink-700" dir="ltr">{vid}</span>
                                        <button
                                          type="button"
                                          onClick={() => removeVideo(i)}
                                          className="font-bold text-red-500 hover:text-red-700"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* ── Branches ── */}
                              <div className="sm:col-span-2">
                                <div className="mb-2 flex items-center justify-between">
                                  <label className="text-xs font-semibold text-ink-700">
                                    📍 الفروع
                                    <span className="mr-2 rounded-full bg-sal-100 px-2 py-0.5 text-[10px] font-bold text-sal-700">
                                      {(editForm.branches ?? []).length}
                                    </span>
                                  </label>
                                </div>
                                <div className="space-y-2">

                                  {/* ── existing branches ── */}
                                  {(editForm.branches ?? []).map((branch, idx) => (
                                    <div key={branch.id} className="rounded-xl border border-sal-200 bg-sal-50 overflow-hidden">
                                      {editBranchId === branch.id ? (
                                        /* ── edit mode ── */
                                        <div className="p-3 space-y-3">
                                          <p className="text-[11px] font-bold text-sal-600">تعديل الفرع {idx + 1}</p>
                                          <div className="grid gap-2 sm:grid-cols-2">
                                            {/* Name */}
                                            <div>
                                              <label className="mb-0.5 block text-[10px] font-semibold text-ink-600">اسم الفرع</label>
                                              <input
                                                value={branch.name}
                                                onChange={(e) => updateBranchInEdit(branch.id, { name: e.target.value })}
                                                placeholder="مثال: فرع حي النرجس"
                                                className="w-full rounded-lg border border-sal-300 px-3 py-1.5 text-xs focus:border-sal-500 focus:outline-none"
                                              />
                                            </div>
                                            {/* Region */}
                                            <div>
                                              <label className="mb-0.5 block text-[10px] font-semibold text-ink-600">المنطقة</label>
                                              <select
                                                value={branch.region ?? ""}
                                                onChange={(e) => updateBranchInEdit(branch.id, { region: (e.target.value as Region) || undefined })}
                                                className="w-full rounded-lg border border-sal-300 px-3 py-1.5 text-xs focus:border-sal-500 focus:outline-none"
                                              >
                                                <option value="">— اختر —</option>
                                                {(["شمال","جنوب","شرق","غرب","وسط"] as Region[]).map((r) => (
                                                  <option key={r} value={r}>{r} الرياض</option>
                                                ))}
                                              </select>
                                            </div>
                                            {/* Neighborhood */}
                                            <div>
                                              <label className="mb-0.5 block text-[10px] font-semibold text-ink-600">الحي</label>
                                              <input
                                                value={branch.neighborhood ?? ""}
                                                onChange={(e) => updateBranchInEdit(branch.id, { neighborhood: e.target.value || undefined })}
                                                placeholder="مثال: حي النرجس"
                                                className="w-full rounded-lg border border-sal-300 px-3 py-1.5 text-xs focus:border-sal-500 focus:outline-none"
                                              />
                                            </div>
                                            {/* Address */}
                                            <div>
                                              <label className="mb-0.5 block text-[10px] font-semibold text-ink-600">العنوان النصي</label>
                                              <input
                                                value={branch.address}
                                                onChange={(e) => updateBranchInEdit(branch.id, { address: e.target.value })}
                                                placeholder="الشارع أو الطريق"
                                                className="w-full rounded-lg border border-sal-300 px-3 py-1.5 text-xs focus:border-sal-500 focus:outline-none"
                                              />
                                            </div>
                                            {/* Phone */}
                                            <div>
                                              <label className="mb-0.5 block text-[10px] font-semibold text-ink-600">الهاتف</label>
                                              <input
                                                value={branch.phone ?? ""}
                                                onChange={(e) => updateBranchInEdit(branch.id, { phone: e.target.value || undefined })}
                                                placeholder="05xxxxxxxx"
                                                dir="ltr"
                                                className="w-full rounded-lg border border-sal-300 px-3 py-1.5 text-xs focus:border-sal-500 focus:outline-none"
                                              />
                                            </div>
                                            {/* Hours */}
                                            <div>
                                              <label className="mb-0.5 block text-[10px] font-semibold text-ink-600">ساعات العمل</label>
                                              <input
                                                value={branch.openingHours ?? ""}
                                                onChange={(e) => updateBranchInEdit(branch.id, { openingHours: e.target.value || undefined })}
                                                placeholder="مثال: 8ص–12م"
                                                className="w-full rounded-lg border border-sal-300 px-3 py-1.5 text-xs focus:border-sal-500 focus:outline-none"
                                              />
                                            </div>
                                          </div>
                                          {/* Location picker */}
                                          <LocationPicker
                                            value={branch.mapsUrl}
                                            searchHint={`${editForm?.name ?? ""} ${branch.neighborhood ?? ""}`}
                                            onSelect={(url, lat, lng) => updateBranchInEdit(branch.id, { mapsUrl: url || undefined, lat, lng })}
                                          />
                                          <button
                                            type="button"
                                            onClick={() => setEditBranchId(null)}
                                            className="rounded-lg bg-sal-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-sal-700 transition"
                                          >
                                            ✓ تم التعديل
                                          </button>
                                        </div>
                                      ) : (
                                        /* ── collapsed view ── */
                                        <div className="flex items-start justify-between gap-2 px-3 py-2.5">
                                          <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                              <p className="text-xs font-bold text-ink-900">{branch.name}</p>
                                              {branch.region && (
                                                <span className="rounded-full bg-sal-100 px-2 py-0.5 text-[10px] font-bold text-sal-700">
                                                  {branch.region} الرياض
                                                </span>
                                              )}
                                              {branch.mapsUrl && (
                                                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                                                  📍 موقع محدد
                                                </span>
                                              )}
                                            </div>
                                            <p className="mt-0.5 text-[11px] text-ink-600">
                                              {branch.neighborhood ? `${branch.neighborhood}، ` : ""}{branch.address}
                                            </p>
                                            <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                                              {branch.phone && (
                                                <p className="text-[11px] text-ink-500" dir="ltr">📞 {branch.phone}</p>
                                              )}
                                              {branch.openingHours && (
                                                <p className="text-[11px] text-ink-500">⏰ {branch.openingHours}</p>
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex shrink-0 gap-1">
                                            <button
                                              type="button"
                                              onClick={() => setEditBranchId(branch.id)}
                                              className="rounded-lg border border-sal-200 bg-white px-2 py-1 text-[11px] font-bold text-sal-700 hover:border-sal-400 transition"
                                            >✏️ تعديل</button>
                                            <button
                                              type="button"
                                              onClick={() => removeBranchFromEdit(branch.id)}
                                              className="rounded-lg border border-red-100 bg-white px-2 py-1 text-[11px] font-bold text-red-500 hover:bg-red-50 transition"
                                            >🗑️</button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}

                                  {/* ── add new branch ── */}
                                  <div className="rounded-xl border-2 border-dashed border-sal-300 bg-white p-4 space-y-3">
                                    <p className="text-xs font-bold text-sal-600">➕ إضافة فرع جديد</p>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                      {/* Name */}
                                      <div>
                                        <label className="mb-0.5 block text-[10px] font-semibold text-ink-600">اسم الفرع</label>
                                        <input
                                          value={newBranch.name ?? ""}
                                          onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                                          placeholder="مثال: فرع حي الياسمين"
                                          className="w-full rounded-lg border border-sal-200 px-3 py-1.5 text-xs focus:border-sal-500 focus:outline-none"
                                        />
                                      </div>
                                      {/* Region */}
                                      <div>
                                        <label className="mb-0.5 block text-[10px] font-semibold text-ink-600">المنطقة *</label>
                                        <select
                                          value={newBranch.region ?? ""}
                                          onChange={(e) => setNewBranch({ ...newBranch, region: (e.target.value as Region) || undefined })}
                                          className="w-full rounded-lg border border-sal-300 px-3 py-1.5 text-xs focus:border-sal-500 focus:outline-none"
                                        >
                                          <option value="">— اختر المنطقة —</option>
                                          {(["شمال","جنوب","شرق","غرب","وسط"] as Region[]).map((r) => (
                                            <option key={r} value={r}>{r} الرياض</option>
                                          ))}
                                        </select>
                                      </div>
                                      {/* Neighborhood */}
                                      <div>
                                        <label className="mb-0.5 block text-[10px] font-semibold text-ink-600">الحي</label>
                                        <input
                                          value={newBranch.neighborhood ?? ""}
                                          onChange={(e) => setNewBranch({ ...newBranch, neighborhood: e.target.value })}
                                          placeholder="مثال: حي الياسمين"
                                          className="w-full rounded-lg border border-sal-200 px-3 py-1.5 text-xs focus:border-sal-500 focus:outline-none"
                                        />
                                      </div>
                                      {/* Address */}
                                      <div>
                                        <label className="mb-0.5 block text-[10px] font-semibold text-ink-600">العنوان النصي *</label>
                                        <input
                                          value={newBranch.address ?? ""}
                                          onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                                          placeholder="الشارع أو الطريق"
                                          className="w-full rounded-lg border border-sal-300 px-3 py-1.5 text-xs focus:border-sal-500 focus:outline-none"
                                        />
                                      </div>
                                      {/* Phone */}
                                      <div>
                                        <label className="mb-0.5 block text-[10px] font-semibold text-ink-600">هاتف الفرع</label>
                                        <input
                                          value={newBranch.phone ?? ""}
                                          onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value })}
                                          placeholder="05xxxxxxxx"
                                          dir="ltr"
                                          className="w-full rounded-lg border border-sal-200 px-3 py-1.5 text-xs focus:border-sal-500 focus:outline-none"
                                        />
                                      </div>
                                      {/* Hours */}
                                      <div>
                                        <label className="mb-0.5 block text-[10px] font-semibold text-ink-600">ساعات العمل</label>
                                        <input
                                          value={newBranch.openingHours ?? ""}
                                          onChange={(e) => setNewBranch({ ...newBranch, openingHours: e.target.value })}
                                          placeholder="مثال: 8ص–12م يومياً"
                                          className="w-full rounded-lg border border-sal-200 px-3 py-1.5 text-xs focus:border-sal-500 focus:outline-none"
                                        />
                                      </div>
                                    </div>
                                    {/* Location picker */}
                                    <LocationPicker
                                      value={newBranch.mapsUrl}
                                      searchHint={`${editForm?.name ?? ""} ${newBranch.neighborhood ?? ""}`}
                                      onSelect={(url, lat, lng) => setNewBranch({ ...newBranch, mapsUrl: url || undefined, lat, lng })}
                                    />
                                    <button
                                      type="button"
                                      onClick={addBranchToEdit}
                                      disabled={!newBranch.address?.trim()}
                                      className="rounded-xl bg-sal-600 px-5 py-2 text-xs font-bold text-white hover:bg-sal-700 disabled:opacity-40 transition"
                                    >
                                      ✓ إضافة الفرع
                                    </button>
                                  </div>

                                </div>
                              </div>

                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={saveEdit}
                                className="rounded-xl bg-sal-600 px-4 py-2 text-xs font-bold text-white hover:bg-sal-700 transition"
                              >
                                ✓ حفظ
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="rounded-xl border border-sal-200 px-4 py-2 text-xs font-semibold text-sal-700 hover:bg-sal-50 transition"
                              >
                                إلغاء
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <Link href={`/places/${place.id}`} className="font-bold text-ink-900 hover:text-sal-600 transition">
                                  {place.name}
                                </Link>
                                {(() => {
                                  const s = placeStatuses.get(place.id);
                                  if (s === "CLOSED_PERMANENTLY")
                                    return (
                                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                                        🔴 مغلق نهائيًا
                                      </span>
                                    );
                                  if (s === "CLOSED_TEMPORARILY")
                                    return (
                                      <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">
                                        🟠 مغلق مؤقتًا
                                      </span>
                                    );
                                  return null;
                                })()}
                                {place.isWomenOnly && (
                                  <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-bold text-pink-700">
                                    نسائية
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 line-clamp-1 text-xs text-ink-600">{place.description}</p>
                              {(place.acceptanceRate !== undefined || place.rejectionRate !== undefined) && (
                                <div className="mt-1 flex gap-3 text-[10px] font-semibold">
                                  {place.acceptanceRate !== undefined && (
                                    <span className="text-green-600">✓ {place.acceptanceRate}%</span>
                                  )}
                                  {place.rejectionRate !== undefined && (
                                    <span className="text-red-500">✗ {place.rejectionRate}%</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="hidden px-4 py-3 sm:table-cell">
                            {cat && (
                              <span
                                className="rounded-lg px-2 py-1 text-xs font-semibold"
                                style={{ background: cat.bg, color: cat.color }}
                              >
                                {cat.icon} {cat.label}
                              </span>
                            )}
                          </td>
                          <td className="hidden px-4 py-3 md:table-cell">
                            <RatingStars rating={place.rating} />
                          </td>
                          <td className="hidden px-4 py-3 text-xs text-ink-600 md:table-cell">
                            {place.visits.toLocaleString("ar-SA")}
                          </td>
                          <td className="hidden px-4 py-3 text-xs text-ink-600 lg:table-cell">
                            {place.branches.length} {place.branches.length === 1 ? "فرع" : "فروع"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col items-center gap-1.5">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => startEdit(place)}
                                  className="rounded-lg border border-sal-200 bg-sal-50 px-3 py-1.5 text-xs font-bold text-sal-700 hover:border-sal-400 hover:bg-sal-100 transition"
                                >
                                  ✏️ تعديل
                                </button>
                                <button
                                  onClick={() => confirmDelete(place.id)}
                                  className="rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:border-red-300 hover:bg-red-100 transition"
                                >
                                  🗑️ حذف
                                </button>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <select
                                  value={placeStatuses.get(place.id) ?? ""}
                                  onChange={async (e) => {
                                    const status = e.target.value;
                                    setPlaceStatuses((prev) => new Map(prev).set(place.id, status));
                                    await fetch("/api/place-status", {
                                      method: "PATCH",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ id: place.id, status }),
                                    });
                                  }}
                                  className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-[10px] font-semibold text-ink-700 focus:outline-none"
                                >
                                  <option value="">— الحالة —</option>
                                  <option value="OPERATIONAL">🟢 مفتوح</option>
                                  <option value="CLOSED_TEMPORARILY">🟠 مغلق مؤقتًا</option>
                                  <option value="CLOSED_PERMANENTLY">🔴 مغلق نهائيًا</option>
                                </select>
                                {photoClearState[place.id] === "done" ? (
                                  <button
                                    title="إعادة جلب صور من Google"
                                    onClick={async () => {
                                      setPhotoClearState((s) => ({ ...s, [place.id]: "clearing" }));
                                      const res = await fetch(`/api/place-photos/${place.id}`, { method: "PATCH" });
                                      setPhotoClearState((s) => ({ ...s, [place.id]: res.ok ? "error" : "error" }));
                                      if (res.ok) setPhotoClearState((s) => { const n = { ...s }; delete n[place.id]; return n; });
                                    }}
                                    className="rounded-lg border border-green-200 bg-green-50 px-2 py-1 text-[10px] font-bold text-green-700 hover:bg-green-100 transition"
                                  >
                                    ✅ تم المسح — إعادة جلب؟
                                  </button>
                                ) : photoClearState[place.id] === "error" ? (
                                  <span className="text-[10px] font-bold text-red-600">❌ فشل</span>
                                ) : (
                                  <button
                                    title="مسح الصور المخزنة"
                                    disabled={photoClearState[place.id] === "clearing"}
                                    onClick={async () => {
                                      setPhotoClearState((s) => ({ ...s, [place.id]: "clearing" }));
                                      const res = await fetch(`/api/place-photos/${place.id}`, { method: "DELETE" });
                                      setPhotoClearState((s) => ({ ...s, [place.id]: res.ok ? "done" : "error" }));
                                    }}
                                    className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-[10px] font-semibold text-ink-600 hover:bg-gray-100 disabled:opacity-50 transition"
                                  >
                                    {photoClearState[place.id] === "clearing" ? "⏳" : "🖼️ مسح"}
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-ink-600">
                      لا توجد أماكن في هذا التصنيف
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Dialog ─────────────────────────────────────── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl">
              🗑️
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-ink-900">تأكيد الحذف</h3>
              <p className="mt-1 text-sm text-ink-600">
                هل أنت متأكد من حذف{" "}
                <span className="font-bold text-ink-900">
                  {places.find((p) => p.id === deleteId)?.name}
                </span>
                ؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
            </div>
            {deleteError && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                ⚠️ {deleteError}
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={doDelete}
                disabled={deleteLoading}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60 transition"
              >
                {deleteLoading ? "جاري الحذف…" : "نعم، احذف"}
              </button>
              <button
                onClick={cancelDelete}
                disabled={deleteLoading}
                className="flex-1 rounded-xl border border-sal-200 py-2.5 text-sm font-semibold text-ink-700 hover:bg-sal-50 disabled:opacity-60 transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
