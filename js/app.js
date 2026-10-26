/* the app: pages, routing, the music player and the click handling.
   every view function returns a string of html, the router puts it in #view,
   and one click listener at the end of the file handles every button. */

// app state
const state = {
  view: "home",
  history: [],
  historyIndex: -1,
  searchQuery: "",
  libraryTab: "playlists",
  liked: [],
  recentlyPlayed: [],
  shuffle: false,
  repeat: "off",
  volume: 0.8,
  muted: false,
  queue: [],
  queueIndex: -1,
  queueSource: null,
  isPlaying: false,
  demoMode: true,
  demoSeconds: 0,
  shuffleOrder: []
};

const STORAGE_KEY = "wavemusic.state.v1";

// change these to use your own name and avatar
const USER = {
  name: "Alex Rivera",
  handle: "@alexrivera",
  avatar: "assets/images/avatar.svg"
};

// 222 -> "3:42"
function formatTime(seconds) {
  const total = Math.max(0, Math.floor(seconds || 0));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m + ":" + String(s).padStart(2, "0");
}

// 2481220 -> "2.5M"
function formatPlays(text) {
  const n = Number(String(text).replace(/,/g, ""));
  if (!n) return "0";
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return Math.round(n / 1000) + "K";
  return String(n);
}

// fake but stable dates for the date added column
const DATE_CACHE = {};
function dateAddedFor(songId) {
  if (!DATE_CACHE[songId]) {
    const daysAgo = (songId * 13) % 420;
    const d = new Date(2025, 0, 15);
    d.setDate(d.getDate() - daysAgo);
    DATE_CACHE[songId] = d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }
  return DATE_CACHE[songId];
}

// greeting based on the time of day
function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// small message at the bottom of the screen
let toastTimer = null;
function showToast(message, iconName) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.innerHTML = icon(iconName || "spark") + "<span>" + message + "</span>";
  el.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    el.classList.remove("is-visible");
  }, 2200);
}

// save likes, volume and history in the browser
function saveState() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        liked: state.liked,
        volume: state.volume,
        muted: state.muted,
        shuffle: state.shuffle,
        repeat: state.repeat,
        recentlyPlayed: state.recentlyPlayed
      })
    );
  } catch (err) {
    // storage can be blocked, the app still works
  }
}

// load the saved values, or fall back to the defaults in data.js
function loadState() {
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch (err) {
    saved = null;
  }
  state.liked = saved && saved.liked ? saved.liked : COLLECTIONS.likedSongs.slice();
  state.recentlyPlayed =
    saved && saved.recentlyPlayed ? saved.recentlyPlayed : COLLECTIONS.recentlyPlayed.slice();
  state.volume = saved && typeof saved.volume === "number" ? saved.volume : 0.8;
  state.muted = saved ? !!saved.muted : false;
  state.shuffle = saved ? !!saved.shuffle : false;
  state.repeat = saved && saved.repeat ? saved.repeat : "off";
}

function isLiked(songId) {
  return state.liked.indexOf(songId) !== -1;
}

// like or unlike a song
function toggleLike(songId) {
  const at = state.liked.indexOf(songId);
  if (at === -1) {
    state.liked.unshift(songId);
    showToast("Added to Liked Songs", "heart");
  } else {
    state.liked.splice(at, 1);
    showToast("Removed from Liked Songs", "heart");
  }
  saveState();
  updateLikedCount();
  refreshLikeButtons(songId);
  if (state.view === "liked") renderView();
}

// update the heart icons for one song, without redrawing the page
function refreshLikeButtons(songId) {
  const liked = isLiked(songId);
  document.querySelectorAll('[data-action="like"][data-id="' + songId + '"]').forEach(function (btn) {
    btn.classList.toggle("is-active", liked);
    btn.setAttribute("aria-pressed", liked ? "true" : "false");
    btn.setAttribute("title", liked ? "Remove from Liked Songs" : "Save to Liked Songs");
    const svg = btn.querySelector("svg");
    if (svg) svg.style.fill = liked ? "currentColor" : "none";
  });
}

// update the number next to liked songs
function updateLikedCount() {
  setText("liked-count", String(state.liked.length));
}

// the heart button used in the player, the rows and the table header
function likeButton(songId, extraClass) {
  const liked = isLiked(songId);
  return (
    '<button class="icon-btn like-btn' + (extraClass ? " " + extraClass : "") +
      (liked ? " is-active" : "") + '" type="button" data-action="like" data-id="' + songId +
      '" aria-pressed="' + (liked ? "true" : "false") + '" title="' +
      (liked ? "Remove from Liked Songs" : "Save to Liked Songs") + '">' +
      icon("heart") +
    "</button>"
  );
}

// the audio element. if a file is missing we switch to demo mode below.
const audio = document.getElementById("audio");
let demoTimer = null;

// demo mode moves the progress bar even when there is no mp3 file
function startDemoTimer() {
  stopDemoTimer();
  demoTimer = setInterval(function () {
    if (!state.isPlaying) return;
    state.demoSeconds += 0.25;
    const total = currentDurationSeconds();
    if (state.demoSeconds >= total) {
      state.demoSeconds = total;
      updatePlayerProgress();
      onTrackEnded();
      return;
    }
    updatePlayerProgress();
  }, 250);
}

function stopDemoTimer() {
  if (demoTimer) clearInterval(demoTimer);
  demoTimer = null;
}

function setDemoMode(on) {
  state.demoMode = !!on;
  const badge = document.getElementById("demo-badge");
  if (badge) badge.classList.toggle("is-hidden", !state.demoMode);
}

// song length from the audio file, or from the "3:42" text in data.js
function currentDurationSeconds() {
  const song = currentSong();
  if (!song) return 0;
  if (!state.demoMode && audio.duration && isFinite(audio.duration)) return audio.duration;
  return durationToSeconds(song.duration);
}

function currentSong() {
  const id = state.queue[state.queueIndex];
  return typeof id === "number" ? getSong(id) : null;
}

// play a list of songs, starting at one position
function playQueue(songIds, index, sourceLabel) {
  if (!songIds || !songIds.length) return;
  state.queue = songIds.slice();
  state.queueIndex = Math.max(0, Math.min(index || 0, state.queue.length - 1));
  state.queueSource = sourceLabel || "WaveMusic";
  state.demoSeconds = 0;
  buildShuffleOrder();
  loadCurrentTrack(true);
  markRecentlyPlayed();
  syncTrackRowHighlight();
}

// play a single song
function playSong(songId, sourceLabel) {
  playQueue([songId], 0, sourceLabel || "WaveMusic");
}

// play a list of songs
function playSongs(songIds, startIndex, sourceLabel) {
  playQueue(songIds, startIndex || 0, sourceLabel || "WaveMusic");
}

// load the current song into the audio element and start it
function loadCurrentTrack(autoplay) {
  const song = currentSong();
  if (!song) return;

  audio.src = song.audio;
  audio.volume = state.muted ? 0 : state.volume;
  state.demoSeconds = 0;

  updatePlayerMeta();
  updatePlayerProgress();
  renderQueueIfOpen();
  syncTrackRowHighlight();

  if (!autoplay) return;

  const attempt = audio.play();
  if (attempt && typeof attempt.then === "function") {
    attempt.then(function () {
      // a real file is playing
      setDemoMode(false);
      state.isPlaying = true;
      stopDemoTimer();
      syncPlayIcons();
    }).catch(function () {
      // no file, or the browser blocked autoplay, so use demo mode
      enterDemoPlayback();
    });
  }
}

// keep the player usable when there is no audio file
function enterDemoPlayback() {
  setDemoMode(true);
  state.isPlaying = true;
  syncPlayIcons();
  startDemoTimer();
  updatePlayerProgress();
}

// play or pause
function togglePlay() {
  if (!currentSong()) {
    playQueue(SONGS.map(function (s) { return s.id; }), 0, "WaveMusic");
    return;
  }
  if (state.isPlaying) {
    pausePlayback();
  } else {
    resumePlayback();
  }
}

function pausePlayback() {
  state.isPlaying = false;
  audio.pause();
  stopDemoTimer();
  syncPlayIcons();
}

function resumePlayback() {
  const song = currentSong();
  if (!song) return;
  if (state.demoMode) {
    enterDemoPlayback();
    return;
  }
  const attempt = audio.play();
  if (attempt && typeof attempt.then === "function") {
    attempt.then(function () {
      state.isPlaying = true;
      syncPlayIcons();
    }).catch(function () {
      enterDemoPlayback();
    });
  } else {
    state.isPlaying = true;
    syncPlayIcons();
  }
}

// shuffle: keep a shuffled list of queue positions.
// the song that is playing now always goes first, so "next" walks through
// every other song exactly once before the queue runs out.
function buildShuffleOrder() {
  const current = state.queueIndex;
  const order = state.queue
    .map(function (_, i) { return i; })
    .filter(function (i) { return i !== current; });
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = order[i];
    order[i] = order[j];
    order[j] = tmp;
  }
  if (current >= 0 && current < state.queue.length) order.unshift(current);
  state.shuffleOrder = order;
}

function toggleShuffle() {
  state.shuffle = !state.shuffle;
  buildShuffleOrder();
  saveState();
  syncToggleIcons();
  showToast(state.shuffle ? "Shuffle on" : "Shuffle off", "shuffle");
}

// which track comes next, in either direction
function nextIndex(direction) {
  const total = state.queue.length;
  if (!total) return -1;

  if (state.shuffle) {
    const order = state.shuffleOrder.length ? state.shuffleOrder : state.queue.map(function (_, i) { return i; });
    const at = order.indexOf(state.queueIndex);
    const nextAt = at + direction;
    if (nextAt < 0) return state.repeat === "all" ? order[order.length - 1] : order[0];
    if (nextAt >= order.length) {
      if (state.repeat === "all") return order[0];
      return -1;
    }
    return order[nextAt];
  }

  const next = state.queueIndex + direction;
  if (next < 0) return state.repeat === "all" ? total - 1 : 0;
  if (next >= total) return state.repeat === "all" ? 0 : -1;
  return next;
}

// next track
function playNext() {
  const idx = nextIndex(1);
  if (idx === -1) {
    pausePlayback();
    state.demoSeconds = currentDurationSeconds();
    updatePlayerProgress();
    return;
  }
  state.queueIndex = idx;
  state.demoSeconds = 0;
  loadCurrentTrack(true);
  markRecentlyPlayed();
  syncTrackRowHighlight();
}

// previous track, or restart the song if we are already partway in
function playPrevious() {
  if (state.demoSeconds > 3 || (!state.demoMode && audio.currentTime > 3)) {
    seekTo(0);
    return;
  }
  const idx = nextIndex(-1);
  if (idx === -1) return;
  state.queueIndex = idx;
  state.demoSeconds = 0;
  loadCurrentTrack(true);
  syncTrackRowHighlight();
}

// repeat off, all, one
function cycleRepeat() {
  state.repeat = state.repeat === "off" ? "all" : state.repeat === "all" ? "one" : "off";
  saveState();
  syncToggleIcons();
  showToast(
    state.repeat === "off" ? "Repeat off" : state.repeat === "all" ? "Repeat all" : "Repeat one",
    "repeat"
  );
}

// when a song finishes
function onTrackEnded() {
  if (state.repeat === "one") {
    seekTo(0);
    loadCurrentTrack(true);
    return;
  }
  const idx = nextIndex(1);
  if (idx === -1) {
    pausePlayback();
    state.demoSeconds = 0;
    updatePlayerProgress();
    return;
  }
  state.queueIndex = idx;
  state.demoSeconds = 0;
  loadCurrentTrack(true);
  markRecentlyPlayed();
  syncTrackRowHighlight();
}

// remember the album that is playing, for the recently played row
function markRecentlyPlayed() {
  const song = currentSong();
  if (!song) return;
  const key = song.album || song.cover;
  if (!key) return;
  const at = state.recentlyPlayed.indexOf(key);
  if (at !== -1) state.recentlyPlayed.splice(at, 1);
  state.recentlyPlayed.unshift(key);
  state.recentlyPlayed = state.recentlyPlayed.slice(0, 10);
  saveState();
}

// update the player bar and the now playing overlay
function updatePlayerMeta() {
  const song = currentSong();
  if (!song) return;

  const cover = document.getElementById("player-cover");
  if (cover) {
    cover.src = song.cover ? albumCover(song.cover) : "assets/images/default-cover.svg";
    cover.alt = song.title + " artwork";
  }
  setText("player-title", song.title);
  setText("player-artist", artistName(song));
  const likeSlot = document.getElementById("player-like");
  if (likeSlot) likeSlot.innerHTML = likeButton(song.id);
  const expand = document.getElementById("player-cover-btn");
  if (expand) expand.dataset.name = song.cover || "brand";

  setText("np-title", song.title);
  setText("np-artist", artistName(song));
  setText("np-album", albumTitle(song));
  const npCover = document.getElementById("np-cover");
  if (npCover) {
    npCover.src = song.cover ? albumCover(song.cover) : "assets/images/default-cover.svg";
    npCover.alt = song.title + " artwork";
  }
  const npLike = document.getElementById("np-like");
  if (npLike) npLike.innerHTML = likeButton(song.id);
  const npWrap = document.getElementById("np-art");
  if (npWrap) npWrap.style.setProperty("--cover-gradient", gradientFor(song.cover || "brand", 160));

  const bar = document.getElementById("player");
  if (bar) bar.style.setProperty("--bar-gradient", gradientFor(song.cover || "brand", 90));

  const total = currentDurationSeconds();
  setText("player-duration", formatTime(total));
  setText("np-duration", formatTime(total));

  // show the song on the lock screen or in the os media controls
  if ("mediaSession" in navigator) {
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title,
        artist: artistName(song),
        album: albumTitle(song),
        artwork: [{ src: song.cover ? albumCover(song.cover) : "assets/images/default-cover.svg", sizes: "512x512", type: "image/svg+xml" }]
      });
    } catch (err) {
      // media session is optional
    }
  }
}

// move the progress bars and the times
function updatePlayerProgress() {
  const total = currentDurationSeconds();
  let current = state.demoMode ? state.demoSeconds : audio.currentTime || 0;
  if (current > total) current = total;
  const percent = total > 0 ? (current / total) * 100 : 0;

  setText("player-current", formatTime(current));
  setText("np-current", formatTime(current));
  setText("player-duration", formatTime(total));
  setText("np-duration", formatTime(total));

  setBar("player-progress", "player-progress-fill", "player-progress-knob", percent);
  setBar("np-progress", "np-progress-fill", "np-progress-knob", percent);
}

// set one progress bar to a percentage
function setBar(trackId, fillId, knobId, percent) {
  const fill = document.getElementById(fillId);
  if (fill) fill.style.width = percent + "%";
  const knob = document.getElementById(knobId);
  if (knob) knob.style.left = percent + "%";
  const track = document.getElementById(trackId);
  if (track) track.setAttribute("aria-valuenow", String(Math.round(percent)));
}

// jump to a time in the song
function seekTo(seconds) {
  const total = currentDurationSeconds();
  const clamped = Math.max(0, Math.min(seconds, total));
  state.demoSeconds = clamped;
  if (!state.demoMode && audio.duration && isFinite(audio.duration)) {
    audio.currentTime = clamped;
  }
  updatePlayerProgress();
}

// turn a click on the progress bar into a time
function seekFromPointer(trackEl, clientX) {
  const rect = trackEl.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  seekTo(ratio * currentDurationSeconds());
}

// volume
function applyVolume() {
  audio.volume = state.muted ? 0 : state.volume;
  const slider = document.getElementById("volume-slider");
  if (slider) {
    slider.value = String(Math.round((state.muted ? 0 : state.volume) * 100));
    slider.style.setProperty("--volume", (state.muted ? 0 : state.volume) * 100 + "%");
  }
  const btn = document.getElementById("volume-btn");
  if (btn) {
    const name = state.muted || state.volume === 0 ? "volumeMute" : state.volume < 0.5 ? "volumeLow" : "volume";
    btn.innerHTML = icon(name);
    btn.setAttribute("title", state.muted ? "Unmute" : "Mute");
  }
}

function setVolume(value) {
  state.volume = Math.max(0, Math.min(1, value));
  state.muted = state.volume === 0;
  saveState();
  applyVolume();
}

function toggleMute() {
  state.muted = !state.muted;
  if (!state.muted && state.volume === 0) state.volume = 0.6;
  saveState();
  applyVolume();
}

// swap the play and pause icons
function syncPlayIcons() {
  ["player-play-icon", "np-play-icon"].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = icon(state.isPlaying ? "pause" : "play");
  });
  const bar = document.getElementById("player");
  if (bar) bar.classList.toggle("is-playing", state.isPlaying);
  document.querySelectorAll('[data-action="toggle-play"]').forEach(function (btn) {
    btn.setAttribute("title", state.isPlaying ? "Pause" : "Play");
    btn.setAttribute("aria-label", state.isPlaying ? "Pause" : "Play");
  });
}

// highlight the shuffle and repeat buttons when they are on
function syncToggleIcons() {
  const s = document.getElementById("shuffle-btn");
  if (s) s.classList.toggle("is-active", state.shuffle);
  const ns = document.getElementById("np-shuffle");
  if (ns) ns.classList.toggle("is-active", state.shuffle);

  const r = document.getElementById("repeat-btn");
  if (r) {
    r.classList.toggle("is-active", state.repeat !== "off");
    r.innerHTML = icon(state.repeat === "one" ? "repeatOne" : "repeat");
    r.setAttribute("title", state.repeat === "off" ? "Repeat off" : state.repeat === "all" ? "Repeat all" : "Repeat one");
  }
  const nr = document.getElementById("np-repeat");
  if (nr) {
    nr.classList.toggle("is-active", state.repeat !== "off");
    nr.innerHTML = icon(state.repeat === "one" ? "repeatOne" : "repeat");
  }
}

// open and close the now playing overlay
function openNowPlaying() {
  const modal = document.getElementById("now-playing");
  if (!modal) return;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
  updatePlayerMeta();
  updatePlayerProgress();
  const cover = document.getElementById("np-cover");
  if (cover) cover.classList.toggle("is-spinning", state.isPlaying);
}

function closeNowPlaying() {
  const modal = document.getElementById("now-playing");
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");
}

// set the text of an element if it exists
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// show or hide the queue panel
function toggleQueue(force) {
  const panel = document.getElementById("queue-panel");
  if (!panel) return;
  const open = force === undefined ? !panel.classList.contains("is-open") : force;
  panel.classList.toggle("is-open", open);
  panel.setAttribute("aria-hidden", open ? "false" : "true");
  document.getElementById("queue-btn").classList.toggle("is-active", open);
  if (open) renderQueueIfOpen();
}

// draw the queue list
function renderQueueIfOpen() {
  const panel = document.getElementById("queue-panel");
  if (!panel || !panel.classList.contains("is-open")) return;
  const list = document.getElementById("queue-list");
  if (!list) return;

  const head = document.getElementById("queue-source");
  if (head) head.textContent = "Playing from: " + (state.queueSource || "WaveMusic");

  if (!state.queue.length) {
    list.innerHTML = '<p class="muted-note">Nothing in the queue yet. Play a song to get started.</p>';
    return;
  }

  list.innerHTML = state.queue
    .map(function (songId, i) {
      const song = getSong(songId);
      if (!song) return "";
      const active = i === state.queueIndex ? " is-active" : "";
      return (
        '<button class="queue-item' + active + '" type="button" data-action="queue-play" data-index="' + i + '">' +
          '<span class="queue-num">' + (i + 1) + "</span>" +
          '<img class="queue-thumb" src="' + albumCover(song.cover) + '" alt="" loading="lazy" onerror="onCoverError(this,\'' + escapeAttr(song.title) + '\')">' +
          '<span class="queue-text"><strong>' + song.title + "</strong><small>" + artistName(song) + "</small></span>" +
          '<span class="queue-time">' + song.duration + "</span>" +
        "</button>"
      );
    })
    .join("");
}

// a section title with an optional link on the right
function sectionHead(title, subtitle, actionHtml) {
  return (
    '<div class="section-head">' +
      "<div>" +
        '<h2 class="section-title">' + title + "</h2>" +
        (subtitle ? '<p class="section-sub">' + subtitle + "</p>" : "") +
      "</div>" +
      (actionHtml || "") +
    "</div>"
  );
}

// the round play button on cards and heroes
function playPill(songIds, label, extraClass) {
  return (
    '<button class="play-pill' + (extraClass ? " " + extraClass : "") + '" type="button" ' +
      'data-action="play-collection" data-ids="' + songIds.join(",") + '" ' +
      'data-label="' + escapeAttr(label) + '" title="Play ' + escapeAttr(label) + '">' +
      icon("play") +
    "</button>"
  );
}

// the round shuffle button
function shufflePill(songIds, label) {
  return (
    '<button class="play-pill play-pill--ghost" type="button" data-action="shuffle-collection" ' +
      'data-ids="' + songIds.join(",") + '" data-label="' + escapeAttr(label) + '" title="Shuffle ' + escapeAttr(label) + '">' +
      icon("shuffle") +
    "</button>"
  );
}

// a card for an album, artist, playlist or mix
function mediaCard(type, item, options) {
  const opts = options || {};
  const isArtist = type === "artist";
  const label = item.title || item.name;

  let coverSrc;
  let gradientKey;
  if (type === "album") {
    coverSrc = albumCover(item.slug);
    gradientKey = item.slug;
  } else if (type === "artist") {
    coverSrc = artistCover(item.id);
    gradientKey = item.id;
  } else {
    coverSrc = playlistCover(item.slug);
    gradientKey = item.palette || item.slug;
  }

  const subtitle = opts.subtitle !== undefined
    ? opts.subtitle
    : isArtist
      ? "Artist"
      : artistName(item.tracks ? item.tracks[0] : item.artist || item.tracks[0]);

  const songIds = opts.songIds || [];
  const round = isArtist ? " card--round" : "";

  return (
    '<article class="card' + round + (opts.wide ? " card--wide" : "") + '" data-gradient="' + gradientKey + '" ' + gradientStyle(gradientKey) + ">" +
      '<div class="card-art" data-action="open" data-type="' + type + '" data-id="' + item.id + '">' +
        coverArt({ src: coverSrc, name: gradientKey, alt: label, shape: isArtist ? "circle" : "square", className: "card-cover" }) +
        (songIds.length ? playPill(songIds, label, "card-play") : "") +
      "</div>" +
      '<div class="card-body">' +
        '<button class="card-title" type="button" data-action="open" data-type="' + type + '" data-id="' + item.id + '">' + label + "</button>" +
        '<p class="card-sub">' + subtitle + "</p>" +
      "</div>" +
    "</article>"
  );
}

// the track table, used by almost every page.
// options.show picks the columns, options.context is the "playing from" label
function buildTrackTable(songIds, options) {
  const opts = options || {};
  const show = Object.assign(
    { index: true, cover: true, title: true, artist: true, album: false, plays: false, date: false, duration: true, like: false },
    opts.show || {}
  );
  const context = opts.context || "WaveMusic";

  if (!songIds.length) {
    return '<p class="muted-note pad">' + (opts.emptyText || "No songs here yet.") + "</p>";
  }

  const head =
    "<thead><tr>" +
      (show.index ? '<th class="col-index">#</th>' : "") +
      '<th class="col-title">Title</th>' +
      (show.album ? '<th class="col-album">Album</th>' : "") +
      (show.plays ? '<th class="col-plays">Plays</th>' : "") +
      (show.date ? '<th class="col-date">Date Added</th>' : "") +
      (show.duration ? '<th class="col-duration">' + icon("clock") + "</th>" : "") +
    "</tr></thead>";

  const rows = songIds
    .map(function (songId, i) {
      const song = getSong(songId);
      if (!song) return "";
      const active = state.queue[state.queueIndex] === songId ? " is-active" : "";
      return (
        '<tr class="track-row' + active + '" data-action="play-row" data-ids="' + songIds.join(",") + '" data-index="' + i + '" data-label="' + escapeAttr(context) + '">' +
          (show.index
            ? '<td class="col-index"><span class="row-number">' + (i + 1) + "</span>" +
              '<span class="row-play">' + icon("play") + "</span></td>"
            : "") +
          '<td class="col-title">' +
            '<div class="row-title">' +
              (show.cover
                ? '<img class="row-thumb" src="' + albumCover(song.cover) + '" alt="" loading="lazy" onerror="onCoverError(this,\'' + escapeAttr(song.title) + '\')">'
                : "") +
              '<span class="row-text"><strong>' + song.title + "</strong>" +
                (show.artist ? '<small class="row-artist">' + artistName(song) + "</small>" : "") +
              "</span>" +
            "</div>" +
          "</td>" +
          (show.album ? '<td class="col-album">' + albumTitle(song) + "</td>" : "") +
          (show.plays ? '<td class="col-plays">' + formatPlays(song.plays) + "</td>" : "") +
          (show.date ? '<td class="col-date">' + dateAddedFor(song.id) + "</td>" : "") +
          (show.duration ? '<td class="col-duration">' + song.duration + "</td>" : "") +
          (show.like
            ? '<td class="col-like">' + likeButton(song.id) + "</td>"
            : "") +
        "</tr>"
      );
    })
    .join("");

  const likeHead = show.like ? '<th class="col-like"></th>' : "";
  return (
    '<div class="table-wrap"><table class="track-table">' +
      head.replace("</tr></thead>", likeHead + "</tr></thead>") +
      "<tbody>" + rows + "</tbody>" +
    "</table></div>"
  );
}

// a small label for genres, years and counts
function chip(text, tone) {
  return '<span class="chip' + (tone ? " chip--" + tone : "") + '">' + text + "</span>";
}

// the big header on playlist, album and artist pages
function detailHero(config) {
  return (
    '<header class="detail-hero" ' + gradientStyle(config.gradient || "brand", 160) + ">" +
      '<div class="detail-art">' +
        coverArt({
          src: config.cover,
          name: config.gradient || "brand",
          alt: config.title,
          shape: config.round ? "circle" : "square",
          className: config.round ? "detail-cover detail-cover--round" : "detail-cover"
        }) +
      "</div>" +
      '<div class="detail-info">' +
        '<p class="detail-kicker">' + config.kicker + "</p>" +
        '<h1 class="detail-title' + (config.longTitle ? " detail-title--long" : "") + '">' + config.title + "</h1>" +
        (config.description ? '<p class="detail-desc">' + config.description + "</p>" : "") +
        '<p class="detail-meta">' + config.meta + "</p>" +
        '<div class="detail-actions">' + config.actions + "</div>" +
      "</div>" +
    "</header>"
  );
}

// home page
function viewHome() {
  const recentIds = state.recentlyPlayed.filter(function (key) { return !!getAlbum(key); }).slice(0, 8);
  const recentCards = recentIds
    .map(function (albumId) {
      const album = getAlbum(albumId);
      const songs = songsOfAlbum(albumId).map(function (s) { return s.id; });
      return mediaCard("album", album, { subtitle: artistName(album.tracks[0]), songIds: songs, wide: true });
    })
    .join("");

  const mixCards = MIXES.map(function (mix) {
    return mediaCard("playlist", mix, { subtitle: mix.subtitle, songIds: mix.tracks });
  }).join("");

  const albumCards = ALBUMS.slice()
    .sort(function (a, b) { return b.year - a.year; })
    .map(function (album) {
      return mediaCard("album", album, {
        subtitle: artistName(album.tracks[0]) + " &middot; " + album.year,
        songIds: songsOfAlbum(album.id).map(function (s) { return s.id; })
      });
    })
    .join("");

  const trending = SONGS.slice()
    .sort(function (a, b) { return Number(String(b.plays).replace(/,/g, "")) - Number(String(a.plays).replace(/,/g, "")); })
    .slice(0, 10)
    .map(function (s) { return s.id; });

  return (
    "<section>" +
      '<div class="home-greeting">' +
        '<h1 class="greeting-title">' + greeting() + "</h1>" +
        '<p class="greeting-sub">Here is what is moving through WaveMusic right now.</p>' +
      "</div>" +

      sectionHead("Recently Played", "Jump back in where you left off",
        '<button class="link-btn" type="button" data-action="open" data-type="view" data-id="recent">Show all</button>') +
      '<div class="row-scroll row-scroll--wide">' + recentCards + "</div>" +

      sectionHead("Made For You", "Mixes built from your listening",
        '<button class="link-btn" type="button" data-action="open" data-type="view" data-id="library">Browse library</button>') +
      '<div class="row-scroll">' + mixCards + "</div>" +

      sectionHead("Popular Albums", "Fresh releases and fan favourites") +
      '<div class="grid-cards">' + albumCards + "</div>" +

      sectionHead("Trending Songs", "The ten most played tracks this week",
        '<button class="link-btn" type="button" data-action="shuffle-all">Shuffle all</button>') +
      buildTrackTable(trending, {
        context: "Trending Songs",
        show: { index: true, cover: true, title: true, artist: true, album: true, plays: true, duration: true, like: true }
      }) +
    "</section>"
  );
}

// search page
function viewSearch() {
  const query = state.searchQuery.trim();

  const largeInput =
    '<div class="search-box">' +
      icon("search") +
      '<input id="search-input" class="search-input" type="search" placeholder="Search songs, artists, albums..." ' +
        'value="' + escapeAttr(state.searchQuery) + '" autocomplete="off" aria-label="Search">' +
      (query ? '<button class="icon-btn search-clear" type="button" data-action="clear-search" title="Clear">' + icon("close") + "</button>" : "") +
    "</div>";

  if (query) {
    return "<section>" + largeInput + searchResults(query) + "</section>";
  }

  const categoryCards = CATEGORIES.map(function (cat) {
    return (
      '<button class="category-card" type="button" data-action="open-category" data-id="' + cat.id + '" ' + gradientStyle(cat.palette, 160) + ">" +
        '<span class="category-title">' + cat.title + "</span>" +
        '<span class="category-icon">' + icon(cat.icon) + "</span>" +
        '<span class="category-art">' + icon("music") + "</span>" +
      "</button>"
    );
  }).join("");

  return (
    "<section>" +
      largeInput +
      sectionHead("Browse All", "Pick a mood or a genre to start exploring") +
      '<div class="grid-categories">' + categoryCards + "</div>" +
    "</section>"
  );
}

// filter songs, artists, albums and playlists as you type
function searchResults(query) {
  const q = query.toLowerCase();

  const artists = ARTISTS.filter(function (a) { return a.name.toLowerCase().indexOf(q) !== -1; }).slice(0, 6);
  const albums = ALBUMS.filter(function (a) {
    return a.title.toLowerCase().indexOf(q) !== -1 || artistName(a.tracks[0]).toLowerCase().indexOf(q) !== -1;
  }).slice(0, 6);
  const songs = SONGS.filter(function (s) {
    return (
      s.title.toLowerCase().indexOf(q) !== -1 ||
      artistName(s).toLowerCase().indexOf(q) !== -1 ||
      albumTitle(s).toLowerCase().indexOf(q) !== -1 ||
      String(s.genre).toLowerCase().indexOf(q) !== -1
    );
  });
  const playlists = PLAYLISTS.filter(function (p) {
    return p.title.toLowerCase().indexOf(q) !== -1 || p.description.toLowerCase().indexOf(q) !== -1;
  }).slice(0, 4);

  const total = artists.length + albums.length + songs.length + playlists.length;
  if (!total) {
    return (
      '<div class="empty-state">' +
        icon("search") +
        '<h3>No results for &ldquo;' + escapeAttr(query) + "&rdquo;</h3>" +
        "<p>Try a different word, or check the spelling. You can search for songs, artists, albums, playlists or genres.</p>" +
      "</div>"
    );
  }

  let html = '<p class="result-count">' + total + " result" + (total === 1 ? "" : "s") + ' for &ldquo;' + escapeAttr(query) + "&rdquo;</p>";

  if (artists.length) {
    html += sectionHead("Artists") + '<div class="row-scroll">' +
      artists.map(function (a) { return mediaCard("artist", a, { subtitle: "Artist" }); }).join("") + "</div>";
  }
  if (albums.length) {
    html += sectionHead("Albums") + '<div class="grid-cards">' +
      albums.map(function (a) {
        return mediaCard("album", a, { subtitle: artistName(a.tracks[0]), songIds: songsOfAlbum(a.id).map(function (s) { return s.id; }) });
      }).join("") + "</div>";
  }
  if (playlists.length) {
    html += sectionHead("Playlists") + '<div class="grid-cards">' +
      playlists.map(function (p) { return mediaCard("playlist", p, { songIds: p.tracks }); }).join("") + "</div>";
  }
  if (songs.length) {
    html += sectionHead("Songs", songs.length + " matching tracks") +
      buildTrackTable(songs.map(function (s) { return s.id; }), {
        context: 'Search: "' + query + '"',
        show: { index: true, cover: true, title: true, artist: true, album: true, duration: true, like: true }
      });
  }
  return html;
}

// one genre page
function viewCategory(categoryId) {
  const cat = CATEGORY_BY_ID[categoryId];
  if (!cat) return viewSearch();

  let songs = SONGS.filter(function (s) { return s.genre === cat.genre; });
  if (cat.id === "workout") songs = songs.filter(function (s) { return durationToSeconds(s.duration) < 250; });
  if (cat.id === "chill") songs = songs.filter(function (s) { return s.genre === "Dream Pop" || s.genre === "Indie Soul" || s.genre === "Lo-Fi"; });

  const ids = songs.map(function (s) { return s.id; });
  const albums = ALBUMS.filter(function (a) { return a.genre === cat.genre; });

  return (
    "<section>" +
      '<header class="category-hero" ' + gradientStyle(cat.palette, 150) + ">" +
        '<div class="category-hero-icon">' + icon(cat.icon) + "</div>" +
        "<div>" +
          '<p class="detail-kicker">Genre</p>' +
          '<h1 class="detail-title">' + cat.title + "</h1>" +
          '<p class="detail-meta">' + ids.length + " songs in this collection</p>" +
        "</div>" +
      "</header>" +
      '<div class="detail-actions">' +
        playPill(ids, cat.title + " mix", "btn-solid") +
        shufflePill(ids, cat.title) +
        '<span class="muted-note">' + chip(cat.genre) + "</span>" +
      "</div>" +
      sectionHead(cat.title + " songs") +
      buildTrackTable(ids, {
        context: cat.title,
        emptyText: "No songs tagged with this genre yet.",
        show: { index: true, cover: true, title: true, artist: true, album: true, duration: true, like: true }
      }) +
      (albums.length
        ? sectionHead("Albums in " + cat.title) + '<div class="grid-cards">' +
          albums.map(function (a) {
            return mediaCard("album", a, { subtitle: artistName(a.tracks[0]), songIds: songsOfAlbum(a.id).map(function (s) { return s.id; }) });
          }).join("") + "</div>"
        : "") +
    "</section>"
  );
}

// library page with the three tabs
function viewLibrary() {
  const tabs = [
    { id: "playlists", label: "Playlists" },
    { id: "artists", label: "Artists" },
    { id: "albums", label: "Albums" }
  ];
  const tabsHtml = tabs.map(function (t) {
    return (
      '<button class="tab' + (state.libraryTab === t.id ? " is-active" : "") + '" type="button" ' +
        'data-action="library-tab" data-id="' + t.id + '">' + t.label + "</button>"
    );
  }).join("");

  let body = "";
  if (state.libraryTab === "playlists") {
    body = '<div class="grid-cards">' + PLAYLISTS.map(function (p) {
      return mediaCard("playlist", p, {
        subtitle: p.tracks.length + " songs &middot; " + totalDurationText(p.tracks),
        songIds: p.tracks
      });
    }).join("") + "</div>";
  } else if (state.libraryTab === "artists") {
    body = '<div class="grid-cards grid-cards--artists">' + ARTISTS.map(function (a) {
      return mediaCard("artist", a, { subtitle: a.monthly + " monthly listeners" });
    }).join("") + "</div>";
  } else {
    body = '<div class="grid-cards">' + ALBUMS.map(function (a) {
      return mediaCard("album", a, {
        subtitle: artistName(a.tracks[0]) + " &middot; " + a.year,
        songIds: songsOfAlbum(a.id).map(function (s) { return s.id; })
      });
    }).join("") + "</div>";
  }

  return (
    "<section>" +
      '<div class="page-head">' +
        '<h1 class="page-title">Your Library</h1>' +
        '<p class="page-sub">' + PLAYLISTS.length + " playlists &middot; " + ARTISTS.length + " artists &middot; " + ALBUMS.length + " albums saved</p>" +
      "</div>" +
      '<div class="tabs" role="tablist">' + tabsHtml + "</div>" +
      body +
    "</section>"
  );
}

// liked songs page
function viewLiked() {
  const ids = state.liked.slice();
  return (
    "<section>" +
      detailHero({
        kicker: "Playlist",
        title: "Liked Songs",
        gradient: "brand",
        cover: "assets/images/default-cover.svg",
        description: "Every song you have saved with the heart button.",
        meta: ids.length + " songs &middot; " + totalDurationText(ids),
        actions:
          playPill(ids, "Liked Songs", "btn-solid") +
          shufflePill(ids, "Liked Songs") +
          '<button class="btn-ghost" type="button" data-action="toast" data-message="Liked Songs are stored in your browser">' + icon("download") + "Download</button>"
      }) +
      buildTrackTable(ids, {
        context: "Liked Songs",
        emptyText: "You have not liked any songs yet. Tap the heart on any track to save it here.",
        show: { index: true, cover: true, title: true, artist: true, album: true, date: true, duration: true, like: true }
      }) +
    "</section>"
  );
}

// recently played page
function viewRecent() {
  const albumIds = state.recentlyPlayed.filter(function (key) { return !!getAlbum(key); });
  const cards = albumIds.map(function (albumId) {
    const album = getAlbum(albumId);
    return mediaCard("album", album, {
      subtitle: artistName(album.tracks[0]),
      songIds: songsOfAlbum(albumId).map(function (s) { return s.id; })
    });
  }).join("");

  const flatIds = [];
  albumIds.forEach(function (albumId) {
    songsOfAlbum(albumId).forEach(function (s) { if (flatIds.indexOf(s.id) === -1) flatIds.push(s.id); });
  });

  return (
    "<section>" +
      '<div class="page-head">' +
        '<h1 class="page-title">Recently Played</h1>' +
        '<p class="page-sub">' + albumIds.length + " albums and playlists you listened to recently</p>" +
      "</div>" +
      '<div class="grid-cards">' + cards + "</div>" +
      sectionHead("Everything you played", "Newest first") +
      buildTrackTable(flatIds.slice(0, 20), {
        context: "Recently Played",
        emptyText: "Play something and it will appear here.",
        show: { index: true, cover: true, title: true, artist: true, album: true, duration: true, like: true }
      }) +
    "</section>"
  );
}

// playlist and mix page
function viewPlaylist(playlistId) {
  const mix = getMix(playlistId);
  const pl = mix || getPlaylist(playlistId);
  if (!pl) return notFound("playlist");

  const ids = pl.tracks.slice();
  const isMix = !!mix;
  const owner = isMix ? "WaveMusic" : pl.owner;

  return (
    "<section>" +
      detailHero({
        kicker: isMix ? "Made for you" : "Playlist",
        title: pl.title,
        gradient: pl.palette || pl.slug,
        cover: playlistCover(pl.slug),
        description: pl.description,
        meta:
          '<strong>' + owner + "</strong> &middot; " + ids.length + " songs &middot; " + totalDurationText(ids),
        actions:
          playPill(ids, pl.title, "btn-solid") +
          shufflePill(ids, pl.title) +
          '<button class="btn-ghost" type="button" data-action="toast" data-message="Saved to your library (demo)">' + icon("plus") + "Save</button>" +
          '<button class="btn-ghost" type="button" data-action="toast" data-message="Share link copied (demo)">' + icon("externalLink") + "Share</button>"
      }) +
      buildTrackTable(ids, {
        context: pl.title,
        show: { index: true, cover: true, title: true, artist: true, album: true, date: true, duration: true, like: true }
      }) +
    "</section>"
  );
}

// album page
function viewAlbum(albumId) {
  const album = getAlbum(albumId);
  if (!album) return notFound("album");

  const ids = songsOfAlbum(albumId).map(function (s) { return s.id; });
  const artist = getArtist(album.artist);

  const otherAlbums = ALBUMS.filter(function (a) { return a.artist === album.artist && a.id !== album.id; });
  const moreByArtist = otherAlbums.map(function (a) {
    return mediaCard("album", a, { subtitle: artistName(a.tracks[0]), songIds: songsOfAlbum(a.id).map(function (s) { return s.id; }) });
  }).join("");

  const credits =
    '<p class="credits">Written and performed by ' + (artist ? artist.name : "Unknown") +
    ". Produced by Studio Wave. Placeholder credits for this demo project.</p>";

  return (
    "<section>" +
      detailHero({
        kicker: "Album",
        title: album.title,
        gradient: album.slug,
        cover: albumCover(album.slug),
        description: album.genre + " &middot; Released " + album.year,
        meta:
          '<button class="inline-link" type="button" data-action="open" data-type="artist" data-id="' + (artist ? artist.id : "") + '">' +
            (artist ? artist.name : "Unknown Artist") +
          "</button> &middot; " + ids.length + " songs &middot; " + totalDurationText(ids),
        actions:
          playPill(ids, album.title, "btn-solid") +
          shufflePill(ids, album.title) +
          '<button class="btn-ghost" type="button" data-action="toast" data-message="Added to your library (demo)">' + icon("plus") + "Add to library</button>" +
          '<button class="btn-ghost" type="button" data-action="toast" data-message="Share link copied (demo)">' + icon("externalLink") + "Share</button>"
      }) +
      buildTrackTable(ids, {
        context: album.title,
        show: { index: true, cover: false, title: true, artist: false, album: false, plays: true, duration: true, like: true }
      }) +
      credits +
      (otherAlbums.length
        ? sectionHead("More by " + (artist ? artist.name : "this artist")) + '<div class="grid-cards">' + moreByArtist + "</div>"
        : "") +
      sectionHead("You might also like") +
      '<div class="row-scroll">' +
        ALBUMS.filter(function (a) { return a.id !== album.id; }).slice(0, 6).map(function (a) {
          return mediaCard("album", a, { subtitle: artistName(a.tracks[0]), songIds: songsOfAlbum(a.id).map(function (s) { return s.id; }) });
        }).join("") +
      "</div>" +
    "</section>"
  );
}

// artist page
function viewArtist(artistId) {
  const artist = getArtist(artistId);
  if (!artist) return notFound("artist");

  const allSongs = songsOfArtist(artistId);
  const popular = allSongs.slice()
    .sort(function (a, b) { return Number(String(b.plays).replace(/,/g, "")) - Number(String(a.plays).replace(/,/g, "")); })
    .slice(0, 6)
    .map(function (s) { return s.id; });
  const allIds = allSongs.map(function (s) { return s.id; });

  const albums = albumsOfArtist(artistId);
  const singles = singlesOfArtist(artistId);

  const albumCards = albums.map(function (a) {
    return mediaCard("album", a, { subtitle: a.year + " &middot; Album", songIds: songsOfAlbum(a.id).map(function (s) { return s.id; }) });
  }).join("");

  const singleCards = singles.map(function (s) {
    return (
      '<article class="card" data-gradient="' + s.slug + '" ' + gradientStyle(s.slug) + ">" +
        '<div class="card-art" data-action="open" data-type="album" data-id="' + (getSong(s.song).album || s.slug) + '">' +
          coverArt({ src: albumCover(s.slug), name: s.slug, alt: s.title, className: "card-cover" }) +
          playPill([s.song], s.title, "card-play") +
        "</div>" +
        '<div class="card-body">' +
          '<button class="card-title" type="button" data-action="play-song" data-id="' + s.song + '" data-label="' + escapeAttr(s.title) + '">' + s.title + "</button>" +
          '<p class="card-sub">Single &middot; ' + s.year + "</p>" +
        "</div>" +
      "</article>"
    );
  }).join("");

  const similar = similarArtists(artistId, 6).map(function (a) {
    return mediaCard("artist", a, { subtitle: a.monthly + " monthly listeners" });
  }).join("");

  return (
    "<section class=\"artist-view\">" +
      '<header class="artist-hero">' +
        '<img class="artist-hero-img" src="' + artistHero(artist.id) + '" alt="' + escapeAttr(artist.name) + ' artwork" ' +
          "onerror=\"onCoverError(this,'" + escapeAttr(artist.name) + "')\">" +
        '<div class="artist-hero-scrim" aria-hidden="true"></div>' +
        '<div class="artist-hero-content">' +
          '<p class="detail-kicker">' + chip("Verified artist", "accent") + "</p>" +
          '<h1 class="artist-name">' + artist.name + (artist.verified ? '<span class="verified-badge" title="Verified artist">' + icon("verified") + "</span>" : "") + "</h1>" +
          '<p class="artist-listeners"><strong>' + artist.monthly + "</strong> monthly listeners</p>" +
          '<div class="detail-actions">' +
            playPill(allIds.length ? allIds : popular, artist.name, "btn-solid") +
            '<button class="btn-ghost follow-btn" type="button" data-action="follow" data-id="' + artist.id + '">Follow</button>' +
            '<button class="btn-ghost" type="button" data-action="toast" data-message="Sharing ' + escapeAttr(artist.name) + ' (demo)">' + icon("externalLink") + "Share</button>" +
          "</div>" +
        "</div>" +
      "</header>" +

      sectionHead("Popular Songs", artist.name + "'s most played tracks",
        '<button class="link-btn" type="button" data-action="play-collection" data-ids="' + allIds.join(",") + '" data-label="' + escapeAttr(artist.name) + '">Play all</button>') +
      buildTrackTable(popular, {
        context: artist.name,
        show: { index: true, cover: true, title: true, artist: false, album: true, plays: true, duration: true, like: true }
      }) +

      (albums.length ? sectionHead("Albums") + '<div class="grid-cards">' + albumCards + "</div>" : "") +
      (singles.length ? sectionHead("Singles") + '<div class="grid-cards">' + singleCards + "</div>" : "") +

      sectionHead("Fans Also Like") +
      '<div class="grid-cards grid-cards--artists">' + similar + "</div>" +

      '<section class="bio-block">' +
        sectionHead("About " + artist.name) +
        "<p>" + artist.name + " is a fictional " + artist.genre + " artist created for this WaveMusic demo. " +
        "No real recordings, artwork or trademarks are used anywhere in this project.</p>" +
      "</section>" +
    "</section>"
  );
}

// shown when a page or id does not exist
function notFound(what) {
  return (
    '<div class="empty-state">' +
      icon("music") +
      "<h3>We could not find that " + what + "</h3>" +
      "<p>It may have been removed, or the link is wrong.</p>" +
      '<button class="btn-solid" type="button" data-action="go" data-view="home">Back to home</button>' +
    "</div>"
  );
}

// every page, looked up by name
const VIEWS = {
  home: function () { return viewHome(); },
  search: function () { return viewSearch(); },
  library: function () { return viewLibrary(); },
  liked: function () { return viewLiked(); },
  recent: function () { return viewRecent(); },
  playlist: function (id) { return viewPlaylist(id); },
  album: function (id) { return viewAlbum(id); },
  artist: function (id) { return viewArtist(id); },
  category: function (id) { return viewCategory(id); }
};

// go to a page, like "home" or "playlist/chill-vibes"
function navigate(view, options) {
  const opts = options || {};
  if (!opts.skipHistory) pushHistory(view);
  state.view = view;
  renderView();
  updateNavActive();
  closeSidebarOnMobile();
  if (!opts.keepScroll) window.scrollTo({ top: 0, behavior: "smooth" });
  if (location.hash.slice(1) !== view) {
    location.hash = view;
  }
}

// remember the page in the back and forward history
function pushHistory(view) {
  state.history = state.history.slice(0, state.historyIndex + 1);
  if (state.history[state.history.length - 1] === view) return;
  state.history.push(view);
  state.historyIndex = state.history.length - 1;
  updateHistoryButtons();
}

function goBack() {
  if (state.historyIndex <= 0) return;
  state.historyIndex--;
  navigate(state.history[state.historyIndex], { skipHistory: true });
}

function goForward() {
  if (state.historyIndex >= state.history.length - 1) return;
  state.historyIndex++;
  navigate(state.history[state.historyIndex], { skipHistory: true });
}

// enable or disable the back and forward buttons
function updateHistoryButtons() {
  const back = document.getElementById("back-btn");
  const forward = document.getElementById("forward-btn");
  if (back) back.disabled = state.historyIndex <= 0;
  if (forward) forward.disabled = state.historyIndex >= state.history.length - 1;
}

// draw the current page inside #view
function renderView() {
  const parts = state.view.split("/");
  const name = parts[0];
  const param = parts.slice(1).join("/");
  const main = document.getElementById("view");
  if (!main) return;

  const renderer = VIEWS[name] || VIEWS.home;
  main.innerHTML = renderer(param);
  main.classList.remove("view-enter");
  void main.offsetWidth;
  main.classList.add("view-enter");

  document.body.classList.toggle("is-search-view", name === "search");
  applyViewAccent(name, param);
  upgradeIcons(main);
  syncPlayIcons();
  syncToggleIcons();
  syncTrackRowHighlight();

  if (name === "search") {
    const input = document.getElementById("search-input");
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }
}

// tint the top of the page with the colour of what you opened
function applyViewAccent(name, param) {
  const shell = document.getElementById("main");
  if (!shell) return;
  let key = null;
  if (name === "album") key = param;
  else if (name === "playlist") key = param;
  else if (name === "artist") key = param;
  else if (name === "category") key = (CATEGORY_BY_ID[param] || {}).palette;
  else if (name === "liked") key = "brand";
  if (key) shell.style.setProperty("--view-accent", gradientFor(key, 180));
  else shell.style.removeProperty("--view-accent");
}

// highlight the row of the song that is playing
let lastHighlightedId = null;
function syncTrackRowHighlight() {
  const currentId = state.queue[state.queueIndex] || null;
  if (currentId === lastHighlightedId) return;
  lastHighlightedId = currentId;

  document.querySelectorAll(".track-row").forEach(function (row) {
    const ids = (row.dataset.ids || "").split(",");
    const index = Number(row.dataset.index);
    const rowSongId = Number(ids[index]);
    row.classList.toggle("is-active", !!currentId && rowSongId === currentId);
  });
}

// mark the active sidebar and mobile nav links
function updateNavActive() {
  const name = state.view.split("/")[0];
  document.querySelectorAll("[data-nav]").forEach(function (el) {
    el.classList.toggle("is-active", el.dataset.nav === name);
  });
  document.querySelectorAll("[data-nav-mobile]").forEach(function (el) {
    el.classList.toggle("is-active", el.dataset.navMobile === name);
  });
  const playlistId = state.view.indexOf("playlist/") === 0 ? state.view.split("/")[1] : null;
  document.querySelectorAll("[data-playlist-nav]").forEach(function (el) {
    el.classList.toggle("is-active", el.dataset.playlistNav === playlistId);
  });
}

// fill the your playlists list in the sidebar
function renderSidebarPlaylists() {
  const list = document.getElementById("sidebar-playlists");
  if (!list) return;
  list.innerHTML = PLAYLISTS.map(function (p) {
    return (
      '<button class="side-playlist" type="button" data-playlist-nav="' + p.id + '" ' +
        'data-action="open" data-type="playlist" data-id="' + p.id + '" ' +
        'data-gradient="' + p.slug + '" ' + gradientStyle(p.slug) + ">" +
        '<img class="side-playlist-art" src="' + playlistCover(p.slug) + '" alt="" loading="lazy" onerror="onCoverError(this,\'' + escapeAttr(p.title) + '\')">' +
        '<span class="side-playlist-text"><strong>' + p.title + "</strong><small>Playlist &middot; " + p.tracks.length + " songs</small></span>" +
      "</button>"
    );
  }).join("");
}

// open and close the mobile drawer
function openSidebar() {
  document.body.classList.add("sidebar-open");
  const drawer = document.getElementById("sidebar");
  if (drawer) drawer.setAttribute("aria-hidden", "false");
}

function closeSidebar() {
  document.body.classList.remove("sidebar-open");
  const drawer = document.getElementById("sidebar");
  if (drawer) drawer.setAttribute("aria-hidden", "true");
}

function closeSidebarOnMobile() {
  if (window.innerWidth <= 900) closeSidebar();
}

// one click listener handles every button, using its data-action attribute
function handleAction(action, el, event) {
  switch (action) {
    case "open": {
      const type = el.dataset.type;
      const id = el.dataset.id;
      if (type === "view") navigate(id);
      else if (type === "album") navigate("album/" + id);
      else if (type === "playlist") navigate("playlist/" + id);
      else if (type === "artist") navigate("artist/" + id);
      break;
    }
    case "go":
      if (event && el.tagName === "A") event.preventDefault(); // stay in the app instead of reloading
      navigate(el.dataset.view || "home");
      break;
    case "back":
      goBack();
      break;
    case "forward":
      goForward();
      break;
    case "library-tab":
      state.libraryTab = el.dataset.id;
      renderView();
      break;
    case "open-category":
      navigate("category/" + el.dataset.id);
      break;
    case "toggle-sidebar":
      document.body.classList.contains("sidebar-open") ? closeSidebar() : openSidebar();
      break;
    case "close-sidebar":
      closeSidebar();
      break;

    // playback
    case "play-song":
      playSong(Number(el.dataset.id), el.dataset.label || "WaveMusic");
      break;
    case "play-collection": {
      const ids = (el.dataset.ids || "").split(",").map(Number).filter(function (n) { return !!n; });
      if (ids.length) playQueue(ids, 0, el.dataset.label || "WaveMusic");
      break;
    }
    case "shuffle-collection": {
      const ids = (el.dataset.ids || "").split(",").map(Number).filter(function (n) { return !!n; });
      if (!ids.length) break;
      if (!state.shuffle) toggleShuffle();
      playQueue(ids, 0, el.dataset.label || "WaveMusic");
      state.queueIndex = Math.floor(Math.random() * state.queue.length);
      loadCurrentTrack(true);
      break;
    }
    case "play-row": {
      const ids = (el.dataset.ids || "").split(",").map(Number).filter(function (n) { return !!n; });
      playQueue(ids, Number(el.dataset.index) || 0, el.dataset.label || "WaveMusic");
      break;
    }
    case "queue-play":
      state.queueIndex = Number(el.dataset.index);
      state.demoSeconds = 0;
      loadCurrentTrack(true);
      renderQueueIfOpen();
      break;
    case "toggle-play":
      togglePlay();
      break;
    case "next":
      playNext();
      break;
    case "prev":
      playPrevious();
      break;
    case "shuffle":
      toggleShuffle();
      break;
    case "repeat":
      cycleRepeat();
      break;
    case "shuffle-all": {
      const ids = SONGS.map(function (s) { return s.id; });
      if (!state.shuffle) toggleShuffle();
      playQueue(ids, 0, "All songs");
      break;
    }
    case "like":
      toggleLike(Number(el.dataset.id));
      break;
    case "follow": {
      el.classList.toggle("is-active");
      const following = el.classList.contains("is-active");
      el.textContent = following ? "Following" : "Follow";
      showToast(following ? "Following artist" : "Unfollowed artist", "user");
      break;
    }

    // player extras
    case "toggle-queue":
      toggleQueue();
      break;
    case "open-now-playing":
      openNowPlaying();
      break;
    case "close-now-playing":
      closeNowPlaying();
      break;
    case "toggle-mute":
      toggleMute();
      break;
    case "open-profile":
      toggleProfileMenu();
      break;
    case "profile-item":
      showToast(el.dataset.message || "Demo only", el.dataset.icon || "user");
      toggleProfileMenu(false);
      break;
    case "toast":
      showToast(el.dataset.message || "Demo only", "spark");
      break;
    case "clear-search":
      state.searchQuery = "";
      syncSearchInputs("");
      renderView();
      break;
    default:
      break;
  }
}

document.addEventListener("click", function (event) {
  const el = event.target.closest("[data-action]");
  if (!el) {
    // clicking outside closes the floating panels
    const profile = document.getElementById("profile-menu");
    if (profile && !profile.classList.contains("is-hidden") && !event.target.closest("#profile-btn")) {
      toggleProfileMenu(false);
    }
    const queuePanel = document.getElementById("queue-panel");
    if (queuePanel && queuePanel.classList.contains("is-open") &&
        !event.target.closest("#queue-panel") && !event.target.closest("#queue-btn")) {
      toggleQueue(false);
    }
    return;
  }
  // do not start the row when the heart button inside it is clicked
  if (el.dataset.action === "like") {
    event.stopPropagation();
  }
  handleAction(el.dataset.action, el, event);
});

// open and close the profile menu
function toggleProfileMenu(force) {
  const menu = document.getElementById("profile-menu");
  if (!menu) return;
  const open = force === undefined ? menu.classList.contains("is-hidden") : force;
  menu.classList.toggle("is-hidden", !open);
  menu.setAttribute("aria-hidden", open ? "false" : "true");
  const btn = document.getElementById("profile-btn");
  if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
}

// keep the two search boxes in sync
function syncSearchInputs(value) {
  const top = document.getElementById("top-search");
  if (top) top.value = value;
}

// typing in either search box lands here
function handleSearchInput(value, source) {
  state.searchQuery = value;
  const onSearchView = state.view.split("/")[0] === "search";

  if (!onSearchView) {
    navigate("search", { keepScroll: true });
    const top = document.getElementById("top-search");
    if (top) {
      top.value = value;
      top.focus();
      top.setSelectionRange(value.length, value.length);
    }
    return;
  }

  // re-draw the results for either box, then put the cursor back where it was
  syncSearchInputs(value);
  const main = document.getElementById("view");
  if (main) {
    main.innerHTML = viewSearch();
    upgradeIcons(main);
  }
  if (source !== "top") {
    const large = document.getElementById("search-input");
    if (large) {
      const at = value.length;
      large.focus();
      large.setSelectionRange(at, at);
    }
  }
}

// click and drag on the progress bar to seek
function wireProgressBar(trackId) {
  const track = document.getElementById(trackId);
  if (!track) return;
  let dragging = false;

  track.addEventListener("pointerdown", function (event) {
    dragging = true;
    track.classList.add("is-dragging");
    seekFromPointer(track, event.clientX);
    if (track.setPointerCapture) track.setPointerCapture(event.pointerId);
  });
  track.addEventListener("pointermove", function (event) {
    if (dragging) seekFromPointer(track, event.clientX);
  });
  window.addEventListener("pointerup", function () {
    if (!dragging) return;
    dragging = false;
    track.classList.remove("is-dragging");
  });
  // arrow keys nudge the playhead
  track.addEventListener("keydown", function (event) {
    if (event.key === "ArrowRight") { seekTo(currentPlayhead() + 5); event.preventDefault(); }
    if (event.key === "ArrowLeft") { seekTo(currentPlayhead() - 5); event.preventDefault(); }
  });
}

function currentPlayhead() {
  return state.demoMode ? state.demoSeconds : audio.currentTime || 0;
}

// the volume slider
function wireVolume() {
  const slider = document.getElementById("volume-slider");
  if (!slider) return;
  slider.addEventListener("input", function () {
    setVolume(Number(slider.value) / 100);
  });
}

// audio events from the browser
function wireAudioEvents() {
  audio.addEventListener("timeupdate", function () {
    if (!state.demoMode) updatePlayerProgress();
  });
  audio.addEventListener("loadedmetadata", function () {
    setDemoMode(false);
    setText("player-duration", formatTime(audio.duration));
    setText("np-duration", formatTime(audio.duration));
  });
  audio.addEventListener("ended", onTrackEnded);
  audio.addEventListener("play", function () {
    state.isPlaying = true;
    syncPlayIcons();
    const cover = document.getElementById("np-cover");
    if (cover) cover.classList.add("is-spinning");
  });
  audio.addEventListener("pause", function () {
    // a missing file makes the browser fire "pause" right after we switched
    // to demo mode. the demo timer owns isPlaying then, so ignore it.
    if (state.demoMode) return;
    state.isPlaying = false;
    syncPlayIcons();
    const cover = document.getElementById("np-cover");
    if (cover) cover.classList.remove("is-spinning");
  });
  audio.addEventListener("error", function () {
    // no audio file, so use demo mode
    if (audio.src) enterDemoPlayback();
  });
}

// keyboard shortcuts: space, escape, shift + arrows and slash
function wireKeyboard() {
  document.addEventListener("keydown", function (event) {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if (event.code === "Space" && !typing) {
      event.preventDefault();
      togglePlay();
    }
    if (event.key === "Escape") {
      closeNowPlaying();
      toggleQueue(false);
      toggleProfileMenu(false);
      closeSidebar();
    }
    if (event.key === "ArrowRight" && !typing && event.shiftKey) playNext();
    if (event.key === "ArrowLeft" && !typing && event.shiftKey) playPrevious();
    if (event.key === "/" && !typing) {
      event.preventDefault();
      const top = document.getElementById("top-search");
      if (top) top.focus();
    }
  });
}

// start the app
function init() {
  initIcons();
  upgradeIcons(); // turn every <i data-icon> in index.html into a real svg
  loadState();
  renderSidebarPlaylists();
  applyVolume();
  syncToggleIcons();
  syncPlayIcons();
  setDemoMode(true);

  setText("user-name", USER.name);
  const avatar = document.getElementById("user-avatar");
  if (avatar) avatar.src = USER.avatar;
  updateLikedCount();

  // open the page from the url hash so links can be shared
  const fromHash = decodeURIComponent(location.hash.replace(/^#/, ""));
  const startView = fromHash && VIEWS[fromHash.split("/")[0]] ? fromHash : "home";
  state.history = [startView];
  state.historyIndex = 0;
  state.view = startView;
  renderView();
  updateNavActive();
  updateHistoryButtons();

  wireAudioEvents();
  wireProgressBar("player-progress");
  wireProgressBar("np-progress");
  wireVolume();
  wireKeyboard();

  // both search boxes report their keystrokes here
  document.addEventListener("input", function (event) {
    const el = event.target;
    if (!el || !el.id) return;
    if (el.id === "top-search") handleSearchInput(el.value, "top");
    else if (el.id === "search-input") handleSearchInput(el.value, "page");
  });

  // react to the browser back and forward buttons
  window.addEventListener("hashchange", function () {
    const view = decodeURIComponent(location.hash.replace(/^#/, "")) || "home";
    if (view === state.view) return;
    const known = VIEWS[view.split("/")[0]];
    state.view = known ? view : "home";
    pushHistory(state.view);
    renderView();
    updateNavActive();
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 900) closeSidebar();
  });

  // remind the user that demo mode means no audio files yet
  window.setTimeout(function () {
    if (state.demoMode) {
      showToast("Demo mode: add mp3 files in assets/audio to hear real sound", "headphones");
    }
  }, 1600);
}

document.addEventListener("DOMContentLoaded", init);
