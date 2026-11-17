import { test } from "node:test";
import assert from "node:assert/strict";
import { loadCatalogue, catalogueStore, sizedArtwork, artworkFor } from "../js/data/apple.js";
import { getSong } from "../js/data/catalogue.js";
import { createStorage } from "../js/core/storage.js";
import { memoryBackend } from "./helpers.js";

test("sizedArtwork rewrites the size segment", () => {
  assert.equal(sizedArtwork("https://x/100x100bb.jpg", 300), "https://x/300x300bb.jpg");
  assert.equal(sizedArtwork("", 300), "");
});

test("a failed lookup sets an error state", async () => {
  catalogueStore.set({ status: "idle" });
  await loadCatalogue({ storage: null, fetchImpl: async () => ({ ok: false, status: 503 }) });
  assert.equal(catalogueStore.get().status, "error");
  assert.ok(catalogueStore.get().error);
});

test("a successful lookup fills songs and artwork and is cached", async () => {
  catalogueStore.set({ status: "idle" });
  const backend = memoryBackend();
  const storage = createStorage(backend);
  const fetchImpl = async () => ({
    ok: true,
    json: async () => ({
      results: [
        {
          trackId: 1499378607,
          previewUrl: "https://p/1.m4a",
          artworkUrl100: "https://a/100x100bb.jpg",
          trackViewUrl: "https://t"
        }
      ]
    })
  });
  await loadCatalogue({ storage, fetchImpl, now: 1000 });
  assert.equal(catalogueStore.get().status, "ready");
  assert.equal(getSong(1).audio, "https://p/1.m4a");
  assert.equal(artworkFor("after-hours", 600), "https://a/600x600bb.jpg");
  assert.ok(catalogueStore.get().missing > 0);
  assert.ok(backend.data.has("wavemusic.apple.v1"));

  catalogueStore.set({ status: "idle" });
  let fetched = false;
  await loadCatalogue({
    storage,
    fetchImpl: async () => {
      fetched = true;
    },
    now: 2000
  });
  assert.equal(fetched, false);
  assert.equal(catalogueStore.get().status, "ready");
});
