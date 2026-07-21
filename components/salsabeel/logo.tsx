/** Map-pin logo component — وين brand identity */

type Size = "xs" | "sm" | "md" | "lg";

const SIZES: Record<Size, number> = {
  xs: 28,
  sm: 36,
  md: 44,
  lg: 80,
};

/**
 * Map-pin icon: coral outer body (#FF6B4A) with a dark-teal inner circle (#0F5C56).
 * Replaces the old water-drop + star shape.
 */
export function LogoDrop({ size = "md", glow = true }: { size?: Size; glow?: boolean }) {
  const d = SIZES[size];
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      width={d}
      height={d}
      xmlns="http://www.w3.org/2000/svg"
      style={{
        flexShrink: 0,
        filter: glow ? "drop-shadow(0 0 6px rgba(255,107,74,0.55))" : undefined,
      }}
    >
      {/* Pin body — coral */}
      <path
        d="M16 2C9.4 2 4 7.4 4 14c0 7.2 11.3 17.6 11.8 18.1a.3.3 0 0 0 .4 0C16.7 31.6 28 21.2 28 14 28 7.4 22.6 2 16 2z"
        fill="#FF6B4A"
      />
      {/* Inner circle — dark teal */}
      <circle cx="16" cy="13.5" r="4.5" fill="#0F5C56" />
    </svg>
  );
}

/** Full logo (pin icon + brand name) */
export function SalsabeelBrand({
  size = "md",
  showTagline = false,
}: {
  size?: Size;
  showTagline?: boolean;
}) {
  const textSizes: Record<Size, string> = {
    xs: "text-base",
    sm: "text-lg",
    md: "text-xl",
    lg: "text-4xl",
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2.5">
        <LogoDrop size={size} />
        <span
          className={`font-extrabold tracking-wide text-white ${textSizes[size]}`}
          style={{ fontFamily: "Tajawal, sans-serif" }}
        >
          و<span style={{ color: "#FF6B4A" }}>ي</span>ن
        </span>
      </div>
      {showTagline && (
        <span className="text-xs font-light tracking-widest text-white/40">
          اختر بثقة • قيّم بصدق
        </span>
      )}
    </div>
  );
}
