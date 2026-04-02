"use client";

import { MapContainer, TileLayer, useMapEvents, CircleMarker, useMap } from "react-leaflet";
import { useMemo, useEffect, useRef } from "react";
import type { LeafletMouseEvent } from "leaflet";

type Pick = { latitude: number; longitude: number };

function MapFlyToSelection({
  selectedPoint,
  zoom = 16
}: {
  selectedPoint: Pick | null;
  zoom?: number;
}) {
  const map = useMap();
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedPoint) return;
    const key = `${selectedPoint.latitude},${selectedPoint.longitude}`;
    if (lastKey.current === key) return;
    lastKey.current = key;
    map.flyTo([selectedPoint.latitude, selectedPoint.longitude], zoom, { duration: 1.2 });
  }, [map, selectedPoint, zoom]);

  return null;
}

function ClickHandler({
  onPick
}: {
  onPick: (pick: { latitude: number; longitude: number }) => void;
}) {
  useMapEvents({
    click(event: LeafletMouseEvent) {
      onPick({ latitude: event.latlng.lat, longitude: event.latlng.lng });
    }
  });
  return null;
}

export function LocationMapPicker({
  initialLatitude,
  initialLongitude,
  selectedPoint,
  onSelectionChange
}: {
  initialLatitude?: number | null;
  initialLongitude?: number | null;
  selectedPoint: Pick | null;
  onSelectionChange: (pick: Pick) => void;
}) {
  const center = useMemo<[number, number]>(() => {
    if (selectedPoint) return [selectedPoint.latitude, selectedPoint.longitude];
    if (Number.isFinite(initialLatitude) && Number.isFinite(initialLongitude)) {
      return [Number(initialLatitude), Number(initialLongitude)];
    }
    return [24.7136, 46.6753];
  }, [initialLatitude, initialLongitude, selectedPoint]);

  return (
    <div className="space-y-2">
      <MapContainer center={center} zoom={12} style={{ height: 360, width: "100%", borderRadius: 12 }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapFlyToSelection selectedPoint={selectedPoint} zoom={16} />
        <ClickHandler
          onPick={(value) => {
            onSelectionChange(value);
          }}
        />
        {selectedPoint ? (
          <CircleMarker center={[selectedPoint.latitude, selectedPoint.longitude]} radius={8} pathOptions={{ color: "#0f766e" }} />
        ) : null}
      </MapContainer>
      <p className="text-xs text-ink-900/65">اضغط على أي نقطة في الخريطة ثم اضغط &quot;تأكيد الموقع&quot;.</p>
    </div>
  );
}

