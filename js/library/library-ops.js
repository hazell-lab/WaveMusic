// pure operations on the user's library. the library is plain data:
// {
//   liked:     [{ id, at }]                 newest first
//   playlists: [{ id, name, tracks: [{ id, at }], createdAt, updatedAt }]
//   followed:  [artistId]
//   history:   [{ id, at }]                 newest first
// }

export const NAME_MAX = 60;
export const HISTORY_MAX = 100;

export const emptyLibrary = () => ({ liked: [], playlists: [], followed: [], history: [] });

export const isLiked = (lib, id) => lib.liked.some((x) => x.id === id);
export const isFollowing = (lib, artistId) => lib.followed.includes(artistId);
export const findPlaylist = (lib, playlistId) => lib.playlists.find((p) => p.id === playlistId) || null;

export function toggleLike(lib, id, now = Date.now()) {
  const liked = isLiked(lib, id) ? lib.liked.filter((x) => x.id !== id) : [{ id, at: now }, ...lib.liked];
  return { ...lib, liked };
}

export function toggleFollow(lib, artistId) {
  const followed = isFollowing(lib, artistId)
    ? lib.followed.filter((a) => a !== artistId)
    : [artistId, ...lib.followed];
  return { ...lib, followed };
}

// returns an error message, or "" when the name is fine
export function validateName(name, lib, ignoreId = null) {
  const clean = String(name || "").trim();
  if (!clean) return "Give the playlist a name.";
  if (clean.length > NAME_MAX) return "Keep the name under " + NAME_MAX + " characters.";
  const taken = lib.playlists.some((p) => p.id !== ignoreId && p.name.toLowerCase() === clean.toLowerCase());
  if (taken) return "You already have a playlist with that name.";
  return "";
}

let counter = 0;
export function makePlaylistId(now = Date.now()) {
  counter = (counter + 1) % 1000;
  return "pl-" + now.toString(36) + counter.toString(36);
}

export function createPlaylist(lib, name, { trackIds = [], now = Date.now(), id = makePlaylistId(now) } = {}) {
  const playlist = {
    id,
    name: String(name).trim().slice(0, NAME_MAX),
    tracks: trackIds.map((t) => ({ id: t, at: now })),
    createdAt: now,
    updatedAt: now
  };
  return { lib: { ...lib, playlists: [playlist, ...lib.playlists] }, playlist };
}

function updatePlaylist(lib, playlistId, fn, now) {
  let found = false;
  const playlists = lib.playlists.map((p) => {
    if (p.id !== playlistId) return p;
    found = true;
    return { ...fn(p), updatedAt: now };
  });
  return found ? { ...lib, playlists } : lib;
}

export const renamePlaylist = (lib, playlistId, name, now = Date.now()) =>
  updatePlaylist(lib, playlistId, (p) => ({ ...p, name: String(name).trim().slice(0, NAME_MAX) }), now);

export const deletePlaylist = (lib, playlistId) => ({
  ...lib,
  playlists: lib.playlists.filter((p) => p.id !== playlistId)
});

// adds tracks that are not already in the playlist; reports how many were added
export function addTracks(lib, playlistId, trackIds, now = Date.now()) {
  const playlist = findPlaylist(lib, playlistId);
  if (!playlist) return { lib, added: 0 };
  const have = new Set(playlist.tracks.map((t) => t.id));
  const fresh = [...new Set(trackIds)].filter((id) => !have.has(id));
  if (!fresh.length) return { lib, added: 0 };
  const next = updatePlaylist(lib, playlistId, (p) => ({ ...p, tracks: [...p.tracks, ...fresh.map((id) => ({ id, at: now }))] }), now);
  return { lib: next, added: fresh.length };
}

export const removeTrackAt = (lib, playlistId, position, now = Date.now()) =>
  updatePlaylist(lib, playlistId, (p) => ({ ...p, tracks: p.tracks.filter((_, i) => i !== position) }), now);

export function moveTrack(lib, playlistId, from, to, now = Date.now()) {
  const playlist = findPlaylist(lib, playlistId);
  if (!playlist || from === to || from < 0 || to < 0 || from >= playlist.tracks.length || to >= playlist.tracks.length) {
    return lib;
  }
  return updatePlaylist(
    lib,
    playlistId,
    (p) => {
      const tracks = p.tracks.slice();
      const [moved] = tracks.splice(from, 1);
      tracks.splice(to, 0, moved);
      return { ...p, tracks };
    },
    now
  );
}

export function recordPlay(lib, id, now = Date.now()) {
  // collapse an immediate replay of the same song into one entry
  const [first, ...rest] = lib.history;
  const base = first && first.id === id ? rest : lib.history;
  return { ...lib, history: [{ id, at: now }, ...base].slice(0, HISTORY_MAX) };
}

export const clearHistory = (lib) => ({ ...lib, history: [] });

// keep only well-formed records whose ids still exist in the catalogue
export function sanitize(data, { isSong, isArtist }) {
  const lib = emptyLibrary();
  if (!data || typeof data !== "object") return lib;
  const stamped = (list) =>
    Array.isArray(list)
      ? list.filter((x) => x && isSong(x.id) && Number.isFinite(x.at)).map((x) => ({ id: x.id, at: x.at }))
      : [];
  lib.liked = stamped(data.liked);
  lib.history = stamped(data.history).slice(0, HISTORY_MAX);
  lib.followed = Array.isArray(data.followed) ? [...new Set(data.followed.filter(isArtist))] : [];
  lib.playlists = Array.isArray(data.playlists)
    ? data.playlists
        .filter((p) => p && typeof p.id === "string" && typeof p.name === "string" && p.name.trim())
        .map((p) => ({
          id: p.id,
          name: p.name.trim().slice(0, NAME_MAX),
          tracks: stamped(p.tracks),
          createdAt: Number(p.createdAt) || 0,
          updatedAt: Number(p.updatedAt) || 0
        }))
    : [];
  return lib;
}

// the original app stored liked song ids in "wavemusic.state.v2"
export function migrateLegacy(legacy, isSong, now = Date.now()) {
  if (!legacy || !Array.isArray(legacy.liked)) return null;
  const liked = legacy.liked.filter(isSong).map((id, i) => ({ id, at: now - i }));
  return liked.length ? liked : null;
}
