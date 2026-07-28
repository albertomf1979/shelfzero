// Proveedores de metadatos de libros: Google Books (principal) + Open Library (respaldo).
// Todo se llama desde el Worker para ocultar claves, evitar CORS y poder cachear.

export type BookData = {
  isbn13?: string;
  isbn10?: string;
  /** Identificador de Amazon; los ebooks y muchos KDP no tienen ISBN. */
  asin?: string;
  title: string;
  authors: string[];
  subjects: string[];
  description?: string;
  coverUrl?: string;
  publisher?: string;
  publishedYear?: number;
  language?: string;
  source?: "google" | "openlibrary" | "manual";
  /** Clave de obra de Open Library (/works/OL…W), para ampliar datos al guardar. */
  workKey?: string;
  /** Quién recomendó el libro. Opcional, lo escribe el usuario. */
  recommendedBy?: string;
};

const FETCH_TIMEOUT = 8000;

export function normalizeIsbn(raw: string): string {
  return raw.replace(/[^0-9Xx]/g, "").toUpperCase();
}

/**
 * Valida el dígito de control del ISBN.
 * Imprescindible: Open Library devuelve un libro cualquiera ante ISBNs
 * inventados, así que sin esta comprobación se colarían fichas falsas.
 */
export function isValidIsbn(raw: string): boolean {
  const isbn = normalizeIsbn(raw);

  if (isbn.length === 10) {
    if (!/^\d{9}[\dX]$/.test(isbn)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += (i + 1) * Number(isbn[i]);
    const check = isbn[9] === "X" ? 10 : Number(isbn[9]);
    return (sum + 10 * check) % 11 === 0;
  }

  if (isbn.length === 13) {
    if (!/^\d{13}$/.test(isbn)) return false;
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += Number(isbn[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const check = (10 - (sum % 10)) % 10;
    return check === Number(isbn[12]);
  }

  return false;
}

function yearFrom(dateStr?: string): number | undefined {
  if (!dateStr) return undefined;
  const m = dateStr.match(/\d{4}/);
  return m ? Number(m[0]) : undefined;
}

function httpsify(url?: string): string | undefined {
  if (!url) return undefined;
  return url.replace(/^http:\/\//i, "https://");
}

/**
 * Las portadas de Open Library devuelven una imagen en blanco cuando no existen.
 * Con `default=false` responden 404 y el cliente puede dibujar su respaldo.
 */
function withNoDefaultCover(url?: string): string | undefined {
  if (!url || !url.includes("covers.openlibrary.org")) return url;
  return url.includes("?") ? `${url}&default=false` : `${url}?default=false`;
}

async function getJson(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Google Books devuelve las sinopsis con etiquetas HTML. */
function stripHtml(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// --- Google Books ----------------------------------------------------------

function mapGoogleVolume(item: any): BookData | null {
  const info = item?.volumeInfo;
  if (!info?.title) return null;

  const ids: { type: string; identifier: string }[] =
    info.industryIdentifiers ?? [];
  const isbn13 = ids.find((i) => i.type === "ISBN_13")?.identifier;
  const isbn10 = ids.find((i) => i.type === "ISBN_10")?.identifier;

  const cover = httpsify(
    info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail
  );

  return {
    isbn13,
    isbn10,
    title: info.subtitle ? `${info.title}: ${info.subtitle}` : info.title,
    authors: info.authors ?? [],
    subjects: info.categories ?? [],
    description: info.description ? stripHtml(info.description) : undefined,
    coverUrl: cover,
    publisher: info.publisher,
    publishedYear: yearFrom(info.publishedDate),
    language: info.language,
    source: "google",
  };
}

async function googleSearch(
  query: string,
  apiKey?: string,
  maxResults = 20
): Promise<BookData[]> {
  const params = new URLSearchParams({
    q: query,
    maxResults: String(maxResults),
    printType: "books",
  });
  if (apiKey) params.set("key", apiKey);
  const data = await getJson(
    `https://www.googleapis.com/books/v1/volumes?${params.toString()}`
  );
  const items: any[] = data?.items ?? [];
  return items
    .map(mapGoogleVolume)
    .filter((b): b is BookData => b !== null);
}

// --- Open Library ----------------------------------------------------------

async function openLibraryByIsbn(isbn: string): Promise<BookData | null> {
  const data = await getJson(
    `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
  );
  const entry = data?.[`ISBN:${isbn}`];
  if (!entry?.title) return null;

  const ids = entry.identifiers ?? {};
  return {
    isbn13: ids.isbn_13?.[0] ?? (isbn.length === 13 ? isbn : undefined),
    isbn10: ids.isbn_10?.[0] ?? (isbn.length === 10 ? isbn : undefined),
    title: entry.title,
    authors: (entry.authors ?? []).map((a: any) => a.name).filter(Boolean),
    subjects: (entry.subjects ?? []).map((s: any) => s.name).filter(Boolean),
    description:
      typeof entry.notes === "string" ? entry.notes : undefined,
    coverUrl: withNoDefaultCover(
      httpsify(entry.cover?.medium ?? entry.cover?.large)
    ),
    publisher: entry.publishers?.[0]?.name,
    publishedYear: yearFrom(entry.publish_date),
    language: undefined,
    source: "openlibrary",
  };
}

/** Búsqueda por texto en Open Library (respaldo cuando Google no responde). */
async function openLibrarySearch(
  query: string,
  limit = 20
): Promise<BookData[]> {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
    fields:
      "key,title,author_name,first_publish_year,isbn,cover_i,subject,publisher,language",
  });
  const data = await getJson(
    `https://openlibrary.org/search.json?${params.toString()}`
  );
  const docs: any[] = data?.docs ?? [];

  return docs
    .filter((d) => d?.title)
    .map((d) => {
      const isbns: string[] = d.isbn ?? [];
      const isbn13 = isbns.find((i) => i.length === 13);
      const isbn10 = isbns.find((i) => i.length === 10);
      return {
        isbn13,
        isbn10,
        title: d.title,
        authors: d.author_name ?? [],
        subjects: (d.subject ?? []).slice(0, 8),
        description: undefined, // la búsqueda no trae sinopsis
        // `default=false` hace que devuelva 404 en vez de una imagen en blanco,
        // así el cliente puede dibujar su cubierta de respaldo.
        coverUrl: d.cover_i
          ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg?default=false`
          : undefined,
        publisher: d.publisher?.[0],
        publishedYear: d.first_publish_year,
        language: d.language?.[0],
        source: "openlibrary" as const,
        workKey: typeof d.key === "string" ? d.key : undefined,
      };
    });
}

/**
 * La búsqueda de Open Library no trae sinopsis; hay que pedirla a la obra.
 * Se usa al guardar para que la ficha cumpla FR4 (resumen breve).
 */
export async function fetchDescription(
  workKey: string
): Promise<string | undefined> {
  if (!/^\/works\/OL\w+$/.test(workKey)) return undefined;

  const data = await getJson(`https://openlibrary.org${workKey}.json`);
  const raw = data?.description;
  const text = typeof raw === "string" ? raw : raw?.value;
  if (typeof text !== "string" || !text.trim()) return undefined;

  // Open Library incluye a veces una coletilla de origen al final.
  return stripMarkdown(text.split(/\r?\n----------/)[0]);
}

/** Las sinopsis vienen en Markdown; la ficha las muestra como texto plano. */
function stripMarkdown(text: string): string {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")          // imágenes
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")        // enlaces -> texto
    .replace(/(\*\*\*|___)(.+?)\1/g, "$2")          // negrita+cursiva
    .replace(/(\*\*|__)(.+?)\1/g, "$2")             // negrita
    .replace(/(\*|_)(.+?)\1/g, "$2")                // cursiva
    .replace(/^#{1,6}\s+/gm, "")                    // encabezados
    .replace(/^>\s?/gm, "")                         // citas
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// --- API pública del módulo -----------------------------------------------

export async function lookupByIsbn(
  rawIsbn: string,
  apiKey?: string
): Promise<BookData | null> {
  const isbn = normalizeIsbn(rawIsbn);
  if (!isValidIsbn(isbn)) return null;

  // 1) Google Books por ISBN
  const google = await googleSearch(`isbn:${isbn}`, apiKey, 1);
  if (google.length > 0) return google[0];

  // 2) Respaldo: Open Library
  return await openLibraryByIsbn(isbn);
}

function dedupe(books: BookData[]): BookData[] {
  const seen = new Set<string>();
  const out: BookData[] = [];
  for (const b of books) {
    const key = b.isbn13 ?? `${b.title}|${b.authors.join(",")}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(b);
  }
  return out;
}

export async function searchByTitle(
  query: string,
  apiKey?: string
): Promise<BookData[]> {
  const q = query.trim();
  if (!q) return [];

  // Google Books primero; si no devuelve nada (cuota agotada, caída, sin
  // resultados) se cae a Open Library, que no necesita clave.
  const google = await googleSearch(q, apiKey, 20);
  if (google.length > 0) return dedupe(google);

  return dedupe(await openLibrarySearch(q, 20));
}
