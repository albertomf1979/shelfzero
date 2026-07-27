import { useState } from "react";

/**
 * Colores de lomo para los libros sin portada, estables por título.
 * Todos cumplen ≥4.5:1 con `paper` (#f4ecdd) como color de texto.
 */
const SPINES = [
  "#9a3b32", "#7a5a3a", "#3f5c53", "#4a4a6a",
  "#7d6029", "#5c3b52", "#2f5a6b", "#6b3b2f",
];

function spineColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return SPINES[Math.abs(hash) % SPINES.length];
}

/** El título manda el tamaño: cuanto más largo, más pequeño. */
function titleSize(title: string): string {
  if (title.length <= 18) return "text-base";
  if (title.length <= 40) return "text-meta";
  return "text-[0.6875rem]";
}

type Props = {
  url?: string | null;
  title: string;
  authors?: string[];
  className?: string;
  loading?: "lazy" | "eager";
};

/** Portada del libro; si no hay imagen, compone una cubierta tipográfica. */
export function Cover({
  url,
  title,
  authors,
  className = "",
  loading = "lazy",
}: Props) {
  const [failed, setFailed] = useState(false);

  if (url && !failed) {
    return (
      <img
        src={url}
        alt={`Portada de ${title}`}
        loading={loading}
        decoding="async"
        onError={() => setFailed(true)}
        className={`bg-paper-3 object-cover object-center ${className}`}
      />
    );
  }

  // Cubierta generada: papel teñido, filete, título centrado y sello editorial.
  const bg = spineColor(title);
  return (
    <div
      className={`relative flex flex-col justify-between overflow-hidden p-2 text-paper ${className}`}
      style={{
        backgroundColor: bg,
        backgroundImage:
          "repeating-linear-gradient(0deg, rgb(255 255 255 / 0.045) 0 1px, transparent 1px 3px)," +
          "radial-gradient(circle at 30% 12%, rgb(255 255 255 / 0.14), transparent 60%)",
      }}
      role="img"
      aria-label={`Portada de ${title}`}
    >
      <div aria-hidden="true" className="mt-1 border-y border-paper/35 py-[3px]">
        <div className="h-px bg-paper/25" />
      </div>

      <p
        className={`line-clamp-4 px-1 text-center font-display font-medium leading-tight text-balance [text-shadow:0_1px_0_rgb(0_0_0/0.25)] ${titleSize(
          title
        )}`}
      >
        {title}
      </p>

      <p className="truncate px-1 text-center text-[0.625rem] uppercase tracking-[0.12em] text-paper/85">
        {authors?.[0] ?? "Autor desconocido"}
      </p>

      <span
        aria-hidden="true"
        className="absolute bottom-1 right-1 font-display text-[0.5rem] text-paper/50"
      >
        S0
      </span>
    </div>
  );
}
