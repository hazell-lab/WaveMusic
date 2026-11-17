// a tiny observable store: shallow-merged state plus change listeners

export function createStore(initial) {
  let state = initial;
  const listeners = new Set();

  return {
    get: () => state,

    // patch is an object or a function of the previous state
    set(patch) {
      const prev = state;
      const next = typeof patch === "function" ? patch(prev) : { ...prev, ...patch };
      if (!next || next === prev) return;
      const changed = Object.keys(next).some((key) => next[key] !== prev[key]);
      if (!changed) return;
      state = next;
      listeners.forEach((fn) => fn(state, prev));
    },

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    }
  };
}

// true when any of the given keys changed between two states
export const changed = (next, prev, ...keys) => keys.some((key) => next[key] !== prev[key]);
