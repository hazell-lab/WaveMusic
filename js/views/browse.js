// browse and search. the form stays in place while typing; only the results
// region re-renders, so focus and the caret are never lost.

import { html, raw } from "../core/dom.js";
import { plural } from "../core/format.js";
import * as C from "../data/catalogue.js";
import { search } from "../search/search.js";
import { trackList } from "../ui/track-list.js";
import { sectionHead, albumTile, singleTile, collectionTile, artistTile, emptyState, artistIndex, playButton, ico } from "./parts.js";

const TYPES = [
  ["all", "Everything"],
  ["songs", "Songs"],
  ["albums", "Albums"],
  ["artists", "Artists"],
  ["collections", "Collections"]
];

// remembered between visits to the page
export const browseState = { query: "", type: "all" };

const catalogue = {
  songs: C.SONGS,
  albums: C.ALBUMS.concat(C.SINGLES.map((s) => ({ ...s, genre: C.getSong(s.song).genre, isSingle: true }))),
  artists: C.ARTISTS,
  collections: C.COLLECTIONS,
  artistName: C.artistName,
  albumTitle: C.albumTitle,
  artistNameById: (id) => (C.getArtist(id) || {}).name || ""
};

function radios(name, options, current, label) {
  return html`<fieldset class="segmented">
    <legend class="sr-only">${label}</legend>
    ${options.map(
      ([value, text]) => html`<label class="segment">
        <input type="radio" name="${name}" value="${value}"${value === current ? raw(" checked") : ""}>
        <span>${text}</span>
      </label>`
    )}
  </fieldset>`;
}

function genreGrid() {
  return html`<ul class="genres">${C.GENRES.map((g) => {
    const count = C.songsOfGenre(g.genre).length;
    return html`<li><a class="genre" href="#category/${g.id}" style="--genre:${C.PALETTES[g.id][0]}">
      <span class="genre-name">${g.title}</span>
      <span class="genre-count">${plural(count, "song")}</span>
    </a></li>`;
  })}</ul>`;
}

export function renderResults(ctx, genreId) {
  const genre = C.getGenre(genreId);
  const query = browseState.query;
  const result = search(catalogue, query, { type: browseState.type, genre: genre ? genre.genre : "" });

  if (!query.trim() && !genre) {
    return {
      summary: "",
      html: html`<section class="section" aria-labelledby="browse-genres">
          ${sectionHead("Genres", { id: "browse-genres", kicker: "Start somewhere" })}
          ${genreGrid()}
        </section>
        <section class="section" aria-labelledby="browse-artists">
          ${sectionHead("Every artist", { id: "browse-artists", kicker: "A to Z" })}
          ${artistIndex(C.ARTISTS.slice().sort((a, b) => a.name.localeCompare(b.name)))}
        </section>`
    };
  }

  const scope = genre ? " in " + genre.title : "";
  if (!result.total) {
    return {
      summary: query.trim() ? "No results for " + query.trim() + scope : "Nothing" + scope + " for this filter",
      html: emptyState({
        title: query.trim() ? "No matches for “" + query.trim() + "”" + scope + "." : "Nothing" + scope + " matches this filter.",
        text: "Check the spelling, try fewer words, or widen the filters. Search covers song titles, artists, albums, genres and collections.",
        action: html`<button class="btn" type="button" data-action="reset-browse">${ico("close")}<span>Clear search and filters</span></button>`
      })
    };
  }

  const summary = plural(result.total, "result") + (query.trim() ? " for “" + query.trim() + "”" : "") + scope;
  const songIds = result.songs.map((s) => s.id);
  const parts = [];

  if (result.songs.length) {
    parts.push(html`<section class="section" aria-labelledby="results-songs">
      ${sectionHead("Songs", {
        id: "results-songs",
        kicker: plural(result.songs.length, "track"),
        action: playButton(songIds, genre && !query.trim() ? genre.title : "Search results", { label: "Play these", primary: false })
      })}
      ${trackList({ id: "results-songs", ids: songIds, source: genre && !query.trim() ? genre.title : "Search: " + query.trim(), ctx: ctx.track })}
    </section>`);
  }
  if (result.artists.length) {
    parts.push(html`<section class="section" aria-labelledby="results-artists">
      ${sectionHead("Artists", { id: "results-artists" })}
      <div class="wall wall-small">${result.artists.map(artistTile)}</div>
    </section>`);
  }
  if (result.albums.length) {
    parts.push(html`<section class="section" aria-labelledby="results-albums">
      ${sectionHead("Albums and singles", { id: "results-albums" })}
      <div class="wall wall-small">${result.albums.map((a) => (a.isSingle ? singleTile(C.getSingle(a.id)) : albumTile(a)))}</div>
    </section>`);
  }
  if (result.collections.length) {
    parts.push(html`<section class="section" aria-labelledby="results-collections">
      ${sectionHead("Collections", { id: "results-collections" })}
      <div class="wall wall-small">${result.collections.map(collectionTile)}</div>
    </section>`);
  }
  return { summary, html: html`${parts}` };
}

export function render(ctx, genreId = "") {
  const genre = C.getGenre(genreId);
  const genreOptions = [["", "All genres"], ...C.GENRES.map((g) => [g.id, g.title])];
  const results = renderResults(ctx, genre ? genre.id : "");

  return {
    title: genre ? genre.title : "Browse",
    html: html`<header class="page-head">
        <p class="kicker">${genre ? "Genre" : "Search the catalogue"}</p>
        <h1 class="page-title" tabindex="-1" data-focus-target>${genre ? genre.title : "Browse"}</h1>
        ${genre ? html`<p class="page-sub">${plural(C.songsOfGenre(genre.genre).length, "song")}, ${plural(C.ARTISTS.filter((a) => a.genre === genre.genre).length, "artist")}</p>` : ""}
      </header>

      <form class="browse-form" role="search" data-action="submit-search" id="browse-form">
        <label class="sr-only" for="search-input">Search songs, artists, albums and collections</label>
        <div class="browse-input">
          ${ico("search")}
          <input id="search-input" type="search" value="${browseState.query}" placeholder="Search by song, artist, album or mood"
            autocomplete="off" spellcheck="false" aria-describedby="browse-summary">
          <button class="icon-btn browse-clear" type="button" data-action="clear-search" aria-label="Clear search"${
            browseState.query ? "" : raw(" hidden")
          }>${ico("close")}</button>
        </div>
        <div class="browse-filters">
          ${radios("type", TYPES, browseState.type, "Result type")}
          ${radios("genre", genreOptions, genre ? genre.id : "", "Genre")}
        </div>
      </form>

      <p class="browse-summary" id="browse-summary" role="status" aria-live="polite">${results.summary}</p>
      <div class="browse-results" id="browse-results">${results.html}</div>`
  };
}
