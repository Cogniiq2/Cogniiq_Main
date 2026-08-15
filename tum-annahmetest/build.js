/* Baut die eigenständige Einzeldatei dist/index.html aus src/. */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const src = join(root, "src");

const data = readdirSync(join(src, "data"))
  .filter((f) => f.endsWith(".js"))
  .sort()
  .map((f) => readFileSync(join(src, "data", f), "utf8"))
  .join("\n");

const app = readFileSync(join(src, "app.js"), "utf8");
const html = readFileSync(join(src, "app.html"), "utf8")
  .replace("/*__DATA__*/", () => data)
  .replace("/*__APP__*/", () => app);

const out = join(root, "dist", "index.html");
writeFileSync(out, html);
console.log(`dist/index.html — ${(html.length / 1024).toFixed(1)} kB`);
