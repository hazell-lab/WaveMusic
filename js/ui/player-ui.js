// renders the player deck, the mini player and the up next list from the
// player store. playback progress is drawn with requestAnimationFrame
// straight into the dom, so it never re-renders anything else.

import { $, html, raw, setText, prefersReducedMotion } from "../core/dom.js";
import { formatTime, plural } from "../core/format.js";
import { getSong, artistName, albumTitle, getArtist, paletteFor } from "../data/catalogue.js";
import { artworkFor } from "../data/apple.js";
import { DEFAULT_COVER, songArt } from "./artwork.js";
import { icon } from "./icons.js";
import { upNext } from "../player/queue.js";

const SHEET_QUERY = "(max-width: 1099px)";

const STATUS_TEXT = {
  idle: "Idle",
  loading: "Loading",
  playing: "Playing",
  paused: "Paused",
  ended: "Finished",
  error: "Unavailable"
};

export function createPlayerUI({ player, library, isUnavailable }) {
  const el = {
    deck: $("#deck"),
    shell: $("#shell"),
    status: $("#deck-status .deck-status-text"),
    art: $("#deck-art"),
    artFrame: $("#deck-art-frame"),
    title: $("#deck-title"),
    sub: $("#deck-sub"),
    tools: $("#deck-tools"),
    like: $("#deck-like"),
    error: $("#deck-error"),
    seek: $("#seek-range"),
    current: $("#time-current"),
    total: $("#time-total"),
    shuffle: $("#shuffle-btn"),
    repeat: $("#repeat-btn"),
    mute: $("#mute-btn"),
    volume: $("#volume-range"),
    volumeValue: $("#volume-value"),
    queue: $("#queue-list"),
    queueEmpty: $("#queue-empty"),
    queueCount: $("#up-next-count"),
    queueSource: $("#up-next-source"),
    clearQueue: $("#clear-queue"),
    mini: $("#mini"),
    miniOpen: $("#mini-open"),
    miniArt: $("#mini-art"),
    miniTitle: $("#mini-title"),
    miniArtist: $("#mini-artist"),
    miniTime: $("#mini-time"),
    miniProgress: $("#mini-progress"),
    playButtons: Array.from(document.querySelectorAll("[data-play-button]"))
  };

  const sheetMedia = window.matchMedia(SHEET_QUERY);
  let seeking = false;
  let frame = 0;
  let lastSecond = -1;
  let lastRatio = -1;

  // track info

  function renderTrack(state) {
    const song = getSong(state.current);
    const has = !!song;
    el.tools.hidden = !has;
    el.seek.disabled = !has;
    if (!song) {
      setText(el.title, "Nothing playing");
      el.sub.textContent = "Pick a track, or start the chart.";
      setArt(el.art, DEFAULT_COVER, "");
      setArt(el.miniArt, DEFAULT_COVER, "");
      setText(el.miniTitle, "Nothing playing");
      setText(el.miniArtist, "Tap play to start the chart");
      el.miniOpen.setAttribute("aria-label", "Open player");
      el.deck.style.removeProperty("--tint");
      return;
    }
    const artist = getArtist(song.artist);
    setText(el.title, song.title);
    el.sub.innerHTML = String(
      html`<a href="#artist/${song.artist}" data-action="close-deck-link">${artist ? artist.name : "Unknown artist"}</a>
        <span aria-hidden="true">·</span>
        ${song.album
          ? html`<a href="#album/${song.album}" data-action="close-deck-link">${albumTitle(song)}</a>`
          : html`<span>Single, ${String(song.year)}</span>`}`
    );
    setArt(el.art, artworkFor(song.cover, 600) || DEFAULT_COVER, "Cover of " + albumTitle(song) + " by " + artistName(song));
    setArt(el.miniArt, artworkFor(song.cover, 120) || DEFAULT_COVER, "");
    setText(el.miniTitle, song.title);
    setText(el.miniArtist, artistName(song));
    el.miniOpen.setAttribute("aria-label", "Open player: " + song.title + " by " + artistName(song));
    el.deck.style.setProperty("--tint", paletteFor(song.cover)[0]);
    el.like.dataset.id = String(song.id);
    syncLike();
  }

  function setArt(img, src, alt) {
    if (img.getAttribute("src") === src) {
      img.alt = alt;
      return;
    }
    // a short crossfade between covers, skipped for reduced motion
    if (img === el.art && !prefersReducedMotion() && img.classList.contains("is-loaded")) {
      img.classList.remove("is-loaded");
    }
    img.alt = alt;
    img.src = src;
  }

  function syncLike() {
    const id = Number(el.like.dataset.id);
    const on = !!id && library.isLiked(id);
    el.like.classList.toggle("is-on", on);
    el.like.setAttribute("aria-pressed", on ? "true" : "false");
    const song = getSong(id);
    el.like.setAttribute("aria-label", song ? "Like " + song.title : "Like");
  }

  // status, buttons and errors

  function renderStatus(state) {
    const status = state.status;
    el.deck.dataset.status = status;
    el.mini.dataset.status = status;
    setText(el.status, STATUS_TEXT[status] || status);
    const playing = status === "playing" || status === "loading";
    el.playButtons.forEach((btn) => {
      btn.setAttribute("aria-label", playing ? "Pause" : "Play");
      btn.classList.toggle("is-playing", playing);
      btn.classList.toggle("is-loading", status === "loading");
    });
    el.error.hidden = status !== "error";
    if (status === "error") {
      el.error.innerHTML = String(html`${raw(icon("alert"))}<span>${state.error || "This preview is not available."}</span>`);
    }
    if (status !== "playing") drawProgress(true);
    loop();
  }

  function renderModes(state) {
    el.shuffle.setAttribute("aria-pressed", state.shuffle ? "true" : "false");
    const repeatLabel = { off: "Repeat: off", all: "Repeat: all", one: "Repeat: one track" }[state.repeat];
    el.repeat.setAttribute("aria-pressed", state.repeat === "off" ? "false" : "true");
    el.repeat.setAttribute("aria-label", repeatLabel);
    el.repeat.title = repeatLabel + " (R)";
    el.repeat.dataset.mode = state.repeat;
  }

  function renderVolume(state) {
    const muted = state.muted || state.volume === 0;
    const pct = Math.round(state.volume * 100);
    const shown = muted ? 0 : pct;
    if (document.activeElement !== el.volume) el.volume.value = String(shown);
    el.volume.style.setProperty("--fill", shown + "%");
    el.volume.setAttribute("aria-valuetext", muted ? "Muted" : pct + "%");
    el.volumeValue.textContent = muted ? "Mute" : String(pct);
    el.mute.setAttribute("aria-pressed", muted ? "true" : "false");
    el.mute.setAttribute("aria-label", muted ? "Unmute" : "Mute");
    const name = muted ? "volumeMute" : state.volume < 0.5 ? "volumeLow" : "volume";
    el.mute.innerHTML = icon(name);
  }

  // up next

  function renderQueue(state) {
    const upcoming = upNext(state.queue);
    const startAt = state.queue.index + 1;
    el.queueEmpty.hidden = upcoming.length > 0;
    el.clearQueue.hidden = upcoming.length === 0;
    setText(el.queueCount, upcoming.length ? plural(upcoming.length, "track") : "");
    setText(el.queueSource, state.source && state.current ? "Playing from " + state.source : "");
    el.queue.innerHTML = upcoming
      .map((entry, i) => {
        const song = getSong(entry.id);
        if (!song) return "";
        const position = startAt + i;
        const unavailable = isUnavailable(song.id);
        return String(html`<li class="queue-item${unavailable ? " is-unavailable" : ""}" data-key="${entry.key}">
          <button class="queue-main" type="button" data-action="queue-jump" data-key="${entry.key}"
            aria-label="Play ${song.title} by ${artistName(song)} now${unavailable ? ", preview unavailable" : ""}">
            ${songArt(song.id, { size: 120, className: "queue-art" })}
            <span class="queue-text"><span class="queue-title">${song.title}</span><span class="queue-artist">${artistName(song)}</span></span>
          </button>
          <span class="queue-tools">
            <button class="icon-btn" type="button" data-action="queue-move" data-key="${entry.key}" data-to="${position - 1}"
              aria-label="Move ${song.title} up"${i === 0 ? raw(" disabled") : ""}>${raw(icon("arrowUp"))}</button>
            <button class="icon-btn" type="button" data-action="queue-move" data-key="${entry.key}" data-to="${position + 1}"
              aria-label="Move ${song.title} down"${i === upcoming.length - 1 ? raw(" disabled") : ""}>${raw(icon("arrowDown"))}</button>
            <button class="icon-btn" type="button" data-action="queue-remove" data-key="${entry.key}"
              aria-label="Remove ${song.title} from the queue">${raw(icon("close"))}</button>
          </span>
        </li>`);
      })
      .join("");
  }

  // progress

  function drawProgress(force = false) {
    const duration = player.duration;
    const time = player.currentTime;
    const ratio = duration > 0 ? Math.min(1, time / duration) : 0;
    const second = Math.floor(time);
    if (!seeking && (force || Math.abs(ratio - lastRatio) > 0.0005)) {
      lastRatio = ratio;
      el.seek.value = String(Math.round(ratio * 1000));
      el.seek.style.setProperty("--fill", ratio * 100 + "%");
      el.miniProgress.style.transform = "scaleX(" + ratio + ")";
    }
    if (force || second !== lastSecond) {
      lastSecond = second;
      if (!seeking) setText(el.current, formatTime(time));
      setText(el.total, duration ? formatTime(duration) : "0:00");
      setText(el.miniTime, duration ? formatTime(time) + " / " + formatTime(duration) : "");
      el.seek.setAttribute("aria-valuetext", formatTime(time) + " of " + formatTime(duration));
    }
  }

  // runs only while playing and while the page is visible
  function loop() {
    cancelAnimationFrame(frame);
    frame = 0;
    if (player.store.get().status !== "playing" || document.hidden) return;
    const tick = () => {
      drawProgress();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  }

  // inputs

  el.seek.addEventListener("input", () => {
    seeking = true;
    const ratio = Number(el.seek.value) / 1000;
    el.seek.style.setProperty("--fill", ratio * 100 + "%");
    setText(el.current, formatTime(ratio * player.duration));
  });
  el.seek.addEventListener("change", () => {
    const ratio = Number(el.seek.value) / 1000;
    player.seek(ratio * player.duration);
    seeking = false;
    drawProgress(true);
  });
  el.seek.addEventListener("blur", () => {
    seeking = false;
  });

  el.volume.addEventListener("input", () => player.setVolume(Number(el.volume.value) / 100));

  // the sheet on small screens

  function isSheet() {
    return sheetMedia.matches;
  }

  function openSheet() {
    if (!isSheet()) {
      el.deck.querySelector("[data-play-button]").focus();
      return;
    }
    el.deck.classList.add("is-open");
    el.deck.inert = false;
    el.deck.setAttribute("role", "dialog");
    el.deck.setAttribute("aria-modal", "true");
    setInert(true);
    document.body.classList.add("sheet-open");
    requestAnimationFrame(() => el.deck.querySelector(".deck-close").focus());
  }

  function closeSheet({ restoreFocus = true } = {}) {
    if (!el.deck.classList.contains("is-open")) return false;
    el.deck.classList.remove("is-open");
    el.deck.removeAttribute("role");
    el.deck.removeAttribute("aria-modal");
    setInert(false);
    syncDeckVisibility();
    document.body.classList.remove("sheet-open");
    if (restoreFocus) el.miniOpen.focus();
    return true;
  }

  function setInert(on) {
    [el.shell, el.mini, document.querySelector(".tabbar")].forEach((node) => {
      if (node) node.inert = on;
    });
  }

  // on wide screens the deck is a normal column, so drop sheet state
  sheetMedia.addEventListener("change", () => {
    if (!isSheet()) closeSheet({ restoreFocus: false });
    syncDeckVisibility();
  });

  // the closed sheet must not be reachable by keyboard
  function syncDeckVisibility() {
    el.deck.inert = isSheet() && !el.deck.classList.contains("is-open");
  }
  syncDeckVisibility();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) player.savePosition();
    else drawProgress(true);
    loop();
  });

  // store subscription

  function render(state, prev) {
    if (!prev || state.current !== prev.current) renderTrack(state);
    if (!prev || state.status !== prev.status || state.error !== prev.error) renderStatus(state);
    if (!prev || state.shuffle !== prev.shuffle || state.repeat !== prev.repeat) renderModes(state);
    if (!prev || state.volume !== prev.volume || state.muted !== prev.muted) renderVolume(state);
    if (!prev || state.queue !== prev.queue || state.source !== prev.source || state.current !== prev.current) renderQueue(state);
    if (!prev || state.duration !== prev.duration || state.current !== prev.current) drawProgress(true);
  }

  player.store.subscribe(render);
  render(player.store.get(), null);

  return {
    openSheet,
    closeSheet,
    isSheet,
    syncLike,
    refresh() {
      const state = player.store.get();
      renderTrack(state);
      renderQueue(state);
    }
  };
}
