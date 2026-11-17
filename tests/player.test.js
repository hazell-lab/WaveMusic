import { test } from "node:test";
import assert from "node:assert/strict";
import { createPlayer } from "../js/player/player.js";
import { createStore } from "../js/core/store.js";
import { createStorage } from "../js/core/storage.js";
import { FakeAudio, flush, memoryBackend, silentMediaSession } from "./helpers.js";

const TRACKS = {
  1: { id: 1, title: "One", artist: "A", album: "X", src: "1.m4a" },
  2: { id: 2, title: "Two", artist: "A", album: "X", src: "2.m4a" },
  3: { id: 3, title: "Three", artist: "B", album: "Y", src: "3.m4a" },
  4: { id: 4, title: "Broken", artist: "B", album: "Y", src: "" }
};

function setup({ catalogueStatus = "ready", storage = null, tracks = TRACKS } = {}) {
  const audio = new FakeAudio();
  const catalogue = createStore({ status: catalogueStatus, error: "" });
  const notices = [];
  const started = [];
  const player = createPlayer({
    audio,
    resolveTrack: (id) => tracks[id] || null,
    catalogue,
    storage,
    mediaSession: silentMediaSession,
    defaultList: () => [1, 2, 3],
    onNotice: (m) => notices.push(m),
    onTrackStart: (id) => started.push(id)
  });
  return { audio, catalogue, player, notices, started, state: () => player.store.get() };
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

test("playList starts the chosen track", async () => {
  const { audio, player, state, started } = setup();
  player.playList([1, 2, 3], 1, "Test");
  await flush();
  assert.equal(audio.src, "2.m4a");
  assert.equal(state().current, 2);
  assert.equal(state().status, "playing");
  assert.equal(state().source, "Test");
  assert.deepEqual(started, [2]);
});

test("play with an empty queue falls back to the default list", async () => {
  const { player, state } = setup();
  player.play();
  await flush();
  assert.equal(state().current, 1);
  assert.equal(state().source, "The Chart");
});

test("toggle pauses and resumes the same track", async () => {
  const { audio, player, state } = setup();
  player.playList([1, 2], 0);
  await flush();
  player.togglePlay();
  assert.equal(state().status, "paused");
  assert.equal(audio.paused, true);
  player.togglePlay();
  await flush();
  assert.equal(state().status, "playing");
  assert.equal(audio.src, "1.m4a");
});

test("next and previous move through the queue", async () => {
  const { audio, player, state, notices } = setup();
  player.playList([1, 2, 3], 0);
  await flush();
  player.next();
  await flush();
  assert.equal(state().current, 2);
  player.previous();
  await flush();
  assert.equal(state().current, 1);
  player.previous();
  assert.equal(state().current, 1);
  player.next();
  player.next();
  await flush();
  assert.equal(audio.src, "3.m4a");
  player.next();
  assert.match(notices.at(-1), /end of the queue/);
});

test("previous restarts the track after three seconds", async () => {
  const { audio, player, state } = setup();
  player.playList([1, 2], 1);
  await flush();
  audio.metadata(30);
  audio.currentTime = 10;
  player.previous();
  assert.equal(state().current, 2);
  assert.equal(audio.currentTime, 0);
});

test("ended advances, repeat one replays, and the end of the queue stops", async () => {
  const { audio, player, state } = setup();
  player.playList([1, 2], 0);
  await flush();
  audio.metadata(30);
  audio.finish();
  await flush();
  assert.equal(state().current, 2);

  player.cycleRepeat(); // all
  player.cycleRepeat(); // one
  assert.equal(state().repeat, "one");
  audio.metadata(30);
  audio.finish();
  await flush();
  assert.equal(state().current, 2);
  assert.equal(state().status, "playing");

  player.cycleRepeat(); // off
  audio.metadata(30);
  audio.finish();
  await flush();
  assert.equal(state().current, 2);
  assert.equal(state().status, "paused");
});

test("repeat all wraps to the start", async () => {
  const { audio, player, state } = setup();
  player.playList([1, 2], 1);
  player.cycleRepeat();
  await flush();
  audio.metadata(30);
  audio.finish();
  await flush();
  assert.equal(state().current, 1);
});

test("a track without a preview is skipped with a notice", async () => {
  const { player, state, notices } = setup();
  player.playList([4, 2], 0);
  assert.equal(state().status, "error");
  await wait(800);
  assert.equal(state().current, 2);
  assert.equal(state().status, "playing");
  assert.match(notices[0], /unavailable/);
});

test("when every preview fails playback stops instead of looping", async () => {
  const { audio, player, state, notices } = setup();
  audio.playBehaviour = "fail";
  player.cycleRepeat(); // all, to prove it does not loop forever
  player.playList([1, 2], 0);
  await flush();
  await wait(800);
  await flush();
  assert.equal(state().status, "error");
  assert.match(notices.at(-1), /None of the remaining previews|could not be played/);
});

test("playback waits for the catalogue and then starts", async () => {
  const tracks = { 1: { ...TRACKS[1], src: "" } };
  const { audio, catalogue, player, state } = setup({ catalogueStatus: "loading", tracks });
  player.playList([1], 0);
  assert.equal(state().status, "loading");
  assert.equal(audio.src, "");
  tracks[1].src = "1.m4a";
  catalogue.set({ status: "ready" });
  await flush();
  assert.equal(audio.src, "1.m4a");
  assert.equal(state().status, "playing");
});

test("a catalogue failure turns into an error, not fake playback", () => {
  const tracks = { 1: { ...TRACKS[1], src: "" } };
  const { catalogue, player, state } = setup({ catalogueStatus: "loading", tracks });
  player.playList([1], 0);
  catalogue.set({ status: "error", error: "offline" });
  assert.equal(state().status, "error");
  assert.equal(state().error, "offline");
});

test("volume and mute", () => {
  const { audio, player, state } = setup();
  player.setVolume(0.3);
  assert.equal(audio.volume, 0.3);
  player.toggleMute();
  assert.equal(audio.muted, true);
  player.toggleMute();
  assert.equal(audio.muted, false);
  player.setVolume(0);
  player.toggleMute();
  assert.equal(state().volume, 0.5);
});

test("queue edits go through the player", async () => {
  const { player, state } = setup();
  player.playList([1, 2], 0);
  await flush();
  player.playNext([3]);
  assert.deepEqual(state().queue.entries.map((e) => e.id), [1, 3, 2]);
  player.addToQueue([1]);
  const last = state().queue.entries.at(-1);
  player.removeFromQueue(last.key);
  assert.equal(state().queue.entries.length, 3);
  player.jumpTo(state().queue.entries[2].key);
  await flush();
  assert.equal(state().current, 2);
});

test("state is saved and restored without autoplay", async () => {
  const backend = memoryBackend();
  const storage = createStorage(backend);
  const first = setup({ storage });
  first.player.playList([1, 2, 3], 1, "Saved");
  first.player.setVolume(0.4);
  first.player.cycleRepeat();
  await flush();
  first.player.savePosition();

  const second = setup({ storage });
  second.player.restore();
  const s = second.state();
  assert.equal(s.current, 2);
  assert.equal(s.source, "Saved");
  assert.equal(s.volume, 0.4);
  assert.equal(s.repeat, "all");
  assert.equal(s.status, "paused");
  assert.equal(second.audio.paused, true);
});
