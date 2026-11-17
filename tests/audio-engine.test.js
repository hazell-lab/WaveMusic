import { test } from "node:test";
import assert from "node:assert/strict";
import { createAudioEngine } from "../js/player/audio-engine.js";
import { FakeAudio, flush } from "./helpers.js";

function setup() {
  const audio = new FakeAudio();
  const log = { status: [], ended: 0, blocked: 0, durations: [] };
  const engine = createAudioEngine(audio, {
    status: (s, detail) => log.status.push(detail ? s + ":" + detail : s),
    ended: () => (log.ended += 1),
    blocked: () => (log.blocked += 1),
    duration: (d) => log.durations.push(d)
  });
  return { audio, engine, log };
}

test("load with autoplay sets the source and reports playing", async () => {
  const { audio, engine, log } = setup();
  const started = await engine.load("a.m4a", { autoplay: true });
  assert.equal(started, true);
  assert.equal(audio.src, "a.m4a");
  assert.equal(engine.status, "playing");
  assert.deepEqual(log.status, ["loading", "playing"]);
});

test("a blocked autoplay ends up paused and reports it", async () => {
  const { audio, engine, log } = setup();
  audio.playBehaviour = "block";
  await engine.load("a.m4a", { autoplay: true });
  assert.equal(engine.status, "paused");
  assert.equal(log.blocked, 1);
});

test("an unsupported source reports one error", async () => {
  const { audio, engine, log } = setup();
  audio.playBehaviour = "fail";
  await engine.load("bad.m4a", { autoplay: true });
  audio.fire("error");
  assert.equal(engine.status, "error");
  assert.equal(log.status.filter((s) => s.startsWith("error")).length, 1);
});

test("a stale play() result from an older track is ignored", async () => {
  const { audio, engine } = setup();
  audio.playBehaviour = "pending";
  const first = engine.load("one.m4a", { autoplay: true });
  audio.playBehaviour = "resolve";
  await engine.load("two.m4a", { autoplay: true });
  // the first promise now rejects as the browser would after a new load
  const abort = new Error("aborted");
  abort.name = "AbortError";
  audio.pending[0].reject(abort);
  assert.equal(await first, false);
  assert.equal(engine.status, "playing");
  assert.equal(engine.src, "two.m4a");
});

test("errors from an emptied element are ignored", async () => {
  const { audio, engine, log } = setup();
  await engine.load("a.m4a", { autoplay: true });
  engine.unload();
  audio.fire("error");
  assert.equal(engine.status, "idle");
  assert.ok(!log.status.some((s) => s.startsWith("error")));
});

test("seek before metadata is applied once metadata arrives", async () => {
  const { audio, engine } = setup();
  await engine.load("a.m4a", { autoplay: false, startAt: 12 });
  assert.equal(engine.currentTime, 12);
  audio.metadata(30);
  assert.equal(audio.currentTime, 12);
  engine.seek(99);
  assert.equal(audio.currentTime, 30);
  engine.seek(-5);
  assert.equal(audio.currentTime, 0);
});

test("ended is reported once", async () => {
  const { audio, engine, log } = setup();
  await engine.load("a.m4a", { autoplay: true });
  audio.metadata(30);
  audio.finish();
  assert.equal(log.ended, 1);
  assert.equal(engine.status, "ended");
});

test("volume is clamped and mute is passed through", () => {
  const { audio, engine } = setup();
  engine.setVolume(3);
  assert.equal(audio.volume, 1);
  engine.setVolume(-1);
  assert.equal(audio.volume, 0);
  engine.setMuted(true);
  assert.equal(audio.muted, true);
});

test("destroy removes listeners", async () => {
  const { audio, engine, log } = setup();
  await engine.load("a.m4a", { autoplay: true });
  engine.destroy();
  const count = log.status.length;
  audio.fire("playing");
  await flush();
  assert.equal(log.status.length, count);
});
