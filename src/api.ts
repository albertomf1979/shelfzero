import type { Book, BookCandidate, BookList, SortMode } from "./types";
import { demoStore } from "./lib/demoStore";

/**
 * El prefijo se deduce de la URL, porque el mismo build sirve la versión
 * privada (/myshelfzero) y la demostración (/shelfzerodemo).
 */
export const BASE = `/${window.location.pathname.split("/")[1] ?? ""}`.replace(
  /\/$/,
  ""
);

/** En la demostración los datos viven en el navegador, no en el servidor. */
export const IS_DEMO = BASE === "/shelfzerodemo";

/** Cuántos libros puede guardar quien prueba la demostración. */
export const DEMO_LIMIT = 3;

/** Error que la interfaz reconoce para invitar a desplegar su propia copia. */
export class DemoLimitError extends Error {
  constructor() {
    super(`La demostración permite guardar ${DEMO_LIMIT} libros.`);
    this.name = "DemoLimitError";
  }
}

/**
 * La sesión caducó o nunca existió: se recarga para que sea el servidor quien
 * muestre la pantalla de acceso. Hace falta porque el service worker puede
 * haber servido la app desde su caché sin pasar por el candado; sin esto, la
 * app se queda a la vista respondiendo "No autorizado" a cada acción.
 */
function goToLogin() {
  if (IS_DEMO || !navigator.onLine) return; // sin red, recargar no arregla nada
  window.location.replace(`${BASE}/`);
}

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (res.status === 401) {
    goToLogin();
    throw new Error("Sesión caducada");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data as any)?.error ?? "Error de red") as Error & {
      status?: number;
      data?: unknown;
    };
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data as T;
}

export const api = {
  lookupIsbn: (isbn: string) =>
    req<{ book: BookCandidate | null; notFound?: boolean }>(
      `${BASE}/api/lookup?isbn=${encodeURIComponent(isbn)}`
    ),

  search: (q: string) =>
    req<{ results: BookCandidate[]; notFound?: boolean }>(
      `${BASE}/api/search?q=${encodeURIComponent(q)}`
    ),

  getBooks: (opts: { sort?: SortMode; list?: number | null } = {}) => {
    if (IS_DEMO) return Promise.resolve({ books: sortBooks(demoStore.getBooks(), opts.sort) });
    const params = new URLSearchParams();
    if (opts.sort) params.set("sort", opts.sort);
    if (opts.list) params.set("list", String(opts.list));
    const qs = params.toString();
    return req<{ books: Book[] }>(`${BASE}/api/books${qs ? `?${qs}` : ""}`);
  },

  addBook: (book: BookCandidate & { listIds?: number[] }) => {
    if (IS_DEMO) {
      if (demoStore.count() >= DEMO_LIMIT) return Promise.reject(new DemoLimitError());
      return Promise.resolve({ book: demoStore.addBook(book) });
    }
    return req<{ book: Book }>(`${BASE}/api/books`, {
      method: "POST",
      body: JSON.stringify(book),
    });
  },

  updateBook: (id: number, patch: Partial<Book>) => {
    if (IS_DEMO) return Promise.resolve({ book: demoStore.updateBook(id, patch)! });
    return req<{ book: Book }>(`${BASE}/api/books/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  },

  deleteBook: (id: number) => {
    if (IS_DEMO) { demoStore.deleteBook(id); return Promise.resolve({ ok: true } as const); }
    return req<{ ok: true }>(`${BASE}/api/books/${id}`, { method: "DELETE" });
  },

  getLists: () => {
    if (IS_DEMO) return Promise.resolve({ lists: demoStore.getLists() });
    return req<{ lists: BookList[] }>(`${BASE}/api/lists`);
  },

  addList: (name: string, color?: string | null) => {
    if (IS_DEMO) return Promise.resolve({ list: demoStore.addList(name, color) });
    return req<{ list: BookList }>(`${BASE}/api/lists`, {
      method: "POST",
      body: JSON.stringify({ name, color }),
    });
  },

  deleteList: (id: number) => {
    if (IS_DEMO) { demoStore.deleteList(id); return Promise.resolve({ ok: true } as const); }
    return req<{ ok: true }>(`${BASE}/api/lists/${id}`, { method: "DELETE" });
  },

  /** Devuelve el enlace ya absoluto, compuesto con el origen del navegador. */
  createShare: async (kind: "book" | "list", refId: number) => {
    const r = await req<{ token: string; path: string }>(`${BASE}/api/shares`, {
      method: "POST",
      body: JSON.stringify({ kind, refId }),
    });
    return { token: r.token, url: new URL(r.path, window.location.origin).href };
  },

  getShare: (token: string) =>
    req<{ kind: "book" | "list"; title: string | null; books: Book[] }>(
      `${BASE}/api/shares/${encodeURIComponent(token)}`
    ),

  addToList: (listId: number, bookId: number) => {
    if (IS_DEMO) { demoStore.setListMembership(listId, bookId, true); return Promise.resolve({ ok: true } as const); }
    return req<{ ok: true }>(`${BASE}/api/lists/${listId}/books/${bookId}`, { method: "POST" });
  },

  removeFromList: (listId: number, bookId: number) => {
    if (IS_DEMO) { demoStore.setListMembership(listId, bookId, false); return Promise.resolve({ ok: true } as const); }
    return req<{ ok: true }>(`${BASE}/api/lists/${listId}/books/${bookId}`, {
      method: "DELETE",
    });
  },
};

/** La demostración ordena en el navegador; el servidor lo hace en SQL. */
function sortBooks(books: Book[], sort: SortMode = "created"): Book[] {
  const by = [...books];
  const first = (xs: string[]) => (xs[0] ?? "zzz").toLowerCase();
  if (sort === "alpha") by.sort((a, b) => a.title.localeCompare(b.title, "es"));
  else if (sort === "author")
    by.sort((a, b) => first(a.authors).localeCompare(first(b.authors), "es"));
  else if (sort === "subject")
    by.sort((a, b) => first(a.subjects).localeCompare(first(b.subjects), "es"));
  else by.sort((a, b) => b.createdAt - a.createdAt);
  return by;
}

/** FR8: salir a Google para buscar dónde comprarlo. */
export function googleBuyUrl(book: {
  title: string;
  authors?: string[];
  isbn13?: string | null;
  asin?: string | null;
}): string {
  // El ASIN localiza el libro en Amazon con más precisión que el título, y es
  // lo único que tienen los autopublicados en KDP.
  const q = book.isbn13
    ? `${book.isbn13} ${book.title} comprar`
    : book.asin
      ? `${book.asin} ${book.title} comprar`
      : `${book.title} ${book.authors?.[0] ?? ""} comprar libro`;
  return `https://www.google.com/search?q=${encodeURIComponent(q.trim())}`;
}
