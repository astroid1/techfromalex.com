import { generateStructured } from "./anthropic";

/**
 * Use Claude to condense a noisy e-commerce product title into a clean, concise
 * site title (brand + model + key descriptor). Cheap/fast — runs at low effort.
 */
export async function shortenTitle(env: Env, name: string): Promise<string> {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured.");
  const clean = (name || "").trim();
  if (!clean) throw new Error("No title to shorten.");

  const { data } = await generateStructured<{ title: string }>({
    apiKey,
    system: [
      {
        type: "text",
        text:
          "You clean up e-commerce product titles into concise, human-readable site titles. " +
          "Return just the brand + model + key descriptor (e.g. 'Logitech MX Master 3S Wireless Mouse'). " +
          "Drop marketing phrases, compatibility lists, SEO keyword stuffing, and pack/color qualifiers. " +
          "Keep it 3-8 words in Title Case, with no trailing punctuation and no em or en dashes.",
      },
    ],
    userText: `Clean up this product title:\n\n${clean}`,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["title"],
      properties: { title: { type: "string" } },
    },
    effort: "low",
  });
  return (data.title || clean)
    .replace(/\s*[—–]\s*/g, " ") // drop em/en dashes (keep hyphens in model names)
    .replace(/\s{2,}/g, " ")
    .trim();
}
