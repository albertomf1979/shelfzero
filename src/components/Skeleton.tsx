export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true"
      className={"rounded-sm bg-paper-2 " + className}
      style={{
        backgroundImage:
          "linear-gradient(90deg, transparent 0%, rgb(255 255 255 / 0.45) 50%, transparent 100%)",
        backgroundSize: "200% 100%",
        animation: "sz-shimmer 1.4s linear infinite",
      }} />
  );
}

/** Rejilla del estante: 2 filas con su balda, para que la carga tenga la forma final. */
export function ShelfSkeleton({ view, cols = 3 }: { view: "shelf" | "list"; cols?: number }) {
  if (view === "list") {
    return (
      <div className="divide-y divide-rule/50 border-y border-rule/50" role="status"
           aria-label="Cargando el estante">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3">
            <Skeleton className="h-[60px] w-10 shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/5 rounded-md" />
              <Skeleton className="h-3 w-2/5 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-8" role="status" aria-label="Cargando el estante">
      {Array.from({ length: 2 }).map((_, r) => (
        <div key={r}>
          <div className="flex items-end gap-3 sm:gap-4">
            {Array.from({ length: cols }).map((_, i) => (
              <div key={i} className="min-w-0 flex-1 space-y-2">
                <Skeleton className="aspect-[2/3] w-full" />
                <Skeleton className="h-3 w-4/5 rounded-md" />
              </div>
            ))}
          </div>
          <div aria-hidden="true" className="mt-1.5">
            <div className="h-2 bg-gradient-to-b from-wood to-wood-dark opacity-60" />
            <div className="h-1 bg-wood-dark/30" />
          </div>
        </div>
      ))}
    </div>
  );
}
