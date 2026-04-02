"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import {
  favoritesEventName,
  getFavorites,
  toggleFavorite,
  type FavoriteOffer
} from "@/lib/favorites/local-favorites";
import { refreshFavoritesFromServer, setFavoriteOnServer } from "@/lib/favorites/remote-favorites";

function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", cb);
  window.addEventListener(favoritesEventName(), cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(favoritesEventName(), cb);
  };
}

function getSnapshot(): FavoriteOffer[] {
  return getFavorites();
}

function getServerSnapshot(): FavoriteOffer[] {
  return [];
}

export function useFavorites() {
  const list = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const isFav = useCallback((path: string) => list.some((f) => f.path === path), [list]);

  useEffect(() => {
    void refreshFavoritesFromServer();
  }, []);

  useEffect(() => {
    const { data: sub } = supabaseClient.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") void refreshFavoritesFromServer();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const toggle = useCallback(async (item: { path: string; title: string; kind: "offer" | "demo" }) => {
    const nowActive = toggleFavorite(item);
    await setFavoriteOnServer(nowActive, item);
  }, []);

  return { list, isFav, toggle };
}
