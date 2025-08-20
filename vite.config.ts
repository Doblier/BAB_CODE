import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: "src",
  build: { outDir: "../dist", emptyOutDir: true },
  server: {
    port: 5173,
    strictPort: true, // Force port 5173 for Electron consistency
    hmr: true
  }
}); 