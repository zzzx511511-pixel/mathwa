"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ArchiveOwnerActions({ ownerId }: { ownerId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function reactivateOwner() {
    setLoading(true);
    try {
      const res = await fetch("/api/employee/owners/archive", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ownerId, archived: false })
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
      if (res.ok && data.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={reactivateOwner}
      disabled={loading}
      className="mt-2 inline-flex rounded-full border border-ink-900/15 px-4 py-2 text-sm font-bold text-ink-900/80 hover:border-gold-400 disabled:opacity-60"
    >
      {loading ? "جارٍ التفعيل..." : "إعادة تفعيل"}
    </button>
  );
}

