import test from 'node:test';
import assert from 'node:assert/strict';
import { makeLeadQueue, takeLeadBatch } from '../src/utils/leadRotation.ts';

test('all matches are shown once, including a shorter final batch', () => {
  const all = Array.from({ length: 23 }, (_, id) => ({ id }));
  const initial = makeLeadQueue(all, 10, () => 0.5);
  const second = takeLeadBatch(initial.remaining, 10);
  const last = takeLeadBatch(second.remaining, 10);
  assert.equal(initial.first.length, 10);
  assert.equal(second.places.length, 10);
  assert.equal(last.places.length, 3);
  assert.equal(last.remaining.length, 0);
  assert.equal(new Set([...initial.first, ...second.places, ...last.places].map((item) => item.id)).size, all.length);
});
