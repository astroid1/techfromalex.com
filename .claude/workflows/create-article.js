export const meta = {
  name: 'create-article',
  description: 'Create a full techfromalex.com article from a brief (topic + type + optional brief + optional products). Researches and verifies real Amazon products (or verifies the ones you supply), writes the full article in the site format, finds a free Unsplash hero, and returns a PROPOSAL. Never writes to the site; the operator seeds the approved draft.',
  whenToUse: 'Generate a new article on demand. args = { topic, type: "roundup"|"review"|"comparison"|"howto", brief?, products?: [{name?,asin?,url?}] }. If products are supplied they are used and verified; otherwise products are auto-researched. Returns { article, products, hero } to review; the operator seeds it as a draft. Free on the Claude subscription (no Apify, no billed site API).',
  phases: [{ title: 'Research' }, { title: 'Verify' }, { title: 'Write' }],
}

const a = args || {}
const topic = a.topic
const type = a.type
const brief = a.brief || ''
const supplied = Array.isArray(a.products) ? a.products : []
const TYPES = ['roundup', 'review', 'comparison', 'howto']
if (!topic) throw new Error('create-article requires args.topic')
if (!TYPES.includes(type)) throw new Error('create-article requires args.type one of: ' + TYPES.join(', '))

const slugify = (s) =>
  String(s || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
const productMode = supplied.length ? 'supplied' : 'auto'
const categoryByType = { roundup: 'guides', review: 'reviews', comparison: 'comparisons', howto: 'guides' }

const countGuide = {
  roundup: 'Find the best real products for this topic (aim for 5; 4 to 6 is fine).',
  review: 'Identify the ONE product this review is about (from the topic, brief, or supplied list).',
  comparison: 'Identify the 2 to 4 products being compared.',
  howto: 'Only include products if they genuinely help the reader (0 to 3). An empty list is fine for a pure explainer.',
}

const INTEGRITY =
  'CRITICAL: every product must be a REAL, currently-sold Amazon US product with its REAL 10-character ASIN, read from an actual amazon.com/.../dp/<ASIN> page found via WebSearch/WebFetch. NEVER invent or guess an ASIN. Exclude any product whose real ASIN you cannot confirm.'

const FORMAT = [
  'OUTPUT FORMAT. bodyMd is GitHub-flavored markdown. Use these directives EXACTLY, each on its own line:',
  '- ::product-card{id="PRODUCT_ID"}  renders a full product card.',
  '- ::buy-button{id="PRODUCT_ID"}  renders a buy CTA.',
  '- :::comparison{ids="id1,id2,id3"} then a line ::: closes it  renders a spec comparison table.',
  '- a pros/cons box: a line :::pros-cons, then a line pros:, then "- " bullet lines, then a blank line, then a line cons:, then "- " bullet lines, then a closing line :::',
  '- a callout: a line :::callout{type="info" title="..."} (types: info, tip, warning, danger), text, then a closing line :::',
  '- :product[visible label]{id="PRODUCT_ID"}  an inline product link inside a sentence.',
  'RULES: Use ONLY the product ids provided. Never invent an id, price, spec, rating, or retailer URL, and never write a raw link to a retailer (the site builds tagged affiliate links from the ids). NEVER use em dashes or en dashes; use commas, periods, or parentheses. Do not write the title as an H1 or write a FAQ heading in the body (the site renders the title and the FAQ from structured.faq). Open with the intro paragraph, use ## for sections. Write first person, direct, evidence-led, hands-on, no hype, no filler. A site-wide FTC affiliate disclosure renders automatically, so do not write one. Use real markdown tables where a comparison helps.',
].join('\n')

const TYPE_GUIDE = {
  roundup:
    'Write a 1,500 to 2,500 word buying guide. Open by explaining the topic in plain terms, add a "## What to Look For" section, then a section with one ## subsection per pick, each containing a ::product-card{id} and a short verdict plus a :::pros-cons block. Include a markdown comparison table and a "## The Bottom Line" with inline :product[label]{id} links. structured must be: { criteria: [string], howWeChose: string, picks: [{rank, productId, award, bestFor, rationale}], faq: [{q,a}] }. Give each pick a distinct award (Best Overall, Best Budget, Best for X).',
  review:
    'Write a 1,200 to 1,800 word single-product review of the ONE provided product. Open with a hook, then ## sections (Design, Performance, etc.). Place one ::product-card{id} near the top and one ::buy-button{id} near the end, and include a :::pros-cons block. structured must be: { productId, verdictScore (0-10, one decimal), verdictSummary, scorecard: [{label, score 0-10}], whoItsFor: [string], whoItsNot: [string], faq: [{q,a}] }.',
  comparison:
    'Write a 1,200 to 2,000 word head-to-head comparison of the provided products. Open by framing the choice, use a :::comparison{ids="..."} block listing all product ids, then ## sections per dimension (price, performance, etc.) naming a winner each, and a clear verdict with inline :product[label]{id} links. structured must be: { entrants: [productId, ...], faq: [{q,a}] }.',
  howto:
    'Write a 1,000 to 1,800 word how-to or explainer guide. Open with what and why, then ## sections or numbered steps. If products genuinely help, place ::product-card{id} where relevant. structured must be: { steps: [{name, detail}], tools: [string], difficulty: string, timeRequired: plain words like "20 minutes", faq: [{q,a}] }. For a pure explainer with no real steps, use an empty steps array and carry the value in ## sections.',
}

const PRODUCTS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['products'],
  properties: {
    products: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'brand', 'category', 'asin', 'amazonUrl', 'priceUsd', 'rating', 'reviewCount', 'imageUrl', 'pros', 'cons', 'specs', 'rank', 'award', 'bestFor', 'rationale', 'confidence', 'sources'],
        properties: {
          name: { type: 'string' },
          brand: { type: 'string' },
          category: { type: 'string', description: 'product-type word for cross-sell grouping, e.g. "docking-station"' },
          asin: { type: 'string' },
          amazonUrl: { type: 'string' },
          priceUsd: { type: 'number' },
          rating: { type: 'number' },
          reviewCount: { type: 'integer' },
          imageUrl: { type: ['string', 'null'] },
          pros: { type: 'array', items: { type: 'string' } },
          cons: { type: 'array', items: { type: 'string' } },
          specs: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['name', 'value'], properties: { name: { type: 'string' }, value: { type: 'string' } } } },
          rank: { type: 'integer' },
          award: { type: 'string' },
          bestFor: { type: 'string' },
          rationale: { type: 'string' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          sources: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
}

const VERIFY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['results'],
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'claimedAsin', 'verifiedAsin', 'matches', 'note'],
        properties: {
          name: { type: 'string' },
          claimedAsin: { type: 'string' },
          verifiedAsin: { type: ['string', 'null'] },
          matches: { type: 'boolean' },
          note: { type: 'string' },
        },
      },
    },
  },
}

const HERO_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['imageUrl', 'pageUrl', 'photographer', 'alt'],
  properties: {
    imageUrl: { type: ['string', 'null'] },
    pageUrl: { type: ['string', 'null'] },
    photographer: { type: ['string', 'null'] },
    alt: { type: 'string' },
  },
}

const ARTICLE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'slug', 'dek', 'seoTitle', 'seoDescription', 'tags', 'bodyMd', 'structured'],
  properties: {
    title: { type: 'string' },
    slug: { type: 'string', description: 'kebab-case, derived from the topic' },
    dek: { type: 'string' },
    seoTitle: { type: 'string', description: 'max 60 chars' },
    seoDescription: { type: 'string', description: '120-160 chars' },
    tags: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['slug', 'name'], properties: { slug: { type: 'string' }, name: { type: 'string' } } } },
    bodyMd: { type: 'string' },
    structured: { type: 'object', description: 'the type-specific structured object described in the TYPE GUIDE; MUST include a faq array of 4-6 {q,a}' },
  },
}

phase('Research')
const productsRes = await agent(
  [
    INTEGRITY,
    '',
    'Research products for a "' + type + '" article on techfromalex.com about: ' + topic,
    brief ? ('Operator brief: ' + brief) : '',
    supplied.length ? ('The operator supplied these products to use (verify each and fill in all details): ' + JSON.stringify(supplied)) : 'No products supplied; find the best real ones yourself.',
    countGuide[type],
    'For each product return: name, brand, a short product-category word, the REAL ASIN, the amazonUrl you found it at, current approx US price, Amazon star rating and review count, an image URL if you can find a direct Amazon CDN one (else null), 3-5 pros and 2-4 cons grounded in real reviews, key specs, and a rank plus an award (e.g. Best Overall, Best Budget), a bestFor, and a one to two sentence rationale grounded in reviews. (For a single review, rank 1 and award like "Our Verdict" is fine.) Use WebSearch/WebFetch. confidence=high only if you located the real dp URL carrying that ASIN. List sources. Return an empty products array only if this is a pure explainer with no relevant products.',
  ].join('\n'),
  { label: 'products', phase: 'Research', agentType: 'general-purpose', schema: PRODUCTS_SCHEMA },
)
let products = productsRes.products || []

phase('Verify')
let verified = products
if (products.length) {
  const list = products.map((p) => '- ' + p.name + ' (claimed ASIN ' + p.asin + ', ' + p.amazonUrl + ')').join('\n')
  const v = await agent(
    [
      INTEGRITY,
      '',
      'Independently verify each product below has the claimed REAL Amazon US ASIN. For each, find its real amazon.com/dp/ URL fresh (do not trust the claim), read the ASIN, and report verifiedAsin and whether it matches. If the product is real but the ASIN differs, return the correct verifiedAsin. If you cannot confirm a real US listing, set verifiedAsin=null and matches=false.',
      '',
      list,
    ].join('\n'),
    { label: 'verify', phase: 'Verify', agentType: 'general-purpose', schema: VERIFY_SCHEMA },
  )
  const byName = {}
  for (const r of v.results || []) byName[r.name] = r
  verified = products
    .map((p) => {
      const r = byName[p.name]
      if (r && r.verifiedAsin) return { ...p, asin: r.verifiedAsin }
      return null
    })
    .filter(Boolean)
}

const seen = new Set()
const withIds = verified
  .slice()
  .sort((x, y) => (x.rank || 99) - (y.rank || 99))
  .map((p) => {
    const nm = String(p.name || '')
    const br = String(p.brand || '')
    // Prepend the brand only if the name does not already start with it (avoids "caldigit-caldigit-...").
    let id = slugify(br && !nm.toLowerCase().startsWith(br.toLowerCase()) ? br + ' ' + nm : nm)
    while (seen.has(id) || !id) id = (id || 'product') + '-x'
    seen.add(id)
    return { id, ...p }
  })

phase('Write')
const heroPrompt = [
  'Find ONE relevant, free-licensed hero banner image on Unsplash for an article titled about: "' + topic + '".',
  'Pick a clean, on-theme landscape photo with no prominent brand logos or readable text. Use WebSearch and WebFetch against unsplash.com.',
  'Return a DIRECT image URL on images.unsplash.com of the form https://images.unsplash.com/photo-XXXXXXXX with ?w=1600&q=80&auto=format&fit=crop appended, and verify that exact URL returns an image. Also return the unsplash.com photo page URL, the photographer name if shown, and a concise descriptive alt text. Return imageUrl=null if you cannot find a suitable free image.',
].join('\n')

const productsForWrite = withIds.map((p) => ({
  id: p.id, name: p.name, brand: p.brand, asin: p.asin, priceUsd: p.priceUsd, rating: p.rating,
  award: p.award, bestFor: p.bestFor, rationale: p.rationale, pros: p.pros, cons: p.cons, specs: p.specs,
}))

const writePrompt = [
  'Write a complete techfromalex.com article.',
  'Topic: ' + topic,
  'Type: ' + type,
  brief ? ('Operator brief (follow it): ' + brief) : '',
  '',
  FORMAT,
  '',
  'TYPE GUIDE: ' + TYPE_GUIDE[type],
  '',
  productsForWrite.length
    ? 'Use ONLY these products. Reference each by its EXACT id in ::product-card{id}, ::buy-button{id}, :product[label]{id}, :::comparison{ids}, and in structured. Do not invent products, ids, prices, or specs beyond what is given:\n' + JSON.stringify(productsForWrite)
    : 'This article has no products; write a pure explainer with no product directives.',
  '',
  'Return: title, slug (kebab-case from the topic), dek (one or two sentences), seoTitle (max 60 chars), seoDescription (120-160 chars), tags (3-5 {slug,name}), bodyMd (the full article), and structured (exactly the shape in the TYPE GUIDE, including a faq array of 4-6 genuinely useful q/a). No em dashes anywhere.',
].join('\n')

const [hero, article] = await parallel([
  () => agent(heroPrompt, { label: 'hero', phase: 'Write', agentType: 'general-purpose', schema: HERO_SCHEMA }),
  () => agent(writePrompt, { label: 'write', phase: 'Write', schema: ARTICLE_SCHEMA }),
])

log('Drafted "' + (article && article.title) + '" (' + type + ', ' + withIds.length + ' products, mode ' + productMode + ').')
return {
  topic,
  type,
  productMode,
  category: categoryByType[type],
  article,
  products: withIds,
  hero,
  dropped: products.length - verified.length,
}
