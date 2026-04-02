"use client";

import { supabaseClient } from "@/lib/supabase/client";
import type { FavoriteOffer } from "@/lib/favorites/local-favorites";
import * as local from "@/lib/favorites/local-favorites";

let authReadQueue: Promise<unknown> = Promise.resolve();

function isLockReleasedError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  return msg.toLowerCase().includes("lock was released because another request stole it");
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function withAuthReadLock<T>(fn: () => Promise<T>): Promise<T> {
  const prev = authReadQueue;
  let release!: () => void;
  authReadQueue = new Promise<void>((resolve) => {
    release = resolve;
  });
  await prev;
  try {
    return await fn();
  } finally {
    release();
  }
}

async function retryAuthRead<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await withAuthReadLock(fn);
    } catch (err) {
      lastErr = err;
      if (!isLockReleasedError(err) || attempt === retries) {
        throw err;
      }
      await delay(20 * (attempt + 1));
    }
  }
  throw lastErr;
}

async function getCurrentUserSafe() {
  try {
    const { data } = await retryAuthRead(() => supabaseClient.auth.getUser());
    if (data.user) return data.user;
  } catch (err) {
    if (!isLockReleasedError(err)) {
      throw err;
    }
  }

  const { data: sessionData } = await retryAuthRead(() => supabaseClient.auth.getSession());
  return sessionData.session?.user ?? null;
}

export async function refreshFavoritesFromServer(): Promise<void> {
  const user = await getCurrentUserSafe();
  if (!user) return;

  const { data, error } = await supabaseClient
    .from("user_favorites")
    .select("path,title,kind,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) return;

  const list: FavoriteOffer[] = data.map((row) => ({
    path: row.path as string,
    title: row.title as string,
    kind: row.kind === "demo" ? "demo" : "offer",
    addedAt: new Date(row.created_at as string).getTime()
  }));
  local.setFavorites(list);
}

export async function mergeLocalFavoritesAfterAuth(): Promise<void> {
  try {
    const user = await getCurrentUserSafe();
    if (!user) return;

    const guests = local.getFavorites();
    for (const item of guests) {
      const { error } = await supabaseClient.from("user_favorites").upsert(
        {
          user_id: user.id,
          path: item.path,
          title: item.title,
          kind: item.kind
        },
        { onConflict: "user_id,path" }
      );
      if (error) {
        // eslint-disable-next-line no-console
        console.warn("user_favorites upsert:", error.message);
      }
    }
    await refreshFavoritesFromServer();
  } catch {
    /* جدول user_favorites غير منشأ بعد — يمكن المتابعة بدون مزامنة */
  }
}

export async function setFavoriteOnServer(
  nowActive: boolean,
  item: { path: string; title: string; kind: "offer" | "demo" }
): Promise<void> {
  const user = await getCurrentUserSafe();
  if (!user) return;

  if (nowActive) {
    const { error } = await supabaseClient.from("user_favorites").upsert(
      { user_id: user.id, path: item.path, title: item.title, kind: item.kind },
      { onConflict: "user_id,path" }
    );
    if (error) {
      // eslint-disable-next-line no-console
      console.warn("user_favorites upsert:", error.message);
    }
  } else {
    await supabaseClient.from("user_favorites").delete().eq("user_id", user.id).eq("path", item.path);
  }
}

export async function removeFavoriteFromServer(path: string): Promise<void> {
  const user = await getCurrentUserSafe();
  if (!user) return;
  await supabaseClient.from("user_favorites").delete().eq("user_id", user.id).eq("path", path);
}
