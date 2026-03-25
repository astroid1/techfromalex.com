import { readFileSync, writeFileSync, existsSync, unlinkSync, readdirSync } from "fs";
import { join } from "path";

const POSTS_DIR = join(process.cwd(), "content/posts");

export interface PostFrontmatter {
  title: string;
  description: string;
  date: string;
  category: string;
  tags: string[];
  image: string;
  imageAlt: string;
  author: string;
  published: boolean;
  hasAffiliateLinks: boolean;
  affiliateProducts: string[];
}

export interface PostFile {
  slug: string;
  filename: string;
  frontmatter: PostFrontmatter;
  content: string;
  raw: string;
}

function parseFrontmatter(raw: string): { frontmatter: Record<string, unknown>; content: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, content: raw };

  const frontmatterStr = match[1];
  const content = match[2];
  const frontmatter: Record<string, unknown> = {};

  frontmatterStr.split("\n").forEach((line) => {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) return;
    const key = line.slice(0, colonIndex).trim();
    let value: unknown = line.slice(colonIndex + 1).trim();

    // Handle arrays
    if (typeof value === "string" && value.startsWith("[")) {
      try {
        value = JSON.parse(value.replace(/'/g, '"'));
      } catch {
        value = [];
      }
    }
    // Handle booleans
    else if (value === "true") value = true;
    else if (value === "false") value = false;
    // Handle quoted strings
    else if (typeof value === "string" && value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }

    frontmatter[key] = value;
  });

  return { frontmatter, content };
}

export function listPostFiles(): PostFile[] {
  if (!existsSync(POSTS_DIR)) return [];

  return readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((filename) => {
      const raw = readFileSync(join(POSTS_DIR, filename), "utf-8");
      const { frontmatter, content } = parseFrontmatter(raw);
      const slug = filename.replace(/\.mdx$/, "");

      return {
        slug,
        filename,
        frontmatter: {
          title: String(frontmatter.title || ""),
          description: String(frontmatter.description || ""),
          date: String(frontmatter.date || ""),
          category: String(frontmatter.category || "reviews"),
          tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
          image: String(frontmatter.image || ""),
          imageAlt: String(frontmatter.imageAlt || ""),
          author: String(frontmatter.author || "Alex"),
          published: Boolean(frontmatter.published),
          hasAffiliateLinks: Boolean(frontmatter.hasAffiliateLinks),
          affiliateProducts: Array.isArray(frontmatter.affiliateProducts)
            ? frontmatter.affiliateProducts
            : [],
        },
        content,
        raw,
      };
    })
    .sort((a, b) => b.frontmatter.date.localeCompare(a.frontmatter.date));
}

export function getPostFile(slug: string): PostFile | null {
  const filename = `${slug}.mdx`;
  const filepath = join(POSTS_DIR, filename);
  if (!existsSync(filepath)) return null;

  const raw = readFileSync(filepath, "utf-8");
  const { frontmatter, content } = parseFrontmatter(raw);

  return {
    slug,
    filename,
    frontmatter: {
      title: String(frontmatter.title || ""),
      description: String(frontmatter.description || ""),
      date: String(frontmatter.date || ""),
      category: String(frontmatter.category || "reviews"),
      tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
      image: String(frontmatter.image || ""),
      imageAlt: String(frontmatter.imageAlt || ""),
      author: String(frontmatter.author || "Alex"),
      published: Boolean(frontmatter.published),
      hasAffiliateLinks: Boolean(frontmatter.hasAffiliateLinks),
      affiliateProducts: Array.isArray(frontmatter.affiliateProducts)
        ? frontmatter.affiliateProducts
        : [],
    },
    content,
    raw,
  };
}

export function createPostFile(slug: string, frontmatter: PostFrontmatter, content: string): void {
  const filename = `${slug}.mdx`;
  const filepath = join(POSTS_DIR, filename);

  if (existsSync(filepath)) {
    throw new Error(`Post "${slug}" already exists`);
  }

  const tagsStr = JSON.stringify(frontmatter.tags);
  const productsStr = JSON.stringify(frontmatter.affiliateProducts);

  const raw = `---
title: "${frontmatter.title}"
description: "${frontmatter.description}"
date: "${frontmatter.date}"
category: "${frontmatter.category}"
tags: ${tagsStr}
image: "${frontmatter.image}"
imageAlt: "${frontmatter.imageAlt}"
author: "${frontmatter.author}"
published: ${frontmatter.published}
hasAffiliateLinks: ${frontmatter.hasAffiliateLinks}
affiliateProducts: ${productsStr}
---

${content.trim()}
`;

  writeFileSync(filepath, raw, "utf-8");
}

export function updatePostFile(slug: string, frontmatter: PostFrontmatter, content: string): void {
  const filename = `${slug}.mdx`;
  const filepath = join(POSTS_DIR, filename);

  if (!existsSync(filepath)) {
    throw new Error(`Post "${slug}" not found`);
  }

  const tagsStr = JSON.stringify(frontmatter.tags);
  const productsStr = JSON.stringify(frontmatter.affiliateProducts);

  const raw = `---
title: "${frontmatter.title}"
description: "${frontmatter.description}"
date: "${frontmatter.date}"
category: "${frontmatter.category}"
tags: ${tagsStr}
image: "${frontmatter.image}"
imageAlt: "${frontmatter.imageAlt}"
author: "${frontmatter.author}"
published: ${frontmatter.published}
hasAffiliateLinks: ${frontmatter.hasAffiliateLinks}
affiliateProducts: ${productsStr}
---

${content.trim()}
`;

  writeFileSync(filepath, raw, "utf-8");
}

export function deletePostFile(slug: string): void {
  const filename = `${slug}.mdx`;
  const filepath = join(POSTS_DIR, filename);

  if (!existsSync(filepath)) {
    throw new Error(`Post "${slug}" not found`);
  }

  unlinkSync(filepath);
}
