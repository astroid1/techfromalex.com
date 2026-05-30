export const siteConfig = {
  name: "Tech From Alex",
  description:
    "Tech reviews, deals, and guides to help you make smarter buying decisions.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://techfromalex.com",
  author: "Alex",
  links: {
    twitter: "https://twitter.com/techfromalex",
    github: "https://github.com/techfromalex",
  },
};

export const categories = [
  { name: "Reviews", slug: "reviews", description: "In-depth product reviews" },
  { name: "Guides", slug: "guides", description: "Buying guides and how-tos" },
  { name: "Deals", slug: "deals", description: "The best tech deals right now" },
  { name: "News", slug: "news", description: "Latest tech news and announcements" },
  { name: "Comparisons", slug: "comparisons", description: "Head-to-head product comparisons" },
] as const;

export const navItems = [
  { label: "Blog", href: "/blog" },
  { label: "Reviews", href: "/category/reviews" },
  { label: "Guides", href: "/category/guides" },
  { label: "Deals", href: "/deals" },
  { label: "About", href: "/about" },
] as const;
