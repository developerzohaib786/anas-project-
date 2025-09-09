import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false, // Disable error overlay that can cause white flashes
      clientPort: 8080, // Ensure consistent HMR port
    },
    fs: {
      strict: false, // Allow serving files from outside root
    },
    watch: {
      usePolling: false, // Disable polling to reduce resource usage
    },
    middlewareMode: false, // Ensure full dev server mode
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined, // Prevent chunk splitting that can cause loading issues
      },
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
    ], // Pre-bundle these to prevent reload on first use
  },
}));
