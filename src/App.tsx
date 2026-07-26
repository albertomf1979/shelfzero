import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import type { Book, BookList, SortMode, ViewMode } from "./types";
import { AddBookDialog } from "./components/AddBookDialog";
import { BookDetail } from "./components/BookDetail";
import { Shelf } from "./components/Shelf";
import { SharedView } from "./components/SharedView";
import { ShareSheet } from "./components/ShareSheet";
import { Welcome } from "./components/Welcome";

type ShareTarget =
  | { kind: "book"; refId: number; label: string }
  | { kind: "list"; refId: number; label: string };

const SORT_LABELS: Record<SortMode, string> = {
  created: "Recientes",
  alpha: "A–Z",
  author: "Autor",
  subject: "Temática",
};

export default function App() {
  // Ruta pública de solo lectura: /s/:token (no necesita cuenta).
  const sharedToken = window.location.pathname.match(/^\/s\/([\w-]+)$/)?.[1];
  if (sharedToken) return <SharedView token={sharedToken} />;

  return <Shelves />;
}

function Shelves() {
  const [books, setBooks] = useState<Book[]>([]);
  const [lists, setLists] = useState<BookList[]>([]);
  const [sort, setSort] = useState<SortMode>(
    () => (localStorage.getItem("sz.sort") as SortMode) ?? "created"
  );
  const [view, setView] = useState<ViewMode>(
    () => (localStorage.getItem("sz.view") as ViewMode) ?? "shelf"
  );
  const [activeList, setActiveList] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [detail, setDetail] = useState<Book | null>(null);
  const [showWelcome, setShowWelcome] = useState(
    () => localStorage.getItem("sz.seen") !== "1"
  );
  const [share, setShare] = useState<ShareTarget | null>(null);

  useEffect(() => localStorage.setItem("sz.sort", sort), [sort]);
  useEffect(() => localStorage.setItem("sz.view", view), [view]);

  const load = useCallback(async () => {
    try {
      const [b, l] = await Promise.all([
        api.getBooks({ sort, list: activeList }),
        api.getLists(),
      ]);
      setBooks(b.books);
      setLists(l.lists);
    } catch {
      // Silencioso: la UI muestra el estado vacío.
    } finally {
      setLoading(false);
    }
  }, [sort, activeList]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleBought(book: Book) {
    const next = book.status === "bought" ? "wishlist" : "bought";
    // Optimista
    setBooks((prev) =>
      prev.map((b) => (b.id === book.id ? { ...b, status: next } : b))
    );
    setDetail((d) => (d?.id === book.id ? { ...d, status: next } : d));
    await api.updateBook(book.id, { status: next }).catch(load);
  }

  async function deleteBook(book: Book) {
    if (!confirm(`¿Eliminar «${book.title}» del estante?`)) return;
    setBooks((prev) => prev.filter((b) => b.id !== book.id));
    setDetail(null);
    await api.deleteBook(book.id).catch(load);
    load();
  }

  async function toggleList(book: Book, listId: number, add: boolean) {
    const nextIds = add
      ? [...book.listIds, listId]
      : book.listIds.filter((id) => id !== listId);
    setBooks((prev) =>
      prev.map((b) => (b.id === book.id ? { ...b, listIds: nextIds } : b))
    );
    setDetail((d) => (d?.id === book.id ? { ...d, listIds: nextIds } : d));

    if (add) await api.addToList(listId, book.id).catch(load);
    else await api.removeFromList(listId, book.id).catch(load);
    load();
  }

  async function createList() {
    const name = prompt("Nombre de la nueva lista (p. ej. Ciencia ficción):");
    if (!name?.trim()) return;
    await api.addList(name.trim());
    load();
  }

  function dismissWelcome(openAdd: boolean) {
    localStorage.setItem("sz.seen", "1");
    setShowWelcome(false);
    if (openAdd) setAddOpen(true);
  }

  if (showWelcome) {
    return (
      <Welcome
        onStart={() => dismissWelcome(true)}
        onSkip={() => dismissWelcome(false)}
      />
    );
  }

  const pending = books.filter((b) => b.status !== "bought").length;

  return (
    <div className="min-h-[100dvh]">
      {/* Cabecera */}
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <button
            onClick={() => {
              setActiveList(null);
              setDetail(null);
            }}
            className="flex items-center gap-2.5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-spine font-display text-lg text-paper">
              S0
            </span>
            <span className="font-display text-xl">ShelfZero</span>
          </button>

          <span className="ml-1 hidden text-sm text-ink-faint sm:inline">
            {pending} por comprar
          </span>

          <button
            onClick={() => setAddOpen(true)}
            className="ml-auto rounded-full bg-spine px-5 py-2 text-sm font-medium text-paper shadow-sm transition hover:bg-spine-dark active:scale-95"
          >
            + Añadir
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {/* Controles */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {/* Orden (FR6) */}
          <div className="flex gap-1 rounded-full bg-ink/5 p-1 text-sm">
            {(Object.keys(SORT_LABELS) as SortMode[]).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`rounded-full px-3.5 py-1.5 transition ${
                  sort === s ? "bg-paper text-ink shadow-sm" : "text-ink-faint hover:text-ink"
                }`}
              >
                {SORT_LABELS[s]}
              </button>
            ))}
          </div>

          {/* Vistas (FR13) */}
          <div className="ml-auto flex gap-1 rounded-full bg-ink/5 p-1">
            <button
              onClick={() => setView("shelf")}
              className={`rounded-full p-2 transition ${
                view === "shelf" ? "bg-paper shadow-sm" : "text-ink-faint"
              }`}
              aria-label="Vista estantería"
              title="Vista estantería"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </button>
            <button
              onClick={() => setView("list")}
              className={`rounded-full p-2 transition ${
                view === "list" ? "bg-paper shadow-sm" : "text-ink-faint"
              }`}
              aria-label="Vista lista"
              title="Vista lista"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
            </button>
          </div>
        </div>

        {/* Listas (FR7) */}
        <div className="mb-7 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveList(null)}
            className={`rounded-full px-3.5 py-1.5 text-sm transition ${
              activeList === null
                ? "bg-ink text-paper"
                : "border border-ink/15 text-ink-soft hover:bg-ink/5"
            }`}
          >
            Todo el estante
          </button>
          {lists.map((l) => (
            <button
              key={l.id}
              onClick={() => setActiveList(l.id)}
              className={`rounded-full px-3.5 py-1.5 text-sm transition ${
                activeList === l.id
                  ? "bg-ink text-paper"
                  : "border border-ink/15 text-ink-soft hover:bg-ink/5"
              }`}
            >
              {l.name}
              <span className="ml-1.5 opacity-60">{l.count}</span>
            </button>
          ))}
          <button
            onClick={createList}
            className="rounded-full px-3 py-1.5 text-sm text-ink-faint transition hover:text-ink"
            title="Crear una lista"
          >
            + Lista
          </button>

          {/* Compartir la lista activa (FR11) */}
          {activeList !== null && (
            <button
              onClick={() => {
                const l = lists.find((x) => x.id === activeList);
                if (l) setShare({ kind: "list", refId: l.id, label: l.name });
              }}
              className="ml-auto rounded-full border border-ink/15 px-4 py-1.5 text-sm text-ink-soft transition hover:bg-ink/5"
            >
              Compartir lista
            </button>
          )}
        </div>

        {/* Contenido */}
        {loading ? (
          <p className="py-20 text-center text-sm text-ink-faint">Cargando…</p>
        ) : books.length === 0 ? (
          <EmptyState onAdd={() => setAddOpen(true)} filtered={activeList !== null} />
        ) : (
          <Shelf
            books={books}
            view={view}
            sort={sort}
            onOpen={setDetail}
            onToggleBought={toggleBought}
          />
        )}
      </main>

      <AddBookDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={load}
      />
      <BookDetail
        book={detail}
        lists={lists}
        onClose={() => setDetail(null)}
        onToggleBought={toggleBought}
        onDelete={deleteBook}
        onToggleList={toggleList}
        onShare={(b) =>
          setShare({ kind: "book", refId: b.id, label: b.title })
        }
      />
      <ShareSheet target={share} onClose={() => setShare(null)} />
    </div>
  );
}

function EmptyState({ onAdd, filtered }: { onAdd: () => void; filtered: boolean }) {
  return (
    <div className="py-24 text-center">
      <div className="mx-auto mb-5 flex h-16 w-12 items-end justify-center gap-1">
        <span className="h-10 w-2.5 rounded-sm bg-ink/15" />
        <span className="h-14 w-2.5 rounded-sm bg-ink/20" />
        <span className="h-8 w-2.5 rounded-sm bg-ink/12" />
      </div>
      <p className="font-display text-xl text-ink-soft">
        {filtered ? "Esta lista está vacía" : "Tu estante está vacío"}
      </p>
      <p className="mx-auto mt-2 max-w-xs text-sm text-ink-faint">
        {filtered
          ? "Añade libros a esta lista desde su ficha."
          : "Busca un libro por título o ISBN y guárdalo para no perderlo de vista."}
      </p>
      {!filtered && (
        <button
          onClick={onAdd}
          className="mt-6 rounded-full bg-spine px-6 py-2.5 text-sm font-medium text-paper transition hover:bg-spine-dark"
        >
          Añadir un libro
        </button>
      )}
    </div>
  );
}
