import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";

const root = resolve("dist");
async function filesIn(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) =>
      entry.isDirectory()
        ? filesIn(join(directory, entry.name), `${prefix}${entry.name}/`)
        : [`${prefix}${entry.name}`],
    ),
  );
  return files.flat();
}
const files = (await filesIn(root))
  .filter(
    (name) =>
      /\.(html|js|css|svg|png|webmanifest)$/.test(name) && name !== "sw.js",
  )
  .sort();
const digest = createHash("sha256");
for (const file of files) digest.update(await readFile(join(root, file)));
const version = digest.digest("hex").slice(0, 16);
const worker = `/* Generated from this exact build. Only public app assets are cached. */
const CACHE_PREFIX = '4future-shell-';
const CACHE_NAME = CACHE_PREFIX + '${version}';
const ROOT = new URL('./', self.location.href);
const FILES = ${JSON.stringify(["./", ...files])};
const URLS = FILES.map(path => new URL(path, ROOT).href);
const ALLOWED = new Set(URLS);
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(URLS.map(async url => {
      const response = await fetch(url, { cache: 'reload', credentials: 'same-origin' });
      if (!response.ok || response.redirected) throw new Error('App files could not be cached');
      await cache.put(url, response);
    }));
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => { if (event.data?.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== ROOT.origin || !ALLOWED.has(url.href)) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try { return await fetch(request); }
      catch { return (await caches.match(new URL('./', ROOT).href)) || Response.error(); }
    })());
  } else {
    event.respondWith((async () => (await caches.match(request)) || fetch(request))());
  }
});
`;
await writeFile(join(root, "sw.js"), worker);
console.log(`Offline app shell: ${files.length + 1} files, version ${version}`);
