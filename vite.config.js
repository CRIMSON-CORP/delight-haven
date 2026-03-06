import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        services: "services.html",
        about: "about.html",
        blog: "blog.html",
        contact: "contact.html",
      },
    },
  },
});
