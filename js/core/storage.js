// safe json storage on top of localStorage (or any getItem/setItem backend)

const PREFIX = "wavemusic.";

export function createStorage(backend) {
  return {
    read(key, fallback) {
      try {
        const raw = backend ? backend.getItem(PREFIX + key) : null;
        return raw == null ? fallback : JSON.parse(raw);
      } catch {
        return fallback;
      }
    },
    write(key, value) {
      try {
        if (!backend) return false;
        backend.setItem(PREFIX + key, JSON.stringify(value));
        return true;
      } catch {
        // storage can be full or blocked; the app keeps working in memory
        return false;
      }
    },
    remove(key) {
      try {
        if (backend) backend.removeItem(PREFIX + key);
      } catch {
        // ignore
      }
    }
  };
}

// localStorage can throw on access (privacy modes, file://), so probe it first
export function browserBackend() {
  try {
    const ls = globalThis.localStorage;
    const probe = "__wavemusic_probe";
    ls.setItem(probe, "1");
    ls.removeItem(probe);
    return ls;
  } catch {
    return null;
  }
}

// a debounced writer so frequent updates do not hit storage every time
export function debounce(fn, wait) {
  let timer = null;
  const run = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
  run.flush = (...args) => {
    clearTimeout(timer);
    fn(...args);
  };
  run.cancel = () => clearTimeout(timer);
  return run;
}
