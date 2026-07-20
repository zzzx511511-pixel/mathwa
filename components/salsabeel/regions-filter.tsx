import Link from "next/link";

const REGIONS = [
  { value: "all",  label: "🗺️ الكل — جميع مناطق الرياض", span: true },
  { value: "شمال", label: "⬆️ شمال الرياض",  span: false },
  { value: "جنوب", label: "⬇️ جنوب الرياض",  span: false },
  { value: "شرق",  label: "➡️ شرق الرياض",   span: false },
  { value: "غرب",  label: "⬅️ غرب الرياض",   span: false },
  { value: "وسط",  label: "🎯 وسط الرياض",   span: false },
];

export function RegionsFilter() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {REGIONS.map((r) => (
        <Link
          key={r.value}
          href={r.value === "all" ? "/places" : `/places?region=${encodeURIComponent(r.value)}`}
          className={`${r.span ? "col-span-2 sm:col-span-3" : ""} rounded-2xl border-2 px-5 py-4 text-center text-sm font-bold transition hover:-translate-y-0.5`}
          style={{
            background: "#FAF7F2",
            borderColor: "#C4E8E5",
            color: "#0F5C56",
          }}
        >
          {r.label}
        </Link>
      ))}
    </div>
  );
}
