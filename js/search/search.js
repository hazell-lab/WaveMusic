// catalogue search: accent and case insensitive, every word must match.
// pure functions so they can be tested without a browser.

export function normalize(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9&÷+#]+/g, " ")
    .trim();
}

export const tokenize = (query) => normalize(query).split(" ").filter(Boolean);

// score one item. fields are ordered by importance, so a title match beats
// an artist match. returns 0 when a word matches nowhere.
export function scoreFields(tokens, fields) {
  if (!tokens.length) return 0;
  const haystacks = fields.map(normalize);
  let score = 0;
  for (const token of tokens) {
    let best = 0;
    haystacks.forEach((hay, i) => {
      if (!hay) return;
      const weight = fields.length - i;
      if (hay === token) best = Math.max(best, weight * 4);
      else if (hay.startsWith(token)) best = Math.max(best, weight * 3);
      else if (hay.split(" ").some((word) => word.startsWith(token))) best = Math.max(best, weight * 2);
      else if (hay.includes(token)) best = Math.max(best, weight);
    });
    if (!best) return 0;
    score += best;
  }
  return score;
}

function rank(items, tokens, fieldsOf, limit) {
  return items
    .map((item, order) => ({ item, order, score: scoreFields(tokens, fieldsOf(item)) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, limit)
    .map((x) => x.item);
}

// catalogue: { songs, albums, artists, collections, artistName(song), albumTitle(song), artistNameById(id) }
// options: { type: all|songs|albums|artists|collections, genre: "Pop" | "" }
export function search(catalogue, query, { type = "all", genre = "" } = {}) {
  const tokens = tokenize(query);
  const byGenre = (g) => !genre || g === genre;
  const wants = (t) => type === "all" || type === t;
  const empty = { songs: [], albums: [], artists: [], collections: [], total: 0, tokens };

  // a genre filter alone (no words) lists everything in that genre
  if (!tokens.length && !genre) return empty;

  const pick = (items, fieldsOf, limit) =>
    tokens.length ? rank(items, tokens, fieldsOf, limit) : items.slice(0, limit);

  const songs = wants("songs")
    ? pick(catalogue.songs.filter((s) => byGenre(s.genre)), (s) => [s.title, catalogue.artistName(s), catalogue.albumTitle(s), s.genre], 50)
    : [];
  const albums = wants("albums")
    ? pick(catalogue.albums.filter((a) => byGenre(a.genre)), (a) => [a.title, catalogue.artistNameById(a.artist), a.genre, String(a.year)], 24)
    : [];
  const artists = wants("artists")
    ? pick(catalogue.artists.filter((a) => byGenre(a.genre)), (a) => [a.name, a.genre], 24)
    : [];
  const collections = wants("collections") && !genre
    ? pick(catalogue.collections, (c) => [c.title, c.description], 12)
    : [];

  return {
    songs,
    albums,
    artists,
    collections,
    total: songs.length + albums.length + artists.length + collections.length,
    tokens
  };
}
