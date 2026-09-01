import { defineCollection } from "astro:content";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";

// The public site deliberately loads Neon guides only. The original MTA data
// remains available in Git history and the standard reference stays canonical
// on the official MTA wiki.
export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
};
