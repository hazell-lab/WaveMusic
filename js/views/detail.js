// album, single, artist and curated collection pages

import { html } from "../core/dom.js";
import { plural, formatTotal, parseLength } from "../core/format.js";
import * as C from "../data/catalogue.js";
import { coverArt, collectionArt, artistArt } from "../ui/artwork.js";
import { trackList } from "../ui/track-list.js";
import { hero, sectionHead, playButton, albumTile, singleTile, artistIndex, notFound, ico } from "./parts.js";

const totalLength = (songs) => formatTotal(songs.reduce((sum, s) => sum + parseLength(s.length), 0));

function genreLink(genreName) {
  const g = C.genreByName(genreName);
  return g ? html`<a href="#category/${g.id}">${g.title}</a>` : genreName;
}

const shareButton = html`<button class="btn" type="button" data-action="share">${ico("share")}<span>Share</span></button>`;

function addAllButton(ids) {
  return html`<button class="btn" type="button" data-action="add-ids-to-playlist" data-ids="${ids.join(",")}">${ico("listPlus")}<span>Add to playlist</span></button>`;
}

function moreFromArtist(artistId, excludeId) {
  const albums = C.albumsOfArtist(artistId).filter((a) => a.id !== excludeId);
  const singles = C.singlesOfArtist(artistId).filter((s) => s.id !== excludeId);
  if (!albums.length && !singles.length) return "";
  const artist = C.getArtist(artistId);
  return html`<section class="section" aria-labelledby="more-by">
    ${sectionHead("More by " + artist.name, { id: "more-by" })}
    <div class="wall wall-small">${albums.map((a) => albumTile(a, String(a.year)))}${singles.map((s) => singleTile(s, "Single · " + s.year))}</div>
  </section>`;
}

function sameGenre(genre, excludeId) {
  const albums = C.ALBUMS.filter((a) => a.genre === genre && a.id !== excludeId).slice(0, 6);
  if (!albums.length) return "";
  return html`<section class="section" aria-labelledby="same-genre">
    ${sectionHead("More " + genre, { id: "same-genre" })}
    <div class="wall wall-small">${albums.map((a) => albumTile(a))}</div>
  </section>`;
}

// albums and singles share this page
export function renderAlbum(ctx, id) {
  const album = C.getAlbum(id);
  const single = album ? null : C.getSingle(id);
  if (!album && !single) return notFound("album");

  const songs = album ? C.songsOfAlbum(id) : [C.getSong(single.song)];
  const ids = songs.map((s) => s.id);
  const item = album || single;
  const artist = C.getArtist(item.artist);
  const genre = album ? album.genre : songs[0].genre;

  return {
    title: item.title + " by " + artist.name,
    html: html`${hero({
        art: coverArt(id, { size: 600, eager: true, alt: "Cover of " + item.title }),
        kicker: html`${album ? "Album" : "Single"} · ${String(item.year)} · ${genreLink(genre)}`,
        title: item.title,
        byline: html`<a href="#artist/${artist.id}">${artist.name}</a>`,
        meta: plural(songs.length, "song") + " · " + totalLength(songs) + " full length · 30-second previews",
        tint: C.paletteFor(id)[0],
        actions: html`${playButton(ids, item.title)}
          ${ids.length > 1 ? playButton(ids, item.title, { label: "Shuffle", shuffle: true, primary: false }) : ""}
          ${addAllButton(ids)}${shareButton}`
      })}
      ${trackList({ id: "album", ids, source: item.title, variant: album ? "album" : "default", ctx: ctx.track })}
      ${moreFromArtist(artist.id, id)}
      ${sameGenre(genre, id)}`
  };
}

export function renderArtist(ctx, id) {
  const artist = C.getArtist(id);
  if (!artist) return notFound("artist");
  const songs = C.songsOfArtist(id);
  const ids = songs.map((s) => s.id);
  const top = C.topSongsOfArtist(id, 5).map((s) => s.id);
  const following = ctx.library.isFollowing(id);
  const cover = C.getAlbum(artist.cover) || C.getSingle(artist.cover);

  return {
    title: artist.name,
    html: html`${hero({
        art: html`<figure class="artist-figure">${artistArt(id, { size: 600, eager: true, alt: "" })}
          <figcaption>Artwork from ${cover ? cover.title : "their catalogue"}</figcaption></figure>`,
        kicker: html`Artist · ${genreLink(artist.genre)}`,
        title: artist.name,
        meta: plural(songs.length, "song") + " in the WaveMusic catalogue",
        tint: C.paletteFor(id)[0],
        actions: html`${playButton(top, artist.name, { label: "Play top songs" })}
          ${ids.length > 1 ? playButton(ids, artist.name, { label: "Shuffle all", shuffle: true, primary: false }) : ""}
          <button class="btn follow-btn${following ? " is-on" : ""}" type="button" data-action="follow" data-id="${id}"
            aria-pressed="${following ? "true" : "false"}">${ico(following ? "check" : "plus")}<span>${following ? "Following" : "Follow"}</span></button>
          ${artist.url
            ? html`<a class="btn" href="${artist.url}" target="_blank" rel="noopener noreferrer">${ico("externalLink")}<span>Apple Music</span></a>`
            : ""}`
      })}
      <section class="section" aria-labelledby="artist-top">
        ${sectionHead("Popular", { id: "artist-top", kicker: "Ranked by the WaveMusic chart" })}
        ${trackList({ id: "artist-top", ids: top, source: artist.name, ctx: ctx.track })}
      </section>
      ${moreFromArtist(id, null)}
      <section class="section" aria-labelledby="artist-similar">
        ${sectionHead("If you like " + artist.name, { id: "artist-similar", kicker: "Same genre first" })}
        ${artistIndex(C.similarArtists(id, 8), "Similar artists")}
      </section>`
  };
}

export function renderCollection(ctx, id) {
  const collection = C.getCollection(id);
  if (!collection) return notFound("collection");
  const songs = collection.tracks.map(C.getSong).filter(Boolean);
  const ids = songs.map((s) => s.id);
  return {
    title: collection.title,
    html: html`${hero({
        art: collectionArt(id, { size: 600, eager: true, alt: "" }),
        kicker: collection.kind === "mix" ? "Mix" : "Collection",
        title: collection.title,
        description: collection.description,
        meta: "Curated by WaveMusic · " + plural(songs.length, "song") + " · " + totalLength(songs),
        tint: C.paletteFor(id)[0],
        actions: html`${playButton(ids, collection.title)}
          ${playButton(ids, collection.title, { label: "Shuffle", shuffle: true, primary: false })}
          <button class="btn" type="button" data-action="copy-collection" data-id="${id}">${ico("plus")}<span>Save as playlist</span></button>
          ${shareButton}`
      })}
      ${trackList({ id: "collection", ids, source: collection.title, ctx: ctx.track })}`
  };
}
