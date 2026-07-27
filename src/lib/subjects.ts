const NOISE = [
  /^(spanish|english|french|german|italian|portuguese) language books?$/i,
  /^fiction in (english|spanish|french|german)$/i,
  /^(fiction|non-?fiction|literature|general|miscellanea)$/i,
  /^(large type books|reading materials|texts|accessible book)$/i,
  /^(protected daisy|in library|internet archive wishlist|overdrive)$/i,
  /^new york times bestseller/i,
  /\(imaginary place\)/i,
  /^translations into/i,
];

const ES: Record<string, string> = {
  "science fiction": "Ciencia ficción",
  "fantasy fiction": "Fantasía",
  "detective and mystery stories": "Misterio",
  "historical fiction": "Novela histórica",
  "psychohistory": "Psicohistoria",
  "mothers and sons": "Madres e hijos",
  "technology and civilization": "Tecnología y civilización",
  "human evolution": "Evolución humana",
  "families": "Familia",
  "love stories": "Novela romántica",
  "biography": "Biografía",
  "essays": "Ensayo",
  "poetry": "Poesía",
};

const titleCase = (s: string) =>
  s.replace(/\s+/g, " ").trim().replace(/^./, (c) => c.toUpperCase());

/** Devuelve hasta `max` temáticas útiles, sin ruido, en español cuando se conoce. */
export function cleanSubjects(subjects: string[] = [], max = 3): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of subjects) {
    for (const part of raw.split(/\s*[,;—]\s*|\s+--\s+/)) {
      const s = part.trim();
      if (!s || s.length < 3 || s.length > 34) continue;
      if (NOISE.some((re) => re.test(s))) continue;
      const label = ES[s.toLowerCase()] ?? titleCase(s);
      const key = label.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(label);
      if (out.length >= max) return out;
    }
  }
  return out;
}
