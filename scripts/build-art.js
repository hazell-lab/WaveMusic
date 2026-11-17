// draws the cover art for curated collections and mixes, the idle player
// cover and the app icon. album artwork comes from apple music instead.
// usage: node scripts/build-art.js

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { COLLECTIONS, PALETTES } from "../js/data/catalogue.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

// same text always gives the same number, so covers are stable between runs
function seedOf(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function random(seed) {
  let s = seed || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const escape = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// a record seen from above: grooves, a label and a spindle hole
function record(cx, cy, r, primary, highlight, rand) {
  const rings = [];
  const count = 9 + Math.floor(rand() * 5);
  for (let i = 0; i < count; i++) {
    const rr = r * (0.42 + (0.58 * i) / count);
    rings.push(
      `<circle cx="${cx}" cy="${cy}" r="${rr.toFixed(1)}" fill="none" stroke="${primary}" stroke-width="${(0.8 + rand() * 1.6).toFixed(2)}" opacity="${(0.25 + rand() * 0.5).toFixed(2)}"/>`
    );
  }
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#0c0b0a" opacity="0.55"/>
  ${rings.join("\n  ")}
  <circle cx="${cx}" cy="${cy}" r="${(r * 0.34).toFixed(1)}" fill="${primary}"/>
  <circle cx="${cx}" cy="${cy}" r="${(r * 0.26).toFixed(1)}" fill="none" stroke="${highlight}" stroke-width="2" opacity="0.7"/>
  <circle cx="${cx}" cy="${cy}" r="7" fill="#0c0b0a"/>`;
}

// split a title over at most two lines
function titleLines(title) {
  if (title.length <= 12) return [title];
  const words = title.split(" ");
  let best = [title];
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ");
    const b = words.slice(i).join(" ");
    const diff = Math.abs(a.length - b.length);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = [a, b];
    }
  }
  return best;
}

function collectionCover(item) {
  const [primary, deep, highlight] = PALETTES[item.id];
  const rand = random(seedOf(item.id));
  const cx = 300 + Math.round(rand() * 120);
  const cy = 150 + Math.round(rand() * 90);
  const r = 190 + Math.round(rand() * 40);
  const lines = titleLines(item.title);
  const size = lines.some((l) => l.length > 12) ? 50 : 58;
  const baseY = 452 - (lines.length - 1) * (size + 2);
  const text = lines
    .map((line, i) => `<text x="36" y="${baseY + i * (size + 2)}" font-family="Iowan Old Style, Palatino Linotype, Palatino, Georgia, serif" font-size="${size}" fill="#f3eee6" letter-spacing="-1">${escape(line)}</text>`)
    .join("\n  ");
  const label = item.kind === "mix" ? "WAVEMUSIC MIX" : "WAVEMUSIC COLLECTION";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" role="img" aria-label="${escape(item.title)}">
  <rect width="512" height="512" fill="${deep}"/>
  <rect y="330" width="512" height="182" fill="#0c0b0a" opacity="0.35"/>
  ${record(cx, cy, r, primary, highlight, rand)}
  <rect x="36" y="${baseY - size - 26}" width="34" height="3" fill="${primary}"/>
  <text x="36" y="490" font-family="Consolas, Menlo, monospace" font-size="13" letter-spacing="3" fill="#f3eee6" opacity="0.7">${label}</text>
  ${text}
</svg>
`;
}

function idleCover() {
  const rand = random(seedOf("idle"));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" role="img" aria-label="WaveMusic">
  <rect width="512" height="512" fill="#141311"/>
  ${record(256, 256, 210, "#3a362f", "#ffab40", rand)}
  <circle cx="256" cy="256" r="71" fill="#1c1a17"/>
  <circle cx="256" cy="256" r="7" fill="#ffab40"/>
</svg>
`;
}

function appIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect width="64" height="64" rx="14" fill="#0c0b0a"/>
  <circle cx="32" cy="32" r="22" fill="none" stroke="#ffab40" stroke-width="3"/>
  <circle cx="32" cy="32" r="14" fill="none" stroke="#ffab40" stroke-width="1.5" opacity="0.55"/>
  <circle cx="32" cy="32" r="5" fill="#ffab40"/>
</svg>
`;
}

async function main() {
  for (const item of COLLECTIONS) {
    const dir = path.join(ROOT, "assets", "playlists", item.id);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "cover.svg"), collectionCover(item));
  }
  await writeFile(path.join(ROOT, "assets", "images", "default-cover.svg"), idleCover());
  await writeFile(path.join(ROOT, "assets", "images", "app-icon.svg"), appIcon());
  console.log("Wrote " + COLLECTIONS.length + " collection covers, the idle cover and the app icon.");
}

main();
