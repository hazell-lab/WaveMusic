import { test } from "node:test";
import assert from "node:assert/strict";
import * as Q from "../js/player/queue.js";
import { seeded } from "./helpers.js";

const ids = (q) => q.entries.map((e) => e.id);

test("createQueue clamps the start index and ignores bad ids", () => {
  const q = Q.createQueue([1, "x", 2, 3], 9);
  assert.deepEqual(ids(q), [1, 2, 3]);
  assert.equal(q.index, 2);
  assert.equal(Q.createQueue([]).index, -1);
});

test("stepIndex respects repeat modes", () => {
  const q = Q.createQueue([1, 2, 3], 2);
  assert.equal(Q.stepIndex(q, 1, "off"), -1);
  assert.equal(Q.stepIndex(q, 1, "all"), 0);
  assert.equal(Q.stepIndex(Q.jumpTo(q, 0), -1, "off"), -1);
  assert.equal(Q.stepIndex(Q.jumpTo(q, 0), -1, "all"), 2);
  assert.equal(Q.stepIndex(Q.jumpTo(q, 1), 1, "off"), 2);
});

test("shuffle keeps the current track first and restores order when turned off", () => {
  const q = Q.createQueue([1, 2, 3, 4, 5, 6], 2);
  const on = Q.setShuffle(q, true, seeded(7));
  assert.equal(on.index, 0);
  assert.equal(on.entries[0].id, 3);
  assert.deepEqual([...ids(on)].sort(), [1, 2, 3, 4, 5, 6]);
  const moved = Q.jumpTo(on, 3);
  const off = Q.setShuffle(moved, false);
  assert.deepEqual(ids(off), [1, 2, 3, 4, 5, 6]);
  assert.equal(off.entries[off.index].id, on.entries[3].id);
  assert.equal(off.original, null);
});

test("insertNext and append add after the current entry and at the end", () => {
  let q = Q.createQueue([1, 2, 3], 0);
  q = Q.insertNext(q, [9]);
  assert.deepEqual(ids(q), [1, 9, 2, 3]);
  q = Q.append(q, [7]);
  assert.deepEqual(ids(q), [1, 9, 2, 3, 7]);
  assert.equal(q.index, 0);
  const fromEmpty = Q.append(Q.EMPTY_QUEUE, [4, 5]);
  assert.equal(fromEmpty.index, 0);
});

test("insertNext while shuffled also lands in the original order", () => {
  const q = Q.setShuffle(Q.createQueue([1, 2, 3, 4], 1), true, seeded(3));
  const next = Q.insertNext(q, [8]);
  assert.equal(next.entries[1].id, 8);
  const off = Q.setShuffle(next, false);
  assert.deepEqual(ids(off), [1, 2, 8, 3, 4]);
});

test("duplicates stay distinct entries", () => {
  const q = Q.createQueue([5, 5, 5], 0);
  assert.equal(new Set(q.entries.map((e) => e.key)).size, 3);
  const removed = Q.removeKey(q, q.entries[2].key);
  assert.deepEqual(ids(removed), [5, 5]);
});

test("removeKey keeps the current entry selected and refuses to remove it", () => {
  const q = Q.createQueue([1, 2, 3, 4], 2);
  const before = Q.removeKey(q, q.entries[0].key);
  assert.deepEqual(ids(before), [2, 3, 4]);
  assert.equal(before.entries[before.index].id, 3);
  assert.equal(Q.removeKey(q, q.entries[2].key), q);
});

test("moveKey reorders and follows the current entry", () => {
  const q = Q.createQueue([1, 2, 3, 4], 1);
  const moved = Q.moveKey(q, q.entries[3].key, 0);
  assert.deepEqual(ids(moved), [4, 1, 2, 3]);
  assert.equal(moved.entries[moved.index].id, 2);
});

test("clearUpNext drops upcoming entries only", () => {
  const q = Q.createQueue([1, 2, 3, 4], 1);
  const cleared = Q.clearUpNext(q);
  assert.deepEqual(ids(cleared), [1, 2]);
  assert.deepEqual(Q.upNext(cleared), []);
});

test("serialize and deserialize round trip, including shuffle", () => {
  const q = Q.setShuffle(Q.createQueue([1, 2, 3, 4], 2), true, seeded(5));
  const back = Q.deserialize(JSON.parse(JSON.stringify(Q.serialize(q))));
  assert.deepEqual(ids(back), ids(q));
  assert.equal(back.index, q.index);
  assert.deepEqual(back.original.map((e) => e.id), q.original.map((e) => e.id));
  assert.equal(Q.deserialize({ ids: [1, 99] }, (id) => id < 50).entries.length, 0);
  assert.equal(Q.deserialize(null).index, -1);
});
