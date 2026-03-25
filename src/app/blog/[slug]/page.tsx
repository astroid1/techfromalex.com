import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug, getRelatedPosts } from "@/lib/content";
import { generatePageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/constants";
import { MdxContent } from "@/components/mdx/MdxContent";
import { PostHeader } from "@/components/blog/PostHeader";
import { PostCard } from "@/components/blog/PostCard";
import { TOC } from "@/components/blog/TOC";
import { AffiliateDisclosure } from "@/components/affiliate";
import { ReadingProgress } from "@/components/blog/ReadingProgress";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {};
  }

  return generatePageMetadata({
    title: post.title,
    description: post.description,
    url: `/blog/${post.slug}`,
    image: post.image,
    type: "article",
    publishedTime: post.date,
    modifiedTime: post.updated,
    tags: post.tags,
  });
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = getRelatedPosts(slug, 3);

  const breadcrumbItems = [
    { label: "Blog", href: "/blog" },
    { label: post.category.charAt(0).toUpperCase() + post.category.slice(1), href: `/category/${post.category}` },
    { label: post.title },
  ];

  return (
    <>
      <ReadingProgress />
      <ArticleJsonLd
        title={post.title}
        description={post.description}
        date={post.date}
        updated={post.updated}
        author={post.author}
        image={post.image}
        url={`/blog/${post.slug}`}
      />
      <BreadcrumbJsonLd
        items={breadcrumbItems.map((item) => ({
          name: item.label,
          url: item.href || `/blog/${post.slug}`,
        }))}
      />
      <article className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Breadcrumbs items={breadcrumbItems} />
        <PostHeader
        title={post.title}
        date={post.date}
        author={post.author}
        category={post.category}
        tags={post.tags}
        readingTime={post.readingTime}
        image={post.image}
        imageAlt={post.imageAlt}
        updated={post.updated}
      />

      {post.hasAffiliateLinks && <AffiliateDisclosure />}

      <div className="relative flex gap-10">
        {/* Main content */}
        <div className="min-w-0 flex-1">
          <div className="prose prose-lg max-w-none">
            <MdxContent code={post.body} />
          </div>
        </div>

        {/* Desktop TOC sidebar */}
        {post.toc && post.toc.length > 0 && (
          <aside className="hidden w-56 shrink-0 lg:block">
            <TOC items={post.toc} />
          </aside>
        )}
      </div>

      {/* Share + Related */}
      <div className="mt-10 border-t border-border pt-8">
        <ShareButtons title={post.title} slug={post.slug} />
      </div>

      {relatedPosts.length > 0 && (
        <section className="mt-10 border-t border-border pt-10">
          <h2 className="mb-6 text-2xl font-bold tracking-tight text-foreground">
            Related Posts
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedPosts.map((related) => (
              <PostCard
                key={related.slug}
                title={related.title}
                slug={related.slug}
                description={related.description}
                date={related.date}
                category={related.category}
                image={related.image}
                imageAlt={related.imageAlt}
                readingTime={related.readingTime}
              />
            ))}
          </div>
        </section>
      )}
      </article>
    </>
  );
}
