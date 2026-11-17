import { test } from "node:test";
import assert from "node:assert/strict";
import { search, normalize, scoreFields } from "../js/search/search.js";
import * as C from "../js/data/catalogue.js";

const catalogue = {
  songs: C.SONGS,
  albums: C.ALBUMS,
  artists: C.ARTISTS,
  collections: C.COLLECTIONS,
  artistName: C.artistName,
  albumTitle: C.albumTitle,
  artistNameById: (id) => (C.getArtist(id) || {}).name || ""
};

test("normalize strips accents, case and punctuation", () => {
  assert.equal(normalize("ROSÉ"), "rose");
  assert.equal(normalize("  Don't  Start Now!"), "don t start now");
});

test("title matches rank above artist matches", () => {
  const a = scoreFields(["lights"], ["Blinding Lights", "The Weeknd"]);
  const b = scoreFields(["lights"], ["Other", "Lights Band"]);
  assert.ok(a > b);
});

test("every word has to match", () => {
  const r = search(catalogue, "weeknd tears");
  assert.deepEqual(r.songs.map((s) => s.title), ["Save Your Tears"]);
});

test("accent-insensitive artist search", () => {
  const r = search(catalogue, "rose");
  assert.ok(r.artists.some((a) => a.name === "ROSÉ"));
});

test("type and genre filters", () => {
  const onlyAlbums = search(catalogue, "the", { type: "albums" });
  assert.equal(onlyAlbums.songs.length, 0);
  assert.ok(onlyAlbums.albums.length > 0);
  const jazz = search(catalogue, "", { genre: "Jazz" });
  assert.ok(jazz.songs.length >= 6);
  assert.ok(jazz.songs.every((s) => s.genre === "Jazz"));
  assert.equal(jazz.collections.length, 0);
});

test("no query and no genre gives no results", () => {
  assert.equal(search(catalogue, "   ").total, 0);
  assert.equal(search(catalogue, "zzzzqqq").total, 0);
});

test("catalogue data is consistent", () => {
  const songIds = new Set(C.SONGS.map((s) => s.id));
  assert.equal(songIds.size, C.SONGS.length);
  C.ALBUMS.forEach((a) => a.tracks.forEach((t) => assert.ok(songIds.has(t), a.id + " track " + t)));
  C.COLLECTIONS.forEach((c) => c.tracks.forEach((t) => assert.ok(songIds.has(t), c.id + " track " + t)));
  C.CHART.forEach((t) => assert.ok(songIds.has(t)));
  C.SONGS.forEach((s) => {
    assert.ok(C.getArtist(s.artist), "artist for " + s.title);
    assert.ok(C.getAlbum(s.album) || C.getSingle(s.cover), "album or single for " + s.title);
    assert.ok(C.genreByName(s.genre), "genre for " + s.title);
    assert.ok(C.PALETTES[s.cover], "palette for " + s.cover);
  });
  C.COLLECTIONS.forEach((c) => assert.ok(C.PALETTES[c.id], "palette for " + c.id));
  C.GENRES.forEach((g) => assert.ok(C.PALETTES[g.id], "palette for " + g.id));
});
