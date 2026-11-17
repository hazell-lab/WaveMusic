// shared test doubles

// a fake HTMLAudioElement with controllable play() results
export class FakeAudio extends EventTarget {
  constructor() {
    super();
    this.src = "";
    this.currentTime = 0;
    this.duration = NaN;
    this.paused = true;
    this.ended = false;
    this.volume = 1;
    this.muted = false;
    this.readyState = 0;
    this.error = null;
    this.playBehaviour = "resolve"; // resolve | block | fail | pending
    this.pending = [];
    this.loads = 0;
  }
  load() {
    this.loads += 1;
    this.readyState = 0;
    this.currentTime = 0;
    this.duration = NaN;
    this.ended = false;
    this.paused = true;
  }
  removeAttribute(name) {
    if (name === "src") this.src = "";
  }
  play() {
    if (this.playBehaviour === "block") {
      const err = new Error("blocked");
      err.name = "NotAllowedError";
      return Promise.reject(err);
    }
    if (this.playBehaviour === "fail") {
      this.error = { code: 4 };
      const err = new Error("unsupported");
      err.name = "NotSupportedError";
      return Promise.reject(err);
    }
    if (this.playBehaviour === "pending") {
      return new Promise((resolve, reject) => this.pending.push({ resolve, reject }));
    }
    this.paused = false;
    this.fire("playing");
    return Promise.resolve();
  }
  pause() {
    if (this.paused) return;
    this.paused = true;
    this.fire("pause");
  }
  fire(type) {
    this.dispatchEvent(new Event(type));
  }
  // pretend metadata arrived
  metadata(duration = 30) {
    this.duration = duration;
    this.readyState = 1;
    this.fire("loadedmetadata");
    this.fire("durationchange");
  }
  finish() {
    this.currentTime = this.duration;
    this.paused = true;
    this.ended = true;
    this.fire("ended");
  }
}

export function memoryBackend(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
    data
  };
}

export const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

export const silentMediaSession = {
  calls: [],
  setMetadata(m) { this.calls.push(["metadata", m]); },
  setPlaybackState(s) { this.calls.push(["state", s]); },
  setPosition() {},
  setActionHandlers: (h) => Object.keys(h)
};

// seeded random so shuffles are repeatable
export function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
