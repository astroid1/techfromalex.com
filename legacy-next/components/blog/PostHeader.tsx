import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TagBadge } from "./TagBadge";

interface PostHeaderProps {
  title: string;
  date: string;
  author: string;
  category: string;
  tags: string[];
  readingTime: number;
  image?: string;
  imageAlt?: string;
  updated?: string;
}

export function PostHeader({
  title,
  date,
  author,
  category,
  tags,
  readingTime,
  image,
  imageAlt,
  updated,
}: PostHeaderProps) {
  return (
    <header className="mb-8 space-y-4">
      <Badge variant="secondary" className="capitalize">
        {category}
      </Badge>

      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h1>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
        <span>{author}</span>
        <span aria-hidden="true">-</span>
        <time dateTime={date}>{formatDate(date)}</time>
        {updated && (
          <>
            <span aria-hidden="true">-</span>
            <span>Updated {formatDate(updated)}</span>
          </>
        )}
        <span aria-hidden="true">-</span>
        <span>{readingTime} min read</span>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
        </div>
      )}

      {image && (
        <div className="overflow-hidden rounded-lg">
          <img
            src={image}
            alt={imageAlt || title}
            className="w-full rounded-lg object-cover"
          />
        </div>
      )}
    </header>
  );
}
