"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/admin";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push(from);
        router.refresh();
      } else {
        setError(data.error || "Invalid password");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-lg border border-border bg-card p-8">
          <h1 className="mb-1 text-2xl font-bold text-foreground">Admin Login</h1>
          <p className="mb-6 text-sm text-muted">
            Development mode. In production, authentication is handled by Cloudflare Access.
          </p>

          <form onSubmit={handleSubmit}>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-4 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              placeholder="Enter admin password"
              autoFocus
            />

            {error && (
              <p className="mb-4 text-sm text-danger">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 rounded-md bg-background p-3">
            <p className="text-xs text-muted">
              <strong className="text-foreground">Production setup:</strong> Configure Cloudflare Access
              with <code className="rounded bg-card-hover px-1">CF_ACCESS_TEAM_DOMAIN</code> and{" "}
              <code className="rounded bg-card-hover px-1">CF_ACCESS_AUD</code> environment variables
              to enable email-based OTP login.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
