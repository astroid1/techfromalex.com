import Link from "next/link";
import { siteConfig } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {/* Site info */}
          <div>
            <Link
              href="/"
              className="text-lg font-bold text-foreground transition-colors hover:text-accent"
            >
              {siteConfig.name}
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">
              {siteConfig.description}
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Links</h3>
            <ul className="mt-2 space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/deals"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Deals
                </Link>
              </li>
            </ul>
          </div>

          {/* Built with */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Built with</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Built with Next.js, Tailwind CSS, and Velite.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} {siteConfig.name}. All rights
          reserved.
        </div>
      </div>
    </footer>
  );
}
