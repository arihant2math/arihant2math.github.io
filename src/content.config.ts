import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({
    pattern: "*/index.md",
    base: "./src/content/blog",
    generateId: ({ entry }) => entry.split("/")[0],
  }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    author: z.array(z.string()),
    summary: z.string(),
    tags: z.array(z.string()).optional(),
    externalUrl: z.string().url().optional(),
  }),
});

export const collections = { blog };
