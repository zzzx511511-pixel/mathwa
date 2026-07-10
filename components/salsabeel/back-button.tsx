"use client";

import { useRouter } from "next/navigation";

export function BackButton({
  fallbackHref,
  label,
}: {
  fallbackHref: string;
  label: string;
}) {
  const router = useRouter();

  function handleBack() {
    try {
      // If the user navigated here from a list page, go back so scroll position is restored
      const savedUrl = sessionStorage.getItem("sal_back_url");
      if (savedUrl) {
        router.back();
        return;
      }
    } catch { /* ignore */ }
    router.push(fallbackHref);
  }

  return (
    <button
      onClick={handleBack}
      className="inline-flex items-center gap-2 rounded-xl border border-sal-200 bg-white px-6 py-2.5 text-sm font-semibold text-sal-700 hover:bg-sal-50 transition"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
      </svg>
      {label}
    </button>
  );
}
