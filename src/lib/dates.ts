const FULL = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const SHORT = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** "3 de marzo de 2026" — para la ficha. */
export function formatDate(ms: number): string {
  return FULL.format(new Date(ms));
}

/** "3 mar 2026" — para listados, donde el espacio manda. */
export function formatDateShort(ms: number): string {
  return SHORT.format(new Date(ms)).replace(/\./g, "");
}

/** Para el atributo `datetime` de <time>. */
export function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}
