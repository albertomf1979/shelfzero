import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ToastProvider } from "./components/Toast.tsx";
import { applyTheme, getTheme, watchSystemTheme } from "./lib/theme.ts";
import "./index.css";

applyTheme(getTheme());
watchSystemTheme();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>
);
