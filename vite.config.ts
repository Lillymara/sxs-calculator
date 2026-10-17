import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative base so the build works from any static host path (e.g. GitHub Pages).
export default defineConfig({
  base: "./",
  plugins: [react()],
  // Stamped into data-file URLs so a new deploy isn't hidden behind GitHub Pages' 10-minute cache.
  define: { __BUILD_ID__: JSON.stringify(Date.now().toString(36)) },
  // Companions bundles ~1 MB of stat curves that gzip to ~25 KB.
  build: { chunkSizeWarningLimit: 1100 },
});
