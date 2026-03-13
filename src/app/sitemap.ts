import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/constants";
import { getAllPosts } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteConfig.url}${post.permalink}`,
    lastModified: new Date(post.date),
  }));

  const categoryEntries: MetadataRoute.Sitemap = [
    "reviews",
    "guides",
    "deals",
    "news",
    "comparisons",
  ].map((category) => ({
    url: `${siteConfig.url}/category/${category}`,
    lastModified: new Date(),
  }));

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: siteConfig.url,
      lastModified: new Date(),
    },
    {
      url: `${siteConfig.url}/blog`,
      lastModified: new Date(),
    },
    {
      url: `${siteConfig.url}/about`,
      lastModified: new Date(),
    },
    {
      url: `${siteConfig.url}/deals`,
      lastModified: new Date(),
    },
  ];

  return [...staticEntries, ...categoryEntries, ...postEntries];
}
