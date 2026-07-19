"use client";

import { useEffect } from "react";

export function VisitTracker({ placeId }: { placeId: string }) {
  useEffect(() => {
    fetch("/api/track-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ place_id: placeId }),
    }).catch(() => {});
  }, [placeId]);
  return null;
}
