import { PostGridSkeleton } from "@/components/blog/PostCardSkeleton";

export default function BlogLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <div className="h-8 w-32 animate-pulse rounded bg-border" />
        <div className="mt-3 h-5 w-64 animate-pulse rounded bg-border" />
      </div>
      <div className="mb-8 h-10 w-full animate-pulse rounded-lg bg-border" />
      <PostGridSkeleton count={6} />
    </div>
  );
}
