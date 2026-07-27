import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import type { Book, BookList, SortMode, ViewMode } from "./types";
import { AddBookDialog } from "./components/AddBookDialog";
import { BookDetail } from "./components/BookDetail";
import { BookMenu } from "./components/BookMenu";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { PromptDialog } from "./components/PromptDialog";
import { Shelf } from "./components/Shelf";
import { SharedView } from "./components/SharedView";
import { ShareSheet } from "./components/ShareSheet";
import { ShelfMenu } from "./components/ShelfMenu";
import { useToast } from "./components/Toast";
import { Welcome } from "./components/Welcome";
import {
  IconBarcode,
  IconGrid,
  IconList,
  IconMore,
  IconPlus,
} from "./components/icons";

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
  const [addMode, setAddMode] = useState<"scan" | "search" | "isbn">("search");
  const [detail, setDetail] = useState<Book | null>(null);
  const [showWelcome, setShowWelcome] = useState(
    () => localStorage.getItem("sz.seen") !== "1"
  );
  const [share, setShare] = useState<ShareTarget | null>(null);
  const [toDelete, setToDelete] = useState<Book | null>(null);
  const [newListOpen, setNewListOpen] = useState(false);
  const [menuBook, setMenuBook] = useState<Book | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const toast = useToast();

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
    toast(
      next === "bought"
        ? `«${book.title}» marcado como adquirido`
        : `«${book.title}» vuelve a la lista de deseos`
    );
    await api.updateBook(book.id, { status: next }).catch(load);
  }

  /** El borrado es definitivo (la API no tiene papelera), de ahí la confirmación. */
  async function deleteBook(book: Book) {
    setBooks((prev) => prev.filter((b) => b.id !== book.id));
    setDetail(null);
    setToDelete(null);
    await api.deleteBook(book.id).catch(load);
    toast(`«${book.title}» ya no está en el estante`);
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

  async function createList(name: string, color: string | null) {
    setNewListOpen(false);
    await api.addList(name, color);
    toast(`Lista «${name}» creada`);
    load();
  }

  /** Abre el diálogo de alta directamente en el modo pedido (FR: captura rápida). */
  function openAdd(mode: "scan" | "search" | "isbn") {
    setAddMode(mode);
    setAddOpen(true);
  }

  function dismissWelcome(scan: boolean) {
    localStorage.setItem("sz.seen", "1");
    setShowWelcome(false);
    if (scan) openAdd("scan");
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

          <span className="ml-1 hidden text-body text-ink-faint sm:inline">
            {pending} por comprar
          </span>

          <button
            onClick={() => openAdd("search")}
            className="ml-auto inline-flex min-h-11 items-center gap-1.5 rounded-full bg-spine px-5 text-body font-medium text-paper shadow-raise transition hover:bg-spine-dark active:scale-95"
          >
            <IconPlus className="size-4" />
            Añadir
          </button>

          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="Ajustes"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-soft transition hover:bg-ink/8"
          >
            <IconMore className="size-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {/* Controles */}
        <div className="mb-6 flex items-center gap-2">
          {/* Orden (FR6) — se desliza en horizontal si no cabe */}
          <div className="-mx-1 flex min-w-0 flex-1 gap-1 overflow-x-auto rounded-full bg-ink/5 p-1 text-body [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(Object.keys(SORT_LABELS) as SortMode[]).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 transition ${
                  sort === s ? "bg-paper text-ink shadow-sm" : "text-ink-faint hover:text-ink"
                }`}
              >
                {SORT_LABELS[s]}
              </button>
            ))}
          </div>

          {/* Vistas (FR13) */}
          <div className="flex shrink-0 gap-1 rounded-full bg-ink/5 p-1">
            <button
              onClick={() => setView("shelf")}
              className={`rounded-full p-2 transition ${
                view === "shelf" ? "bg-paper shadow-sm" : "text-ink-faint"
              }`}
              aria-label="Vista estantería"
              title="Vista estantería"
            >
              <IconGrid className="size-5" />
            </button>
            <button
              onClick={() => setView("list")}
              className={`rounded-full p-2 transition ${
                view === "list" ? "bg-paper shadow-sm" : "text-ink-faint"
              }`}
              aria-label="Vista lista"
              title="Vista lista"
            >
              <IconList className="size-5" />
            </button>
          </div>
        </div>

        {/* Listas (FR7) */}
        <div className="mb-7 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveList(null)}
            className={`rounded-full px-3.5 py-1.5 text-body transition ${
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
              className={`rounded-full px-3.5 py-1.5 text-body transition ${
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
            onClick={() => setNewListOpen(true)}
            className="rounded-full px-3 py-1.5 text-body text-ink-faint transition hover:text-ink"
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
              className="ml-auto rounded-full border border-ink/15 px-4 py-1.5 text-body text-ink-soft transition hover:bg-ink/5"
            >
              Compartir lista
            </button>
          )}
        </div>

        {/* Contenido */}
        {loading ? (
          <p className="py-20 text-center text-body text-ink-faint">Cargando…</p>
        ) : books.length === 0 ? (
          <EmptyState
            onScan={() => openAdd("scan")}
            onSearch={() => openAdd("search")}
            onClearFilter={() => setActiveList(null)}
            filtered={activeList !== null}
          />
        ) : (
          <Shelf
            books={books}
            view={view}
            sort={sort}
            onOpen={setDetail}
            onMenu={setMenuBook}
          />
        )}
      </main>

      {/* Escanear en un solo toque: el gesto principal en la librería.
          Se oculta en el estado vacío, que ya ofrece el botón. */}
      {books.length > 0 && (
        <button
          onClick={() => openAdd("scan")}
          aria-label="Escanear el código de barras de un libro"
          className="fixed right-5 z-40 inline-flex size-14 items-center justify-center rounded-full bg-spine text-paper shadow-raise transition hover:bg-spine-dark active:scale-95 sm:hidden"
          style={{ bottom: "max(1.25rem, calc(env(safe-area-inset-bottom) + 0.75rem))" }}
        >
          <IconBarcode className="size-7" />
        </button>
      )}

      <AddBookDialog
        open={addOpen}
        initialMode={addMode}
        onClose={() => setAddOpen(false)}
        onAdded={(title) => {
          toast(`«${title}» guardado en el estante`);
          load();
        }}
      />
      <BookDetail
        book={detail}
        lists={lists}
        onClose={() => setDetail(null)}
        onToggleBought={toggleBought}
        onDelete={setToDelete}
        onToggleList={toggleList}
        onShare={(b) =>
          setShare({ kind: "book", refId: b.id, label: b.title })
        }
      />
      <ShareSheet target={share} onClose={() => setShare(null)} />

      <BookMenu
        book={menuBook}
        onClose={() => setMenuBook(null)}
        onOpenDetail={setDetail}
        onToggleBought={toggleBought}
        onShare={(b) => setShare({ kind: "book", refId: b.id, label: b.title })}
        onDelete={setToDelete}
      />

      <ConfirmDialog
        open={!!toDelete}
        tone="danger"
        title={`¿Quitar «${toDelete?.title ?? ""}» del estante?`}
        description="No se puede deshacer."
        confirmLabel="Quitar"
        onConfirm={() => toDelete && deleteBook(toDelete)}
        onCancel={() => setToDelete(null)}
      />

      <ShelfMenu
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onAbout={() => setAboutOpen(true)}
      />

      {aboutOpen && (
        <Welcome mode="about" onClose={() => setAboutOpen(false)} />
      )}

      <PromptDialog
        open={newListOpen}
        title="Nueva lista"
        label="Nombre de la lista"
        placeholder="Ciencia ficción"
        confirmLabel="Crear"
        withColor
        validate={(v) =>
          lists.some((l) => l.name.toLowerCase() === v.toLowerCase())
            ? "Ya tienes una lista con ese nombre."
            : null
        }
        onSubmit={createList}
        onCancel={() => setNewListOpen(false)}
      />
    </div>
  );
}

function EmptyState({
  onScan,
  onSearch,
  onClearFilter,
  filtered,
}: {
  onScan: () => void;
  onSearch: () => void;
  onClearFilter: () => void;
  filtered: boolean;
}) {
  if (filtered) {
    return (
      <div className="mx-auto max-w-[20rem] py-12 text-center">
        <h2 className="font-display text-2xl font-semibold">
          Esta lista está vacía
        </h2>
        <p className="mt-2 text-lede text-ink-soft">
          Añade libros a esta lista desde su ficha.
        </p>
        <button
          onClick={onClearFilter}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full border border-rule-strong px-5 text-body font-medium text-ink transition hover:bg-paper-2"
        >
          Ver todo el estante
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[20rem] py-12 text-center">
      {/* Una balda vacía: la promesa visual de lo que va a haber aquí */}
      <div aria-hidden="true" className="mb-6">
        <div className="h-20 rounded-t-sm bg-paper-2/70" />
        <div
          className="h-2 bg-gradient-to-b from-wood to-wood-dark"
          style={{ boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.18)" }}
        />
        <div className="h-1 bg-wood-dark/45" />
      </div>

      <h2 className="font-display text-2xl font-semibold">
        El estante está vacío
      </h2>
      <p className="mt-2 text-lede text-ink-soft">
        Sin prisa, sin olvidos. Escanea el primer libro que te apetezca.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <button
          onClick={onScan}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-spine px-5 text-body font-medium text-paper shadow-raise transition hover:bg-spine-dark active:scale-[0.98]"
        >
          Escanear un libro
        </button>
        <button
          onClick={onSearch}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-rule-strong px-5 text-body font-medium text-ink transition hover:bg-paper-2"
        >
          Buscar por título
        </button>
      </div>
    </div>
  );
}
