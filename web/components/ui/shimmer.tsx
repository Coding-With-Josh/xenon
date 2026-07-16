export function ShimmerLine({ className }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded bg-muted ${className ?? "h-4 w-full"}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/10" />
    </div>
  );
}

export function ShimmerBlock({ className }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-muted ${className ?? "h-32 w-full"}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/10" />
    </div>
  );
}

export function NotesShimmer() {
  return (
    <div className="space-y-3">
      <ShimmerLine className="h-4 w-1/4" />
      <ShimmerLine className="h-4 w-full" />
      <ShimmerLine className="h-4 w-5/6" />
      <ShimmerLine className="h-4 w-4/6" />
      <ShimmerLine className="h-4 w-full" />
      <ShimmerLine className="h-4 w-3/4" />
      <ShimmerLine className="h-4 w-2/3" />
      <div className="h-4" />
      <ShimmerLine className="h-4 w-full" />
      <ShimmerLine className="h-4 w-11/12" />
      <ShimmerLine className="h-4 w-4/6" />
      <ShimmerLine className="h-4 w-full" />
      <ShimmerLine className="h-4 w-5/6" />
    </div>
  );
}

export function MicroCheckShimmer() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border p-5 space-y-3">
          <ShimmerLine className="h-4 w-3/4" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, j) => (
              <ShimmerLine key={j} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
