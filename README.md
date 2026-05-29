This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses the [`geist`](https://www.npmjs.com/package/geist) font package, which self-hosts the [Geist](https://vercel.com/font) font family (no build-time network fetch from Google Fonts).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Cloudflare Workers

This site is deployed to **Cloudflare Workers** using the
[OpenNext Cloudflare adapter](https://opennext.js.org/cloudflare)
(`@opennextjs/cloudflare`). It runs the full Next.js app — SSR pages, SSG,
and the `/api/*` routes — on the Workers runtime.

### Relevant files

- `wrangler.jsonc` — Worker config (`nodejs_compat` flag, assets binding).
- `open-next.config.ts` — OpenNext adapter configuration.
- `next.config.ts` — calls `initOpenNextCloudflareForDev()` so Cloudflare
  bindings work during `next dev`.

### Commands

```bash
# Local Next.js dev server (Node runtime)
npm run dev

# Build + preview in the Workers (workerd) runtime locally
npm run preview

# Build + deploy to Cloudflare
npm run deploy
```

The build runs Velite first (`velite && next build`) to generate content from
`content/` before Next builds.

### First-time setup / deploy

1. Authenticate Wrangler with your Cloudflare account: `npx wrangler login`.
2. Set build-time environment variables (the `NEXT_PUBLIC_*` values from
   `.env.example`). Locally these come from `.env`/`.env.local`; for
   [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/)
   set them under **Build variables and secrets** in the Cloudflare dashboard.
3. Run `npm run deploy`, or connect the GitHub repo to Workers Builds for
   automatic deploys on push.

### Migrating away from Vercel

The repo no longer contains any Vercel-specific configuration. To complete the
move, disconnect the Vercel Git integration and repoint the domain's DNS to the
Cloudflare Worker (via a custom domain / route in the Cloudflare dashboard).

## Learn More about Next.js

- [Next.js Documentation](https://nextjs.org/docs)
- [OpenNext for Cloudflare](https://opennext.js.org/cloudflare)
- [Cloudflare Workers framework guide: Next.js](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
