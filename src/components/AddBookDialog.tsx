import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api";
import type { BookCandidate, BookList } from "../types";
import { Cover } from "./Cover";
import { Sheet } from "./Sheet";
import { IconBarcode, IconSearch, IconPlus } from "./icons";

// La librería de escaneo pesa ~450 kB: solo se descarga al abrir la cámara.
const BarcodeScanner = lazy(() =>
  import("./BarcodeScanner").then((m) => ({ default: m.BarcodeScanner }))
);

/** `choose` deja elegir el método; el resto entra directo. */
export type AddMode = "choose" | "scan" | "search" | "isbn";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Recibe el título guardado para poder avisar al usuario. */
  onAdded: (title: string) => void;
  initialMode?: AddMode;
  lists: BookList[];
  /** Crear una lista sin salir del alta; devuelve la lista creada. */
  onCreateList: (name: string) => Promise<BookList | null>;
};

/** Detecta si lo tecleado parece un ISBN (10/13 dígitos con guiones o no). */
function looksLikeIsbn(value: string): boolean {
  const digits = value.replace(/[^0-9Xx]/g, "");
  return (
    (digits.length === 10 || digits.length === 13) && /^[\d-\sXx]+$/.test(value)
  );
}

export function AddBookDialog({
  open,
  onClose,
  onAdded,
  initialMode = "choose",
  lists,
  onCreateList,
}: Props) {
  const [mode, setMode] = useState<AddMode>(initialMode);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [chosen, setChosen] = useState<BookCandidate | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
    } else {
      setQuery("");
      setResults([]);
      setMessage(null);
      setLoading(false);
      setChosen(null);
    }
  }, [open, initialMode]);

  // Enfocar el campo al entrar en un modo de escritura
  useEffect(() => {
    if (open && (mode === "search" || mode === "isbn")) {
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open, mode]);

  const handleScanned = useCallback(async (isbn: string) => {
    setMode("isbn");
    setQuery(isbn);
    setLoading(true);
    setMessage(null);
    setResults([]);
    try {
      const { book } = await api.lookupIsbn(isbn);
      if (book) setResults([book]);
      else {
        setMessage(
          `Hemos leído el ISBN ${isbn}, pero no está en los catálogos. Prueba a buscarlo por título.`
        );
        setMode("search");
        setQuery("");
      }
    } catch {
      setMessage("No se ha podido consultar ese ISBN.");
    } finally {
      setLoading(false);
    }
  }, []);

  if (!open) return null;

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    setMessage(null);
    setResults([]);
    try {
      if (mode === "isbn" || looksLikeIsbn(q)) {
        const { book } = await api.lookupIsbn(q);
        if (book) setResults([book]);
        else {
          setMessage("No hemos encontrado ese ISBN. Prueba a buscar por título.");
          setMode("search");
        }
      } else {
        const { results } = await api.search(q);
        setResults(results);
        if (results.length === 0) {
          setMessage("Sin coincidencias. Revisa el título o añádelo manualmente.");
        }
      }
    } catch (err: any) {
      setMessage(err?.message ?? "No se ha podido buscar. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const title =
    chosen !== null
      ? "Guardar en el estante"
      : mode === "choose"
        ? "Añadir un libro"
        : mode === "scan"
          ? "Escanear el código"
          : mode === "isbn"
            ? "Buscar por ISBN"
            : "Buscar por título";

  return (
    <Sheet open={open} onClose={onClose} labelledBy="add-title" size="lg">
      <div className="flex max-h-[86dvh] flex-col">
        {/* Cabecera */}
        <div className="flex items-center gap-3 border-b border-rule/50 px-5 py-4">
          {(mode !== "choose" || chosen) && (
            <button
              onClick={() => (chosen ? setChosen(null) : setMode("choose"))}
              aria-label="Volver"
              className="-ml-2 inline-flex size-9 shrink-0 items-center justify-center rounded-full text-ink-soft transition hover:bg-ink/8"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
          )}
          <h2 id="add-title" className="font-display text-xl font-semibold">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="ml-auto inline-flex size-9 shrink-0 items-center justify-center rounded-full text-ink-faint transition hover:bg-ink/8 hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {/* Paso final: elegir lista, crear lista y quién lo recomendó */}
          {chosen ? (
            <SaveStep
              candidate={chosen}
              lists={lists}
              onCreateList={onCreateList}
              onCancel={() => setChosen(null)}
              onSaved={(t) => {
                onAdded(t);
                onClose();
              }}
            />
          ) : mode === "choose" ? (
            <MethodChooser onPick={setMode} />
          ) : (
            <>
              {mode === "scan" ? (
                <Suspense
                  fallback={
                    <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-ink text-body text-paper/80">
                      Preparando la cámara…
                    </div>
                  }
                >
                  <BarcodeScanner
                    onDetected={handleScanned}
                    onCancel={() => setMode("choose")}
                  />
                </Suspense>
              ) : (
                <form onSubmit={handleSearch} className="mb-4 flex gap-2">
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    inputMode={mode === "isbn" ? "numeric" : "text"}
                    placeholder={
                      mode === "isbn"
                        ? "978-84-9992-622-3"
                        : "Título del libro o autor…"
                    }
                    className="min-h-11 flex-1 rounded-full border border-rule-strong bg-paper px-5 text-body outline-none transition placeholder:text-ink-faint/70 focus:border-spine"
                  />
                  <button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className="inline-flex min-h-11 items-center rounded-full bg-spine px-6 text-body font-medium text-paper transition hover:bg-spine-dark disabled:opacity-40"
                  >
                    {loading ? "Buscando…" : "Buscar"}
                  </button>
                </form>
              )}

              {message && (
                <div className="mb-4 rounded-xl border border-gold/40 bg-gold/10 p-4 text-body text-ink-soft">
                  <p>{message}</p>
                  {results.length === 0 && query.trim() && (
                    <button
                      onClick={() =>
                        setChosen({
                          title: query.trim(),
                          authors: [],
                          subjects: [],
                          source: "manual",
                        })
                      }
                      className="mt-3 inline-flex min-h-9 items-center rounded-full border border-rule-strong px-4 text-body font-medium text-ink transition hover:bg-paper-2"
                    >
                      Añadir «{query.trim()}» manualmente
                    </button>
                  )}
                </div>
              )}

              {loading && (
                <p className="py-8 text-center text-body text-ink-faint">
                  Buscando en Google Books y Open Library…
                </p>
              )}

              {!loading && results.length > 0 && (
                <>
                  <p className="mb-3 text-micro uppercase text-ink-faint">
                    {results.length === 1
                      ? "1 coincidencia"
                      : `${results.length} coincidencias — elige la edición`}
                  </p>
                  <ul className="divide-y divide-rule/50">
                    {results.map((b, i) => (
                      <li key={`${b.isbn13 ?? b.title}-${i}`}>
                        <button
                          onClick={() => setChosen(b)}
                          className="flex w-full items-center gap-4 py-3 text-left transition hover:bg-paper-2/60"
                        >
                          <Cover
                            url={b.coverUrl}
                            title={b.title}
                            authors={b.authors}
                            className="h-[72px] w-12 shrink-0 rounded-sm shadow-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <h3 className="line-clamp-2 font-display text-base font-medium leading-snug">
                              {b.title}
                            </h3>
                            <p className="mt-0.5 line-clamp-1 text-body text-ink-soft">
                              {b.authors.join(", ") || "Autor desconocido"}
                            </p>
                            <p className="mt-1 line-clamp-1 text-meta text-ink-faint">
                              {[b.publisher, b.publishedYear, b.isbn13]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          </div>
                          <span className="shrink-0 text-meta font-medium text-spine">
                            Elegir
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </Sheet>
  );
}

/** Punto 2: el usuario elige cómo añadir. La cámara no siempre está disponible. */
function MethodChooser({ onPick }: { onPick: (m: AddMode) => void }) {
  const hasCamera =
    typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

  const options = [
    {
      mode: "scan" as const,
      icon: <IconBarcode className="size-6" />,
      label: "Escanear el código de barras",
      hint: hasCamera
        ? "Lo más rápido si tienes el libro delante"
        : "No disponible en este dispositivo",
      disabled: !hasCamera,
    },
    {
      mode: "search" as const,
      icon: <IconSearch className="size-6" />,
      label: "Buscar por título",
      hint: "Elige entre las ediciones encontradas",
      disabled: false,
    },
    {
      mode: "isbn" as const,
      icon: <IconPlus className="size-6" />,
      label: "Introducir el ISBN",
      hint: "Los 13 dígitos de la contraportada",
      disabled: false,
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      {options.map((o, i) => (
        <button
          key={o.mode}
          onClick={() => onPick(o.mode)}
          disabled={o.disabled}
          data-autofocus={i === (hasCamera ? 0 : 1) ? "" : undefined}
          className="flex items-center gap-4 rounded-xl border border-rule-strong/70 p-4 text-left transition hover:border-spine hover:bg-paper-2/60 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-rule-strong/70 disabled:hover:bg-transparent"
        >
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-paper-3 text-ink-soft">
            {o.icon}
          </span>
          <span className="min-w-0">
            <span className="block font-display text-base font-medium text-ink">
              {o.label}
            </span>
            <span className="block text-meta text-ink-faint">{o.hint}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

/** Puntos 6 y 7: lista (o ninguna), crear lista al vuelo y quién lo recomendó. */
function SaveStep({
  candidate,
  lists,
  onCreateList,
  onCancel,
  onSaved,
}: {
  candidate: BookCandidate;
  lists: BookList[];
  onCreateList: (name: string) => Promise<BookList | null>;
  onCancel: () => void;
  onSaved: (title: string) => void;
}) {
  const [listIds, setListIds] = useState<number[]>([]);
  const [recommendedBy, setRecommendedBy] = useState("");
  const [creating, setCreating] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: number) {
    setListIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function addList() {
    const name = newListName.trim();
    if (!name) return;
    const created = await onCreateList(name);
    if (created) {
      setListIds((prev) => [...prev, created.id]);
      setNewListName("");
      setCreating(false);
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await api.addBook({
        ...candidate,
        listIds,
        recommendedBy: recommendedBy.trim() || undefined,
      });
      onSaved(candidate.title);
    } catch (err: any) {
      setError(
        err?.status === 409
          ? "Ese libro ya está en tu estante."
          : err?.message ?? "No se ha podido guardar."
      );
      setSaving(false);
    }
  }

  return (
    <div>
      {/* Qué se va a guardar */}
      <div className="mb-6 flex items-center gap-4">
        <Cover
          url={candidate.coverUrl}
          title={candidate.title}
          authors={candidate.authors}
          className="h-24 w-16 shrink-0 rounded-sm shadow-cover"
        />
        <div className="min-w-0">
          <h3 className="line-clamp-2 font-display text-lg font-medium leading-snug">
            {candidate.title}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-body text-ink-soft">
            {candidate.authors.join(", ") || "Autor desconocido"}
          </p>
        </div>
      </div>

      {/* Listas */}
      <p className="mb-2 text-micro uppercase text-ink-faint">
        Guardar en una lista <span className="normal-case">(opcional)</span>
      </p>
      <div className="mb-3 flex flex-wrap gap-2">
        {lists.map((l) => {
          const active = listIds.includes(l.id);
          return (
            <button
              key={l.id}
              onClick={() => toggle(l.id)}
              aria-pressed={active}
              className={
                "inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-body transition " +
                (active
                  ? "bg-ink text-paper"
                  : "border border-rule-strong text-ink-soft hover:bg-paper-2")
              }
            >
              {l.color && (
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full"
                  style={{ backgroundColor: l.color }}
                />
              )}
              {active ? "✓ " : ""}
              {l.name}
            </button>
          );
        })}

        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="inline-flex min-h-9 items-center gap-1 rounded-full border border-dashed border-rule-strong px-3.5 text-body text-ink-soft transition hover:border-spine hover:text-ink"
          >
            <IconPlus className="size-4" />
            Nueva lista
          </button>
        )}
      </div>

      {creating && (
        <div className="mb-4 flex gap-2">
          <input
            autoFocus
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addList();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setCreating(false);
              }
            }}
            maxLength={40}
            placeholder="Nombre de la lista"
            className="min-h-11 flex-1 rounded-full border border-rule-strong bg-paper px-4 text-body outline-none focus:border-spine"
          />
          <button
            onClick={addList}
            disabled={!newListName.trim()}
            className="inline-flex min-h-11 items-center rounded-full bg-ink px-4 text-body font-medium text-paper transition hover:bg-ink-soft disabled:opacity-40"
          >
            Crear
          </button>
        </div>
      )}

      {/* Recomendación de */}
      <label
        htmlFor="recommended-by"
        className="mb-2 mt-5 block text-micro uppercase text-ink-faint"
      >
        Recomendación de <span className="normal-case">(opcional)</span>
      </label>
      <input
        id="recommended-by"
        value={recommendedBy}
        onChange={(e) => setRecommendedBy(e.target.value)}
        maxLength={60}
        placeholder="¿Quién te lo recomendó?"
        className="min-h-11 w-full rounded-full border border-rule-strong bg-paper px-4 text-body outline-none transition placeholder:text-ink-faint/70 focus:border-spine"
      />

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-danger/10 p-3 text-body text-danger">
          {error}
        </p>
      )}

      {/* Acciones */}
      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          onClick={onCancel}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-rule-strong px-5 text-body font-medium text-ink transition hover:bg-paper-2"
        >
          Volver
        </button>
        <button
          data-autofocus
          onClick={save}
          disabled={saving}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-spine px-6 text-body font-medium text-paper shadow-raise transition hover:bg-spine-dark disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar en el estante"}
        </button>
      </div>
    </div>
  );
}
