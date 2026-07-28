import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { VitePWA } from "vite-plugin-pwa";

/**
 * La app se sirve bajo albertomartinfernandez.com/shelfzero, así que todo
 * (assets, API, PWA y enlaces compartidos) cuelga de ese prefijo. En local
 * ocurre lo mismo para que lo que se prueba sea lo que se despliega.
 */
const BASE = "/shelfzero/";

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    tailwindcss(),
    cloudflare(),
    VitePWA({
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
        id: BASE,
        scope: BASE,
        start_url: BASE,
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
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        navigateFallbackDenylist: [/\/api\//],
        runtimeCaching: [
          {
            // El estante ya visto sigue consultable sin conexión.
            urlPattern: /\/shelfzero\/api\/(books|lists)/,
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
