import type { Category } from "@/lib/salsabeel/types";

// ── Per-category gradient colours (all sky-blue family = Salsabeel palette) ──
const CAT_STYLE: Record<Category, { label: string; from: string; to: string }> = {
  cafes:       { label: "كوفيهات",  from: "#0c4a6e", to: "#0ea5e9" },
  restaurants: { label: "مطاعم",    from: "#082f49", to: "#0369a1" },
  clinics:     { label: "عيادات",   from: "#0f172a", to: "#0284c7" },
  salons:      { label: "صالونات",  from: "#1e1b4b", to: "#2563eb" },
  malls:       { label: "الوجهات",  from: "#0a2235", to: "#0e7490" },
};

// ── Category icons (24 × 24 viewBox, outline style) ─────────────────────────

function CoffeeIcon() {
  return (
    <>
      {/* steam */}
      <path d="M8 5c0-2 2-2 2-4M14 5c0-2 2-2 2-4" />
      {/* cup */}
      <path d="M5 8h14v9a3 3 0 01-3 3H8a3 3 0 01-3-3V8z" />
      {/* handle */}
      <path d="M19 10h1.5a2.5 2.5 0 010 5H19" />
      {/* saucer */}
      <path d="M3 21h18" />
    </>
  );
}

function ForkKnifeIcon() {
  return (
    <>
      {/* fork tines */}
      <path d="M6 2v4M4 2v4M8 2v4" />
      {/* fork body */}
      <path d="M4 6a2 2 0 004 0M6 8v14" />
      {/* knife */}
      <path d="M16 2c2 1 4 4 4 7h-4M16 9v13" />
    </>
  );
}

function MedicalIcon() {
  return (
    /* plus / cross */
    <path d="M8 3h8v5h5v8h-5v5H8v-5H3v-8h5z" />
  );
}

function ScissorsIcon() {
  return (
    <>
      {/* handles */}
      <circle cx="6" cy="7"  r="3" />
      <circle cx="6" cy="17" r="3" />
      {/* blades */}
      <path d="M9 7L21 17M9 17L21 7" />
      {/* pivot */}
      <circle cx="15" cy="12" r="1.5" fill="white" stroke="none" />
    </>
  );
}

function BuildingIcon() {
  return (
    <>
      {/* outline */}
      <path d="M3 22h18M4 22V7l8-5 8 5v15" />
      {/* door */}
      <path d="M10 22v-7h4v7" />
      {/* windows */}
      <rect x="6"  y="9"  width="3" height="3" rx="0.5" />
      <rect x="15" y="9"  width="3" height="3" rx="0.5" />
      <rect x="6"  y="14" width="3" height="3" rx="0.5" />
      <rect x="15" y="14" width="3" height="3" rx="0.5" />
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
  const { label, from, to } = CAT_STYLE[category];
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
      aria-label={label}
    >
      {/* decorative circles */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute left-1/2 top-2 h-16 w-16 -translate-x-1/2 rounded-full bg-white/4" />

      {/* icon + label */}
      <div className="relative flex flex-col items-center gap-2.5">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 shadow ring-1 ring-white/25">
          <svg
            viewBox="0 0 24 24"
            className="h-9 w-9"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {ICONS[category]}
          </svg>
        </div>
        <span
          className="text-sm font-bold tracking-wide text-white/90"
          style={{ fontFamily: "Tajawal, sans-serif" }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

// ── Main PlaceImage component ────────────────────────────────────────────────
// Shows first real photo when available, falls back to CategoryPlaceholder.

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
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={name} className={`object-cover ${className}`} />
    );
  }
  return <CategoryPlaceholder category={category} className={className} />;
}
