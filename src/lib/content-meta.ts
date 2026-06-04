import type { ContentType } from "./types";

/** Content types offered in the create flows, with their human labels. */
export const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: "review", label: "Single-product Review" },
  { value: "comparison", label: "Head-to-head Comparison" },
  { value: "roundup", label: "'Best X' Roundup / Guide" },
  { value: "howto", label: "How-to / Walkthrough Guide" },
  { value: "news_deal", label: "News & Deal post" },
];

/** Default category per content type (still changeable in the form). */
export const TYPE_CATEGORY: Record<ContentType, string> = {
  review: "reviews",
  comparison: "comparisons",
  roundup: "guides",
  howto: "guides",
  news_deal: "deals",
};
