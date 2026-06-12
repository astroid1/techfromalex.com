# techfromalex.com

Public tech blog, monetized with affiliate links and sponsored placements.
Solo-operated; every article is reviewed by Alex before publishing.

## Stack

- Astro 5 (SSR) on Cloudflare Workers; assets + worker in one deploy from `dist/`
- D1 (`techfromalex_db`) is the content database; R2 (`MEDIA`) for images; KV for render cache + sessions
- Admin UI at `/admin` (Cloudflare Access protected) with its own billed AI pipeline (Anthropic API + Apify scrapers)
- `npm run dev` / `build` / `check`; DB: `npm run db:migrate:local` / `db:migrate:remote`

## Deploy

- **`npm run deploy`** (build + `wrangler deploy`). A git push does NOT deploy.
- Site code changes need a deploy; **content changes do not** (content lives in D1).

## Content pipeline (the preferred, subscription-free path)

1. **Generate**: run the `create-article` workflow (`.claude/workflows/create-article.js`).
   - args: `{ topic, type: roundup|review|comparison|howto, brief?, products?, source?, sponsor? }`
   - `source` accepts intake media in any combination: `{ youtubeUrl?, transcript?, urls?: [], notes? }` — it is distilled into grounded facts first (Intake phase).
   - `sponsor: { programId }` adds a `::promo{id}` placement; the programId must exist in the D1 `programs` table.
   - It researches + independently verifies real Amazon ASINs, writes the article in site format, finds an Unsplash hero, and returns a **proposal JSON. It never writes to the site.**
2. **Review** the proposal, then save it to a file (e.g. `.proposal.json`).
3. **Seed**: `node scripts/seed-article.mjs .proposal.json --remote` → creates a DRAFT in D1
   (products + tagged Amazon links + tags). Drops any product without a valid 10-char ASIN.
4. **Approve + publish in `/admin`**: review at `/admin/content/<id>/preview`, then Publish
   (this runs referential checks, syncs full-text search, and purges the CDN cache).

To fine-tune a live article: run the `tune-article` workflow (propose-only), save approved
parts as `{ slug, edits: [{before,after}], set: {...} }`, then
`node scripts/apply-edits.mjs <file> --remote`. It refuses stale edits and resyncs FTS.

The admin UI also has a billed path (create with AI, YouTube intake via Apify, Amazon product
import via Apify) — fine for one-offs, but the workflow path above is free on the subscription.

## Non-negotiable content rules

- **Affiliate integrity**: every buy link must be a valid, tagged affiliate link. Never invent
  ASINs, prices, specs, or retailer URLs. Buy URLs are built at render time from product ids;
  never write raw retailer links in article bodies.
- Buy CTAs say **"View on {retailer}"**, never "check the price".
- **No em dashes or en dashes** anywhere in article copy.
- Body markdown uses directives: `::product-card{id}`, `::buy-button{id}`,
  `:product[label]{id}`, `:::comparison{ids}`, `:::pros-cons`, `:::callout{type title}`,
  `::promo{id}` (sponsored program CTA). Only reference ids that exist.
- No fabricated hands-on claims: when an article is grounded in source media (a video,
  someone else's review), write evidence-led, not fake first-person anecdotes.
- A site-wide FTC disclosure renders automatically; do not write one per article.
- Voice: first person, direct, evidence-led, no hype, no filler.

## Gotchas

- Content `status` flow: draft → in_review (cosmetic) → published; publish is gated by
  referential validation (`src/lib/validate.ts`) and is what syncs `content_fts` + purges CDN.
- Editing published content outside `/admin` requires an FTS resync (apply-edits.mjs does this).
- `scripts/seed.mjs` is the historical initial-bootstrap generator (made `0004_seed.sql`); do
  not rerun it. Per-article seeding goes through `scripts/seed-article.mjs`.
- PowerShell writes UTF-8 with BOM; the scripts strip it, but prefer `-Encoding utf8` anyway.
