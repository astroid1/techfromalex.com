import type { APIRoute } from "astro";
import { getDB } from "@/lib/db";
import { getAllPublishedSlugs, getAllTags } from "@/lib/content";

export const prerender = false;

export const GET: APIRoute = async ({ locals, site, url }) => {
  const db = getDB(locals);
  const origin = (site ?? new URL(url.origin)).origin;
  const posts = await getAllPublishedSlugs(db);
  const tags = await getAllTags(db);
  const cats = ["reviews", "guides", "comparisons", "deals", "news"];

  const entries: { loc: string; lastmod?: string }[] = [
    { loc: `${origin}/` },
    { loc: `${origin}/blog` },
    { loc: `${origin}/deals` },
    { loc: `${origin}/about` },
    ...cats.map((c) => ({ loc: `${origin}/category/${c}` })),
    ...tags.map((t) => ({ loc: `${origin}/tag/${t.slug}` })),
    ...posts.map((p) => ({
      loc: `${origin}/${p.slug}`,
      lastmod: (p.updatedAt || p.publishedAt || "").slice(0, 10) || undefined,
    })),
  ];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries
      .map(
        (u) =>
          `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`,
      )
      .join("\n") +
    `\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
};
