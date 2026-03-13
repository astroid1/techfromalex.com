import Link from "next/link";
import { siteConfig } from "@/lib/constants";
import { getAllPosts } from "@/lib/content";
import { PostCard } from "@/components/blog/PostCard";
import { SignupForm } from "@/components/newsletter/SignupForm";

export default function HomePage() {
  const latestPosts = getAllPosts().slice(0, 6);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:py-28">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Tech Reviews You Can{" "}
            <span className="text-accent">Trust</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted sm:text-xl">
            {siteConfig.description}
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/blog"
              className="inline-flex h-11 items-center rounded-lg bg-accent px-6 font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
            >
              Read the Blog
            </Link>
            <Link
              href="/deals"
              className="inline-flex h-11 items-center rounded-lg border border-border px-6 font-medium transition-colors hover:bg-card"
            >
              Today&apos;s Deals
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Posts */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Latest Posts</h2>
          <Link href="/blog" className="text-sm text-accent hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {latestPosts.length > 0 ? (
            latestPosts.map((post) => (
              <PostCard
                key={post.slug}
                title={post.title}
                slug={post.slug}
                description={post.description}
                date={post.date}
                category={post.category}
                image={post.image}
                readingTime={post.readingTime}
              />
            ))
          ) : (
            <div className="rounded-lg border border-border bg-card p-6">
              <p className="text-muted">Posts coming soon...</p>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h2 className="text-2xl font-bold">Stay in the Loop</h2>
          <p className="mt-2 text-muted">
            Get the latest reviews and deals delivered to your inbox.
          </p>
          <div className="mx-auto mt-6 max-w-md">
            <SignupForm />
          </div>
        </div>
      </section>
    </div>
  );
}
