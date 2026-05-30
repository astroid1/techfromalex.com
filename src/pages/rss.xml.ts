import type { APIRoute } from "astro";
import { getDB } from "@/lib/db";
import { listPublished } from "@/lib/content";

export const prerender = false;

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const GET: APIRoute = async ({ locals, site, url }) => {
  const db = getDB(locals);
  const origin = (site ?? new URL(url.origin)).origin;
  const posts = await listPublished(db, { limit: 20 });

  const items = posts
    .map((p) => {
      const link = `${origin}/${p.slug}`;
      return (
        `<item>` +
        `<title>${esc(p.title)}</title>` +
        `<link>${link}</link>` +
        `<guid isPermaLink="true">${link}</guid>` +
        (p.publishedAt ? `<pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>` : "") +
        (p.category ? `<category>${esc(p.category)}</category>` : "") +
        `<description>${esc(p.dek ?? "")}</description>` +
        `</item>`
      );
    })
    .join("");

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">` +
    `<channel>` +
    `<title>Tech From Alex</title>` +
    `<link>${origin}/</link>` +
    `<atom:link href="${origin}/rss.xml" rel="self" type="application/rss+xml"/>` +
    `<description>Honest, hands-on tech reviews, guides, and deals.</description>` +
    `<language>en-us</language>` +
    items +
    `</channel></rss>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
};
