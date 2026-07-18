// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import path from "node:path";
import { SITE_TITLE, SITE_URL } from "./src/content.constants";

export default defineConfig({
  site: SITE_URL,
  build: {
    // Directory indexes keep public routes extensionless on static hosts.
    format: "directory",
  },
  vite: {
    ssr: {
      noExternal: ["zod"],
    },
    resolve: {
      alias: {
        "@src": path.resolve("./src"),
      },
    },
  },
  integrations: [
    starlight({
      favicon: "favicon.svg",
      title: SITE_TITLE,
      social: [
        {
          icon: "github",
          label: "Neon documentation on GitHub",
          href: "https://github.com/Dryxio/wiki.mtasa-neon.com",
        },
      ],
      editLink: {
        baseUrl: "https://github.com/Dryxio/wiki.mtasa-neon.com/edit/main/web/",
      },
      components: {
        PageTitle: "./src/overrides/PageTitle.astro",
        Pagination: "./src/overrides/Pagination.astro",
      },
      customCss: ["./src/styles/custom.css"],
      disable404Route: true,
      sidebar: [
        {
          label: "MTA:SA Neon",
          items: [
            { label: "Overview", link: "/neon" },
            { label: "What's different", link: "/neon/features" },
            { label: "Neon Lua API", link: "/neon/functions" },
            { label: "Extended world", link: "/neon/extended-world" },
            { label: "Native world packs", link: "/neon/native-world" },
            { label: "Custom models", link: "/neon/models-and-streaming" },
            { label: "Rendering & limits", link: "/neon/rendering-and-limits" },
            { label: "Story runtime", link: "/neon/story-runtime" },
            { label: "Compatibility", link: "/neon/compatibility" },
            { label: "Tooling & verification", link: "/neon/tooling-and-verification" },
          ],
        },
        {
          label: "Official MTA documentation ↗",
          items: [
            { label: "MTA Wiki", link: "https://wiki.multitheftauto.com/wiki/Main_Page" },
            { label: "Scripting functions", link: "https://wiki.multitheftauto.com/wiki/Scripting_Functions" },
            { label: "Scripting events", link: "https://wiki.multitheftauto.com/wiki/Scripting_Events" },
            { label: "Elements", link: "https://wiki.multitheftauto.com/wiki/Element" },
          ],
        },
      ],
    }),
  ],
});
