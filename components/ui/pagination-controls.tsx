import Link from "next/link";

type PaginationControlsProps = {
  basePath: string;
  page: number;
  pageSize: number;
  hasPrev: boolean;
  hasNext: boolean;
};

export function PaginationControls({
  basePath,
  page,
  pageSize,
  hasPrev,
  hasNext
}: PaginationControlsProps) {
  const prevPage = page - 1;
  const nextPage = page + 1;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <div className="text-xs text-ink-900/70">
        الصفحة {page} • حجم {pageSize}
      </div>

      <div className="flex gap-2">
        {hasPrev ? (
          <Link
            prefetch={false}
            href={`${basePath}?page=${prevPage}&pageSize=${pageSize}`}
            className="rounded-full border border-ink-900/10 bg-white px-4 py-2 text-sm font-medium text-ink-900/80 hover:border-gold-400 hover:bg-gold-400/10"
          >
            السابق
          </Link>
        ) : (
          <span className="rounded-full border border-ink-900/10 bg-white px-4 py-2 text-sm font-medium text-ink-900/40">
            السابق
          </span>
        )}

        {hasNext ? (
          <Link
            prefetch={false}
            href={`${basePath}?page=${nextPage}&pageSize=${pageSize}`}
            className="rounded-full border border-ink-900/10 bg-white px-4 py-2 text-sm font-medium text-ink-900/80 hover:border-gold-400 hover:bg-gold-400/10"
          >
            التالي
          </Link>
        ) : (
          <span className="rounded-full border border-ink-900/10 bg-white px-4 py-2 text-sm font-medium text-ink-900/40">
            التالي
          </span>
        )}
      </div>
    </div>
  );
}

