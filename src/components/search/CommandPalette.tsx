import { useEffect, useRef, useState } from "react";

interface Hit {
  slug: string;
  title: string;
  dek: string | null;
  category: string | null;
  snippet: string;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    function onTrigger(e: Event) {
      e.preventDefault();
      setOpen(true);
    }
    document.addEventListener("keydown", onKey);
    const triggers = Array.from(document.querySelectorAll("[data-search-trigger]"));
    triggers.forEach((el) => el.addEventListener("click", onTrigger));
    return () => {
      document.removeEventListener("keydown", onKey);
      triggers.forEach((el) => el.removeEventListener("click", onTrigger));
    };
  }, []);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 20);
      return () => clearTimeout(t);
    }
    setQ("");
    setHits([]);
    setActive(0);
  }, [open]);

  useEffect(() => {
    if (q.trim().length < 2) {
      setHits([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const d = (await r.json()) as { results: Hit[] };
        setHits(d.results ?? []);
        setActive(0);
      } catch {
        /* ignore */
      }
    }, 150);
    return () => clearTimeout(t);
  }, [q]);

  function go(slug: string) {
    window.location.href = `/${slug}`;
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, hits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && hits[active]) {
      e.preventDefault();
      go(hits[active].slug);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-lg)]"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search reviews, guides, products…"
          aria-label="Search query"
          className="w-full border-b border-line bg-transparent px-5 py-4 text-ink outline-none placeholder:text-muted"
        />
        <ul className="max-h-[60vh] overflow-y-auto">
          {hits.map((h, i) => (
            <li key={h.slug}>
              <a
                href={`/${h.slug}`}
                onMouseEnter={() => setActive(i)}
                className={`block px-5 py-3 transition ${i === active ? "bg-surface-2" : ""}`}
              >
                {h.category && (
                  <span className="text-xs font-semibold uppercase tracking-wide text-accent-strong">
                    {h.category}
                  </span>
                )}
                <p className="font-medium text-ink">{h.title}</p>
              </a>
            </li>
          ))}
          {q.trim().length >= 2 && hits.length === 0 && (
            <li className="px-5 py-6 text-sm text-muted">No results.</li>
          )}
        </ul>
        <div className="flex items-center justify-between border-t border-line px-5 py-2 text-xs text-muted">
          <span>↑↓ navigate · ↵ open</span>
          <span>esc to close</span>
        </div>
      </div>
    </div>
  );
}
