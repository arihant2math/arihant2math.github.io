import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getPosts, postUrl } from "../lib/blog";

export async function GET(context: APIContext) {
  return rss({
    title: "Ashwin's Website",
    description: "Ashwin Naren's personal website.",
    site: context.site!,
    items: (await getPosts()).map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.summary,
      link: postUrl(post),
    })),
  });
}
