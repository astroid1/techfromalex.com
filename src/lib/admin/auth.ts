import { NextRequest } from "next/server";
import { importSPKI, jwtVerify, type JWTPayload } from "jose";

// Cloudflare Access configuration
const CF_ACCESS_TEAM_DOMAIN = process.env.CF_ACCESS_TEAM_DOMAIN || ""; // e.g. "myteam" (from myteam.cloudflareaccess.com)
const CF_ACCESS_AUD = process.env.CF_ACCESS_AUD || ""; // Application Audience (AUD) Tag
const CF_ACCESS_COOKIE = "CF_Authorization";

// Allowed admin emails - comma-separated in env
const ALLOWED_EMAILS = (process.env.CF_ACCESS_ALLOWED_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export interface CFAccessIdentity {
  email: string;
  sub: string;
  iat: number;
  exp: number;
}

// Cache for Cloudflare public keys
let cachedCerts: { keys: JsonWebKey[]; fetchedAt: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function getPublicKeys(): Promise<JsonWebKey[]> {
  if (cachedCerts && Date.now() - cachedCerts.fetchedAt < CACHE_TTL) {
    return cachedCerts.keys;
  }

  const certsUrl = `https://${CF_ACCESS_TEAM_DOMAIN}.cloudflareaccess.com/cdn-cgi/access/certs`;
  const res = await fetch(certsUrl);

  if (!res.ok) {
    throw new Error(`Failed to fetch Cloudflare Access certs: ${res.status}`);
  }

  const data = await res.json();
  cachedCerts = { keys: data.keys, fetchedAt: Date.now() };
  return data.keys;
}

async function verifyToken(token: string): Promise<CFAccessIdentity | null> {
  if (!CF_ACCESS_TEAM_DOMAIN || !CF_ACCESS_AUD) {
    console.warn("[CF Access] Missing CF_ACCESS_TEAM_DOMAIN or CF_ACCESS_AUD");
    return null;
  }

  try {
    const keys = await getPublicKeys();

    // Try each key until one works (Cloudflare rotates keys)
    for (const jwk of keys) {
      try {
        // Convert JWK to key object
        const spki = jwk as Record<string, unknown>;
        if (spki.kty !== "RSA") continue;

        const publicKey = await importSPKI(
          await jwkToPem(jwk),
          "RS256"
        );

        const { payload } = await jwtVerify(token, publicKey, {
          audience: CF_ACCESS_AUD,
          issuer: `https://${CF_ACCESS_TEAM_DOMAIN}.cloudflareaccess.com`,
        });

        return payload as unknown as CFAccessIdentity;
      } catch {
        // Try next key
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error("[CF Access] Token verification failed:", error);
    return null;
  }
}

// Convert JWK to PEM format for jose
async function jwkToPem(jwk: JsonWebKey): Promise<string> {
  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    true,
    ["verify"]
  );
  const exported = await crypto.subtle.exportKey("spki", key);
  const b64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
  const pem = `-----BEGIN PUBLIC KEY-----\n${b64.match(/.{1,64}/g)!.join("\n")}\n-----END PUBLIC KEY-----`;
  return pem;
}

export async function getIdentityFromRequest(
  request: NextRequest
): Promise<CFAccessIdentity | null> {
  const token =
    request.cookies.get(CF_ACCESS_COOKIE)?.value ||
    request.headers.get("Cf-Access-Jwt-Assertion") ||
    null;

  if (!token) return null;

  return verifyToken(token);
}

export async function isAuthenticatedFromRequest(
  request: NextRequest
): Promise<boolean> {
  // In development without CF Access configured, fall back to env password
  if (!CF_ACCESS_TEAM_DOMAIN || !CF_ACCESS_AUD) {
    return checkDevAuth(request);
  }

  const identity = await getIdentityFromRequest(request);
  if (!identity) return false;

  // If allowed emails are configured, check against them
  if (ALLOWED_EMAILS.length > 0) {
    return ALLOWED_EMAILS.includes(identity.email.toLowerCase());
  }

  // If no email allowlist, any valid CF Access token is allowed
  // (access policy is managed in Cloudflare dashboard)
  return true;
}

// Development fallback - simple password auth when CF Access isn't configured
function checkDevAuth(request: NextRequest): boolean {
  const devPassword = process.env.ADMIN_PASSWORD;
  if (!devPassword) {
    // No auth configured at all - allow in development
    return process.env.NODE_ENV === "development";
  }

  const session = request.cookies.get("admin_session");
  if (!session) return false;

  // Simple hash check for dev mode
  let hash = 0;
  const str = devPassword + "techfromalex-salt";
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return session.value === Math.abs(hash).toString(36);
}

export function getCFLogoutUrl(): string {
  if (!CF_ACCESS_TEAM_DOMAIN) return "/admin/login";
  return `https://${CF_ACCESS_TEAM_DOMAIN}.cloudflareaccess.com/cdn-cgi/access/logout`;
}

export function isCFAccessConfigured(): boolean {
  return Boolean(CF_ACCESS_TEAM_DOMAIN && CF_ACCESS_AUD);
}
