interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: string;
}

export function StatCard({ title, value, change, changeType = "neutral", icon }: StatCardProps) {
  const changeColor = {
    positive: "text-success",
    negative: "text-danger",
    neutral: "text-muted",
  }[changeType];

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted">{title}</p>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted"
        >
          <path d={icon} />
        </svg>
      </div>
      <p className="mt-2 text-3xl font-bold text-foreground">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {change && (
        <p className={`mt-1 text-xs ${changeColor}`}>{change}</p>
      )}
    </div>
  );
}
