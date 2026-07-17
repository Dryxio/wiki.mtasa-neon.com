import fs from "node:fs";

const routesFile = new URL("./.openai/routes.json", import.meta.url);
const staticRoutes = fs.existsSync(routesFile)
  ? JSON.parse(fs.readFileSync(routesFile, "utf8"))
  : [];

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async rewrites() {
    return {
      beforeFiles: staticRoutes,
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
