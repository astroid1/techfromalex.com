import { ulid, nowIso } from "@/lib/ids";
import { slugify } from "@/lib/format";
import { storeRemoteImage } from "@/lib/media";

const DEFAULT_ACTOR = "junglee~amazon-crawler";
const ASIN_RE = /^[A-Z0-9]{10}$/;

export interface ImportItem {
  name: string;
  brand: string | null;
  category: string | null;
  priceCents: number | null;
  currency: string;
  imageUrl: string | null;
  description: string | null;
  specs: Record<string, string>;
  rating: number | null;
  asin: string | null;
  url: string | null;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  $: "USD", US$: "USD", "£": "GBP", "€": "EUR", C$: "CAD", CA$: "CAD", A$: "AUD", "₹": "INR", "¥": "JPY",
};
function toCurrencyCode(c: unknown): string {
  const t = String(c ?? "").trim();
  if (/^[A-Z]{3}$/.test(t)) return t;
  return CURRENCY_SYMBOLS[t] ?? "USD";
}

function num(v: unknown): number | null {
  if (typeof v === "number" && isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[^0-9.]/g, ""));
    return isFinite(n) ? n : null;
  }
  return null;
}

/** Strip raw http(s) URLs out of free text so no un-affiliated link is ever displayed. */
function stripUrls(s: string): string {
  return s.replace(/https?:\/\/\S+/gi, "").replace(/[ \t]{2,}/g, " ").trim();
}

function extractAsin(raw: any): string | null {
  const a = raw?.asin ?? raw?.ASIN;
  if (typeof a === "string" && ASIN_RE.test(a.trim().toUpperCase())) return a.trim().toUpperCase();
  const url = typeof raw?.url === "string" ? raw.url : "";
  const m = url.match(/\/(?:dp|gp\/product|product)\/([A-Z0-9]{10})/i);
  return m ? m[1].toUpperCase() : null;
}

/** Canonical, tracking-free Amazon product URL — keeps OUR affiliate tag the only one applied. */
export function canonicalAmazonUrl(
  asin: string | null,
  fallbackUrl: string | null,
  domain = "www.amazon.com",
): string | null {
  if (asin) return `https://${domain}/dp/${asin}`;
  if (!fallbackUrl) return null;
  try {
    const u = new URL(fallbackUrl);
    return `${u.origin}${u.pathname}`; // drop query/tracking (ref, tag, etc.)
  } catch {
    return null;
  }
}

function normalizeSpecs(raw: any): Record<string, string> {
  const out: Record<string, string> = {};
  const add = (k: unknown, v: unknown) => {
    const key = String(k ?? "").trim();
    const val = String(v ?? "").trim();
    if (key && val && Object.keys(out).length < 15) out[key.slice(0, 60)] = val.slice(0, 200);
  };
  for (const src of [raw?.attributes, raw?.specifications, raw?.productOverview, raw?.productDetails]) {
    if (!src) continue;
    if (Array.isArray(src)) for (const e of src) add(e?.name ?? e?.key ?? e?.label, e?.value ?? e?.val);
    else if (typeof src === "object") for (const [k, v] of Object.entries(src)) add(k, v);
  }
  return out;
}

function firstImage(raw: any): string | null {
  // Prefer the full-res gallery (junglee returns highResolutionImages) over the small thumbnail.
  for (const arr of [raw?.highResolutionImages, raw?.galleryThumbnails]) {
    if (Array.isArray(arr) && typeof arr[0] === "string") return arr[0];
  }
  const i = raw?.images?.mainImage ?? raw?.mainImage ?? raw?.image ?? raw?.thumbnailImage ?? raw?.thumbnail;
  if (typeof i === "string") return i;
  if (Array.isArray(raw?.images) && raw.images.length) {
    const f = raw.images[0];
    if (typeof f === "string") return f;
    if (f && typeof f === "object") return f.url ?? f.link ?? f.large ?? null;
  }
  return null;
}

/** Category from the breadcrumb trail. junglee returns `breadCrumbs` as a ' > '-joined string. */
function parseCategory(raw: any): string | null {
  const bc = raw?.breadCrumbs ?? raw?.breadcrumbs ?? raw?.categories;
  if (typeof bc === "string" && bc.trim()) {
    const parts = bc.split(/\s*[>›»]\s*/).map((s: string) => s.trim()).filter(Boolean);
    return parts.length ? parts[parts.length - 1] : null;
  }
  if (Array.isArray(bc) && bc.length) {
    const last = bc[bc.length - 1];
    return String(last?.name ?? last ?? "").trim() || null;
  }
  return raw?.category ? String(raw.category).trim() || null : null;
}

/** Condense a long, keyword-stuffed Amazon title into a clean site title (brand + model + key descriptor). */
export function condenseTitle(full: string): string {
  let t = (full || "").replace(/\s+/g, " ").trim();
  if (!t) return t;
  // Cut at the first strong separator: an en/em dash, pipe, comma, or opening bracket.
  const sep = t.match(/\s[–—|]\s|[,(\[]/);
  if (sep && sep.index != null && sep.index > 0) t = t.slice(0, sep.index);
  // Drop a trailing marketing clause introduced by "for" / "with" / "w/" (if enough title precedes it).
  const clause = t.match(/\s(?:for|with|w\/)\s/i);
  if (clause && clause.index != null && clause.index >= 12) t = t.slice(0, clause.index);
  t = t.trim().replace(/[\s,\-–—|]+$/, "");
  // Cap at a word boundary near 64 chars.
  if (t.length > 64) {
    const cut = t.slice(0, 64);
    const lastSpace = cut.lastIndexOf(" ");
    t = (lastSpace > 24 ? cut.slice(0, lastSpace) : cut).trim();
  }
  return t || full.slice(0, 64).trim();
}

/** Map a raw Apify dataset item to our compact ImportItem (defensive — field names vary by actor). */
export function mapApifyItem(raw: any): ImportItem {
  const name = condenseTitle(String(raw?.title ?? raw?.name ?? ""));
  const priceValue =
    num(raw?.price?.value) ?? num(raw?.price) ?? num(raw?.priceValue) ?? num(raw?.price?.amount);
  const features: string[] = Array.isArray(raw?.features)
    ? raw.features
    : Array.isArray(raw?.featureBullets)
      ? raw.featureBullets
      : Array.isArray(raw?.aboutThisItem)
        ? raw.aboutThisItem
        : [];
  let description = String(raw?.description ?? "").trim();
  if (!description && features.length) description = features.join("\n");
  description = stripUrls(description).slice(0, 1500);
  const rating = num(raw?.stars) ?? num(raw?.rating) ?? num(raw?.averageRating);
  const asin = extractAsin(raw);
  const brandRaw = raw?.brand ?? raw?.manufacturer;
  const category = parseCategory(raw);

  const item: ImportItem = {
    name,
    brand: brandRaw ? String(brandRaw).trim() : null,
    category,
    priceCents: priceValue != null ? Math.round(priceValue * 100) : null,
    currency: toCurrencyCode(raw?.price?.currency ?? raw?.currency ?? raw?.price?.currencyCode),
    imageUrl: firstImage(raw),
    description: description || null,
    specs: normalizeSpecs(raw),
    rating: rating != null ? Math.max(0, Math.min(5, rating)) : null,
    asin,
    url: canonicalAmazonUrl(asin, typeof raw?.url === "string" ? raw.url : null),
  };
  if (!item.name || item.priceCents == null) {
    // Surface the actual shape so mapApifyItem can be tuned after the first live run.
    console.log("[apify] item missing name/price; raw keys:", Object.keys(raw ?? {}).join(","));
  }
  return item;
}

interface ScrapeOpts {
  urls: string[];
  maxResults?: number;
  country?: string;
}

/** Run the Amazon scraper actor synchronously and return the raw dataset items. */
export async function runAmazonScrape(env: Env, opts: ScrapeOpts): Promise<any[]> {
  const token = env.APIFY_TOKEN;
  if (!token) throw new Error("APIFY_TOKEN is not configured. Run: wrangler secret put APIFY_TOKEN");
  if (!opts.urls.length) throw new Error("Enter an Amazon product URL, ASIN, or search/category URL.");
  const actor = env.APIFY_AMAZON_ACTOR || DEFAULT_ACTOR;
  const max = Math.max(1, Math.min(25, opts.maxResults ?? 10));
  const input = {
    categoryOrProductUrls: opts.urls.map((url) => ({ url })),
    maxItemsPerStartUrl: max,
    maxResultsPerStartUrl: max,
    maxResults: max,
    country: opts.country || "US",
    scrapeProductDetails: true,
    includeDetailedData: true,
  };

  let res: Response;
  try {
    res = await fetch(`https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?clean=true`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify(input),
    });
  } catch (e) {
    throw new Error(`Apify request failed: ${(e as Error).message}`);
  }
  if (res.status === 408) {
    throw new Error("Apify timed out — try a single product or fewer results.");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Apify API ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = (await res.json().catch(() => [])) as unknown;
  return Array.isArray(data) ? data : [];
}

/**
 * Create a product from an imported item. Attaches a PRIMARY Amazon affiliate link
 * only when a valid profile is given, using a canonical /dp/<ASIN> base_url so the
 * profile's tag (applied at render by buildAffiliateUrl) is the only affiliate tag.
 */
export async function createImportedProduct(
  env: Env,
  db: D1Database,
  item: ImportItem,
  profileId: string | null,
): Promise<string> {
  let id = slugify(item.name) || ulid().slice(-8).toLowerCase();
  const exists = await db.prepare("SELECT 1 FROM products WHERE id = ?").bind(id).first();
  if (exists) id = `${id}-${ulid().slice(-4).toLowerCase()}`;

  const imageUrl = await storeRemoteImage(env, item.imageUrl, item.name || "Product image");
  const now = nowIso();

  await db
    .prepare(
      `INSERT INTO products (id,name,brand,category,image_url,price_cents,currency,price_source,price_observed_at,rating,description,pros_json,cons_json,specs_json,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?, 'apify', ?,?,?, '[]','[]', ?,?,?)`,
    )
    .bind(
      id, item.name, item.brand, item.category, imageUrl, item.priceCents, item.currency,
      now, item.rating, item.description, JSON.stringify(item.specs), now, now,
    )
    .run();

  const baseUrl = canonicalAmazonUrl(item.asin, item.url);
  if (profileId && baseUrl) {
    await db
      .prepare(
        `INSERT INTO product_links (id,product_id,affiliate_profile_id,base_url,is_primary,created_at,updated_at) VALUES (?,?,?,?,1,?,?)`,
      )
      .bind(ulid(), id, profileId, baseUrl, now, now)
      .run();
  }
  return id;
}

/* ----------------------------------------------------------- YouTube transcripts */

const DEFAULT_YT_ACTOR = "pintostudio~youtube-transcript-scraper";

export interface TranscriptResult {
  videoUrl: string;
  title: string | null;
  transcript: string; // full plain text
  segments: number;
}

/** Normalize any YouTube URL / id / share link to a canonical watch URL. */
export function normalizeYoutubeUrl(input: string): string | null {
  const s = (input || "").trim();
  if (!s) return null;
  if (/^[\w-]{11}$/.test(s)) return `https://www.youtube.com/watch?v=${s}`; // bare video id
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "");
  if (host === "youtu.be") {
    const id = u.pathname.slice(1).split("/")[0];
    return id ? `https://www.youtube.com/watch?v=${id}` : null;
  }
  if (host === "youtube.com" || host.endsWith(".youtube.com")) {
    // covers www / m / music / gaming subdomains (dot-boundary, so not "evilyoutube.com")
    const v = u.searchParams.get("v");
    if (v) return `https://www.youtube.com/watch?v=${v}`;
    const m = u.pathname.match(/\/(?:shorts|embed|v|live)\/([\w-]{11})/);
    if (m) return `https://www.youtube.com/watch?v=${m[1]}`;
    return s;
  }
  return null; // not a YouTube URL
}

/**
 * Flatten the actor's transcript output into plain text. Defensive: the segments
 * may live under `data` / `transcript` / `captions` / `segments` as objects with a
 * `text` field, or the items may BE segments, or a single text blob.
 */
export function mapTranscript(videoUrl: string, items: any[]): TranscriptResult {
  const segs: string[] = [];
  let title: string | null = null;
  const pushSeg = (seg: any) => {
    if (typeof seg === "string") {
      const t = seg.trim();
      if (t) segs.push(t);
      return;
    }
    const t = String(seg?.text ?? seg?.caption ?? seg?.content ?? seg?.snippet ?? "").trim();
    if (t) segs.push(t);
  };
  for (const item of items ?? []) {
    if (!item) continue;
    if (!title) title = item.title ?? item.videoTitle ?? item.video?.title ?? item.metadata?.title ?? null;
    // pintostudio~youtube-transcript-scraper wraps segments in `searchResult`; keep the
    // other keys as fallbacks so a different actor still works.
    const arr =
      item.searchResult ?? item.data ?? item.transcript ?? item.captions ?? item.segments ?? item.subtitles;
    if (Array.isArray(arr)) {
      for (const s of arr) pushSeg(s);
      continue;
    }
    if (typeof item.text === "string") {
      pushSeg(item);
      continue;
    }
    if (typeof item.transcript === "string") {
      const t = item.transcript.trim();
      if (t) segs.push(t);
    }
  }
  const transcript = segs.join(" ").replace(/\s+/g, " ").trim();
  if (segs.length === 0) {
    // Surface the actual shape so mapTranscript can be tuned after the first live run.
    console.log("[apify-yt] no transcript segments; raw item keys:", Object.keys(items?.[0] ?? {}).join(","));
  }
  return { videoUrl, title: title ? String(title).trim() : null, transcript, segments: segs.length };
}

/** Run the YouTube transcript actor synchronously and return the raw dataset items. */
export async function runYoutubeTranscript(env: Env, videoUrl: string): Promise<any[]> {
  const token = env.APIFY_TOKEN;
  if (!token) throw new Error("APIFY_TOKEN is not configured. Run: wrangler secret put APIFY_TOKEN");
  if (!videoUrl) throw new Error("Enter a YouTube video URL.");
  const actor = env.APIFY_YOUTUBE_ACTOR || DEFAULT_YT_ACTOR;
  const input = { videoUrl };

  let res: Response;
  try {
    res = await fetch(`https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?clean=true`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify(input),
    });
  } catch (e) {
    throw new Error(`Apify request failed: ${(e as Error).message}`);
  }
  if (res.status === 408) throw new Error("Apify timed out — try again or a shorter video.");
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Apify API ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = (await res.json().catch(() => [])) as unknown;
  return Array.isArray(data) ? data : [];
}
