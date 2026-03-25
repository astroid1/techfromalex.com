"use client";

interface MiniChartProps {
  data: { date: string; count: number }[];
  color?: string;
  height?: number;
  label: string;
}

export function MiniChart({ data, color = "var(--accent)", height = 200, label }: MiniChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-border bg-card p-6" style={{ height }}>
        <p className="text-sm text-muted">No data yet</p>
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.count), 1);
  const barWidth = Math.max(100 / data.length - 1, 2);

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="mb-4 text-sm font-medium text-muted">{label}</h3>
      <div className="flex items-end gap-[2px]" style={{ height: height - 80 }}>
        {data.map((d, i) => (
          <div
            key={i}
            className="group relative flex-1 rounded-t transition-opacity hover:opacity-80"
            style={{
              height: `${(d.count / max) * 100}%`,
              minHeight: d.count > 0 ? 4 : 1,
              backgroundColor: d.count > 0 ? color : "var(--border)",
              maxWidth: `${barWidth}%`,
            }}
          >
            <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-1 text-xs text-background opacity-0 transition-opacity group-hover:opacity-100">
              {d.count} - {d.date}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}
