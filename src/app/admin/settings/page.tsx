"use client";

import { useEffect, useState } from "react";

interface Settings {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  author: string;
  twitterHandle: string;
  githubUrl: string;
  amazonTag: string;
  bestBuyAffId: string;
  newsletterProvider: string;
  analyticsEnabled: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then(setSettings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function updateField(field: keyof Settings, value: string | boolean) {
    setSettings((prev) => (prev ? { ...prev, [field]: value } : prev));
    setSaved(false);
  }

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <div className="h-96 animate-pulse rounded-lg border border-border bg-card" />
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted">Manage your site configuration</p>
      </div>

      {/* General */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">General</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Site Name</label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => updateField("siteName", e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Site Description</label>
            <textarea
              value={settings.siteDescription}
              onChange={(e) => updateField("siteDescription", e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              rows={2}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Site URL</label>
              <input
                type="url"
                value={settings.siteUrl}
                onChange={(e) => updateField("siteUrl", e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Author</label>
              <input
                type="text"
                value={settings.author}
                onChange={(e) => updateField("author", e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Social */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Social & Links</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Twitter Handle</label>
            <div className="flex">
              <span className="inline-flex items-center rounded-l-md border border-r-0 border-border bg-card px-3 text-sm text-muted">@</span>
              <input
                type="text"
                value={settings.twitterHandle}
                onChange={(e) => updateField("twitterHandle", e.target.value)}
                className="w-full rounded-r-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">GitHub URL</label>
            <input
              type="url"
              value={settings.githubUrl}
              onChange={(e) => updateField("githubUrl", e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            />
          </div>
        </div>
      </section>

      {/* Affiliate */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Affiliate Settings</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Amazon Associates Tag</label>
            <input
              type="text"
              value={settings.amazonTag}
              onChange={(e) => updateField("amazonTag", e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              placeholder="your-tag-20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Best Buy Affiliate ID</label>
            <input
              type="text"
              value={settings.bestBuyAffId}
              onChange={(e) => updateField("bestBuyAffId", e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            />
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Integrations</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Newsletter Provider</label>
            <select
              value={settings.newsletterProvider}
              onChange={(e) => updateField("newsletterProvider", e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            >
              <option value="none">None (store locally)</option>
              <option value="mailchimp">Mailchimp</option>
              <option value="convertkit">ConvertKit</option>
              <option value="buttondown">Buttondown</option>
            </select>
          </div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.analyticsEnabled}
              onChange={(e) => updateField("analyticsEnabled", e.target.checked)}
              className="h-4 w-4 rounded border-border accent-accent"
            />
            <span className="text-sm font-medium text-foreground">Enable analytics tracking</span>
          </label>
        </div>
      </section>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-accent px-6 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
        {saved && <span className="text-sm text-success">Settings saved!</span>}
      </div>
    </div>
  );
}
