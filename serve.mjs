import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, sep, extname } from "node:path";

const root = fileURLToPath(new URL("./dist/", import.meta.url));
const checking = process.argv.includes("--check");
const port = checking ? 0 : 4173;
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
};
const server = createServer(async (request, response) => {
  try {
    if (!["GET", "HEAD"].includes(request.method)) {
      response.writeHead(405);
      response.end("Method not allowed");
      return;
    }
    const pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
    const target = resolve(
      root,
      `.${pathname === "/" ? "/index.html" : pathname}`,
    );
    if (!target.startsWith(root.endsWith(sep) ? root : root + sep)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }
    const body = await readFile(target);
    response.writeHead(200, {
      "Content-Type": types[extname(target)] ?? "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-cache",
    });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});
server.on("error", (error) => {
  console.error(
    error.code === "EADDRINUSE"
      ? "Port 4173 is already in use. Close the other 4FUTURE server and try again."
      : "Could not start the local server. Check your local network permissions.",
  );
  process.exitCode = 1;
});
server.listen(port, "127.0.0.1", async () => {
  const address = server.address();
  const url = `http://127.0.0.1:${address.port}`;
  if (!checking) {
    console.log(
      `4FUTURE is ready: ${url}\nOpen this address in your browser. Press Ctrl+C to stop.`,
    );
    return;
  }
  try {
    const response = await fetch(url);
    const html = await response.text();
    if (response.status !== 200 || !html.includes("4FUTURE"))
      throw new Error("Invalid index");
    const assets = [...html.matchAll(/(?:src|href)="(\.\/[^\"]+)"/g)].map(
      (m) => m[1],
    );
    for (const path of assets) {
      const asset = await fetch(new URL(path, url));
      if (asset.status !== 200) throw new Error("Missing asset");
    }
    const missing = await fetch(`${url}/missing-file`);
    if (missing.status !== 404)
      throw new Error("Missing file should return 404");
    console.log(
      `Production HTTP check passed: index, ${assets.length} bundled assets, and 404 handling.`,
    );
  } catch (error) {
    console.error("Production HTTP check failed:", error.message);
    process.exitCode = 1;
  } finally {
    server.close();
    server.closeAllConnections();
  }
});
