import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(
  new URL("../dist/sw.js", import.meta.url),
  "utf8",
);
function worker({ networkFails = false, redirect = false } = {}) {
  const listeners = {},
    saved = new Map(),
    deleted = [],
    requested = [];
  let claimed = false,
    skipped = false;
  const cache = { put: async (key, value) => saved.set(key, value) };
  const caches = {
    open: async () => cache,
    match: async (key) => saved.get(typeof key === "string" ? key : key.url),
    keys: async () => ["4future-shell-old", "another-app-cache"],
    delete: async (key) => {
      deleted.push(key);
      return true;
    },
  };
  const self = {
    location: { href: "https://future.example/game/sw.js" },
    clients: {
      claim: async () => {
        claimed = true;
      },
    },
    skipWaiting: () => {
      skipped = true;
    },
    addEventListener: (name, fn) => {
      listeners[name] = fn;
    },
  };
  const fetch = async (url) => {
    requested.push(url);
    if (networkFails) throw new Error("offline");
    return { ok: true, redirected: redirect, marker: "network" };
  };
  vm.runInNewContext(source, {
    self,
    caches,
    fetch,
    URL,
    Set,
    Promise,
    Response,
  });
  return {
    listeners,
    saved,
    deleted,
    requested,
    get claimed() {
      return claimed;
    },
    get skipped() {
      return skipped;
    },
  };
}
test("install manifest provides real platform icon files and relative app scope", async () => {
  const manifest = JSON.parse(
    await readFile(
      new URL("../dist/manifest.webmanifest", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "./");
  assert.equal(manifest.scope, "./");
  for (const size of [192, 512]) {
    const icon = manifest.icons.find((i) => i.sizes === `${size}x${size}`);
    assert.ok(icon);
    const png = await readFile(new URL(`../dist/${icon.src}`, import.meta.url));
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
  }
  await access(new URL("../dist/icons/apple-touch-icon.png", import.meta.url));
});
test("service worker precaches the complete relative app shell", async () => {
  const w = worker();
  let promise;
  w.listeners.install({
    waitUntil: (p) => {
      promise = p;
    },
  });
  await promise;
  assert.ok(w.saved.has("https://future.example/game/"));
  assert.ok(w.saved.has("https://future.example/game/manifest.webmanifest"));
  assert.ok([...w.saved.keys()].some((url) => url.endsWith(".js")));
  assert.ok(
    [...w.saved.keys()].every((url) =>
      url.startsWith("https://future.example/game/"),
    ),
  );
});
test("offline page requests fall back to the cached app shell", async () => {
  const w = worker({ networkFails: true }),
    shell = { marker: "cached shell" };
  let response;
  w.saved.set("https://future.example/game/", shell);
  w.listeners.fetch({
    request: {
      method: "GET",
      mode: "navigate",
      url: "https://future.example/game/",
    },
    respondWith: (p) => {
      response = p;
    },
  });
  assert.equal(await response, shell);
});
test("API calls, POST requests, external requests, and unknown paths bypass caching", () => {
  const w = worker();
  for (const request of [
    { method: "POST", url: "https://future.example/game/" },
    { method: "GET", url: "https://future.example/api/predict" },
    { method: "GET", url: "https://another.example/game/" },
    { method: "GET", url: "https://future.example/auth" },
  ])
    w.listeners.fetch({
      request,
      respondWith: () => assert.fail("Private or unknown request intercepted"),
    });
  assert.equal(w.requested.length, 0);
});
test("authentication redirects are never installed as the offline app", async () => {
  const w = worker({ redirect: true });
  let promise;
  w.listeners.install({
    waitUntil: (p) => {
      promise = p;
    },
  });
  await assert.rejects(promise, /could not be cached/);
  assert.equal(w.saved.size, 0);
});
test("updates require an explicit message and only retire this app’s own caches", async () => {
  const w = worker();
  let promise;
  assert.equal(w.skipped, false);
  w.listeners.message({ data: { type: "SKIP_WAITING" } });
  assert.equal(w.skipped, true);
  w.listeners.activate({
    waitUntil: (p) => {
      promise = p;
    },
  });
  await promise;
  assert.deepEqual(w.deleted, ["4future-shell-old"]);
  assert.equal(w.claimed, true);
});
