import Link from "next/link";
import { navItems, siteConfig } from "@/lib/constants";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { MobileNav } from "@/components/layout/MobileNav";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* Logo / Site name */}
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-foreground transition-colors hover:text-accent"
        >
          {siteConfig.name}
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden md:flex md:items-center md:gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right side: theme toggle + mobile nav */}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
