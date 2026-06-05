import type { APIRoute } from "astro";
import { getDB } from "@/lib/db";
import { resolveBuyTarget, logClick, type ResolvedTarget } from "@/lib/clicks";

export const prerender = false;

/**
 * First-party affiliate-click redirect + tracker.
 * Takes ids (never a target URL), rebuilds the tagged affiliate URL server-side,
 * logs the click, and 302s. No open-redirect surface: the destination is only
 * ever a buildAffiliateUrl output for a product/program in our DB, or "/".
 */
export const GET: APIRoute = async ({ locals, url, request }) => {
  const sp = url.searchParams;
  const type = sp.get("t") === "g" ? "program" : "product";
  const id = sp.get("id") ?? "";
  const network = sp.get("net");
  const host = sp.get("h");
  const placement = sp.get("pl");
  const posRaw = sp.get("pos");
  const position = posRaw && /^\d+$/.test(posRaw) ? Number(posRaw) : null;

  const db = getDB(locals);
  // A read failure must degrade to a safe redirect, never 500 mid-click.
  let target: ResolvedTarget | null = null;
  try {
    target = id ? await resolveBuyTarget(db, { type, id, network, host }) : null;
  } catch {
    target = null;
  }

  if (target) {
    let sourcePath: string | null = null;
    const ref = request.headers.get("referer");
    if (ref) {
      try {
        sourcePath = new URL(ref).pathname;
      } catch {
        sourcePath = null;
      }
    }
    // Log out of band so the redirect is instant.
    const log = logClick(db, {
      targetType: type,
      targetId: id,
      network: target.network,
      sourcePath,
      placement,
      position,
    }).catch(() => {});
    const ctx = (locals as any).runtime?.ctx;
    if (ctx?.waitUntil) ctx.waitUntil(log);
    else await log;
  }

  return new Response(null, {
    status: 302,
    headers: { Location: target?.url ?? "/", "cache-control": "no-store" },
  });
};
