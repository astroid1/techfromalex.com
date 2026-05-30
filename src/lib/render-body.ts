import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import remarkRehype from "remark-rehype";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import { toString as mdToString } from "mdast-util-to-string";
import type { Root, RootContent, Heading as MdHeading } from "mdast";
import { slugify } from "./format";
import type { Product } from "./types";

export type EmbedName =
  | "product-card"
  | "buy-button"
  | "callout"
  | "pros-cons"
  | "comparison";

export type Segment =
  | { kind: "html"; html: string }
  | { kind: "embed"; name: EmbedName; props: Record<string, unknown> };

export interface TocHeading {
  depth: number;
  text: string;
  id: string;
}

export interface RenderedBody {
  segments: Segment[];
  toc: TocHeading[];
}

const EMBED_NAMES = new Set<EmbedName>([
  "product-card",
  "buy-button",
  "callout",
  "pros-cons",
  "comparison",
]);

// Sanitize schema: body is untrusted DB content. Allow the structural elements
// our prose + GFM tables use, plus rel/target/class/id on links & headings.
const schema = {
  ...defaultSchema,
  // Don't prefix heading ids with "user-content-" so in-page TOC anchors resolve.
  clobberPrefix: "",
  attributes: {
    ...defaultSchema.attributes,
    a: [...(defaultSchema.attributes?.a ?? []), "rel", "target", "className"],
    "*": [...(defaultSchema.attributes?.["*"] ?? []), "className", "id"],
  },
};

const htmlProcessor = unified()
  .use(remarkRehype)
  .use(rehypeSanitize, schema)
  .use(rehypeStringify);

async function nodesToHtml(nodes: RootContent[]): Promise<string> {
  if (nodes.length === 0) return "";
  const root: Root = { type: "root", children: nodes };
  const hast = await htmlProcessor.run(root);
  return htmlProcessor.stringify(hast) as string;
}

type DirectiveNode = RootContent & {
  type: "textDirective" | "leafDirective" | "containerDirective";
  name: string;
  attributes?: Record<string, string | null>;
  children: RootContent[];
};

function isEmbedDirective(node: RootContent): node is DirectiveNode {
  return (
    (node.type === "leafDirective" || node.type === "containerDirective") &&
    EMBED_NAMES.has((node as DirectiveNode).name as EmbedName)
  );
}

/** Parse the `pros:` / `cons:` lists inside a :::pros-cons container. */
function parseProsCons(node: DirectiveNode): { pros: string[]; cons: string[] } {
  const pros: string[] = [];
  const cons: string[] = [];
  let mode: "pros" | "cons" | null = null;
  for (const child of node.children) {
    if (child.type === "paragraph") {
      const t = mdToString(child).toLowerCase();
      if (t.includes("pro")) mode = "pros";
      else if (t.includes("con")) mode = "cons";
    } else if (child.type === "list") {
      for (const item of child.children) {
        const text = mdToString(item).replace(/^(pros?|cons?):\s*/i, "").trim();
        if (!text) continue;
        if (mode === "cons") cons.push(text);
        else pros.push(text);
      }
    }
  }
  return { pros, cons };
}

export async function renderBody(
  md: string,
  products: Map<string, Product>,
): Promise<RenderedBody> {
  const parser = unified().use(remarkParse).use(remarkGfm).use(remarkDirective);
  const tree = parser.parse(md) as Root;

  const toc: TocHeading[] = [];

  // Pass 1: heading ids + inline :product[...] -> affiliate link (or plain text).
  visit(tree, (node, index, parent) => {
    if (node.type === "heading") {
      const h = node as MdHeading;
      const text = mdToString(h);
      const id = slugify(text);
      h.data = h.data || {};
      (h.data as { hProperties?: Record<string, unknown> }).hProperties = {
        ...((h.data as { hProperties?: Record<string, unknown> }).hProperties ?? {}),
        id,
      };
      if (h.depth === 2 || h.depth === 3) toc.push({ depth: h.depth, text, id });
      return;
    }
    if (
      node.type === "textDirective" &&
      (node as DirectiveNode).name === "product" &&
      parent &&
      typeof index === "number"
    ) {
      const dir = node as DirectiveNode;
      const id = dir.attributes?.id ?? "";
      const product = products.get(id);
      const labelChildren = dir.children.length ? dir.children : [];
      if (product?.buyUrl) {
        const link: RootContent = {
          type: "link",
          url: product.buyUrl,
          title: null,
          data: {
            hProperties: {
              rel: "nofollow sponsored",
              target: "_blank",
              className: "aff-link",
            },
          },
          children: labelChildren as never,
        } as RootContent;
        parent.children.splice(index, 1, link);
      } else {
        // No monetizable link — keep the label text inline, never a dead/raw link.
        parent.children.splice(index, 1, ...(labelChildren as RootContent[]));
      }
    }
  });

  // Pass 2: split top-level blocks into html segments + embed segments.
  const segments: Segment[] = [];
  let group: RootContent[] = [];
  const flush = async () => {
    if (group.length) {
      const html = await nodesToHtml(group);
      if (html.trim()) segments.push({ kind: "html", html });
      group = [];
    }
  };

  for (const node of tree.children) {
    if (isEmbedDirective(node)) {
      await flush();
      const dir = node;
      const name = dir.name as EmbedName;
      if (name === "product-card" || name === "buy-button") {
        segments.push({ kind: "embed", name, props: { id: dir.attributes?.id ?? "" } });
      } else if (name === "comparison") {
        const ids = (dir.attributes?.ids ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        segments.push({ kind: "embed", name, props: { ids } });
      } else if (name === "callout") {
        const bodyHtml = await nodesToHtml(dir.children);
        segments.push({
          kind: "embed",
          name,
          props: {
            type: dir.attributes?.type ?? "info",
            title: dir.attributes?.title ?? null,
            bodyHtml,
          },
        });
      } else if (name === "pros-cons") {
        segments.push({ kind: "embed", name, props: parseProsCons(dir) });
      }
    } else {
      group.push(node);
    }
  }
  await flush();

  return { segments, toc };
}
