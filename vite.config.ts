import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { VitePWA } from "vite-plugin-pwa";

/**
 * Un mismo build sirve las dos versiones de la app:
 *
 *   /myshelfzero     estante privado, protegido con contraseña
 *   /shelfzerodemo   demostración pública, limitada a 3 libros
 *
 * Por eso los assets se referencian en relativo (`base: "./"`): así resuelven
 * bajo cualquier prefijo. El prefijo real lo deduce el cliente en tiempo de
 * ejecución a partir de la URL, y el Worker lo recorta antes de enrutar.
 *
 * La PWA solo tiene sentido para la versión privada, que es la que se usa a
 * diario; la demostración no se registra como aplicación instalable.
 */
const APP_BASE = "/myshelfzero/";

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    tailwindcss(),
    cloudflare(),
    VitePWA({
      // El service worker se autodestruye a propósito.
      //
      // Con una app protegida por contraseña, cachear el documento es un
      // problema de seguridad: el servidor respondía "identifícate" y el
      // navegador seguía enseñando la copia guardada. Se intentó primero sin
      // precache de HTML y luego con NetworkFirst, y en ambos casos quedaban
      // huecos. Un estante privado tiene que preguntarle siempre al servidor,
      // así que se renuncia al uso sin conexión: cada carga pasa por el
      // candado. Este service worker, además, borra los que hubiera instalados.
      selfDestroying: true,
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "ShelfZero — tu estante de libros",
        short_name: "ShelfZero",
        description:
          "Guarda los libros que quieres comprar, organízalos y decide dónde comprarlos.",
        lang: "es",
        theme_color: "#9a3b32",
        background_color: "#f4ecdd",
        display: "standalone",
        orientation: "portrait",
        id: APP_BASE,
        scope: APP_BASE,
        start_url: APP_BASE,
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // El HTML se queda fuera del precache a propósito. Workbox resuelve
        // "/myshelfzero/" contra su index.html precacheado (directoryIndex) y
        // eso servía la app sin pasar por el servidor, saltándose la
        // contraseña. Los documentos van siempre por red; sin conexión los
        // cubre la regla NetworkFirst de abajo.
        globPatterns: ["**/*.{js,css,svg,png,woff2}"],
        directoryIndex: null,
        // Sin navigateFallback a propósito. Con él, el service worker servía
        // el index.html precacheado ante cualquier navegación y eso se saltaba
        // la pantalla de contraseña: el servidor decía "identifícate" y el
        // navegador enseñaba la app igualmente. Las navegaciones pasan ahora
        // por red (NetworkFirst, abajo) y solo caen a caché si no hay conexión.
        navigateFallback: undefined,
        // Un service worker viejo no debe sobrevivir a un despliegue.
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            // La navegación siempre consulta al servidor: es quien decide si
            // toca pantalla de acceso o app. La caché es solo la red de
            // seguridad para cuando no hay conexión.
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "shelfzero-shell",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 10 },
            },
          },
          {
            // El estante ya visto sigue consultable sin conexión.
            urlPattern: /\/myshelfzero\/api\/(books|lists)/,
            handler: "NetworkFirst",
            options: {
              cacheName: "shelfzero-api",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            // Portadas: pesan y no cambian.
            urlPattern: ({ url }) =>
              url.hostname === "covers.openlibrary.org" ||
              url.hostname === "books.google.com" ||
              url.hostname.endsWith("googleusercontent.com"),
            handler: "CacheFirst",
            options: {
              cacheName: "shelfzero-covers",
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
});
