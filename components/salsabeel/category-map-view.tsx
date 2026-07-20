"use client";

import { useEffect, useRef, useMemo } from "react";
import type { Place } from "@/lib/salsabeel/types";
import type { CategoryMeta } from "@/lib/salsabeel/categories";

const REGION_CENTERS: Record<string, [number, number]> = {
  "شمال": [24.800, 46.650],
  "جنوب": [24.570, 46.720],
  "شرق":  [24.670, 46.800],
  "غرب":  [24.670, 46.600],
  "وسط":  [24.690, 46.690],
};
const RIYADH_CENTER: [number, number] = [24.690, 46.690];

// Spread pins that share a region center using the golden angle
function spreadOffset(index: number): [number, number] {
  const angle  = (index * 137.508) % 360;
  const radius = 0.012 + (index % 6) * 0.006;
  const rad    = (angle * Math.PI) / 180;
  return [Math.sin(rad) * radius, Math.cos(rad) * radius];
}

// Returns true when we have a real GPS pin (place-level or branch-level).
// False means we're falling back to a region-centre approximation.
function hasExactPin(place: Place): boolean {
  if (place.lat && place.lng) return true;
  return place.branches.some((b) => b.lat && b.lng);
}

function getCoords(place: Place, index: number): [number, number] {
  if (place.lat && place.lng) return [place.lat, place.lng];
  // Fall back to first branch that has GPS coords (e.g. from Google Places fetch).
  // For single-branch places this IS the place's location.
  // For multi-branch places it's the first branch — much better than a region centre.
  const withCoords = place.branches.find((b) => b.lat && b.lng);
  if (withCoords) return [withCoords.lat!, withCoords.lng!];
  const center  = REGION_CENTERS[place.region ?? "وسط"] ?? RIYADH_CENTER;
  const [dLat, dLng] = spreadOffset(index);
  return [center[0] + dLat, center[1] + dLng];
}

function stars(rating: number) {
  const full  = Math.round(rating);
  const empty = 5 - full;
  return "★".repeat(full) + "☆".repeat(empty);
}

function singlePopup(place: Place, cat: CategoryMeta, isApprox: boolean): string {
  return `
    <div style="min-width:220px;max-width:260px;font-family:'Tajawal',system-ui,sans-serif;direction:rtl;text-align:right;padding:4px 0">
      <span style="display:inline-block;background:${cat.bg};color:${cat.color};padding:2px 10px;border-radius:20px;font-size:10px;font-weight:800;margin-bottom:8px">
        ${cat.icon} ${cat.label}
      </span>
      <p style="margin:0 0 4px;font-size:15px;font-weight:800;color:#0F5C56;line-height:1.3">${place.name}</p>
      <p style="margin:0 0 2px;font-size:12px;color:#f59e0b;letter-spacing:1px">${stars(place.rating)} <span style="color:#64748b;letter-spacing:0">${place.rating.toFixed(1)}</span></p>
      ${place.neighborhood ? `<p style="margin:0 0 10px;font-size:11px;color:#94a3b8">📍 ${place.neighborhood}</p>` : '<div style="margin-bottom:10px"></div>'}
      ${isApprox ? `<p style="margin:-4px 0 10px;font-size:10px;color:#f59e0b;font-weight:600">⚠️ موقع تقريبي</p>` : ""}
      <a
        href="/places/${place.id}"
        style="display:block;background:linear-gradient(135deg,#16A394 0%,#0F5C56 100%);color:white;text-decoration:none;padding:8px 16px;border-radius:10px;font-size:12px;font-weight:700;text-align:center"
      >عرض التفاصيل ←</a>
    </div>`;
}

function multiPopup(group: Place[], cat: CategoryMeta): string {
  const items = group.map(
    (p) => `
    <div style="padding:10px 0;border-bottom:1px solid #f1f5f9">
      <p style="margin:0 0 2px;font-size:13px;font-weight:800;color:#0F5C56">${p.name}</p>
      <p style="margin:0 0 6px;font-size:11px;color:#f59e0b;letter-spacing:1px">${stars(p.rating)} <span style="color:#64748b;letter-spacing:0">${p.rating.toFixed(1)}</span></p>
      <a
        href="/places/${p.id}"
        style="display:inline-block;background:linear-gradient(135deg,#16A394 0%,#0F5C56 100%);color:white;text-decoration:none;padding:5px 14px;border-radius:8px;font-size:11px;font-weight:700"
      >عرض التفاصيل ←</a>
    </div>`,
  );

  return `
    <div style="min-width:220px;max-width:260px;font-family:'Tajawal',system-ui,sans-serif;direction:rtl;text-align:right;padding:2px 0">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:${cat.color};background:${cat.bg};padding:3px 10px;border-radius:20px;display:inline-block">
        ${cat.icon} ${group.length} منشآت في هذا الموقع
      </p>
      ${items.join("")}
    </div>`;
}

export function CategoryMapView({
  places,
  cat,
}: {
  places: Place[];
  cat: CategoryMeta;
}) {
  const mapDivRef      = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null);

  const coordsList = useMemo(() => {
    const regionCounters: Record<string, number> = {};
    return places.map((place) => {
      const key = place.region ?? "وسط";
      const idx = regionCounters[key] ?? 0;
      regionCounters[key] = idx + 1;
      return getCoords(place, idx);
    });
  }, [places]);

  // Group places that share the same resolved coordinates
  const groups = useMemo(() => {
    const map = new Map<string, { places: Place[]; coords: [number, number]; hasApprox: boolean }>();
    places.forEach((place, i) => {
      const [lat, lng] = coordsList[i];
      const key        = `${lat.toFixed(4)},${lng.toFixed(4)}`;
      const isApprox   = !hasExactPin(place);
      if (!map.has(key)) map.set(key, { places: [], coords: [lat, lng], hasApprox: isApprox });
      map.get(key)!.places.push(place);
      if (isApprox) map.get(key)!.hasApprox = true;
    });
    return Array.from(map.values());
  }, [places, coordsList]);

  const hasExact    = useMemo(() => places.some((p) => hasExactPin(p)),   [places]);
  const approxCount = useMemo(() => places.filter((p) => !hasExactPin(p)).length, [places]);

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

      const map = L.map(mapDivRef.current, {
        center: RIYADH_CENTER,
        zoom: 11,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const makeIcon = (count = 1) => {
        const badge =
          count > 1
            ? `<span style="position:absolute;top:-4px;right:-4px;background:#ef4444;color:white;border-radius:50%;width:16px;height:16px;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;line-height:1">${count}</span>`
            : "";
        return L.divIcon({
          className: "",
          html: `<div style="position:relative;width:36px;height:36px">
            <div style="
              width:36px;height:36px;
              background:${cat.color};
              border:3px solid white;
              border-radius:50% 50% 50% 0;
              transform:rotate(-45deg);
              box-shadow:0 3px 10px rgba(0,0,0,0.35);
              display:flex;align-items:center;justify-content:center;
            "><span style="transform:rotate(45deg);font-size:16px;line-height:1">${cat.icon}</span></div>
            ${badge}
          </div>`,
          iconSize:    [36, 36],
          iconAnchor:  [18, 36],
          popupAnchor: [0, -38],
        });
      };

      groups.forEach(({ places: grp, coords, hasApprox }) => {
        const [lat, lng] = coords;
        const icon       = makeIcon(grp.length);
        const content    =
          grp.length === 1
            ? singlePopup(grp[0], cat, hasApprox)
            : multiPopup(grp, cat);

        L.marker([lat, lng], { icon })
          .addTo(map)
          .bindPopup(content, { maxWidth: 280, closeButton: true });
      });

      mapInstanceRef.current = map;
    });

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-2">
      {approxCount > 0 && (
        <p className="text-xs text-amber-600 font-medium">
          🟡 {approxCount} مكان{approxCount === 1 ? "" : "ًا"} بموقع تقريبي
          {hasExact
            ? ` · ${places.length - approxCount} بموقع دقيق`
            : " — أضف إحداثيات دقيقة من لوحة التحكم للدقة الكاملة"}
        </p>
      )}
      <div
        ref={mapDivRef}
        className="w-full rounded-2xl overflow-hidden border border-sal-100 shadow-sm"
        style={{ height: "520px" }}
      />
    </div>
  );
}
