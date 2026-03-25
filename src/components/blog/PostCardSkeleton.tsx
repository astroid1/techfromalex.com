export function PostCardSkeleton() {
  return (
    <div className="h-full animate-pulse overflow-hidden rounded-lg border border-border bg-card">
      <div className="aspect-video bg-border" />
      <div className="flex flex-col gap-3 p-4">
        <div className="h-5 w-16 rounded bg-border" />
        <div className="h-5 w-full rounded bg-border" />
        <div className="h-5 w-3/4 rounded bg-border" />
        <div className="h-4 w-full rounded bg-border" />
        <div className="mt-auto flex items-center gap-2 pt-2">
          <div className="h-3 w-20 rounded bg-border" />
          <div className="h-3 w-16 rounded bg-border" />
        </div>
      </div>
    </div>
  );
}

export function PostGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}
