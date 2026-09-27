import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

export default defineConfig({
  plugins: [preact()],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    lib: {
      entry: "src/form-main.tsx",
      name: "MintBotForm",
      formats: ["iife"],
      fileName: () => "form.js",
    },
    outDir: "dist",
    emptyOutDir: false,
  },
});
