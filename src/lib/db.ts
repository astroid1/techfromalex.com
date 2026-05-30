/// <reference types="../env.d.ts" />

/** Resolve the Cloudflare runtime env from Astro locals. */
export function getEnv(locals: App.Locals): Env {
  const env = locals.runtime?.env;
  if (!env) {
    throw new Error(
      "Cloudflare runtime env unavailable (locals.runtime.env). " +
        "Run via `astro dev` (platformProxy) or a deployed Worker.",
    );
  }
  return env as Env;
}

/** Resolve the D1 binding. */
export function getDB(locals: App.Locals): D1Database {
  const db = getEnv(locals).DB;
  if (!db) {
    throw new Error("D1 binding 'DB' missing — check wrangler.toml [[d1_databases]].");
  }
  return db;
}

/** Parse a JSON TEXT column with a typed fallback. */
export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
