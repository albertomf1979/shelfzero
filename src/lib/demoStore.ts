import type { Book, BookCandidate, BookList } from "../types";

/**
 * Almacén de la versión de demostración.
 *
 * Vive en el navegador de quien prueba, no en el servidor. Así cada visitante
 * tiene su propio estante, nadie ve ni puede tocar los libros de otro, y la
 * demostración no escribe nada en la base de datos real.
 */
const KEY = "sz.demo.v1";

type DemoData = { books: Book[]; lists: BookList[]; nextId: number };

function read(): DemoData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as DemoData;
  } catch {
    // Datos corruptos: se empieza de cero.
  }
  return { books: [], lists: [], nextId: 1 };
}

function write(data: DemoData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Sin espacio o en modo privado: la demostración sigue en memoria.
  }
}

export const demoStore = {
  count(): number {
    return read().books.length;
  },

  getBooks(): Book[] {
    return read().books;
  },

  getLists(): BookList[] {
    const { books, lists } = read();
    return lists.map((l) => ({
      ...l,
      count: books.filter(
        (b) => b.status !== "bought" && b.listIds.includes(l.id)
      ).length,
    }));
  },

  addBook(candidate: BookCandidate & { listIds?: number[] }): Book {
    const data = read();
    const now = Date.now();
    const book: Book = {
      id: data.nextId++,
      isbn13: candidate.isbn13 ?? null,
      isbn10: candidate.isbn10 ?? null,
      title: candidate.title,
      authors: candidate.authors ?? [],
      subjects: candidate.subjects ?? [],
      description: candidate.description ?? null,
      coverUrl: candidate.coverUrl ?? null,
      publisher: candidate.publisher ?? null,
      publishedYear: candidate.publishedYear ?? null,
      language: candidate.language ?? null,
      status: "wishlist",
      recommendedBy: candidate.recommendedBy?.trim() || null,
      source: candidate.source ?? "manual",
      createdAt: now,
      updatedAt: now,
      listIds: candidate.listIds ?? [],
    };
    data.books.unshift(book);
    write(data);
    return book;
  },

  updateBook(id: number, patch: Partial<Book>): Book | null {
    const data = read();
    const b = data.books.find((x) => x.id === id);
    if (!b) return null;
    Object.assign(b, patch, { updatedAt: Date.now() });
    write(data);
    return b;
  },

  deleteBook(id: number) {
    const data = read();
    data.books = data.books.filter((b) => b.id !== id);
    write(data);
  },

  addList(name: string, color?: string | null): BookList {
    const data = read();
    const list: BookList = {
      id: data.nextId++,
      name,
      color: color ?? null,
      count: 0,
    };
    data.lists.push(list);
    write(data);
    return list;
  },

  deleteList(id: number) {
    const data = read();
    data.lists = data.lists.filter((l) => l.id !== id);
    data.books.forEach((b) => {
      b.listIds = b.listIds.filter((x) => x !== id);
    });
    write(data);
  },

  setListMembership(listId: number, bookId: number, member: boolean) {
    const data = read();
    const b = data.books.find((x) => x.id === bookId);
    if (!b) return;
    b.listIds = member
      ? [...new Set([...b.listIds, listId])]
      : b.listIds.filter((x) => x !== listId);
    write(data);
  },
};
