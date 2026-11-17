// the listen page: a feature spread, the chart, albums, collections and artists

import { html } from "../core/dom.js";
import { CHART, ALBUMS, SINGLES, COLLECTIONS, ARTISTS, getSong, getArtist, albumTitle, paletteFor } from "../data/catalogue.js";
import { coverArt } from "../ui/artwork.js";
import { collectionArt } from "../ui/artwork.js";
import { trackList } from "../ui/track-list.js";
import { sectionHead, playButton, albumTile, singleTile, collectionTile, artistIndex, ico } from "./parts.js";

function dateline(now = new Date()) {
  return now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function feature(ctx) {
  const song = getSong(CHART[0]);
  const artist = getArtist(song.artist);
  const href = song.album ? "#album/" + song.album : "#album/" + song.cover;
  return html`<section class="feature" style="--hero-tint:${paletteFor(song.cover)[0]}" aria-labelledby="feature-title">
    <a class="feature-art" href="${href}" tabindex="-1" aria-hidden="true">${coverArt(song.cover, { size: 600, eager: true })}</a>
    <div class="feature-text">
      <p class="kicker"><span class="kicker-rule"></span>No. 01 on the WaveMusic chart</p>
      <h2 class="feature-title" id="feature-title"><a href="${href}">${song.title}</a></h2>
      <p class="feature-byline">by <a href="#artist/${artist.id}">${artist.name}</a>, from ${albumTitle(song) === "Single" ? "the single" : albumTitle(song)} (${String(song.year)})</p>
      <div class="hero-actions">
        ${playButton(CHART, "The Chart", { label: "Play the chart" })}
        <button class="btn" type="button" data-action="queue-ids" data-ids="${song.id}">${ico("queueNext")}<span>Play next</span></button>
      </div>
    </div>
  </section>`;
}

function recent(ctx) {
  const seen = new Set();
  const ids = ctx.lib.history.map((h) => h.id).filter((id) => !seen.has(id) && seen.add(id)).slice(0, 5);
  if (!ids.length) return "";
  return html`<section class="section" aria-labelledby="home-recent">
    ${sectionHead("Pick up where you left off", {
      id: "home-recent",
      kicker: "Your history",
      action: html`<a class="text-btn" href="#recent">All history</a>`
    })}
    ${trackList({ id: "home-recent", ids, source: "Recently played", ctx: ctx.track })}
  </section>`;
}

function collectionRow(c) {
  return html`<li class="collection">
    <a class="collection-link" href="#playlist/${c.id}">
      ${collectionArt(c.id, { size: 300, className: "collection-art" })}
      <span class="collection-text">
        <span class="collection-title">${c.title}</span>
        <span class="collection-desc">${c.description}</span>
        <span class="collection-meta">${String(c.tracks.length)} songs</span>
      </span>
    </a>
    <button class="tile-play collection-play" type="button" data-action="play-ids" data-ids="${c.tracks.join(",")}"
      data-source="${c.title}" aria-label="Play ${c.title}">${ico("play")}</button>
  </li>`;
}

export function render(ctx) {
  const albums = ALBUMS.slice().sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
  const collections = COLLECTIONS.filter((c) => c.kind === "collection");
  const mixes = COLLECTIONS.filter((c) => c.kind === "mix");

  return {
    title: "Listen",
    html: html`<header class="page-head page-head-listen">
        <h1 class="page-title" tabindex="-1" data-focus-target>Listen</h1>
        <p class="dateline">${dateline()}</p>
      </header>

      ${feature(ctx)}
      ${recent(ctx)}

      <section class="section" aria-labelledby="home-chart">
        ${sectionHead("The Chart", {
          id: "home-chart",
          kicker: "Twenty songs, ranked",
          action: playButton(CHART, "The Chart", { label: "Play all", primary: false })
        })}
        ${trackList({ id: "chart", ids: CHART, source: "The Chart", variant: "chart", ctx: ctx.track })}
      </section>

      <section class="section" aria-labelledby="home-albums">
        ${sectionHead("Albums", { id: "home-albums", kicker: "Newest first" })}
        <div class="wall">${albums.map((a) => albumTile(a))}</div>
      </section>

      <section class="section" aria-labelledby="home-singles">
        ${sectionHead("Singles", { id: "home-singles", kicker: "2024 releases" })}
        <div class="wall wall-small">${SINGLES.map((s) => singleTile(s))}</div>
      </section>

      <section class="section" aria-labelledby="home-collections">
        ${sectionHead("Collections", { id: "home-collections", kicker: "Curated by WaveMusic" })}
        <ul class="collections">${collections.map(collectionRow)}</ul>
      </section>

      <section class="section" aria-labelledby="home-mixes">
        ${sectionHead("Mixes", { id: "home-mixes", kicker: "Themed blends" })}
        <div class="wall wall-small">${mixes.map(collectionTile)}</div>
      </section>

      <section class="section" aria-labelledby="home-artists">
        ${sectionHead("Artists", { id: "home-artists", kicker: ARTISTS.length + " in the catalogue" })}
        ${artistIndex(ARTISTS.slice().sort((a, b) => a.name.localeCompare(b.name)))}
      </section>`
  };
}
