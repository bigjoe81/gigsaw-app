// Small production-build server for local preview and offline e2e tests.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
const root = path.resolve("apps/live/www");
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
};
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    let file = path.resolve(root, "." + pathname);
    if (file !== root && !file.startsWith(root + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    try {
      if (!(await stat(file)).isFile()) throw new Error();
    } catch {
      if (path.extname(file)) {
        res.writeHead(404).end();
        return;
      }
      file = path.join(root, "index.html");
    }
    const bytes = await readFile(file);
    res
      .writeHead(200, {
        "Content-Type": types[path.extname(file)] ?? "application/octet-stream",
        "Cache-Control": "no-cache",
      })
      .end(bytes);
  } catch {
    res.writeHead(500).end();
  }
}).listen(4310, "127.0.0.1", () =>
  console.log("Gigsaw Live: http://127.0.0.1:4310"),
);
