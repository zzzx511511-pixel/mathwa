"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function HomeSearch() {
  const [q, setQ] = useState("");
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    router.push(term ? `/places?q=${encodeURIComponent(term)}` : "/places");
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-lg gap-2">
      <div className="relative flex-1">
        <svg
          className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400"
          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0Z" />
        </svg>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث عن كافيه، مطعم، عيادة..."
          className="w-full rounded-2xl border border-white/20 bg-white/10 py-3.5 pr-12 pl-4 text-sm font-medium text-white placeholder-white/50 outline-none backdrop-blur focus:border-white/40 focus:bg-white/15 transition"
          style={{ direction: "rtl" }}
        />
      </div>
      <button
        type="submit"
        className="shrink-0 rounded-2xl px-6 py-3.5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5"
        style={{ background: "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 55%, #0369a1 100%)" }}
      >
        بحث
      </button>
    </form>
  );
}
