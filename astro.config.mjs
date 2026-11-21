import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://arihant2math.github.io",
  integrations: [sitemap()],
  markdown: { syntaxHighlight: false },
});
