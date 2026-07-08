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
  const angle = (index * 137.508) % 360;
  const radius = 0.012 + (index % 6) * 0.006;
  const rad = (angle * Math.PI) / 180;
  return [Math.sin(rad) * radius, Math.cos(rad) * radius];
}

function getCoords(place: Place, index: number): [number, number] {
  if (place.lat && place.lng) return [place.lat, place.lng];
  const center = REGION_CENTERS[place.region ?? "وسط"] ?? RIYADH_CENTER;
  const [dLat, dLng] = spreadOffset(index);
  return [center[0] + dLat, center[1] + dLng];
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

  // Build per-region index so offset is consistent per region
  const coordsList = useMemo(() => {
    const regionCounters: Record<string, number> = {};
    return places.map((place) => {
      const key = place.region ?? "وسط";
      const idx = regionCounters[key] ?? 0;
      regionCounters[key] = idx + 1;
      return getCoords(place, idx);
    });
  }, [places]);

  const hasExact = useMemo(
    () => places.some((p) => p.lat && p.lng),
    [places]
  );
  const approxCount = useMemo(
    () => places.filter((p) => !p.lat || !p.lng).length,
    [places]
  );

  useEffect(() => {
    if (!mapDivRef.current || mapInstanceRef.current) return;

    // Inject Leaflet CSS once
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id   = "leaflet-css";
      link.rel  = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    import("leaflet").then((L) => {
      if (!mapDivRef.current || mapInstanceRef.current) return;

      // Fix Leaflet default icon paths broken by bundlers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapDivRef.current, {
        center: RIYADH_CENTER,
        zoom: 11,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Emoji pin icon using category colour
      const makeIcon = () =>
        L.divIcon({
          className: "",
          html: `<div style="
            width:36px;height:36px;
            background:${cat.color};
            border:3px solid white;
            border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            box-shadow:0 3px 10px rgba(0,0,0,0.35);
            display:flex;align-items:center;justify-content:center;
          "><span style="transform:rotate(45deg);font-size:16px;line-height:1">${cat.icon}</span></div>`,
          iconSize:    [36, 36],
          iconAnchor:  [18, 36],
          popupAnchor: [0, -38],
        });

      const icon = makeIcon();

      places.forEach((place, i) => {
        const [lat, lng] = coordsList[i];
        const isApprox   = !place.lat || !place.lng;
        const ratingStr  = "⭐".repeat(Math.round(place.rating));

        const popup = `
          <div style="
            min-width:190px;max-width:220px;
            font-family:'Tajawal',system-ui,sans-serif;
            direction:rtl;text-align:right;
            padding:4px 0;
          ">
            <p style="margin:0 0 3px;font-size:14px;font-weight:800;color:#0c4a6e;line-height:1.3">
              ${place.name}
            </p>
            <p style="margin:0 0 10px;font-size:11px;color:#64748b">
              ${ratingStr} ${place.rating.toFixed(1)}
              ${isApprox ? '<span style="color:#f59e0b"> · موقع تقريبي</span>' : ""}
            </p>
            <a
              href="/places/${place.id}"
              style="
                display:inline-block;
                background:linear-gradient(135deg,#38bdf8 0%,#0369a1 100%);
                color:white;text-decoration:none;
                padding:7px 16px;border-radius:10px;
                font-size:12px;font-weight:700;
              "
            >عرض التفاصيل ←</a>
          </div>`;

        L.marker([lat, lng], { icon })
          .addTo(map)
          .bindPopup(popup, { maxWidth: 240, closeButton: true });
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
          {hasExact ? ` · ${places.length - approxCount} بموقع دقيق` : " — أضف إحداثيات دقيقة من لوحة التحكم للدقة الكاملة"}
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
