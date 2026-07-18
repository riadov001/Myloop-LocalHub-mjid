/**
 * Production Vite config — utilisé uniquement par le script build-hostinger.sh
 * N'importe aucun plugin Replit.
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("node_modules/react") ||
            id.includes("node_modules/react-dom") ||
            id.includes("node_modules/scheduler")
          ) {
            return "react-vendor";
          }
          if (
            id.includes("node_modules/@radix-ui") ||
            id.includes("node_modules/lucide-react") ||
            id.includes("node_modules/class-variance-authority") ||
            id.includes("node_modules/clsx") ||
            id.includes("node_modules/tailwind-merge")
          ) {
            return "ui-vendor";
          }
          if (
            id.includes("node_modules/recharts") ||
            id.includes("node_modules/d3-")
          ) {
            return "charts-vendor";
          }
          if (id.includes("node_modules/date-fns")) {
            return "date-vendor";
          }
          if (id.includes("node_modules/@tanstack")) {
            return "query-vendor";
          }
          if (
            id.includes("node_modules/zod") ||
            id.includes("node_modules/axios")
          ) {
            return "lib-vendor";
          }
        },
      },
    },
  },
});
