import type { Book, BookCandidate, BookList, SortMode } from "./types";

/** La app vive bajo /shelfzero: todas las rutas cuelgan de ahí. */
export const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
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
    const params = new URLSearchParams();
    if (opts.sort) params.set("sort", opts.sort);
    if (opts.list) params.set("list", String(opts.list));
    const qs = params.toString();
    return req<{ books: Book[] }>(`${BASE}/api/books${qs ? `?${qs}` : ""}`);
  },

  addBook: (book: BookCandidate & { listIds?: number[] }) =>
    req<{ book: Book }>(`${BASE}/api/books`, {
      method: "POST",
      body: JSON.stringify(book),
    }),

  updateBook: (id: number, patch: Partial<Book>) =>
    req<{ book: Book }>(`${BASE}/api/books/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),

  deleteBook: (id: number) =>
    req<{ ok: true }>(`${BASE}/api/books/${id}`, { method: "DELETE" }),

  getLists: () => req<{ lists: BookList[] }>(`${BASE}/api/lists`),

  addList: (name: string, color?: string | null) =>
    req<{ list: BookList }>(`${BASE}/api/lists`, {
      method: "POST",
      body: JSON.stringify({ name, color }),
    }),

  deleteList: (id: number) =>
    req<{ ok: true }>(`${BASE}/api/lists/${id}`, { method: "DELETE" }),

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

  addToList: (listId: number, bookId: number) =>
    req<{ ok: true }>(`${BASE}/api/lists/${listId}/books/${bookId}`, { method: "POST" }),

  removeFromList: (listId: number, bookId: number) =>
    req<{ ok: true }>(`${BASE}/api/lists/${listId}/books/${bookId}`, {
      method: "DELETE",
    }),
};

/** FR8: salir a Google para buscar dónde comprarlo. */
export function googleBuyUrl(book: {
  title: string;
  authors?: string[];
  isbn13?: string | null;
}): string {
  const q = book.isbn13
    ? `${book.isbn13} ${book.title} comprar`
    : `${book.title} ${book.authors?.[0] ?? ""} comprar libro`;
  return `https://www.google.com/search?q=${encodeURIComponent(q.trim())}`;
}
