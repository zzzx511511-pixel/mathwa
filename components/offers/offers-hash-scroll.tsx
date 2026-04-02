"use client";

import { useEffect } from "react";

/** يكمّل سلوك الروابط ذات الـ # مع App Router حيث قد لا يُمرَّر للعنصر تلقائياً */
export function OffersHashScroll() {
  useEffect(() => {
    const id = "sample-demos";

    const run = () => {
      try {
        if (typeof window === "undefined") return;
        if (!window.location.pathname.endsWith("/offers")) return;
        if (window.location.hash.replace("#", "") !== id) return;
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch {
        /* تجاهل أي قيود متصفح على التمرير */
      }
    };

    run();
    const a = requestAnimationFrame(run);
    const t1 = window.setTimeout(run, 80);
    const t2 = window.setTimeout(run, 350);
    window.addEventListener("hashchange", run);

    return () => {
      cancelAnimationFrame(a);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("hashchange", run);
    };
  }, []);

  return null;
}
