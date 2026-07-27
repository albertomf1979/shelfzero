export type Theme = "light" | "dark" | "system";

const KEY = "szTheme";

export function getTheme(): Theme {
  const t = localStorage.getItem(KEY);
  return t === "light" || t === "dark" || t === "system" ? t : "system";
}

/** Aplica el tema y ajusta el color de la barra del navegador. */
export function applyTheme(t: Theme) {
  const dark =
    t === "dark" ||
    (t === "system" && matchMedia("(prefers-color-scheme: dark)").matches);

  document.documentElement.classList.toggle("dark", dark);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", dark ? "#191411" : "#f4ecdd");
  localStorage.setItem(KEY, t);
}

/** Mientras la preferencia sea "system", seguir los cambios del sistema. */
export function watchSystemTheme() {
  const mq = matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => {
    if (getTheme() === "system") applyTheme("system");
  };
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
