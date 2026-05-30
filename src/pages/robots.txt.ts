import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = ({ site, url }) => {
  const origin = (site ?? new URL(url.origin)).origin;
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /api/",
    "",
    `Sitemap: ${origin}/sitemap.xml`,
    "",
  ].join("\n");
  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
};
