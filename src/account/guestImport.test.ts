import { test } from 'node:test';
import assert from 'node:assert/strict';
import { remainingGuestCollection, validGuestImport } from './guestImport';
import { emptyCollection } from '../ocean/collection';
import { fishCatalog } from '../ocean/catalog';
import { emptyPlant } from '../garden/plantings';
const id = fishCatalog[0].id, second = fishCatalog[1].id;
const plant = { ...emptyPlant(), id: 'private-flower', createdAt: 1 };
const batch = { id: 'guest-import-1234', ocean: { ...emptyCollection(), fish: { [id]: 2 }, opened: 2, lastCatch: id }, plants: [plant] };
test('acknowledged imports leave catches and drafts added in another tab intact', () => {
  const current = { ...batch.ocean, fish: { [id]: 3, [second]: 1 }, opened: 4, lastCatch: second };
  const edited = { ...plant, note: 'Edited during sign-in' };
  const result = remainingGuestCollection(batch, current, [edited]);
  assert.deepEqual(result.ocean.fish, { [id]: 1, [second]: 1 });
  assert.equal(result.ocean.opened, 2);
  assert.equal(result.ocean.lastCatch, second);
  assert.deepEqual(result.plants, [edited]);
});
test('a completed import clears its guest copies without invalid last-catch metadata', () => {
  const result = remainingGuestCollection(batch, batch.ocean, batch.plants);
  assert.deepEqual(result.ocean, emptyCollection()); assert.deepEqual(result.plants, []);
});
test('malformed saved import records are rejected before being sent', () => {
  assert.equal(validGuestImport(batch), true);
  assert.equal(validGuestImport({ id: 'x', ocean: {}, plants: [] }), false);
  assert.equal(validGuestImport({ ...batch, plants: [{}] }), false);
});
