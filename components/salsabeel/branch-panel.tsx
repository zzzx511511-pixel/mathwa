import Link from "next/link";
import type { Branch } from "@/lib/salsabeel/types";

export function BranchPanel({
  branches,
  placeId,
}: {
  branches: Branch[];
  placeId: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      {branches.map((branch) => (
        <Link
          key={branch.id}
          href={`/places/${placeId}/branches/${branch.id}`}
          className="group flex items-center justify-between rounded-2xl border border-sal-100 bg-white p-4 transition hover:-translate-y-0.5 hover:border-sal-300 hover:shadow-md"
        >
          <div className="flex items-start gap-3">
            <span className="text-xl">📍</span>
            <div>
              <p className="font-bold text-ink-900 group-hover:text-sal-600 transition-colors">
                {branch.name}
              </p>
              <p className="mt-0.5 text-xs text-ink-500">{branch.address}، {branch.city}</p>
              {branch.openingHours && (
                <p className="mt-0.5 text-xs text-ink-400">⏰ {branch.openingHours}</p>
              )}
            </div>
          </div>
          <svg
            className="h-4 w-4 shrink-0 text-sal-400 transition group-hover:text-sal-600 group-hover:-translate-x-0.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Link>
      ))}
    </div>
  );
}
