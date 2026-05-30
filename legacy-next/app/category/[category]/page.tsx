import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { categories } from "@/lib/constants";
import { getPostsByCategory } from "@/lib/content";
import { generatePageMetadata } from "@/lib/seo";
import { PostCard } from "@/components/blog/PostCard";
import type { Category } from "@/types";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export function generateStaticParams() {
  return categories.map((cat) => ({
    category: cat.slug,
  }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const categoryData = categories.find((c) => c.slug === category);

  if (!categoryData) {
    return {};
  }

  return generatePageMetadata({
    title: `${categoryData.name} - ${categoryData.description}`,
    description: `Browse all ${categoryData.name.toLowerCase()} on Tech From Alex. ${categoryData.description}.`,
    url: `/category/${category}`,
  });
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const categoryData = categories.find((c) => c.slug === category);

  if (!categoryData) {
    notFound();
  }

  const posts = getPostsByCategory(category as Category);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {categoryData.name}
        </h1>
        <p className="mt-2 text-lg text-muted">{categoryData.description}</p>
      </header>

      {posts.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
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
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-muted">
            No posts in this category yet. Check back soon!
          </p>
        </div>
      )}
    </div>
  );
}
