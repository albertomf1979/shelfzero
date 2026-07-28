import { Hono } from "hono";
import {
  checkPassword,
  clearCookie,
  isAuthenticated,
  loginPage,
  sessionCookie,
} from "./auth";
import {
  lookupByIsbn,
  searchByTitle,
  normalizeIsbn,
  isValidIsbn,
  fetchDescription,
  type BookData,
} from "./providers";

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  GOOGLE_BOOKS_API_KEY?: string;
  /** Contraseña del estante privado. Se guarda como secreto, nunca en el repo. */
  APP_PASSWORD?: string;
}

/**
 * El mismo Worker sirve dos versiones:
 *
 *   /myshelfzero     estante privado, tras contraseña, sobre D1
 *   /shelfzerodemo   demostración pública; sus datos viven en el navegador,
 *                    así que aquí solo se permiten las búsquedas
 *
 * El prefijo se recorta antes de que Hono enrute, de modo que las rutas de
 * aquí siguen siendo "/api/…" y los assets se buscan por su ruta real.
 */
const PRIVATE_BASE = "/myshelfzero";
const DEMO_BASE = "/shelfzerodemo";
const BASES = [PRIVATE_BASE, DEMO_BASE];

/** Rutas que la demostración puede usar: solo lectura de catálogos externos. */
const DEMO_ALLOWED = ["/api/lookup", "/api/search", "/api/health"];

const app = new Hono<{ Bindings: Env }>();

// --- Utilidades ------------------------------------------------------------

/** Fila de D1 -> objeto de dominio (los campos JSON viajan como texto). */
function rowToBook(row: any) {
  const parseArr = (v: unknown): string[] => {
    if (typeof v !== "string" || !v) return [];
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };
  return {
    id: row.id as number,
    isbn13: row.isbn13 as string | null,
    isbn10: row.isbn10 as string | null,
    asin: row.asin as string | null,
    title: row.title as string,
    authors: parseArr(row.authors),
    subjects: parseArr(row.subjects),
    description: row.description as string | null,
    coverUrl: row.cover_url as string | null,
    publisher: row.publisher as string | null,
    publishedYear: row.published_year as number | null,
    language: row.language as string | null,
    status: row.status as "wishlist" | "bought",
    recommendedBy: row.recommended_by as string | null,
    source: row.source as string | null,
    createdAt: row.created_at as number,
    updatedAt: row.updated_at as number,
    listIds: parseListIds(row.list_ids),
  };
}

function parseListIds(v: unknown): number[] {
  if (typeof v !== "string" || !v) return [];
  return v
    .split(",")
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n));
}

/** SELECT del estante con las listas de cada libro agregadas. */
const BOOKS_SELECT = `
  SELECT b.*, GROUP_CONCAT(bl.list_id) AS list_ids
  FROM books b
  LEFT JOIN book_lists bl ON bl.book_id = b.id
`;

// --- Salud -----------------------------------------------------------------

app.get("/api/health", async (c) => {
  let db = false;
  try {
    await c.env.DB.prepare("SELECT 1").first();
    db = true;
  } catch {
    db = false;
  }
  return c.json({ ok: true, name: "ShelfZero", db });
});

// --- Búsqueda de metadatos -------------------------------------------------

/** Busca un libro exacto por ISBN. */
app.get("/api/lookup", async (c) => {
  const isbn = c.req.query("isbn") ?? "";
  if (!isbn) return c.json({ error: "Falta el parámetro isbn" }, 400);

  const normalized = normalizeIsbn(isbn);
  if (!isValidIsbn(normalized)) {
    return c.json(
      { error: "El ISBN no es válido. Revisa los dígitos.", book: null, invalid: true },
      400
    );
  }

  const book = await lookupByIsbn(normalized, c.env.GOOGLE_BOOKS_API_KEY);
  if (!book) {
    // FR3: sin coincidencias -> el cliente pedirá el título manualmente.
    return c.json({ book: null, notFound: true });
  }
  return c.json({ book });
});

/** Busca por título: devuelve la lista de coincidencias (FR2). */
app.get("/api/search", async (c) => {
  const q = c.req.query("q") ?? "";
  if (!q.trim()) return c.json({ results: [] });

  const results = await searchByTitle(q, c.env.GOOGLE_BOOKS_API_KEY);
  return c.json({ results, notFound: results.length === 0 });
});

// --- Estante: CRUD ---------------------------------------------------------

/** Lista el estante con orden y filtro por lista. */
app.get("/api/books", async (c) => {
  const sort = c.req.query("sort") ?? "created";
  const listId = c.req.query("list");
  const status = c.req.query("status");

  const where: string[] = [];
  const binds: unknown[] = [];

  if (listId) {
    where.push("b.id IN (SELECT book_id FROM book_lists WHERE list_id = ?)");
    binds.push(Number(listId));
  }
  if (status === "wishlist" || status === "bought") {
    where.push("b.status = ?");
    binds.push(status);
  }

  // Lista blanca de ordenaciones (FR6) — nunca interpolar entrada del usuario.
  const orderBy =
    {
      alpha: "b.title COLLATE NOCASE ASC",
      created: "b.created_at DESC",
      author: "author_sort COLLATE NOCASE ASC, b.title COLLATE NOCASE ASC",
      subject: "subject_sort COLLATE NOCASE ASC, b.title COLLATE NOCASE ASC",
    }[sort] ?? "b.created_at DESC";

  // Claves auxiliares para agrupar por autor/temática (primer valor del JSON).
  const sql = `
    SELECT b.*, GROUP_CONCAT(bl.list_id) AS list_ids,
           COALESCE(json_extract(b.authors, '$[0]'), 'zzz') AS author_sort,
           COALESCE(json_extract(b.subjects, '$[0]'), 'zzz') AS subject_sort
    FROM books b
    LEFT JOIN book_lists bl ON bl.book_id = b.id
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    GROUP BY b.id
    ORDER BY ${orderBy}
  `;

  const { results } = await c.env.DB.prepare(sql)
    .bind(...binds)
    .all();
  return c.json({ books: (results ?? []).map(rowToBook) });
});

/** Ficha individual. */
app.get("/api/books/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const row = await c.env.DB.prepare(
    `${BOOKS_SELECT} WHERE b.id = ? GROUP BY b.id`
  )
    .bind(id)
    .first();
  if (!row) return c.json({ error: "No encontrado" }, 404);
  return c.json({ book: rowToBook(row) });
});

/** Añade un libro al estante. */
app.post("/api/books", async (c) => {
  const body = (await c.req.json().catch(() => null)) as
    | (Partial<BookData> & { listIds?: number[] })
    | null;

  if (!body?.title?.trim()) {
    return c.json({ error: "El título es obligatorio" }, 400);
  }

  // FR4: la ficha necesita un resumen. La búsqueda de Open Library no lo
  // incluye, así que lo pedimos a la obra antes de guardar.
  let description = body.description;
  if (!description && body.workKey) {
    description = await fetchDescription(body.workKey);
  }

  const now = Date.now();
  const isbn13 = body.isbn13 ? normalizeIsbn(body.isbn13) : null;

  // Evitar duplicados por ISBN-13.
  if (isbn13) {
    const existing = await c.env.DB.prepare(
      "SELECT id FROM books WHERE isbn13 = ?"
    )
      .bind(isbn13)
      .first();
    if (existing) {
      return c.json(
        { error: "Ese libro ya está en tu estante", id: existing.id, duplicate: true },
        409
      );
    }
  }

  const result = await c.env.DB.prepare(
    `INSERT INTO books
      (isbn13, isbn10, asin, title, authors, subjects, description, cover_url,
       publisher, published_year, language, status, source, recommended_by,
       created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'wishlist', ?, ?, ?, ?)`
  )
    .bind(
      isbn13,
      body.isbn10 ? normalizeIsbn(body.isbn10) : null,
      body.asin?.trim().toUpperCase() || null,
      body.title.trim(),
      JSON.stringify(body.authors ?? []),
      JSON.stringify(body.subjects ?? []),
      description ?? null,
      body.coverUrl ?? null,
      body.publisher ?? null,
      body.publishedYear ?? null,
      body.language ?? null,
      body.source ?? "manual",
      body.recommendedBy?.trim() || null,
      now,
      now
    )
    .run();

  const id = result.meta.last_row_id;

  // Asignación inicial a listas, si viene.
  if (body.listIds?.length) {
    const stmts = body.listIds.map((listId) =>
      c.env.DB.prepare(
        "INSERT OR IGNORE INTO book_lists (book_id, list_id) VALUES (?, ?)"
      ).bind(id, listId)
    );
    await c.env.DB.batch(stmts);
  }

  const row = await c.env.DB.prepare(
    `${BOOKS_SELECT} WHERE b.id = ? GROUP BY b.id`
  )
    .bind(id)
    .first();
  return c.json({ book: rowToBook(row) }, 201);
});

/** Edita campos o cambia el estado (comprado). */
app.patch("/api/books/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = (await c.req.json().catch(() => null)) as Record<string, any> | null;
  if (!body) return c.json({ error: "Cuerpo no válido" }, 400);

  const editable: Record<string, string> = {
    title: "title",
    description: "description",
    coverUrl: "cover_url",
    publisher: "publisher",
    publishedYear: "published_year",
    language: "language",
    status: "status",
    isbn13: "isbn13",
    isbn10: "isbn10",
    asin: "asin",
    recommendedBy: "recommended_by",
  };

  const sets: string[] = [];
  const binds: unknown[] = [];

  for (const [key, column] of Object.entries(editable)) {
    if (key in body) {
      sets.push(`${column} = ?`);
      binds.push(body[key]);
    }
  }
  // Campos JSON
  if (Array.isArray(body.authors)) {
    sets.push("authors = ?");
    binds.push(JSON.stringify(body.authors));
  }
  if (Array.isArray(body.subjects)) {
    sets.push("subjects = ?");
    binds.push(JSON.stringify(body.subjects));
  }

  if (sets.length === 0) return c.json({ error: "Nada que actualizar" }, 400);

  sets.push("updated_at = ?");
  binds.push(Date.now(), id);

  await c.env.DB.prepare(`UPDATE books SET ${sets.join(", ")} WHERE id = ?`)
    .bind(...binds)
    .run();

  const row = await c.env.DB.prepare(
    `${BOOKS_SELECT} WHERE b.id = ? GROUP BY b.id`
  )
    .bind(id)
    .first();
  if (!row) return c.json({ error: "No encontrado" }, 404);
  return c.json({ book: rowToBook(row) });
});

/** Elimina del estante. */
app.delete("/api/books/:id", async (c) => {
  const id = Number(c.req.param("id"));
  await c.env.DB.prepare("DELETE FROM book_lists WHERE book_id = ?").bind(id).run();
  await c.env.DB.prepare("DELETE FROM books WHERE id = ?").bind(id).run();
  return c.json({ ok: true });
});

// --- Listas ----------------------------------------------------------------

app.get("/api/lists", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT l.*, COUNT(bl.book_id) AS count
     FROM lists l
     LEFT JOIN book_lists bl ON bl.list_id = l.id
     GROUP BY l.id
     ORDER BY l.created_at ASC`
  ).all();
  return c.json({ lists: results ?? [] });
});

app.post("/api/lists", async (c) => {
  const body = (await c.req.json().catch(() => null)) as { name?: string; color?: string } | null;
  const name = body?.name?.trim();
  if (!name) return c.json({ error: "El nombre es obligatorio" }, 400);

  const result = await c.env.DB.prepare(
    "INSERT INTO lists (name, color, created_at) VALUES (?, ?, ?)"
  )
    .bind(name, body?.color ?? null, Date.now())
    .run();

  return c.json(
    { list: { id: result.meta.last_row_id, name, color: body?.color ?? null, count: 0 } },
    201
  );
});

app.patch("/api/lists/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = (await c.req.json().catch(() => null)) as { name?: string } | null;
  const name = body?.name?.trim();
  if (!name) return c.json({ error: "El nombre es obligatorio" }, 400);

  await c.env.DB.prepare("UPDATE lists SET name = ? WHERE id = ?").bind(name, id).run();
  return c.json({ ok: true });
});

app.delete("/api/lists/:id", async (c) => {
  const id = Number(c.req.param("id"));
  await c.env.DB.prepare("DELETE FROM book_lists WHERE list_id = ?").bind(id).run();
  await c.env.DB.prepare("DELETE FROM lists WHERE id = ?").bind(id).run();
  return c.json({ ok: true });
});

/** Asigna / quita un libro de una lista. */
app.post("/api/lists/:id/books/:bookId", async (c) => {
  const listId = Number(c.req.param("id"));
  const bookId = Number(c.req.param("bookId"));
  await c.env.DB.prepare(
    "INSERT OR IGNORE INTO book_lists (book_id, list_id) VALUES (?, ?)"
  )
    .bind(bookId, listId)
    .run();
  return c.json({ ok: true });
});

app.delete("/api/lists/:id/books/:bookId", async (c) => {
  const listId = Number(c.req.param("id"));
  const bookId = Number(c.req.param("bookId"));
  await c.env.DB.prepare(
    "DELETE FROM book_lists WHERE book_id = ? AND list_id = ?"
  )
    .bind(bookId, listId)
    .run();
  return c.json({ ok: true });
});

// --- Compartir (FR11) ------------------------------------------------------

/** Token aleatorio no adivinable para el enlace público. */
function makeToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Crea (o reutiliza) un enlace público de solo lectura. */
app.post("/api/shares", async (c) => {
  const body = (await c.req.json().catch(() => null)) as
    | { kind?: "book" | "list"; refId?: number }
    | null;

  const kind = body?.kind;
  const refId = Number(body?.refId);
  if ((kind !== "book" && kind !== "list") || !Number.isFinite(refId)) {
    return c.json({ error: "Parámetros no válidos" }, 400);
  }

  // Comprobar que existe lo que se quiere compartir.
  const table = kind === "book" ? "books" : "lists";
  const exists = await c.env.DB.prepare(
    `SELECT id FROM ${table} WHERE id = ?`
  )
    .bind(refId)
    .first();
  if (!exists) return c.json({ error: "No encontrado" }, 404);

  // Reutilizar el enlace si ya se compartió antes: así la URL es estable.
  const previous = await c.env.DB.prepare(
    "SELECT token FROM shares WHERE kind = ? AND ref_id = ?"
  )
    .bind(kind, refId)
    .first<{ token: string }>();

  const token = previous?.token ?? makeToken();
  if (!previous) {
    await c.env.DB.prepare(
      "INSERT INTO shares (token, kind, ref_id, created_at) VALUES (?, ?, ?, ?)"
    )
      .bind(token, kind, refId, Date.now())
      .run();
  }

  // Ruta relativa: el Worker no conoce el dominio público desde el que se le
  // reenvía, así que el enlace absoluto lo compone el cliente con su origen.
  return c.json({ token, path: `${PRIVATE_BASE}/s/${token}` });
});

/** Contenido público de un enlace compartido (sin autenticación, solo lectura). */
app.get("/api/shares/:token", async (c) => {
  const token = c.req.param("token");
  const share = await c.env.DB.prepare(
    "SELECT * FROM shares WHERE token = ?"
  )
    .bind(token)
    .first<{ kind: string; ref_id: number; expires_at: number | null }>();

  if (!share) return c.json({ error: "Enlace no válido" }, 404);
  if (share.expires_at && share.expires_at < Date.now()) {
    return c.json({ error: "Este enlace ha caducado" }, 410);
  }

  if (share.kind === "book") {
    const row = await c.env.DB.prepare(
      `${BOOKS_SELECT} WHERE b.id = ? GROUP BY b.id`
    )
      .bind(share.ref_id)
      .first();
    if (!row) return c.json({ error: "No encontrado" }, 404);
    return c.json({ kind: "book", books: [rowToBook(row)], title: null });
  }

  const list = await c.env.DB.prepare("SELECT name FROM lists WHERE id = ?")
    .bind(share.ref_id)
    .first<{ name: string }>();
  if (!list) return c.json({ error: "No encontrado" }, 404);

  const { results } = await c.env.DB.prepare(
    `${BOOKS_SELECT}
     WHERE b.id IN (SELECT book_id FROM book_lists WHERE list_id = ?)
     GROUP BY b.id
     ORDER BY b.title COLLATE NOCASE ASC`
  )
    .bind(share.ref_id)
    .all();

  return c.json({
    kind: "list",
    title: list.name,
    books: (results ?? []).map(rowToBook),
  });
});

// --- Fallback SPA ----------------------------------------------------------

app.all("*", (c) => c.env.ASSETS.fetch(c.req.raw));

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    const base = BASES.find(
      (b) => url.pathname === b || url.pathname.startsWith(`${b}/`)
    );

    if (!base) return new Response("Not Found", { status: 404 });

    // "/myshelfzero" -> "/myshelfzero/": los assets se referencian en relativo
    // y necesitan la barra final. Location va en relativo a propósito: detrás
    // del dominio público, una URL absoluta llevaría al dominio workers.dev.
    if (url.pathname === base) {
      return new Response(null, {
        status: 301,
        headers: { Location: `${base}/${url.search}` },
      });
    }

    const rest = url.pathname.slice(base.length) || "/";
    const isDemo = base === DEMO_BASE;

    // --- Demostración: sin datos en el servidor -----------------------------
    if (isDemo && rest.startsWith("/api/")) {
      const allowed = DEMO_ALLOWED.some((p) => rest.startsWith(p));
      if (!allowed) {
        return Response.json(
          {
            error:
              "La demostración guarda los libros en tu navegador; no usa el servidor.",
          },
          { status: 403 }
        );
      }
    }

    // --- Estante privado: contraseña ---------------------------------------
    if (!isDemo) {
      const password = env.APP_PASSWORD;

      if (rest === "/api/login" && request.method === "POST") {
        if (!password) {
          return Response.json({ error: "Sin contraseña configurada" }, { status: 500 });
        }
        const form = await request.formData().catch(() => null);
        const given = String(form?.get("password") ?? "");
        if (!checkPassword(given, password)) return loginPage(base, true);
        return new Response(null, {
          status: 303,
          headers: {
            Location: `${base}/`,
            "Set-Cookie": await sessionCookie(password, base),
          },
        });
      }

      if (rest === "/api/logout") {
        return new Response(null, {
          status: 303,
          headers: { Location: `${base}/`, "Set-Cookie": clearCookie(base) },
        });
      }

      // La vista pública de un enlace compartido queda fuera del candado.
      const isSharedView =
        rest.startsWith("/s/") || rest.startsWith("/api/shares/");

      if (password && !isSharedView) {
        const ok = await isAuthenticated(request, password);
        if (!ok) {
          if (rest.startsWith("/api/")) {
            return Response.json({ error: "No autorizado" }, { status: 401 });
          }
          // Los assets pueden servirse: sin ellos la pantalla de acceso se ve rota.
          const isAsset = /\.[a-z0-9]+$/i.test(rest) && !rest.endsWith(".html");
          if (!isAsset) return loginPage(base);
        }
      }
    }

    // En producción los assets se sirven desde la raíz del directorio, así que
    // hay que recortar el prefijo. En desarrollo Vite ya los sirve bajo él, y
    // recortarlo provocaría un bucle de redirección: ahí solo se recorta para
    // la API, que es lo que Hono necesita enrutar.
    if (import.meta.env.PROD || rest.startsWith("/api/")) {
      url.pathname = rest;
      request = new Request(url, request);
    }

    const response = await app.fetch(request, env, ctx);

    // Nada del estante privado puede quedar en una caché compartida. El
    // servidor de assets etiqueta el HTML como "public", y la caché de borde
    // llegó a guardar la app ya autenticada y a servírsela a cualquiera que
    // pidiese la misma codificación. Vary: Cookie porque la respuesta depende
    // de la sesión.
    if (!isDemo) {
      const type = response.headers.get("Content-Type") ?? "";
      if (type.includes("text/html")) {
        const headers = new Headers(response.headers);
        headers.set("Cache-Control", "private, no-store, max-age=0");
        headers.set("Vary", "Cookie");
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      }
    }

    return response;
  },
};
