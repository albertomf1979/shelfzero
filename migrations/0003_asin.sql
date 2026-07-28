-- Identificador de Amazon. Los libros autopublicados en KDP, y en general los
-- ebooks, llevan ASIN en lugar de ISBN, así que sin esto no había forma de
-- guardar su referencia.
ALTER TABLE books ADD COLUMN asin TEXT;
