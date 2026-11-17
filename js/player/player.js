// the player controller: joins the queue, the audio engine, persistence and
// the media session. ui code reads `player.store` and calls the methods below;
// it never touches the audio element directly.

import { createStore } from "../core/store.js";
import { debounce } from "../core/storage.js";
import { createAudioEngine } from "./audio-engine.js";
import * as Q from "./queue.js";
import * as defaultMediaSession from "./media-session.js";

const REPEAT_MODES = ["off", "all", "one"];
const RESTART_THRESHOLD = 3;
const SKIP_DELAY = 700;

export function createPlayer({
  audio,
  resolveTrack, // id -> { id, title, artist, album, src, artwork } or null
  catalogue, // store with { status } so playback can wait for previews to load
  storage = null,
  mediaSession = defaultMediaSession,
  defaultList = () => [],
  onNotice = () => {},
  onTrackStart = () => {}
}) {
  const store = createStore({
    queue: Q.EMPTY_QUEUE,
    current: null, // song id of the current entry
    currentKey: null,
    source: "",
    status: "idle", // idle | loading | playing | paused | ended | error
    error: "",
    duration: 0,
    repeat: "off",
    shuffle: false,
    volume: 0.8,
    muted: false
  });

  let intent = false; // the user wants sound
  let failures = 0; // previews that failed in a row
  let skipTimer = null;
  let waitingKey = null; // entry waiting for the catalogue
  let startedKey = null; // entry already recorded in history
  let pendingStart = null; // how to start the entry that waits for the catalogue

  const engine = createAudioEngine(audio, {
    status: onEngineStatus,
    duration: (d) => {
      store.set({ duration: d });
      syncPosition();
    },
    ended: onEnded,
    blocked: () => {
      intent = false;
      onNotice("Your browser blocked autoplay. Press play to start.");
    }
  });

  function onEngineStatus(status, detail) {
    const state = store.get();
    if (status === "playing") {
      failures = 0;
      if (state.currentKey && startedKey !== state.currentKey) {
        startedKey = state.currentKey;
        onTrackStart(state.current);
      }
    }
    if (status === "error") {
      store.set({ status: "error", error: detail || "This preview is not available." });
      mediaSession.setPlaybackState("paused");
      if (intent) skipAfterFailure();
      return;
    }
    store.set({ status, error: "" });
    mediaSession.setPlaybackState(status);
    syncPosition();
    if (status === "paused") savePosition();
  }

  function skipAfterFailure() {
    const state = store.get();
    failures += 1;
    const track = resolveTrack(state.current);
    const name = track ? "“" + track.title + "”" : "This track";
    const nextAt = Q.stepIndex(state.queue, 1, state.repeat === "one" ? "all" : state.repeat);
    if (nextAt === -1 || failures >= state.queue.entries.length) {
      intent = false;
      onNotice(failures > 1 ? "None of the remaining previews could be played." : name + " could not be played.");
      return;
    }
    onNotice(name + " is unavailable, skipping to the next track.");
    clearTimeout(skipTimer);
    skipTimer = setTimeout(() => {
      skipTimer = null;
      goTo(nextAt, true);
    }, SKIP_DELAY);
  }

  function onEnded() {
    const state = store.get();
    if (state.repeat === "one") {
      engine.seek(0);
      engine.play();
      return;
    }
    const nextAt = Q.stepIndex(state.queue, 1, state.repeat);
    if (nextAt === -1) {
      // end of the queue: rewind and stop
      intent = false;
      engine.seek(0);
      store.set({ status: "paused" });
      mediaSession.setPlaybackState("paused");
      return;
    }
    goTo(nextAt, true);
  }

  // load the current entry into the engine
  function loadCurrent({ autoplay, startAt = 0 }) {
    clearTimeout(skipTimer);
    skipTimer = null;
    const state = store.get();
    const entry = Q.currentEntry(state.queue);
    if (!entry) {
      waitingKey = null;
      engine.unload();
      store.set({ current: null, currentKey: null, status: "idle", error: "", duration: 0 });
      mediaSession.setMetadata(null);
      mediaSession.setPlaybackState("idle");
      return;
    }

    intent = autoplay;
    store.set({ current: entry.id, currentKey: entry.key, error: "", duration: 0 });
    const track = resolveTrack(entry.id);
    updateMetadata(track);

    const catStatus = catalogue ? catalogue.get().status : "ready";
    if (track && !track.src && (catStatus === "loading" || catStatus === "idle")) {
      // previews are still loading: start as soon as they arrive
      waitingKey = entry.key;
      pendingStart = { autoplay, startAt };
      engine.unload();
      store.set({ status: autoplay ? "loading" : "paused" });
      return;
    }
    waitingKey = null;

    if (!track || !track.src) {
      engine.unload();
      const message =
        catStatus === "error" ? catalogue.get().error || "Previews could not be loaded." : "No preview is available for this track.";
      store.set({ status: "error", error: message });
      if (autoplay) skipAfterFailure();
      return;
    }
    engine.load(track.src, { autoplay, startAt });
  }

  if (catalogue) {
    catalogue.subscribe((next, prev) => {
      if (next.status === prev.status || !waitingKey) return;
      if (next.status !== "ready" && next.status !== "error") return;
      if (store.get().currentKey !== waitingKey) return;
      const start = pendingStart || { autoplay: false };
      pendingStart = null;
      loadCurrent(start);
      updateMetadata(resolveTrack(store.get().current));
    });
  }

  function updateMetadata(track) {
    if (!track) return mediaSession.setMetadata(null);
    mediaSession.setMetadata({
      title: track.title,
      artist: track.artist,
      album: track.album,
      artwork: track.artwork || []
    });
  }

  function syncPosition() {
    mediaSession.setPosition(engine.duration, engine.currentTime);
  }

  function goTo(index, autoplay) {
    store.set({ queue: Q.jumpTo(store.get().queue, index) });
    loadCurrent({ autoplay });
  }

  // persistence
  const persist = debounce(() => {
    if (!storage) return;
    const s = store.get();
    storage.write("player", {
      queue: Q.serialize(s.queue),
      source: s.source,
      repeat: s.repeat,
      shuffle: s.shuffle,
      volume: s.volume,
      muted: s.muted,
      position: Math.floor(engine.currentTime)
    });
  }, 250);

  function savePosition() {
    persist.flush();
  }

  store.subscribe((next, prev) => {
    if (
      next.queue !== prev.queue ||
      next.repeat !== prev.repeat ||
      next.shuffle !== prev.shuffle ||
      next.volume !== prev.volume ||
      next.muted !== prev.muted ||
      next.source !== prev.source
    ) {
      persist();
    }
  });

  function restore(isValidId = () => true) {
    const saved = storage ? storage.read("player", null) : null;
    if (!saved) return;
    const volume = Number(saved.volume);
    store.set({
      repeat: REPEAT_MODES.includes(saved.repeat) ? saved.repeat : "off",
      shuffle: !!saved.shuffle,
      volume: Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : 0.8,
      muted: !!saved.muted
    });
    applyVolume();
    const queue = Q.deserialize(saved.queue, isValidId);
    if (!queue.entries.length) return;
    store.set({ queue, source: String(saved.source || "") });
    // restored sessions never autoplay; the user presses play
    loadCurrent({ autoplay: false, startAt: Math.max(0, Number(saved.position) || 0) });
  }

  function applyVolume() {
    const { volume, muted } = store.get();
    engine.setVolume(volume);
    engine.setMuted(muted || volume === 0);
  }

  // public api
  function playList(ids, startIndex = 0, source = "", { shuffle } = {}) {
    const list = (ids || []).map(Number).filter((id) => resolveTrack(id));
    if (!list.length) return;
    const useShuffle = shuffle === undefined ? store.get().shuffle : shuffle;
    let start = Math.max(0, Math.min(startIndex, list.length - 1));
    // a shuffled start picks a random first track
    if (shuffle === true) start = Math.floor(Math.random() * list.length);
    failures = 0;
    startedKey = null;
    store.set({ queue: Q.createQueue(list, start, { shuffle: useShuffle }), source, shuffle: useShuffle });
    loadCurrent({ autoplay: true });
  }

  function play() {
    const state = store.get();
    if (!state.queue.entries.length) {
      playList(defaultList(), 0, "The Chart");
      return;
    }
    if (skipTimer) return;
    if (state.status === "error" || engine.status === "idle") {
      failures = 0;
      loadCurrent({ autoplay: true, startAt: 0 });
      return;
    }
    if (state.status === "ended") engine.seek(0);
    intent = true;
    engine.play();
  }

  function pause() {
    intent = false;
    clearTimeout(skipTimer);
    skipTimer = null;
    if (waitingKey) {
      pendingStart = { autoplay: false };
      store.set({ status: "paused" });
      return;
    }
    engine.pause();
    savePosition();
  }

  function togglePlay() {
    const { status } = store.get();
    if (status === "playing" || (status === "loading" && intent)) pause();
    else play();
  }

  function next() {
    const state = store.get();
    const at = Q.stepIndex(state.queue, 1, state.repeat === "one" ? "all" : state.repeat);
    if (at === -1) {
      onNotice("You have reached the end of the queue.");
      return;
    }
    failures = 0;
    goTo(at, intent || state.status === "playing" || state.status === "loading");
  }

  function previous() {
    const state = store.get();
    if (engine.currentTime > RESTART_THRESHOLD) {
      seek(0);
      return;
    }
    const at = Q.stepIndex(state.queue, -1, state.repeat === "one" ? "all" : state.repeat);
    if (at === -1) {
      seek(0);
      return;
    }
    failures = 0;
    goTo(at, intent || state.status === "playing" || state.status === "loading");
  }

  function seek(seconds) {
    engine.seek(seconds);
    syncPosition();
  }

  return {
    store,
    engine,
    restore,
    playList,
    playSong: (id, source) => playList([id], 0, source),
    play,
    pause,
    togglePlay,
    next,
    previous,
    seek,
    seekBy: (delta) => seek(engine.currentTime + delta),
    get currentTime() {
      return engine.currentTime;
    },
    get duration() {
      return engine.duration;
    },
    setVolume(value) {
      const volume = Math.max(0, Math.min(1, Number(value) || 0));
      store.set({ volume, muted: volume === 0 ? store.get().muted : false });
      applyVolume();
    },
    toggleMute() {
      const { muted, volume } = store.get();
      if (muted || volume === 0) store.set({ muted: false, volume: volume === 0 ? 0.5 : volume });
      else store.set({ muted: true });
      applyVolume();
    },
    toggleShuffle() {
      const state = store.get();
      const shuffle = !state.shuffle;
      store.set({ shuffle, queue: Q.setShuffle(state.queue, shuffle) });
      return shuffle;
    },
    cycleRepeat() {
      const repeat = REPEAT_MODES[(REPEAT_MODES.indexOf(store.get().repeat) + 1) % REPEAT_MODES.length];
      store.set({ repeat });
      return repeat;
    },
    jumpTo(key) {
      const queue = Q.jumpToKey(store.get().queue, key);
      if (queue === store.get().queue) return;
      failures = 0;
      store.set({ queue });
      loadCurrent({ autoplay: true });
    },
    playNext(ids) {
      const state = store.get();
      if (!state.queue.entries.length) return playList(ids, 0, "Queue");
      store.set({ queue: Q.insertNext(state.queue, ids.map(Number)) });
    },
    addToQueue(ids) {
      const state = store.get();
      if (!state.queue.entries.length) return playList(ids, 0, "Queue");
      store.set({ queue: Q.append(state.queue, ids.map(Number)) });
    },
    removeFromQueue(key) {
      store.set({ queue: Q.removeKey(store.get().queue, key) });
    },
    moveInQueue(key, toIndex) {
      store.set({ queue: Q.moveKey(store.get().queue, key, toIndex) });
    },
    clearUpNext() {
      store.set({ queue: Q.clearUpNext(store.get().queue) });
    },
    savePosition,
    setMediaHandlers() {
      return mediaSession.setActionHandlers({
        play: () => play(),
        pause: () => pause(),
        stop: () => {
          pause();
          seek(0);
        },
        previoustrack: () => previous(),
        nexttrack: () => next(),
        seekto: (details) => details && Number.isFinite(details.seekTime) && seek(details.seekTime),
        seekbackward: (details) => seek(engine.currentTime - ((details && details.seekOffset) || 10)),
        seekforward: (details) => seek(engine.currentTime + ((details && details.seekOffset) || 10))
      });
    },
    destroy() {
      clearTimeout(skipTimer);
      persist.cancel();
      engine.destroy();
    }
  };
}
