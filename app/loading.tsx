export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-64 rounded bg-ink-900/10" />
        <div className="h-4 w-full rounded bg-ink-900/10" />
        <div className="h-4 w-5/6 rounded bg-ink-900/10" />
        <div className="h-4 w-3/4 rounded bg-ink-900/10" />
      </div>
    </div>
  );
}

