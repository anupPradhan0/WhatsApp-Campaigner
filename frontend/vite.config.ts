import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    drop: mode === "production" ? ["console", "debugger"] : [],
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return;
          if (id.includes("react-router")) return "react";
          if (id.match(/node_modules[\\/](react|react-dom|scheduler)[\\/]/)) return "react";
          if (id.includes("@tanstack")) return "query";
          if (id.includes("recharts") || id.includes("d3-")) return "charts";
          if (id.includes("react-quill") || id.includes("quill")) return "editor";
          if (id.includes("lucide-react")) return "icons";
        },
      },
    },
  },
  server: {
    port: 5173,
    // Mirror production: the dev server proxies /api so the browser only ever
    // sees one origin and the SameSite=Lax auth cookie behaves the same here.
    proxy: {
      "/api": process.env.VITE_DEV_API_TARGET || "http://localhost:8080",
      "/uploads": process.env.VITE_DEV_API_TARGET || "http://localhost:8080",
    },
  },
}));
