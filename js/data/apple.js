// loads 30-second previews and artwork for every song from the public
// itunes lookup api in one request, and caches the result for a day.

import { SONGS, ALBUMS, SINGLES, getArtist } from "./catalogue.js";
import { createStore } from "../core/store.js";

const LOOKUP_URL = "https://itunes.apple.com/lookup?id=";
const CACHE_KEY = "apple.v1"; // same format as the original app, so its cache is reused
const CACHE_HOURS = 24;
const TIMEOUT_MS = 12000;

// status: idle | loading | ready | error
export const catalogueStore = createStore({ status: "idle", error: "", missing: 0 });

// cover key -> apple artwork template (contains "100x100bb")
const ARTWORK = new Map();

// resize an apple artwork url to the size we display
export function sizedArtwork(template, size) {
  if (!template) return "";
  return template.replace(/\d+x\d+bb/, size + "x" + size + "bb");
}

export const artworkFor = (coverKey, size = 300) => sizedArtwork(ARTWORK.get(coverKey) || "", size);

// copy the api results onto songs, albums and artists
export function applyResults(results) {
  const byTrack = new Map();
  (results || []).forEach((r) => {
    if (r && r.trackId) byTrack.set(r.trackId, r);
  });

  let missing = 0;
  SONGS.forEach((song) => {
    const r = byTrack.get(song.appleId);
    if (!r || !r.previewUrl) missing += 1;
    if (!r) return;
    song.audio = r.previewUrl || "";
    song.art = r.artworkUrl100 || "";
    song.url = r.trackViewUrl || "";
    const artist = getArtist(song.artist);
    if (artist && !artist.url && r.artistViewUrl) artist.url = r.artistViewUrl;
  });

  // an album or single uses the artwork of its first song that has one
  ALBUMS.forEach((album) => {
    const withArt = album.tracks.map((id) => SONGS.find((s) => s.id === id)).find((s) => s && s.art);
    if (withArt) ARTWORK.set(album.id, withArt.art);
  });
  SINGLES.forEach((single) => {
    const song = SONGS.find((s) => s.id === single.song);
    if (song && song.art) ARTWORK.set(single.id, song.art);
  });
  return missing;
}

function readCache(storage, now) {
  const saved = storage.read(CACHE_KEY, null);
  if (!saved || !Array.isArray(saved.results)) return null;
  const ageHours = (now - saved.time) / 3600000;
  return ageHours >= 0 && ageHours < CACHE_HOURS ? saved.results : null;
}

function writeCache(storage, results, now) {
  // keep only the fields the app uses so the cache stays small
  const slim = results.map((r) => ({
    trackId: r.trackId,
    previewUrl: r.previewUrl,
    artworkUrl100: r.artworkUrl100,
    trackViewUrl: r.trackViewUrl,
    artistViewUrl: r.artistViewUrl
  }));
  storage.write(CACHE_KEY, { time: now, results: slim });
}

// fetchImpl and storage are injectable so this can be tested in node
export async function loadCatalogue({ storage, fetchImpl = globalThis.fetch, now = Date.now(), useCache = true } = {}) {
  const current = catalogueStore.get().status;
  if (current === "loading") return;

  const cached = useCache && storage ? readCache(storage, now) : null;
  if (cached) {
    const missing = applyResults(cached);
    catalogueStore.set({ status: "ready", error: "", missing });
    return;
  }

  if (typeof fetchImpl !== "function") {
    catalogueStore.set({ status: "error", error: "This browser cannot load previews." });
    return;
  }

  catalogueStore.set({ status: "loading", error: "" });
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timer = setTimeout(() => controller && controller.abort(), TIMEOUT_MS);

  try {
    const ids = SONGS.map((s) => s.appleId).join(",");
    const res = await fetchImpl(LOOKUP_URL + ids, controller ? { signal: controller.signal } : undefined);
    if (!res.ok) throw new Error("Apple Music lookup failed (" + res.status + ")");
    const data = await res.json();
    const results = (data && data.results) || [];
    if (!results.length) throw new Error("Apple Music returned no tracks");
    const missing = applyResults(results);
    if (storage) writeCache(storage, results, now);
    catalogueStore.set({ status: "ready", error: "", missing });
  } catch (err) {
    const offline = typeof navigator !== "undefined" && navigator.onLine === false;
    const message = offline
      ? "You appear to be offline, so previews and artwork cannot load."
      : err && err.name === "AbortError"
        ? "Apple Music took too long to respond."
        : "Could not reach Apple Music for previews and artwork.";
    catalogueStore.set({ status: "error", error: message });
  } finally {
    clearTimeout(timer);
  }
}
