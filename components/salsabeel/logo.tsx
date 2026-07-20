/** Water-drop logo component */

type Size = "xs" | "sm" | "md" | "lg";

const SIZES: Record<Size, { drop: number; star: number }> = {
  xs: { drop: 28, star: 15 },
  sm: { drop: 36, star: 20 },
  md: { drop: 44, star: 26 },
  lg: { drop: 80, star: 46 },
};

export function LogoDrop({ size = "md", glow = true }: { size?: Size; glow?: boolean }) {
  const { drop: d, star: s } = SIZES[size];
  return (
    <div style={{ position: "relative", width: d, height: d, flexShrink: 0 }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(160deg, #16A394 0%, #0F5C56 55%, #031A17 100%)",
          borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
          transform: "rotate(180deg)",
          boxShadow: glow ? "0 0 20px rgba(22,163,148,0.45)" : undefined,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg viewBox="0 0 60 60" fill="none" width={s} height={s}>
          <polygon
            points="30,6 35.5,22.5 53,22.5 39,32.5 44.5,49 30,39 15.5,49 21,32.5 7,22.5 24.5,22.5"
            fill="white"
            opacity="0.95"
          />
        </svg>
      </div>
    </div>
  );
}

/** Full logo (drop + name) */
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
          و<span style={{ color: "#16A394" }}>ي</span>ن
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
