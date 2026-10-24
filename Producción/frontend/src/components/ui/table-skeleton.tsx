import { Skeleton } from './skeleton';

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Cargando">
      <span className="sr-only">Cargando…</span>
      <div className="space-y-3" aria-hidden="true">
        {Array.from({ length: rows }, (_, index) => (
          <div
            key={index}
            className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3"
          >
            <Skeleton className="h-10 w-16 shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-6 w-20 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
