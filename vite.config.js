import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./", // относительные пути: сайт работает и в подпапке GitHub Pages, и с диска
});
