type KvTableProps = {
  data: Record<string, unknown>;
};

export function KvTable({ data }: KvTableProps) {
  const entries = Object.entries(data);

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-900/10">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-brand-100 text-ink-900/80">
          <tr>
            <th className="px-4 py-3 text-right font-semibold">الحقل</th>
            <th className="px-4 py-3 text-right font-semibold">القيمة</th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 ? (
            <tr>
              <td className="px-4 py-4" colSpan={2}>
                لا توجد بيانات.
              </td>
            </tr>
          ) : (
            entries.map(([k, v]) => (
              <tr key={k} className="border-t border-ink-900/5">
                <td className="px-4 py-3 font-medium text-ink-900/80">{k}</td>
                <td className="px-4 py-3 text-ink-900/70">
                  {formatValue(v)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function formatValue(v: unknown) {
  if (v === null || v === undefined) return "—";
  if (typeof v === "string") return v.length > 300 ? `${v.slice(0, 300)}…` : v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    const json = JSON.stringify(v);
    return json.length > 300 ? `${json.slice(0, 300)}…` : json;
  } catch {
    return String(v);
  }
}

