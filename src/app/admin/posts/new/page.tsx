"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = ["reviews", "guides", "deals", "news", "comparisons"];

export default function NewPostPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "reviews",
    tags: "",
    image: "",
    author: "Alex",
    published: false,
    content: "## Introduction\n\nStart writing here...",
  });

  function updateField(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });

      if (res.ok) {
        router.push("/admin/posts");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create post");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">New Post</h1>
        <p className="text-sm text-muted">Create a new blog post</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            placeholder="My Awesome Post"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            rows={2}
            placeholder="A brief description for SEO and previews"
            required
          />
        </div>

        {/* Category + Author */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Category</label>
            <select
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Author</label>
            <input
              type="text"
              value={form.author}
              onChange={(e) => updateField("author", e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Tags</label>
          <input
            type="text"
            value={form.tags}
            onChange={(e) => updateField("tags", e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            placeholder="tag1, tag2, tag3"
          />
          <p className="mt-1 text-xs text-muted">Comma-separated</p>
        </div>

        {/* Image */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Featured Image URL</label>
          <input
            type="text"
            value={form.image}
            onChange={(e) => updateField("image", e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            placeholder="/images/my-post.jpg or https://..."
          />
        </div>

        {/* Content */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Content (MDX)</label>
          <textarea
            value={form.content}
            onChange={(e) => updateField("content", e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            rows={16}
          />
        </div>

        {/* Published toggle */}
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => updateField("published", e.target.checked)}
            className="h-4 w-4 rounded border-border accent-accent"
          />
          <span className="text-sm font-medium text-foreground">Publish immediately</span>
        </label>

        {error && <p className="text-sm text-danger">{error}</p>}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Post"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
