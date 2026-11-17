// building blocks shared by the views

import { html, raw } from "../core/dom.js";
import { icon } from "../ui/icons.js";
import { coverArt, collectionArt, artistArt } from "../ui/artwork.js";
import { getArtist, songsOfAlbum, getSingle, getSong, artistName } from "../data/catalogue.js";

export const ico = (name) => raw(icon(name));

export function sectionHead(title, { kicker = "", action = "", id = "" } = {}) {
  return html`<div class="section-head">
    <div>
      ${kicker ? html`<p class="kicker">${kicker}</p>` : ""}
      <h2 class="section-title"${id ? html` id="${id}"` : ""}>${title}</h2>
    </div>
    ${action}
  </div>`;
}

// a play button that plays a list of song ids
export function playButton(ids, source, { label = "Play", shuffle = false, primary = true, className = "" } = {}) {
  if (!ids.length) return "";
  return html`<button class="btn ${primary ? "btn-primary" : ""} ${className}" type="button" data-action="play-ids"
    data-ids="${ids.join(",")}" data-source="${source}"${shuffle ? raw(' data-shuffle="true"') : ""}>
    ${ico(shuffle ? "shuffle" : "play")}<span>${label}</span></button>`;
}

export function button(label, action, iconName, attrs = "") {
  return html`<button class="btn" type="button" data-action="${action}"${raw(attrs)}>${iconName ? ico(iconName) : ""}<span>${label}</span></button>`;
}

function tile({ href, art, title, sub, ids, source, round = false }) {
  return html`<article class="tile${round ? " tile-round" : ""}">
    <a class="tile-link" href="${href}">
      ${art}
      <span class="tile-title">${title}</span>
      <span class="tile-sub">${sub}</span>
    </a>
    ${ids && ids.length
      ? html`<button class="tile-play" type="button" data-action="play-ids" data-ids="${ids.join(",")}" data-source="${source}"
          aria-label="Play ${title}">${ico("play")}</button>`
      : ""}
  </article>`;
}

export function albumTile(album, sub) {
  const ids = songsOfAlbum(album.id).map((s) => s.id);
  return tile({
    href: "#album/" + album.id,
    art: coverArt(album.id, { size: 300 }),
    title: album.title,
    sub: sub || (getArtist(album.artist) || {}).name + " · " + album.year,
    ids,
    source: album.title
  });
}

export function singleTile(single, sub) {
  return tile({
    href: "#album/" + single.id,
    art: coverArt(single.id, { size: 300 }),
    title: single.title,
    sub: sub || (getArtist(single.artist) || {}).name + " · Single",
    ids: [single.song],
    source: single.title
  });
}

export function collectionTile(collection) {
  return tile({
    href: "#playlist/" + collection.id,
    art: collectionArt(collection.id, { size: 300 }),
    title: collection.title,
    sub: collection.tracks.length + " songs",
    ids: collection.tracks,
    source: collection.title
  });
}

export function artistTile(artist) {
  return tile({
    href: "#artist/" + artist.id,
    art: artistArt(artist.id, { size: 300 }),
    title: artist.name,
    sub: artist.genre,
    round: true
  });
}

// a typographic index of artist names
export function artistIndex(artists, label = "Artists") {
  return html`<ul class="artist-index" aria-label="${label}">${artists.map(
    (a) => html`<li><a href="#artist/${a.id}">${a.name}</a><span class="artist-index-genre">${a.genre}</span></li>`
  )}</ul>`;
}

export function emptyState({ title, text, action = "" }) {
  return html`<div class="empty">
    <p class="empty-title">${title}</p>
    <p class="empty-text">${text}</p>
    ${action}
  </div>`;
}

// the big header on detail pages
export function hero({ art, kicker, title, byline = "", meta = "", description = "", actions = "", tint = "", round = false }) {
  return html`<header class="hero${round ? " hero-round" : ""}"${tint ? html` style="--hero-tint:${tint}"` : ""}>
    <div class="hero-art">${art}</div>
    <div class="hero-text">
      <p class="kicker">${kicker}</p>
      <h1 class="hero-title" tabindex="-1" data-focus-target>${title}</h1>
      ${byline ? html`<p class="hero-byline">${byline}</p>` : ""}
      ${description ? html`<p class="hero-desc">${description}</p>` : ""}
      ${meta ? html`<p class="hero-meta">${meta}</p>` : ""}
      <div class="hero-actions">${actions}</div>
    </div>
  </header>`;
}

export function pageHead(title, sub = "") {
  return html`<header class="page-head">
    <h1 class="page-title" tabindex="-1" data-focus-target>${title}</h1>
    ${sub ? html`<p class="page-sub">${sub}</p>` : ""}
  </header>`;
}

export function notFound(what) {
  return {
    title: "Not found",
    html: html`${pageHead("Nothing here")}
      ${emptyState({
        title: "We could not find that " + what + ".",
        text: "The link may be wrong, or it was removed from your library.",
        action: html`<a class="btn btn-primary" href="#home">${ico("disc")}<span>Back to Listen</span></a>`
      })}`
  };
}

export function songLabel(id) {
  const song = getSong(id);
  return song ? song.title + " by " + artistName(song) : "";
}

export { getSingle };
