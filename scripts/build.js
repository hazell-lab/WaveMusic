// copies the app into dist/ and checks that every local reference resolves.
// there is no bundling step: the browser loads the es modules as they are.
// usage: node scripts/build.js

import { cp, mkdir, readFile, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { COLLECTIONS } from "../js/data/catalogue.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DIST = path.join(ROOT, "dist");
const ENTRIES = ["index.html", "css", "js", "assets", "LICENSE"];

async function exists(file) {
  return Boolean(await stat(file).catch(() => null));
}

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

// local references a file makes, as paths relative to the file or the site root
function referencesIn(file, text) {
  const refs = [];
  const add = (spec, base) => {
    if (!spec || /^(?:[a-z]+:|\/\/|#|data:)/i.test(spec) || spec.includes("${")) return;
    refs.push({ spec, base });
  };
  const ext = path.extname(file);
  if (ext === ".js") {
    for (const m of text.matchAll(/(?:import|export)\s[^"'`;]*?from\s*["']([^"']+)["']/g)) add(m[1], "file");
    for (const m of text.matchAll(/import\(\s*["']([^"']+)["']\s*\)/g)) add(m[1], "file");
    for (const m of text.matchAll(/["'`](assets\/[^"'`]+\.(?:svg|png|jpg))["'`]/g)) add(m[1], "root");
  } else if (ext === ".html") {
    for (const m of text.matchAll(/\s(?:src|href)="([^"]+)"/g)) add(m[1], "root");
  } else if (ext === ".css") {
    for (const m of text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) add(m[1], "file");
  }
  return refs;
}

async function main() {
  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });
  for (const entry of ENTRIES) {
    await cp(path.join(ROOT, entry), path.join(DIST, entry), { recursive: true });
  }

  const files = await walk(DIST);
  const missing = [];
  let checked = 0;
  for (const file of files) {
    if (![".js", ".html", ".css"].includes(path.extname(file))) continue;
    const text = await readFile(file, "utf8");
    for (const { spec, base } of referencesIn(file, text)) {
      checked++;
      const clean = spec.split(/[?#]/)[0];
      const target = base === "root" ? path.join(DIST, clean) : path.resolve(path.dirname(file), clean);
      if (!(await exists(target))) missing.push(path.relative(DIST, file) + " -> " + spec);
    }
  }

  // collection covers are built from ids at runtime, so check them by id
  for (const item of COLLECTIONS) {
    const cover = path.join(DIST, "assets", "playlists", item.id, "cover.svg");
    checked++;
    if (!(await exists(cover))) missing.push("collection " + item.id + " -> " + path.relative(DIST, cover));
  }

  if (missing.length) {
    console.error("Build failed. These references do not resolve:\n  " + missing.join("\n  "));
    process.exitCode = 1;
    return;
  }

  let bytes = 0;
  for (const file of files) bytes += (await stat(file)).size;
  console.log("Built dist/ with " + files.length + " files (" + (bytes / 1024).toFixed(0) + " KB). All " + checked + " local references resolve.");
}

main();
