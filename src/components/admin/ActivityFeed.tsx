interface ActivityItem {
  type: string;
  description: string;
  timestamp: string;
}

interface ActivityFeedProps {
  items: ActivityItem[];
}

const typeStyles: Record<string, { bg: string; text: string }> = {
  pageview: { bg: "bg-accent/10", text: "text-accent" },
  click: { bg: "bg-success/10", text: "text-success" },
  subscriber: { bg: "bg-warning/10", text: "text-warning" },
};

export function ActivityFeed({ items }: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-medium text-muted">Recent Activity</h3>
        <p className="text-center text-sm text-muted">No activity yet. Analytics will appear here as visitors interact with your site.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="mb-4 text-sm font-medium text-muted">Recent Activity</h3>
      <div className="space-y-3">
        {items.map((item, i) => {
          const style = typeStyles[item.type] || typeStyles.pageview;
          return (
            <div key={i} className="flex items-start gap-3">
              <div className={`mt-0.5 rounded-full p-1 ${style.bg}`}>
                <div className={`h-2 w-2 rounded-full ${style.text} bg-current`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm text-foreground">{item.description}</p>
                <p className="text-xs text-muted">
                  {new Date(item.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
