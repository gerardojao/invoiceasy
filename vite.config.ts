import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",           // SW se actualiza solo
      includeAssets: [
        "favicon.ico",
        "android/icon-192-192.png",
        "android/icon-512-512.png",
        "apple-touch-icon.png"
      ],
      manifest: {
        name: "Tu Factura al Instante",
        short_name: "InvoiceEasy",
        description: "Genera, guarda y comparte facturas al instante, también sin conexión.",
        theme_color: "#10b981",
        background_color: "#ffffff",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          { src: "android/icon-192-192.png", sizes: "192x192", type: "image/png" },
          { src: "android/icon-512-512.png", sizes: "512x512", type: "image/png" },
          { src: "android/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
        ]
      },
      workbox: {
        // Cachea assets de build y navegación básica offline
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        navigateFallback: "/index.html",
        runtimeCaching: [
          // ejemplo: cache de fuentes Google (si las usas)
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
});
