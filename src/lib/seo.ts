import type { Metadata } from "next";
import { siteConfig } from "./constants";

interface PageSEOProps {
  title: string;
  description: string;
  url?: string;
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  tags?: string[];
}

export function generatePageMetadata({
  title,
  description,
  url,
  image,
  type = "website",
  publishedTime,
  modifiedTime,
  tags,
}: PageSEOProps): Metadata {
  const ogImage = image || `${siteConfig.url}/og-default.png`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: url ? `${siteConfig.url}${url}` : siteConfig.url,
      siteName: siteConfig.name,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      type,
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(tags && { tags }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: url ? `${siteConfig.url}${url}` : siteConfig.url,
    },
  };
}
