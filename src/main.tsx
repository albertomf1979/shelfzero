import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { BASE, IS_DEMO } from "./api.ts";
import { ToastProvider } from "./components/Toast.tsx";
import { applyTheme, getTheme, watchSystemTheme } from "./lib/theme.ts";
import "./index.css";

applyTheme(getTheme());
watchSystemTheme();

/**
 * Un service worker de otra ruta puede seguir sirviendo su copia en caché y
 * dejar la app en un estado que no corresponde —incluida la pantalla de
 * contraseña—. Solo debe sobrevivir el del prefijo actual, y la demostración
 * no necesita ninguno: no se instala y sus datos ya viven en el navegador.
 */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => {
      for (const reg of regs) {
        const scope = new URL(reg.scope).pathname;
        if (IS_DEMO || scope !== `${BASE}/`) reg.unregister();
      }
    })
    .catch(() => {
      // Sin permisos o navegador antiguo: no es crítico.
    });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>
);
