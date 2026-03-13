import { defineConfig, defineCollection, s } from "velite";
import rehypePrettyCode from "rehype-pretty-code";

const posts = defineCollection({
  name: "Post",
  pattern: "posts/**/*.mdx",
  schema: s
    .object({
      title: s.string().max(120),
      slug: s.path(),
      description: s.string().max(300),
      date: s.isodate(),
      updated: s.isodate().optional(),
      published: s.boolean().default(true),
      category: s.enum([
        "reviews",
        "guides",
        "deals",
        "news",
        "comparisons",
      ]),
      tags: s.array(s.string()).default([]),
      image: s.string().optional(),
      imageAlt: s.string().optional(),
      author: s.string().default("Alex"),
      affiliateProducts: s.array(s.string()).default([]),
      toc: s.toc(),
      body: s.mdx(),
      metadata: s.metadata(),
    })
    .transform((data) => {
      const slug = data.slug.replace(/^posts\//, "");
      return {
      ...data,
      slug,
      permalink: `/blog/${slug}`,
      readingTime: Math.ceil(
        (data.metadata?.readingTime ?? 1)
      ),
      hasAffiliateLinks: data.affiliateProducts.length > 0,
    };
    }),
});

export default defineConfig({
  root: "content",
  output: {
    data: ".velite",
    assets: "public/static",
    base: "/static/",
    name: "[name]-[hash:6].[ext]",
    clean: true,
  },
  collections: { posts },
  mdx: {
    rehypePlugins: [
      [
        rehypePrettyCode as any,
        {
          theme: {
            dark: "github-dark",
            light: "github-light",
          },
          keepBackground: false,
        },
      ],
    ],
  },
});
