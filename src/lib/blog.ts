import { getCollection, type CollectionEntry } from "astro:content";

export const getPosts = async () =>
  (await getCollection("blog")).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

export const postUrl = (post: CollectionEntry<"blog">) => post.data.externalUrl ?? `/blog/${post.id}/`;

export const formatDate = (date: Date) =>
  date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
