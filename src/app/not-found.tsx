import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-bold text-foreground">404</h1>
      <p className="mt-4 text-xl text-muted">Page not found</p>
      <p className="mt-2 text-sm text-muted">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="mt-8 flex items-center gap-4">
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-lg bg-accent px-6 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
        >
          Go Home
        </Link>
        <Link
          href="/blog"
          className="inline-flex h-10 items-center rounded-lg border border-border px-6 text-sm font-medium transition-colors hover:bg-card"
        >
          Browse Blog
        </Link>
      </div>
    </div>
  );
}
