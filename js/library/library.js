// the user's library as an observable store, saved to local storage

import { createStore } from "../core/store.js";
import { debounce } from "../core/storage.js";
import * as ops from "./library-ops.js";

const KEY = "library.v1";
const LEGACY_KEY = "state.v2";
// the original app pre-filled these likes for every visitor; they are not
// real user choices, so they are not migrated
const LEGACY_SEED = [1, 11, 20, 8, 26, 44, 58, 38, 47, 5, 32, 29];

export function createLibrary({ storage, isSong, isArtist }) {
  const saved = storage ? storage.read(KEY, null) : null;
  let initial = ops.sanitize(saved, { isSong, isArtist });

  if (!saved && storage) {
    const legacy = storage.read(LEGACY_KEY, null);
    const isSeed = legacy && Array.isArray(legacy.liked) && legacy.liked.join() === LEGACY_SEED.join();
    const liked = isSeed ? null : ops.migrateLegacy(legacy, isSong);
    if (liked) initial = { ...initial, liked };
  }

  const store = createStore(initial);
  const persist = debounce(() => storage && storage.write(KEY, store.get()), 200);
  store.subscribe(persist);
  if (storage && !saved) persist();

  const update = (fn) => store.set(fn(store.get()));

  return {
    store,
    flush: () => persist.flush(),
    isLiked: (id) => ops.isLiked(store.get(), id),
    isFollowing: (artistId) => ops.isFollowing(store.get(), artistId),
    playlist: (id) => ops.findPlaylist(store.get(), id),
    toggleLike(id) {
      update((lib) => ops.toggleLike(lib, id));
      return ops.isLiked(store.get(), id);
    },
    toggleFollow(artistId) {
      update((lib) => ops.toggleFollow(lib, artistId));
      return ops.isFollowing(store.get(), artistId);
    },
    validateName: (name, ignoreId) => ops.validateName(name, store.get(), ignoreId),
    createPlaylist(name, trackIds = []) {
      const { lib, playlist } = ops.createPlaylist(store.get(), name, { trackIds });
      store.set(lib);
      return playlist;
    },
    renamePlaylist: (id, name) => update((lib) => ops.renamePlaylist(lib, id, name)),
    deletePlaylist: (id) => update((lib) => ops.deletePlaylist(lib, id)),
    addTracks(id, trackIds) {
      const { lib, added } = ops.addTracks(store.get(), id, trackIds);
      store.set(lib);
      return added;
    },
    removeTrackAt: (id, position) => update((lib) => ops.removeTrackAt(lib, id, position)),
    moveTrack: (id, from, to) => update((lib) => ops.moveTrack(lib, id, from, to)),
    recordPlay: (songId) => update((lib) => ops.recordPlay(lib, songId)),
    clearHistory: () => update(ops.clearHistory)
  };
}
