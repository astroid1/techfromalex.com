interface YouTubeEmbedProps {
  id: string;
  title?: string;
}

export function YouTubeEmbed({
  id,
  title = "YouTube video player",
}: YouTubeEmbedProps) {
  return (
    <div className="my-6 overflow-hidden rounded-lg">
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube.com/embed/${id}`}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}
