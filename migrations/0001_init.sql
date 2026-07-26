-- ShelfZero — esquema inicial
-- Single-user por instancia: la identidad la resuelve Cloudflare Access en el borde,
-- por eso no hay tabla de usuarios.

CREATE TABLE IF NOT EXISTS books (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  isbn13         TEXT,
  isbn10         TEXT,
  title          TEXT NOT NULL,
  authors        TEXT,              -- JSON: ["Autor 1", "Autor 2"]
  subjects       TEXT,              -- JSON: ["Materia 1", ...]
  description    TEXT,              -- resumen breve
  cover_url      TEXT,
  publisher      TEXT,
  published_year INTEGER,
  language       TEXT,
  status         TEXT NOT NULL DEFAULT 'wishlist',  -- 'wishlist' | 'bought'
  source         TEXT,              -- 'google' | 'openlibrary' | 'manual'
  created_at     INTEGER NOT NULL,
  updated_at     INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_books_status  ON books (status);
CREATE INDEX IF NOT EXISTS idx_books_created ON books (created_at);
CREATE INDEX IF NOT EXISTS idx_books_title   ON books (title);

CREATE TABLE IF NOT EXISTS lists (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  color      TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS book_lists (
  book_id INTEGER NOT NULL REFERENCES books (id) ON DELETE CASCADE,
  list_id INTEGER NOT NULL REFERENCES lists (id) ON DELETE CASCADE,
  PRIMARY KEY (book_id, list_id)
);

CREATE TABLE IF NOT EXISTS shares (
  token      TEXT PRIMARY KEY,
  kind       TEXT NOT NULL,         -- 'book' | 'list'
  ref_id     INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);
