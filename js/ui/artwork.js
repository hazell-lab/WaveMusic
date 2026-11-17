// artwork markup. apple artwork arrives after the catalogue loads, so covers
// render as a tinted block first and get their image when it is known.

import { html, raw } from "../core/dom.js";
import { artworkFor } from "../data/apple.js";
import { getArtist, getSong, paletteFor } from "../data/catalogue.js";

export const DEFAULT_COVER = "assets/images/default-cover.svg";
export const collectionCover = (id) => "assets/playlists/" + id + "/cover.svg";

const RETRIES = 2;

function img({ src, alt, size, eager, coverKey }) {
  const loading = eager ? "eager" : "lazy";
  const priority = eager ? raw(' fetchpriority="high"') : "";
  const data = coverKey ? html` data-art-cover="${coverKey}" data-art-size="${size}"` : "";
  if (!src) {
    return html`<img alt="${alt}" width="${size}" height="${size}" loading="${loading}" decoding="async"${data} hidden>`;
  }
  return html`<img src="${src}" alt="${alt}" width="${size}" height="${size}" loading="${loading}" decoding="async"${priority}${data}>`;
}

// cover for an album or single key
export function coverArt(coverKey, { size = 300, alt = "", eager = false, className = "" } = {}) {
  const tint = paletteFor(coverKey)[0];
  return html`<span class="art ${className}" style="--art-tint:${tint}">${img({
    src: artworkFor(coverKey, size),
    alt,
    size,
    eager,
    coverKey
  })}</span>`;
}

export const songArt = (songId, options) => coverArt((getSong(songId) || {}).cover || "brand", options);

export function artistArt(artistId, options) {
  const artist = getArtist(artistId);
  return coverArt(artist ? artist.cover : "brand", options);
}

export function collectionArt(id, { size = 300, alt = "", eager = false, className = "" } = {}) {
  const tint = paletteFor(id)[1];
  return html`<span class="art ${className}" style="--art-tint:${tint}">${img({
    src: collectionCover(id),
    alt,
    size,
    eager
  })}</span>`;
}

// a 2x2 mosaic from the first distinct covers of a user playlist
export function mosaicArt(songIds, { size = 300, className = "" } = {}) {
  const covers = [...new Set(songIds.map((id) => (getSong(id) || {}).cover).filter(Boolean))].slice(0, 4);
  if (!covers.length) {
    return html`<span class="art art-empty ${className}" style="--art-tint:#2b2824"><span class="art-glyph">${raw(
      '<svg class="ico" aria-hidden="true"><use href="#i-music"></use></svg>'
    )}</span></span>`;
  }
  if (covers.length < 4) return coverArt(covers[0], { size, className });
  const half = Math.round(size / 2);
  return html`<span class="art art-mosaic ${className}" style="--art-tint:${paletteFor(covers[0])[0]}">${covers.map(
    (key) => html`<span class="art-tile" style="--art-tint:${paletteFor(key)[0]}">${img({
      src: artworkFor(key, half),
      alt: "",
      size: half,
      coverKey: key
    })}</span>`
  )}</span>`;
}

// fill in apple artwork that was not known when the markup was built
export function hydrateArtwork(root) {
  root.querySelectorAll("img[data-art-cover]").forEach((el) => {
    if (el.getAttribute("src")) return;
    const url = artworkFor(el.dataset.artCover, Number(el.dataset.artSize) || 300);
    if (!url) return;
    el.src = url;
    el.hidden = false;
  });
}

// fade images in when they load, retry flaky cdn requests, then give up
// gracefully and leave the tinted block. listeners run in the capture phase
// because load and error events do not bubble.
export function watchImages(root) {
  root.addEventListener(
    "load",
    (event) => {
      const el = event.target;
      if (el.tagName === "IMG") el.classList.add("is-loaded");
    },
    true
  );
  root.addEventListener(
    "error",
    (event) => {
      const el = event.target;
      if (el.tagName !== "IMG") return;
      const src = el.getAttribute("src") || "";
      const tries = Number(el.dataset.retries || 0);
      if (/^https?:/.test(src) && tries < RETRIES) {
        el.dataset.retries = String(tries + 1);
        setTimeout(() => {
          if (el.isConnected && el.getAttribute("src") === src) {
            el.removeAttribute("src");
            el.setAttribute("src", src);
          }
        }, 700 * (tries + 1));
        return;
      }
      el.classList.add("is-broken");
    },
    true
  );
}
