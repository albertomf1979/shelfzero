import type { Book, BookCandidate, BookList, SortMode } from "./types";

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
      `/api/lookup?isbn=${encodeURIComponent(isbn)}`
    ),

  search: (q: string) =>
    req<{ results: BookCandidate[]; notFound?: boolean }>(
      `/api/search?q=${encodeURIComponent(q)}`
    ),

  getBooks: (opts: { sort?: SortMode; list?: number | null } = {}) => {
    const params = new URLSearchParams();
    if (opts.sort) params.set("sort", opts.sort);
    if (opts.list) params.set("list", String(opts.list));
    const qs = params.toString();
    return req<{ books: Book[] }>(`/api/books${qs ? `?${qs}` : ""}`);
  },

  addBook: (book: BookCandidate & { listIds?: number[] }) =>
    req<{ book: Book }>("/api/books", {
      method: "POST",
      body: JSON.stringify(book),
    }),

  updateBook: (id: number, patch: Partial<Book>) =>
    req<{ book: Book }>(`/api/books/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),

  deleteBook: (id: number) =>
    req<{ ok: true }>(`/api/books/${id}`, { method: "DELETE" }),

  getLists: () => req<{ lists: BookList[] }>("/api/lists"),

  addList: (name: string) =>
    req<{ list: BookList }>("/api/lists", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  deleteList: (id: number) =>
    req<{ ok: true }>(`/api/lists/${id}`, { method: "DELETE" }),

  createShare: (kind: "book" | "list", refId: number) =>
    req<{ token: string; url: string }>("/api/shares", {
      method: "POST",
      body: JSON.stringify({ kind, refId }),
    }),

  getShare: (token: string) =>
    req<{ kind: "book" | "list"; title: string | null; books: Book[] }>(
      `/api/shares/${encodeURIComponent(token)}`
    ),

  addToList: (listId: number, bookId: number) =>
    req<{ ok: true }>(`/api/lists/${listId}/books/${bookId}`, { method: "POST" }),

  removeFromList: (listId: number, bookId: number) =>
    req<{ ok: true }>(`/api/lists/${listId}/books/${bookId}`, {
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
