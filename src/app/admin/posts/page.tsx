"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Post {
  slug: string;
  filename: string;
  frontmatter: {
    title: string;
    description: string;
    date: string;
    category: string;
    tags: string[];
    author: string;
    published: boolean;
  };
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  function fetchPosts() {
    fetch("/api/admin/posts")
      .then((res) => res.json())
      .then(setPosts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchPosts(); }, []);

  async function handleDelete(slug: string) {
    if (!confirm(`Delete "${slug}"? This cannot be undone.`)) return;
    setDeleting(slug);
    try {
      const res = await fetch("/api/admin/posts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.slug !== slug));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(null);
    }
  }

  async function togglePublished(slug: string, currentPublished: boolean) {
    try {
      await fetch("/api/admin/posts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          frontmatter: { published: !currentPublished },
        }),
      });
      fetchPosts();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Posts</h1>
          <p className="text-sm text-muted">Manage your blog posts</p>
        </div>
        <Link
          href="/admin/posts/new"
          className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14m-7-7h14" />
          </svg>
          New Post
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg border border-border bg-card" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-muted">No posts yet. Create your first post!</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-card">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {posts.map((post) => (
                <tr key={post.slug} className="bg-background transition-colors hover:bg-card">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-foreground">{post.frontmatter.title}</p>
                      <p className="text-xs text-muted">/blog/{post.slug}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-card px-2 py-0.5 text-xs capitalize text-muted-foreground">
                      {post.frontmatter.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">{post.frontmatter.date}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => togglePublished(post.slug, post.frontmatter.published)}
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        post.frontmatter.published
                          ? "bg-success/10 text-success"
                          : "bg-warning/10 text-warning"
                      }`}
                    >
                      {post.frontmatter.published ? "Published" : "Draft"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        className="rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleDelete(post.slug)}
                        disabled={deleting === post.slug}
                        className="rounded px-2 py-1 text-xs text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
                      >
                        {deleting === post.slug ? "..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
