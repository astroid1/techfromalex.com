import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {};

export default nextConfig;

// Enable Cloudflare bindings during `next dev`. Velite content generation runs
// as an explicit step in the `dev`/`build` npm scripts (see package.json).
initOpenNextCloudflareForDev();
