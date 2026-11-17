// wraps one HTMLAudioElement. one element means only one track can ever play.
// every load gets a token so late events or promises from an older track
// cannot change the state of the current one.
//
// status: idle | loading | playing | paused | ended | error

const ERROR_TEXT = {
  1: "Playback was stopped before the preview loaded.",
  2: "A network error stopped the preview.",
  3: "The preview could not be decoded.",
  4: "This preview is not available."
};

export function createAudioEngine(audio, handlers = {}) {
  const emit = (name, ...args) => handlers[name] && handlers[name](...args);
  const listeners = new AbortController();
  const on = (type, fn) => audio.addEventListener(type, fn, { signal: listeners.signal });

  let token = 0;
  let src = "";
  let status = "idle";
  let wantsPlay = false;
  let pendingSeek = null;

  function setStatus(next, detail) {
    if (status === next) return;
    status = next;
    emit("status", next, detail);
  }

  function hasSource() {
    return !!src;
  }

  on("loadedmetadata", () => {
    if (!hasSource()) return;
    if (pendingSeek != null) {
      safeSeek(pendingSeek);
      pendingSeek = null;
    }
    emit("duration", duration());
  });
  on("durationchange", () => hasSource() && emit("duration", duration()));
  on("waiting", () => hasSource() && wantsPlay && setStatus("loading"));
  on("playing", () => hasSource() && setStatus("playing"));
  on("pause", () => {
    // the element also pauses itself just before "ended"
    if (!hasSource() || audio.ended) return;
    if (status !== "error") setStatus("paused");
  });
  on("ended", () => {
    if (!hasSource()) return;
    wantsPlay = false;
    setStatus("ended");
    emit("ended");
  });
  on("error", () => {
    // an error from an emptied element (no src) is not a track failure
    if (!hasSource()) return;
    const code = audio.error && audio.error.code;
    wantsPlay = false;
    setStatus("error", ERROR_TEXT[code] || ERROR_TEXT[4]);
  });

  function safeSeek(seconds) {
    try {
      audio.currentTime = seconds;
    } catch {
      // some browsers throw before metadata exists
      pendingSeek = seconds;
    }
  }

  function duration() {
    const d = audio.duration;
    return Number.isFinite(d) && d > 0 ? d : 0;
  }

  // load a new source. autoplay starts it once it can play.
  function load(url, { autoplay = false, startAt = 0 } = {}) {
    token += 1;
    pendingSeek = startAt > 0 ? startAt : null;
    wantsPlay = false;
    if (!url) {
      unload();
      setStatus("error", ERROR_TEXT[4]);
      return Promise.resolve(false);
    }
    src = url;
    audio.src = url;
    if (typeof audio.load === "function") audio.load();
    setStatus(autoplay ? "loading" : "paused");
    emit("duration", 0);
    return autoplay ? play() : Promise.resolve(false);
  }

  // resolves true when playback actually started
  function play() {
    if (!hasSource()) return Promise.resolve(false);
    const mine = token;
    wantsPlay = true;
    if (status !== "playing") setStatus("loading");
    let attempt;
    try {
      attempt = audio.play();
    } catch (err) {
      attempt = Promise.reject(err);
    }
    return Promise.resolve(attempt).then(
      () => {
        if (mine !== token) return false;
        if (!audio.paused) setStatus("playing");
        return true;
      },
      (err) => {
        if (mine !== token) return false;
        wantsPlay = false;
        const name = err && err.name;
        if (name === "NotAllowedError") {
          // autoplay was blocked: wait for the user to press play
          setStatus("paused");
          emit("blocked");
        } else if (name === "AbortError") {
          // interrupted by a pause() or a new load, nothing to report
          if (status === "loading") setStatus("paused");
        } else {
          setStatus("error", ERROR_TEXT[(audio.error && audio.error.code) || 4]);
        }
        return false;
      }
    );
  }

  function pause() {
    wantsPlay = false;
    if (!hasSource()) return;
    audio.pause();
    if (status === "loading") setStatus("paused");
  }

  function seek(seconds) {
    if (!hasSource()) return;
    const d = duration();
    const target = Math.max(0, d ? Math.min(seconds, d) : seconds);
    if (audio.readyState >= 1) safeSeek(target);
    else pendingSeek = target;
    if (status === "ended") setStatus("paused");
  }

  // release the current source so the browser can free the network connection
  function unload() {
    token += 1;
    wantsPlay = false;
    pendingSeek = null;
    src = "";
    audio.pause();
    audio.removeAttribute("src");
    if (typeof audio.load === "function") audio.load();
    setStatus("idle");
  }

  return {
    load,
    play,
    pause,
    seek,
    unload,
    setVolume(value) {
      audio.volume = Math.max(0, Math.min(1, Number(value) || 0));
    },
    setMuted(muted) {
      audio.muted = !!muted;
    },
    get status() {
      return status;
    },
    get src() {
      return src;
    },
    get currentTime() {
      if (!hasSource()) return 0;
      return pendingSeek != null ? pendingSeek : audio.currentTime || 0;
    },
    get duration() {
      return duration();
    },
    destroy() {
      listeners.abort();
      unload();
    }
  };
}
