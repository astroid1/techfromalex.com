// Generates migrations/0004_seed.sql from the legacy Next data + MDX posts.
// One-time legacy import: 1 author, 1 affiliate profile (Amazon, real tag),
// 6 products + Amazon links, 3 posts converted to directive-markdown.
// Run: node scripts/seed.mjs  (then `npm run db:migrate:remote` / :local)
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const NOW = "2025-04-01T00:00:00.000Z"; // fixed import timestamp (deterministic)
const q = (v) =>
  v === null || v === undefined ? "NULL" : `'${String(v).replace(/'/g, "''")}'`;
const n = (v) => (v === null || v === undefined ? "NULL" : String(v));
const json = (v) => q(JSON.stringify(v));

// Strip directive-markdown to plain text for the FTS index.
function toPlainText(md) {
  return md
    .replace(/^:::\w[^\n]*$/gm, " ")        // block directive open
    .replace(/^:::$/gm, " ")                 // block directive close
    .replace(/^::\w[^\n]*$/gm, " ")          // leaf directive
    .replace(/:product\[([^\]]+)\]\{[^}]*\}/g, "$1") // inline link -> text
    .replace(/^\|.*$/gm, " ")                // table rows
    .replace(/[#>*_`~]/g, " ")               // md punctuation
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------------------- author
const author = {
  id: "alex",
  slug: "alex",
  name: "Alex Hirt",
  email: "alex258.hirt@gmail.com",
  bio: "Founder of Tech From Alex. I buy, test, and live with the gear I review so you don't have to gamble on it.",
  title: "Founder & Lead Reviewer",
  same_as: [],
  is_owner: 1,
};

// ------------------------------------------------------------- profiles
// Amazon tag is real (from .env.example). Best Buy / B&H are added later in the
// admin once real network IDs exist — the empty-tag CHECK would reject them now.
const profiles = [
  {
    id: "amazon-main",
    name: "Amazon Associates (Tech From Alex)",
    network: "amazon",
    tracking_tag: "techfromalex-20",
    link_rules: { param: "tag" },
  },
];

// -------------------------------------------------------------- products
const products = [
  {
    id: "macbook-pro-m4", name: 'MacBook Pro 14" M4', brand: "Apple", category: "laptops",
    price: 1599, rating: 4.7,
    description:
      "Apple's latest MacBook Pro with the M4 chip delivers blazing-fast performance, an incredible Liquid Retina XDR display, and all-day battery life in a sleek, portable design.",
    pros: [
      "Exceptional single-core and multi-core performance",
      "Up to 24 hours of battery life",
      "Stunning Liquid Retina XDR display",
      "Quiet fanless operation under light loads",
    ],
    cons: [
      "Starting price is steep for most users",
      "Only 16GB unified memory in base model",
      "No touchscreen option",
    ],
    specs: {
      Processor: "Apple M4 (10-core CPU, 10-core GPU)",
      Memory: "16GB unified memory",
      Storage: "512GB SSD",
      Display: '14.2" Liquid Retina XDR, 3024x1964',
      Battery: "Up to 24 hours",
      Weight: "3.4 lbs (1.55 kg)",
    },
    amazon: "https://www.amazon.com/Apple-MacBook-Laptop-14-inch-Processor/dp/B0DLHBYZNL",
  },
  {
    id: "sony-wh1000xm5", name: "Sony WH-1000XM5", brand: "Sony", category: "headphones",
    price: 348, rating: 4.6,
    description:
      "Industry-leading noise canceling headphones with Auto NC Optimizer, exceptional sound quality, and up to 30 hours of battery life.",
    pros: [
      "Best-in-class active noise cancellation",
      "Excellent sound quality with LDAC support",
      "30-hour battery life",
      "Lightweight and comfortable for long sessions",
    ],
    cons: [
      "No folding design like predecessor",
      "Premium price point",
      "Touch controls can be accidentally triggered",
    ],
    specs: {
      Driver: "30mm carbon fiber composite",
      "Noise Canceling": "Dual Processor, 8 microphones",
      Battery: "30 hours (NC on)",
      Connectivity: "Bluetooth 5.2, 3.5mm",
      Weight: "250g",
      Codec: "LDAC, AAC, SBC",
    },
    amazon: "https://www.amazon.com/Sony-WH-1000XM5-Canceling-Headphones-Hands-Free/dp/B09XS7JWHH",
  },
  {
    id: "samsung-t7-ssd", name: "Samsung T7 Portable SSD (1TB)", brand: "Samsung", category: "storage",
    price: 99, rating: 4.8,
    description:
      "Fast, reliable portable SSD with USB 3.2 Gen 2 speeds up to 1,050 MB/s. Compact enough to fit in your palm with built-in hardware encryption.",
    pros: [
      "Blazing read/write speeds up to 1,050/1,000 MB/s",
      "Extremely compact and lightweight",
      "Built-in AES 256-bit hardware encryption",
      "Shock-resistant with no moving parts",
    ],
    cons: [
      "Gets warm under sustained transfers",
      "USB-C to USB-A cable sold separately",
      "No IP rating for water/dust resistance",
    ],
    specs: {
      Capacity: "1TB",
      Interface: "USB 3.2 Gen 2 (10Gbps)",
      "Sequential Read": "Up to 1,050 MB/s",
      "Sequential Write": "Up to 1,000 MB/s",
      Dimensions: "85 x 57 x 8.0 mm",
      Weight: "58g",
    },
    amazon: "https://www.amazon.com/SAMSUNG-Portable-SSD-1TB-MU-PC1T0T/dp/B0874XN4D8",
  },
  {
    id: "logitech-mx-master-3s", name: "Logitech MX Master 3S", brand: "Logitech", category: "peripherals",
    price: 99, rating: 4.7,
    description:
      "Premium wireless mouse with an ergonomic design, MagSpeed scroll wheel, and 8K DPI tracking on virtually any surface, including glass.",
    pros: [
      "MagSpeed electromagnetic scroll is incredibly precise",
      "Tracks on any surface including glass",
      "Connect up to 3 devices with Easy-Switch",
      "USB-C fast charging (1 min = 3 hrs use)",
    ],
    cons: [
      "Expensive for a mouse",
      "Right-handed design only",
      "Bluetooth can lag on some systems",
    ],
    specs: {
      Sensor: "Darkfield 8000 DPI",
      Battery: "Up to 70 days on full charge",
      Connectivity: "Bluetooth, Logi Bolt USB receiver",
      "Scroll Wheel": "MagSpeed electromagnetic",
      Weight: "141g",
      Compatibility: "Windows, macOS, Linux, iPadOS",
    },
    amazon: "https://www.amazon.com/Logitech-MX-Master-3S-Graphite/dp/B09HM94VDS",
  },
  {
    id: "ipad-air-m2", name: "Apple iPad Air (M2)", brand: "Apple", category: "tablets",
    price: 599, rating: 4.5,
    description:
      "The iPad Air with M2 chip offers powerful performance in a thin, lightweight design. Features a 10.9\" Liquid Retina display, Wi-Fi 6E, and support for Apple Pencil Pro.",
    pros: [
      "M2 chip handles demanding apps with ease",
      "Gorgeous Liquid Retina display",
      "Apple Pencil Pro support",
      "Lightweight at under a pound",
    ],
    cons: [
      "60Hz refresh rate (no ProMotion)",
      "Front camera in landscape only on 13-inch",
      "Base model has only 128GB storage",
    ],
    specs: {
      Processor: "Apple M2",
      Display: '10.9" Liquid Retina, 2360x1640',
      Storage: "128GB",
      Camera: "12MP Wide rear, 12MP Ultra Wide front",
      Battery: "Up to 10 hours",
      Weight: "1.02 lbs (462g)",
    },
    amazon: "https://www.amazon.com/Apple-iPad-Air-11-inch-Landscape/dp/B0D3J7GPRX",
  },
  {
    id: "asus-rog-ally-x", name: "ASUS ROG Ally X", brand: "ASUS", category: "gaming",
    price: 799, rating: 4.3,
    description:
      "A powerful Windows gaming handheld featuring an AMD Ryzen Z1 Extreme processor, 7-inch 120Hz FHD display, and 80Wh battery for extended portable gaming sessions.",
    pros: [
      "Excellent performance with Ryzen Z1 Extreme",
      "Full Windows 11 for native PC game library",
      "120Hz FHD IPS display is vibrant",
      "80Wh battery is a big upgrade over original",
    ],
    cons: [
      "Fan noise under heavy load",
      "Windows UI is not ideal for handheld use",
      "Heavier than Nintendo Switch OLED",
    ],
    specs: {
      Processor: "AMD Ryzen Z1 Extreme",
      Memory: "24GB LPDDR5X",
      Storage: "1TB PCIe 4.0 SSD",
      Display: '7" FHD IPS, 120Hz, 1080p',
      Battery: "80Wh",
      Weight: "678g",
    },
    amazon: "https://www.amazon.com/ASUS-ROG-Ally-Gaming-Handheld/dp/B0D56LCZ2J",
  },
];

// ----------------------------------------------------------------- posts
const posts = [
  {
    id: "macbook-pro-m4-review",
    type: "review",
    slug: "macbook-pro-m4-review",
    title: "MacBook Pro M4 Review: The Laptop That Does It All",
    dek: "Apple's M4 MacBook Pro sets a new standard for professional laptops. Here's our full review after two months of daily use.",
    category: "reviews",
    verdict_score: 9.2,
    date: "2025-02-15",
    tags: [["apple", "Apple"], ["macbook", "MacBook"], ["laptop", "Laptop"], ["m4", "M4"]],
    products: [["macbook-pro-m4", "primary"]],
    structured: {
      productId: "macbook-pro-m4",
      verdictScore: 9.2,
      verdictSummary:
        "The best professional laptop available today — an unmatched combination of performance, battery life, and display quality.",
      whoItsFor: ["Developers", "Video editors", "Photographers", "Power users on the go"],
      whoItsNot: ["Happy M3 owners", "Budget buyers", "Anyone who needs Windows"],
    },
    body: `After two months with the MacBook Pro M4, I can confidently say this is the best laptop Apple has ever made. But is it worth the upgrade? Let's break it down.

## Design & Display

The MacBook Pro M4 retains the same excellent design language from previous generations. The 14-inch Liquid Retina XDR display is stunning with its 3024 x 1964 resolution and up to 1600 nits of peak HDR brightness.

::product-card{id="macbook-pro-m4"}

## Performance

The M4 chip is a genuine leap forward. Here are some real-world benchmarks:

- **Video Export (4K, 10 min):** 3 minutes 22 seconds
- **Xcode Build (Large Project):** 45% faster than M3
- **Photo Editing (100 RAW files):** Under 2 minutes

:::callout{type="info" title="Who Is This For?"}
The M4 MacBook Pro is ideal for developers, video editors, photographers, and anyone who needs serious computing power on the go.
:::

## Battery Life

Apple claims 18 hours of battery life, and in my testing, I consistently got 14-16 hours of mixed use. That's genuinely all-day battery life.

:::pros-cons
pros:
- Blazing fast M4 performance
- All-day battery life (14-16 hours real-world)
- Stunning XDR display
- Excellent speaker system
- Three Thunderbolt 4 ports
cons:
- Expensive starting price
- 16GB base RAM feels limiting in 2025
- No design changes from M3 model
- macOS only - no Windows option
:::

## Should You Upgrade?

- **From M1/M2:** Yes, the performance jump is significant
- **From M3:** Probably not unless you need the specific improvements
- **From Intel:** Absolutely, it's a night and day difference

## Final Verdict

The :product[MacBook Pro M4]{id="macbook-pro-m4"} is simply the best professional laptop available today. The combination of performance, battery life, display quality, and build quality is unmatched.

::buy-button{id="macbook-pro-m4"}`,
  },
  {
    id: "best-wireless-headphones-2025",
    type: "roundup",
    slug: "best-wireless-headphones-2025",
    title: "Best Wireless Headphones in 2025: Our Top Picks",
    dek: "We tested dozens of wireless headphones to find the best options for every budget. Here are our top picks for noise cancelling, sound quality, and value.",
    category: "reviews",
    verdict_score: null,
    date: "2025-03-10",
    tags: [["headphones", "Headphones"], ["wireless", "Wireless"], ["noise-cancelling", "Noise Cancelling"], ["audio", "Audio"]],
    products: [["sony-wh1000xm5", "primary"]],
    structured: {
      criteria: ["Sound Quality", "Noise Cancellation", "Comfort & Battery"],
      howWeChose:
        "I spent the last month testing the most popular wireless headphone models, scoring each on sound quality, noise cancellation, and all-day comfort.",
      picks: [
        {
          rank: 1,
          productId: "sony-wh1000xm5",
          award: "Best Overall",
          bestFor: "Most people",
          rationale:
            "The perfect balance of sound quality, noise cancellation, comfort, and battery life.",
        },
      ],
    },
    body: `Finding the right pair of wireless headphones can be overwhelming with so many options on the market. I've spent the last month testing the most popular models to help you make the right choice.

## What We Look For

When evaluating headphones, I focus on three key areas:

1. **Sound Quality** - Clarity, bass response, and soundstage
2. **Noise Cancellation** - How well it blocks outside noise
3. **Comfort & Battery** - Can you wear them all day?

## Our Top Pick: Sony WH-1000XM5

::product-card{id="sony-wh1000xm5"}

The Sony WH-1000XM5 continues to dominate the wireless headphone market. The sound quality is exceptional, with rich bass and crystal-clear highs.

:::pros-cons
pros:
- Industry-leading noise cancellation
- 30-hour battery life
- Multipoint Bluetooth connection
- Excellent call quality
- Lightweight and comfortable
cons:
- Premium price tag
- Don't fold flat for storage
- Touch controls can be finicky
:::

:::callout{type="tip" title="Pro Tip"}
If you're on a budget, the previous-generation XM4 is still an excellent choice and often goes on sale for $100 less.
:::

## What About Apple AirPods Max?

The AirPods Max are fantastic if you're deep in the Apple ecosystem. The build quality is unmatched, and the spatial audio is genuinely impressive. However, at their price point, the Sony XM5 offers better value for most people.

## Sound Quality Comparison

Here's how the top contenders stack up:

| Feature | Sony XM5 | AirPods Max | Bose QC Ultra |
|---------|----------|-------------|---------------|
| Battery | 30 hrs | 20 hrs | 24 hrs |
| Weight | 250g | 385g | 250g |
| ANC | Excellent | Excellent | Very Good |
| Price | $348 | $549 | $429 |

## The Bottom Line

For most people, the :product[Sony WH-1000XM5]{id="sony-wh1000xm5"} is the best wireless headphone you can buy today. It offers the perfect balance of sound quality, noise cancellation, comfort, and battery life.`,
  },
  {
    id: "best-portable-ssds-guide",
    type: "roundup",
    slug: "best-portable-ssds-guide",
    title: "Best Portable SSDs in 2025: A Buyer's Guide",
    dek: "Need fast, reliable external storage? We compare the top portable SSDs to help you pick the right one for your needs and budget.",
    category: "guides",
    verdict_score: null,
    date: "2025-01-20",
    tags: [["storage", "Storage"], ["ssd", "SSD"], ["portable", "Portable"], ["buying-guide", "Buying Guide"]],
    products: [["samsung-t7-ssd", "primary"]],
    structured: {
      criteria: ["Speed", "Capacity", "Durability", "Size"],
      howWeChose:
        "We weighed real-world transfer speeds, capacity value, durability ratings, and portability across the most popular portable SSDs.",
      picks: [
        {
          rank: 1,
          productId: "samsung-t7-ssd",
          award: "Best Overall",
          bestFor: "Most people",
          rationale:
            "The perfect balance of speed, size, reliability, and price.",
        },
      ],
    },
    // NOTE: legacy MDX referenced productId "samsung-t7" (a dangling ID that
    // silently killed monetization). Corrected here to "samsung-t7-ssd".
    body: `Whether you're a photographer backing up shoots, a video editor working with large files, or just someone who needs reliable portable storage, a good portable SSD is essential.

## What to Look For

Before diving into recommendations, here's what matters:

- **Speed:** Look for USB 3.2 Gen 2 (10Gbps) or Thunderbolt
- **Capacity:** 1TB is the sweet spot for most people
- **Durability:** Drop resistance and water/dust ratings
- **Size:** Smaller is better for portability

## Our Top Pick: Samsung T7

::product-card{id="samsung-t7-ssd"}

The Samsung T7 has been our go-to recommendation for two years running. It offers excellent speeds (up to 1,050 MB/s), a compact aluminum design, and competitive pricing.

:::pros-cons
pros:
- Fast read/write speeds up to 1,050 MB/s
- Compact, lightweight design
- Optional fingerprint security (T7 Touch)
- 3-year warranty
- Available in multiple colors
cons:
- No IP rating for water/dust resistance
- Gets warm under sustained transfers
- USB-C to USB-A cable sold separately
:::

## Speed Comparison

| Drive | Read Speed | Write Speed | Interface | Price (1TB) |
|-------|-----------|-------------|-----------|-------------|
| Samsung T7 | 1,050 MB/s | 1,000 MB/s | USB 3.2 Gen 2 | $109 |
| SanDisk Extreme | 1,050 MB/s | 1,000 MB/s | USB 3.2 Gen 2 | $99 |
| WD My Passport | 1,050 MB/s | 1,000 MB/s | USB 3.2 Gen 2 | $119 |

:::callout{type="warning" title="Important"}
Always safely eject your drive before disconnecting. Pulling the cable while data is being written can corrupt your files.
:::

## The Bottom Line

For most people, the :product[Samsung T7]{id="samsung-t7-ssd"} is the best portable SSD you can buy. It strikes the perfect balance of speed, size, reliability, and price.

If durability is your top priority, consider the Samsung T7 Shield, which adds IP65 water and dust resistance.`,
  },
];

// ------------------------------------------------------------- emit SQL
const out = [];
out.push("-- 0004_seed — one-time legacy import (generated by scripts/seed.mjs).");
out.push("-- Author, Amazon affiliate profile, 6 products + Amazon links, 3 posts.\n");

out.push(
  `INSERT INTO authors (id, slug, name, email, bio, title, same_as_json, is_owner, created_at, updated_at) VALUES (${q(author.id)}, ${q(author.slug)}, ${q(author.name)}, ${q(author.email)}, ${q(author.bio)}, ${q(author.title)}, ${json(author.same_as)}, ${author.is_owner}, ${q(NOW)}, ${q(NOW)});`,
);

for (const p of profiles) {
  out.push(
    `INSERT INTO affiliate_profiles (id, name, network, tracking_tag, link_rules_json, is_active, created_at, updated_at) VALUES (${q(p.id)}, ${q(p.name)}, ${q(p.network)}, ${q(p.tracking_tag)}, ${json(p.link_rules)}, 1, ${q(NOW)}, ${q(NOW)});`,
  );
}

const tagSet = new Map();
for (const pr of products) {
  out.push(
    `INSERT INTO products (id, name, brand, category, price_cents, currency, price_source, rating, description, pros_json, cons_json, specs_json, created_at, updated_at) VALUES (${q(pr.id)}, ${q(pr.name)}, ${q(pr.brand)}, ${q(pr.category)}, ${n(Math.round(pr.price * 100))}, 'USD', 'manual', ${n(pr.rating)}, ${q(pr.description)}, ${json(pr.pros)}, ${json(pr.cons)}, ${json(pr.specs)}, ${q(NOW)}, ${q(NOW)});`,
  );
  out.push(
    `INSERT INTO product_links (id, product_id, affiliate_profile_id, base_url, is_primary, created_at, updated_at) VALUES (${q("pl-" + pr.id + "-amazon")}, ${q(pr.id)}, 'amazon-main', ${q(pr.amazon)}, 1, ${q(NOW)}, ${q(NOW)});`,
  );
}

for (const post of posts) {
  const pubAt = `${post.date}T00:00:00.000Z`;
  out.push(
    `INSERT INTO content (id, type, status, slug, title, dek, category, author_id, verdict_score, body_md, structured_json, seo_title, seo_description, published_at, created_at, updated_at) VALUES (${q(post.id)}, ${q(post.type)}, 'published', ${q(post.slug)}, ${q(post.title)}, ${q(post.dek)}, ${q(post.category)}, 'alex', ${n(post.verdict_score)}, ${q(post.body)}, ${json(post.structured)}, ${q(post.title)}, ${q(post.dek)}, ${q(pubAt)}, ${q(pubAt)}, ${q(pubAt)});`,
  );
  post.products.forEach(([pid, role], i) => {
    out.push(
      `INSERT INTO content_products (content_id, product_id, role, position, affiliate_profile_id) VALUES (${q(post.id)}, ${q(pid)}, ${q(role)}, ${i}, 'amazon-main');`,
    );
  });
  for (const [slug, name] of post.tags) {
    tagSet.set(slug, name);
    out.push(`INSERT OR IGNORE INTO tags (slug, name) VALUES (${q(slug)}, ${q(name)});`);
    out.push(
      `INSERT INTO content_tags (content_id, tag_slug) VALUES (${q(post.id)}, ${q(slug)});`,
    );
  }
  const bodyText = toPlainText(post.body);
  const tagText = post.tags.map((t) => t[1]).join(" ");
  out.push(
    `INSERT INTO content_fts (content_id, title, dek, body_text, tags) VALUES (${q(post.id)}, ${q(post.title)}, ${q(post.dek)}, ${q(bodyText)}, ${q(tagText)});`,
  );
}

const dir = dirname(fileURLToPath(import.meta.url));
const target = join(dir, "..", "migrations", "0004_seed.sql");
writeFileSync(target, out.join("\n") + "\n", "utf8");
console.log(`Wrote ${target} (${out.length} statements).`);
