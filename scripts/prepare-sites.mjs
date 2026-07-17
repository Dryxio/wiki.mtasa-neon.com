import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const source = path.join(root, "web", "dist");
const destination = path.join(root, "public");
const routesPath = path.join(root, ".openai", "routes.json");

await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
await cp(source, destination, { recursive: true });

const htmlFiles = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(absolute);
    } else if (entry.name.endsWith(".html")) {
      htmlFiles.push(path.relative(destination, absolute));
    }
  }
}

await walk(destination);

const routes = htmlFiles
  .filter((file) => file !== "404.html")
  .map((file) => {
    const withoutExtension = file.slice(0, -".html".length);
    const sourceRoute = withoutExtension === "index" ? "/" : `/${withoutExtension}`;
    return {
      source: sourceRoute,
      destination: `/${file}`,
    };
  });

await mkdir(path.dirname(routesPath), { recursive: true });
await writeFile(routesPath, `${JSON.stringify(routes, null, 2)}\n`);

console.log(`Prepared ${htmlFiles.length} static pages and ${routes.length} extensionless routes for Sites.`);
