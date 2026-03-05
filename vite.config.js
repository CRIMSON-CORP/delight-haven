import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
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
