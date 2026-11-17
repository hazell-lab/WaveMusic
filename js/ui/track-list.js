// the track list used by every page. each rendered list is registered so a
// click can play the whole list from the chosen position.

import { html, raw } from "../core/dom.js";
import { pad2 } from "../core/format.js";
import { getSong, artistName, albumTitle } from "../data/catalogue.js";
import { songArt } from "./artwork.js";
import { icon } from "./icons.js";

const lists = new Map();

export const resetLists = () => lists.clear();
export const getList = (id) => lists.get(id) || null;

// options:
//   id         unique list id on the page
//   ids        song ids in order
//   source     label shown as "playing from"
//   variant    "default" | "chart" | "album"
//   playlistId set for a user playlist so rows can be removed or moved
//   note(id, i) optional small text per row, e.g. "added 2 days ago"
//   ctx        { isLiked, currentId, status, isUnavailable }
export function trackList({ id, ids, source, variant = "default", playlistId = null, note = null, ctx, label }) {
  lists.set(id, { ids: ids.slice(), source, playlistId });
  const rows = ids.map((songId, pos) => trackRow({ listId: id, songId, pos, variant, note, ctx })).join("");
  return html`<ol class="tracks tracks-${variant}" data-list="${id}" aria-label="${label || source}">${raw(rows)}</ol>`;
}

function trackRow({ listId, songId, pos, variant, note, ctx }) {
  const song = getSong(songId);
  if (!song) return "";
  const isCurrent = ctx.currentId === song.id;
  const playing = isCurrent && (ctx.status === "playing" || ctx.status === "loading");
  const unavailable = ctx.isUnavailable(song.id);
  const liked = ctx.isLiked(song.id);
  const artist = artistName(song);
  const number = variant === "chart" ? pad2(pos + 1) : String(pos + 1);
  const albumHref = song.album ? "#album/" + song.album : "#artist/" + song.artist;
  const extra = note ? note(song.id, pos) : "";

  return String(html`<li class="track${isCurrent ? " is-current" : ""}${playing ? " is-playing" : ""}${unavailable ? " is-unavailable" : ""}"
    data-track-id="${song.id}" data-pos="${pos}"${isCurrent ? raw(' aria-current="true"') : ""}>
    <button class="track-main" type="button" data-action="play-list" data-list="${listId}" data-pos="${pos}">
      <span class="track-num" aria-hidden="true"><span class="track-index">${number}</span><span class="eq"><i></i><i></i><i></i></span></span>
      ${variant === "album" ? "" : songArt(song.id, { size: 120, className: "track-art" })}
      <span class="track-text">
        <span class="track-title">${song.title}</span>
        <span class="track-artist">${artist}${
          unavailable ? html`<span class="tag">No preview</span>` : ""
        }</span>
      </span>
      <span class="sr-only track-state">${isCurrent ? (playing ? ", now playing" : ", paused") : ""}${unavailable ? ", preview unavailable" : ""}</span>
    </button>
    ${variant === "album" ? "" : html`<a class="track-album" href="${albumHref}">${song.album ? albumTitle(song) : "Single"}</a>`}
    ${extra ? html`<span class="track-note">${extra}</span>` : ""}
    <span class="track-time" title="Full song length">${song.length}</span>
    <button class="icon-btn like-btn${liked ? " is-on" : ""}" type="button" data-action="like" data-id="${song.id}"
      aria-pressed="${liked ? "true" : "false"}" aria-label="Like ${song.title}">${raw(icon("heart"))}</button>
    <button class="icon-btn track-more" type="button" data-action="track-menu" data-list="${listId}" data-pos="${pos}"
      aria-haspopup="menu" aria-label="More options for ${song.title}">${raw(icon("more"))}</button>
  </li>`);
}

// update the current and playing markers without re-rendering lists
export function syncTrackStates(root, { currentId, status }) {
  const active = status === "playing" || status === "loading";
  root.querySelectorAll(".track[data-track-id]").forEach((row) => {
    const isCurrent = Number(row.dataset.trackId) === currentId;
    row.classList.toggle("is-current", isCurrent);
    row.classList.toggle("is-playing", isCurrent && active);
    if (isCurrent) row.setAttribute("aria-current", "true");
    else row.removeAttribute("aria-current");
    const state = row.querySelector(".track-state");
    if (state) {
      const unavailable = row.classList.contains("is-unavailable");
      const text = (isCurrent ? (active ? ", now playing" : ", paused") : "") + (unavailable ? ", preview unavailable" : "");
      if (state.textContent !== text) state.textContent = text;
    }
  });
}

export function syncUnavailable(root, isUnavailable) {
  root.querySelectorAll(".track[data-track-id]").forEach((row) => {
    const off = isUnavailable(Number(row.dataset.trackId));
    if (off === row.classList.contains("is-unavailable")) return;
    row.classList.toggle("is-unavailable", off);
    const artist = row.querySelector(".track-artist");
    const tag = artist && artist.querySelector(".tag");
    if (off && artist && !tag) artist.insertAdjacentHTML("beforeend", '<span class="tag">No preview</span>');
    if (!off && tag) tag.remove();
  });
}

export function syncLikeButtons(root, isLiked) {
  root.querySelectorAll('[data-action="like"][data-id]').forEach((btn) => {
    const on = isLiked(Number(btn.dataset.id));
    btn.classList.toggle("is-on", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
}
