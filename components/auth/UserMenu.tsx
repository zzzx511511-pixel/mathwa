"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";

export function UserMenu() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      const { data } = await supabaseClient.auth.getSession();
      const email = data.session?.user?.email ?? null;
      if (mounted) {
        setUserEmail(email);
        setLoading(false);
      }
    }

    load();

    const {
      data: { subscription }
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function onSignOut() {
    setLoading(true);
    await supabaseClient.auth.signOut();
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    router.replace("/login");
  }

  if (loading) return null;
  if (!userEmail) return null;

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-sm text-ink-900/70 sm:block">{userEmail}</div>
      <button
        onClick={onSignOut}
        className="rounded-full border border-ink-900/10 bg-white px-3 py-1.5 text-sm font-medium text-ink-900/80 hover:border-gold-400 hover:bg-gold-400/10"
        type="button"
      >
        خروج
      </button>
    </div>
  );
}

