import { useState } from "react";

/** Colores de "lomo" para los libros sin portada, estables por título. */
const SPINES = [
  "#9a3b32", "#7a5a3a", "#3f5c53", "#4a4a6a",
  "#8a6b2f", "#5c3b52", "#2f5a6b", "#6b3b2f",
];

function spineColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return SPINES[Math.abs(hash) % SPINES.length];
}

type Props = {
  url?: string | null;
  title: string;
  authors?: string[];
  className?: string;
};

/** Portada del libro; si no hay imagen, dibuja una cubierta tipográfica. */
export function Cover({ url, title, authors, className = "" }: Props) {
  const [failed, setFailed] = useState(false);
  const showFallback = !url || failed;

  if (showFallback) {
    const bg = spineColor(title);
    return (
      <div
        className={`flex flex-col justify-between overflow-hidden rounded-sm p-3 text-left ${className}`}
        style={{
          background: `linear-gradient(135deg, ${bg} 0%, ${bg}dd 60%, ${bg}aa 100%)`,
        }}
        aria-label={`Portada de ${title}`}
      >
        <span className="font-display text-[0.95rem] leading-tight text-white/95 line-clamp-4">
          {title}
        </span>
        {authors?.[0] && (
          <span className="text-[0.7rem] leading-tight text-white/70 line-clamp-2">
            {authors[0]}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={`Portada de ${title}`}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`rounded-sm object-cover ${className}`}
    />
  );
}
