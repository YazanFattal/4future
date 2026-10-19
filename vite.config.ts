import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "three-core": ["three"],
          "three-react": ["@react-three/fiber", "@react-three/drei"],
          motion: ["motion/react"],
        },
      },
    },
    chunkSizeWarningLimit: 900,
  },
});
