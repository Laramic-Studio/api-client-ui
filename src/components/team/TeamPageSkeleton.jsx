import { Skeleton } from "@/components/ui/skeleton";

export default function TeamPageSkeleton() {
  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-5">
        <Skeleton className="h-3 w-28 mb-2" />
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="rounded-md border border-border bg-card p-4 mb-5">
        <Skeleton className="h-3 w-24 mb-3" />
        <Skeleton className="h-9 w-full" />
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_120px_120px_40px] gap-2 px-4 py-2 border-b border-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-full" />
          ))}
        </div>
        {Array.from({ length: 4 }).map((_, row) => (
          <div
            key={row}
            className="grid grid-cols-[1fr_120px_120px_120px_40px] gap-2 items-center px-4 py-3 border-b border-border last:border-0"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-7 w-7 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-7" />
          </div>
        ))}
      </div>
    </div>
  );
}
