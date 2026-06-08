export const meta = {
  name: 'tune-article',
  description: 'Audit a published techfromalex.com article and PROPOSE fine-tuning (free Unsplash hero image, copy/tone polish, SEO, fact-check + flagged fixes). Proposes only; never writes to the live site.',
  whenToUse: 'Fine-tune a techfromalex.com article. Pass args = { slug, capabilities?: ["hero","copy","seo","factcheck"], note?: string }. Loads the article from D1 by slug and returns a structured proposal to review; the operator applies approved parts to D1 afterward. Runs free on the Claude subscription (no Apify, no billed site API).',
  phases: [{ title: 'Load' }, { title: 'Audit' }],
}

const a = args || {}
const slug = a.slug
if (!slug) throw new Error('tune-article requires args.slug')
const caps = Array.isArray(a.capabilities) && a.capabilities.length ? a.capabilities : ['hero', 'copy', 'seo', 'factcheck']
const has = (c) => caps.includes(c)
const note = a.note || ''

const RULES = 'SITE RULES: never use em dashes (use commas, periods, or parentheses); buy links are auto-generated from product ids so never write raw links; keep the confident, hands-on, evidence-led voice; do not touch ::product-card, :product[...]{...}, :::pros-cons, or :::callout directives; affiliate-link integrity is sacred.'

const LOADED_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['found', 'title', 'dek', 'seoTitle', 'seoDescription', 'hasHero', 'bodyMd'],
  properties: {
    found: { type: 'boolean' },
    title: { type: 'string' },
    dek: { type: 'string' },
    seoTitle: { type: 'string' },
    seoDescription: { type: 'string' },
    hasHero: { type: 'boolean' },
    bodyMd: { type: 'string', description: 'the article body markdown, copied VERBATIM' },
  },
}

const HERO_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['imageUrl', 'pageUrl', 'photographer', 'alt', 'rationale'],
  properties: {
    imageUrl: { type: ['string', 'null'], description: 'direct images.unsplash.com URL with banner params, or null if none found' },
    pageUrl: { type: ['string', 'null'], description: 'unsplash.com photo page for attribution' },
    photographer: { type: ['string', 'null'] },
    alt: { type: 'string' },
    rationale: { type: 'string' },
  },
}

const COPY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['edits', 'summary'],
  properties: {
    summary: { type: 'string' },
    edits: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['before', 'after', 'reason'],
        properties: {
          before: { type: 'string', description: 'EXACT unique substring of the body to replace' },
          after: { type: 'string' },
          reason: { type: 'string' },
        },
      },
    },
  },
}

const SEO_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['seoTitle', 'seoDescription', 'rationale', 'faqSuggestions'],
  properties: {
    seoTitle: { type: 'string', description: 'max 60 chars' },
    seoDescription: { type: 'string', description: '120-160 chars' },
    rationale: { type: 'string' },
    faqSuggestions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['q', 'a', 'action'],
        properties: { q: { type: 'string' }, a: { type: 'string' }, action: { type: 'string', enum: ['add', 'reword'] } },
      },
    },
  },
}

const FACT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['claim', 'verdict', 'note', 'suggestedFix'],
        properties: {
          claim: { type: 'string' },
          verdict: { type: 'string', enum: ['ok', 'stale', 'wrong', 'unverified'] },
          note: { type: 'string' },
          suggestedFix: { type: 'string' },
        },
      },
    },
  },
}

phase('Load')
const loaded = await agent(
  [
    'Load a published article from the techfromalex.com Cloudflare D1 database so it can be fine-tuned.',
    'The working directory is the project root and wrangler is authenticated. Run this command:',
    "  wrangler d1 execute techfromalex_db --remote --json --command \"SELECT title, dek, seo_title, seo_description, hero_image_url, body_md FROM content WHERE slug = '" + slug + "' LIMIT 1\"",
    'It returns JSON like [{ "results": [ { ...row... } ] }]. Read the single row.',
    'Return found=true with the fields. Set hasHero=true only if hero_image_url is a non-empty value. Copy body_md into bodyMd VERBATIM, with no summarizing, truncation, or edits (it may be several KB of markdown). If no row is found, return found=false and empty strings.',
  ].join('\n'),
  { label: 'load:' + slug, phase: 'Load', agentType: 'general-purpose', schema: LOADED_SCHEMA },
)

if (!loaded.found) {
  log('No published article found for slug "' + slug + '".')
  return { error: 'not found', slug }
}

const ctx = [
  'You are fine-tuning a published buying-guide article on techfromalex.com (an Astro affiliate site).',
  'Title: ' + loaded.title,
  'Dek: ' + loaded.dek,
  'Current SEO title: ' + loaded.seoTitle,
  'Current SEO description: ' + loaded.seoDescription,
  note ? ('Operator note (prioritize this): ' + note) : '',
  '',
  RULES,
  '',
  'BODY MARKDOWN:',
  '-----',
  loaded.bodyMd,
  '-----',
].join('\n')

phase('Audit')
const tasks = []
if (has('hero')) {
  tasks.push(() =>
    agent(
      [
        'Find ONE relevant, free-licensed hero banner image on Unsplash for the buying guide titled: "' + loaded.title + '".',
        note ? ('Operator note: ' + note) : '',
        'Pick a clean, on-theme landscape photo (for example a tidy multi-monitor computer desk for a KVM-switch guide, or a home-theater / AV rack / wall of screens for an HDMI-matrix guide). Avoid photos with prominent brand logos or readable text.',
        'Use WebSearch and WebFetch against unsplash.com to find a specific photo. Return a DIRECT image URL on images.unsplash.com of the form https://images.unsplash.com/photo-XXXXXXXX with these query params appended for a wide banner: ?w=1600&q=80&auto=format&fit=crop. Verify that exact URL returns an image. Also return the unsplash.com photo page URL (for attribution), the photographer name if shown, a concise descriptive alt text (no brand names), and one line on why it fits. If you cannot confidently find a suitable free image, return imageUrl=null.',
      ].join('\n'),
      { label: 'hero', phase: 'Audit', agentType: 'general-purpose', schema: HERO_SCHEMA },
    ).then((r) => ({ kind: 'hero', data: r })),
  )
}
if (has('copy')) {
  tasks.push(() =>
    agent(
      ctx +
        '\n\nCOPY & TONE LENS. Propose up to 8 specific, high-value copy edits to the BODY MARKDOWN above. Each edit needs a "before" that is an EXACT, unique substring of the body and an "after" replacement. Priorities: remove any em dashes, tighten wordiness, fix awkward or repetitive phrasing, and improve flow and scannability while keeping the confident hands-on voice. Do NOT rewrite whole sections and do NOT alter any directive lines (::product-card, :product, :::pros-cons, :::callout) or table rows. Only propose edits that are clear improvements; fewer, better edits beat many trivial ones.',
      { label: 'copy', phase: 'Audit', schema: COPY_SCHEMA },
    ).then((r) => ({ kind: 'copy', data: r })),
  )
}
if (has('seo')) {
  tasks.push(() =>
    agent(
      ctx +
        '\n\nSEO LENS. Propose an improved SEO title (max 60 characters, keyword-forward and compelling), an improved SEO description (120 to 160 characters), and up to 3 FAQ improvements (reworded existing or net-new question/answer pairs aimed at real search intent). Stay accurate to the article and keep the voice. Return the new title, the new description, a one-line rationale, and faqSuggestions with action "add" or "reword".',
      { label: 'seo', phase: 'Audit', schema: SEO_SCHEMA },
    ).then((r) => ({ kind: 'seo', data: r })),
  )
}
if (has('factcheck')) {
  tasks.push(() =>
    agent(
      ctx +
        '\n\nFACT-CHECK LENS. Use WebSearch and WebFetch to spot-check the key product and specification claims in this article against current reality. Flag anything stale, wrong, or unverifiable: a product no longer sold, a spec that does not match the current listing, a ranking claim that no longer holds, or a price that has moved a lot. Be concrete and cite what you checked in the note. Return findings with verdict ok, stale, wrong, or unverified, plus a suggestedFix. Only list claims worth acting on; do not pad with trivia.',
      { label: 'factcheck', phase: 'Audit', agentType: 'general-purpose', schema: FACT_SCHEMA },
    ).then((r) => ({ kind: 'factcheck', data: r })),
  )
}

const results = (await parallel(tasks)).filter(Boolean)
const proposal = { slug, title: loaded.title, hadHero: loaded.hasHero, ran: caps }
for (const r of results) proposal[r.kind] = r.data
log('Tuning proposal ready for "' + loaded.title + '" (' + caps.join(', ') + ').')
return proposal
