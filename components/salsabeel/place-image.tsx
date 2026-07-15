import type { Category } from "@/lib/salsabeel/types";

// ── Per-category styles (aqua-blue / white Salsabeel palette) ────────────────
const CAT: Record<
  Category,
  { label: string; from: string; mid: string; to: string; accent: string }
> = {
  cafes:       { label: "كوفيهات",         from: "#0c4a6e", mid: "#0369a1", to: "#0ea5e9", accent: "#38bdf8" },
  restaurants: { label: "مطاعم",           from: "#082f49", mid: "#075985", to: "#0284c7", accent: "#22d3ee" },
  clinics:     { label: "عيادات",          from: "#134e4a", mid: "#0e7490", to: "#06b6d4", accent: "#67e8f9" },
  salons:      { label: "صالونات",         from: "#1e3a8a", mid: "#1d4ed8", to: "#38bdf8", accent: "#7dd3fc" },
  malls:       { label: "الوجهات المفتوحة", from: "#0a2235", mid: "#155e75", to: "#0e7490", accent: "#22d3ee" },
};

// ── Category icons ────────────────────────────────────────────────────────────

function CoffeeIcon() {
  return (
    <>
      {/* steam */}
      <path d="M8 3c0 1.5 1.5 1.5 1.5 3M12 3c0 1.5 1.5 1.5 1.5 3M16 3c0 1.5 1.5 1.5 1.5 3" strokeWidth="1.8" />
      {/* cup body */}
      <path d="M5 9h14v8a3 3 0 01-3 3H8a3 3 0 01-3-3V9z" strokeWidth="1.8" />
      {/* handle */}
      <path d="M19 11.5h1a2 2 0 010 4h-1" strokeWidth="1.8" />
      {/* saucer */}
      <path d="M3 22h18" strokeWidth="1.8" />
    </>
  );
}

function ForkKnifeIcon() {
  return (
    <>
      {/* fork */}
      <path d="M5 2v4.5M7 2v4.5M9 2v4.5" strokeWidth="1.8" />
      <path d="M5 6.5a2 2 0 004 0M7 8.5v13.5" strokeWidth="1.8" />
      {/* knife */}
      <path d="M15 2c2.5 1.5 4.5 4.5 4.5 7.5h-4.5M15 9.5V22" strokeWidth="1.8" />
    </>
  );
}

function MedicalIcon() {
  return (
    <>
      {/* cross */}
      <rect x="9" y="2"  width="6" height="20" rx="2" strokeWidth="1.8" />
      <rect x="2" y="9"  width="20" height="6" rx="2" strokeWidth="1.8" />
      {/* heart pulse inside (small) */}
      <path d="M8 12h2l1-2 2 4 1-2h2" strokeWidth="1.5" />
    </>
  );
}

function ScissorsIcon() {
  return (
    <>
      {/* pivot */}
      <circle cx="12" cy="12" r="1.5" fill="white" stroke="none" />
      {/* top blade */}
      <path d="M20 4L9 13.5" strokeWidth="1.8" />
      {/* bottom blade */}
      <path d="M20 20L9 10.5" strokeWidth="1.8" />
      {/* top handle */}
      <circle cx="6" cy="7"  r="3.5" strokeWidth="1.8" />
      {/* bottom handle */}
      <circle cx="6" cy="17" r="3.5" strokeWidth="1.8" />
      {/* handle holes */}
      <circle cx="6" cy="7"  r="1.2" fill="white" stroke="none" />
      <circle cx="6" cy="17" r="1.2" fill="white" stroke="none" />
    </>
  );
}

function BuildingIcon() {
  return (
    <>
      {/* main building */}
      <path d="M4 22V8l8-6 8 6v14" strokeWidth="1.8" />
      {/* door */}
      <path d="M10 22v-7h4v7" strokeWidth="1.8" />
      {/* windows row 1 */}
      <rect x="5.5"  y="10" width="3" height="2.5" rx="0.5" fill="white" fillOpacity="0.3" strokeWidth="1.2" />
      <rect x="15.5" y="10" width="3" height="2.5" rx="0.5" fill="white" fillOpacity="0.3" strokeWidth="1.2" />
      {/* windows row 2 */}
      <rect x="5.5"  y="15" width="3" height="2.5" rx="0.5" fill="white" fillOpacity="0.3" strokeWidth="1.2" />
      <rect x="15.5" y="15" width="3" height="2.5" rx="0.5" fill="white" fillOpacity="0.3" strokeWidth="1.2" />
      {/* ground line */}
      <path d="M2 22h20" strokeWidth="1.8" />
    </>
  );
}

const ICONS: Record<Category, React.ReactNode> = {
  cafes:       <CoffeeIcon />,
  restaurants: <ForkKnifeIcon />,
  clinics:     <MedicalIcon />,
  salons:      <ScissorsIcon />,
  malls:       <BuildingIcon />,
};

// ── Placeholder component ────────────────────────────────────────────────────

export function CategoryPlaceholder({
  category,
  className = "",
}: {
  category: Category;
  className?: string;
}) {
  const { label, from, mid, to, accent } = CAT[category];
  const gradId   = `grad-${category}`;
  const radialId = `radial-${category}`;

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      aria-label={label}
    >
      {/* ── full-bleed SVG background ── */}
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 400 280"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor={from} />
            <stop offset="45%"  stopColor={mid}  />
            <stop offset="100%" stopColor={to}   />
          </linearGradient>
          <radialGradient id={radialId} cx="50%" cy="45%" r="55%">
            <stop offset="0%"   stopColor="white" stopOpacity="0.12" />
            <stop offset="100%" stopColor="white" stopOpacity="0"    />
          </radialGradient>
        </defs>

        {/* base gradient fill */}
        <rect width="400" height="280" fill={`url(#${gradId})`} />

        {/* radial centre glow */}
        <rect width="400" height="280" fill={`url(#${radialId})`} />

        {/* decorative large circle top-right */}
        <circle cx="380" cy="-30" r="140" fill="white" fillOpacity="0.05" />
        {/* decorative medium circle bottom-left */}
        <circle cx="-30" cy="310" r="120" fill="white" fillOpacity="0.05" />
        {/* decorative tiny circle mid-left */}
        <circle cx="30"  cy="100" r="50"  fill="white" fillOpacity="0.04" />

        {/* accent arc sweep */}
        <path
          d="M0 200 Q200 100 400 220"
          fill="none"
          stroke={accent}
          strokeOpacity="0.2"
          strokeWidth="60"
        />

        {/* dot grid (5×4) */}
        {Array.from({ length: 20 }).map((_, i) => {
          const col = i % 5;
          const row = Math.floor(i / 5);
          return (
            <circle
              key={i}
              cx={60 + col * 75}
              cy={40 + row * 70}
              r="2.5"
              fill="white"
              fillOpacity="0.08"
            />
          );
        })}
      </svg>

      {/* ── icon + label (sits above SVG) ── */}
      <div className="relative z-10 flex flex-col items-center gap-3">
        {/* frosted-glass icon circle */}
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full shadow-lg ring-1"
          style={{
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(6px)",
            boxShadow: `0 0 0 1px rgba(255,255,255,0.25), 0 4px 24px rgba(0,0,0,0.3)`,
          }}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-9 w-9"
            fill="none"
            stroke="white"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {ICONS[category]}
          </svg>
        </div>

        {/* category label */}
        <span
          className="rounded-full px-3.5 py-0.5 text-xs font-bold tracking-wide text-white"
          style={{
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(4px)",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.2)",
            fontFamily: "Tajawal, sans-serif",
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

// ── PlaceImage ────────────────────────────────────────────────────────────────
// Shows first real photo when available; falls back to CategoryPlaceholder.

export function PlaceImage({
  photos,
  category,
  name,
  className = "",
}: {
  photos?: string[];
  category: Category;
  name: string;
  className?: string;
}) {
  const src = photos?.[0];
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} loading="lazy" decoding="async" className={`object-cover ${className}`} />;
  }
  return <CategoryPlaceholder category={category} className={className} />;
}
