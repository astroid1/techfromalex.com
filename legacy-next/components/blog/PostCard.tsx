import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface PostCardProps {
  title: string;
  slug: string;
  description: string;
  date: string;
  category: string;
  image?: string;
  imageAlt?: string;
  readingTime: number;
}

export function PostCard({
  title,
  slug,
  description,
  date,
  category,
  image,
  imageAlt,
  readingTime,
}: PostCardProps) {
  return (
    <Link href={`/blog/${slug}`} className="group block">
      <article className="h-full overflow-hidden rounded-lg border border-border bg-card transition-colors hover:bg-card-hover">
        {image && (
          <div className="aspect-video overflow-hidden">
            <img
              src={image}
              alt={imageAlt || title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        )}
        <div className="flex flex-col gap-2 p-4">
          <Badge variant="secondary" className="w-fit capitalize">
            {category}
          </Badge>
          <h2 className="line-clamp-2 text-lg font-semibold text-foreground transition-colors group-hover:text-accent">
            {title}
          </h2>
          <p className="line-clamp-2 text-sm text-muted">{description}</p>
          <div className="mt-auto flex items-center gap-2 pt-2 text-xs text-muted-foreground">
            <time dateTime={date}>{formatDate(date)}</time>
            <span aria-hidden="true">-</span>
            <span>{readingTime} min read</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
