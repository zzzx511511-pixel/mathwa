export function OccupancyBar({
  percent,
  label = "نسبة الإشغال"
}: {
  percent: number;
  label?: string;
}) {
  const safe = Math.min(100, Math.max(0, Math.round(percent)));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs font-semibold text-ink-900/80">
        <span>{label}</span>
        <span className="text-brand-500">{safe}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink-900/10">
        <div
          className="h-full rounded-full bg-gradient-to-l from-brand-500 to-gold-500 transition-[width]"
          style={{ width: `${safe}%` }}
        />
      </div>
      <p className="text-[11px] text-ink-900/55">يشمل الوحدات المباعة أو المؤجرة ضمن المشروع.</p>
    </div>
  );
}
