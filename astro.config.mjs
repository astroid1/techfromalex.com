// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://techfromalex.com",
  output: "server",
  adapter: cloudflare({
    imageService: "cloudflare",
    // Expose Cloudflare bindings (D1/R2/KV) to `astro dev` via wrangler config.
    platformProxy: { enabled: true },
  }),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
