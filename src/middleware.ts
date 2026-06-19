import { defineMiddleware } from "astro:middleware";
import { createRemoteJWKSet, jwtVerify } from "jose";

const ADMIN_RE = /^\/(admin|api\/admin)(\/|$)/;

// JWKS set is cached per team domain across requests.
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
let jwksTeam = "";

function parseCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

/** Constant-time string compare (avoids leaking length-independent timing). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

/** Machine bearer token (central dashboard) for /api/admin. Only honored when
 *  DASHBOARD_ADMIN_TOKEN is configured; otherwise machine access is disabled. */
function machineAuthed(request: Request, token: string | undefined): boolean {
  if (!token) return false;
  const hdr = request.headers.get("Authorization") ?? "";
  const m = hdr.match(/^Bearer\s+(.+)$/i);
  return Boolean(m && safeEqual(m[1].trim(), token.trim()));
}

export const onRequest = defineMiddleware(async (ctx, next) => {
  const url = new URL(ctx.request.url);
  if (!ADMIN_RE.test(url.pathname)) return next();

  const env = ctx.locals.runtime?.env as Env | undefined;
  const TEAM = env?.CF_ACCESS_TEAM_DOMAIN;
  const AUD = env?.CF_ACCESS_AUD;
  const ALLOWED = env?.ADMIN_EMAIL;

  // Local-dev bypass (only ever set in .dev.vars, never in the deployed Worker).
  if (env?.DEV_AUTH_BYPASS === "1") {
    ctx.locals.user = { email: ALLOWED ?? "dev@local", name: "Alex (dev)", sub: "dev" };
    return next();
  }

  // Machine access: the central Astroid dashboard calls /api/admin endpoints
  // with a shared bearer token. Scoped to the API namespace only — never the
  // interactive /admin HTML pages.
  if (
    url.pathname.startsWith("/api/admin") &&
    machineAuthed(ctx.request, env?.DASHBOARD_ADMIN_TOKEN)
  ) {
    ctx.locals.user = {
      email: ALLOWED ?? "dashboard@astroidmedia.com",
      name: "Dashboard",
      sub: "machine",
    };
    return next();
  }

  // Fail closed: if Access isn't configured yet, the admin is locked.
  if (!TEAM || !AUD || !ALLOWED) {
    return new Response(
      "Admin is not configured yet. Set CF_ACCESS_TEAM_DOMAIN, CF_ACCESS_AUD and ADMIN_EMAIL, and place a Cloudflare Access policy in front of /admin.",
      { status: 503, headers: { "content-type": "text/plain" } },
    );
  }

  const token =
    ctx.request.headers.get("Cf-Access-Jwt-Assertion") ??
    parseCookie(ctx.request.headers.get("Cookie"), "CF_Authorization");
  if (!token) return new Response("Unauthorized", { status: 401 });

  if (!jwks || jwksTeam !== TEAM) {
    jwks = createRemoteJWKSet(new URL(`${TEAM}/cdn-cgi/access/certs`));
    jwksTeam = TEAM;
  }

  try {
    const { payload } = await jwtVerify(token, jwks, { issuer: TEAM, audience: AUD });
    if (payload.email !== ALLOWED) {
      return new Response("Forbidden", { status: 403 });
    }
    ctx.locals.user = {
      email: payload.email as string,
      name: (payload.name as string) ?? (payload.email as string),
      sub: (payload.sub as string) ?? "",
    };
    return next();
  } catch {
    return new Response("Unauthorized (invalid Access token)", { status: 401 });
  }
});
