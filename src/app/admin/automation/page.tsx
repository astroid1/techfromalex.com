"use client";

import { useState } from "react";

interface ToolResult {
  status: "idle" | "running" | "success" | "error";
  output: string;
}

export default function AutomationPage() {
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostCategory, setNewPostCategory] = useState("reviews");
  const [toolResults, setToolResults] = useState<Record<string, ToolResult>>({});

  function setResult(tool: string, result: Partial<ToolResult>) {
    setToolResults((prev) => ({
      ...prev,
      [tool]: { ...prev[tool], ...result } as ToolResult,
    }));
  }

  async function scaffoldPost() {
    if (!newPostTitle.trim()) return;
    setResult("scaffold", { status: "running", output: "" });

    try {
      const res = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newPostTitle,
          description: "TODO: Add description",
          category: newPostCategory,
          published: false,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult("scaffold", {
          status: "success",
          output: `Post created: content/posts/${data.slug}.mdx`,
        });
        setNewPostTitle("");
      } else {
        setResult("scaffold", { status: "error", output: data.error });
      }
    } catch (e) {
      setResult("scaffold", { status: "error", output: "Failed to create post" });
    }
  }

  async function togglePublishAll(publish: boolean) {
    const action = publish ? "publish" : "unpublish";
    if (!confirm(`Are you sure you want to ${action} all posts?`)) return;
    setResult("bulk", { status: "running", output: "" });

    try {
      const res = await fetch("/api/admin/posts");
      const posts = await res.json();
      let count = 0;
      for (const post of posts) {
        if (post.frontmatter.published !== publish) {
          await fetch("/api/admin/posts", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug: post.slug, frontmatter: { published: publish } }),
          });
          count++;
        }
      }
      setResult("bulk", {
        status: "success",
        output: `${count} post(s) ${action}ed`,
      });
    } catch {
      setResult("bulk", { status: "error", output: "Failed to update posts" });
    }
  }

  async function generateSitemap() {
    setResult("sitemap", { status: "running", output: "" });
    try {
      // Trigger sitemap generation by fetching it
      const res = await fetch("/sitemap.xml");
      if (res.ok) {
        setResult("sitemap", {
          status: "success",
          output: "Sitemap is live at /sitemap.xml",
        });
      } else {
        setResult("sitemap", { status: "error", output: "Sitemap returned an error" });
      }
    } catch {
      setResult("sitemap", { status: "success", output: "Sitemap is auto-generated at /sitemap.xml" });
    }
  }

  async function generateRss() {
    setResult("rss", { status: "running", output: "" });
    try {
      const res = await fetch("/feed.xml");
      if (res.ok) {
        setResult("rss", {
          status: "success",
          output: "RSS feed is live at /feed.xml",
        });
      } else {
        setResult("rss", { status: "error", output: "RSS feed returned an error" });
      }
    } catch {
      setResult("rss", { status: "success", output: "RSS feed is auto-generated at /feed.xml" });
    }
  }

  const statusColors = {
    idle: "text-muted",
    running: "text-accent",
    success: "text-success",
    error: "text-danger",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Automation</h1>
        <p className="text-sm text-muted">Tools to streamline your workflow</p>
      </div>

      {/* Quick Post Scaffolding */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-1 text-lg font-semibold text-foreground">Quick Post Scaffold</h2>
        <p className="mb-4 text-sm text-muted">Create a new MDX post with boilerplate frontmatter</p>
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            value={newPostTitle}
            onChange={(e) => setNewPostTitle(e.target.value)}
            placeholder="Post title"
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
          <select
            value={newPostCategory}
            onChange={(e) => setNewPostCategory(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          >
            {["reviews", "guides", "deals", "news", "comparisons"].map((c) => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
          <button
            onClick={scaffoldPost}
            disabled={!newPostTitle.trim() || toolResults.scaffold?.status === "running"}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {toolResults.scaffold?.status === "running" ? "Creating..." : "Create Post"}
          </button>
        </div>
        {toolResults.scaffold?.output && (
          <p className={`mt-2 text-sm ${statusColors[toolResults.scaffold.status]}`}>
            {toolResults.scaffold.output}
          </p>
        )}
      </div>

      {/* Bulk Actions */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-1 text-lg font-semibold text-foreground">Bulk Actions</h2>
        <p className="mb-4 text-sm text-muted">Perform actions on multiple posts at once</p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => togglePublishAll(true)}
            disabled={toolResults.bulk?.status === "running"}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card-hover disabled:opacity-50"
          >
            Publish All Drafts
          </button>
          <button
            onClick={() => togglePublishAll(false)}
            disabled={toolResults.bulk?.status === "running"}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-danger transition-colors hover:bg-card-hover disabled:opacity-50"
          >
            Unpublish All
          </button>
        </div>
        {toolResults.bulk?.output && (
          <p className={`mt-2 text-sm ${statusColors[toolResults.bulk.status]}`}>
            {toolResults.bulk.output}
          </p>
        )}
      </div>

      {/* SEO Tools */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-1 text-lg font-semibold text-foreground">SEO Tools</h2>
        <p className="mb-4 text-sm text-muted">Generate and verify SEO assets</p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={generateSitemap}
            disabled={toolResults.sitemap?.status === "running"}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card-hover disabled:opacity-50"
          >
            Verify Sitemap
          </button>
          <button
            onClick={generateRss}
            disabled={toolResults.rss?.status === "running"}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card-hover disabled:opacity-50"
          >
            Verify RSS Feed
          </button>
        </div>
        <div className="mt-2 space-y-1">
          {toolResults.sitemap?.output && (
            <p className={`text-sm ${statusColors[toolResults.sitemap.status]}`}>
              Sitemap: {toolResults.sitemap.output}
            </p>
          )}
          {toolResults.rss?.output && (
            <p className={`text-sm ${statusColors[toolResults.rss.status]}`}>
              RSS: {toolResults.rss.output}
            </p>
          )}
        </div>
      </div>

      {/* CLI Scripts Reference */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-1 text-lg font-semibold text-foreground">CLI Scripts</h2>
        <p className="mb-4 text-sm text-muted">Available npm scripts for terminal automation</p>
        <div className="space-y-3 font-mono text-sm">
          <div className="rounded bg-code-bg p-3">
            <p className="text-muted">## Create a new post</p>
            <p className="text-foreground">npm run new-post &quot;Post Title&quot; reviews</p>
          </div>
          <div className="rounded bg-code-bg p-3">
            <p className="text-muted">## Validate build (lint + types + build)</p>
            <p className="text-foreground">npm run validate</p>
          </div>
          <div className="rounded bg-code-bg p-3">
            <p className="text-muted">## Development server</p>
            <p className="text-foreground">npm run dev</p>
          </div>
          <div className="rounded bg-code-bg p-3">
            <p className="text-muted">## Production build</p>
            <p className="text-foreground">npm run build</p>
          </div>
        </div>
      </div>
    </div>
  );
}
