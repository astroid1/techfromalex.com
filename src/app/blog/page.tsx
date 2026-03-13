import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllPosts, getAllCategories } from "@/lib/content";
import { generatePageMetadata } from "@/lib/seo";
import { PostCard } from "@/components/blog/PostCard";
import { SearchPosts } from "@/components/blog/SearchPosts";

export function generateMetadata(): Metadata {
  return generatePageMetadata({
    title: "Blog",
    description:
      "Tech reviews, buying guides, deals, and news to help you make smarter tech decisions.",
    url: "/blog",
  });
}

interface BlogPageProps {
  searchParams: Promise<{ q?: string; category?: string; tag?: string }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { q, category, tag } = await searchParams;
  const allPosts = getAllPosts();
  const categories = getAllCategories();

  const filteredPosts = allPosts.filter((post) => {
    // Filter by search query
    if (q) {
      const query = q.toLowerCase();
      const matchesTitle = post.title.toLowerCase().includes(query);
      const matchesDescription = post.description.toLowerCase().includes(query);
      const matchesTags = post.tags.some((t) =>
        t.toLowerCase().includes(query)
      );
      if (!matchesTitle && !matchesDescription && !matchesTags) return false;
    }

    // Filter by category
    if (category && post.category !== category) return false;

    // Filter by tag
    if (tag) {
      const matchesTag = post.tags.some(
        (t) => t.toLowerCase() === tag.toLowerCase()
      );
      if (!matchesTag) return false;
    }

    return true;
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Blog
        </h1>
        <p className="mt-2 text-muted">
          Tech reviews, guides, deals, and the latest news.
        </p>
      </div>

      <Suspense fallback={null}>
        <SearchPosts categories={categories} />
      </Suspense>

      {filteredPosts.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => (
            <PostCard
              key={post.slug}
              title={post.title}
              slug={post.slug}
              description={post.description}
              date={post.date}
              category={post.category}
              image={post.image}
              imageAlt={post.imageAlt}
              readingTime={post.readingTime}
            />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-muted">
            No posts found. Try adjusting your search or filters.
          </p>
        </div>
      )}
    </div>
  );
}
