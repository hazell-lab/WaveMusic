// the user's own pages: library overview, liked songs, history and playlists

import { html } from "../core/dom.js";
import { plural, formatTotal, parseLength, timeAgo } from "../core/format.js";
import { getSong, getArtist } from "../data/catalogue.js";
import { mosaicArt } from "../ui/artwork.js";
import { trackList } from "../ui/track-list.js";
import { pageHead, sectionHead, emptyState, playButton, artistIndex, hero, notFound, ico } from "./parts.js";

const totalLength = (ids) => formatTotal(ids.reduce((sum, id) => sum + parseLength((getSong(id) || {}).length), 0));

function playlistRow(p) {
  const ids = p.tracks.map((t) => t.id);
  return html`<li class="collection">
    <a class="collection-link" href="#mine/${p.id}">
      ${mosaicArt(ids, { size: 300, className: "collection-art" })}
      <span class="collection-text">
        <span class="collection-title">${p.name}</span>
        <span class="collection-meta">${plural(ids.length, "song")}${ids.length ? " · " + totalLength(ids) : ""}</span>
        <span class="collection-meta">Updated ${timeAgo(p.updatedAt)}</span>
      </span>
    </a>
    ${ids.length
      ? html`<button class="tile-play collection-play" type="button" data-action="play-ids" data-ids="${ids.join(",")}"
          data-source="${p.name}" aria-label="Play ${p.name}">${ico("play")}</button>`
      : ""}
  </li>`;
}

export function renderLibrary(ctx) {
  const { lib } = ctx;
  const followed = lib.followed.map(getArtist).filter(Boolean);
  return {
    title: "Library",
    html: html`${pageHead("Library", "Everything here is saved in this browser only.")}

      <section class="section" aria-labelledby="lib-playlists">
        ${sectionHead("Your playlists", {
          id: "lib-playlists",
          kicker: plural(lib.playlists.length, "playlist"),
          action: html`<button class="btn btn-primary" type="button" data-action="new-playlist">${ico("plus")}<span>New playlist</span></button>`
        })}
        ${lib.playlists.length
          ? html`<ul class="collections">${lib.playlists.map(playlistRow)}</ul>`
          : emptyState({
              title: "No playlists yet.",
              text: "Create one here, or choose Add to playlist from any track's menu."
            })}
      </section>

      <section class="section" aria-labelledby="lib-shelf">
        ${sectionHead("Shelf", { id: "lib-shelf" })}
        <ul class="shelf">
          <li><a class="shelf-link" href="#liked">${ico("heart")}<span class="shelf-title">Liked songs</span><span class="shelf-meta">${plural(lib.liked.length, "song")}</span>${ico("chevronRight")}</a></li>
          <li><a class="shelf-link" href="#recent">${ico("history")}<span class="shelf-title">Recently played</span><span class="shelf-meta">${plural(lib.history.length, "play")}</span>${ico("chevronRight")}</a></li>
        </ul>
      </section>

      <section class="section" aria-labelledby="lib-artists">
        ${sectionHead("Artists you follow", { id: "lib-artists", kicker: plural(followed.length, "artist") })}
        ${followed.length
          ? artistIndex(followed, "Artists you follow")
          : emptyState({ title: "You are not following anyone yet.", text: "Open an artist and press Follow to keep them here." })}
      </section>`
  };
}

export function renderLiked(ctx) {
  const ids = ctx.lib.liked.map((x) => x.id);
  const at = new Map(ctx.lib.liked.map((x) => [x.id, x.at]));
  return {
    title: "Liked songs",
    html: html`${pageHead("Liked songs", ids.length ? plural(ids.length, "song") + " · " + totalLength(ids) : "")}
      ${ids.length
        ? html`<div class="page-actions">${playButton(ids, "Liked songs")}${playButton(ids, "Liked songs", { label: "Shuffle", shuffle: true, primary: false })}</div>
            ${trackList({ id: "liked", ids, source: "Liked songs", ctx: ctx.track, note: (id) => "Liked " + timeAgo(at.get(id)) })}`
        : emptyState({
            title: "No liked songs yet.",
            text: "Press the heart next to any track and it will be saved here.",
            action: html`<a class="btn btn-primary" href="#search">${ico("search")}<span>Find something to like</span></a>`
          })}`
  };
}

export function renderRecent(ctx) {
  const history = ctx.lib.history;
  const ids = history.map((h) => h.id);
  return {
    title: "Recently played",
    html: html`${pageHead("Recently played", history.length ? "Newest first. A play is counted once a preview starts." : "")}
      ${history.length
        ? html`<div class="page-actions">${playButton(ids, "Recently played", { label: "Play in this order" })}
            <button class="btn" type="button" data-action="clear-history">${ico("trash")}<span>Clear history</span></button></div>
            ${trackList({ id: "recent", ids, source: "Recently played", ctx: ctx.track, note: (_, i) => timeAgo(history[i].at) })}`
        : emptyState({
            title: "Nothing played yet.",
            text: "Songs you play will be listed here, newest first.",
            action: html`<a class="btn btn-primary" href="#home">${ico("disc")}<span>Go to Listen</span></a>`
          })}`
  };
}

export function renderMine(ctx, playlistId) {
  const playlist = ctx.lib.playlists.find((p) => p.id === playlistId);
  if (!playlist) return notFound("playlist");
  const ids = playlist.tracks.map((t) => t.id);
  return {
    title: playlist.name,
    html: html`${hero({
        art: mosaicArt(ids, { size: 600 }),
        kicker: "Your playlist",
        title: playlist.name,
        meta: plural(ids.length, "song") + (ids.length ? " · " + totalLength(ids) : "") + " · Updated " + timeAgo(playlist.updatedAt),
        actions: html`${playButton(ids, playlist.name)}
          ${playButton(ids, playlist.name, { label: "Shuffle", shuffle: true, primary: false })}
          <button class="btn" type="button" data-action="rename-playlist" data-id="${playlist.id}">${ico("edit")}<span>Rename</span></button>
          <button class="btn" type="button" data-action="delete-playlist" data-id="${playlist.id}">${ico("trash")}<span>Delete</span></button>`
      })}
      ${ids.length
        ? trackList({
            id: "mine",
            ids,
            source: playlist.name,
            playlistId: playlist.id,
            ctx: ctx.track,
            note: (_, i) => "Added " + timeAgo(playlist.tracks[i].at)
          })
        : emptyState({
            title: "This playlist is empty.",
            text: "Find songs in Browse, then choose Add to playlist from a track's menu.",
            action: html`<a class="btn btn-primary" href="#search">${ico("search")}<span>Browse the catalogue</span></a>`
          })}`
  };
}
