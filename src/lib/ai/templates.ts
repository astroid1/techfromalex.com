import type { ContentType } from "@/lib/types";
import type { SystemBlock } from "./anthropic";

/** Product facts handed to the model — the ONLY source of specs/prices it may use. */
export interface ProductFact {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  price: number | null;
  rating: number | null;
  description: string | null;
  pros: string[];
  cons: string[];
  specs: Record<string, string>;
}

/** A single-link affiliate program (e.g. make.com) the article may promote via a ::promo CTA. */
export interface ProgramFact {
  id: string;
  name: string;
  headline: string;
  blurb: string | null;
  ctaLabel: string;
}

const faqSchema = {
  type: "array",
  items: {
    type: "object",
    additionalProperties: false,
    required: ["q", "a"],
    properties: { q: { type: "string" }, a: { type: "string" } },
  },
};

function envelope(structured: object): object {
  return {
    type: "object",
    additionalProperties: false,
    required: ["title", "slug", "seoTitle", "metaDescription", "heroAlt", "bodyMarkdown", "structured", "faq"],
    properties: {
      title: { type: "string" },
      slug: { type: "string" },
      seoTitle: { type: "string" },
      metaDescription: { type: "string" },
      heroAlt: { type: "string" },
      bodyMarkdown: { type: "string" },
      faq: faqSchema,
      structured,
    },
  };
}

const TEMPLATES: Record<
  ContentType,
  { label: string; schema: object; instructions: string }
> = {
  review: {
    label: "single-product review",
    schema: envelope({
      type: "object",
      additionalProperties: false,
      required: ["productId", "verdictScore", "verdictSummary", "whoItsFor", "whoItsNot"],
      properties: {
        productId: { type: "string" },
        verdictScore: { type: "number" },
        verdictSummary: { type: "string" },
        whoItsFor: { type: "array", items: { type: "string" } },
        whoItsNot: { type: "array", items: { type: "string" } },
      },
    }),
    instructions:
      "Write a 1,200–1,800 word single-product review. structured.productId MUST be the provided product's id. " +
      "verdictScore is 0–10 (one decimal). Open with a short hook, then ## sections (Design, Performance, etc.). " +
      "Place one ::product-card{id=\"...\"} near the top and one ::buy-button{id=\"...\"} near the end. " +
      "Include a :::pros-cons block with several real items under BOTH pros and cons.",
  },
  comparison: {
    label: "head-to-head comparison",
    schema: envelope({
      type: "object",
      additionalProperties: false,
      required: ["entrants", "overallWinnerId", "verdict"],
      properties: {
        entrants: { type: "array", items: { type: "string" } },
        overallWinnerId: { type: "string" },
        verdict: { type: "string" },
      },
    }),
    instructions:
      "Write a 1,000–1,500 word head-to-head comparison. structured.entrants are the provided product ids (2+); " +
      "overallWinnerId must be one of them. Include a :::comparison{ids=\"id1,id2\"} block. Use ## sections per axis " +
      "(price, performance, etc.) naming the winner of each.",
  },
  roundup: {
    label: "'best X' roundup / buying guide",
    schema: envelope({
      type: "object",
      additionalProperties: false,
      required: ["criteria", "howWeChose", "picks"],
      properties: {
        criteria: { type: "array", items: { type: "string" } },
        howWeChose: { type: "string" },
        picks: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["rank", "productId", "award", "bestFor", "rationale"],
            properties: {
              rank: { type: "integer" },
              productId: { type: "string" },
              award: { type: "string" },
              bestFor: { type: "string" },
              rationale: { type: "string" },
            },
          },
        },
      },
    }),
    instructions:
      "Write a 1,500–2,500 word 'best X' buying guide. structured.picks ranks the provided products (rank starts at 1); " +
      "each productId MUST be a provided id; award is e.g. 'Best Overall', 'Best Budget'. For each pick write a ## section " +
      "with a ::product-card{id=\"...\"} and a short verdict. Add a ## How We Chose section.",
  },
  news_deal: {
    label: "news / deal post",
    schema: envelope({
      type: "object",
      additionalProperties: false,
      required: ["summary", "keyPoints", "isDeal"],
      properties: {
        summary: { type: "string" },
        keyPoints: { type: "array", items: { type: "string" } },
        isDeal: { type: "boolean" },
        dealProductId: { type: ["string", "null"] },
      },
    }),
    instructions:
      "Write a 400–700 word news or deal post. Lead with the news. If a product is provided and it's a deal, set isDeal=true " +
      "and dealProductId to that id, and include a ::buy-button{id=\"...\"}. Do NOT state a specific price unless one is given " +
      "in the brief. Keep it tight and factual.",
  },
  howto: {
    label: "how-to / walkthrough guide",
    schema: envelope({
      type: "object",
      additionalProperties: false,
      required: ["steps"],
      properties: {
        intro: { type: "string" },
        difficulty: { type: "string" },
        timeRequired: { type: "string" },
        tools: { type: "array", items: { type: "string" } },
        steps: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["name", "detail"],
            properties: {
              name: { type: "string" },
              detail: { type: "string" },
            },
          },
        },
      },
    }),
    instructions:
      "Write a clear, practical step-by-step how-to / walkthrough (1,000–1,800 words). Open with a short intro on what " +
      "the reader will accomplish and who it is for. Write each step as its own ## section with an action-oriented heading, " +
      "explaining exactly what to do and why. Mirror every step in structured.steps (name = the step heading, detail = a " +
      "one or two sentence summary) so the site can show a steps overview and How-To rich results. Set difficulty and " +
      "timeRequired when you can estimate them, and list any required tools, gear, or accounts in structured.tools. If a " +
      "specific product from the PRODUCTS list genuinely helps, reference it with the product directives (never invent one).",
  },
};

export function getTemplate(type: ContentType) {
  return TEMPLATES[type];
}

const FORMAT_SPEC = `OUTPUT FORMAT. bodyMarkdown is GitHub-flavored markdown. Embed these directives EXACTLY, each on its own line:
- ::product-card{id="PRODUCT_ID"}        a full product card
- ::buy-button{id="PRODUCT_ID"}          a buy CTA
- :::callout{type="info" title="..."}\\n...text...\\n:::    a callout (types: info, tip, warning, danger)
- :::pros-cons\\npros:\\n- point\\ncons:\\n- point\\n:::      a pros/cons box
- :::comparison{ids="id1,id2"}\\n:::      a comparison table
- :product[visible label]{id="PRODUCT_ID"}   an inline product link

RULES:
- Use ONLY product ids from the PRODUCTS list below. Never invent an id, price, spec, rating, or retailer URL.
- Never write a raw <a> tag or an http(s) link to a retailer. The site builds monetized links from the ids.
- If a SOURCE TRANSCRIPT is provided it may carry the original video creator's own sponsor reads, discount/promo codes, "link in the description/below", subscribe/like/Patreon/merch asks, and their own affiliate links. NEVER reproduce any of these and never restate a promo or discount code. Monetize ONLY through the directives above using ids from the PRODUCTS list. Any product, brand, app, or service praised in the source that is NOT in the PRODUCTS list is likely the creator's own sponsor or affiliate: do not recommend it, link it, or build a section around it; mention it only neutrally if it is genuinely part of the topic.
- Use the primary keyword naturally in the title, metaDescription, and first paragraph. One # H1 is the title; sections are ##.
- metaDescription: 120–160 characters. seoTitle: <= 60 characters.
- Write in first person, direct and opinionated, evidence-led, no hype or filler. You have actually used the gear.
- Write the way a real person talks. NEVER use em dashes or en dashes as punctuation; use commas, periods, parentheses, or short separate sentences instead. Avoid AI-tell clichés and filler.
- FAQ: put 4 to 6 genuinely useful question/answer pairs ONLY in the structured "faq" array. Do NOT add a FAQ heading or section in bodyMarkdown; the site renders the FAQ from that array.
- pros-cons: always include several real items under BOTH pros and cons, with a blank line before the "cons:" label.
- A site-wide FTC affiliate disclosure is rendered automatically, so do not write your own.`;

export function buildSystem(
  type: ContentType,
  products: ProductFact[],
  programs: ProgramFact[] = [],
): SystemBlock[] {
  const tmpl = TEMPLATES[type];
  const sorted = [...products].sort((a, b) => a.id.localeCompare(b.id));
  const blocks: SystemBlock[] = [
    {
      type: "text",
      text:
        "You are the staff writer for Tech From Alex, a tech review/affiliate blog by solo founder Alex Hirt. " +
        "You write honest, hands-on reviews and buying guides that help people buy the right gear.\n\n" +
        FORMAT_SPEC,
      cache_control: { type: "ephemeral" },
    },
    {
      type: "text",
      text: `TEMPLATE — ${tmpl.label}.\n${tmpl.instructions}`,
      cache_control: { type: "ephemeral" },
    },
    {
      type: "text",
      text: `PRODUCTS (the only facts you may use):\n${JSON.stringify(sorted, null, 2)}`,
      cache_control: { type: "ephemeral" },
    },
  ];
  if (programs.length) {
    blocks.push({
      type: "text",
      text:
        "PROGRAMS — single-link affiliate SERVICES (e.g. an app or platform) that ARE OURS to promote. They are an " +
        "EXCEPTION to the sponsor rule above: treat them like the PRODUCTS list, not as the creator's sponsors. For EACH " +
        "program below, write a short, genuine section about the service (drawing on the source where relevant) and place " +
        'its call-to-action on its own line as ::promo{id="..."} using the program\'s EXACT id from the list below — never ' +
        "a placeholder or a guessed id. The site renders the tagged signup link + styled CTA from that id, so do NOT write " +
        "your own link, button text, or signup URL:\n" +
        JSON.stringify(programs, null, 2),
    });
  }
  return blocks;
}

export function buildUserText(
  title: string,
  keyword: string,
  brief: string,
  productIds: string[],
  instructions = "",
  source = "",
): string {
  return [
    `Title / topic: ${title}`,
    keyword ? `Primary keyword: ${keyword}` : "",
    brief ? `Brief / angle: ${brief}` : "",
    productIds.length ? `Products to feature (ids): ${productIds.join(", ")}` : "No products selected.",
    instructions ? `\nAdditional instructions (follow these closely):\n${instructions}` : "",
    source
      ? "\nSOURCE TRANSCRIPT (this article is based on the following video transcript — reorganize and rewrite it as a proper article in your own words and our voice, expand and structure it, and do NOT state anything the transcript does not support; never copy it verbatim). Treat it as RAW MATERIAL ABOUT THE TOPIC ONLY: ignore and never echo the creator's own calls-to-action, sponsorships, promo/discount codes, brand plugs, or any \"link in the description / below\" references — those belong to their channel, not this article:\n" +
        source
      : "",
    "",
    "Write the piece now, filling the JSON schema exactly.",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Strip AI-tell punctuation from generated prose so it reads like a person wrote it.
 * Em dashes and spaced en dashes become commas; numeric ranges (10–20) are left alone.
 * Belt-and-suspenders alongside the prompt rule, since model compliance is never 100%.
 */
export function naturalize(s: string): string {
  if (!s) return s;
  return s
    .replace(/[ \t]*—[ \t]*/g, ", ") // em dash -> comma
    .replace(/[ \t]+–[ \t]+/g, ", ") // spaced en dash -> comma (ranges like 10–20 stay)
    .replace(/,[ \t]*,/g, ","); // collapse accidental double commas
}

/** Apply naturalize() to every string inside an arbitrary structured value. */
export function naturalizeDeep<T>(value: T): T {
  if (typeof value === "string") return naturalize(value) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => naturalizeDeep(v)) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = naturalizeDeep(v);
    return out as T;
  }
  return value;
}

/**
 * Belt-and-suspenders scrub of GENERATED prose: strip any creator-monetization residue the
 * model may have echoed from a source transcript — bare http(s) URLs (the body must carry
 * none per FORMAT_SPEC), promo/discount-code phrases, and "link in the description/below".
 * Directive lines (starting with :: or :::) are SKIPPED so a product/program id or name is
 * never clobbered; our links are rebuilt from ids, so this can never drop a tagged link.
 */
const OUTPUT_CRUFT: RegExp[] = [
  /https?:\/\/\S+/gi,
  /\b(?:promo|coupon|discount)\s+code\b[^.,;!?\n]*/gi,
  /\b[A-Z0-9]{4,15}\b[^.,;!?\n]{0,40}\b(?:at checkout|% off|percent off)\b[^.,;!?\n]*/g,
  /\blinks?\b[^.,;!?\n]{0,25}\b(?:in\s+(?:the\s+)?(?:description|bio)|pinned\s+comment)\b[^.,;!?\n]*/gi,
  /\b(?:in\s+the\s+description|description\s+below|pinned\s+comment)\b[^.,;!?\n]*/gi,
];

/** Inline product link directive, e.g. :product[label]{id="x"} — kept verbatim by scrubOutput. */
const INLINE_PRODUCT = /:product\[[^\]]*\]\{[^}]*\}/g;
const scrubProse = (s: string): string => OUTPUT_CRUFT.reduce((acc, re) => acc.replace(re, " "), s);

export function scrubOutput(s: string): string {
  if (!s) return s;
  return s
    .split("\n")
    .map((line) => {
      if (/^\s*:::?/.test(line)) return line; // leaf/container directive line — leave intact
      // Scrub only the prose BETWEEN inline :product[...]{id} directives, keeping each
      // directive verbatim so an inline affiliate id can never be destroyed.
      let out = "";
      let last = 0;
      for (const m of line.matchAll(INLINE_PRODUCT)) {
        out += scrubProse(line.slice(last, m.index)) + m[0];
        last = (m.index ?? 0) + m[0].length;
      }
      return out + scrubProse(line.slice(last));
    })
    .join("\n")
    .replace(/[ \t]+([.,;!?])/g, "$1")
    .replace(/[ \t]{2,}/g, " ");
}

/** Full clean of one generated string: scrub creator-monetization residue, then naturalize. */
export function cleanGenerated(s: string): string {
  return naturalize(scrubOutput(s));
}

/** cleanGenerated applied deeply over an arbitrary structured value. */
export function cleanGeneratedDeep<T>(value: T): T {
  if (typeof value === "string") return cleanGenerated(value) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => cleanGeneratedDeep(v)) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = cleanGeneratedDeep(v);
    return out as T;
  }
  return value;
}
