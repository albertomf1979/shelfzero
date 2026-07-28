import { useState } from "react";
import type { BookCandidate } from "../types";
import { Cover } from "./Cover";

/** ISBN-13 o ISBN-10 válidos, o un ASIN de Amazon (10 caracteres, empieza por B). */
function classifyId(raw: string): { isbn?: string; asin?: string; error?: string } {
  const v = raw.trim().toUpperCase();
  if (!v) return {};
  if (/^B[0-9A-Z]{9}$/.test(v)) return { asin: v };

  const digits = v.replace(/[^0-9X]/g, "");
  if (digits.length === 13 && /^\d{13}$/.test(digits)) {
    let sum = 0;
    for (let i = 0; i < 12; i++) sum += Number(digits[i]) * (i % 2 === 0 ? 1 : 3);
    if ((10 - (sum % 10)) % 10 !== Number(digits[12])) {
      return { error: "Ese ISBN-13 no cuadra. Revisa los dígitos." };
    }
    return { isbn: digits };
  }
  if (digits.length === 10 && /^\d{9}[\dX]$/.test(digits)) {
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += (i + 1) * Number(digits[i]);
    const check = digits[9] === "X" ? 10 : Number(digits[9]);
    if ((sum + 10 * check) % 11 !== 0) {
      return { error: "Ese ISBN-10 no cuadra. Revisa los dígitos." };
    }
    return { isbn: digits };
  }
  return { error: "No parece un ISBN ni un ASIN de Amazon." };
}

type Props = {
  /** Lo tecleado en la búsqueda, para no obligar a reescribir el título. */
  initialTitle?: string;
  onReady: (book: BookCandidate) => void;
};

/**
 * Alta a mano, para los libros que no están en ningún catálogo: es el caso
 * habitual de los autopublicados en Amazon KDP, que no llegan a Google Books
 * ni a Open Library. Con esto el estante no depende de la cobertura ajena.
 */
export function ManualForm({ initialTitle = "", onReady }: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [authors, setAuthors] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [publisher, setPublisher] = useState("");
  const [year, setYear] = useState("");
  const [subjects, setSubjects] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const id = classifyId(identifier);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("El título es obligatorio.");
      return;
    }
    if (id.error) {
      setError(id.error);
      return;
    }
    const añoNum = Number(year);
    onReady({
      title: title.trim(),
      authors: authors.split(",").map((a) => a.trim()).filter(Boolean),
      subjects: subjects.split(",").map((s) => s.trim()).filter(Boolean),
      isbn13: id.isbn?.length === 13 ? id.isbn : undefined,
      isbn10: id.isbn?.length === 10 ? id.isbn : undefined,
      asin: id.asin,
      publisher: publisher.trim() || undefined,
      publishedYear: Number.isFinite(añoNum) && añoNum > 0 ? añoNum : undefined,
      description: description.trim() || undefined,
      coverUrl: coverUrl.trim() || undefined,
      source: "manual",
    });
  }

  const campo =
    "min-h-11 w-full rounded-full border border-rule-strong bg-paper px-4 text-body outline-none transition placeholder:text-ink-faint/70 focus:border-spine";
  const etiqueta = "mb-1.5 block text-micro uppercase text-ink-faint";

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="rounded-xl border border-gold/40 bg-gold/10 p-3 text-meta text-ink-soft">
        Para libros que no están en los catálogos: autopublicados, ediciones
        pequeñas o descatalogados. Solo el título es obligatorio.
      </p>

      <div className="flex gap-4">
        <Cover
          url={coverUrl || null}
          title={title || "Sin título"}
          authors={authors ? [authors.split(",")[0]] : []}
          className="h-28 w-[4.75rem] shrink-0 rounded-sm shadow-cover"
        />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <label htmlFor="m-title" className={etiqueta}>
              Título <span className="normal-case">(obligatorio)</span>
            </label>
            <input
              id="m-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={campo}
              autoFocus
              required
            />
          </div>
          <div>
            <label htmlFor="m-authors" className={etiqueta}>
              Autor o autores
            </label>
            <input
              id="m-authors"
              value={authors}
              onChange={(e) => setAuthors(e.target.value)}
              placeholder="Separados por comas"
              className={campo}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="m-id" className={etiqueta}>
            ISBN o ASIN
          </label>
          <input
            id="m-id"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="9788499926223 o B0CH2K9L7T"
            className={campo}
            aria-invalid={!!id.error}
          />
          {id.error && identifier.trim() && (
            <p className="mt-1 px-4 text-meta text-danger">{id.error}</p>
          )}
          {id.asin && (
            <p className="mt-1 px-4 text-meta text-ink-faint">
              Reconocido como ASIN de Amazon.
            </p>
          )}
        </div>
        <div>
          <label htmlFor="m-year" className={etiqueta}>
            Año
          </label>
          <input
            id="m-year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            inputMode="numeric"
            placeholder="2026"
            className={campo}
          />
        </div>
        <div>
          <label htmlFor="m-publisher" className={etiqueta}>
            Editorial
          </label>
          <input
            id="m-publisher"
            value={publisher}
            onChange={(e) => setPublisher(e.target.value)}
            placeholder="Autopublicado"
            className={campo}
          />
        </div>
        <div>
          <label htmlFor="m-subjects" className={etiqueta}>
            Temática
          </label>
          <input
            id="m-subjects"
            value={subjects}
            onChange={(e) => setSubjects(e.target.value)}
            placeholder="Separadas por comas"
            className={campo}
          />
        </div>
      </div>

      <div>
        <label htmlFor="m-cover" className={etiqueta}>
          Dirección de la portada
        </label>
        <input
          id="m-cover"
          value={coverUrl}
          onChange={(e) => setCoverUrl(e.target.value)}
          placeholder="https://…  (si no la pones, se dibuja una cubierta)"
          className={campo}
        />
      </div>

      <div>
        <label htmlFor="m-desc" className={etiqueta}>
          Resumen
        </label>
        <textarea
          id="m-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-rule-strong bg-paper px-4 py-3 text-body outline-none transition placeholder:text-ink-faint/70 focus:border-spine"
          placeholder="De qué va el libro"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-danger/10 p-3 text-body text-danger">
          {error}
        </p>
      )}

      <div className="flex justify-end pt-1">
        <button
          type="submit"
          className="inline-flex min-h-11 items-center rounded-full bg-spine px-6 text-body font-medium text-paper shadow-raise transition hover:bg-spine-dark"
        >
          Continuar
        </button>
      </div>
    </form>
  );
}
