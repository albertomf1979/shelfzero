export type Book = {
  id: number;
  isbn13: string | null;
  isbn10: string | null;
  title: string;
  authors: string[];
  subjects: string[];
  description: string | null;
  coverUrl: string | null;
  publisher: string | null;
  publishedYear: number | null;
  language: string | null;
  status: "wishlist" | "bought";
  source: string | null;
  createdAt: number;
  updatedAt: number;
  listIds: number[];
};

/** Resultado de búsqueda: aún no está en el estante, no tiene id. */
export type BookCandidate = {
  isbn13?: string;
  isbn10?: string;
  title: string;
  authors: string[];
  subjects: string[];
  description?: string;
  coverUrl?: string;
  publisher?: string;
  publishedYear?: number;
  language?: string;
  source?: string;
  /** Clave de obra de Open Library; el servidor la usa para traer el resumen. */
  workKey?: string;
};

export type BookList = {
  id: number;
  name: string;
  color: string | null;
  count: number;
};

export type SortMode = "created" | "alpha" | "author" | "subject";
export type ViewMode = "shelf" | "list";
