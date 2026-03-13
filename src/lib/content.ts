import { posts } from "#site/content";
import type { Category } from "@/types";

export function getAllPosts() {
  return posts
    .filter((post) => post.published)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string) {
  return posts.find((post) => post.slug === slug && post.published);
}

export function getPostsByCategory(category: Category) {
  return getAllPosts().filter((post) => post.category === category);
}

export function getPostsByTag(tag: string) {
  return getAllPosts().filter((post) =>
    post.tags.map((t) => t.toLowerCase()).includes(tag.toLowerCase())
  );
}

export function getAllTags() {
  const tags = new Set<string>();
  getAllPosts().forEach((post) => post.tags.forEach((tag) => tags.add(tag)));
  return Array.from(tags).sort();
}

export function getAllCategories() {
  const cats = new Set<Category>();
  getAllPosts().forEach((post) => cats.add(post.category));
  return Array.from(cats);
}

export function getRelatedPosts(slug: string, limit = 3) {
  const post = getPostBySlug(slug);
  if (!post) return [];

  return getAllPosts()
    .filter((p) => p.slug !== slug)
    .map((p) => ({
      ...p,
      relevance:
        (p.category === post.category ? 2 : 0) +
        p.tags.filter((t) => post.tags.includes(t)).length,
    }))
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);
}
