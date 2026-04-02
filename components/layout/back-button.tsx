"use client";

import { useRouter } from "next/navigation";

export function BackButton({ fallbackHref = "/" }: { fallbackHref?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) {
          window.history.back();
          return;
        }
        router.push(fallbackHref);
      }}
      className="rounded-lg border border-gold-400/60 px-3 py-1.5 text-sm font-semibold text-gold-500 hover:bg-gold-400/10"
      aria-label="الرجوع للصفحة السابقة"
    >
      عودة
    </button>
  );
}
