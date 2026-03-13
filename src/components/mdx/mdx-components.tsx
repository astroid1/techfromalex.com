import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Callout } from "./Callout";
import { ProsCons } from "./ProsCons";
import { YouTubeEmbed } from "./YouTubeEmbed";
import {
  ProductCard,
  ComparisonTable,
  BuyButton,
  InlineLink,
} from "@/components/affiliate";

function isExternalLink(href: string | undefined): boolean {
  return !!href && href.startsWith("http");
}

export const mdxComponents: MDXComponents = {
  // Headings
  h1: ({ className, ...props }) => (
    <h1
      className={cn(
        "mt-10 scroll-m-20 text-3xl font-bold tracking-tight text-prose-headings",
        className
      )}
      {...props}
    />
  ),
  h2: ({ className, ...props }) => (
    <h2
      className={cn(
        "mt-10 scroll-m-20 border-b border-border pb-2 text-2xl font-semibold tracking-tight text-prose-headings first:mt-0",
        className
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }) => (
    <h3
      className={cn(
        "mt-8 scroll-m-20 text-xl font-semibold tracking-tight text-prose-headings",
        className
      )}
      {...props}
    />
  ),
  h4: ({ className, ...props }) => (
    <h4
      className={cn(
        "mt-8 scroll-m-20 text-lg font-semibold tracking-tight text-prose-headings",
        className
      )}
      {...props}
    />
  ),
  h5: ({ className, ...props }) => (
    <h5
      className={cn(
        "mt-6 scroll-m-20 text-base font-semibold tracking-tight text-prose-headings",
        className
      )}
      {...props}
    />
  ),
  h6: ({ className, ...props }) => (
    <h6
      className={cn(
        "mt-6 scroll-m-20 text-sm font-semibold tracking-tight text-prose-headings",
        className
      )}
      {...props}
    />
  ),

  // Inline elements
  a: ({ className, href, children, ...props }) => {
    const external = isExternalLink(href);

    if (external) {
      return (
        <a
          className={cn(
            "text-prose-links underline decoration-prose-links/30 underline-offset-4 transition-colors hover:decoration-prose-links",
            className
          )}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {children}
        </a>
      );
    }

    return (
      <Link
        className={cn(
          "text-prose-links underline decoration-prose-links/30 underline-offset-4 transition-colors hover:decoration-prose-links",
          className
        )}
        href={href || "#"}
        {...props}
      >
        {children}
      </Link>
    );
  },

  // Code blocks
  pre: ({ className, ...props }) => (
    <pre
      className={cn(
        "mb-4 mt-6 overflow-x-auto rounded-lg border border-border bg-code-bg p-4",
        className
      )}
      {...props}
    />
  ),
  code: ({ className, ...props }) => {
    // Inline code (not inside pre)
    const isInline = !className?.includes("language-");
    if (isInline) {
      return (
        <code
          className={cn(
            "relative rounded bg-code-bg px-[0.3rem] py-[0.2rem] font-mono text-sm text-foreground",
            className
          )}
          {...props}
        />
      );
    }
    return (
      <code className={cn("font-mono text-sm", className)} {...props} />
    );
  },

  // Media
  img: ({ className, alt, src, ...props }) => (
    <img
      className={cn("rounded-lg border border-border", className)}
      alt={alt}
      src={src}
      loading="lazy"
      {...props}
    />
  ),

  // Block elements
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn(
        "mt-6 border-l-4 border-border pl-4 italic text-muted [&>p]:m-0",
        className
      )}
      {...props}
    />
  ),

  // Tables
  table: ({ className, ...props }) => (
    <div className="my-6 w-full overflow-x-auto">
      <table
        className={cn("w-full border-collapse text-sm", className)}
        {...props}
      />
    </div>
  ),
  thead: (props) => <thead className="border-b border-border" {...props} />,
  tbody: (props) => <tbody {...props} />,
  tr: ({ className, ...props }) => (
    <tr
      className={cn("border-b border-border", className)}
      {...props}
    />
  ),
  th: ({ className, ...props }) => (
    <th
      className={cn(
        "px-4 py-3 text-left font-semibold text-foreground",
        className
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }) => (
    <td
      className={cn("px-4 py-3 text-foreground", className)}
      {...props}
    />
  ),

  // Custom components
  Callout,
  ProsCons,
  YouTubeEmbed,
  ProductCard,
  ComparisonTable,
  BuyButton,
  InlineLink,
};
