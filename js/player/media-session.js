// media session api: track info and transport buttons for the os media
// controls, lock screen and hardware media keys. every call is guarded
// because support differs between browsers.

const session = () => (typeof navigator !== "undefined" && "mediaSession" in navigator ? navigator.mediaSession : null);

export const mediaSessionSupported = () => !!session();

export function setMetadata(info) {
  const ms = session();
  if (!ms || typeof MediaMetadata !== "function") return;
  try {
    ms.metadata = info
      ? new MediaMetadata({
          title: info.title,
          artist: info.artist,
          album: info.album,
          artwork: info.artwork || []
        })
      : null;
  } catch {
    // ignore unsupported metadata
  }
}

export function setPlaybackState(status) {
  const ms = session();
  if (!ms) return;
  try {
    ms.playbackState = status === "playing" || status === "loading" ? "playing" : status === "idle" ? "none" : "paused";
  } catch {
    // ignore
  }
}

export function setPosition(duration, position) {
  const ms = session();
  if (!ms || typeof ms.setPositionState !== "function") return;
  try {
    if (duration > 0) {
      ms.setPositionState({ duration, position: Math.min(Math.max(0, position), duration), playbackRate: 1 });
    } else {
      ms.setPositionState();
    }
  } catch {
    // ignore invalid states
  }
}

// handlers: { play, pause, stop, previoustrack, nexttrack, seekto, seekbackward, seekforward }
// returns the list of actions the browser accepted
export function setActionHandlers(handlers) {
  const ms = session();
  if (!ms) return [];
  const accepted = [];
  Object.entries(handlers).forEach(([action, fn]) => {
    try {
      ms.setActionHandler(action, fn);
      accepted.push(action);
    } catch {
      // this browser does not support the action
    }
  });
  return accepted;
}
