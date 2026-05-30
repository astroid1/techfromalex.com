import { cn } from "@/lib/utils";

interface CalloutProps {
  type?: "info" | "warning" | "danger" | "tip";
  title?: string;
  children: React.ReactNode;
}

const calloutConfig = {
  info: {
    icon: "\u{1F4A1}",
    border: "border-l-info",
    bg: "bg-info/10",
  },
  warning: {
    icon: "\u26A0\uFE0F",
    border: "border-l-warning",
    bg: "bg-warning/10",
  },
  danger: {
    icon: "\u{1F6A8}",
    border: "border-l-danger",
    bg: "bg-danger/10",
  },
  tip: {
    icon: "\u2705",
    border: "border-l-success",
    bg: "bg-success/10",
  },
} as const;

export function Callout({ type = "info", title, children }: CalloutProps) {
  const config = calloutConfig[type];

  return (
    <div
      className={cn(
        "my-6 rounded-r-lg border-l-4 p-4",
        config.border,
        config.bg
      )}
    >
      <div className="flex gap-3">
        <span className="shrink-0 text-lg" aria-hidden="true">
          {config.icon}
        </span>
        <div className="min-w-0">
          {title && (
            <p className="mb-1 font-semibold text-foreground">{title}</p>
          )}
          <div className="text-sm text-foreground/90 [&>p]:m-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
