import { cp, readdir, rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const source = path.join(root, "web", "dist");
const destination = path.join(root, "dist");

await rm(destination, { recursive: true, force: true });
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

console.log(`Prepared ${htmlFiles.length} static pages for Sites in ${destination}.`);
