/// <reference types="astro/client" />

type D1Database = import("@cloudflare/workers-types").D1Database;
type R2Bucket = import("@cloudflare/workers-types").R2Bucket;
type KVNamespace = import("@cloudflare/workers-types").KVNamespace;
type Fetcher = import("@cloudflare/workers-types").Fetcher;

interface Env {
  // Bindings (wrangler.toml)
  DB: D1Database;
  MEDIA: R2Bucket;
  RENDER_CACHE: KVNamespace;
  ASSETS: Fetcher;
  // Vars
  ADMIN_EMAIL: string;
  SITE_URL: string;
  APIFY_AMAZON_ACTOR?: string;
  // Secrets (wrangler secret put) — present at runtime in prod
  ANTHROPIC_API_KEY?: string;
  APIFY_TOKEN?: string;
  CF_ACCESS_TEAM_DOMAIN?: string;
  CF_ACCESS_AUD?: string;
  DEV_AUTH_BYPASS?: string;
}

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {
    user?: { email: string; name: string; sub: string };
  }
}
