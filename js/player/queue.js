// pure queue operations. a queue is { entries, index, original }:
//   entries  - play order, each { key, id } so duplicates stay distinct
//   index    - position of the current entry, or -1
//   original - the unshuffled entries while shuffle is on, otherwise null
// every function returns a new queue and never mutates its input.

let nextKey = 1;
const makeEntry = (id) => ({ key: "q" + nextKey++, id: Number(id) });

export const EMPTY_QUEUE = Object.freeze({ entries: [], index: -1, original: null });

// fisher-yates on a copy
export function shuffled(list, random = Math.random) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function createQueue(ids, startIndex = 0, { shuffle = false, random } = {}) {
  const entries = (ids || []).filter((id) => Number.isFinite(Number(id))).map(makeEntry);
  if (!entries.length) return EMPTY_QUEUE;
  const index = Math.max(0, Math.min(startIndex, entries.length - 1));
  const queue = { entries, index, original: null };
  return shuffle ? setShuffle(queue, true, random) : queue;
}

export const currentEntry = (q) => (q.index >= 0 ? q.entries[q.index] || null : null);
export const upNext = (q) => q.entries.slice(q.index + 1);

// shuffle on: the current entry stays first, everything else is shuffled.
// shuffle off: the original order comes back with the current entry selected.
export function setShuffle(q, on, random = Math.random) {
  if (!q.entries.length) return q;
  const current = currentEntry(q);
  if (on) {
    if (q.original) return q;
    const rest = q.entries.filter((e) => e !== current);
    const entries = current ? [current, ...shuffled(rest, random)] : shuffled(rest, random);
    return { entries, index: current ? 0 : -1, original: q.entries };
  }
  if (!q.original) return q;
  const index = current ? q.original.indexOf(current) : -1;
  return { entries: q.original, index, original: null };
}

// next (+1) or previous (-1) position, or -1 when the queue runs out
export function stepIndex(q, direction, repeat = "off") {
  const total = q.entries.length;
  if (!total) return -1;
  const next = q.index + direction;
  if (next >= 0 && next < total) return next;
  if (repeat === "all") return next < 0 ? total - 1 : 0;
  return -1;
}

export function jumpTo(q, index) {
  if (index < 0 || index >= q.entries.length) return q;
  return { ...q, index };
}

export function jumpToKey(q, key) {
  return jumpTo(q, q.entries.findIndex((e) => e.key === key));
}

// insert songs straight after the current entry
export function insertNext(q, ids) {
  const added = ids.map(makeEntry);
  if (!q.entries.length) return { entries: added, index: added.length ? 0 : -1, original: null };
  const at = q.index + 1;
  const entries = [...q.entries.slice(0, at), ...added, ...q.entries.slice(at)];
  let original = q.original;
  if (original) {
    const cur = currentEntry(q);
    const oAt = cur ? original.indexOf(cur) + 1 : original.length;
    original = [...original.slice(0, oAt), ...added, ...original.slice(oAt)];
  }
  return { entries, index: q.index, original };
}

// add songs to the end
export function append(q, ids) {
  const added = ids.map(makeEntry);
  if (!q.entries.length) return { entries: added, index: added.length ? 0 : -1, original: null };
  return {
    entries: [...q.entries, ...added],
    index: q.index,
    original: q.original ? [...q.original, ...added] : null
  };
}

// remove one entry. removing the current entry is not allowed here, the
// player skips away from it first.
export function removeKey(q, key) {
  const at = q.entries.findIndex((e) => e.key === key);
  if (at === -1 || at === q.index) return q;
  const entries = q.entries.filter((e) => e.key !== key);
  const index = at < q.index ? q.index - 1 : q.index;
  const original = q.original ? q.original.filter((e) => e.key !== key) : null;
  return { entries, index, original };
}

// move an entry to a new position in play order
export function moveKey(q, key, toIndex) {
  const from = q.entries.findIndex((e) => e.key === key);
  if (from === -1) return q;
  const to = Math.max(0, Math.min(toIndex, q.entries.length - 1));
  if (from === to) return q;
  const entries = q.entries.slice();
  const [moved] = entries.splice(from, 1);
  entries.splice(to, 0, moved);
  const current = currentEntry(q);
  return { entries, index: entries.indexOf(current), original: q.original };
}

// drop everything after the current entry
export function clearUpNext(q) {
  if (!q.entries.length) return q;
  const kept = q.entries.slice(0, q.index + 1);
  const keep = new Set(kept);
  return { entries: kept, index: q.index, original: q.original ? q.original.filter((e) => keep.has(e)) : null };
}

// plain data for local storage, and back
export function serialize(q) {
  return {
    ids: q.entries.map((e) => e.id),
    index: q.index,
    original: q.original ? q.original.map((e) => q.entries.indexOf(e)) : null
  };
}

export function deserialize(data, isValidId = () => true) {
  if (!data || !Array.isArray(data.ids) || !data.ids.length) return EMPTY_QUEUE;
  if (!data.ids.every(isValidId)) return EMPTY_QUEUE;
  const entries = data.ids.map(makeEntry);
  const index = Number.isInteger(data.index) && data.index >= 0 && data.index < entries.length ? data.index : 0;
  let original = null;
  if (Array.isArray(data.original) && data.original.length === entries.length) {
    const mapped = data.original.map((i) => entries[i]);
    if (mapped.every(Boolean) && new Set(mapped).size === entries.length) original = mapped;
  }
  return { entries, index, original };
}
