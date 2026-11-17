// app entry: creates the stores, the player and the router, and handles
// every user action through one delegated click listener.

import { createStorage, browserBackend, debounce } from "./core/storage.js";
import { html, raw, $, setText } from "./core/dom.js";
import { plural } from "./core/format.js";
import * as C from "./data/catalogue.js";
import { catalogueStore, loadCatalogue, artworkFor } from "./data/apple.js";
import { createPlayer } from "./player/player.js";
import { mediaSessionSupported } from "./player/media-session.js";
import { createLibrary } from "./library/library.js";
import { createRouter } from "./router.js";
import { injectIcons, icon } from "./ui/icons.js";
import { hydrateArtwork, watchImages } from "./ui/artwork.js";
import { resetLists, getList, syncTrackStates, syncUnavailable, syncLikeButtons } from "./ui/track-list.js";
import { createPlayerUI } from "./ui/player-ui.js";
import { toast, announce, openMenu, closeMenu, wireMenu, openDialog, closeDialog, wireDialog } from "./ui/overlays.js";
import { wireKeyboard, SHORTCUTS } from "./ui/keyboard.js";
import * as home from "./views/home.js";
import * as browse from "./views/browse.js";
import { renderLibrary, renderLiked, renderRecent, renderMine } from "./views/library.js";
import { renderAlbum, renderArtist, renderCollection } from "./views/detail.js";

injectIcons();

const storage = createStorage(browserBackend());
const library = createLibrary({
  storage,
  isSong: (id) => !!C.getSong(id),
  isArtist: (id) => !!C.getArtist(id)
});

const isUnavailable = (id) => {
  const song = C.getSong(id);
  return catalogueStore.get().status === "ready" && (!song || !song.audio);
};

function resolveTrack(id) {
  const song = C.getSong(id);
  if (!song) return null;
  return {
    id: song.id,
    title: song.title,
    artist: C.artistName(song),
    album: C.albumTitle(song),
    src: song.audio,
    artwork: [256, 512]
      .map((size) => ({ src: artworkFor(song.cover, size), sizes: size + "x" + size, type: "image/jpeg" }))
      .filter((a) => a.src)
  };
}

const player = createPlayer({
  audio: document.getElementById("audio"),
  resolveTrack,
  catalogue: catalogueStore,
  storage,
  defaultList: () => C.CHART,
  onNotice: toast,
  onTrackStart(id) {
    library.recordPlay(id);
    const song = C.getSong(id);
    if (song) announce("Now playing: " + song.title + " by " + C.artistName(song));
  }
});

const view = document.getElementById("view");
const ui = createPlayerUI({ player, library, isUnavailable });

// rendering

const ROUTES = {
  home: (ctx) => home.render(ctx),
  search: (ctx) => browse.render(ctx, ""),
  category: (ctx, param) => browse.render(ctx, param),
  library: (ctx) => renderLibrary(ctx),
  liked: (ctx) => renderLiked(ctx),
  recent: (ctx) => renderRecent(ctx),
  mine: (ctx, param) => renderMine(ctx, param),
  playlist: (ctx, param) => renderCollection(ctx, param),
  album: (ctx, param) => renderAlbum(ctx, param),
  artist: (ctx, param) => renderArtist(ctx, param)
};

const NAV_GROUP = { home: "home", search: "search", category: "search", library: "library", liked: "library", recent: "library", mine: "library" };

function context() {
  const state = player.store.get();
  return {
    lib: library.store.get(),
    library,
    track: { isLiked: library.isLiked, currentId: state.current, status: state.status, isUnavailable }
  };
}

// a selector that finds "the same" control again after a re-render
function focusKey(el) {
  if (!el || el === document.body || !view.contains(el)) return null;
  if (el.id) return "#" + CSS.escape(el.id);
  if (el.type === "radio") return 'input[name="' + CSS.escape(el.name) + '"][value="' + CSS.escape(el.value) + '"]';
  const parts = ["action", "id", "list", "pos", "key"]
    .filter((k) => el.dataset[k] !== undefined)
    .map((k) => "[data-" + k + '="' + CSS.escape(el.dataset[k]) + '"]');
  if (parts.length) return parts.join("");
  if (el.getAttribute("href")) return 'a[href="' + CSS.escape(el.getAttribute("href")) + '"]';
  return null;
}

function markCachedImages(root) {
  root.querySelectorAll("img").forEach((img) => {
    if (img.complete && img.naturalWidth) img.classList.add("is-loaded");
  });
}

const router = createRouter({
  routes: ROUTES,
  fallback: "home",
  onRender(route, options) {
    closeMenu(false);
    if (options.isNew && ui.isSheet()) ui.closeSheet({ restoreFocus: false });

    const keep = options.refresh || options.preserveFocus;
    const key = keep ? focusKey(document.activeElement) : null;
    const scroll = window.scrollY;

    resetLists();
    const out = ROUTES[route.name](context(), route.param);
    view.innerHTML = String(out.html);
    document.title = out.title + " · WaveMusic";
    hydrateArtwork(view);
    markCachedImages(view);
    updateNav(route.name);
    if (route.unknown) toast("That page does not exist, so here is Listen.");

    if (keep) {
      window.scrollTo(0, scroll);
      const again = key && view.querySelector(key);
      if (again) again.focus({ preventScroll: true });
      // the focused control disappeared, so land on the page heading
      else if (key) (view.querySelector("[data-focus-target]") || view).focus({ preventScroll: true });
    } else if (options.isNew) {
      view.classList.remove("view-enter");
      void view.offsetWidth;
      view.classList.add("view-enter");
      window.scrollTo(0, 0);
      if (!options.initial) {
        const target = (options.focus && view.querySelector(options.focus)) || view.querySelector("[data-focus-target]") || view;
        target.focus({ preventScroll: true });
      }
    }
  }
});

function updateNav(name) {
  const group = NAV_GROUP[name] || "";
  document.querySelectorAll("[data-nav]").forEach((link) => {
    if (link.dataset.nav === group) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

// browse: update only the results while typing

const updateResults = debounce(() => {
  const results = document.getElementById("browse-results");
  if (!results) return;
  const route = router.current;
  resetLists();
  const out = browse.renderResults(context(), route && route.name === "category" ? route.param : "");
  results.innerHTML = String(out.html);
  setText(document.getElementById("browse-summary"), out.summary);
  hydrateArtwork(results);
  markCachedImages(results);
}, 140);

function setQuery(value, source) {
  browse.browseState.query = value;
  const top = document.getElementById("top-search");
  const page = document.getElementById("search-input");
  if (source !== top && top) top.value = value;
  if (source !== page && page) page.value = value;
  const clear = view.querySelector(".browse-clear");
  if (clear) clear.hidden = !value;
  const route = router.current;
  if (!route || (route.name !== "search" && route.name !== "category")) {
    router.go("#search", { preserveFocus: true });
    return;
  }
  updateResults();
}

document.addEventListener("input", (event) => {
  const el = event.target;
  if (el.id === "top-search" || el.id === "search-input") setQuery(el.value, el);
});

document.addEventListener("change", (event) => {
  const el = event.target;
  if (!view.contains(el) || el.type !== "radio") return;
  if (el.name === "type") {
    browse.browseState.type = el.value;
    updateResults.flush();
  } else if (el.name === "genre") {
    router.go(el.value ? "#category/" + el.value : "#search", { preserveFocus: true });
  }
});

document.addEventListener("submit", (event) => {
  const form = event.target;
  if (form.dataset.action !== "submit-search") return;
  event.preventDefault();
  if (form.id === "browse-form") {
    updateResults.flush();
    return;
  }
  const value = document.getElementById("top-search").value;
  browse.browseState.query = value;
  router.go("#search");
});

// list and track helpers

const idsFrom = (el) => (el.dataset.ids || "").split(",").map(Number).filter((id) => C.getSong(id));
const songName = (id) => {
  const song = C.getSong(id);
  return song ? "“" + song.title + "”" : "Track";
};

function playFromList(listId, pos) {
  const list = getList(listId);
  if (!list) return;
  const id = list.ids[pos];
  if (isUnavailable(id)) {
    toast(songName(id) + " has no preview available.");
    return;
  }
  player.playList(list.ids, pos, list.source);
}

function trackMenuItems(songId, { listId = null, pos = -1 } = {}) {
  const song = C.getSong(songId);
  if (!song) return [];
  const list = listId ? getList(listId) : null;
  const items = [
    { label: "Play next", icon: "queueNext", run: () => queueIds([songId], "next") },
    { label: "Add to queue", icon: "listPlus", run: () => queueIds([songId], "end") },
    { label: "Add to playlist…", icon: "plus", run: () => addToPlaylistDialog([songId]) },
    "separator",
    song.album
      ? { label: "Go to album", icon: "album", run: () => router.go("#album/" + song.album) }
      : { label: "Go to single", icon: "album", run: () => router.go("#album/" + song.cover) },
    { label: "Go to artist", icon: "user", run: () => router.go("#artist/" + song.artist) }
  ];
  if (song.url) {
    items.push({ label: "Open in Apple Music", icon: "externalLink", run: () => window.open(song.url, "_blank", "noopener") });
  }
  if (list && list.playlistId) {
    const count = list.ids.length;
    items.push(
      "separator",
      { label: "Move up", icon: "arrowUp", disabled: pos <= 0, run: () => library.moveTrack(list.playlistId, pos, pos - 1) },
      { label: "Move down", icon: "arrowDown", disabled: pos >= count - 1, run: () => library.moveTrack(list.playlistId, pos, pos + 1) },
      {
        label: "Remove from this playlist",
        icon: "trash",
        run: () => {
          library.removeTrackAt(list.playlistId, pos);
          toast("Removed " + songName(songId) + ".");
        }
      }
    );
  }
  return items;
}

function queueIds(ids, where) {
  if (!ids.length) return;
  const wasEmpty = !player.store.get().queue.entries.length;
  if (where === "next") player.playNext(ids);
  else player.addToQueue(ids);
  if (wasEmpty) return;
  const label = ids.length === 1 ? songName(ids[0]) : plural(ids.length, "track");
  toast(where === "next" ? label + " will play next." : label + " added to the queue.");
}

// dialogs

function nameForm({ value = "", submitLabel, ignoreId = null, onSubmit }) {
  return {
    body: html`<form class="dialog-form" id="name-form" novalidate>
      <label class="field-label" for="playlist-name">Name</label>
      <input class="field" id="playlist-name" name="name" type="text" maxlength="60" value="${value}" autocomplete="off" required
        aria-describedby="name-error" autofocus>
      <p class="field-error" id="name-error" aria-live="polite"></p>
      <div class="dialog-actions">
        <button class="btn" type="button" data-dialog-close>Cancel</button>
        <button class="btn btn-primary" type="submit">${submitLabel}</button>
      </div>
    </form>`,
    onOpen(dialog) {
      const form = dialog.querySelector("#name-form");
      const input = form.querySelector("input");
      input.select();
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const error = library.validateName(input.value, ignoreId);
        const out = form.querySelector("#name-error");
        out.textContent = error;
        input.setAttribute("aria-invalid", error ? "true" : "false");
        if (error) {
          input.focus();
          return;
        }
        closeDialog();
        onSubmit(input.value.trim());
      });
    }
  };
}

function newPlaylistDialog(ids = []) {
  const form = nameForm({
    submitLabel: "Create",
    onSubmit(name) {
      const playlist = library.createPlaylist(name, ids);
      if (ids.length) toast("Created “" + playlist.name + "” with " + plural(ids.length, "song") + ".");
      else {
        toast("Created “" + playlist.name + "”.");
        router.go("#mine/" + playlist.id);
      }
    }
  });
  openDialog({ title: ids.length ? "New playlist with " + plural(ids.length, "song") : "New playlist", ...form });
}

function addToPlaylistDialog(ids) {
  const playlists = library.store.get().playlists;
  const title = ids.length === 1 ? "Add " + songName(ids[0]) + " to a playlist" : "Add " + plural(ids.length, "song") + " to a playlist";
  openDialog({
    title,
    body: html`${playlists.length
        ? html`<ul class="pick-list">${playlists.map(
            (p) => html`<li><button class="pick" type="button" data-pick="${p.id}">
              <span class="pick-name">${p.name}</span><span class="pick-meta">${plural(p.tracks.length, "song")}</span></button></li>`
          )}</ul>`
        : html`<p class="dialog-text">You have no playlists yet.</p>`}
      <div class="dialog-actions">
        <button class="btn" type="button" data-dialog-close>Cancel</button>
        <button class="btn btn-primary" type="button" data-new-playlist>${raw(icon("plus"))}<span>New playlist</span></button>
      </div>`,
    onOpen(dialog) {
      dialog.querySelector(".dialog-body").addEventListener("click", (event) => {
        const pick = event.target.closest("[data-pick]");
        if (pick) {
          const playlist = library.playlist(pick.dataset.pick);
          const added = library.addTracks(pick.dataset.pick, ids);
          closeDialog();
          if (!added) toast("Already in “" + playlist.name + "”.");
          else toast("Added " + (ids.length === 1 ? songName(ids[0]) : plural(added, "song")) + " to “" + playlist.name + "”.");
          return;
        }
        if (event.target.closest("[data-new-playlist]")) newPlaylistDialog(ids);
      });
    }
  });
}

function confirmDialog({ title, text, confirmLabel, onConfirm }) {
  openDialog({
    title,
    body: html`<p class="dialog-text">${text}</p>
      <div class="dialog-actions">
        <button class="btn" type="button" data-dialog-close autofocus>Cancel</button>
        <button class="btn btn-danger" type="button" data-confirm>${confirmLabel}</button>
      </div>`,
    onOpen(dialog) {
      dialog.querySelector("[data-confirm]").addEventListener("click", () => {
        closeDialog();
        onConfirm();
      });
    }
  });
}

function shortcutsDialog() {
  openDialog({
    title: "Keyboard shortcuts",
    body: html`<dl class="shortcuts">${SHORTCUTS.map(([keys, text]) => html`<div><dt><kbd>${keys}</kbd></dt><dd>${text}</dd></div>`)}</dl>
      <p class="dialog-text">Shortcuts pause while you type in a text field.${
        mediaSessionSupported() ? " Your keyboard's media keys and the system media controls also work here." : ""
      }</p>`
  });
}

function uniqueName(base) {
  let name = base;
  let n = 2;
  while (library.validateName(name)) name = base + " " + n++;
  return name;
}

async function share() {
  const url = location.href;
  try {
    if (navigator.share) {
      await navigator.share({ title: document.title, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    toast("Link copied to the clipboard.");
  } catch (err) {
    if (err && err.name === "AbortError") return;
    toast("Could not share automatically. Copy the address bar instead.");
  }
}

// one delegated click handler for the whole app

const ACTIONS = {
  "play-ids": (el) => {
    const ids = idsFrom(el);
    if (ids.length) player.playList(ids, 0, el.dataset.source || "WaveMusic", el.dataset.shuffle ? { shuffle: true } : {});
  },
  "play-list": (el) => playFromList(el.dataset.list, Number(el.dataset.pos)),
  "queue-ids": (el) => queueIds(idsFrom(el), "next"),
  "toggle-play": () => player.togglePlay(),
  next: () => player.next(),
  prev: () => player.previous(),
  shuffle: () => {
    const on = player.toggleShuffle();
    announce(on ? "Shuffle on" : "Shuffle off");
  },
  repeat: () => {
    const mode = player.cycleRepeat();
    announce({ off: "Repeat off", all: "Repeat all", one: "Repeat one track" }[mode]);
  },
  mute: () => player.toggleMute(),
  like: (el) => {
    const id = Number(el.dataset.id);
    if (!C.getSong(id)) return;
    const on = library.toggleLike(id);
    toast(on ? "Added " + songName(id) + " to Liked songs." : "Removed " + songName(id) + " from Liked songs.");
  },
  follow: (el) => {
    const on = library.toggleFollow(el.dataset.id);
    const artist = C.getArtist(el.dataset.id);
    toast(on ? "Following " + artist.name + "." : "Unfollowed " + artist.name + ".");
  },
  "track-menu": (el) => {
    const list = getList(el.dataset.list);
    const pos = Number(el.dataset.pos);
    if (!list) return;
    const song = C.getSong(list.ids[pos]);
    openMenu(el, trackMenuItems(list.ids[pos], { listId: el.dataset.list, pos }), "Options for " + (song ? song.title : "track"));
  },
  "deck-menu": (el) => {
    const id = player.store.get().current;
    if (id) openMenu(el, trackMenuItems(id), "Options for the current track");
  },
  "deck-add-to-playlist": () => {
    const id = player.store.get().current;
    if (id) addToPlaylistDialog([id]);
  },
  "add-ids-to-playlist": (el) => addToPlaylistDialog(idsFrom(el)),
  "queue-jump": (el) => player.jumpTo(el.dataset.key),
  "queue-move": (el) => {
    const key = el.dataset.key;
    player.moveInQueue(key, Number(el.dataset.to));
    // keep focus on the moved row
    requestAnimationFrame(() => {
      const row = document.querySelector('.queue-item[data-key="' + CSS.escape(key) + '"]');
      const again = row && row.querySelector('[data-action="queue-move"]:not([disabled])');
      if (again) again.focus();
    });
  },
  "queue-remove": (el) => {
    const item = el.closest(".queue-item");
    const next = item && (item.nextElementSibling || item.previousElementSibling);
    const nextKey = next && next.dataset.key;
    player.removeFromQueue(el.dataset.key);
    requestAnimationFrame(() => {
      const target =
        (nextKey && document.querySelector('.queue-item[data-key="' + CSS.escape(nextKey) + '"] .queue-main')) ||
        document.getElementById("up-next-heading");
      if (target) {
        if (!target.hasAttribute("tabindex") && target.tagName === "H2") target.setAttribute("tabindex", "-1");
        target.focus();
      }
    });
  },
  "clear-queue": () => {
    player.clearUpNext();
    toast("Cleared the upcoming tracks.");
  },
  "open-deck": () => ui.openSheet(),
  "close-deck": () => ui.closeSheet(),
  "close-deck-link": () => ui.closeSheet({ restoreFocus: false }),
  "new-playlist": () => newPlaylistDialog(),
  "rename-playlist": (el) => {
    const playlist = library.playlist(el.dataset.id);
    if (!playlist) return;
    openDialog({
      title: "Rename playlist",
      ...nameForm({
        value: playlist.name,
        submitLabel: "Save",
        ignoreId: playlist.id,
        onSubmit(name) {
          library.renamePlaylist(playlist.id, name);
          toast("Renamed to “" + name + "”.");
        }
      })
    });
  },
  "delete-playlist": (el) => {
    const playlist = library.playlist(el.dataset.id);
    if (!playlist) return;
    confirmDialog({
      title: "Delete “" + playlist.name + "”?",
      text: "This removes the playlist from this browser. It cannot be undone. Songs stay in the catalogue.",
      confirmLabel: "Delete playlist",
      onConfirm() {
        library.deletePlaylist(playlist.id);
        toast("Deleted “" + playlist.name + "”.");
        router.go("#library");
      }
    });
  },
  "copy-collection": (el) => {
    const collection = C.getCollection(el.dataset.id);
    if (!collection) return;
    const playlist = library.createPlaylist(uniqueName(collection.title), collection.tracks);
    toast("Saved as “" + playlist.name + "” in your Library.");
  },
  "clear-history": () =>
    confirmDialog({
      title: "Clear listening history?",
      text: "This removes every entry from Recently played in this browser.",
      confirmLabel: "Clear history",
      onConfirm() {
        library.clearHistory();
        toast("History cleared.");
      }
    }),
  share: () => share(),
  shortcuts: () => shortcutsDialog(),
  "clear-search": () => {
    const input = document.getElementById("search-input");
    setQuery("", null);
    updateResults.flush();
    if (input) input.focus();
  },
  "reset-browse": () => {
    browse.browseState.query = "";
    browse.browseState.type = "all";
    const top = document.getElementById("top-search");
    if (top) top.value = "";
    router.go("#search", { focus: "#search-input" });
    if (router.current.name === "search") document.getElementById("search-input").focus();
  },
  skip: (el, event) => {
    event.preventDefault();
    const target = view.querySelector("[data-focus-target]") || view;
    target.focus();
  }
};

document.addEventListener("click", (event) => {
  const el = event.target.closest("[data-action]");
  if (!el || el.tagName === "FORM") return;
  const run = ACTIONS[el.dataset.action];
  if (!run) return;
  if (el.getAttribute("aria-disabled") === "true") return;
  run(el, event);
});

// store subscriptions

player.store.subscribe((next, prev) => {
  if (next.current !== prev.current || next.status !== prev.status) {
    syncTrackStates(view, { currentId: next.current, status: next.status });
  }
});

library.store.subscribe((next, prev) => {
  syncLikeButtons(document, library.isLiked);
  ui.syncLike();
  const route = router.current;
  if (!route) return;
  const affects =
    route.name === "library" ||
    route.name === "mine" ||
    (route.name === "liked" && next.liked !== prev.liked) ||
    (route.name === "recent" && next.history !== prev.history) ||
    (route.name === "artist" && next.followed !== prev.followed);
  if (affects) router.refresh();
});

const banner = document.getElementById("catalogue-banner");
let bannerTimer = null;
function renderBanner(state) {
  clearTimeout(bannerTimer);
  if (state.status === "loading") {
    // only mention loading if it takes a moment
    bannerTimer = setTimeout(() => {
      banner.innerHTML = String(html`<span class="banner-dot" aria-hidden="true"></span><span>Loading previews and artwork from Apple Music…</span>`);
      banner.dataset.tone = "info";
      banner.hidden = false;
    }, 700);
    return;
  }
  if (state.status === "error") {
    banner.innerHTML = String(html`${raw(icon("alert"))}<span>${state.error} Track listings still work, but nothing can play.</span>
      <button class="btn" type="button" data-action="retry-catalogue">Try again</button>`);
    banner.dataset.tone = "error";
    banner.hidden = false;
    return;
  }
  banner.hidden = true;
}

ACTIONS["retry-catalogue"] = () => loadCatalogue({ storage });

catalogueStore.subscribe((next, prev) => {
  renderBanner(next);
  if (next.status === "ready" && prev.status !== "ready") {
    hydrateArtwork(document);
    syncUnavailable(view, isUnavailable);
    ui.refresh();
  }
});

// global wiring

watchImages(document);
markCachedImages(document);
wireMenu();
wireDialog();
wireKeyboard({
  player,
  onShortcuts: shortcutsDialog,
  onSearch() {
    const input = document.getElementById("search-input") || document.getElementById("top-search");
    if (input && input.offsetParent !== null) input.focus();
    else router.go("#search");
  },
  onQueue: () => ui.openSheet(),
  onEscape() {
    const menu = document.getElementById("menu");
    if (!menu.hidden) return closeMenu(true);
    if (document.getElementById("dialog").open) return;
    ui.closeSheet();
  }
});

player.setMediaHandlers();

window.addEventListener("pagehide", () => {
  player.savePosition();
  library.flush();
});
window.addEventListener("online", () => {
  if (catalogueStore.get().status === "error") loadCatalogue({ storage });
});

router.start();
player.restore((id) => !!C.getSong(id));
loadCatalogue({ storage });
