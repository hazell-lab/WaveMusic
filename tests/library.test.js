import { test } from "node:test";
import assert from "node:assert/strict";
import * as ops from "../js/library/library-ops.js";
import { createLibrary } from "../js/library/library.js";
import { createStorage } from "../js/core/storage.js";
import { memoryBackend } from "./helpers.js";

const isSong = (id) => Number.isInteger(id) && id > 0 && id < 64;
const isArtist = (id) => ["sza", "avicii"].includes(id);

test("likes toggle and keep the newest first", () => {
  let lib = ops.emptyLibrary();
  lib = ops.toggleLike(lib, 1, 10);
  lib = ops.toggleLike(lib, 2, 20);
  assert.deepEqual(lib.liked.map((x) => x.id), [2, 1]);
  lib = ops.toggleLike(lib, 1);
  assert.deepEqual(lib.liked.map((x) => x.id), [2]);
});

test("playlist names are validated", () => {
  const { lib } = ops.createPlaylist(ops.emptyLibrary(), "Mornings", { id: "a" });
  assert.equal(ops.validateName("  ", lib), "Give the playlist a name.");
  assert.match(ops.validateName("mornings", lib), /already/);
  assert.equal(ops.validateName("mornings", lib, "a"), "");
  assert.match(ops.validateName("x".repeat(61), lib), /under 60/);
});

test("playlist track operations", () => {
  let { lib } = ops.createPlaylist(ops.emptyLibrary(), "Mix", { id: "p" });
  let result = ops.addTracks(lib, "p", [1, 2, 2, 3]);
  assert.equal(result.added, 3);
  result = ops.addTracks(result.lib, "p", [3]);
  assert.equal(result.added, 0);
  lib = ops.moveTrack(result.lib, "p", 0, 2);
  assert.deepEqual(ops.findPlaylist(lib, "p").tracks.map((t) => t.id), [2, 3, 1]);
  lib = ops.removeTrackAt(lib, "p", 1);
  assert.deepEqual(ops.findPlaylist(lib, "p").tracks.map((t) => t.id), [2, 1]);
  lib = ops.renamePlaylist(lib, "p", " New name ");
  assert.equal(ops.findPlaylist(lib, "p").name, "New name");
  lib = ops.deletePlaylist(lib, "p");
  assert.equal(lib.playlists.length, 0);
});

test("history collapses immediate repeats and is capped", () => {
  let lib = ops.emptyLibrary();
  lib = ops.recordPlay(lib, 1, 1);
  lib = ops.recordPlay(lib, 1, 2);
  lib = ops.recordPlay(lib, 2, 3);
  assert.deepEqual(lib.history.map((x) => x.id), [2, 1]);
  for (let i = 0; i < 150; i++) lib = ops.recordPlay(lib, (i % 60) + 1, i);
  assert.equal(lib.history.length, ops.HISTORY_MAX);
});

test("sanitize drops unknown ids and malformed records", () => {
  const lib = ops.sanitize(
    {
      liked: [{ id: 1, at: 5 }, { id: 999, at: 5 }, { id: 2 }],
      followed: ["sza", "nobody", "sza"],
      playlists: [{ id: "a", name: "Ok", tracks: [{ id: 3, at: 1 }, { id: 0, at: 1 }] }, { id: 5, name: "bad" }]
    },
    { isSong, isArtist }
  );
  assert.deepEqual(lib.liked, [{ id: 1, at: 5 }]);
  assert.deepEqual(lib.followed, ["sza"]);
  assert.equal(lib.playlists.length, 1);
  assert.deepEqual(lib.playlists[0].tracks, [{ id: 3, at: 1 }]);
});

test("library store persists and migrates real legacy likes but not the old seed", () => {
  const legacy = memoryBackend({ "wavemusic.state.v2": JSON.stringify({ liked: [5, 7] }) });
  const lib = createLibrary({ storage: createStorage(legacy), isSong, isArtist });
  assert.deepEqual(lib.store.get().liked.map((x) => x.id), [5, 7]);

  const seeded = memoryBackend({
    "wavemusic.state.v2": JSON.stringify({ liked: [1, 11, 20, 8, 26, 44, 58, 38, 47, 5, 32, 29] })
  });
  const fresh = createLibrary({ storage: createStorage(seeded), isSong, isArtist });
  assert.equal(fresh.store.get().liked.length, 0);

  const backend = memoryBackend();
  const a = createLibrary({ storage: createStorage(backend), isSong, isArtist });
  const pl = a.createPlaylist("Evening", [1, 2]);
  a.toggleFollow("sza");
  a.flush();
  const b = createLibrary({ storage: createStorage(backend), isSong, isArtist });
  assert.equal(b.playlist(pl.id).tracks.length, 2);
  assert.equal(b.isFollowing("sza"), true);
});

test("storage survives a throwing backend", () => {
  const broken = {
    getItem() {
      throw new Error("no");
    },
    setItem() {
      throw new Error("no");
    },
    removeItem() {}
  };
  const storage = createStorage(broken);
  assert.equal(storage.read("x", 7), 7);
  assert.equal(storage.write("x", 1), false);
  const lib = createLibrary({ storage, isSong, isArtist });
  assert.equal(lib.toggleLike(3), true);
});
