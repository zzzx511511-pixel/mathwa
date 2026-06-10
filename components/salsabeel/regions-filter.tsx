"use client";

import { useState } from "react";

const REGIONS = [
  { id: "all",   label: "🗺️ الكل — جميع مناطق الرياض", span: true },
  { id: "north", label: "⬆️ شمال الرياض",  span: false },
  { id: "south", label: "⬇️ جنوب الرياض",  span: false },
  { id: "east",  label: "➡️ شرق الرياض",   span: false },
  { id: "west",  label: "⬅️ غرب الرياض",   span: false },
  { id: "center",label: "🎯 وسط الرياض",   span: false },
];

export function RegionsFilter() {
  const [active, setActive] = useState("all");

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {REGIONS.map((r) => {
        const isActive = active === r.id;
        return (
          <button
            key={r.id}
            onClick={() => setActive(r.id)}
            className={`${r.span ? "col-span-2 sm:col-span-3" : ""} rounded-2xl border-2 px-5 py-4 text-center text-sm font-bold transition hover:-translate-y-0.5`}
            style={
              isActive
                ? {
                    background: "linear-gradient(135deg,#38bdf8 0%,#0ea5e9 55%,#0369a1 100%)",
                    borderColor: "transparent",
                    color: "#fff",
                    boxShadow: "0 8px 24px rgba(56,189,248,0.3)",
                  }
                : {
                    background: "#f0f9ff",
                    borderColor: "#e0f2fe",
                    color: "#0c4a6e",
                  }
            }
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );
}
