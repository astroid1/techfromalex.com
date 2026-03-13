import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = generatePageMetadata({
  title: "About",
  description:
    "Learn more about Tech From Alex - a tech blog covering honest reviews, buying guides, and the best deals to help you make smarter purchasing decisions.",
  url: "/about",
});

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>About Tech From Alex</h1>

        <p>
          Hey, I'm <strong>Alex</strong> -- a tech enthusiast who believes you
          shouldn't need a degree in engineering to find the right gadget. I
          started Tech From Alex to cut through the noise and give you honest,
          practical advice on the tech that actually matters.
        </p>

        <h2>What You'll Find Here</h2>

        <p>
          This blog covers three main areas to help you make smarter buying
          decisions:
        </p>

        <ul>
          <li>
            <strong>Tech Reviews</strong> -- Hands-on, real-world reviews of
            laptops, headphones, tablets, peripherals, and more. No spec-sheet
            regurgitation -- just honest opinions based on actual use.
          </li>
          <li>
            <strong>Buying Guides</strong> -- Whether you're looking for the
            best budget laptop or trying to decide between two headphones, these
            guides break down what matters and what doesn't.
          </li>
          <li>
            <strong>Deals</strong> -- I keep an eye on the best tech deals so
            you don't have to. When something good drops in price, you'll find it
            here.
          </li>
        </ul>

        <h2>My Approach</h2>

        <p>
          Every product I review is evaluated on its own merits. I focus on
          real-world performance, build quality, value for money, and who the
          product is actually for -- not everyone needs the most expensive option.
        </p>

        <p>
          I write for people who want to spend their money wisely. That means
          honest assessments, clear pros and cons, and straightforward
          recommendations you can trust.
        </p>

        <h2>Affiliate Disclosure</h2>

        <p>
          Some of the links on this site are affiliate links, which means I may
          earn a small commission if you make a purchase through them --{" "}
          <strong>at no extra cost to you</strong>. This helps support the blog
          and allows me to keep creating content.
        </p>

        <p>
          Affiliate relationships never influence my reviews or recommendations.
          I only recommend products I genuinely believe in. If something isn't
          worth buying, I'll tell you -- regardless of whether there's an
          affiliate link attached.
        </p>

        <h2>Get in Touch</h2>

        <p>
          Have a question, suggestion, or just want to say hi? Feel free to reach
          out on{" "}
          <a
            href="https://twitter.com/techfromalex"
            target="_blank"
            rel="noopener noreferrer"
          >
            Twitter
          </a>{" "}
          or{" "}
          <a
            href="https://github.com/techfromalex"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          . I read every message and try to respond when I can.
        </p>
      </article>
    </div>
  );
}
